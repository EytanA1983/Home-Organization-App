"""
Health Check & Readiness Probes for Docker/Kubernetes

Endpoints:
- /health - Basic health check (always returns 200 if app is running)
- /live - Liveness probe (app is alive and responsive)
- /ready - Readiness probe (app is ready to serve traffic - checks DB, Redis)
- /health/detailed - Detailed health status of all dependencies
"""
from datetime import datetime
from typing import Dict, Any, Optional
import time
from enum import Enum

from fastapi import APIRouter, status, Response
from pydantic import BaseModel

from app.core.logging import logger
from app.config import settings

router = APIRouter(tags=["health"])


class HealthStatus(str, Enum):
    """Health status values"""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"


class ComponentHealth(BaseModel):
    """Health status of a single component"""
    status: HealthStatus
    latency_ms: Optional[float] = None
    message: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class HealthResponse(BaseModel):
    """Health check response"""
    status: HealthStatus
    timestamp: str
    version: str = "1.0.0"
    uptime_seconds: Optional[float] = None


class DetailedHealthResponse(HealthResponse):
    """Detailed health check response with component statuses"""
    components: Dict[str, ComponentHealth]


# Track application start time for uptime calculation
_app_start_time = time.time()


def check_database_health() -> ComponentHealth:
    """Check database connectivity and health"""
    start = time.time()
    try:
        from sqlalchemy import text
        from app.db.session import SessionLocal

        db = SessionLocal()
        try:
            # Execute simple query to verify connection
            db.execute(text("SELECT 1"))
            latency = (time.time() - start) * 1000

            return ComponentHealth(
                status=HealthStatus.HEALTHY,
                latency_ms=round(latency, 2),
                message="Database connection successful"
            )
        finally:
            db.close()

    except Exception as e:
        latency = (time.time() - start) * 1000
        logger.error(f"Database health check failed: {e}")
        return ComponentHealth(
            status=HealthStatus.UNHEALTHY,
            latency_ms=round(latency, 2),
            message=f"Database connection failed: {type(e).__name__}",
            details={"error": str(e)}
        )


def check_redis_health() -> ComponentHealth:
    """Check Redis connectivity and health"""
    start = time.time()
    try:
        import redis

        # Parse Redis URL
        redis_url = settings.REDIS_URL

        # Try to connect
        r = redis.from_url(redis_url, socket_timeout=5)

        # Ping Redis
        r.ping()

        # Get some info
        info = r.info("server")
        latency = (time.time() - start) * 1000

        return ComponentHealth(
            status=HealthStatus.HEALTHY,
            latency_ms=round(latency, 2),
            message="Redis connection successful",
            details={
                "redis_version": info.get("redis_version"),
                "connected_clients": r.info("clients").get("connected_clients"),
            }
        )

    except ImportError:
        return ComponentHealth(
            status=HealthStatus.DEGRADED,
            message="Redis client not installed"
        )
    except Exception as e:
        latency = (time.time() - start) * 1000

        # Try localhost fallback
        try:
            if "redis://redis:" in settings.REDIS_URL:
                fallback_url = settings.REDIS_URL.replace("redis://redis:", "redis://localhost:")
                r = redis.from_url(fallback_url, socket_timeout=5)
                r.ping()
                latency = (time.time() - start) * 1000
                return ComponentHealth(
                    status=HealthStatus.HEALTHY,
                    latency_ms=round(latency, 2),
                    message="Redis connection successful (localhost fallback)"
                )
        except Exception:
            pass

        logger.warning(f"Redis health check failed: {e}")
        return ComponentHealth(
            status=HealthStatus.DEGRADED,
            latency_ms=round(latency, 2),
            message=f"Redis connection failed: {type(e).__name__}",
            details={"error": str(e)}
        )


def check_celery_health() -> ComponentHealth:
    """Check Celery worker availability"""
    try:
        from app.workers.celery_app import celery

        # Check if any workers are registered
        inspector = celery.control.inspect(timeout=2)
        active_workers = inspector.active()

        if active_workers:
            worker_count = len(active_workers)
            return ComponentHealth(
                status=HealthStatus.HEALTHY,
                message=f"{worker_count} Celery worker(s) active",
                details={"workers": list(active_workers.keys())}
            )
        else:
            return ComponentHealth(
                status=HealthStatus.DEGRADED,
                message="No Celery workers detected"
            )

    except ImportError:
        return ComponentHealth(
            status=HealthStatus.DEGRADED,
            message="Celery not configured"
        )
    except Exception as e:
        return ComponentHealth(
            status=HealthStatus.DEGRADED,
            message=f"Celery check failed: {type(e).__name__}",
            details={"error": str(e)}
        )


