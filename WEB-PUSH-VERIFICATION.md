# אימות רישום נוטיפיקציות (Web Push) - מדריך בדיקה

## 4.1 רישום נוטיפיקציות (Web Push)

### שלב 1: בדיקת Service Worker
**לפני ההרשמה, ודא ש-Service Worker נרשם:**

1. **פתח DevTools** (F12)
2. **עבור לטאב Application** (Chrome) או **Application** (Edge)
3. **בחר Service Workers** בתפריט השמאלי
4. **ודא שרואים:**
   - ✅ Service Worker רשום: `service-worker.js`
   - ✅ Status: **activated and is running**
   - ✅ Scope: `/`

**אם Service Worker לא רשום:**
- בדוק את `frontend/src/main.tsx` - שורות 17-26
- בדוק ש-`/service-worker.js` קיים ב-`frontend/public/service-worker.js`
- בדוק ב-Console אם יש שגיאות רישום

### שלב 2: בדיקת VAPID Keys
**ודא ש-VAPID keys מוגדרות:**

1. **בדוק ב-Backend:**
   ```bash
   # בדוק את backend/.env
   VAPID_PUBLIC_KEY=...
   VAPID_PRIVATE_KEY=...
   ```

2. **בדוק ב-Frontend:**
   ```bash
   # בדוק את frontend/.env או frontend/.env.local
   VITE_VAPID_PUBLIC_KEY=...
   ```

3. **בדוק endpoint:**
   - פתח: `http://localhost:8000/api/vapid-public-key`
   - צריך להחזיר: `{"public_key": "..."}`

**אם VAPID keys חסרות:**
- רץ: `python backend/scripts/generate_vapid_keys.py`
- העתק את ה-keys ל-`.env` files

### שלב 3: בדיקת registerPush() Function
**הפונקציה נמצאת ב-`frontend/src/utils/push.ts`:**

**מה הפונקציה עושה:**
1. ✅ בודקת תמיכה ב-Service Worker ו-PushManager
2. ✅ מחכה ל-Service Worker להיות ready
3. ✅ יוצרת subscription עם VAPID public key
4. ✅ שולחת subscription ל-backend: `POST /api/notifications/subscribe`
5. ✅ שומרת endpoint ב-localStorage
6. ✅ מציגה toast success/error

**בדיקת הקוד:**
- שורה 4-27: `registerPush()` function
- שורה 13: `applicationServerKey` משתמש ב-`VITE_VAPID_PUBLIC_KEY`
- שורה 16: קריאה ל-`/api/notifications/subscribe`

### שלב 4: בדיקת Backend Endpoint
**ה-endpoint נמצא ב-`backend/app/api/notifications.py`:**

**מה ה-endpoint עושה:**
1. ✅ מקבל subscription object מ-frontend
2. ✅ בודק אם subscription כבר קיים (לפי endpoint)
3. ✅ שומר subscription ב-DB (NotificationSubscription)
4. ✅ מחזיר `{"detail": "registered"}` או `{"detail": "already registered"}`

**בדיקת הקוד:**
- שורה 9: Router prefix: `/api/notifications`
- שורה 24-56: `POST /subscribe` endpoint
- שורה 31: דורש authentication (`get_current_user`)
- שורה 48-55: יוצר NotificationSubscription ב-DB

**בדיקת Router ב-main.py:**
- שורה 105: `app.include_router(notifications.router)`
- ה-endpoint המלא: `POST /api/notifications/subscribe`

### שלב 5: בדיקת Settings Component
**ה-component נמצא ב-`frontend/src/components/Settings.tsx`:**

**מה ה-component עושה:**
1. ✅ מציג כפתור "הפעל התראות" / "בטל התראות"
2. ✅ בודק subscription קיים ב-useEffect (שורות 39-51)
3. ✅ קורא ל-`registerPush()` כשלוחצים "הפעל התראות"
4. ✅ קורא ל-`unregisterPush()` כשלוחצים "בטל התראות"

