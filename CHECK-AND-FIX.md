# בדיקה ותיקון - Frontend לא עובד

## 🔍 הבעיות שנמצאו ותוקנו:

### 1. ✅ תוקן: `owner_id` במקום `user_id` ב-rooms.py
הקובץ `backend/app/api/rooms.py` השתמש ב-`owner_id` אבל המודל משתמש ב-`user_id`.
**תוקן!**

### 2. ⚠️ צריך לבדוק: האם השרתים רצים?

**Backend:**
```powershell
cd "C:\Users\maore\git\סידור וארגון הבית - אלי מאור\backend"
$env:PYTHONPATH = (Get-Location).Path
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Frontend:**
```powershell
cd "C:\Users\maore\git\סידור וארגון הבית - אלי מאור\frontend"
npm run dev
```

### 3. ⚠️ צריך לבדוק: האם יש שגיאות בקונסול?

פתח את הדפדפן (http://localhost:3000) ולחץ F12:
- בדוק את ה-Console - יש שגיאות JavaScript?
- בדוק את ה-Network - יש שגיאות API (404, 500, CORS)?

### 4. ⚠️ צריך לבדוק: האם המשתמש מחובר?

האפליקציה דורשת authentication. אם אין משתמש מחובר, לא תראה חדרים.

**נסה:**
1. פתח http://localhost:8000/docs
2. נסה את `/api/auth/register` ליצירת משתמש
3. נסה את `/api/auth/login` להתחברות
4. העתק את ה-token
5. בדפדפן, פתח Console (F12) והרץ:
   ```javascript
   localStorage.setItem('token', 'YOUR_TOKEN_HERE')
   ```
6. רענן את הדף

## 🚀 צעדים לבדיקה:

1. **הרץ את שני השרתים** (Backend + Frontend)
2. **פתח http://localhost:3000**
3. **פתח את הקונסול (F12)**
4. **העתק את כל השגיאות** ושלח אותן

## 📝 מה לבדוק:

- [ ] Backend רץ על פורט 8000?
- [ ] Frontend רץ על פורט 3000?
- [ ] יש שגיאות בקונסול?
- [ ] יש שגיאות Network?
- [ ] המשתמש מחובר?
