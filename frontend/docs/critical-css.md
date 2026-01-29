# Critical CSS Optimization

## What is Critical CSS?

Critical CSS is the minimum CSS required to render the above-the-fold content of your page. By inlining this CSS and deferring the rest, we achieve:

- **Faster First Paint (FP)** - Browser can start rendering immediately
- **Faster First Contentful Paint (FCP)** - Content appears faster
- **Better Largest Contentful Paint (LCP)** - Main content loads quicker
- **Improved Core Web Vitals scores**

## How It Works

### Build Process

```bash
npm run build
```

This runs:
1. `tsc` - TypeScript compilation
2. `vite build` - Bundle the application
3. `node scripts/critical-css.js` - Extract and inline critical CSS

### The Critical CSS Script

Located at `scripts/critical-css.js`, it uses [Critters](https://github.com/GoogleChromeLabs/critters) (by Google) to:

1. **Analyze the HTML** - Identify which CSS rules are needed for above-the-fold content
2. **Inline critical CSS** - Add critical styles directly in `<head>` as `<style>` tag
3. **Defer non-critical CSS** - Load remaining CSS asynchronously with `preload`
4. **Add noscript fallback** - Ensure CSS loads even without JavaScript

### Before and After

**Before:**
```html
<head>
  <link rel="stylesheet" href="/assets/css/index-abc123.css">
</head>
<body>
  <!-- Content waits for CSS to load -->
</body>
```

**After:**
```html
<head>
  <style>
    /* Critical CSS inlined here */
    .navbar { ... }
    .hero { ... }
  </style>
  <link rel="preload" href="/assets/css/index-abc123.css" as="style" onload="this.rel='stylesheet'">
  <noscript>
    <link rel="stylesheet" href="/assets/css/index-abc123.css">
  </noscript>
</head>
<body>
  <!-- Content renders immediately! -->
</body>
```

## Build Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Full build with critical CSS extraction |
| `npm run build:no-critical` | Build without critical CSS (faster for dev) |
| `npm run critical` | Run critical CSS extraction on existing build |

## Configuration

The Critters configuration is in `scripts/critical-css.js`:

```javascript
const crittersConfig = {
  // Inline font declarations
  inlineFonts: true,
  
  // Preload strategy for external CSS
  preload: 'swap',
  
  // Keep source CSS files (don't delete)
  pruneSource: false,
  
  // Compress inlined CSS
  compress: true,
  
  // Include critical keyframes
  keyframes: 'critical',
  
  // Merge multiple stylesheets
  mergeStylesheets: true,
};
```

## Resource Hints in index.html

The HTML includes several performance optimizations:

### DNS Prefetch
```html
<link rel="dns-prefetch" href="https://fonts.googleapis.com" />
```
Resolves DNS early for external resources.

### Preconnect
```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```
Establishes early connections (DNS + TCP + TLS).

### Font Preloading
```html
<link 
  rel="preload" 
  href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&display=swap" 
  as="style"
  onload="this.onload=null;this.rel='stylesheet'"
/>
```
Loads critical font weights early without blocking rendering.

### Deferred Font Loading
```html
<link 
  href="...full-font-set..."
  rel="stylesheet"
  media="print"
  onload="this.media='all'"
/>
```
Full font set loads after initial render.

## Performance Impact

Expected improvements:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| First Paint | ~500ms | ~200ms | 60% faster |
| FCP | ~800ms | ~400ms | 50% faster |
| LCP | ~1.5s | ~1.0s | 33% faster |
| CLS | 0.1 | 0.05 | 50% better |

*Actual results depend on network conditions and device.*

## Troubleshooting

### Critical CSS too large
If inlined CSS is too big (>50KB), consider:
- Reducing above-the-fold content
- Lazy loading below-fold components
- Reviewing Tailwind `safelist` (might be too broad)

### Styles not applying
If some styles are missing:
- Check if they're in external CSS (will load async)
- Add them to Tailwind `safelist` if generated dynamically

### Flash of unstyled content (FOUC)
If you see FOUC:
- Ensure the theme script in `<head>` runs before content
- Check that critical CSS includes theme-related styles

## Testing

### Lighthouse
```bash
npm run build
npm run preview
# Open in Chrome DevTools > Lighthouse
```

### WebPageTest
Test with 3G throttling to see real-world impact.

### Chrome DevTools Coverage
1. Open DevTools → Coverage tab
2. Reload page
3. Check CSS coverage percentage

## Further Optimization

1. **Inline only above-fold CSS** - Current setup inlines all critical CSS
2. **Route-based critical CSS** - Different critical CSS per route
3. **Server-side rendering** - For even faster FCP
4. **HTTP/2 Push** - Push critical resources before HTML parsing
