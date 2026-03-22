# Observability

## Overview

The observability stack provides:

| Component | Purpose | Port |
|-----------|---------|------|
| **Prometheus** | Metrics collection | 9090 |
| **Grafana** | Dashboards & visualization | 3001 |
| **Jaeger** | Distributed tracing | 16686 |
| **Alertmanager** | Alert routing | 9093 |

## Quick Start

```bash
# Start the observability stack
docker compose -f docker-compose.yml -f docker-compose.observability.yml up -d

# Access
# - Grafana: http://localhost:3001 (admin/admin)
# - Prometheus: http://localhost:9090
# - Jaeger: http://localhost:16686
# - Alertmanager: http://localhost:9093
```

## Metrics (Prometheus)

### Available Metrics

#### HTTP Metrics
| Metric | Type | Description |
|--------|------|-------------|
| `http_requests_total` | Counter | Total HTTP requests |
| `http_request_duration_seconds` | Histogram | Request latency |
| `http_requests_inprogress` | Gauge | Active requests |
| `app_http_errors_total` | Counter | HTTP errors |

#### Database Metrics
| Metric | Type | Description |
|--------|------|-------------|
| `app_database_query_duration_seconds` | Histogram | Query latency |
| `app_database_queries_total` | Counter | Total queries |

#### Cache Metrics
| Metric | Type | Description |
|--------|------|-------------|
| `app_cache_hits_total` | Counter | Cache hits |
| `app_cache_misses_total` | Counter | Cache misses |
| `app_cache_operation_duration_seconds` | Histogram | Cache latency |

#### Business Metrics
| Metric | Type | Description |
|--------|------|-------------|
| `app_users_registered_total` | Counter | Users registered |
| `app_tasks_created_total` | Counter | Tasks created |
| `app_tasks_completed_total` | Counter | Tasks completed |
| `app_rooms_created_total` | Counter | Rooms created |
| `app_notifications_sent_total` | Counter | Notifications sent |

### Prometheus Queries

```promql
# Request rate
sum(rate(http_requests_total[5m]))

# Error rate percentage
100 * sum(rate(app_http_errors_total[5m])) / sum(rate(http_requests_total[5m]))

# P95 latency
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# Database query latency
histogram_quantile(0.95, sum(rate(app_database_query_duration_seconds_bucket[5m])) by (le, operation))

# Cache hit ratio
sum(app_cache_hits_total) / (sum(app_cache_hits_total) + sum(app_cache_misses_total))
```

### Adding Custom Metrics

```python
from app.core.metrics import (
    record_database_query,
    record_cache_operation,
    record_task_created,
    record_notification_sent,
)

# Record database query
record_database_query(
    operation="select",
    table="tasks",
    duration=0.05,
    status="success"
)

# Record cache operation
record_cache_operation(
    operation="get",
    cache_type="redis",
    hit=True,
    key_prefix="rooms",
    duration=0.001
)

# Record business event
record_task_created(room_id=1, category_id=2)
record_notification_sent("push")
```

## Tracing (OpenTelemetry)

### Configuration

Set environment variables:

```bash
# Enable tracing
OTEL_TRACING_ENABLED=true

# OTLP exporter (recommended)
OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4317

# Or Jaeger directly
JAEGER_ENDPOINT=http://jaeger:14268/api/traces

# Service info
OTEL_SERVICE_NAME=eli-maor-backend
ENVIRONMENT=production
```

### Auto-Instrumentation

The following are automatically instrumented:

- ✅ FastAPI requests
- ✅ SQLAlchemy queries
- ✅ Redis operations
- ✅ HTTPX HTTP client
- ✅ Celery tasks
- ✅ Logging (adds trace_id)

### Manual Instrumentation

```python
from app.core.tracing import (
    get_tracer,
    create_span,
    add_span_attributes,
    add_span_event,
    record_exception,
    get_trace_id,
)

# Using context manager
with create_span("my-operation", {"key": "value"}) as span:
    # Do work
    span.set_attribute("result", "success")

# Using tracer directly
tracer = get_tracer(__name__)
with tracer.start_as_current_span("custom-span") as span:
    span.set_attribute("user.id", user_id)
    add_span_event("processing_started", {"items": 10})
    try:
        result = process_items()
    except Exception as e:
        record_exception(e)
        raise

# Get trace ID for logging
logger.info(f"Processing request", extra={"trace_id": get_trace_id()})
```

