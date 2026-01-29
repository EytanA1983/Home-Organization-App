# תיקונים שבוצעו

## ✅ תיקון 1: `owner_id` → `user_id` ב-rooms.py
הקובץ `backend/app/api/rooms.py` השתמש ב-`owner_id` אבל המודל משתמש ב-`user_id`.
**תוקן!**

## ✅ תיקון 2: `get_db_session` → `get_db` ב-rooms.py
הקובץ `backend/app/api/rooms.py` השתמש ב-`get_db_session` אבל הפונקציה נקראת `get_db`.
**תוקן!**

## 🚀 עכשיו צריך:

1. **הרץ את Backend מחדש:**
```powershell
cd "C:\Users\maore\git\סידור וארגון הבית - אלי מאור\backend"
$env:PYTHONPATH = (Get-Location).Path
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

2. **הרץ את Frontend:**
```powershell
cd "C:\Users\maore\git\סידור וארגון הבית - אלי מאור\frontend"
npm run dev
```

3. **פתח בדפדפן:**
- http://localhost:3000

4. **אם עדיין לא עובד:**
- פתח את הקונסול (F12)
- העתק את כל השגיאות
- שלח אותן
