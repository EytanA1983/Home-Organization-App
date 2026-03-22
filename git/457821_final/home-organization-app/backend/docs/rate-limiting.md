# Rate Limiting with slowapi

## Overview

המערכת משתמשת ב-**slowapi** (port של Flask-Limiter ל-FastAPI) ל-rate limiting per IP.

**Features:**
- ✅ Per-IP rate limiting
- ✅ Redis-backed storage
- ✅ Multiple time windows (minute, hour, day)
- ✅ Custom rate limit headers
- ✅ Integration with existing brute-force protection

## Installation

slowapi כבר מותקן ב-`pyproject.toml`:
```toml
slowapi = "^0.1.9"
```

## Configuration

### Environment Variables

```bash
# Enable/disable rate limiting
RATE_LIMIT_ENABLED=true

# Global defaults (if not using decorators)
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000

# Redis URL (required)
REDIS_URL=redis://localhost:6379/0
```

## Usage

### 1. Decorator-based Rate Limiting (מומלץ)

#### Basic Usage

```python
from app.core.limiter import limiter

@router.get("/endpoint")
@limiter.limit("10/minute")  # 10 requests per minute
def endpoint():
    return {"message": "ok"}
```

#### Multiple Time Windows

```python
@router.get("/endpoint")
@limiter.limit("10/minute;100/hour")  # 10 per minute, 100 per hour
def endpoint():
    return {"message": "ok"}
```

#### Predefined Rate Limits

```python
from app.core.limiter import (
    RATE_LIMIT_STRICT,      # 10/minute;100/hour
    RATE_LIMIT_MODERATE,    # 30/minute;500/hour
    RATE_LIMIT_LOOSE,       # 60/minute;1000/hour
    RATE_LIMIT_AUTH,        # 5/minute;20/hour
)

@router.post("/sensitive")
@RATE_LIMIT_STRICT
def sensitive_endpoint():
    return {"message": "ok"}

@router.post("/login")
@RATE_LIMIT_AUTH
def login():
    return {"message": "ok"}
```

### 2. Helper Functions

```python
from app.core.limiter import (
    rate_limit_per_minute,
    rate_limit_per_hour,
    rate_limit_per_day,
    rate_limit_custom,
)

@router.get("/endpoint")
@rate_limit_per_minute(60)
def endpoint():
    return {"message": "ok"}

@router.get("/endpoint2")
@rate_limit_per_hour(1000)
def endpoint2():
    return {"message": "ok"}

@router.get("/endpoint3")
@rate_limit_custom("10/minute;100/hour;1000/day")
def endpoint3():
    return {"message": "ok"}
```

### 3. Global Rate Limiting

ה-middleware ב-`main.py` מפעיל rate limiting גלובלי על כל ה-requests (חוץ מ-health checks ו-docs).

**להשבתה:**
```python
RATE_LIMIT_ENABLED=false
```

## Rate Limit Headers

slowapi מוסיף אוטומטית headers לכל response:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1234567890
Retry-After: 60
```

## IP Detection

ה-limiter מזהה IP אוטומטית מ:
1. `X-Forwarded-For` header (proxy/load balancer)
2. `X-Real-IP` header
3. Direct client IP

**Function:** `get_client_ip(request)` ב-`app/core/limiter.py`

## Examples

### Authentication Endpoints

```python
from app.core.limiter import RATE_LIMIT_AUTH

@router.post("/login")
@RATE_LIMIT_AUTH  # 5/minute;20/hour
def login(request: Request, ...):
    ...

@router.post("/register")
@limiter.limit("5/minute;20/hour")  # Stricter for registration
def register(request: Request, ...):
    ...
```

### API Endpoints

```python
from app.core.limiter import RATE_LIMIT_MODERATE

@router.get("/api/tasks")
@RATE_LIMIT_MODERATE  # 30/minute;500/hour
def get_tasks(request: Request, ...):
    ...

@router.post("/api/tasks")
@limiter.limit("10/minute;100/hour")  # Stricter for POST
def create_task(request: Request, ...):
    ...
```

### Public Endpoints

```python
from app.core.limiter import RATE_LIMIT_LOOSE

@router.get("/public/data")
@RATE_LIMIT_LOOSE  # 60/minute;1000/hour
def get_public_data(request: Request):
    ...
```

## Integration with Brute-Force Protection

ה-rate limiting עובד יחד עם ה-brute-force protection הקיים:

- **slowapi** - Rate limiting per IP (general API protection)
- **RateLimiter** - Brute-force protection (login-specific)

**Example:**
```python
@router.post("/login")
@limiter.limit("10/minute;50/hour")  # slowapi - per IP
def login(request: Request, ...):
    # RateLimiter - brute-force protection (per email+IP)
    identifier = f"{client_ip}:{email}"
    attempt_count, is_locked_out = rate_limiter.record_failed_login(identifier)
    ...
```

## Testing

### בדיקת Rate Limiting

```bash
# Send multiple requests quickly
for i in {1..11}; do
  curl http://localhost:8000/api/auth/login \
    -X POST \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=test@example.com&password=test"
  echo ""
done

# Request 11 should return 429 Too Many Requests
```

### בדיקת Headers

```bash
curl -I http://localhost:8000/api/health

# צפוי לראות:
# X-RateLimit-Limit: 60
# X-RateLimit-Remaining: 59
```

## Error Response

כאשר rate limit מופר:

```json
{
  "detail": "Rate limit exceeded: 10 per 1 minute",
  "error": "rate_limit_exceeded",
  "retry_after": 60
}
```

**Headers:**
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
```

## Redis Storage

slowapi משתמש ב-Redis לאחסון counters:

**Key format:**
```
LIMITER:<key_func_result>:<limit_string>
```

**Example:**
```
LIMITER:192.168.1.1:10/minute
```

## Production Checklist

- [x] Redis configured and accessible
- [x] `RATE_LIMIT_ENABLED=true`
- [x] Rate limits configured per endpoint
- [x] IP detection works behind proxy/load balancer
- [x] Error handling for Redis failures
- [x] Monitoring rate limit violations

## Troubleshooting

### Rate Limiting לא עובד

1. **בדוק Redis:**
   ```bash
   redis-cli ping
   ```

2. **בדוק שה-middleware מופעל:**
   ```python
   RATE_LIMIT_ENABLED=true
   ```

3. **בדוק שה-decorator מופיע:**
   ```python
   @limiter.limit("10/minute")
   ```

### IP לא מזוהה נכון

- ודא ש-`X-Forwarded-For` או `X-Real-IP` נשלחים מה-proxy
- בדוק את `get_client_ip()` function

### Redis Connection Failed

- slowapi יפול חזרה ל-in-memory storage (לא מומלץ לפרודקשן)
- בדוק את `REDIS_URL`
- בדוק שה-Redis זמין

## Resources

- [slowapi Documentation](https://github.com/laurentS/slowapi)
- [Flask-Limiter Documentation](https://flask-limiter.readthedocs.io/)
- [Redis Rate Limiting Patterns](https://redis.io/docs/manual/patterns/rate-limiting/)
