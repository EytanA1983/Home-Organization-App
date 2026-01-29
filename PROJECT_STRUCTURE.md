# מבנה הפרויקט

## Backend

```
backend/
├─ app/
│   ├─ __init__.py
│   ├─ main.py
│   ├─ config.py
│   ├─ db/
│   │   ├─ __init__.py
│   │   ├─ base.py
│   │   ├─ session.py
│   │   └─ models.py          (כולל NotificationSubscription)
│   ├─ api/
│   │   ├─ __init__.py
│   │   ├─ auth.py
│   │   ├─ categories.py
│   │   ├─ rooms.py
│   │   ├─ tasks.py
│   │   ├─ todos.py
│   │   ├─ notifications.py
│   │   ├─ ws.py
│   │   └─ google_calendar.py
│   ├─ schemas/
│   │   ├─ user.py
│   │   ├─ category.py
│   │   ├─ room.py
│   │   ├─ task.py
│   │   └─ todo.py
│   ├─ workers/
│   │   ├─ __init__.py
│   │   ├─ celery_app.py
│   │   └─ tasks.py
│   └─ services/
│       └─ notification.py
│
├─ alembic/ (migration files)
├─ Dockerfile
├─ pyproject.toml
├─ requirements.txt (אם תרצו)
├─ tests/ (pytest)
└─ .env.example
```

## Frontend

```
frontend/
├─ src/
│   ├─ components/
│   │   ├─ HouseView.tsx
│   │   ├─ RoomCard.tsx
│   │   ├─ TaskList.tsx
│   │   ├─ TodoItem.tsx
│   │   ├─ NavBar.tsx
│   │   ├─ Settings.tsx
│   │   └─ GoogleLoginButton.tsx
│   ├─ pages/
│   │   ├─ HomePage.tsx
│   │   ├─ RoomPage.tsx
│   │   └─ GoogleLoginRedirect.tsx
│   ├─ hooks/
│   │   └─ useVoice.ts
│   ├─ utils/
│   │   ├─ api.ts
│   │   ├─ ws.ts
│   │   └─ push.ts
│   ├─ schemas/
│   │   ├─ category.ts
│   │   ├─ room.ts
│   │   ├─ task.ts
│   │   └─ todo.ts
│   ├─ App.tsx
│   └─ main.tsx
├─ public/
│   ├─ service-worker.js
│   └─ google-callback.html
├─ tailwind.config.ts
├─ vite.config.ts
├─ Dockerfile (production)
├─ nginx.conf
├─ package.json
└─ tsconfig.json
```

## Root

```
.
├─ docker-compose.yml
├─ .github/
│   └─ workflows/
│       └─ ci.yml
├─ README.md
├─ ARCHITECTURE.md
└─ DEPLOYMENT.md
```

## קבצים חשובים

### Backend
- `app/main.py` - FastAPI application entry point
- `app/config.py` - Settings management
- `app/db/models.py` - SQLAlchemy models (כולל NotificationSubscription)
- `app/api/` - API endpoints
- `app/workers/` - Celery tasks
- `app/services/notification.py` - Web Push notifications

### Frontend
- `src/App.tsx` - Main React component with routing
- `src/main.tsx` - Entry point
- `src/utils/api.ts` - API client
- `src/utils/ws.ts` - WebSocket client
- `src/utils/push.ts` - Web Push registration
- `public/service-worker.js` - Service Worker for Push notifications

### DevOps
- `docker-compose.yml` - Docker Compose configuration
- `.github/workflows/ci.yml` - CI/CD pipeline
- `backend/Dockerfile` - Backend production image
- `frontend/Dockerfile` - Frontend production image
- `frontend/nginx.conf` - Nginx configuration
