# משתני סביבה - Environment Variables

## קובץ `.env`

צור קובץ `.env` בתיקיית `frontend/` (או העתק מ-`.env.example`):

## משתנים נדרשים

### `VITE_API_URL`

כתובת ה-API של ה-Backend. **תלוי במצב הרצה:**

#### Development (ללא Docker):
```env
VITE_API_URL=http://localhost:8000
```
**מתי להשתמש:**
- כשמריצים `npm run dev` (Vite dev server)
- כשמריצים Backend מקומית על `http://localhost:8000`

#### Production (עם Docker Compose):
```env
VITE_API_URL=http://backend:8000
```
**מתי להשתמש:**
- כשמריצים `docker-compose up`
- בתוך Docker network, השירותים מתקשרים דרך **שמות השירותים** (`backend`, `frontend`, וכו'), לא דרך `localhost`

> **הערה חשובה**: ב-Docker Compose, כל השירותים נמצאים באותו network, ולכן הם מתקשרים דרך שמות השירותים המוגדרים ב-`docker-compose.yml`.

### `VITE_VAPID_PUBLIC_KEY`

מפתח ציבורי ל-Web Push Notifications.

```env
VITE_VAPID_PUBLIC_KEY=YOUR_PUBLIC_KEY
```

**איך להשיג:**
1. רץ את הסקריפט: `python backend/scripts/generate_vapid_keys.py`
2. העתק את ה-Public Key ל-`.env`
3. ודא שהוא זהה ל-`VAPID_PUBLIC_KEY` ב-`backend/.env`

## דוגמה לקובץ `.env` מלא

### Development:
```env
VITE_API_URL=http://localhost:8000
VITE_VAPID_PUBLIC_KEY=YOUR_PUBLIC_KEY
```

### Production (Docker):
```env
VITE_API_URL=http://backend:8000
VITE_VAPID_PUBLIC_KEY=YOUR_PUBLIC_KEY
```

## איך ליצור קובץ `.env`

```powershell
cd frontend
# העתק מ-.env.example (אם קיים)
Copy-Item .env.example .env

# או צור ידנית:
@"
VITE_API_URL=http://localhost:8000
VITE_VAPID_PUBLIC_KEY=YOUR_PUBLIC_KEY
"@ | Out-File -FilePath .env -Encoding utf8
```

## פתרון בעיות

### שגיאת API: "Network Error" או "Connection refused"

1. **ודא שה-Backend רץ:**
   ```powershell
   # בדוק:
   curl http://localhost:8000/health
   ```

2. **ודא ש-`VITE_API_URL` נכון:**
   - Development: `http://localhost:8000`
   - Docker: `http://backend:8000`

3. **אם משתמש ב-Docker:**
   - ודא ש-`VITE_API_URL` מוגדר ל-`http://backend:8000` (לא `localhost`)
   - ודא שהשירות `backend` רץ: `docker-compose ps`

### שגיאת CORS

- ודא שה-Backend מוגדר לתמוך ב-CORS
- ב-`backend/app/main.py`, ודא ש-`allow_origins` כולל את כתובת ה-Frontend

## הערות

- משתני סביבה שמתחילים ב-`VITE_` נחשפים ל-client-side code
- **אל תכלול מידע רגיש** ב-`VITE_*` variables
- קובץ `.env` לא צריך להיות ב-git (מופיע ב-`.gitignore`)
