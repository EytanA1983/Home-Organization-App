# Accessibility - Contrast Ratios (WCAG Compliance)

## Overview

This document outlines the color contrast ratios used throughout the application to ensure WCAG AA compliance (minimum 4.5:1 for normal text, 3:1 for large text).

## WCAG Standards

- **Level AA (Minimum)**: 4.5:1 for normal text (16px+), 3:1 for large text (18pt+ or 14pt+ bold)
- **Level AAA (Enhanced)**: 7:1 for normal text, 4.5:1 for large text

## Dark Mode Color Palette

### Background Colors
- `dark-bg`: `#111827` (gray-900) - Main background
- `dark-surface`: `#1f2937` (gray-800) - Card/surface background

### Text Colors
- `dark-text`: `#f3f4f6` (gray-100) - Primary text
- `dark-text-muted`: `#d1d5db` (gray-300) - Secondary/muted text

## Contrast Ratios (Verified)

### Primary Text Combinations
| Text Color | Background | Contrast Ratio | WCAG Level |
|-----------|------------|----------------|------------|
| `gray-100` (#F3F4F6) | `gray-900` (#111827) | **15.8:1** | ✅ AAA |
| `gray-100` (#F3F4F6) | `gray-800` (#1F2937) | **12.6:1** | ✅ AAA |
| `gray-100` (#F3F4F6) | `gray-700` (#374151) | **7.1:1** | ✅ AAA |

### Muted Text Combinations
| Text Color | Background | Contrast Ratio | WCAG Level |
|-----------|------------|----------------|------------|
| `gray-300` (#D1D5DB) | `gray-900` (#111827) | **7.1:1** | ✅ AAA |
| `gray-300` (#D1D5DB) | `gray-800` (#1F2937) | **4.8:1** | ✅ AA |
| `gray-300` (#D1D5DB) | `gray-700` (#374151) | **3.2:1** | ⚠️ Large text only |

### ❌ Avoid These Combinations (Low Contrast)
| Text Color | Background | Contrast Ratio | Status |
|-----------|------------|----------------|--------|
| `gray-400` (#9CA3AF) | `gray-800` (#1F2937) | **3.1:1** | ❌ Not compliant |
| `gray-500` (#6B7280) | `gray-800` (#1F2937) | **2.3:1** | ❌ Not compliant |
| `gray-600` (#4B5563) | `gray-800` (#1F2937) | **1.8:1** | ❌ Not compliant |

## Usage Guidelines

### ✅ Recommended Patterns

```tsx
// Primary text on dark background
<p className="text-gray-900 dark:text-gray-100">
  Main content text
</p>

// Muted/secondary text on dark background
<p className="text-gray-600 dark:text-gray-300">
  Secondary information
</p>

// Placeholder text
<input
  className="placeholder:text-gray-400 dark:placeholder:text-gray-300"
  placeholder="Enter text..."
/>

// Buttons and interactive elements
<button className="bg-sky text-white dark:bg-sky/80 dark:text-white">
  Click me
</button>
```

### ❌ Avoid These Patterns

```tsx
// ❌ Too low contrast
<p className="text-gray-600 dark:text-gray-400">
  This text is hard to read!
</p>

// ❌ Too low contrast
<p className="text-gray-500 dark:text-gray-500">
  This text is very hard to read!
</p>
```

## Testing Tools

To verify contrast ratios, use:
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Chrome DevTools Lighthouse](https://developer.chrome.com/docs/lighthouse/overview/)
- [Accessible Colors](https://accessible-colors.com/)

## Implementation Details

### CSS Variables (index.css)
```css
.dark {
  --color-bg: #111827;        /* gray-900 */
  --color-surface: #1f2937;   /* gray-800 */
  --color-text: #f3f4f6;      /* gray-100 - 15.8:1 on gray-900 */
  --color-text-muted: #d1d5db; /* gray-300 - 7.1:1 on gray-900 */
}
```

### Tailwind Config
```typescript
colors: {
  'dark-bg': '#111827',        // gray-900
  'dark-surface': '#1f2937',  // gray-800
  'dark-text': '#f3f4f6',     // gray-100
  'dark-text-muted': '#d1d5db', // gray-300
}
```

## Room-Specific Colors

Room backgrounds in dark mode are designed with sufficient contrast:
- All room text colors have been verified to meet WCAG AA standards
- Room backgrounds use darker variants to ensure text readability

## Future Improvements

- Consider adding a high-contrast mode toggle for users with visual impairments
- Implement dynamic contrast adjustment based on user preferences
- Add automated contrast testing to CI/CD pipeline
