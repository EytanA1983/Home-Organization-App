# Accessibility (a11y) Guide

## WCAG 2.1 AA Compliance

This application follows WCAG 2.1 Level AA guidelines for accessibility.

## Key Features Implemented

### 1. Skip Links (WCAG 2.4.1 - Bypass Blocks)

```tsx
// At the top of App.tsx
<SkipLink targetId="main-content">דלג לתוכן הראשי</SkipLink>
```

Users can press Tab to reveal the skip link and jump to main content.

### 2. Semantic HTML Landmarks

```html
<header role="banner">...</header>
<nav role="navigation" aria-label="ניווט ראשי">...</nav>
<main role="main" aria-label="תוכן ראשי">...</main>
<footer role="contentinfo">...</footer>
```

### 3. Focus Management

#### Focus Visible (WCAG 2.4.7)
```css
/* All interactive elements have visible focus */
:focus-visible {
  outline: 2px solid #AEDFF7;
  outline-offset: 2px;
}

/* Utility class */
.focus-ring {
  @apply focus:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2;
}
```

#### Focus Trap (for modals)
```tsx
import { trapFocus } from '../utils/accessibility';

useEffect(() => {
  const cleanup = trapFocus(modalRef.current);
  return cleanup;
}, []);
```

### 4. ARIA Labels and Roles

#### Buttons with Icons
```tsx
<button aria-label="סגור חלון">
  <span aria-hidden="true">✕</span>
</button>
```

#### Current Page Indicator
```tsx
<Link aria-current={isActive ? 'page' : undefined}>
  בית
</Link>
```

#### Loading States
```tsx
<div role="status" aria-live="polite" aria-busy="true">
  <LoadingSpinner />
</div>
```

### 5. Screen Reader Announcements

```tsx
import { announce } from '../utils/accessibility';

// Polite announcement (doesn't interrupt)
announce('המשימה נשמרה בהצלחה', 'polite');

// Assertive announcement (interrupts immediately)
announce('שגיאה: נא למלא את כל השדות', 'assertive');
```

### 6. Color Contrast (WCAG 1.4.3)

| Element | Foreground | Background | Ratio | Passes |
|---------|------------|------------|-------|--------|
| Body text | #1f2937 | #FAF3E0 | 11.5:1 | ✅ AA |
| Dark mode text | #e5e5e5 | #1a1a1a | 13.1:1 | ✅ AA |
| Links | #AEDFF7 | #1a1a1a | 7.2:1 | ✅ AA |

Use the contrast checker:
```tsx
import { meetsContrastAA } from '../utils/accessibility';

meetsContrastAA('#1f2937', '#FAF3E0'); // true
```

### 7. Touch Targets (WCAG 2.5.5)

Minimum 44x44px for touch targets:
```css
.touch-target {
  min-width: 44px;
  min-height: 44px;
}
```

### 8. Reduced Motion (WCAG 2.3.3)

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

In React:
```tsx
import { prefersReducedMotion } from '../utils/accessibility';

const shouldAnimate = !prefersReducedMotion();
```

### 9. Form Accessibility

```tsx
<label htmlFor="email">
  אימייל
  <span aria-hidden="true" className="text-red-500">*</span>
  <span className="sr-only">(שדה חובה)</span>
</label>
<input
  id="email"
  type="email"
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby={hasError ? 'email-error' : undefined}
/>
{hasError && (
  <p id="email-error" role="alert" className="text-red-500">
    נא להזין כתובת אימייל תקינה
  </p>
)}
```

## CSS Utility Classes

| Class | Purpose |
|-------|---------|
| `.sr-only` | Hide visually, keep for screen readers |
| `.not-sr-only` | Undo sr-only (for skip links) |
| `.focus-ring` | Consistent focus indicator |
| `.touch-target` | Minimum touch size (44x44) |
| `.skip-link` | Skip link styling |

## Testing Checklist

### Keyboard Navigation
- [ ] All interactive elements reachable with Tab
- [ ] Tab order is logical (follows visual order)
- [ ] Focus visible on all elements
- [ ] Skip link works
- [ ] Modal focus trapped
- [ ] Escape closes modals

### Screen Readers
- [ ] Page title announces correctly
- [ ] Headings hierarchy is correct (h1 → h2 → h3)
- [ ] Links have descriptive text
- [ ] Images have alt text
- [ ] Form labels associated with inputs
- [ ] Live regions announce changes

### Visual
- [ ] Color contrast meets AA (4.5:1 text, 3:1 UI)
- [ ] Not relying on color alone
- [ ] Focus indicators visible
- [ ] Text resizable to 200%
- [ ] Works in high contrast mode

### Interaction
- [ ] Touch targets at least 44x44px
- [ ] No time limits (or extendable)
- [ ] Error messages clear and specific
- [ ] Form validation helpful

## Tools for Testing

### Browser Extensions
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/extension/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### Screen Readers
- **Windows**: NVDA (free), JAWS
- **Mac**: VoiceOver (built-in)
- **Mobile**: TalkBack (Android), VoiceOver (iOS)

### Automated Testing
```bash
# Add to package.json
npm install -D @axe-core/react

# In development
import React from 'react';
import ReactDOM from 'react-dom';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Hebrew (RTL) Considerations

1. **Text alignment**: Use `text-start` / `text-end` instead of `text-left` / `text-right`
2. **Margin/Padding**: Use `ms-*` / `me-*` instead of `ml-*` / `mr-*`
3. **Flexbox**: RTL is automatic, no changes needed
4. **Screen readers**: Announce in Hebrew correctly

## Common Patterns

### Icon Button
```tsx
<button
  type="button"
  className="p-2 rounded-lg focus-ring"
  aria-label="הוסף משימה חדשה"
>
  <span aria-hidden="true">➕</span>
</button>
```

### Status Badge
```tsx
<span 
  className="badge"
  role="status"
  aria-label={`סטטוס: ${status}`}
>
  {status}
</span>
```

### Progress Indicator
```tsx
<div 
  role="progressbar"
  aria-valuenow={75}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="התקדמות משימה"
>
  <div style={{ width: '75%' }} />
</div>
```

### Expandable Section
```tsx
<button
  aria-expanded={isOpen}
  aria-controls="section-content"
>
  {isOpen ? 'הסתר' : 'הצג'} פרטים
</button>
<div id="section-content" hidden={!isOpen}>
  ...
</div>
```
