# פתרון בעיות - Frontend לא עובד

## 🔍 בדיקות ראשוניות

### 1. האם השרתים רצים?

**Backend:**
```powershell
# פתח PowerShell והרץ:
cd "C:\Users\maore\git\סידור וארגון הבית - אלי מאור\backend"
$env:PYTHONPATH = (Get-Location).Path
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Frontend:**
```powershell
# פתח PowerShell נפרד והרץ:
cd "C:\Users\maore\git\סידור וארגון הבית - אלי מאור\frontend"
npm install  # אם צריך
npm run dev
```

### 2. בדוק שהשרתים עובדים:

פתח בדפדפן:
- Backend: http://localhost:8000/docs (צריך לראות Swagger UI)
- Frontend: http://localhost:3000 (צריך לראות את האפליקציה)

### 3. פתח את הקונסול בדפדפן (F12)

בדוק אם יש שגיאות:
- שגיאות JavaScript
- שגיאות Network (CORS, 404, 500)
- שגיאות בקומפילציה

## 🐛 בעיות נפוצות

### בעיה: "Cannot GET /" או דף ריק

**פתרון:**
1. ודא ש-Vite רץ: `npm run dev`
2. בדוק את הקונסול (F12) - יש שגיאות?
3. בדוק את ה-terminal - יש שגיאות קומפילציה?

### בעיה: "Network Error" או CORS errors

**פתרון:**
1. ודא שה-backend רץ על פורט 8000
2. בדוק את `backend/app/config.py` - CORS_ORIGINS כולל `http://localhost:5173` (Development) או `http://localhost:3000` (Docker)
3. נסה לרענן את הדף (Ctrl+F5)
4. ראה `DEBUG-AUTH-CORS.md` לבדיקה מפורטת של CORS ו-Authentication

### בעיה: "No rooms available" או רשימה ריקה

**פתרון:**
1. בדוק את הקונסול - יש שגיאות API?
2. ודא שה-backend רץ
3. נסה לגשת ישירות: http://localhost:8000/api/rooms
4. אולי צריך להתחבר קודם (register/login)
5. **בדוק Token:**
   - פתח DevTools (F12) → Console
   - הרץ: `localStorage.getItem('token')`
   - אם `null` - צריך להתחבר
   - ראה `DEBUG-AUTH-CORS.md` לבדיקה מפורטת

### בעיה: שגיאות TypeScript

**פתרון:**
```powershell
cd frontend
npm install
npm run build  # יראה שגיאות
```

### בעיה: "Module not found"

**פתרון:**
```powershell
cd frontend
rm -r node_modules  # או del /s node_modules ב-Windows
npm install
```

## ✅ בדיקות נוספות

### בדוק את הקבצים החשובים:

1. `frontend/src/App.tsx` - קיים?
2. `frontend/src/main.tsx` - קיים?
3. `frontend/package.json` - יש "dev" script?
4. `frontend/vite.config.ts` - port 3000?

### בדוק את ה-Backend:

1. `backend/app/main.py` - קיים?
2. `backend/app/config.py` - CORS_ORIGINS כולל localhost:3000?
3. `.env` קיים ב-backend?

## 🚀 הפעלה מהירה

```powershell
# Terminal 1 - Backend
cd "C:\Users\maore\git\סידור וארגון הבית - אלי מאור\backend"
$env:PYTHONPATH = (Get-Location).Path
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Terminal 2 - Frontend
cd "C:\Users\maore\git\סידור וארגון הבית - אלי מאור\frontend"
npm run dev
```

## 📞 אם עדיין לא עובד

1. פתח את הקונסול בדפדפן (F12)
2. העתק את כל השגיאות
3. בדוק את ה-terminal של Vite - מה השגיאות?
4. בדוק את ה-terminal של Backend - מה השגיאות?
