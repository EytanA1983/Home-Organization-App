# Advanced Logging with Loguru

## Overview

המערכת משתמשת ב-**Loguru** ללוגים מתקדמים עם תמיכה ב:
- **JSON formatting** - מוכן ל-ELK Stack / Loki
- **Log rotation** - סיבוב אוטומטי לפי גודל
- **Compression** - דחיסה אוטומטית
- **Structured logging** - לוגים מובנים עם context

## Configuration

### Environment Variables

```env
# Logging settings
LOG_LEVEL=INFO                    # DEBUG, INFO, WARNING, ERROR, CRITICAL
LOG_FORMAT=json                   # json או text
LOG_DIR=logs                      # תיקיית לוגים
LOG_ROTATION=100 MB               # גודל לפני סיבוב
LOG_RETENTION=30 days            # תקופת שמירה
LOG_COMPRESSION=gz                # gz, zip, או "" ללא דחיסה
```

### Log Files

המערכת יוצרת 3 קבצי לוג:

1. **`logs/app_YYYY-MM-DD.log`** - כל הלוגים
2. **`logs/errors_YYYY-MM-DD.log`** - שגיאות בלבד
3. **`logs/json_YYYY-MM-DD.log`** - JSON format ל-ELK/Loki (אם LOG_FORMAT=json)

## Usage

### Basic Logging

```python
from app.core.logging import logger

logger.info("User action", extra={"user_id": 123, "action": "create_task"})
logger.warning("Rate limit exceeded", extra={"ip": "192.168.1.1"})
logger.error("Database error", extra={"query": "SELECT * FROM users"})
```

### Structured Logging Helpers

```python
from app.core.logging import log_api_call, log_error, log_request

# Log API calls
log_api_call("/api/tasks", "POST", user_id=123, task_id=456)

# Log errors with context
try:
    # code
except Exception as e:
    log_error(e, context={"user_id": 123, "endpoint": "/api/tasks"})

# Log HTTP requests (automatically done by middleware)
log_request(request, response, duration_ms=150.5)
```

## JSON Format (ELK/Loki)

כאשר `LOG_FORMAT=json`, הלוגים נשמרים בפורמט JSON:

```json
{
  "time": "2024-01-15 10:30:45.123",
  "level": "INFO",
  "module": "app.api.auth",
  "function": "login",
  "line": 114,
  "message": "User logged in successfully",
  "extra": {
    "user_id": 123,
    "email": "user@example.com",
    "client_ip": "192.168.1.1"
  }
}
```

## Integration with ELK Stack

### Filebeat Configuration

```yaml
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /path/to/logs/json_*.log
    json.keys_under_root: true
    json.add_error_key: true

output.elasticsearch:
  hosts: ["localhost:9200"]
  index: "eli-maor-logs-%{+yyyy.MM.dd}"
```

### Loki Configuration

```yaml
clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: eli-maor
    static_configs:
      - targets:
          - localhost
        labels:
          job: eli-maor
          __path__: /path/to/logs/json_*.log
```

## Log Rotation

הלוגים מסתובבים אוטומטית כאשר:
- הגודל מגיע ל-`LOG_ROTATION` (ברירת מחדל: 100 MB)
- הקבצים הישנים נשמרים ל-`LOG_RETENTION` (ברירת מחדל: 30 ימים)
- קבצים ישנים נדחסים אוטומטית (אם `LOG_COMPRESSION` מוגדר)

## Best Practices

1. **Always use structured logging** - הוסף context ללוגים
2. **Use appropriate log levels**:
   - `DEBUG` - מידע לפיתוח
   - `INFO` - פעולות רגילות
   - `WARNING` - אזהרות
   - `ERROR` - שגיאות
   - `CRITICAL` - שגיאות קריטיות

3. **Don't log sensitive data** - אל תתעד סיסמאות, tokens, וכו'

4. **Use extra for context**:
   ```python
   logger.info("Task created", extra={
       "user_id": user.id,
       "task_id": task.id,
       "room_id": task.room_id
   })
   ```

## Monitoring

השתמש ב-ELK/Loki כדי:
- לנטר שגיאות
- לנתח ביצועים
- לזהות בעיות
- לעקוב אחר פעילות משתמשים
