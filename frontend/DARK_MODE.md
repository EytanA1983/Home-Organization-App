# Dark Mode & Theme Switch Documentation

## Overview

המערכת כוללת Dark Mode & Theme Switch מלא עם Tailwind CSS - אפשרות למשתמשים להחליף למצב כהה.

## Features

- **Light/Dark Mode** - מצב בהיר וכהה
- **System Preference** - זיהוי אוטומטי של העדפת המערכת
- **LocalStorage** - שמירת העדפת המשתמש
- **Smooth Transitions** - מעברים חלקים בין מצבים
- **RTL Support** - תמיכה בעברית
- **i18n** - תרגומים בעברית, אנגלית, רוסית

## Installation

ההגדרות כבר מוגדרות:
- `tailwind.config.js` - `darkMode: 'class'`
- `ThemeContext` - ניהול מצב theme
- `ThemeToggle` - כפתור החלפה

## Configuration

### Tailwind Config

```javascript
// tailwind.config.js
export default {
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        // Dark mode colors
        'dark-bg': '#1a1a1a',
        'dark-surface': '#2d2d2d',
        'dark-text': '#e5e5e5',
        'dark-border': '#404040',
      },
    },
  },
}
```

### ThemeProvider

ה-ThemeProvider מוגדר ב-`App.tsx`:

```typescript
<ThemeProvider>
  <ToastProvider>
    <BrowserRouter>
      {/* App content */}
    </BrowserRouter>
  </ToastProvider>
</ThemeProvider>
```

## Usage

### Using Theme Hook

```typescript
import { useTheme } from '../contexts/ThemeContext';

const MyComponent = () => {
  const { theme, toggleTheme, setTheme } = useTheme();

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('light')}>Set Light</button>
    </div>
  );
};
```

### Using ThemeToggle Component

```typescript
import { ThemeToggle } from '../components/ThemeToggle';

<ThemeToggle />
```

### Using ThemeToggleWithLabel

```typescript
import { ThemeToggleWithLabel } from '../components/ThemeToggle';

<ThemeToggleWithLabel />
```

## Dark Mode Classes

### Background Colors

```typescript
className="bg-white dark:bg-dark-surface"
className="bg-cream dark:bg-dark-bg"
```

### Text Colors

```typescript
className="text-gray-900 dark:text-dark-text"
className="text-gray-700 dark:text-gray-400"
```

### Border Colors

```typescript
className="border-gray-200 dark:border-dark-border"
```

### Hover States

```typescript
className="hover:bg-cream dark:hover:bg-dark-bg"
```

## Component Updates

### NavBar

```typescript
<nav className="bg-white dark:bg-dark-surface shadow-sm border-b border-gray-200 dark:border-dark-border">
  <Link className="text-gray-900 dark:text-dark-text">
    {/* Content */}
  </Link>
</nav>
```

### Settings

```typescript
<div className="p-6 space-y-4 bg-cream dark:bg-dark-bg min-h-screen">
  <h1 className="text-gray-900 dark:text-dark-text">⚙️ הגדרות</h1>
  <ThemeToggleWithLabel />
</div>
```

### CalendarPage

```typescript
<div className="p-6 bg-cream dark:bg-dark-bg min-h-screen">
  <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-4">
    <h1 className="text-gray-900 dark:text-dark-text">📅 לוח שנה</h1>
  </div>
</div>
```

## Theme Detection

המערכת מזהה אוטומטית את העדפת המערכת:

```typescript
// Check system preference
if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  return 'dark';
}
return 'light';
```

## LocalStorage

העדפת המשתמש נשמרת ב-localStorage:

```typescript
// Save theme
localStorage.setItem('theme', theme);

// Load theme
const savedTheme = localStorage.getItem('theme') as Theme;
```

## Best Practices

1. **Always Use Dark Classes** - תמיד הוסף dark: classes לכל הקומפוננטות
2. **Test Both Modes** - בדוק את שני המצבים
3. **Smooth Transitions** - השתמש ב-transition-colors
4. **Accessible Colors** - ודא ניגודיות טובה
5. **Consistent Styling** - שמור על עקביות בעיצוב

## Color Palette

### Light Mode
- Background: `#F5F5DC` (cream)
- Surface: `#FFFFFF` (white)
- Text: `#111827` (gray-900)
- Border: `#E5E7EB` (gray-200)

### Dark Mode
- Background: `#1a1a1a` (dark-bg)
- Surface: `#2d2d2d` (dark-surface)
- Text: `#e5e5e5` (dark-text)
- Border: `#404040` (dark-border)

## Troubleshooting

### Theme Not Applying

- ודא ש-`darkMode: 'class'` מוגדר ב-tailwind.config.js
- בדוק שה-`ThemeProvider` מוגדר ב-App.tsx
- ודא שה-class `dark` נוסף ל-`document.documentElement`

### Colors Not Changing

- בדוק שה-dark: classes מוגדרים נכון
- ודא שה-Tailwind CSS כולל את ה-dark mode classes
- בדוק את ה-console לשגיאות

### Transitions Not Smooth

- ודא ש-`transition-colors` מוגדר
- בדוק את ה-duration של ה-transitions
- ודא שאין CSS conflicts

## Examples

### Button with Dark Mode

```typescript
<button className="
  bg-mint 
  text-white 
  hover:bg-mint/90 
  dark:bg-mint/80 
  dark:hover:bg-mint/70
  transition-colors
">
  Click Me
</button>
```

### Card with Dark Mode

```typescript
<div className="
  bg-white 
  dark:bg-dark-surface 
  rounded-lg 
  shadow-sm 
  border 
  border-gray-200 
  dark:border-dark-border
  p-4
">
  <h2 className="text-gray-900 dark:text-dark-text">Title</h2>
  <p className="text-gray-600 dark:text-gray-400">Content</p>
</div>
```

### Input with Dark Mode

```typescript
<input className="
  bg-white 
  dark:bg-dark-surface 
  text-gray-900 
  dark:text-dark-text 
  border 
  border-gray-300 
  dark:border-dark-border
  rounded-lg
  px-4
  py-2
" />
```
