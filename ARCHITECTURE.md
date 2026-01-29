# ארכיטקטורת המערכת

## דיאגרמת ארכיטקטורה

```
+-------------------+        +----------------------+        +-----------------+
|  React / Vue SPA  | <----> |  FastAPI (REST + WS) | <----> | PostgreSQL DB   |
|  (Tailwind CSS)   |   CORS |  + JWT Auth           |        | (SQLAlchemy)   |
+-------------------+        |  + Pydantic schemas   |        +-----------------+
         ^                    |  + OpenAPI docs       |
         |                    +----------------------+
         |                               |
         |          +--------------------+--------------------+
         |          |                                         |
         |   +------+-------+                         +-------+------+
         |   | Celery Worker |                         | Redis (Broker)|
         |   +------+-------+                         +-------+------+
         |          |                                         |
         |          v                                         v
   +-----+------+  +-------------------+            +-------------------+
   | pywebpush   |  | firebase-admin   |            | google-api client |
   | (Web Push)  |  | (FCM optional)   |            | (Calendar sync)   |
   +-------------+  +-------------------+            +-------------------+
```

## רכיבי המערכת

### Frontend (React + Vite)
- **מיקום**: `frontend/`
- **טכנולוגיות**: React, Vite, Tailwind CSS
- **תכונות**:
  - תצוגת בית/חדרים
  - ניהול משימות
  - פידבק קולי (Web Speech API)
  - עיצוב רספונסיבי עם צבעי אדמה
  - WebSocket connection לעדכונים בזמן אמת

### Backend (FastAPI)
- **מיקום**: `backend/app/`
- **טכנולוגיות**: FastAPI, SQLAlchemy 2.0, Pydantic
- **תכונות**:
  - REST API עם OpenAPI/Swagger
  - WebSocket support לעדכונים בזמן אמת
  - JWT Authentication (FastAPI-Users)
  - OAuth2 עם Google
  - Pydantic schemas לוולידציה

### Database (PostgreSQL)
- **ORM**: SQLAlchemy 2.0
- **Migrations**: Alembic
- **תכונות**:
  - יחסים many-to-many
  - היסטוריית משימות
  - אינדקסים לביצועים

### Task Queue (Celery + Redis)
- **Broker**: Redis
- **Result Backend**: Redis
- **תכונות**:
  - Celery Worker למשימות אסינכרוניות
  - Celery Beat לתזמון משימות מחזוריות
  - נוטיפיקציות יומיות/שבועיות
  - סינכרון Google Calendar

### Push Notifications
- **Web Push**: pywebpush (VAPID)
- **Mobile**: firebase-admin (FCM)
- **תכונות**:
  - שליחת push למכשירים
  - ניהול subscriptions
  - אינטגרציה עם Celery

### Google Calendar Integration
- **ספרייה**: google-api-python-client
- **תכונות**:
  - יצירת אירועים
  - עדכון אירועים
  - סינכרון דו-כיווני
  - OAuth2 authentication

## זרימת נתונים

1. **Frontend → Backend**: REST API calls עם JWT tokens
2. **Backend → Frontend**: WebSocket messages לעדכונים בזמן אמת
3. **Backend → Database**: SQLAlchemy ORM
4. **Backend → Celery**: Task queue דרך Redis
5. **Celery → External Services**: Google Calendar, Push Notifications

## אבטחה

- JWT tokens לאימות
- OAuth2 ל-Google Calendar
- CORS middleware
- Password hashing עם bcrypt
- VAPID keys ל-Web Push

## DevOps

- **Docker Compose**: סביבת פיתוח מלאה
- **Poetry**: ניהול תלויות Python
- **CI/CD**: GitHub Actions
- **Testing**: pytest עם coverage
- **Linting**: black, isort, flake8, mypy
