# 🚀 הוראות הרצה מהירות - Quick Start

## שתי דרכים להריץ את הפרויקט

### 1️⃣ Development (ללא Docker) - מומלץ לפיתוח

**Frontend:**
```powershell
cd frontend
npm run dev          # Vite (5173)
```

**Backend (בחלון נפרד):**
```powershell
cd backend
.\start-server.ps1  # או: poetry run uvicorn app.main:app --reload
```

**פתח בדפדפן:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/docs

---

### 2️⃣ Production (עם Docker Compose) - מומלץ לבדיקות/פרודקשן

```powershell
docker compose up --build
```

**פתח בדפדפן:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs

---

## 📋 דרישות מוקדמות

### Development:
- Node.js 18+
- Python 3.10+
- Poetry (או pip)
- PostgreSQL (או Docker רק ל-DB)
- Redis (או Docker רק ל-Redis)

### Production (Docker):
- Docker & Docker Compose

---

## ⚙️ הגדרת משתני סביבה

### Frontend `.env` (Development):
```env
VITE_API_URL=http://localhost:8000
VITE_VAPID_PUBLIC_KEY=YOUR_PUBLIC_KEY
```

### Frontend `.env` (Docker):
```env
VITE_API_URL=http://backend:8000
VITE_VAPID_PUBLIC_KEY=YOUR_PUBLIC_KEY
```

### Backend `.env`:
```env
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/eli_maor
REDIS_URL=redis://localhost:6379/0
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
```

---

## 🔧 סקריפטים מוכנים

### Backend:
```powershell
.\RUN-BACKEND.ps1        # הרצת Backend
.\backend\start-server.ps1
```

### Frontend:
```powershell
.\RUN-FRONTEND.ps1       # הרצת Frontend
```

### הכל יחד:
```powershell
.\start-all.ps1          # Backend + Frontend
.\start-app.ps1          # Backend + Frontend + פתיחת דפדפן
```

---

## 📚 תיעוד נוסף

- `HOW-TO-RUN.md` - הוראות מפורטות
- `frontend/README-DEV.md` - הוראות Frontend
- `frontend/ENV-VARIABLES.md` - משתני סביבה
- `frontend/PORTS.md` - הסבר על פורטים
- `PORTS-SUMMARY.md` - סיכום פורטים

---

## ✅ בדיקה מהירה

1. **Backend:**
   ```powershell
   curl http://localhost:8000/health
   # צריך להחזיר: {"status":"healthy"}
   ```

2. **Frontend:**
   - פתח: http://localhost:5173 (Development)
   - או: http://localhost:3000 (Docker)

---

## 🐛 פתרון בעיות

### Backend לא רץ?
- ודא שיש קובץ `.env` ב-`backend/`
- ודא ש-PostgreSQL ו-Redis רצים
- ראה: `backend/check-health.ps1`

### Frontend לא רץ?
- ודא שיש קובץ `.env` ב-`frontend/`
- ודא ש-`VITE_API_URL` נכון (localhost:8000 או backend:8000)
- ראה: `frontend/README-DEV.md`

### שגיאת CORS?
- ודא שה-Backend רץ
- ודא ש-CORS מוגדר ב-`backend/app/main.py`
