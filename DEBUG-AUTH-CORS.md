# 🔍 דיבוג בעיות אימות ו-CORS

## איך לבדוק בעיות אימות (Authentication)

### 1. בדיקת Token ב-Console

פתח את **DevTools** (F12) → **Console** והרץ:

```javascript
localStorage.getItem('token')
```

**תוצאות אפשריות:**
- ✅ **מחרוזת (JWT)**: Token קיים ונשמר
- ❌ **`null`**: Token לא קיים - צריך להתחבר
- ❌ **`undefined`**: Token לא נשמר - בדוק את תהליך ההתחברות

### 2. בדיקת Network Requests

פתח **DevTools** → **Network** → רענן את הדף (F5)

#### אם אתה רואה קריאות ל-`/api/rooms` שמחזירות **401 Unauthorized**:

**הבעיה:** ה-token לא נשמר/לא נשלח

**פתרונות:**
1. **ודא שה-token נשמר אחרי התחברות:**
   ```javascript
   // ב-Console, אחרי התחברות:
   localStorage.getItem('token')  // צריך להחזיר JWT
   ```

2. **ודא שה-token נשלח בבקשות:**
   - פתח **Network** → בחר בקשה ל-`/api/rooms`
   - לחץ על **Headers**
   - חפש `Authorization: Bearer <token>`
   - אם חסר - ה-interceptor לא עובד

3. **בדוק את `frontend/src/api.ts`:**
   ```typescript
   api.interceptors.request.use((config) => {
     const token = localStorage.getItem('token');
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
     return config;
   });
   ```

#### אם אתה רואה **404 Not Found**:

**הבעיה:** הנתיב אינו קיים

**פתרונות:**
1. **ודא שה-router מוגדר נכון:**
   - בדוק ב-`backend/app/main.py` שהנתיב `/api/rooms` קיים
   - בדוק שהנתיב מתחיל ב-`/api` (לא רק `/rooms`)

2. **בדוק את ה-baseURL ב-`frontend/src/api.ts`:**
   ```typescript
   baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
   ```

3. **ודא שה-Backend רץ:**
   ```powershell
   curl http://localhost:8000/health
   ```

#### אם יש **CORS Error** (Access-Control-Allow-Origin):

**הבעיה:** ה-CORS middleware ב-FastAPI חסר/לא מרשה את המקור

**פתרונות:**

1. **בדוק את `backend/app/main.py`:**
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=[
           "http://localhost:3000",
           "http://localhost:5173",
           "http://127.0.0.1:3000",
           "http://127.0.0.1:5173",
           *settings.CORS_ORIGINS,
       ],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

2. **ודא שהמקור שלך ברשימה:**
   - Development: `http://localhost:5173` או `http://127.0.0.1:5173`
   - Production: `http://localhost:3000` או `http://127.0.0.1:3000`

3. **בדוק את `backend/app/config.py`:**
   ```python
   CORS_ORIGINS: list[str] = Field(
       default=["http://localhost:3000", "http://localhost:5173"],
       description="Allowed CORS origins"
   )
   ```

4. **הפעל מחדש את ה-Backend** אחרי שינויים ב-CORS

---

## 🔧 בדיקות נוספות

### בדיקת Token Validity

אם ה-token קיים אבל עדיין מקבלים 401:

```javascript
// ב-Console:
const token = localStorage.getItem('token');
if (token) {
  // פענח את ה-token (JWT) - רק לצפייה, לא לשימוש
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Token payload:', payload);
  console.log('Token expires:', new Date(payload.exp * 1000));
}
```

### בדיקת API Response

```javascript
// ב-Console, נסה קריאה ישירה:
fetch('http://localhost:8000/api/rooms', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### בדיקת CORS Headers

פתח **Network** → בחר בקשה → **Headers** → חפש:

- ✅ `Access-Control-Allow-Origin: http://localhost:5173`
- ✅ `Access-Control-Allow-Credentials: true`
- ✅ `Access-Control-Allow-Methods: *`

אם חסרים - ה-CORS middleware לא עובד.

---

## 🐛 בעיות נפוצות ופתרונות

### בעיה: "401 Unauthorized" אחרי התחברות

**סיבות אפשריות:**
1. Token לא נשמר ב-`localStorage`
2. Token לא נשלח ב-Headers
3. Token פג תוקף
4. Backend לא מקבל את ה-token

**פתרון:**
```javascript
// ב-Console, בדוק:
console.log('Token:', localStorage.getItem('token'));

// נסה להתחבר שוב
// אחרי התחברות, בדוק שוב:
console.log('Token after login:', localStorage.getItem('token'));
```

### בעיה: "CORS policy: No 'Access-Control-Allow-Origin' header"

**סיבות אפשריות:**
1. CORS middleware לא מוגדר
2. המקור לא ברשימת ה-allowed origins
3. Backend לא רץ

**פתרון:**
1. ודא ש-`backend/app/main.py` כולל את ה-CORS middleware
2. ודא שהמקור שלך ברשימה (`localhost:5173` או `localhost:3000`)
3. הפעל מחדש את ה-Backend

### בעיה: "404 Not Found" על `/api/rooms`

**סיבות אפשריות:**
1. הנתיב לא קיים ב-router
2. ה-baseURL לא נכון
3. Backend לא רץ

**פתרון:**
1. בדוק ב-`backend/app/main.py` שהנתיב `/api/rooms` קיים
2. בדוק את `frontend/src/api.ts` - `baseURL` נכון?
3. בדוק שה-Backend רץ: `curl http://localhost:8000/health`

---

## ✅ Checklist לבדיקה

- [ ] Token קיים ב-`localStorage.getItem('token')`
- [ ] Token נשלח ב-Headers (`Authorization: Bearer <token>`)
- [ ] Backend רץ על `http://localhost:8000`
- [ ] CORS middleware מוגדר ב-`backend/app/main.py`
- [ ] המקור שלך ברשימת ה-allowed origins
- [ ] הנתיב `/api/rooms` קיים ב-router
- [ ] `VITE_API_URL` מוגדר נכון ב-`.env`

---

## 📚 קבצים רלוונטיים

- `frontend/src/api.ts` - Axios interceptor לשליחת token
- `frontend/src/pages/LoginPage.tsx` - שמירת token אחרי התחברות
- `backend/app/main.py` - CORS middleware
- `backend/app/config.py` - CORS_ORIGINS settings

---

## 🚀 איך לבדוק מהר

1. **פתח DevTools** (F12)
2. **Console** → הרץ: `localStorage.getItem('token')`
3. **Network** → רענן את הדף → בדוק בקשות ל-`/api/rooms`
4. **Headers** → בדוק `Authorization` header
5. **Response** → בדוק status code (200, 401, 404, CORS error)

---

## 💡 טיפים

- **נקה את ה-cache** אם יש בעיות: `localStorage.clear()`
- **התחבר שוב** אחרי ניקוי cache
- **בדוק את ה-Console** - יש שגיאות JavaScript?
- **בדוק את ה-Network** - יש בקשות שנכשלו?