def check_cache_health() -> ComponentHealth:
    """Check cache (Redis) health for caching purposes"""
    if not settings.CACHE_ENABLED:
        return ComponentHealth(
            status=HealthStatus.HEALTHY,
            message="Cache disabled by configuration"
        )

    try:
        from app.core.cache import get_redis_client

        client = get_redis_client()
        if client:
            start = time.time()
            client.ping()
            latency = (time.time() - start) * 1000

            return ComponentHealth(
                status=HealthStatus.HEALTHY,
                latency_ms=round(latency, 2),
                message="Cache available"
            )
        else:
            return ComponentHealth(
                status=HealthStatus.DEGRADED,
                message="Cache not available"
            )

    except Exception as e:
        return ComponentHealth(
            status=HealthStatus.DEGRADED,
            message=f"Cache check failed: {str(e)}"
        )


def get_overall_status(components: Dict[str, ComponentHealth]) -> HealthStatus:
    """Determine overall health status from component statuses"""
    statuses = [c.status for c in components.values()]

    if all(s == HealthStatus.HEALTHY for s in statuses):
        return HealthStatus.HEALTHY
    elif any(s == HealthStatus.UNHEALTHY for s in statuses):
        return HealthStatus.UNHEALTHY
    else:
        return HealthStatus.DEGRADED


# ================== Endpoints ==================

@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Basic health check",
    description="Returns 200 if the application is running. Used for basic container health checks."
)
def health_check():
    """
    Basic health check - always returns 200 if app is running.
    Use this for Docker HEALTHCHECK or basic monitoring.
    """
    return HealthResponse(
        status=HealthStatus.HEALTHY,
        timestamp=datetime.utcnow().isoformat() + "Z",
        uptime_seconds=round(time.time() - _app_start_time, 2)
    )


@router.get(
    "/live",
    response_model=HealthResponse,
    summary="Liveness probe",
    description="Kubernetes liveness probe - returns 200 if app is alive."
)
def liveness_probe():
    """
    Liveness probe for Kubernetes.
    Returns 200 if the application is alive and responsive.
    If this fails, Kubernetes will restart the container.
    """
    return HealthResponse(
        status=HealthStatus.HEALTHY,
        timestamp=datetime.utcnow().isoformat() + "Z",
        uptime_seconds=round(time.time() - _app_start_time, 2)
    )


@router.get(
    "/ready",
    response_model=HealthResponse,
    responses={
        200: {"description": "Application is ready to serve traffic"},
        503: {"description": "Application is not ready"}
    },
    summary="Readiness probe",
    description="Kubernetes readiness probe - checks DB and Redis connectivity."
)
def readiness_probe(response: Response):
    """
    Readiness probe for Kubernetes.
    Checks if the application is ready to serve traffic by verifying:
    - Database connectivity
    - Redis connectivity (if configured)

    Returns 503 if any critical dependency is unavailable.
    """
    # Check critical dependencies
    db_health = check_database_health()
    redis_health = check_redis_health()

    # Database is critical - must be healthy
    if db_health.status == HealthStatus.UNHEALTHY:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        logger.warning("Readiness probe failed: Database unhealthy")
        return HealthResponse(
            status=HealthStatus.UNHEALTHY,
            timestamp=datetime.utcnow().isoformat() + "Z"
        )

    # Redis degraded is acceptable (app can work without cache)
    overall_status = HealthStatus.HEALTHY
    if redis_health.status == HealthStatus.UNHEALTHY:
        overall_status = HealthStatus.DEGRADED

    return HealthResponse(
        status=overall_status,
        timestamp=datetime.utcnow().isoformat() + "Z",
        uptime_seconds=round(time.time() - _app_start_time, 2)
    )


@router.get(
    "/health/detailed",
    response_model=DetailedHealthResponse,
    summary="Detailed health check",
    description="Returns detailed health status of all system components."
)
def detailed_health_check(response: Response):
    """
    Detailed health check showing status of all components.
    Useful for debugging and monitoring dashboards.
    """
    components = {
        "database": check_database_health(),
        "redis": check_redis_health(),
        "cache": check_cache_health(),
        "celery": check_celery_health(),
    }

    overall_status = get_overall_status(components)

    # Set response status based on health
    if overall_status == HealthStatus.UNHEALTHY:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return DetailedHealthResponse(
        status=overall_status,
        timestamp=datetime.utcnow().isoformat() + "Z",
        uptime_seconds=round(time.time() - _app_start_time, 2),
        components=components
    )


@router.get(
    "/health/db",
    response_model=ComponentHealth,
    summary="Database health check",
    description="Check database connectivity."
)
def database_health_check(response: Response):
    """Check database health only"""
    health = check_database_health()
    if health.status == HealthStatus.UNHEALTHY:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return health


@router.get(
    "/health/redis",
    response_model=ComponentHealth,
    summary="Redis health check",
    description="Check Redis connectivity."
)
def redis_health_check(response: Response):
    """Check Redis health only"""
    health = check_redis_health()
    if health.status == HealthStatus.UNHEALTHY:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return health


@router.get(
    "/health/secrets",
    summary="Secrets configuration status",
    description="Check secrets management configuration (sources, availability)."
)
def secrets_health_check():
    """
    Check secrets management configuration.
    Shows which secrets backends are available and the source for each secret.
    """
    from app.core.secrets import SecretsInfo
    return SecretsInfo.get_status()
