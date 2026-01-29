# Routing & Protected Routes - הסבר

## 📋 סקירה כללית

האפליקציה משתמשת ב-React Router עם `ProtectedRoute` component שמגן על דפים שדורשים authentication.

## 🔒 Protected Routes (דורשים התחברות)

הדפים הבאים **מוגנים** ודורשים token ב-`localStorage`:

1. **HOME** (`/`) - דף הבית
   - מציג רשימת חדרים
   - קורא ל-`/api/rooms` (דורש auth)
   - **מוגן**: ✅

2. **ROOM** (`/room/:roomId`) - דף חדר
   - מציג משימות של חדר מסוים
   - קורא ל-`/api/tasks`, `/api/categories` (דורש auth)
   - **מוגן**: ✅

3. **SETTINGS** (`/settings`) - הגדרות
   - הגדרות משתמש, נוטיפיקציות, Google Calendar
   - קורא ל-`/api/...` (דורש auth)
   - **מוגן**: ✅

4. **CALENDAR** (`/calendar`) - לוח שנה
   - מציג משימות בלוח שנה
   - קורא ל-`/api/tasks` (דורש auth)
   - **מוגן**: ✅

## 🌐 Public Routes (לא דורשים התחברות)

הדפים הבאים **פתוחים** לכולם:

1. **LOGIN** (`/login`) - דף התחברות
2. **REGISTER** (`/register`) - דף רישום
3. **GOOGLE_CALLBACK** (`/auth/google/callback`) - callback מ-Google OAuth

## 🔧 איך זה עובד?

### ProtectedRoute Component

```typescript
// src/components/ProtectedRoute.tsx
export const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  return <Outlet />;
};
```

### Routing Structure

```typescript
<Routes>
  {/* Public routes */}
  <Route path={ROUTES.LOGIN} element={<LoginPage />} />
  <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
  <Route path={ROUTES.GOOGLE_CALLBACK} element={<GoogleLoginRedirect />} />
  
  {/* Protected routes using Outlet pattern */}
  <Route element={<ProtectedRoute />}>
    <Route path={ROUTES.HOME} element={<HomePage />} />
    <Route path="/room/:roomId" element={<RoomPage />} />
    <Route path={ROUTES.SETTINGS} element={<Settings />} />
    <Route path={ROUTES.CALENDAR} element={<CalendarPage />} />
  </Route>
  
  {/* Catch-all route */}
  <Route path="*" element={<CatchAllRoute />} />
</Routes>
```

## ⚠️ למה HOME מוגן?

**HOME** (`/`) מוגן כי:
1. הוא קורא ל-`/api/rooms` שדורש authentication
2. הוא מציג מידע אישי של המשתמש (החדרים שלו)
3. ללא token, הקריאה ל-API תחזיר 401

## 🔄 אם אתה רוצה Landing Page ציבורי

אם אתה רוצה ליצור **Landing Page** ציבורי (ללא התחברות):

### אופציה 1: Landing Page נפרד

```typescript
<Routes>
  {/* Public routes */}
  <Route path="/" element={<LandingPage />} />  {/* Landing page ציבורי */}
  <Route path={ROUTES.LOGIN} element={<LoginPage />} />
  <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
  
  {/* Protected routes */}
  <Route element={<ProtectedRoute />}>
    <Route path="/dashboard" element={<HomePage />} />  {/* Dashboard מוגן */}
    <Route path="/room/:roomId" element={<RoomPage />} />
    {/* ... */}
  </Route>
</Routes>
```

### אופציה 2: HomePage עם Conditional Rendering

```typescript
// HomePage.tsx
export const HomePage = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <LandingPageContent />;  // תוכן ציבורי
  }
  
  // תוכן מוגן - רשימת חדרים
  return <ProtectedHomeContent />;
};
```

## ✅ Checklist - מה צריך להיות מוגן?

- [x] **HOME** (`/`) - מוגן ✅ (קורא ל-`/api/rooms`)
- [x] **ROOM** (`/room/:roomId`) - מוגן ✅ (קורא ל-`/api/tasks`)
- [x] **SETTINGS** (`/settings`) - מוגן ✅ (קורא ל-`/api/...`)
- [x] **CALENDAR** (`/calendar`) - מוגן ✅ (קורא ל-`/api/tasks`)
- [ ] **LOGIN** (`/login`) - לא מוגן ✅ (public)
- [ ] **REGISTER** (`/register`) - לא מוגן ✅ (public)

## 🐛 בעיות נפוצות

### בעיה: "401 Unauthorized" על HOME

**סיבה:** HOME מוגן אבל אין token

**פתרון:**
1. ודא שהמשתמש התחבר (`localStorage.getItem('token')`)
2. אם לא - המשתמש יועבר אוטומטית ל-`/login`

### בעיה: HOME נגיש ללא התחברות

**סיבה:** HOME לא מוגן ב-`ProtectedRoute`

**פתרון:**
```typescript
// ודא ש-HOME בתוך ProtectedRoute:
<Route element={<ProtectedRoute />}>
  <Route path={ROUTES.HOME} element={<HomePage />} />
</Route>
```

## 📚 קבצים רלוונטיים

- `frontend/src/App.tsx` - הגדרת routes
- `frontend/src/components/ProtectedRoute.tsx` - ProtectedRoute component
- `frontend/src/pages/HomePage.tsx` - דף הבית
- `frontend/src/utils/routes.ts` - קבועי routes
