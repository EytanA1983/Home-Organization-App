"""
Rate Limiting with slowapi
==========================

Uses slowapi (Flask-Limiter port) for per-IP rate limiting.
Integrates with existing Redis-based brute-force protection.
"""
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from app.config import settings
from app.core.logging import logger
import redis


def get_client_ip(request: Request) -> str:
    """
    Extract client IP from request.
    Handles proxies, load balancers, and forwarded headers.
    """
    # Check for forwarded IP (behind proxy/load balancer)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # Take the first IP in the chain
        return forwarded_for.split(",")[0].strip()

    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()

    # Fallback to slowapi's default
    return get_remote_address(request)


# Initialize slowapi Limiter
try:
    # Create Redis connection for slowapi
    redis_client = redis.from_url(
        settings.REDIS_URL,
        decode_responses=True,
        socket_connect_timeout=5,
        socket_timeout=5,
    )
    redis_client.ping()

    limiter = Limiter(
        key_func=get_client_ip,
        storage_uri=settings.REDIS_URL,
        default_limits=[],  # No global limits by default
        headers_enabled=True,  # Enable rate limit headers
        retry_after="x-ratelimit-retry-after",  # Custom header
    )

    logger.info("slowapi rate limiter initialized with Redis")

except Exception as e:
    logger.warning(f"Failed to initialize slowapi with Redis: {e}")
    logger.warning("Falling back to in-memory storage (not recommended for production)")

    # Fallback to in-memory storage (not recommended for production)
    limiter = Limiter(
        key_func=get_client_ip,
        default_limits=[],
        headers_enabled=True,
    )


# Custom rate limit exceeded handler
def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """
    Custom handler for rate limit exceeded errors.
    Returns a JSON response with rate limit information.
    """
    from fastapi.responses import JSONResponse
    from fastapi import status

    response = JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "detail": f"Rate limit exceeded: {exc.detail}",
            "error": "rate_limit_exceeded",
            "retry_after": exc.retry_after if hasattr(exc, 'retry_after') else 60,
        },
        headers={
            "Retry-After": str(exc.retry_after if hasattr(exc, 'retry_after') else 60),
            "X-RateLimit-Limit": str(exc.limit if hasattr(exc, 'limit') else 60),
            "X-RateLimit-Remaining": "0",
        }
    )
    return response


# Rate limit decorators for common use cases
def rate_limit_per_minute(limit: int):
    """
    Decorator for per-minute rate limiting.

    Usage:
        @router.get("/endpoint")
        @rate_limit_per_minute(60)
        def endpoint():
            ...
    """
    return limiter.limit(f"{limit}/minute")


def rate_limit_per_hour(limit: int):
    """
    Decorator for per-hour rate limiting.

    Usage:
        @router.get("/endpoint")
        @rate_limit_per_hour(1000)
        def endpoint():
            ...
    """
    return limiter.limit(f"{limit}/hour")


def rate_limit_per_day(limit: int):
    """
    Decorator for per-day rate limiting.

    Usage:
        @router.get("/endpoint")
        @rate_limit_per_day(10000)
        def endpoint():
            ...
    """
    return limiter.limit(f"{limit}/day")


def rate_limit_custom(limit: str):
    """
    Decorator for custom rate limiting.

    Usage:
        @router.get("/endpoint")
        @rate_limit_custom("10/minute;100/hour")
        def endpoint():
            ...
    """
    return limiter.limit(limit)


# Predefined rate limits for common endpoints
RATE_LIMIT_STRICT = rate_limit_custom("10/minute;100/hour")  # For sensitive endpoints
RATE_LIMIT_MODERATE = rate_limit_custom("30/minute;500/hour")  # For normal endpoints
RATE_LIMIT_LOOSE = rate_limit_custom("60/minute;1000/hour")  # For public endpoints
RATE_LIMIT_AUTH = rate_limit_custom("5/minute;20/hour")  # For authentication endpoints
