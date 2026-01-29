# 📊 Analytics

למעקב פעילות משתמשים (תוך שמירה על פרטיות), ניתן להשתמש ב-Google Analytics או Plausible.

## Google Analytics

### התקנה

```typescript
// frontend/src/utils/analytics.ts
import { initGA, trackGAEvent } from './utils/analytics';

// Initialize in main.tsx
if (import.meta.env.VITE_GA_MEASUREMENT_ID) {
  initGA(import.meta.env.VITE_GA_MEASUREMENT_ID);
}

// Track events
trackGAEvent('click', 'button', 'login');
```

### הגדרת Environment Variable

```bash
# frontend/.env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### תכונות פרטיות

- **Anonymize IP**: מופעל כברירת מחדל
- **Do Not Track**: כיבוד ה-DNT header
- **GDPR Compliant**: תואם ל-GDPR

## Plausible (מומלץ לפרטיות)

Plausible הוא פתרון Analytics שמכבד פרטיות, ללא cookies וללא GDPR consent.

### התקנה - HTML

```html
<!-- frontend/index.html -->
<script defer data-domain="eli-maor.com" src="https://plausible.io/js/script.js"></script>
```

### התקנה - React

```typescript
// frontend/src/utils/analytics.ts
import { trackPlausibleEvent } from './utils/analytics';

trackPlausibleEvent('task_completed', { taskId: 123 });
```

### הגדרת Environment Variable

```bash
# frontend/.env
VITE_PLAUSIBLE_DOMAIN=eli-maor.com
```

### תכונות פרטיות

- **No Cookies**: לא משתמש ב-cookies
- **No Tracking**: לא עוקב אחר משתמשים
- **GDPR Compliant**: תואם ל-GDPR ללא צורך ב-consent

## שימוש ב-Analytics

קובץ `frontend/src/utils/analytics.ts` כולל פונקציות מוכנות לשימוש:

- `initGA()` - אתחול Google Analytics
- `trackGAEvent()` - מעקב אירועים ב-Google Analytics
- `trackPlausibleEvent()` - מעקב אירועים ב-Plausible
- `trackEvent()` - מעקב אוניברסלי (תומך בשניהם)

### דוגמאות שימוש

```typescript
import { trackGAEvent, trackPlausibleEvent, trackEvent } from './utils/analytics';

// Google Analytics only
trackGAEvent('click', 'button', 'login');

// Plausible only
trackPlausibleEvent('task_completed', { taskId: 123 });

// Universal (both if available)
trackEvent('task_created', 'task', { taskId: 456 });
```

## שמירה על פרטיות

- **Anonymize IP**: מופעל כברירת מחדל ב-Google Analytics
- **Do Not Track**: כיבוד ה-DNT header
- **No Cookies**: Plausible לא משתמש ב-cookies
- **GDPR Compliant**: שני הפתרונות תואמים ל-GDPR
