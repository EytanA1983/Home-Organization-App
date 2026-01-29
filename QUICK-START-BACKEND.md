# הפעלת Backend - הוראות מהירות

## הבעיה:
`ModuleNotFoundError: No module named 'app'` - Python לא מוצא את המודול `app`.

## הפתרון:

### 1. עבור לתיקיית backend:
```powershell
cd "C:\Users\maore\git\סידור וארגון הבית - אלי מאור\backend"
```

### 2. הגדר PYTHONPATH והרץ:
```powershell
$env:PYTHONPATH = (Get-Location).Path
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 3. או השתמש בסקריפט:
לחץ כפול על `RUN-BACKEND.ps1` בתיקיית הפרויקט הראשית.

### 4. פתח בדפדפן:
http://localhost:8000/docs

---

## אם יש שגיאות:

**"No module named 'fastapi'":**
```powershell
cd backend
pip install fastapi uvicorn sqlalchemy pydantic pydantic-settings python-dotenv
```

**"No module named 'app'":**
- ודא שאתה בתיקיית `backend`
- ודא ש-PYTHONPATH מוגדר: `$env:PYTHONPATH = (Get-Location).Path`
