# CSS Variables for Theming

## Overview

This project uses **CSS Custom Properties (CSS Variables)** for theming, allowing easy customization of colors and styles across light and dark modes.

## Architecture

The theming system uses **dual selectors** for maximum compatibility:

1. **Class-based**: `.dark` (for Tailwind CSS `dark:` variant)
2. **Attribute-based**: `[data-theme='dark']` (for CSS variable theming)

Both selectors are applied simultaneously, ensuring compatibility with:
- Tailwind CSS dark mode
- Pure CSS variable-based theming
- Third-party libraries that use either approach

## CSS Variables Structure

### Root Variables (`:root`)

Defined in `src/index.css`:

```css
:root {
  /* Primary colors */
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-primary-active: #1d4ed8;
  --color-secondary: #10b981;
  --color-secondary-hover: #059669;
  --color-secondary-active: #047857;

  /* Semantic colors (light mode) */
  --color-bg: #ffffff;
  --color-surface: #FFFFFF;
  --color-text: #1f2937;
  --color-text-muted: #6b7280;
  --color-border: #e5e7eb;
  --color-shadow: rgba(0, 0, 0, 0.1);
}
```

### Dark Mode Variables

```css
.dark,
[data-theme='dark'] {
  /* Primary colors (adjusted for dark mode) */
  --color-primary: #60a5fa;
  --color-primary-hover: #3b82f6;
  --color-primary-active: #2563eb;

  /* Semantic colors (dark mode) */
  --color-bg: #111827;
  --color-surface: #1f2937;
  --color-text: #f3f4f6;
  --color-text-muted: #d1d5db;
  --color-border: #404040;
  --color-shadow: rgba(0, 0, 0, 0.3);
}
```

## Usage

### In CSS/SCSS

```css
/* Using CSS variables */
.my-component {
  background-color: var(--color-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

/* Primary button */
.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
}

.btn-primary:active {
  background-color: var(--color-primary-active);
}
```

### In Tailwind CSS

Tailwind doesn't directly support CSS variables in class names, but you can:

1. **Use inline styles**:
```tsx
<div style={{ backgroundColor: 'var(--color-bg)' }}>
  Content
</div>
```

2. **Extend Tailwind config** (recommended):
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        'bg': 'var(--color-bg)',
        'surface': 'var(--color-surface)',
        'text': 'var(--color-text)',
        'text-muted': 'var(--color-text-muted)',
        'border': 'var(--color-border)',
        'primary': 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        'primary-active': 'var(--color-primary-active)',
      },
    },
  },
}
```

Then use:
```tsx
<div className="bg-bg text-text border-border">
  Content
</div>
```

### In React Components

```tsx
import React from 'react';

export const MyComponent = () => {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
        borderColor: 'var(--color-border)',
      }}
    >
      <button
        style={{
          backgroundColor: 'var(--color-primary)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-primary)';
        }}
      >
        Click me
      </button>
    </div>
  );
};
```

### With CSS Modules

```css
/* MyComponent.module.css */
.container {
  background-color: var(--color-bg);
  color: var(--color-text);
}

.button {
  background-color: var(--color-primary);
  transition: background-color 0.2s ease;
}

.button:hover {
  background-color: var(--color-primary-hover);
}
```

## Available Variables

### Primary Colors
- `--color-primary`: Main brand color
- `--color-primary-hover`: Hover state
- `--color-primary-active`: Active/pressed state

### Secondary Colors
- `--color-secondary`: Secondary brand color
- `--color-secondary-hover`: Hover state
- `--color-secondary-active`: Active/pressed state

### Semantic Colors
- `--color-bg`: Main background color
- `--color-surface`: Card/surface background
- `--color-text`: Primary text color
- `--color-text-muted`: Secondary/muted text color
- `--color-border`: Border color
- `--color-shadow`: Shadow color

### Custom Colors
- `--color-cream`: Cream color (light mode only)
- `--color-sky`: Sky blue
- `--color-mint`: Mint green
- `--color-blush`: Blush pink
- `--color-earth`: Earth brown

### Room-Specific Variables
See `src/index.css` for room-specific color schemes:
- `--room-living-*`
- `--room-kitchen-*`
- `--room-bedroom-*`
- `--room-bathroom-*`
- etc.

## Theme Switching

The theme is managed by `ThemeContext` which:

1. **Applies both class and attribute**:
   ```typescript
   root.classList.add(resolvedTheme); // .dark or .light
   root.setAttribute('data-theme', resolvedTheme); // data-theme="dark"
   ```

2. **Updates on theme change**:
   - Listens to system preference changes
   - Persists to localStorage
   - Updates immediately (no flash)

## Best Practices

### 1. Always Provide Fallbacks

```css
/* ❌ Bad - no fallback */
.my-element {
  color: var(--color-text);
}

/* ✅ Good - with fallback */
.my-element {
  color: var(--color-text, #1f2937); /* Light mode default */
}
```

### 2. Use Semantic Variables

```css
/* ❌ Bad - hardcoded color */
.button {
  background-color: #3b82f6;
}

/* ✅ Good - uses variable */
.button {
  background-color: var(--color-primary);
}
```

### 3. Test Both Themes

Always test your components in both light and dark modes:

```tsx
// In Storybook or tests
export const LightMode = () => <MyComponent />;
export const DarkMode = () => (
  <div data-theme="dark" className="dark">
    <MyComponent />
  </div>
);
```

### 4. Use Transitions

CSS variables work great with transitions:

```css
.my-element {
  background-color: var(--color-bg);
  transition: background-color 0.2s ease;
}
```

## Customization

### Adding New Variables

1. **Add to `:root`** (light mode):
```css
:root {
  --color-custom: #ff0000;
}
```

2. **Add to dark mode**:
```css
.dark,
[data-theme='dark'] {
  --color-custom: #ff6666; /* Lighter for dark mode */
}
```

### Overriding Variables

You can override variables at any level:

```css
/* Component-level override */
.my-special-component {
  --color-primary: #ff0000; /* Override for this component only */
}
```

## Browser Support

CSS Variables are supported in:
- ✅ Chrome 49+
- ✅ Firefox 31+
- ✅ Safari 9.1+
- ✅ Edge 15+
- ❌ IE 11 (not supported)

For IE 11 support, use CSS preprocessors (Sass/Less) or provide fallback values.

## Related Documentation

- [MDN: CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [ThemeContext Documentation](./theme-context.md)
- [Accessibility - Contrast Ratios](./accessibility-contrast.md)
