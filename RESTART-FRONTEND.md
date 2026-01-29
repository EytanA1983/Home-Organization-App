# הוראות להרצת הפרונט מחדש

## 🔄 שלבים להרצה מחדש:

### 1. עצור את השרת הקיים (אם רץ):
- לחץ `Ctrl+C` בחלון PowerShell שבו רץ `npm run dev`

### 2. נקה cache (אופציונלי אבל מומלץ):
```powershell
cd frontend
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
```

### 3. התקן תלויות (אם צריך):
```powershell
cd frontend
npm install
```

### 4. הרץ את השרת:
```powershell
cd frontend
npm run dev
```

### 5. פתח בדפדפן:
- השרת אמור לרוץ על: `http://localhost:3000`
- או על הפורט שמוצג בקונסול

## 🐛 אם יש בעיות:

### שגיאת CSS:
- ודא ש-`postcss.config.js` קיים
- ודא ש-`tailwind.config.ts` קיים
- ודא ש-`node_modules` מותקן

### שגיאת פורט תפוס:
- שנה את הפורט ב-`vite.config.ts`:
  ```typescript
  server: {
    port: 3001, // במקום 3000
  }
  ```

### שגיאת מודולים:
- מחק `node_modules` והתקן מחדש:
  ```powershell
  cd frontend
  Remove-Item -Recurse -Force node_modules
  npm install
  ```

## ✅ בדיקות:
- פתח את הקונסול של הדפדפן (F12) ובדוק שגיאות
- בדוק את הקונסול של Vite לשגיאות
- ודא שהבק-אנד רץ על פורט 8000
