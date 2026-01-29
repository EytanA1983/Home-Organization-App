# תיקון שגיאת index.css

## 🔍 הבעיה:
שגיאה בקובץ `index.css` - כנראה Tailwind CSS לא מותקן או לא מוגדר נכון.

## ✅ פתרון:

### 1. התקן את התלויות:
```powershell
cd frontend
npm install
```

### 2. ודא שהקבצים קיימים:
- ✓ `tailwind.config.ts` - קיים
- ✓ `postcss.config.js` - קיים
- ✓ `index.css` - קיים

### 3. אם עדיין יש שגיאה:
- בדוק את הקונסול של Vite - מה השגיאה המדויקת?
- ודא ש-Tailwind CSS מותקן: `npm list tailwindcss`

## 📝 מה הקובץ צריך להכיל:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&display=swap');

html, body, #root {
  @apply h-full text-gray-800 bg-cream;
  font-family: 'Assistant', sans-serif;
}

.btn {
  @apply px-4 py-2 rounded-lg transition-colors font-medium;
}

.btn-sky {
  @apply bg-sky text-white hover:bg-sky/90;
}

.btn-red {
  @apply bg-red-500 text-white hover:bg-red-600;
}
```

## 🚀 אם יש שגיאת קומפילציה:

1. עצור את Vite (Ctrl+C)
2. הרץ: `npm install`
3. הרץ מחדש: `npm run dev`