**בדיקת הקוד:**
- שורה 11-20: `enablePush()` function
- שורה 13: קורא ל-`registerPush()`
- שורה 39-51: `useEffect` בודק subscription קיים

### שלב 6: בדיקת תהליך ההרשמה
**לאחר לחיצה על "הפעל התראות":**

1. **פתח DevTools → Network**
2. **לחץ על "הפעל התראות" ב-Settings**
3. **בדוק את הקריאות:**
   - ✅ `POST /api/notifications/subscribe` → צריך להחזיר 200 OK
   - ✅ Request body צריך לכלול:
     ```json
     {
       "endpoint": "https://fcm.googleapis.com/fcm/send/...",
       "keys": {
         "p256dh": "...",
         "auth": "..."
       }
     }
     ```

**אם הקריאה נכשלת:**
- **401 Unauthorized** → בעיית token (צריך להתחבר מחדש)
- **400 Bad Request** → בעיה ב-subscription format
- **500 Internal Server Error** → בעיה ב-backend (בדוק logs)

### שלב 7: בדיקת Service Workers & Push Subscriptions
**לאחר הרשמה מוצלחת:**

1. **פתח DevTools → Application**
2. **בחר Service Workers** בתפריט השמאלי
3. **לחץ על "Push"** (או "Push Subscriptions")
4. **ודא שרואים:**
   - ✅ Subscription קיים
   - ✅ Endpoint: `https://fcm.googleapis.com/fcm/send/...`
   - ✅ Keys: `p256dh` ו-`auth` מוצגים

**בדיקה נוספת:**
- פתח Console
- רץ:
  ```javascript
  navigator.serviceWorker.ready.then(reg => {
    reg.pushManager.getSubscription().then(sub => {
      console.log('Subscription:', sub);
      if (sub) {
        console.log('Endpoint:', sub.endpoint);
        console.log('Keys:', sub.getKey('p256dh'), sub.getKey('auth'));
      }
    });
  });
  ```

### שלב 8: בדיקת localStorage
**לאחר הרשמה מוצלחת:**

1. **פתח DevTools → Application**
2. **בחר Local Storage** בתפריט השמאלי
3. **בחר את ה-domain** (`http://localhost:5178`)
4. **ודא שרואים:**
   - ✅ `push_endpoint`: `https://fcm.googleapis.com/fcm/send/...`

**בדיקה נוספת:**
- פתח Console
- רץ:
  ```javascript
  localStorage.getItem('push_endpoint')
  ```
  - צריך להחזיר את ה-endpoint

### שלב 9: בדיקת Database
**לאחר הרשמה מוצלחת:**

1. **חבר למסד הנתונים:**
   ```bash
   docker exec -it eli_maor_db psql -U postgres -d eli_maor
   ```

2. **בדוק את הטבלה:**
   ```sql
   SELECT * FROM notification_subscriptions;
   ```

3. **ודא שרואים:**
   - ✅ שורה עם `user_id` של המשתמש
   - ✅ `endpoint` תואם ל-localStorage
   - ✅ `p256dh` ו-`auth` מוגדרים

### שלב 10: בדיקת Unregister
**לאחר לחיצה על "בטל התראות":**

1. **פתח DevTools → Network**
2. **לחץ על "בטל התראות" ב-Settings**
3. **בדוק את הקריאות:**
   - ✅ `POST /api/notifications/unsubscribe` → צריך להחזיר 200 OK
   - ✅ Request body צריך לכלול:
     ```json
     {
       "endpoint": "https://fcm.googleapis.com/fcm/send/..."
     }
     ```

4. **בדוק ש-localStorage נוקה:**
   - `localStorage.getItem('push_endpoint')` → צריך להחזיר `null`

5. **בדוק ש-Service Worker subscription נמחק:**
   - DevTools → Application → Service Workers → Push
   - לא צריך להיות subscription

