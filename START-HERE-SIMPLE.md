# הוראות הפעלה פשוטות

## 📍 חשוב: ודא שאתה בתיקיית הפרויקט הנכונה!

הנתיב הנכון הוא:
```
C:\Users\maore\git\סידור וארגון הבית - אלי מאור
```

## 🚀 הפעלה מהירה

### 1. פתח PowerShell בתיקיית הפרויקט

```powershell
cd "C:\Users\maore\git\סידור וארגון הבית - אלי מאור"
```

### 2. הרץ את הסקריפטים

**Backend:**
```powershell
.\RUN-BACKEND.ps1
```

**Frontend (בחלון נפרד):**
```powershell
.\RUN-FRONTEND.ps1
```

### 3. פתח בדפדפן

**Development (ללא Docker):**
- Frontend: http://localhost:5173
- Backend API Docs: http://localhost:8000/docs

**Production (עם Docker Compose):**
- Frontend: http://localhost:3000
- Backend API Docs: http://localhost:8000/docs

---

## 🔧 אם יש שגיאות

### Backend - "No module named 'app'"
```powershell
cd backend
$env:PYTHONPATH = (Get-Location).Path
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Backend - "No module named 'fastapi'"
```powershell
cd backend
pip install -r requirements.txt
```

### Frontend - "Missing script: dev"
```powershell
cd frontend
npm install
npm run dev
```

---

## ✅ בדיקה מהירה

אחרי שהשרתים רצים, פתח:
- **Development**: http://localhost:5173 (Frontend)
- **Production (Docker)**: http://localhost:3000 (Frontend)
- http://localhost:8000/docs (Backend API)
