# Protected Route Implementation

## Overview

המערכת כוללת שני מימושים של `ProtectedRoute` - בסיסי ומתקדם.

## 1. ProtectedRoute (Basic)

**File**: `src/components/ProtectedRoute.tsx`

### Features

- ✅ בדיקה אם קיים token ב-localStorage
- ✅ Loading state בזמן הבדיקה (מונע flicker)
- ✅ Redirect ל-login אם אין token
- ✅ מהיר וקל משקל

### Usage

```tsx
import { ProtectedRoute } from './components/ProtectedRoute';

// In App.tsx
<Route element={<ProtectedRoute />}>
  <Route path="/home" element={<HomePage />} />
  <Route path="/settings" element={<Settings />} />
  <Route path="/calendar" element={<CalendarPage />} />
</Route>
```

### Pros & Cons

**Pros**:
- פשוט ומהיר
- אין network requests מיותרים
- עובד offline

**Cons**:
- לא מאמת שה-token תקף
- לא עושה auto-refresh של token
- אם ה-token פג תוקף, המשתמש יגלה רק כשינסה API call

### When to Use

השתמש במימוש הבסיסי כאשר:
- האפליקציה קטנה ופשוטה
- רוצים מהירות מקסימלית
- לא צריך validation מורכב
- האפליקציה עובדת offline

## 2. ProtectedRouteAdvanced

**File**: `src/components/ProtectedRouteAdvanced.tsx`

### Features

- ✅ בדיקת קיום token ב-localStorage
- ✅ **אימות token מול Backend** (`GET /api/auth/me`)
- ✅ **Auto-refresh** של access token אם פג תוקף
- ✅ Loading state עם אנימציה
- ✅ ניקוי tokens לא תקפים
- ✅ Redirect עם return URL (חזרה לדף המקורי אחרי login)
- ✅ תמיכה ב-dark mode

### Usage

```tsx
import { ProtectedRouteAdvanced } from './components/ProtectedRouteAdvanced';

// In App.tsx
<Route element={<ProtectedRouteAdvanced />}>
  <Route path="/home" element={<HomePage />} />
  <Route path="/settings" element={<Settings />} />
  <Route path="/calendar" element={<CalendarPage />} />
</Route>
```

### Flow Diagram

```
┌─────────────────────────┐
│ User navigates to /home │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Check localStorage      │
│ for 'token'             │
└───────────┬─────────────┘
            │
    ┌───────┴───────┐
    │               │
    ▼               ▼
No token       Has token
    │               │
    │               ▼
    │   ┌─────────────────────────┐
    │   │ Validate with backend:  │
    │   │ GET /api/auth/me        │
    │   └───────────┬─────────────┘
    │               │
    │       ┌───────┴───────┐
    │       │               │
    │       ▼               ▼
    │   Valid token    Invalid/Expired
    │       │               │
    │       │               ▼
    │       │   ┌─────────────────────────┐
    │       │   │ Try refresh token:      │
    │       │   │ POST /api/auth/refresh  │
    │       │   └───────────┬─────────────┘
    │       │               │
    │       │       ┌───────┴───────┐
    │       │       │               │
    │       │       ▼               ▼
    │       │   Success         Failed
    │       │       │               │
    │       │       │               ▼
    │       │       │   ┌─────────────────────┐
    │       │       │   │ Clear tokens        │
    │       │       │   └───────────┬─────────┘
    │       │       │               │
    │       ▼       ▼               │
    │   ┌─────────────────────┐    │
    │   │ Render <Outlet />   │    │
    │   │ (Protected routes)  │    │
    │   └─────────────────────┘    │
    │                               │
    ▼                               ▼
┌─────────────────────────────────────┐
│ Redirect to /login                  │
│ with return URL                     │
└─────────────────────────────────────┘
```

### Pros & Cons

**Pros**:
- 🔒 אבטחה משופרת - מאמת token מול backend
- 🔄 Auto-refresh - מחדש token אוטומטית
- 🧹 ניקוי - מסיר tokens לא תקפים
- 🔙 Return URL - חוזר לדף המקורי אחרי login
- ✨ UX טוב יותר - משתמש לא צריך להתחבר מחדש

**Cons**:
- 🐢 איטי יותר - network request בכל טעינת דף מוגן
- 📡 דורש חיבור לאינטרנט
- 🔋 צורך יותר משאבים

### When to Use

השתמש במימוש המתקדם כאשר:
- נדרשת אבטחה גבוהה
- רוצים auto-refresh של tokens
- חשוב לדעת שה-token תקף לפני הרינדור
- יש חיבור אינטרנט יציב

