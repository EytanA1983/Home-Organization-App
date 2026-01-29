"""
Advanced Logging Configuration with Loguru
Supports:
- JSON formatting for ELK/Loki
- AWS CloudWatch integration
- Log rotation & compression
- Structured logging with correlation IDs
- Request tracing
"""
import sys
import json
import uuid
import logging
from pathlib import Path
from typing import Any, Dict, Optional
from datetime import datetime
from contextvars import ContextVar
from functools import wraps
import time

from loguru import logger
from app.config import settings

# Context variable for request correlation ID
correlation_id_var: ContextVar[str] = ContextVar("correlation_id", default="")
request_context_var: ContextVar[Dict] = ContextVar("request_context", default={})


class InterceptHandler(logging.Handler):
    """Intercept standard logging messages toward loguru"""

    def __init__(self, level: int = logging.NOTSET):
        super().__init__(level)

    def emit(self, record: logging.LogRecord) -> None:
        # Get corresponding Loguru level if it exists
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        # Find caller from where originated the logged message
        frame, depth = sys._getframe(6), 6
        while frame and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())


def correlation_id_filter(record):
    """Add correlation ID to log records"""
    record["extra"]["correlation_id"] = correlation_id_var.get() or str(uuid.uuid4())[:8]
    record["extra"]["request_context"] = request_context_var.get()
    return True


def json_serializer(record) -> str:
    """Custom JSON serializer for structured logs"""
    log_record = {
        "@timestamp": datetime.utcnow().isoformat() + "Z",
        "level": record["level"].name,
        "message": record["message"],
        "logger": record["name"],
        "module": record["module"],
        "function": record["function"],
        "line": record["line"],
        "correlation_id": record["extra"].get("correlation_id", ""),
        "service": settings.PROJECT_NAME,
        "environment": "production" if not settings.DEBUG else "development",
    }
    
    # Add extra fields
    for key, value in record["extra"].items():
        if key not in ["correlation_id", "request_context"]:
            log_record[key] = value
    
    # Add request context if available
    request_ctx = record["extra"].get("request_context", {})
    if request_ctx:
        log_record["request"] = request_ctx
    
    # Add exception info if present
    if record["exception"]:
        log_record["exception"] = {
            "type": record["exception"].type.__name__ if record["exception"].type else None,
            "value": str(record["exception"].value) if record["exception"].value else None,
            "traceback": record["exception"].traceback if record["exception"].traceback else None,
        }
    
    return json.dumps(log_record, ensure_ascii=False, default=str)


def setup_cloudwatch_handler():
    """Setup AWS CloudWatch Logs handler (if configured)"""
    if not getattr(settings, 'AWS_CLOUDWATCH_LOG_GROUP', None):
        return None
    
    try:
        import boto3
        import watchtower
        
        # Create CloudWatch client
        client = boto3.client(
            'logs',
            region_name=getattr(settings, 'AWS_REGION', 'us-east-1'),
            aws_access_key_id=getattr(settings, 'AWS_ACCESS_KEY_ID', None),
            aws_secret_access_key=getattr(settings, 'AWS_SECRET_ACCESS_KEY', None),
        )
        
        # Create CloudWatch handler
        cloudwatch_handler = watchtower.CloudWatchLogHandler(
            log_group=settings.AWS_CLOUDWATCH_LOG_GROUP,
            stream_name=getattr(settings, 'AWS_CLOUDWATCH_LOG_STREAM', 'eli-maor-api'),
            boto3_client=client,
            use_queues=True,
            send_interval=10,
            max_batch_count=1000,
        )
        
        logger.info("CloudWatch logging enabled", extra={
            "log_group": settings.AWS_CLOUDWATCH_LOG_GROUP,
        })
        return cloudwatch_handler
    except ImportError:
        logger.warning("watchtower not installed, CloudWatch logging disabled")
        return None
    except Exception as e:
        logger.warning(f"Failed to setup CloudWatch: {e}")
        return None


def setup_elk_handler():
    """Setup Elasticsearch/ELK handler via HTTP (if configured)"""
    elk_url = getattr(settings, 'ELK_URL', None)
    if not elk_url:
        return None
    
    try:
        import httpx
        
        def elk_sink(message):
            """Send log to Elasticsearch"""
            try:
                record = message.record
                log_data = {
                    "@timestamp": datetime.utcnow().isoformat() + "Z",
                    "level": record["level"].name,
                    "message": record["message"],
                    "module": record["module"],
                    "function": record["function"],
                    "line": record["line"],
                    "correlation_id": record["extra"].get("correlation_id", ""),
                    "service": settings.PROJECT_NAME,
                    **{k: v for k, v in record["extra"].items() if k != "correlation_id"}
                }
                
                # Send to Elasticsearch (async would be better for production)
                with httpx.Client(timeout=5.0) as client:
                    index_name = f"logs-eli-maor-{datetime.utcnow().strftime('%Y.%m.%d')}"
                    client.post(
                        f"{elk_url}/{index_name}/_doc",
                        json=log_data,
                        headers={"Content-Type": "application/json"}
                    )
            except Exception:
                pass  # Don't let logging failures crash the app
        
        logger.info("ELK logging enabled", extra={"elk_url": elk_url})
        return elk_sink
    except ImportError:
        logger.warning("httpx not installed, ELK logging disabled")
        return None
    except Exception as e:
        logger.warning(f"Failed to setup ELK: {e}")
        return None


