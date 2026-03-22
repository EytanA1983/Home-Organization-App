"""
Prometheus Metrics Configuration
מדדי ביצועים ו-Observability

Features:
- HTTP request metrics (latency, count, errors)
- Database query metrics
- Celery task metrics
- Business metrics (tasks completed, rooms created, etc.)
- Cache metrics
- Custom metrics for specific endpoints

Endpoints:
- /metrics - Prometheus metrics endpoint
"""
import time
from functools import wraps
from typing import Callable, Optional

from prometheus_client import Counter, Histogram, Gauge, Info, Summary
from prometheus_fastapi_instrumentator import Instrumentator, metrics
from prometheus_fastapi_instrumentator.metrics import Info as InstrumentatorInfo
from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.logging import logger


# ==================== Application Info ====================
APP_INFO = Info(
    "app_info",
    "Application information"
)

# ==================== HTTP Metrics ====================
REQUEST_COUNT = Counter(
    "app_http_requests_total",
    "Total number of HTTP requests",
    ["method", "endpoint", "status_code"],
)

REQUEST_LATENCY = Histogram(
    "app_http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["method", "endpoint"],
    buckets=[0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0, 7.5, 10.0],
)

REQUEST_SIZE = Histogram(
    "app_http_request_size_bytes",
    "HTTP request size in bytes",
    ["method", "endpoint"],
    buckets=[100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
)

RESPONSE_SIZE = Histogram(
    "app_http_response_size_bytes",
    "HTTP response size in bytes",
    ["method", "endpoint"],
    buckets=[100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
)

ERROR_COUNT = Counter(
    "app_http_errors_total",
    "Total number of HTTP errors",
    ["method", "endpoint", "status_code", "error_type"],
)

ACTIVE_REQUESTS = Gauge(
    "app_http_active_requests",
    "Number of active HTTP requests",
    ["method", "endpoint"],
)

# ==================== Database Metrics ====================
DATABASE_CONNECTIONS = Gauge(
    "app_database_connections",
    "Number of database connections",
    ["state"],  # active, idle, total
)

DATABASE_QUERY_DURATION = Histogram(
    "app_database_query_duration_seconds",
    "Database query duration in seconds",
    ["operation", "table"],
    buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5],
)

DATABASE_QUERY_COUNT = Counter(
    "app_database_queries_total",
    "Total number of database queries",
    ["operation", "table", "status"],
)

# ==================== Cache Metrics ====================
CACHE_HITS = Counter(
    "app_cache_hits_total",
    "Total number of cache hits",
    ["cache_type", "key_prefix"],
)

CACHE_MISSES = Counter(
    "app_cache_misses_total",
    "Total number of cache misses",
    ["cache_type", "key_prefix"],
)

CACHE_LATENCY = Histogram(
    "app_cache_operation_duration_seconds",
    "Cache operation duration in seconds",
    ["operation", "cache_type"],
    buckets=[0.0001, 0.0005, 0.001, 0.005, 0.01, 0.05, 0.1],
)

# ==================== Celery Metrics ====================
CELERY_TASK_DURATION = Histogram(
    "app_celery_task_duration_seconds",
    "Celery task duration in seconds",
    ["task_name", "status"],
    buckets=[0.1, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0, 120.0, 300.0],
)

CELERY_TASK_COUNT = Counter(
    "app_celery_tasks_total",
    "Total number of Celery tasks",
    ["task_name", "status"],
)

CELERY_QUEUE_LENGTH = Gauge(
    "app_celery_queue_length",
    "Number of tasks in Celery queue",
    ["queue_name"],
)

CELERY_ACTIVE_WORKERS = Gauge(
    "app_celery_active_workers",
    "Number of active Celery workers",
)

# ==================== Business Metrics ====================
USERS_REGISTERED = Counter(
    "app_users_registered_total",
    "Total number of users registered",
)

USERS_ACTIVE = Gauge(
    "app_users_active",
    "Number of active users (logged in within 24h)",
)

TASKS_CREATED = Counter(
    "app_tasks_created_total",
    "Total number of tasks created",
    ["room_id", "category_id"],
)

TASKS_COMPLETED = Counter(
    "app_tasks_completed_total",
    "Total number of tasks completed",
    ["room_id", "category_id"],
)

ROOMS_CREATED = Counter(
    "app_rooms_created_total",
    "Total number of rooms created",
)

NOTIFICATIONS_SENT = Counter(
    "app_notifications_sent_total",
    "Total number of notifications sent",
    ["type"],  # push, email, websocket
)

# ==================== WebSocket Metrics ====================
WEBSOCKET_CONNECTIONS = Gauge(
    "app_websocket_connections",
    "Number of active WebSocket connections",
)

WEBSOCKET_MESSAGES = Counter(
    "app_websocket_messages_total",
    "Total number of WebSocket messages",
    ["direction"],  # sent, received
)


# ==================== Setup Functions ====================

def setup_prometheus_metrics(app: FastAPI, service_name: str = "eli-maor-backend", version: str = "1.0.0"):
    """
    הגדרת Prometheus metrics עבור FastAPI
    """
    # Set application info
    APP_INFO.info({
        "service_name": service_name,
        "version": version,
    })

    # Create instrumentator with custom settings
    instrumentator = Instrumentator(
        should_group_status_codes=False,
        should_ignore_untemplated=True,
        should_instrument_requests_inprogress=True,
        excluded_handlers=["/metrics", "/health", "/health/.*", "/docs", "/openapi.json", "/redoc"],
        inprogress_name="http_requests_inprogress",
        inprogress_labels=True,
    )

    # Add custom metrics
    instrumentator.add(
        request_size_histogram(),
        response_size_histogram(),
        latency_histogram(),
    )

    # Instrument the app and expose metrics
    instrumentator.instrument(app).expose(
        app,
        endpoint="/metrics",
        include_in_schema=False,
        tags=["monitoring"],
    )

    logger.info("Prometheus metrics configured", extra={"metrics_path": "/metrics"})


# ==================== Custom Instrumentator Metrics ====================

def request_size_histogram():
    """Track request body size."""
    def instrumentation(info: InstrumentatorInfo):
        if info.request.headers.get("content-length"):
            size = int(info.request.headers["content-length"])
            REQUEST_SIZE.labels(
                method=info.request.method,
                endpoint=info.modified_handler,
            ).observe(size)
    return instrumentation


def response_size_histogram():
    """Track response body size."""
    def instrumentation(info: InstrumentatorInfo):
        if hasattr(info.response, "headers"):
            content_length = info.response.headers.get("content-length")
            if content_length:
                RESPONSE_SIZE.labels(
                    method=info.request.method,
                    endpoint=info.modified_handler,
                ).observe(int(content_length))
    return instrumentation


def latency_histogram():
    """Track request latency with more granular buckets."""
    def instrumentation(info: InstrumentatorInfo):
        if info.modified_duration is not None:
            REQUEST_LATENCY.labels(
                method=info.request.method,
                endpoint=info.modified_handler,
            ).observe(info.modified_duration)
    return instrumentation


# ==================== Recording Functions ====================

def record_database_query(operation: str, table: str, duration: float, status: str = "success"):
    """
    Record database query metrics
    """
    DATABASE_QUERY_DURATION.labels(operation=operation, table=table).observe(duration)
    DATABASE_QUERY_COUNT.labels(operation=operation, table=table, status=status).inc()


def record_celery_task(task_name: str, status: str, duration: float = None):
    """
    Record Celery task metrics
    """
    CELERY_TASK_COUNT.labels(task_name=task_name, status=status).inc()
    if duration is not None:
        CELERY_TASK_DURATION.labels(task_name=task_name, status=status).observe(duration)


def record_cache_operation(operation: str, cache_type: str = "redis", hit: bool = True, key_prefix: str = "default", duration: float = None):
    """
    Record cache operation metrics
    """
    if operation == "get":
        if hit:
            CACHE_HITS.labels(cache_type=cache_type, key_prefix=key_prefix).inc()
        else:
            CACHE_MISSES.labels(cache_type=cache_type, key_prefix=key_prefix).inc()

    if duration is not None:
        CACHE_LATENCY.labels(operation=operation, cache_type=cache_type).observe(duration)


def record_notification_sent(notification_type: str):
    """Record notification sent metric."""
    NOTIFICATIONS_SENT.labels(type=notification_type).inc()


def record_user_registered():
    """Record user registration metric."""
    USERS_REGISTERED.inc()


def record_task_created(room_id: Optional[int] = None, category_id: Optional[int] = None):
    """Record task creation metric."""
    TASKS_CREATED.labels(
        room_id=str(room_id) if room_id else "none",
        category_id=str(category_id) if category_id else "none"
    ).inc()


def record_task_completed(room_id: Optional[int] = None, category_id: Optional[int] = None):
    """Record task completion metric."""
    TASKS_COMPLETED.labels(
        room_id=str(room_id) if room_id else "none",
        category_id=str(category_id) if category_id else "none"
    ).inc()


def record_room_created():
    """Record room creation metric."""
    ROOMS_CREATED.inc()


def record_websocket_connection(connected: bool):
    """Record WebSocket connection change."""
    if connected:
        WEBSOCKET_CONNECTIONS.inc()
    else:
        WEBSOCKET_CONNECTIONS.dec()


def record_websocket_message(direction: str):
    """Record WebSocket message (sent or received)."""
    WEBSOCKET_MESSAGES.labels(direction=direction).inc()


# ==================== Decorators ====================

def track_time(metric: Histogram, labels: dict = None):
    """
    Decorator to track function execution time.

    Usage:
        @track_time(DATABASE_QUERY_DURATION, {"operation": "select", "table": "tasks"})
        def get_tasks():
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start = time.time()
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start
                if labels:
                    metric.labels(**labels).observe(duration)
                else:
                    metric.observe(duration)
        return wrapper
    return decorator


def track_time_async(metric: Histogram, labels: dict = None):
    """
    Async decorator to track function execution time.
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start = time.time()
            try:
                result = await func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start
                if labels:
                    metric.labels(**labels).observe(duration)
                else:
                    metric.observe(duration)
        return wrapper
    return decorator


# ==================== Middleware ====================

class MetricsMiddleware(BaseHTTPMiddleware):
    """
    Middleware to record additional HTTP metrics.
    """
    async def dispatch(self, request: Request, call_next):
        method = request.method
        path = request.url.path

        # Normalize path for metrics (replace IDs with placeholders)
        normalized_path = self._normalize_path(path)

        # Track active requests
        ACTIVE_REQUESTS.labels(method=method, endpoint=normalized_path).inc()

        start_time = time.time()
        try:
            response = await call_next(request)

            # Record request metrics
            duration = time.time() - start_time
            status_code = response.status_code

            REQUEST_COUNT.labels(
                method=method,
                endpoint=normalized_path,
                status_code=status_code,
            ).inc()

            if status_code >= 400:
                ERROR_COUNT.labels(
                    method=method,
                    endpoint=normalized_path,
                    status_code=status_code,
                    error_type="http_error",
                ).inc()

            return response

        except Exception as e:
            # Record error
            ERROR_COUNT.labels(
                method=method,
                endpoint=normalized_path,
                status_code=500,
                error_type=type(e).__name__,
            ).inc()
            raise

        finally:
            ACTIVE_REQUESTS.labels(method=method, endpoint=normalized_path).dec()

    @staticmethod
    def _normalize_path(path: str) -> str:
        """Normalize path by replacing IDs with placeholders."""
        import re
        # Replace numeric IDs
        normalized = re.sub(r'/\d+', '/{id}', path)
        # Replace UUIDs
        normalized = re.sub(
            r'/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
            '/{uuid}',
            normalized,
            flags=re.IGNORECASE,
        )
        return normalized
