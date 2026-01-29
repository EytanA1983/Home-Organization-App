# אימות Landing Page - מדריך בדיקה

## 3.4 אימות "Landing Page"

### שלב 1: פתיחת האפליקציה
1. ודא שהשרתים רצים:
   - Backend: `http://localhost:8000`
   - Frontend: `http://localhost:5178`

2. פתח בדפדפן: `http://localhost:5178`

### שלב 2: בדיקת NavBar (Header)
**צריך לראות:**
- ✅ **לוגו/שם האפליקציה** (משמאל)
- ✅ **Theme Toggle** (כפתור מעבר בין מצב כהה/בהיר)
- ✅ **Language Switcher** (מעבר בין שפות)
- ✅ **קישורים לניווט** (אם מחובר):
  - 🏠 Home
  - 📅 Calendar
  - ⚙️ Settings
- ✅ **כפתורי Authentication**:
  - אם **לא מחובר**: 🔑 Login + 📝 Register
  - אם **מחובר**: 🚪 Logout

**אם לא רואים NavBar:**
- בדוק את `frontend/src/App.tsx` - שורה 56: `<NavBar />`
- בדוק את `frontend/src/components/NavBar.tsx` - וודא שהקוד תקין

### שלב 3: בדיקת HomePage
**אם לא מחובר (אין token):**
- ✅ צריך לראות **LoginPage** או **RegisterPage**
- ✅ NavBar מציג כפתורי Login/Register

**אם מחובר (יש token):**
- ✅ צריך לראות **HomePage** עם:
  - כותרת: "הבית שלי" 🏡
  - **HouseView** (אם קיים `/house.svg`) או
  - **כרטיסי חדרים** (RoomCard grid) אם אין SVG
  - הודעה "אין חדרים זמינים עדיין" אם אין חדרים

### שלב 4: בדיקת בעיית Token (401)
**אם רואים רק "Loading..." ללא נתונים:**

1. **פתח DevTools** (F12)
2. **עבור לטאב Network**
3. **רענן את הדף** (F5)
4. **חפש קריאה ל-`/api/rooms`**

**אם הקריאה מחזירה 401 Unauthorized:**
- ✅ **בעיית token** - ה-login לא נשמר או ה-token לא תקין

**פתרונות:**
1. **בדוק ב-Console:**
   ```javascript
   localStorage.getItem('token')
   ```
   - אם מחזיר `null` → צריך להתחבר מחדש
   - אם מחזיר מחרוזת → בדוק שה-token תקין

2. **בדוק את ה-API interceptor:**
   - `frontend/src/api.ts` - שורה 23-28
   - וודא שה-token נשלח ב-`Authorization` header

3. **נסה להתחבר מחדש:**
   - לחץ על Login
   - הזן פרטי משתמש
   - בדוק ש-`localStorage.setItem('token', ...)` נקרא אחרי login מוצלח

4. **בדוק את ה-backend:**
   - `backend/app/api/rooms.py` - שורה 16-30
   - וודא שה-endpoint דורש authentication (`get_current_user`)

### שלב 5: בדיקת קריאות API
**בדוק ב-Network tab:**
- ✅ `GET /api/rooms` → צריך להחזיר 200 OK (אם מחובר)
- ✅ `GET /api/rooms` → צריך להחזיר 401 Unauthorized (אם לא מחובר)

**אם רואים CORS error:**
- בדוק את `backend/app/main.py` - שורות 32-44
- וודא ש-`http://localhost:5178` נמצא ב-`allow_origins`

### שלב 6: בדיקת Routing
**בדוק את ה-routes:**
- `/` → צריך להפנות ל-`/login` (אם לא מחובר) או `/home` (אם מחובר)
- `/home` → צריך להציג HomePage (אם מחובר)
- `/login` → צריך להציג LoginPage
- `/register` → צריך להציג RegisterPage

**אם routes לא עובדים:**
- בדוק את `frontend/src/App.tsx` - שורות 58-73
- בדוק את `frontend/src/utils/routes.ts` - וודא שה-ROUTES מוגדרים נכון

## סיכום - Checklist

- [ ] Backend רץ על `http://localhost:8000`
- [ ] Frontend רץ על `http://localhost:5178`
- [ ] NavBar מוצג עם כל הכפתורים
- [ ] אם לא מחובר → רואים LoginPage
- [ ] אם מחובר → רואים HomePage
- [ ] HomePage מציג HouseView או RoomCard list
- [ ] קריאת `/api/rooms` מחזירה 200 (אם מחובר) או 401 (אם לא מחובר)
- [ ] אין שגיאות ב-Console
- [ ] אין שגיאות CORS

## פתרון בעיות נפוצות

### בעיה: "Loading..." נשאר לנצח
**סיבות אפשריות:**
1. Backend לא רץ
2. CORS error
3. Token לא תקין (401)
4. Network error

**פתרון:**
- פתח DevTools → Network → בדוק את הקריאות
- פתח DevTools → Console → חפש שגיאות

### בעיה: NavBar לא מוצג
**סיבות אפשריות:**
- `NavBar` component לא מיובא ב-`App.tsx`
- שגיאת CSS/JS

**פתרון:**
- בדוק את `frontend/src/App.tsx` - שורה 56
- בדוק את ה-Console לשגיאות

### בעיה: HomePage ריק
**סיבות אפשריות:**
- אין חדרים במסד הנתונים
- `useRooms` hook לא עובד
- API endpoint לא נכון

**פתרון:**
- בדוק את `frontend/src/hooks/useRooms.ts`
- בדוק את `backend/app/api/rooms.py`
- בדוק ב-Network tab אם הקריאה ל-`/api/rooms` מצליחה

### בעיה: 401 Unauthorized
**סיבות אפשריות:**
- Token לא נשלח ב-request
- Token לא תקין
- Token פג תוקף

**פתרון:**
- בדוק את `frontend/src/api.ts` - interceptor
- בדוק את `localStorage.getItem('token')`
- נסה להתחבר מחדש