## סיכום - Checklist

- [ ] Service Worker נרשם (DevTools → Application → Service Workers)
- [ ] VAPID keys מוגדרות (backend/.env ו-frontend/.env)
- [ ] `registerPush()` function תקין (`frontend/src/utils/push.ts`)
- [ ] Backend endpoint תקין (`POST /api/notifications/subscribe`)
- [ ] Settings component מציג כפתור "הפעל התראות"
- [ ] לחיצה על "הפעל התראות" יוצרת subscription
- [ ] קריאת `POST /api/notifications/subscribe` מחזירה 200 OK
- [ ] Subscription נראה ב-DevTools → Application → Service Workers → Push
- [ ] `push_endpoint` נשמר ב-localStorage
- [ ] Subscription נשמר ב-DB (notification_subscriptions table)
- [ ] לחיצה על "בטל התראות" מוחקת subscription
- [ ] `unregisterPush()` מוחק subscription מ-localStorage ו-DB

## פתרון בעיות נפוצות

### בעיה: "Push not supported"
**סיבות אפשריות:**
- הדפדפן לא תומך ב-Push API
- לא רץ על HTTPS (חובה ב-production)
- Service Worker לא נרשם

**פתרון:**
- ודא ש-Service Worker נרשם
- בדוק שהדפדפן תומך (Chrome, Edge, Firefox)
- ב-localhost זה אמור לעבוד גם ב-HTTP

### בעיה: "VAPID_PUBLIC_KEY is not defined"
**סיבות אפשריות:**
- `VITE_VAPID_PUBLIC_KEY` לא מוגדר ב-frontend/.env
- לא רענן את ה-server אחרי הוספת ה-env variable

**פתרון:**
- הוסף `VITE_VAPID_PUBLIC_KEY=...` ל-frontend/.env
- רענן את ה-Vite dev server

### בעיה: 401 Unauthorized ב-POST /api/notifications/subscribe
**סיבות אפשריות:**
- Token לא נשלח ב-request
- Token לא תקין
- לא מחובר

**פתרון:**
- בדוק את `frontend/src/api.ts` - interceptor מוסיף token
- בדוק ש-`localStorage.getItem('token')` מחזיר ערך
- נסה להתחבר מחדש

### בעיה: Subscription לא נשמר ב-DB
**סיבות אפשריות:**
- שגיאה ב-backend (בדוק logs)
- בעיה ב-DB connection
- בעיה ב-schema (NotificationSubscription model)

**פתרון:**
- בדוק את backend logs
- בדוק ש-migrations רצו (`alembic upgrade head`)
- בדוק את `backend/app/db/models/notification_subscription.py`

### בעיה: Subscription לא מופיע ב-DevTools
**סיבות אפשריות:**
- Service Worker לא נרשם
- Subscription לא נוצר (שגיאה ב-registerPush)
- הדפדפן לא תומך

**פתרון:**
- בדוק ש-Service Worker נרשם
- בדוק ב-Console אם יש שגיאות
- נסה בדפדפן אחר (Chrome/Edge)

## הערות חשובות

1. **HTTPS חובה ב-production:**
   - Push notifications דורשות HTTPS (חוץ מ-localhost)
   - ודא שה-production server רץ על HTTPS

2. **VAPID Keys:**
   - צריך ליצור VAPID keys חדשות לכל environment
   - אל תשתף keys בין development ו-production

3. **Service Worker:**
   - Service Worker צריך להיות ב-`/service-worker.js` (root)
   - לא יכול להיות בתיקיית `src/`

4. **Browser Support:**
   - Chrome/Edge: ✅ תומך
   - Firefox: ✅ תומך
   - Safari: ❌ לא תומך (iOS Safari תומך חלקית)

5. **Testing:**
   - ב-localhost זה אמור לעבוד גם ב-HTTP
   - ב-production צריך HTTPS