def setup_logging():
    """Configure loguru logging with rotation, JSON format, and external integrations"""
    # Remove default handler
    logger.remove()

    # Create logs directory if it doesn't exist
    log_dir = Path(settings.LOG_DIR)
    log_dir.mkdir(exist_ok=True)

    # Determine log format
    if settings.LOG_FORMAT.lower() == "json":
        # JSON format for ELK/Loki - custom serializer
        log_format = "{extra[serialized]}"
        
        def json_formatter(record):
            record["extra"]["serialized"] = json_serializer(record)
            return "{extra[serialized]}\n"
    else:
        # Human-readable format for console
        log_format = (
            "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>[{extra[correlation_id]}]</cyan> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
            "<level>{message}</level>"
        )
        json_formatter = None

    # Console handler (always enabled)
    logger.add(
        sys.stdout,
        format=json_formatter or log_format,
        level=settings.LOG_LEVEL,
        colorize=settings.LOG_FORMAT.lower() != "json",
        backtrace=True,
        diagnose=settings.DEBUG,
        filter=correlation_id_filter,
    )

    # File handler - All logs
    logger.add(
        log_dir / "app_{time:YYYY-MM-DD}.log",
        format=json_formatter or log_format,
        level=settings.LOG_LEVEL,
        rotation=settings.LOG_ROTATION,
        retention=settings.LOG_RETENTION,
        compression=settings.LOG_COMPRESSION if settings.LOG_COMPRESSION else None,
        backtrace=True,
        diagnose=settings.DEBUG,
        encoding="utf-8",
        filter=correlation_id_filter,
    )

    # File handler - Errors only
    logger.add(
        log_dir / "errors_{time:YYYY-MM-DD}.log",
        format=json_formatter or log_format,
        level="ERROR",
        rotation=settings.LOG_ROTATION,
        retention=settings.LOG_RETENTION,
        compression=settings.LOG_COMPRESSION if settings.LOG_COMPRESSION else None,
        backtrace=True,
        diagnose=True,  # Always diagnose errors
        encoding="utf-8",
        filter=correlation_id_filter,
    )

    # File handler - JSON format for ELK/Loki
    if settings.LOG_FORMAT.lower() == "json":
        logger.add(
            log_dir / "json_{time:YYYY-MM-DD}.log",
            format=json_serializer,
            level=settings.LOG_LEVEL,
            rotation=settings.LOG_ROTATION,
            retention=settings.LOG_RETENTION,
            compression=settings.LOG_COMPRESSION if settings.LOG_COMPRESSION else None,
            backtrace=True,
            diagnose=settings.DEBUG,
            encoding="utf-8",
            serialize=True,
            filter=correlation_id_filter,
        )

    # Setup CloudWatch handler (if configured)
    cloudwatch_handler = setup_cloudwatch_handler()
    if cloudwatch_handler:
        # Add CloudWatch via standard logging bridge
        logging.getLogger("cloudwatch").addHandler(cloudwatch_handler)

    # Setup ELK handler (if configured)
    elk_sink = setup_elk_handler()
    if elk_sink:
        logger.add(
            elk_sink,
            level=settings.LOG_LEVEL,
            filter=correlation_id_filter,
        )

    # Intercept standard logging
    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)

    # Configure third-party loggers
    for logger_name in ["uvicorn", "uvicorn.access", "uvicorn.error", "fastapi", "sqlalchemy", "celery", "httpx"]:
        logging_logger = logging.getLogger(logger_name)
        logging_logger.handlers = [InterceptHandler()]
        logging_logger.propagate = False

    logger.info(
        "Logging configured",
        extra={
            "log_level": settings.LOG_LEVEL,
            "log_format": settings.LOG_FORMAT,
            "log_dir": str(log_dir),
            "rotation": settings.LOG_ROTATION,
            "retention": settings.LOG_RETENTION,
            "cloudwatch_enabled": cloudwatch_handler is not None,
            "elk_enabled": elk_sink is not None,
        },
    )


# ================== Context Management ==================

def set_correlation_id(correlation_id: str = None) -> str:
    """Set correlation ID for request tracing"""
    cid = correlation_id or str(uuid.uuid4())
    correlation_id_var.set(cid)
    return cid


def get_correlation_id() -> str:
    """Get current correlation ID"""
    return correlation_id_var.get() or str(uuid.uuid4())[:8]


def set_request_context(context: Dict[str, Any]):
    """Set request context for structured logging"""
    request_context_var.set(context)


def clear_request_context():
    """Clear request context"""
    correlation_id_var.set("")
    request_context_var.set({})


# ================== Logger Helpers ==================

def get_logger(name: str = None):
    """
    Get a logger instance with optional name binding
    Usage: logger = get_logger(__name__)
    """
    if name:
        return logger.bind(name=name)
    return logger


