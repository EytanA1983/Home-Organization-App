"""
Middleware for metrics and observability
"""
import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.metrics import (
    REQUEST_COUNT,
    REQUEST_LATENCY,
    ERROR_COUNT,
    ACTIVE_REQUESTS,
    record_database_query,
)
from app.core.logging import logger


class MetricsMiddleware(BaseHTTPMiddleware):
    """
    Middleware to record custom metrics
    """

    async def dispatch(self, request: Request, call_next):
        # Get endpoint path (without query params)
        endpoint = request.url.path
        method = request.method

        # Increment active requests
        ACTIVE_REQUESTS.labels(method=method, endpoint=endpoint).inc()

        # Start timer
        start_time = time.time()

        try:
            # Process request
            response = await call_next(request)
            status_code = response.status_code

            # Calculate duration
            duration = time.time() - start_time

            # Record metrics
            REQUEST_COUNT.labels(
                method=method, endpoint=endpoint, status_code=status_code
            ).inc()

            REQUEST_LATENCY.labels(method=method, endpoint=endpoint).observe(duration)

            # Record errors
            if status_code >= 400:
                ERROR_COUNT.labels(
                    method=method, endpoint=endpoint, status_code=status_code
                ).inc()

            return response

        except Exception as e:
            # Record error
            ERROR_COUNT.labels(
                method=method, endpoint=endpoint, status_code=500
            ).inc()
            logger.error(f"Request failed: {e}", exc_info=True)
            raise

        finally:
            # Decrement active requests
            ACTIVE_REQUESTS.labels(method=method, endpoint=endpoint).dec()
