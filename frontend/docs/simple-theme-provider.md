# Simple Theme Provider (Minimal Version)

## Overview

A minimal dark-mode toggle implementation for projects that don't need the full `ThemeProvider` with system theme detection.

## Features

- ✅ Simple boolean dark/light toggle
- ✅ localStorage persistence
- ✅ `data-theme` attribute support
- ✅ Tailwind `dark:` class support
- ✅ Minimal code (~50 lines)

## Usage

### 1. Replace ThemeProvider in App.tsx

```tsx
// Before (full version)
import { ThemeProvider } from './contexts/ThemeContext';

// After (minimal version)
import { SimpleThemeProvider } from './contexts/SimpleThemeProvider';

function App() {
  return (
    <SimpleThemeProvider>
      {/* Your app */}
    </SimpleThemeProvider>
  );
}
```

### 2. Use the Hook

```tsx
import { useSimpleTheme } from '../contexts/SimpleThemeProvider';

function MyComponent() {
  const { dark, setDark, toggle } = useSimpleTheme();

  return (
    <div>
      <p>Current theme: {dark ? 'Dark' : 'Light'}</p>
      <button onClick={toggle}>Toggle Theme</button>
      <button onClick={() => setDark(true)}>Set Dark</button>
      <button onClick={() => setDark(false)}>Set Light</button>
    </div>
  );
}
```

### 3. Use the Toggle Component

```tsx
import { SimpleThemeToggle } from '../components/SimpleThemeToggle';

function NavBar() {
  return (
    <nav>
      <SimpleThemeToggle />
    </nav>
  );
}
```

## API

### `useSimpleTheme()` Hook

Returns:
- `dark: boolean` - Current dark mode state
- `setDark: (dark: boolean) => void` - Set dark mode directly
- `toggle: () => void` - Toggle dark mode

### `SimpleThemeProvider` Props

- `children: ReactNode` - Child components

## Comparison

### Full ThemeProvider (Current)
- ✅ Light/Dark/System modes
- ✅ System preference detection
- ✅ Smooth transitions
- ✅ More complex (~200 lines)

### SimpleThemeProvider (New)
- ✅ Light/Dark only
- ✅ Minimal code (~50 lines)
- ✅ Same localStorage persistence
- ✅ Same CSS variable support

## Migration

To switch from full to minimal:

1. **Replace import**:
```tsx
// Old
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

// New
import { SimpleThemeProvider, useSimpleTheme } from './contexts/SimpleThemeProvider';
```

2. **Update hook usage**:
```tsx
// Old
const { resolvedTheme, toggleTheme } = useTheme();
const isDark = resolvedTheme === 'dark';

// New
const { dark, toggle } = useSimpleTheme();
```

3. **Update toggle component**:
```tsx
// Old
import { ThemeToggle } from './components/ThemeToggle';

// New
import { SimpleThemeToggle } from './components/SimpleThemeToggle';
```

## Storage

The minimal version uses `localStorage.getItem('dark')` with value `'1'` for dark mode.

The full version uses `localStorage.getItem('theme')` with values `'light'`, `'dark'`, or `'system'`.

**Note**: These are incompatible - switching between providers will reset the theme preference.

## CSS Variables

Both versions support the same CSS variables:

```css
:root {
  --color-bg: #ffffff;
  --color-text: #1f2937;
}

[data-theme='dark'] {
  --color-bg: #111827;
  --color-text: #f3f4f6;
}
```

## Example: Complete Minimal Setup

```tsx
// App.tsx
import { SimpleThemeProvider } from './contexts/SimpleThemeProvider';
import { SimpleThemeToggle } from './components/SimpleThemeToggle';

function App() {
  return (
    <SimpleThemeProvider>
      <nav>
        <SimpleThemeToggle />
      </nav>
      <main>
        {/* Your content */}
      </main>
    </SimpleThemeProvider>
  );
}
```

```tsx
// MyComponent.tsx
import { useSimpleTheme } from '../contexts/SimpleThemeProvider';

export const MyComponent = () => {
  const { dark } = useSimpleTheme();

  return (
    <div style={{
      backgroundColor: 'var(--color-bg)',
      color: 'var(--color-text)'
    }}>
      <p>Dark mode: {dark ? 'ON' : 'OFF'}</p>
    </div>
  );
};
```
