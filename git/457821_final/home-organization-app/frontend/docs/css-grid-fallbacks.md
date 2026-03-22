# CSS Grid Fallbacks

## Overview

This project includes comprehensive CSS Grid fallbacks for older browsers, particularly IE11. The fallbacks use Flexbox as the base layout system and progressively enhance to CSS Grid when supported.

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge | IE11 |
|---------|--------|---------|--------|------|------|
| Flexbox | 29+ | 22+ | 6.1+ | 12+ | ✓ (partial) |
| CSS Grid | 57+ | 52+ | 10.1+ | 16+ | ✗ |
| Container Queries | 105+ | 110+ | 16+ | 105+ | ✗ |
| aspect-ratio | 88+ | 89+ | 15+ | 88+ | ✗ |
| gap (flexbox) | 84+ | 63+ | 14.1+ | 84+ | ✗ |

## Usage

### Grid Cards (Room Cards, Task Cards)

```html
<!-- Automatically uses flexbox fallback or grid -->
<div class="grid-cards">
  <div class="card">Card 1</div>
  <div class="card">Card 2</div>
  <div class="card">Card 3</div>
</div>
```

**Behavior:**
- IE11/Old browsers: Flexbox with percentage-based widths
- Modern browsers: CSS Grid with `auto-fit` and `minmax()`

### Responsive Grid

```html
<div class="grid-responsive-1">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
</div>
```

**Columns by viewport:**
| Viewport | Columns (Flex) | Columns (Grid) |
|----------|----------------|----------------|
| < 475px | 1 | 1 |
| 475-767px | 2 | 2 |
| 768-1023px | 3 | 3 |
| 1024-1919px | 4 | 4 |
| 1920-2559px | 5 | 5 |
| 2560px+ | 6 | 6 |

### Form Grid

```html
<div class="grid-form grid-form-2">
  <input type="text" placeholder="First Name" />
  <input type="text" placeholder="Last Name" />
</div>
```

**Classes:**
- `.grid-form` - Base form grid
- `.grid-form-2` - 2 columns on tablet+
- `.grid-form-3` - 3 columns on tablet+

### Dashboard Grid

```html
<div class="grid-dashboard">
  <div class="stat-card">Stat 1</div>
  <div class="stat-card">Stat 2</div>
  <div class="stat-card">Stat 3</div>
  <div class="stat-card">Stat 4</div>
</div>
```

**Layout:**
- Mobile: 1 column
- Tablet (640px+): 2 columns
- Desktop (1024px+): 4 columns

### Auto-fit Grid

```html
<div class="grid-auto-fit">
  <div>Item with auto width</div>
  <div>Another item</div>
  <div>More items...</div>
</div>
```

Automatically fits items with minimum width of 180px.

## @supports Queries

The fallbacks use `@supports` to detect feature support:

```css
/* Flexbox fallback (default) */
.grid-cards {
  display: flex;
  flex-wrap: wrap;
}

/* Grid enhancement when supported */
@supports (display: grid) {
  .grid-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}
```

## Aspect Ratio Fallbacks

For `aspect-ratio` property, we use the padding-bottom trick:

```css
/* Padding fallback */
.aspect-16-9-fallback {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 9/16 */
}

.aspect-16-9-fallback > * {
  position: absolute;
  inset: 0;
}

/* Native support */
@supports (aspect-ratio: 1) {
  .aspect-16-9-fallback {
    height: auto;
    padding-bottom: 0;
    aspect-ratio: 16 / 9;
  }
}
```

**Available aspect ratio classes:**
- `.aspect-card` - 4:3
- `.aspect-hero` - 16:9
- `.aspect-portrait` - 3:4
- `.aspect-16-9-fallback` - 16:9 with explicit fallback
- `.aspect-4-3-fallback` - 4:3 with explicit fallback
- `.aspect-1-1-fallback` - 1:1 with explicit fallback

## Gap Fallback

IE11 doesn't support `gap` in flexbox:

```css
/* Margin-based gap fallback */
.flex-gap-fallback {
  display: flex;
  margin: -0.5rem;
}

.flex-gap-fallback > * {
  margin: 0.5rem;
}

/* Native gap when supported */
@supports (gap: 1rem) {
  .flex-gap-fallback {
    margin: 0;
    gap: 1rem;
  }
  
  .flex-gap-fallback > * {
    margin: 0;
  }
}
```

## Container Queries Fallback

Container queries fall back to media queries:

```css
/* Media query fallback */
@media (min-width: 400px) {
  .cq\:grid-cols-2 > * {
    flex: 1 1 calc(50% - 0.5rem);
  }
}

/* Container query when supported */
@supports (container-type: inline-size) {
  .container-query {
    container-type: inline-size;
  }
  
  @container (min-width: 400px) {
    .cq\:grid-cols-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
    }
  }
}
```

## IE11 Specific Fixes

For IE11-specific issues, use the media query hack:

```css
@media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
  /* IE11 specific styles */
  .flex-ie11-fix {
    flex-shrink: 0;
  }
}
```

## Testing

### Browser Testing

1. **BrowserStack** - Test on real IE11
2. **Chrome DevTools** - Disable CSS features to test fallbacks
3. **Firefox** - Use about:config to disable features

### Testing Fallbacks Manually

Add this to temporarily disable grid:

```css
/* Force flexbox fallback for testing */
.test-no-grid * {
  display: flex !important;
}
```

### Feature Detection in JavaScript

```javascript
// Check for grid support
const supportsGrid = CSS.supports('display', 'grid');

// Check for container queries
const supportsContainerQueries = CSS.supports('container-type', 'inline-size');

// Check for aspect-ratio
const supportsAspectRatio = CSS.supports('aspect-ratio', '1');

// Apply fallback classes if needed
if (!supportsGrid) {
  document.body.classList.add('no-grid');
}
```

## Best Practices

1. **Always provide fallback first**, then enhance with `@supports`
2. **Test on real devices**, not just emulators
3. **Use feature detection**, not browser detection
4. **Keep fallbacks simple** - don't try to replicate grid perfectly
5. **Document breakpoints** for both flex and grid implementations

## Files

- `src/styles/grid-fallback.css` - Main fallback styles
- `src/styles/responsive.css` - Responsive utilities with fallbacks
- `src/index.css` - Imports both files

## Performance Note

The fallback CSS adds some file size (~3KB uncompressed). Modern browsers will parse both but only apply the `@supports` block that matches. This is minimal overhead for broader compatibility.
