# מה לבדוק בקונסול - Backend Console Checklist

## ✅ מה צריך לראות בקונסול:

### 1. הפעלה מוצלחת:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### 2. אין Traceback/Errors:
- ❌ **אם יש Traceback** - שלח את השגיאה המלאה
- ✅ **אם אין שגיאות** - הכל תקין!

### 3. CORS מוגדר:
CORS כבר מוגדר ב-`backend/app/main.py` (שורות 31-38):
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**CORS Origins מוגדרים ב-`config.py`:**
- `http://localhost:3000` ✅ (Frontend)
- `http://localhost:5173` ✅ (Vite default)
- `http://localhost:8000` ✅ (Backend)
- `https://eli-maor.com` ✅ (Production)

## 🔍 בדיקות נוספות:

### 1. בדוק Health Endpoint:
```bash
curl http://localhost:8000/health
```
**צריך להחזיר:** `{"status":"healthy"}`

### 2. בדוק Root Endpoint:
```bash
curl http://localhost:8000/
```
**צריך להחזיר:** `{"message":"אלי מאור – סידור וארגון הבית API",...}`

### 3. בדוק API Docs:
פתח בדפדפן: `http://localhost:8000/docs`
**צריך לראות:** Swagger UI עם כל ה-API endpoints

### 4. בדוק CORS:
פתח קונסול דפדפן (F12) ובדוק:
- אין שגיאות CORS
- Requests ל-`/api/*` עוברים בהצלחה

## ⚠️ שגיאות נפוצות:

### 1. Database Connection Error:
```
sqlalchemy.exc.OperationalError: could not connect to server
```
**פתרון:** ודא ש-PostgreSQL רץ או שנה ל-SQLite

### 2. Import Error:
```
ModuleNotFoundError: No module named 'app'
```
**פתרון:** ודא שאתה מריץ מ-backend directory

### 3. Port Already in Use:
```
ERROR:    [Errno 48] Address already in use
```
**פתרון:** עצור את השרת הקודם או שנה פורט

## 📋 סיכום:

✅ **CORS מוגדר** - אין צורך להוסיף
✅ **Uvicorn רץ** - הכל תקין
✅ **אין Traceback** - הכל תקין

**הכל מוכן!** 🎉