# ================== Structured Logging Helpers ==================

def log_request(request, response=None, duration_ms=None):
    """Log HTTP request with structured data"""
    extra = {
        "event_type": "http_request",
        "method": request.method,
        "path": str(request.url.path),
        "query_params": str(request.query_params) if request.query_params else None,
        "client_ip": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent"),
    }

    if response:
        extra.update({
            "status_code": response.status_code,
            "duration_ms": round(duration_ms, 2) if duration_ms else None,
        })
        
        # Log level based on status code
        if response.status_code >= 500:
            logger.error("HTTP request completed with server error", extra=extra)
        elif response.status_code >= 400:
            logger.warning("HTTP request completed with client error", extra=extra)
        else:
            logger.info("HTTP request completed", extra=extra)
    else:
        logger.info("HTTP request started", extra=extra)


def log_error(error: Exception, context: Dict[str, Any] = None, level: str = "error"):
    """Log error with structured context"""
    extra = {
        "event_type": "error",
        "error_type": type(error).__name__,
        "error_message": str(error),
        **(context or {}),
    }
    
    log_func = getattr(logger, level, logger.error)
    log_func(f"Error occurred: {type(error).__name__}", extra=extra, exc_info=True)


def log_database_query(query: str, duration_ms: float = None, params: Dict = None):
    """Log database query (for debugging/performance monitoring)"""
    extra = {
        "event_type": "database_query",
        "duration_ms": round(duration_ms, 2) if duration_ms else None,
        "params_count": len(params) if params else 0,
    }
    
    # Only log query content in debug mode (security)
    if settings.DEBUG:
        extra["query"] = query[:500]  # Truncate long queries
        extra["params"] = params
    
    if duration_ms and duration_ms > 1000:  # Slow query (>1s)
        logger.warning("Slow database query detected", extra=extra)
    else:
        logger.debug("Database query executed", extra=extra)


def log_api_call(endpoint: str, method: str, user_id: int = None, **kwargs):
    """Log API call with context"""
    extra = {
        "event_type": "api_call",
        "endpoint": endpoint,
        "method": method,
        "user_id": user_id,
        **kwargs,
    }
    logger.info("API call", extra=extra)


def log_authentication(user_id: int = None, email: str = None, success: bool = True, reason: str = None):
    """Log authentication events"""
    extra = {
        "event_type": "authentication",
        "user_id": user_id,
        "email": email,
        "success": success,
        "reason": reason,
    }
    
    if success:
        logger.info("Authentication successful", extra=extra)
    else:
        logger.warning("Authentication failed", extra=extra)


def log_business_event(event_name: str, user_id: int = None, **data):
    """Log business/domain events"""
    extra = {
        "event_type": "business_event",
        "event_name": event_name,
        "user_id": user_id,
        **data,
    }
    logger.info(f"Business event: {event_name}", extra=extra)


def log_performance(operation: str, duration_ms: float, threshold_ms: float = 1000, **context):
    """Log performance metrics"""
    extra = {
        "event_type": "performance",
        "operation": operation,
        "duration_ms": round(duration_ms, 2),
        "threshold_ms": threshold_ms,
        "slow": duration_ms > threshold_ms,
        **context,
    }
    
    if duration_ms > threshold_ms:
        logger.warning(f"Slow operation detected: {operation}", extra=extra)
    else:
        logger.debug(f"Performance: {operation}", extra=extra)


# ================== Decorators ==================

def log_execution_time(operation_name: str = None, threshold_ms: float = 1000):
    """Decorator to log function execution time"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start = time.time()
            try:
                result = func(*args, **kwargs)
                duration_ms = (time.time() - start) * 1000
                log_performance(
                    operation=operation_name or func.__name__,
                    duration_ms=duration_ms,
                    threshold_ms=threshold_ms,
                    success=True,
                )
                return result
            except Exception as e:
                duration_ms = (time.time() - start) * 1000
                log_performance(
                    operation=operation_name or func.__name__,
                    duration_ms=duration_ms,
                    threshold_ms=threshold_ms,
                    success=False,
                    error=str(e),
                )
                raise
        return wrapper
    return decorator


def log_function_call(func):
    """Decorator to log function entry and exit"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        func_name = f"{func.__module__}.{func.__name__}"
        logger.debug(f"Entering {func_name}", extra={"event_type": "function_call", "function": func_name})
        try:
            result = func(*args, **kwargs)
            logger.debug(f"Exiting {func_name}", extra={"event_type": "function_call", "function": func_name, "success": True})
            return result
        except Exception as e:
            logger.error(f"Error in {func_name}", extra={"event_type": "function_call", "function": func_name, "success": False, "error": str(e)})
            raise
    return wrapper


# Export logger instance and utilities
__all__ = [
    "logger",
    "setup_logging",
    "get_logger",
    "set_correlation_id",
    "get_correlation_id",
    "set_request_context",
    "clear_request_context",
    "log_request",
    "log_error",
    "log_database_query",
    "log_api_call",
    "log_authentication",
    "log_business_event",
    "log_performance",
    "log_execution_time",
    "log_function_call",
]
