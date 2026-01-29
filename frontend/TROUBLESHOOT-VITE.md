# Troubleshooting Vite Configuration

## Error: "failed to load config from vite.config.ts"

### Possible Causes

1. **TypeScript compilation error**
2. **Missing dependencies**
3. **Syntax error in config**
4. **Node.js version mismatch**

### Solutions

#### 1. Check TypeScript Compilation

```powershell
cd frontend
npx tsc --noEmit
```

If there are TypeScript errors, fix them first.

#### 2. Reinstall Dependencies

```powershell
cd frontend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

#### 3. Verify vite.config.ts Syntax

The current configuration uses **esbuild** for minification (faster than terser):

```typescript
build: {
  minify: 'esbuild',  // ✅ Fast (2-10x faster than terser)
  // Note: esbuild automatically removes console.log in production
}
```

#### 4. Check Node.js Version

esbuild requires Node.js 14+:

```powershell
node --version
```

Expected: v18+ or v20+

If using older version, upgrade or switch back to terser:

```typescript
build: {
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true,
    },
  },
}
```

#### 5. Check for Plugin Issues

The config uses several plugins that might cause issues:

- `@vitejs/plugin-react`
- `rollup-plugin-visualizer`
- `vite-plugin-pwa`
- `vite-imagetools`

Try disabling plugins one by one to isolate the issue:

```typescript
export default defineConfig({
  plugins: [
    react(),
    // Comment out other plugins temporarily
    // imagetools(...),
    // VitePWA(...),
    // visualizer(...),
  ],
  // ... rest of config
})
```

#### 6. Run with Debug Mode

```powershell
cd frontend
$env:DEBUG="vite:*"
npm run dev
```

This will show detailed debug information.

#### 7. Clear Vite Cache

```powershell
cd frontend
Remove-Item -Recurse -Force node_modules/.vite
npm run dev
```

### Quick Fix Script

Run this PowerShell script from project root:

```powershell
# Navigate to frontend
cd "C:\Users\maore\git\סידור וארגון הבית - אלי מאור\frontend"

# Clear cache
Remove-Item -Recurse -Force node_modules/.vite -ErrorAction SilentlyContinue

# Check TypeScript
Write-Host "Checking TypeScript..." -ForegroundColor Cyan
npx tsc --noEmit

# Run dev server
Write-Host "Starting dev server..." -ForegroundColor Cyan
npm run dev
```

### Alternative: Use terser Instead of esbuild

If esbuild continues to cause issues, revert to terser:

**vite.config.ts**:
```typescript
build: {
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true,
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.info', 'console.debug'],
    },
    mangle: true,
  },
}
```

Pros of terser:
- More stable
- More minification options
- Better compatibility

Cons:
- 2-10x slower than esbuild

### Common Errors and Solutions

#### Error: "Cannot find module 'vite'"

```powershell
npm install --save-dev vite
```

#### Error: "Plugin x is not installed"

```powershell
npm install --save-dev @vitejs/plugin-react rollup-plugin-visualizer vite-plugin-pwa vite-imagetools
```

#### Error: "TypeScript compilation failed"

Check `tsconfig.json` and fix any type errors:

```powershell
npx tsc --noEmit
```

### Verify Setup

After fixes, verify everything works:

```powershell
cd frontend

# 1. TypeScript check
npm run typecheck

# 2. Build (production)
npm run build

# 3. Dev server
npm run dev
```

### Contact

If the issue persists, run:

```powershell
cd frontend
npm run dev > error-log.txt 2>&1
```

Then check `error-log.txt` for the full error message.
