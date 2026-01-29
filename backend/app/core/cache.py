"""
Redis caching configuration for FastAPI
Simple manual caching that works with sync endpoints
"""
from typing import Optional, Any
import json
import hashlib
from functools import wraps

from app.config import settings
from app.core.logging import logger

# Redis client (lazy initialization)
_redis_client = None

# Cache TTL constants (in seconds)
CACHE_TTL_SHORT = 30      # 30 seconds - for rapidly changing data
CACHE_TTL_MEDIUM = 60     # 1 minute - for rooms, categories
CACHE_TTL_LONG = 120      # 2 minutes - for tasks list
CACHE_TTL_EXTENDED = 300  # 5 minutes - for static-ish data


def get_redis_client():
    """Get or create Redis client (sync version)"""
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    
    try:
        import redis
        redis_url = settings.REDIS_URL
        
        # Try connecting
        try:
            _redis_client = redis.from_url(redis_url, decode_responses=True)
            _redis_client.ping()
            logger.info(f"Redis cache connected: {redis_url}")
        except Exception:
            # Try localhost fallback
            if "redis://redis:" in redis_url:
                redis_url = redis_url.replace("redis://redis:", "redis://localhost:")
                _redis_client = redis.from_url(redis_url, decode_responses=True)
                _redis_client.ping()
                logger.info(f"Redis cache connected (fallback): {redis_url}")
        
        return _redis_client
    except Exception as e:
        logger.warning(f"Redis not available, caching disabled: {e}")
        return None


def make_cache_key(prefix: str, user_id: int, **kwargs) -> str:
    """Build a cache key from prefix, user_id, and optional params"""
    key_parts = [f"eli-maor:{prefix}:user_{user_id}"]
    
    # Add query params to key
    for k, v in sorted(kwargs.items()):
        if v is not None:
            key_parts.append(f"{k}={v}")
    
    return ":".join(key_parts)


def cache_get(key: str) -> Optional[Any]:
    """Get value from cache"""
    client = get_redis_client()
    if not client:
        return None
    
    try:
        data = client.get(key)
        if data:
            logger.debug(f"Cache HIT: {key}")
            return json.loads(data)
        logger.debug(f"Cache MISS: {key}")
        return None
    except Exception as e:
        logger.warning(f"Cache get error: {e}")
        return None


def cache_set(key: str, value: Any, ttl: int = CACHE_TTL_MEDIUM) -> bool:
    """Set value in cache with TTL"""
    client = get_redis_client()
    if not client:
        return False
    
    try:
        client.setex(key, ttl, json.dumps(value, default=str))
        logger.debug(f"Cache SET: {key} (TTL: {ttl}s)")
        return True
    except Exception as e:
        logger.warning(f"Cache set error: {e}")
        return False


def cache_delete_pattern(pattern: str) -> int:
    """Delete all keys matching pattern"""
    client = get_redis_client()
    if not client:
        return 0
    
    try:
        deleted = 0
        for key in client.scan_iter(match=pattern):
            client.delete(key)
            deleted += 1
        if deleted > 0:
            logger.debug(f"Cache invalidated {deleted} keys matching: {pattern}")
        return deleted
    except Exception as e:
        logger.warning(f"Cache delete error: {e}")
        return 0


def invalidate_user_cache(user_id: int, prefixes: list[str] = None):
    """
    Invalidate cache entries for a specific user.
    Call this after CREATE, UPDATE, DELETE operations.
    """
    if prefixes is None:
        prefixes = ["rooms", "tasks", "categories", "todos"]
    
    for prefix in prefixes:
        pattern = f"eli-maor:{prefix}:user_{user_id}*"
        cache_delete_pattern(pattern)


def invalidate_all_cache():
    """Clear all cache entries"""
    cache_delete_pattern("eli-maor:*")


# Async versions for lifespan
async def init_cache():
    """Initialize cache (verify connection)"""
    client = get_redis_client()
    return client is not None


# Decorator for caching (simple version)
def cached(prefix: str, ttl: int = CACHE_TTL_MEDIUM):
    """
    Caching decorator for endpoints.
    Expects the endpoint to have 'current_user' parameter.
    
    Usage:
        @cached("rooms", ttl=60)
        def get_rooms(current_user: User, ...):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Extract user_id from current_user
            current_user = kwargs.get("current_user") or kwargs.get("user")
            if not current_user:
                # No user, skip caching
                return func(*args, **kwargs)
            
            user_id = current_user.id
            
            # Build cache key from relevant params
            cache_params = {}
            for key in ["skip", "limit", "room_id", "category_id", "completed"]:
                if key in kwargs:
                    cache_params[key] = kwargs[key]
            
            cache_key = make_cache_key(prefix, user_id, **cache_params)
            
            # Try to get from cache
            cached_value = cache_get(cache_key)
            if cached_value is not None:
                return cached_value
            
            # Call the actual function
            result = func(*args, **kwargs)
            
            # Convert SQLAlchemy models to dicts for caching
            if hasattr(result, "__iter__") and not isinstance(result, (str, dict)):
                # List of models
                cache_value = [
                    item.to_dict() if hasattr(item, "to_dict") 
                    else (item.__dict__ if hasattr(item, "__dict__") else item)
                    for item in result
                ]
            elif hasattr(result, "to_dict"):
                cache_value = result.to_dict()
            elif hasattr(result, "__dict__"):
                cache_value = {k: v for k, v in result.__dict__.items() if not k.startswith("_")}
            else:
                cache_value = result
            
            # Store in cache
            cache_set(cache_key, cache_value, ttl)
            
            return result
        
        return wrapper
    return decorator
