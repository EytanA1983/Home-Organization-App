# Health Checks & Readiness Probes

## Endpoints Overview

| Endpoint | Purpose | Returns 503 When |
|----------|---------|------------------|
| `/health` | Basic health check | Never (if app is running) |
| `/live` | Kubernetes liveness probe | Never (if app is running) |
| `/ready` | Kubernetes readiness probe | Database is down |
| `/health/detailed` | Detailed status | Any component unhealthy |
| `/health/db` | Database only | Database is down |
| `/health/redis` | Redis only | Redis is down |

## Response Format

### Basic Health (`/health`, `/live`, `/ready`)

```json
{
  "status": "healthy",
  "timestamp": "2026-01-28T10:30:45.123Z",
  "version": "1.0.0",
  "uptime_seconds": 3600.5
}
```

### Detailed Health (`/health/detailed`)

```json
{
  "status": "healthy",
  "timestamp": "2026-01-28T10:30:45.123Z",
  "version": "1.0.0",
  "uptime_seconds": 3600.5,
  "components": {
    "database": {
      "status": "healthy",
      "latency_ms": 2.5,
      "message": "Database connection successful"
    },
    "redis": {
      "status": "healthy",
      "latency_ms": 1.2,
      "message": "Redis connection successful",
      "details": {
        "redis_version": "7.0.0",
        "connected_clients": 5
      }
    },
    "cache": {
      "status": "healthy",
      "latency_ms": 1.1,
      "message": "Cache available"
    },
    "celery": {
      "status": "degraded",
      "message": "No Celery workers detected"
    }
  }
}
```

## Status Values

- `healthy` - Component is working normally
- `degraded` - Component has issues but app can still function
- `unhealthy` - Component is down, app may not work properly

## Docker Configuration

### Dockerfile

```dockerfile
FROM python:3.11-slim

# ... build steps ...

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    image: eli-maor-api
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    
  db:
    image: postgres:15
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    
  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
```

## Kubernetes Configuration

### deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: eli-maor-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: eli-maor-api
  template:
    metadata:
      labels:
        app: eli-maor-api
    spec:
      containers:
      - name: api
        image: eli-maor-api:latest
        ports:
        - containerPort: 8000
        
        # Liveness probe - restart container if unhealthy
        livenessProbe:
          httpGet:
            path: /live
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 15
          timeoutSeconds: 5
          failureThreshold: 3
        
        # Readiness probe - stop traffic if not ready
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        
        # Startup probe - for slow-starting containers
        startupProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 30  # 30 * 5 = 150s max startup time
        
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### service.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: eli-maor-api
spec:
  selector:
    app: eli-maor-api
  ports:
  - port: 80
    targetPort: 8000
  type: ClusterIP
```

## Monitoring Integration

### Prometheus

The `/health/detailed` endpoint is great for Prometheus monitoring:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'eli-maor-api'
    metrics_path: '/metrics'  # If you have Prometheus metrics endpoint
    static_configs:
      - targets: ['api:8000']
    
  - job_name: 'eli-maor-health'
    metrics_path: '/health/detailed'
    static_configs:
      - targets: ['api:8000']
```

### Alerting Rules

```yaml
groups:
  - name: eli-maor-alerts
    rules:
      - alert: ApiUnhealthy
        expr: probe_success{job="eli-maor-health"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "API is unhealthy"
          
      - alert: DatabaseDown
        expr: |
          probe_http_status_code{job="eli-maor-health"} == 503
        for: 30s
        labels:
          severity: critical
        annotations:
          summary: "Database connection failed"
```

## Testing Health Endpoints

```bash
# Basic health check
curl http://localhost:8000/health

# Liveness probe
curl http://localhost:8000/live

# Readiness probe (includes DB/Redis check)
curl http://localhost:8000/ready

# Detailed status
curl http://localhost:8000/health/detailed | jq

# Check specific component
curl http://localhost:8000/health/db
curl http://localhost:8000/health/redis
```

## Best Practices

1. **Liveness vs Readiness**
   - Liveness: "Is the app running?" - restart if not
   - Readiness: "Can the app serve traffic?" - don't route traffic if not

2. **Timeouts**
   - Keep health checks fast (< 5 seconds)
   - Use appropriate intervals (10-30 seconds)

3. **Dependencies**
   - Database down = app not ready (503 on /ready)
   - Redis down = app degraded but ready (200 on /ready)

4. **Startup Time**
   - Use startup probe for slow-starting apps
   - Don't check readiness during startup
