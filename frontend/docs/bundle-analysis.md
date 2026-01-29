# Bundle Analysis Guide

## Quick Commands

```bash
# Build and analyze with source-map-explorer
npm run build:analyze

# Build and visualize with rollup-plugin-visualizer
npm run build:visualize

# Just analyze an existing build
npm run analyze

# Quick size check
npm run size
```

## Understanding the Output

### source-map-explorer
Opens an interactive treemap showing:
- File sizes before and after gzip
- Which modules contribute to bundle size
- Where to focus optimization efforts

### rollup-plugin-visualizer
Generates `stats.html` with:
- Treemap of all chunks
- Gzip and Brotli sizes
- Dependency tree visualization

## Current Chunk Structure

Our Vite config splits the bundle into:

| Chunk | Contents | Expected Size |
|-------|----------|---------------|
| `react-vendor` | React, ReactDOM | ~140KB |
| `router-vendor` | React Router | ~30KB |
| `query-vendor` | TanStack Query | ~40KB |
| `i18n-vendor` | i18next | ~50KB |
| `calendar-vendor` | FullCalendar | ~200KB+ |
| `dnd-vendor` | DnD Kit | ~30KB |
| `http-vendor` | Axios | ~15KB |
| `vendor` | Other deps | Variable |

## Optimization Strategies

### 1. Lazy Loading Heavy Components

For FullCalendar (heaviest dependency):

```tsx
// Before - loads on initial page
import { FullCalendar } from '@fullcalendar/react';

// After - lazy load when needed
const FullCalendar = React.lazy(() => import('./components/FullCalendar'));

function CalendarPage() {
  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <FullCalendar />
    </Suspense>
  );
}
```

### 2. Replace Heavy Libraries

| Heavy | Lightweight | Savings |
|-------|-------------|---------|
| moment.js (~300KB) | Native Date | ~300KB |
| lodash (~500KB) | lodash-es (tree-shakeable) | ~400KB |
| date-fns (~75KB) | Native Date | ~75KB |

We currently use **Native Date** - no heavy date library! ✅

### 3. Tree-Shaking Verification

Check if tree-shaking works:

```bash
# Build and look for specific unused exports
npm run build 2>&1 | grep "unused"
```

### 4. Import Optimization

```tsx
// Bad - imports entire library
import _ from 'lodash';
_.debounce(fn, 300);

// Good - imports only what's needed
import debounce from 'lodash/debounce';
debounce(fn, 300);

// Best - use native or tiny alternatives
function debounce(fn, ms) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}
```

## Bundle Size Targets

| Metric | Target | Current |
|--------|--------|---------|
| Initial JS | < 200KB gzip | TBD |
| Initial CSS | < 30KB gzip | TBD |
| Total Initial | < 250KB gzip | TBD |
| LCP | < 2.5s | TBD |
| TTI | < 3.5s | TBD |

## Monitoring Bundle Size in CI

Add to GitHub Actions:

```yaml
- name: Build and check bundle size
  run: |
    npm run build
    # Check if any chunk exceeds 500KB
    find dist/assets -name "*.js" -size +500k | while read f; do
      echo "::warning::Large chunk: $f"
    done
```

## Common Issues

### 1. Duplicate React
If you see React twice in the bundle:
```bash
npm ls react  # Check for duplicates
npm dedupe    # Fix duplicates
```

### 2. Large CSS
If CSS is bloated:
- Check Tailwind `content` paths
- Verify `safelist` isn't too broad
- Run `npx tailwindcss --help` for purge info

### 3. Unused Exports
Enable Vite's report:
```ts
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      // Shows unused exports
      experimentalLogSideEffects: true
    }
  }
}
```

## Further Reading

- [Vite Build Optimization](https://vitejs.dev/guide/build.html)
- [Rollup Code Splitting](https://rollupjs.org/guide/en/#code-splitting)
- [web.dev Performance](https://web.dev/performance/)
