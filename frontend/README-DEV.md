# הוראות הרצה - Development

## דרישות מוקדמות

1. **Node.js** (גרסה 18+)
2. **npm** או **yarn**
3. **Backend** צריך לרוץ על `http://localhost:8000`

## התקנה

```bash
cd frontend
npm install
```

## הרצה

```bash
npm run dev
```

האפליקציה תרוץ על: **http://localhost:5173** (פורט ברירת מחדל של Vite)

> **הערה**: ב-Production (Docker), האפליקציה רצה על פורט `3000` עם NGINX.
> ראה `PORTS.md` לפרטים נוספים.

## משתני סביבה

צור קובץ `.env` בתיקיית `frontend/`:

### Development (ללא Docker):
```env
VITE_API_URL=http://localhost:8000      # אם רץ עם Vite
VITE_VAPID_PUBLIC_KEY=YOUR_PUBLIC_KEY
```

### Production (עם Docker Compose):
```env
VITE_API_URL=http://backend:8000       # בתוך Docker network, השירותים מתקשרים בשמות השירותים
VITE_VAPID_PUBLIC_KEY=YOUR_PUBLIC_KEY
```

> **הערה**: ב-Docker Compose, השירותים מתקשרים דרך שמות השירותים (`backend`, `frontend`, וכו'), לא דרך `localhost`.

## פתרון בעיות

### שגיאת CORS
ודא שה-backend רץ ו-CORS מוגדר נכון ב-`backend/app/main.py`

### שגיאת API
ודא שה-backend רץ על `http://localhost:8000` ושהקובץ `.env` מוגדר נכון

### שגיאת Tailwind
ודא ש-`tailwind.config.ts` קיים ומוגדר נכון

### שגיאת TypeScript
הרץ:
```bash
npm run build
```
כדי לראות שגיאות TypeScript