## Comparison Table

| Feature | Basic | Advanced |
|---------|-------|----------|
| בדיקת token ב-localStorage | ✅ | ✅ |
| Loading state | ✅ | ✅ |
| אימות token מול backend | ❌ | ✅ |
| Auto-refresh token | ❌ | ✅ |
| Return URL | ❌ | ✅ |
| ניקוי tokens לא תקפים | ❌ | ✅ |
| Dark mode support | ⚠️ | ✅ |
| Performance | ⚡ Fast | 🐢 Slower |
| Security | ⚠️ Basic | 🔒 High |
| Network requests | 0 | 1-2 per navigation |

## Migration Guide

### From Basic to Advanced

**Step 1**: Update imports in `App.tsx`

```diff
- import { ProtectedRoute } from './components/ProtectedRoute';
+ import { ProtectedRouteAdvanced } from './components/ProtectedRouteAdvanced';
```

**Step 2**: Update route configuration

```diff
- <Route element={<ProtectedRoute />}>
+ <Route element={<ProtectedRouteAdvanced />}>
    <Route path="/home" element={<HomePage />} />
    <Route path="/settings" element={<Settings />} />
  </Route>
```

**Step 3**: Update LoginPage to handle return URL

```tsx
import { useLocation, useNavigate } from 'react-router-dom';

export const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get return URL from location state
  const from = location.state?.from || ROUTES.HOME;

  const handleLogin = async () => {
    // ... login logic ...

    // Redirect to return URL after successful login
    navigate(from, { replace: true });
  };

  // ...
};
```

### From Advanced to Basic

אם תרצה לחזור למימוש הבסיסי (למשל, לשיפור performance):

```diff
+ import { ProtectedRoute } from './components/ProtectedRoute';
- import { ProtectedRouteAdvanced } from './components/ProtectedRouteAdvanced';

- <Route element={<ProtectedRouteAdvanced />}>
+ <Route element={<ProtectedRoute />}>
```

## Best Practices

### 1. Use Consistent Import Names

```tsx
// Good
import { ProtectedRoute } from './components/ProtectedRoute';

// Bad (confusing)
import { ProtectedRoute as Guard } from './components/ProtectedRoute';
```

### 2. Group Protected Routes

```tsx
// Good - all protected routes in one place
<Route element={<ProtectedRoute />}>
  <Route path="/home" element={<HomePage />} />
  <Route path="/settings" element={<Settings />} />
  <Route path="/calendar" element={<CalendarPage />} />
  <Route path="/room/:roomId" element={<RoomPage />} />
</Route>

// Bad - scattered protected routes
<Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
<Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
```

### 3. Handle Loading State Gracefully

```tsx
// In ProtectedRoute - show meaningful loading
if (isValidating) {
  return <LoadingScreen message="מאמת הזדהות..." />;
}
```

### 4. Add Error Boundaries

```tsx
<ErrorBoundary fallback={<ErrorPage />}>
  <Route element={<ProtectedRoute />}>
    <Route path="/home" element={<HomePage />} />
  </Route>
</ErrorBoundary>
```

## Testing

### Basic ProtectedRoute

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

test('redirects to login when no token', () => {
  localStorage.removeItem('token');

  render(
    <MemoryRouter initialEntries={['/home']}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<div>Home Page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

  expect(screen.getByText('Login Page')).toBeInTheDocument();
});

test('renders protected route when token exists', () => {
  localStorage.setItem('token', 'fake-token');

  render(
    <MemoryRouter initialEntries={['/home']}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<div>Home Page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

  expect(screen.getByText('Home Page')).toBeInTheDocument();
});
```

### Advanced ProtectedRoute

```tsx
test('validates token with backend', async () => {
  localStorage.setItem('token', 'fake-token');

  // Mock API call
  jest.spyOn(api, 'get').mockResolvedValue({ data: { id: 1, email: 'test@example.com' } });

  render(
    <MemoryRouter initialEntries={['/home']}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route element={<ProtectedRouteAdvanced />}>
          <Route path="/home" element={<div>Home Page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

  // Should show loading first
  expect(screen.getByText('מאמת הזדהות...')).toBeInTheDocument();

  // Should render home after validation
  await waitFor(() => {
    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });
});
```

## Related Documentation

- [Authentication Flow](./authentication.md)
- [Token Refresh](./token-refresh.md)
- [API Integration](./api-integration.md)
- [Route Configuration](./routes.md)