### Viewing Traces

1. Open Jaeger UI: http://localhost:16686
2. Select service: `eli-maor-backend`
3. Click "Find Traces"
4. View trace timeline and spans

## Grafana Dashboards

### Pre-configured Dashboards

1. **Application Overview** - Request rate, latency, errors
2. **Database Metrics** - Query performance
3. **Cache Performance** - Hit/miss ratio

### Creating Custom Dashboards

1. Go to Grafana: http://localhost:3001
2. Click "+" → "New Dashboard"
3. Add panels with Prometheus queries
4. Save dashboard

### Importing Dashboards

```bash
# Copy dashboard JSON to:
observability/grafana/dashboards/your-dashboard.json

# Restart Grafana to load
docker compose restart grafana
```

## Alerts

### Pre-configured Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| HighErrorRate | Error rate > 5% | warning |
| CriticalErrorRate | Error rate > 15% | critical |
| HighLatency | P95 > 2s | warning |
| ApplicationDown | up == 0 | critical |
| SlowDatabaseQueries | P95 > 1s | warning |
| PostgreSQLDown | pg_up == 0 | critical |
| RedisDown | redis_up == 0 | critical |
| HighCPUUsage | CPU > 85% | warning |
| HighMemoryUsage | Memory > 85% | warning |

### Configuring Alert Notifications

Edit `observability/alertmanager/alertmanager.yml`:

```yaml
# Email
email_configs:
  - to: 'team@example.com'
    send_resolved: true

# Slack
slack_configs:
  - channel: '#alerts'
    api_url: 'https://hooks.slack.com/services/xxx'
```

### Creating Custom Alerts

Add to `observability/prometheus/alerts/app-alerts.yml`:

```yaml
- alert: MyCustomAlert
  expr: my_metric > threshold
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Alert summary"
    description: "Detailed description"
```

## Infrastructure Monitoring

### Node Exporter (Host Metrics)

Exposed at: http://localhost:9100/metrics

Metrics:
- CPU usage
- Memory usage
- Disk I/O
- Network I/O

### Redis Exporter

Exposed at: http://localhost:9121/metrics

Metrics:
- Connected clients
- Memory usage
- Commands/sec
- Keys count

### PostgreSQL Exporter

Exposed at: http://localhost:9187/metrics

Metrics:
- Active connections
- Transaction rate
- Cache hit ratio
- Replication lag

## Best Practices

### Metrics

1. **Use meaningful labels** - But limit cardinality
2. **Set appropriate buckets** - For histograms
3. **Name consistently** - `app_<subsystem>_<metric>_<unit>`
4. **Record business metrics** - Not just technical

### Tracing

1. **Sample in production** - 10-100% based on load
2. **Add meaningful attributes** - user_id, order_id, etc.
3. **Create spans for important operations** - DB, external APIs
4. **Propagate context** - Between services

### Alerting

1. **Alert on symptoms** - Not causes
2. **Use severity levels** - critical, warning, info
3. **Include runbooks** - In alert annotations
4. **Test alerts** - Before production

## Troubleshooting

### Metrics Not Showing

```bash
# Check if backend exposes metrics
curl http://localhost:8000/metrics

# Check Prometheus targets
# Go to http://localhost:9090/targets

# Check scrape config
cat observability/prometheus/prometheus.yml
```

### Traces Not Showing

```bash
# Check if tracing is enabled
curl http://localhost:8000/health/detailed | jq

# Check Jaeger is receiving data
docker compose logs jaeger

# Verify OTLP endpoint
echo $OTEL_EXPORTER_OTLP_ENDPOINT
```

### Grafana Can't Connect

```bash
# Check Prometheus is running
curl http://localhost:9090/-/healthy

# Check datasource configuration
cat observability/grafana/provisioning/datasources/datasources.yml

# Restart Grafana
docker compose restart grafana
```

## Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [OpenTelemetry Python](https://opentelemetry.io/docs/instrumentation/python/)
- [PromQL Cheat Sheet](https://promlabs.com/promql-cheat-sheet/)
