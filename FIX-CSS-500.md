# תיקון שגיאת 500 ב-index.css

## 🐛 הבעיה:
`GET http://localhost:3000/src/index.css net::ERR_ABORTED 500` - Vite לא מצליח לעבד את הקובץ CSS.

## ✅ מה תוקן:

### 1. יצירת postcss.config.cjs
- **לפני:** `postcss.config.js` (ES modules) - לא עובד עם Vite + type: "module"
- **אחרי:** `postcss.config.cjs` (CommonJS) - עובד נכון

### 2. הסרת כפילות
- הסרתי `import './index.css'` מ-`App.tsx` (נשאר רק ב-`main.tsx`)

## 🔄 מה לעשות עכשיו:

### 1. עצור את Vite (Ctrl+C בחלון PowerShell של Frontend)

### 2. הרץ מחדש:
```powershell
cd frontend
npm run dev
```

### 3. רענן את הדף (F5)

## ✅ עכשיו צריך לעבוד!

Vite אמור למצוא את `postcss.config.cjs` אוטומטית ולעבד את ה-CSS נכון.

## 🐛 אם עדיין יש שגיאה:

1. **ודא ש-Tailwind CSS מותקן:**
```powershell
cd frontend
npm install
```

2. **בדוק את הקונסול של Vite** - מה השגיאה המדויקת?

3. **נסה למחוק cache:**
```powershell
cd frontend
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
npm run dev
```
