# מדריך לפתרון שגיאות קונסול

## 🔍 איך לבדוק שגיאות:

1. **פתח את הקונסול** (F12 או Ctrl+Shift+I)
2. **עבור לטאב Console** - שם תראה שגיאות JavaScript
3. **עבור לטאב Network** - שם תראה שגיאות API (404, 500, CORS)

## 🐛 שגיאות נפוצות ופתרונות:

### 1. "Cannot read property 'X' of undefined"
**פתרון:** בדוק שהאובייקט קיים לפני השימוש בו.

### 2. "Module not found" או "Cannot find module"
**פתרון:** 
```powershell
cd frontend
npm install
```

### 3. "401 Unauthorized" או "Unauthorized"
**פתרון:** 
- המשתמש לא מחובר
- לחץ על "התחבר" ב-NavBar
- או הירשם אם אין לך חשבון

### 4. "Network Error" או "CORS policy"
**פתרון:**
- ודא שה-Backend רץ: http://localhost:8000/health
- בדוק את `backend/app/config.py` - CORS_ORIGINS כולל `http://localhost:3000`

### 5. "Failed to fetch" או "ERR_CONNECTION_REFUSED"
**פתרון:**
- Backend לא רץ
- הרץ: `cd backend; python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`

### 6. "React Hook useEffect has a missing dependency"
**פתרון:** זה רק אזהרה, לא שגיאה. אפשר להתעלם או להוסיף את ה-dependency.

## 📋 מה לשלוח כשמבקשים עזרה:

1. **העתק את כל השגיאות מהקונסול** (Console tab)
2. **העתק את השגיאות מה-Network tab** (אם יש)
3. **צילום מסך** של הקונסול (אם אפשר)

## ✅ תיקונים שבוצעי:

1. ✅ תיקון dependency warning ב-HouseView (הוסר `speak` מה-dependencies)
2. ✅ שיפור error handling ב-HomePage
3. ✅ שיפור ProtectedRoute עם loading state

## 🚀 נסה עכשיו:

1. רענן את הדף (Ctrl+F5)
2. פתח את הקונסול (F12)
3. העתק את השגיאות ושלח אותן
