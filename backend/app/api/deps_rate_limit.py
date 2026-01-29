"""
Dependency functions for rate limiting specific endpoints
"""
from fastapi import Request, HTTPException, status
from app.services.rate_limiter import rate_limiter
from app.config import settings


def check_rate_limit_strict(request: Request, limit_per_minute: int = 10):
    """
    Strict rate limiting dependency for sensitive endpoints
    Usage: @router.post("/endpoint", dependencies=[Depends(check_rate_limit_strict)])
    """
    is_allowed, error_message = rate_limiter.check_rate_limit(
        request,
        limit_per_minute=limit_per_minute,
        limit_per_hour=limit_per_minute * 60
    )
    
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=error_message or "Rate limit exceeded"
        )


def check_rate_limit_moderate(request: Request, limit_per_minute: int = 30):
    """
    Moderate rate limiting dependency
    Usage: @router.post("/endpoint", dependencies=[Depends(check_rate_limit_moderate)])
    """
    is_allowed, error_message = rate_limiter.check_rate_limit(
        request,
        limit_per_minute=limit_per_minute,
        limit_per_hour=limit_per_minute * 60
    )
    
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=error_message or "Rate limit exceeded"
        )
