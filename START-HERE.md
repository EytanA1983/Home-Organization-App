# 🚀 הוראות הרצה - שלב אחר שלב

## ⚠️ חשוב: הרץ בשני חלונות PowerShell נפרדים!

---

## חלון 1: Backend

פתח **PowerShell** והרץ:

```powershell
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**תראה משהו כמו:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

✅ אם אתה רואה את זה - Backend עובד!

---

## חלון 2: Frontend

פתח **PowerShell נוסף** (חלון חדש!) והרץ:

```powershell
cd frontend
npm run dev          # Vite (5173)
```

> **או, אם מריצים דרך Docker:**
> ```powershell
> docker compose up --build
> ```
> **האפליקציה תרוץ על:** http://localhost:3000

**תראה משהו כמו:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

✅ אם אתה רואה את זה - Frontend עובד!

---

## פתח בדפדפן

1. **Frontend**: http://localhost:5173
2. **API Docs**: http://localhost:8000/docs

---

## אם יש שגיאות:

### Backend - "ModuleNotFoundError"
```powershell
cd backend
pip install -r requirements.txt
```

### Frontend - "vite not found"
```powershell
cd frontend
npm install
```

### Backend - "No .env file"
הקובץ `.env` ייווצר אוטומטית, או צור ידנית:
```powershell
cd backend
echo "SECRET_KEY=dev-secret-key-change-in-production" > .env
```

---

## בדיקה מהירה

פתח בדפדפן:
- http://localhost:8000/health → אמור להחזיר `{"status":"healthy"}`
- http://localhost:8000/docs → אמור להציג Swagger UI
- http://localhost:5173 → אמור להציג את האפליקציה
