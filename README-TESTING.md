# Testing & Optimization - Quick Start

## 🚀 Quick Commands

### 1. Run Complete Test Suite

```powershell
cd "C:\Users\maore\git\סידור וארגון הבית - אלי מאור"
.\TEST-ALL.ps1
```

### 2. Auto-Optimize & Fix Issues

```powershell
.\OPTIMIZE-CODE.ps1
```

### 3. Manual Testing

#### Backend
```powershell
cd backend

# Lint check
poetry run ruff check .

# Type check
poetry run mypy .

# Run tests
poetry run pytest

# Format code
poetry run ruff format .
```

#### Frontend
```powershell
cd frontend

# TypeScript check
npx tsc --noEmit

# Lint
npm run lint

# Fix linting issues
npm run lint:fix

# Format
npm run format

# Build & analyze
npm run build:analyze
```

---

## 📁 Files Created

### Scripts

1. **`TEST-ALL.ps1`** - מקיף בדיקה של כל המערכת
2. **`OPTIMIZE-CODE.ps1`** - אופטימיזציה אוטומטית
3. **`RUN-FRONTEND-DEBUG.ps1`** - debug של frontend
4. **`SETUP-GITHUB.ps1`** - הכנה ל-GitHub
5. **`COMMIT-ALL.ps1`** - commit אוטומטי
6. **`RUN-SERVERS.ps1`** - הרצת שני השרתים

### Documentation

1. **`docs/testing-optimization-guide.md`** - מדריך מפורט
2. **`frontend/TROUBLESHOOT-VITE.md`** - troubleshooting Vite
3. **`GITHUB-SETUP-GUIDE.md`** - מדריך GitHub
4. **`docs/build-optimizations.md`** - אופטימיזציות build

---

## 🔍 What Gets Checked

### Backend ✅

- [x] Python syntax errors
- [x] Ruff linting
- [x] Unused imports
- [x] Duplicate files
- [x] Code formatting
- [x] Dependencies count

### Frontend ✅

- [x] TypeScript errors
- [x] ESLint warnings
- [x] Duplicate components
- [x] Bundle size analysis
- [x] Large files detection
- [x] Dependencies audit
- [x] CSS optimization

### General ✅

- [x] Large files (>1MB)
- [x] Duplicate documentation
- [x] Cache cleanup
- [x] Dead code detection

---

## 🎯 Expected Results

### Healthy Project

```
✅ All tests passed! No errors or warnings found.
🚀 Application is optimized and ready for production.

Errors found: 0
Warnings found: 0
```

### Bundle Size Targets

| Asset | Target | Status |
|-------|--------|--------|
| Total Bundle | < 1 MB | ✅ |
| Main JS | < 300 KB | ✅ |
| Vendor JS | < 500 KB | ✅ |
| CSS | < 100 KB | ✅ |

### Performance Targets

| Metric | Target | Tool |
|--------|--------|------|
| First Contentful Paint | < 1.5s | Lighthouse |
| Time to Interactive | < 3s | Lighthouse |
| Bundle Size | < 1MB | Rollup Visualizer |
| API Response | < 200ms | Prometheus |

---

## 🐛 Common Issues & Fixes

### Issue: TypeScript Errors

```powershell
cd frontend
npx tsc --noEmit
# Fix errors in reported files
```

### Issue: ESLint Warnings

```powershell
cd frontend
npm run lint:fix
```

### Issue: Large Bundle Size

```powershell
cd frontend
npm run build:analyze
# Review large chunks and lazy load them
```

### Issue: Unused Dependencies

```powershell
cd frontend
npx depcheck
npm uninstall <unused-package>
```

### Issue: Vite Build Fails

See `frontend/TROUBLESHOOT-VITE.md`

---

## 📊 Monitoring

### After Optimization

Run these commands to verify improvements:

```powershell
# Check bundle size
cd frontend
npm run build
Get-ChildItem dist -Recurse | Measure-Object -Property Length -Sum

# Check TypeScript
npx tsc --noEmit

# Check linting
npm run lint

# Run tests
npm run test
```

### Continuous Monitoring

Set up these tools:
- **Backend**: Prometheus + Grafana
- **Frontend**: Lighthouse CI
- **Errors**: Sentry
- **Performance**: New Relic / Datadog

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Run `.\TEST-ALL.ps1` - all green
- [ ] Run `.\OPTIMIZE-CODE.ps1` - optimized
- [ ] Backend tests pass
- [ ] Frontend build succeeds
- [ ] Bundle size < 1MB
- [ ] Lighthouse score > 90
- [ ] Security scan clean
- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] Monitoring configured

---

## 💡 Pro Tips

### 1. Pre-commit Hook

Add to `.git/hooks/pre-commit`:
```bash
#!/bin/sh
cd frontend && npm run typecheck && npm run lint
cd ../backend && poetry run ruff check .
```

### 2. CI/CD Integration

GitHub Actions already configured in `.github/workflows/ci.yml`

### 3. Bundle Analysis

Run weekly:
```powershell
cd frontend
npm run build:analyze
```

Review:
- Large vendors (can we split?)
- Unused code (can we remove?)
- Duplicate code (can we dedupe?)

### 4. Performance Budget

Set in `vite.config.ts`:
```typescript
build: {
  chunkSizeWarningLimit: 500, // KB
}
```

---

## 📚 Additional Resources

- [Full Testing Guide](docs/testing-optimization-guide.md)
- [Build Optimizations](docs/build-optimizations.md)
- [Vite Troubleshooting](frontend/TROUBLESHOOT-VITE.md)
- [GitHub Setup](GITHUB-SETUP-GUIDE.md)

---

## 🆘 Need Help?

1. Check error logs
2. Review relevant documentation
3. Run `.\TEST-ALL.ps1` for diagnosis
4. Check `docs/` for guides

---

**Last Updated**: 2026-01-29

**Project**: אלי מאור – סידור וארגון הבית
