# בדיקת תקינות הפרונט

## 1. בדיקת Server (Vite)

**הרץ:**
```powershell
cd frontend
npm run dev
```

**צריך לראות:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

**אם לא רואה את זה:**
- ודא ש-`node_modules` קיים: `npm install`
- נקה cache: מחק `node_modules/.vite`
- בדוק אם פורט 3000 תפוס

## 2. בדיקת ניתוב

**כל הנתיבים צריכים להיות:**
- `/login` - דף התחברות
- `/register` - דף רישום
- `/` - דף בית (מוגן)
- `/settings` - הגדרות (מוגן)
- `/calendar` - לוח שנה (מוגן)
- `/room/:roomId` - דף חדר (מוגן)
- `/auth/google/callback` - Google OAuth callback

**בדיקה:**
פתח בדפדפן:
- `http://localhost:3000/login` - צריך לראות דף התחברות
- `http://localhost:3000/register` - צריך לראות דף רישום
- `http://localhost:3000/` - צריך להפנות ל-login (אם לא מחובר)

## 3. בדיקת קבצים חסרים

**קבצים שצריכים להיות:**
- ✅ `src/main.tsx` - נקודת כניסה
- ✅ `src/App.tsx` - רכיב ראשי
- ✅ `src/index.html` - HTML ראשי
- ✅ `src/i18n/config.ts` - תצורת i18n
- ✅ `src/i18n/locales/*.json` - קבצי תרגום
- ✅ כל ה-components וה-pages

## 4. בדיקת שגיאות בקונסול

**פתח קונסול דפדפן (F12) ובדוק:**
- ❌ שגיאות אדומות
- ⚠️ אזהרות
- ℹ️ הודעות מידע

**שגיאות נפוצות:**
- `Failed to resolve import` - חסרות תלויות
- `404` על קבצים - Vite לא רץ
- `500` על קבצים - בעיה עם Vite

## 5. פתרון בעיות

**אם Vite לא רץ:**
```powershell
cd frontend
npm install
npm run dev
```

**אם יש שגיאות imports:**
```powershell
cd frontend
rm -r node_modules
npm install
```

**אם הדפדפן לא טוען:**
- נקה cache: Ctrl+Shift+R
- ודא שפותח `http://localhost:3000` (לא `/src/...`)
- בדוק את קונסול Vite - מה כתוב שם?

## 6. בדיקת Backend

**ודא שה-Backend רץ:**
```powershell
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**בדוק:**
- `http://localhost:8000/health` - צריך להחזיר `{"status":"healthy"}`
- `http://localhost:8000/docs` - צריך לראות Swagger UI

## 7. בדיקת Proxy

**Vite צריך לכוון ל-Backend:**
- `/api/*` → `http://localhost:8000`
- `/ws/*` → `ws://localhost:8000`

**בדוק ב-`vite.config.ts`:**
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  }
}
```
