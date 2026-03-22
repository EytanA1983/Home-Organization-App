# Load Testing

## Overview

This directory contains load testing scripts for the Eli Maor API using:

- **Locust** (Python) - Feature-rich, web UI, distributed
- **k6** (JavaScript) - Modern, developer-friendly, CI/CD ready

## Test Scenarios

| Scenario | Users | Duration | Purpose |
|----------|-------|----------|---------|
| **Smoke** | 5 | 1m | Quick validation |
| **Load** | 50-100 | 14m | Normal load |
| **Stress** | 100-200 | 10m | Beyond normal |
| **Spike** | 10-200 | 4m | Sudden surge |
| **Soak** | 50 | 30m | Endurance |

## Quick Start

### Locust

```bash
# Install
pip install locust websocket-client

# Run with Web UI
cd load-tests
locust -f locustfile.py --host=http://localhost:8000

# Open: http://localhost:8089

# Headless run (100 users, 10/s spawn, 5 minutes)
locust -f locustfile.py --host=http://localhost:8000 \
    --users 100 --spawn-rate 10 --run-time 5m --headless
```

### k6

```bash
# Install
# macOS: brew install k6
# Windows: choco install k6
# Docker: see below

# Run with default scenarios
cd load-tests
k6 run k6-script.js

# Run specific scenario
k6 run --env SCENARIO=stress k6-script.js

# Custom VUs and duration
k6 run --vus 200 --duration 10m k6-script.js
```

### Docker

```bash
# Locust
docker compose -f docker-compose.loadtest.yml up locust

# k6
docker compose -f docker-compose.loadtest.yml run k6
```

## Test Coverage

### REST API

| Endpoint | Method | Tested |
|----------|--------|--------|
| `/health` | GET | ✅ |
| `/ready` | GET | ✅ |
| `/api/auth/register` | POST | ✅ |
| `/api/auth/login` | POST | ✅ |
| `/api/auth/me` | GET | ✅ |
| `/api/rooms` | GET | ✅ |
| `/api/rooms` | POST | ✅ |
| `/api/rooms/{id}` | GET | ✅ |
| `/api/tasks` | GET | ✅ |
| `/api/tasks` | POST | ✅ |
| `/api/tasks/{id}/complete` | PUT | ✅ |
| `/api/categories` | GET | ✅ |
| `/api/categories` | POST | ✅ |
| `/api/statistics` | GET | ✅ |
| `/api/notifications/subscribe` | POST | ✅ |

### WebSocket

| Operation | Tested |
|-----------|--------|
| Connect | ✅ |
| Send Ping | ✅ |
| Receive Messages | ✅ |
| Disconnect | ✅ |

### Celery Tasks

Triggered indirectly via:
- Statistics calculations
- Recurring tasks creation
- Push notifications

## Metrics & Thresholds

### k6 Thresholds

```javascript
thresholds: {
  http_req_duration: ['p(95)<2000', 'p(99)<5000'],  // Latency
  http_req_failed: ['rate<0.05'],                   // Error rate
  errors: ['rate<0.1'],                             // Custom errors
}
```

### Locust Metrics

- Request count
- Response times (min, max, avg, median, percentiles)
- Failure rate
- Requests per second
- Active users

## Results

### Locust Output

```
Type     Name                    # reqs   # fails  Avg     Min     Max     Median  req/s
-------- ----------------------- ------- -------- ------- ------- ------- ------- -------
GET      /api/rooms              1000     0        45      12      230     42      10.5
POST     /api/tasks              500      2        120     35      890     95      5.2
...
```

### k6 Output

```
scenarios: (100.00%) 1 scenario, 100 max VUs, 10m0s max duration
           * load: Up to 100 looping VUs for 10m0s

running (10m00.0s), 000/100 VUs, 5000 complete iterations
load ✓ [======================================] 100 VUs  10m0s

     ✓ health check status 200
     ✓ list rooms status 200
     ✓ create task status 200/201

     http_req_duration..: avg=89.23ms  p(95)=245.12ms
     http_req_failed....: 0.12%  ✓ 6  ✗ 4994
```

## Pre-Test Checklist

1. **Start the application**:
   ```bash
   docker compose up -d
   ```

2. **Create test users** (optional, improves login speed):
   ```bash
   python load-tests/setup_test_users.py
   ```

3. **Verify API health**:
   ```bash
   curl http://localhost:8000/health
   ```

4. **Monitor during test**:
   - Grafana: http://localhost:3001
   - API metrics: http://localhost:8000/metrics

## Advanced Usage

### Distributed Locust

```bash
# Master node
locust -f locustfile.py --master --host=http://localhost:8000

# Worker nodes (run on separate machines)
locust -f locustfile.py --worker --master-host=<master-ip>
```

### k6 Cloud

```bash
# Run on k6 Cloud
k6 cloud k6-script.js
```

### k6 with InfluxDB + Grafana

```bash
# Start InfluxDB
docker run -d --name influxdb -p 8086:8086 influxdb:1.8

# Run k6 with output to InfluxDB
k6 run --out influxdb=http://localhost:8086/k6 k6-script.js

# Import k6 dashboard to Grafana (ID: 2587)
```

## Troubleshooting

### Connection Refused

```bash
# Check if app is running
docker compose ps

# Check if port is accessible
curl http://localhost:8000/health
```

### Authentication Failures

```bash
# Check if test users exist
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"loadtest_user_0@test.com","password":"LoadTest123!"}'
```

### High Error Rate

1. Check application logs:
   ```bash
   docker compose logs -f backend
   ```

2. Check database connections:
   ```bash
   docker compose exec db psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
   ```

3. Check Redis:
   ```bash
   docker compose exec redis redis-cli info clients
   ```

### Memory Issues

```bash
# Increase Docker memory limits
# Edit docker-compose.yml:
deploy:
  resources:
    limits:
      memory: 2G
```

## Resources

- [Locust Documentation](https://docs.locust.io/)
- [k6 Documentation](https://k6.io/docs/)
- [Load Testing Best Practices](https://k6.io/docs/test-types/load-testing/)
