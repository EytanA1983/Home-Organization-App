"""
PKCE (Proof Key for Code Exchange) Implementation
=================================================

PKCE is a security extension to OAuth2 that protects against authorization code
interception attacks. It's especially important for mobile apps and SPAs.

RFC 7636: https://tools.ietf.org/html/rfc7636
"""
import secrets
import base64
import hashlib
from typing import Tuple, Optional
from app.core.logging import logger


def generate_code_verifier(length: int = 128) -> str:
    """
    Generate a cryptographically random code_verifier.

    Args:
        length: Length of the verifier (43-128 characters, recommended: 128)

    Returns:
        Base64URL-encoded random string
    """
    # Generate random bytes
    random_bytes = secrets.token_bytes(length)

    # Base64URL encode (without padding)
    verifier = base64.urlsafe_b64encode(random_bytes).decode('utf-8')
    verifier = verifier.rstrip('=')  # Remove padding

    # Ensure it meets length requirements (43-128 chars)
    if len(verifier) < 43:
        # If too short, pad with more random data
        additional = secrets.token_bytes(32)
        verifier += base64.urlsafe_b64encode(additional).decode('utf-8').rstrip('=')

    # Truncate to max 128 chars if needed
    verifier = verifier[:128]

    return verifier


def generate_code_challenge(verifier: str, method: str = "S256") -> str:
    """
    Generate code_challenge from code_verifier.

    Args:
        verifier: The code_verifier string
        method: Challenge method - "S256" (SHA256) or "plain"

    Returns:
        Base64URL-encoded code_challenge
    """
    if method == "S256":
        # SHA256 hash of verifier
        digest = hashlib.sha256(verifier.encode('utf-8')).digest()
        # Base64URL encode (without padding)
        challenge = base64.urlsafe_b64encode(digest).decode('utf-8')
        challenge = challenge.rstrip('=')  # Remove padding
        return challenge
    elif method == "plain":
        # Plain text (not recommended, only for testing)
        return verifier
    else:
        raise ValueError(f"Unsupported challenge method: {method}. Use 'S256' or 'plain'")


def generate_pkce_pair(method: str = "S256") -> Tuple[str, str]:
    """
    Generate both code_verifier and code_challenge.

    Args:
        method: Challenge method - "S256" (recommended) or "plain"

    Returns:
        Tuple of (code_verifier, code_challenge)
    """
    verifier = generate_code_verifier()
    challenge = generate_code_challenge(verifier, method)

    logger.debug(
        "PKCE pair generated",
        extra={
            "method": method,
            "verifier_length": len(verifier),
            "challenge_length": len(challenge)
        }
    )

    return verifier, challenge


def validate_code_verifier(verifier: str, challenge: str, method: str = "S256") -> bool:
    """
    Validate that code_verifier matches code_challenge.

    Args:
        verifier: The code_verifier to validate
        challenge: The code_challenge to match against
        method: Challenge method used

    Returns:
        True if verifier matches challenge
    """
    if method == "S256":
        expected_challenge = generate_code_challenge(verifier, method)
        return expected_challenge == challenge
    elif method == "plain":
        return verifier == challenge
    else:
        raise ValueError(f"Unsupported challenge method: {method}")


# PKCE state storage
# Uses Redis in production, in-memory fallback for development
_pkce_storage: dict[str, dict] = {}
_redis_client = None


def _get_redis_client():
    """Get Redis client for PKCE state storage"""
    global _redis_client
    if _redis_client is None:
        try:
            from app.config import settings
            import redis
            _redis_client = redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
            )
            _redis_client.ping()
            logger.info("PKCE using Redis for state storage")
        except Exception as e:
            logger.warning(f"Redis not available for PKCE storage, using in-memory: {e}")
            _redis_client = False  # Mark as unavailable
    return _redis_client if _redis_client else None


def store_pkce_state(state: str, verifier: str, challenge: str, method: str = "S256", ttl: int = 600) -> None:
    """
    Store PKCE state temporarily (for token exchange).

    Uses Redis in production, in-memory fallback for development.
    TTL: 10 minutes (600 seconds) - enough time for OAuth flow.

    Args:
        state: OAuth state parameter (used as key)
        verifier: code_verifier
        challenge: code_challenge
        method: Challenge method
        ttl: Time to live in seconds (default: 10 minutes)
    """
    redis_client = _get_redis_client()

    pkce_data = {
        "verifier": verifier,
        "challenge": challenge,
        "method": method,
    }

    if redis_client:
        # Use Redis with TTL
        import json
        redis_client.setex(
            f"pkce:state:{state}",
            ttl,
            json.dumps(pkce_data)
        )
        logger.debug(f"PKCE state stored in Redis for state: {state[:8]}... (TTL: {ttl}s)")
    else:
        # Fallback to in-memory storage
        _pkce_storage[state] = pkce_data
        logger.debug(f"PKCE state stored in-memory for state: {state[:8]}...")


def get_pkce_verifier(state: str) -> Optional[str]:
    """
    Retrieve code_verifier by state.

    Args:
        state: OAuth state parameter

    Returns:
        code_verifier or None if not found
    """
    redis_client = _get_redis_client()

    if redis_client:
        # Get from Redis
        try:
            import json
            data = redis_client.get(f"pkce:state:{state}")
            if data:
                pkce_data = json.loads(data)
                return pkce_data.get("verifier")
        except Exception as e:
            logger.error(f"Error retrieving PKCE state from Redis: {e}")
            return None
    else:
        # Get from in-memory storage
        pkce_data = _pkce_storage.get(state)
        if pkce_data:
            return pkce_data.get("verifier")

    return None


def clear_pkce_state(state: str) -> None:
    """
    Clear PKCE state after use.

    Args:
        state: OAuth state parameter
    """
    redis_client = _get_redis_client()

    if redis_client:
        # Delete from Redis
        try:
            redis_client.delete(f"pkce:state:{state}")
            logger.debug(f"PKCE state cleared from Redis for state: {state[:8]}...")
        except Exception as e:
            logger.error(f"Error clearing PKCE state from Redis: {e}")
    else:
        # Delete from in-memory storage
        if state in _pkce_storage:
            del _pkce_storage[state]
            logger.debug(f"PKCE state cleared from memory for state: {state[:8]}...")
