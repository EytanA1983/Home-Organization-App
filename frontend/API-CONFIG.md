# API Configuration - Axios Setup

## ✅ הקונפיגורציה הנוכחית תקינה

### `frontend/src/api.ts`

```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
});
```

## ⚠️ חשוב: baseURL חייב להיות URL מלא

### ✅ נכון:
```typescript
baseURL: 'http://localhost:8000'  // Development
baseURL: 'http://backend:8000'    // Docker
```

### ❌ שגוי:
```typescript
baseURL: '/api'        // שגיאה! לא URL מלא
baseURL: '/api/'       // שגיאה! לא URL מלא
```

## למה?

1. **Axios v0.27+**: אם `baseURL` הוא relative path, זה עלול לגרום לבעיות
2. **הנתיבים כוללים `/api`**: כל הנתיבים בקוד כוללים את ה-prefix `/api`:
   - `api.get('/api/rooms')` → `http://localhost:8000/api/rooms`
   - `api.post('/api/auth/login')` → `http://localhost:8000/api/auth/login`

## איך זה עובד?

### Development:
```typescript
// .env
VITE_API_URL=http://localhost:8000

// בקוד:
api.get('/api/rooms')
// → http://localhost:8000/api/rooms ✅
```

### Production (Docker):
```typescript
// .env
VITE_API_URL=http://backend:8000

// בקוד:
api.get('/api/rooms')
// → http://backend:8000/api/rooms ✅
```

## בדיקה

### ✅ הקוד הנוכחי נכון:
- `baseURL` מוגדר כ-`http://localhost:8000` (לא `/api`)
- כל הנתיבים כוללים `/api` prefix
- האינטרספטור מוסיף token רק אם קיים

### דוגמאות שימוש:
```typescript
// HomePage.tsx
api.get('/api/rooms')
// → http://localhost:8000/api/rooms

// LoginPage.tsx
api.post('/api/auth/login', ...)
// → http://localhost:8000/api/auth/login
```

## אם יש בעיות

### בעיה: "Network Error" או CORS
- ודא ש-`VITE_API_URL` מוגדר כ-URL מלא (לא `/api`)
- בדוק שה-backend רץ על `http://localhost:8000`

### בעיה: "404 Not Found"
- ודא שהנתיבים כוללים `/api` prefix
- בדוק שה-backend routes מוגדרים עם `/api` prefix

## סיכום

| מצב | baseURL | דוגמה לנתיב | תוצאה |
|-----|---------|-------------|--------|
| **Development** | `http://localhost:8000` | `/api/rooms` | `http://localhost:8000/api/rooms` ✅ |
| **Docker** | `http://backend:8000` | `/api/rooms` | `http://backend:8000/api/rooms` ✅ |
| **❌ שגוי** | `/api` | `/api/rooms` | `/api/api/rooms` ❌ |
