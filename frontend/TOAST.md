# Toast Notifications Documentation

## Overview

המערכת כוללת Toast notifications מלאות עם `react-hot-toast` - הודעות קצרות לפידבק (הוספת משימה, שגיאה, הצלחה).

## Features

- **Success Toasts** - הודעות הצלחה (ירוק)
- **Error Toasts** - הודעות שגיאה (אדום)
- **Info Toasts** - הודעות מידע (כחול)
- **Loading Toasts** - הודעות טעינה
- **Promise Toasts** - הודעות עבור פעולות async
- **RTL Support** - תמיכה בעברית
- **i18n** - תרגומים בעברית, אנגלית, רוסית

## Installation

התלות כבר מותקנת ב-`package.json`:
- `react-hot-toast` - Toast notification library

## Usage

### Basic Usage

```typescript
import { showSuccess, showError, showInfo } from '../utils/toast';

// Success toast
showSuccess('משימה נוצרה בהצלחה');

// Error toast
showError('שגיאה ביצירת משימה');

// Info toast
showInfo('מידע נוסף');
```

### With i18n

```typescript
import { useTranslation } from 'react-i18next';
import { showSuccess, showError } from '../utils/toast';

const { t } = useTranslation();

showSuccess(t('toast:task_created'), t);
showError(t('toast:task_creation_failed'), t);
```

### Loading Toast

```typescript
import { showLoading } from '../utils/toast';

const toastId = showLoading('טוען...');
// ... do something
toast.dismiss(toastId);
```

### Promise Toast

```typescript
import { showPromise } from '../utils/toast';

const promise = api.post('/api/tasks', taskData);

showPromise(
  promise,
  {
    loading: 'יוצר משימה...',
    success: 'משימה נוצרה בהצלחה',
    error: 'שגיאה ביצירת משימה',
  },
  t
);
```

## Toast Types

### Success Toast

```typescript
showSuccess('משימה נוצרה בהצלחה', t);
```

- צבע: ירוק (#10b981)
- רקע: #f0fdf4
- אייקון: ✅
- משך: 3000ms

### Error Toast

```typescript
showError('שגיאה ביצירת משימה', t);
```

- צבע: אדום (#ef4444)
- רקע: #fef2f2
- אייקון: ❌
- משך: 5000ms

### Info Toast

```typescript
showInfo('מידע נוסף', t);
```

- צבע: כחול (#3b82f6)
- רקע: #eff6ff
- אייקון: ℹ️
- משך: 4000ms

### Loading Toast

```typescript
const toastId = showLoading('טוען...', t);
// ... do something
toast.dismiss(toastId);
```

- צבע: כחול (#3b82f6)
- רקע: #eff6ff
- אייקון: 🔄 (spinner)
- משך: עד שמסירים ידנית

## Configuration

### ToastProvider

ה-ToastProvider מוגדר ב-`App.tsx`:

```typescript
<ToastProvider>
  <BrowserRouter>
    {/* App content */}
  </BrowserRouter>
</ToastProvider>
```

### Customization

ניתן להתאים את ה-toast ב-`ToastProvider.tsx`:

```typescript
<Toaster
  position="top-center"
  reverseOrder={false}
  gutter={8}
  toastOptions={{
    duration: 4000,
    style: {
      direction: 'rtl',
      fontFamily: 'Rubik, Heebo, Assistant, sans-serif',
    },
  }}
/>
```

## Available Translations

### Hebrew (he)

```json
{
  "toast": {
    "task_created": "משימה נוצרה בהצלחה",
    "task_updated": "משימה עודכנה בהצלחה",
    "task_deleted": "משימה נמחקה בהצלחה",
    "task_completed": "משימה הושלמה",
    "task_creation_failed": "שגיאה ביצירת משימה",
    "task_update_failed": "שגיאה בעדכון משימה",
    "task_delete_failed": "שגיאה במחיקת משימה",
    "task_date_updated": "תאריך המשימה עודכן בהצלחה",
    "task_date_update_failed": "שגיאה בעדכון תאריך המשימה",
    "updating_task_date": "מעדכן תאריך משימה...",
    "creating_task": "יוצר משימה...",
    "updating_task": "מעדכן משימה...",
    "deleting_task": "מוחק משימה...",
    "room_created": "חדר נוצר בהצלחה",
    "room_updated": "חדר עודכן בהצלחה",
    "room_deleted": "חדר נמחק בהצלחה",
    "category_created": "קטגוריה נוצרה בהצלחה",
    "login_success": "התחברת בהצלחה",
    "login_failed": "שגיאה בהתחברות",
    "register_success": "נרשמת בהצלחה",
    "register_failed": "שגיאה ברישום"
  }
}
```

## Best Practices

1. **Use Appropriate Toast Type** - השתמש בסוג הנכון (success/error/info)
2. **Keep Messages Short** - הודעות קצרות וברורות
3. **Use i18n** - תמיד השתמש בתרגומים
4. **Promise Toasts** - השתמש ב-promise toasts לפעולות async
5. **Dismiss Loading** - תמיד סגור loading toasts

## Examples

### Creating a Task

```typescript
const createTask = async (taskData: TaskCreate) => {
  const promise = api.post('/api/tasks', taskData);
  
  showPromise(
    promise,
    {
      loading: t('toast:creating_task'),
      success: t('toast:task_created'),
      error: t('toast:task_creation_failed'),
    },
    t
  );
  
  try {
    await promise;
    // Additional logic
  } catch (error) {
    // Error already handled by toast
  }
};
```

### Updating a Task

```typescript
const updateTask = async (taskId: number, taskData: TaskUpdate) => {
  try {
    await api.put(`/api/tasks/${taskId}`, taskData);
    showSuccess(t('toast:task_updated'), t);
  } catch (error) {
    showError(t('toast:task_update_failed'), t);
  }
};
```

### Deleting a Task

```typescript
const deleteTask = async (taskId: number) => {
  const promise = api.delete(`/api/tasks/${taskId}`);
  
  showPromise(
    promise,
    {
      loading: t('toast:deleting_task'),
      success: t('toast:task_deleted'),
      error: t('toast:task_delete_failed'),
    },
    t
  );
  
  await promise;
};
```

## Troubleshooting

### Toasts Not Showing

- ודא שה-`ToastProvider` מוגדר ב-`App.tsx`
- בדוק שה-toast לא מוסתר על ידי CSS
- ודא שה-toast לא נסגר מיד

### RTL Issues

- ודא ש-`direction: 'rtl'` מוגדר ב-toast options
- בדוק את ה-font family

### Translation Issues

- ודא שה-namespace `toast` מוגדר ב-i18n config
- בדוק שהתרגומים קיימים בכל השפות
