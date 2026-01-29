# Monitoring & Observability - Prometheus + Grafana

## Overview

המערכת כוללת מדדי ביצועים ו-Observability מלאים עם Prometheus ו-Grafana.

## Features

### Metrics Collected

1. **HTTP Request Metrics**
   - `http_requests_total` - Total number of HTTP requests (by method, endpoint, status)
   - `http_request_duration_seconds` - Request latency (histogram)
   - `http_errors_total` - Total number of HTTP errors (4xx, 5xx)
   - `http_requests_inprogress` - Number of active requests

2. **Database Metrics**
   - `database_query_duration_seconds` - Database query duration (by operation, table)

3. **Celery Metrics**
   - `celery_task_duration_seconds` - Celery task duration (by task name, status)
   - `celery_tasks_total` - Total number of Celery tasks

## Setup

### 1. Install Dependencies

```bash
cd backend
poetry add prometheus-fastapi-instrumentator
poetry install
```

### 2. Run with Monitoring Stack

```bash
# Start application + monitoring
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

### 3. Access Dashboards

- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **FastAPI Metrics**: http://localhost:8000/metrics

## Configuration

### Prometheus Configuration

`monitoring/prometheus.yml`:
```yaml
scrape_configs:
  - job_name: 'fastapi'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'
    scrape_interval: 5s
```

### Grafana Dashboard

Pre-configured dashboard at `monitoring/grafana/dashboards/fastapi-dashboard.json` includes:
- Request Rate
- Request Latency (p95)
- Error Rate
- Active Requests
- Database Query Duration
- Celery Task Duration

## Metrics Endpoints

### Prometheus Metrics

```bash
GET /metrics
```

Returns Prometheus-formatted metrics:
```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",endpoint="/api/tasks",status_code="200"} 150.0

# HELP http_request_duration_seconds HTTP request latency in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="GET",endpoint="/api/tasks",le="0.01"} 50.0
http_request_duration_seconds_bucket{method="GET",endpoint="/api/tasks",le="0.05"} 120.0
...
```

## Usage

### Recording Custom Metrics

```python
from app.core.metrics import (
    record_database_query,
    record_celery_task,
)

# Record database query
record_database_query("SELECT", "tasks", 0.05)

# Record Celery task
record_celery_task("send_notification", "success", duration=1.2)
```

### Querying Metrics in Prometheus

```promql
# Request rate (requests per second)
rate(http_requests_total[5m])

# 95th percentile latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate
rate(http_errors_total[5m])

# Active requests
http_requests_inprogress
```

## Grafana Queries

### Request Rate Panel

```promql
rate(http_requests_total[5m])
```

### Latency (p95) Panel

```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### Error Rate Panel

```promql
rate(http_errors_total[5m])
```

### Active Requests Panel

```promql
http_requests_inprogress
```

### Database Query Duration Panel

```promql
histogram_quantile(0.95, rate(database_query_duration_seconds_bucket[5m]))
```

### Celery Task Duration Panel

```promql
histogram_quantile(0.95, rate(celery_task_duration_seconds_bucket[5m]))
```

## Alerting (Optional)

Create `monitoring/prometheus/alerts.yml`:

```yaml
groups:
  - name: fastapi_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_errors_total[5m]) > 0.1
        for: 5m
        annotations:
          summary: "High error rate detected"
          
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1.0
        for: 5m
        annotations:
          summary: "High latency detected"
```

## Production Deployment

### Kubernetes

```yaml
apiVersion: v1
kind: Service
metadata:
  name: prometheus
spec:
  selector:
    app: prometheus
  ports:
    - port: 9090
---
apiVersion: v1
kind: Service
metadata:
  name: grafana
spec:
  selector:
    app: grafana
  ports:
    - port: 3000
```

### Environment Variables

```bash
# Prometheus
PROMETHEUS_RETENTION=30d
PROMETHEUS_SCRAPE_INTERVAL=5s

# Grafana
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=secure_password
```

## Best Practices

1. **Scrape Interval**: Use 5-15s for production
2. **Retention**: 30 days for Prometheus, longer for Grafana
3. **Labels**: Use consistent label names across metrics
4. **Cardinality**: Avoid high-cardinality labels (user IDs, etc.)
5. **Alerts**: Set up alerts for critical metrics (error rate, latency)

## Troubleshooting

### Metrics Not Appearing

1. Check `/metrics` endpoint is accessible
2. Verify Prometheus can scrape the target
3. Check Grafana datasource configuration

### High Cardinality

If you see high cardinality warnings:
- Remove high-cardinality labels
- Use aggregation instead of per-request metrics
- Consider using sampling

## References

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [prometheus-fastapi-instrumentator](https://github.com/trallnag/prometheus-fastapi-instrumentator)
