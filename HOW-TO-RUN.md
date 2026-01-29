# 🚀 איך להריץ את הפרויקט

## שלב 1: Backend (FastAPI)

פתח **PowerShell** בתיקיית הפרויקט:

```powershell
cd backend
```

### אופציה A: עם הסקריפט (הכי קל)
```powershell
.\start-server.ps1
```

### אופציה B: עם Poetry
```powershell
poetry run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### אופציה C: עם Python ישירות
```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**השרת ירוץ על:** http://localhost:8000

**API Documentation:** http://localhost:8000/docs

---

## שלב 2: Frontend (React + Vite)

פתח **PowerShell נוסף** (חלון חדש):

```powershell
cd frontend
npm run dev          # Vite (5173)
```

**האפליקציה תרוץ על:** http://localhost:5173

> **או, אם מריצים דרך Docker:**
> ```powershell
> docker compose up --build
> ```
> **האפליקציה תרוץ על:** http://localhost:3000

---

## בדיקה מהירה

1. פתח בדפדפן: http://localhost:8000/docs
   - אם אתה רואה את Swagger UI ✅ - Backend עובד!

2. פתח בדפדפן: http://localhost:5173
   - אם אתה רואה את האפליקציה ✅ - Frontend עובד!

---

## פתרון בעיות

### Backend לא רץ?

1. **ודא שיש קובץ `.env` ב-`backend/`**
   - הסקריפט `start-server.ps1` יוצר אותו אוטומטית
   - או צור ידנית עם:
     ```
     SECRET_KEY=dev-secret-key-change-in-production
     ```

2. **ודא ש-Python מותקן:**
   ```powershell
   python --version
   ```

3. **אם משתמש ב-Poetry, התקן תלויות:**
   ```powershell
   cd backend
   poetry install
   ```

### Frontend לא רץ?

1. **התקן תלויות:**
   ```powershell
   cd frontend
   npm install
   ```

2. **ודא ש-Node.js מותקן:**
   ```powershell
   node --version
   ```

---

## סדר פעולות מלא

```powershell
# 1. Backend (חלון 1)
cd backend
.\start-server.ps1

# 2. Frontend (חלון 2 - חדש)
cd frontend
npm run dev

# 3. פתח בדפדפן
# http://localhost:5173 - Frontend
# http://localhost:8000/docs - API Docs
```
