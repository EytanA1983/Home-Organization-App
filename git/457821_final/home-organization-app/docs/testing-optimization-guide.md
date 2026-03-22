# Testing & Optimization Guide

## תוכן עניינים

1. [בדיקות אוטומטיות](#בדיקות-אוטומטיות)
2. [אופטימיזציה](#אופטימיזציה)
3. [בדיקת Errors](#בדיקת-errors)
4. [בדיקת כפילויות](#בדיקת-כפילויות)
5. [הקטנת גודל קוד](#הקטנת-גודל-קוד)
6. [שיפור ביצועים](#שיפור-ביצועים)

---

## בדיקות אוטומטיות

### סקריפטים זמינים

#### 1. `TEST-ALL.ps1` - בדיקה מקיפה

בודק את כל המערכת לאיתור:
- ❌ Python syntax errors
- ❌ TypeScript errors
- ⚠️ ESLint warnings
- ⚠️ Ruff warnings
- 🔄 קבצים כפולים
- 📦 imports מיותרים
- 📊 גודל bundle
- 🐘 קבצים גדולים

**Usage**:
```powershell
.\TEST-ALL.ps1
```

**Output Example**:
```
✅ All tests passed! No errors or warnings found.
🚀 Application is optimized and ready for production.
```

#### 2. `OPTIMIZE-CODE.ps1` - אופטימיזציה אוטומטית

מתקן אוטומטית:
- 🧹 הסרת imports מיותרים
- 🎨 פורמט קוד (ruff, prettier)
- 📦 סידור imports
- 🗑️ ניקוי cache files
- 🖼️ אופטימיזציית תמונות

**Usage**:
```powershell
.\OPTIMIZE-CODE.ps1
```

---

## אופטימיזציה

### Backend

#### 1. Python Code Quality

**Check**:
```powershell
cd backend
poetry run ruff check .
poetry run mypy .
```

**Auto-fix**:
```powershell
poetry run ruff check --fix .
poetry run ruff format .
```

#### 2. Remove Unused Imports

```powershell
cd backend
poetry run ruff check --fix --select F401 .
```

#### 3. Sort Imports

```powershell
cd backend
poetry run ruff check --fix --select I .
```

#### 4. Check for Duplicate Code

```powershell
cd backend
# Manual inspection or use tools like:
# - pylint --disable=all --enable=duplicate-code .
```

### Frontend

#### 1. TypeScript Check

```powershell
cd frontend
npx tsc --noEmit
```

#### 2. ESLint

**Check**:
```powershell
npm run lint
```

**Auto-fix**:
```powershell
npm run lint:fix
```

#### 3. Format Code

```powershell
npm run format
```

#### 4. Bundle Size Analysis

```powershell
npm run build:analyze
# Opens visual bundle analyzer
```

#### 5. Check Bundle Size

```powershell
npm run build
npm run size
```

**Expected Size**:
- Total: < 1 MB (gzipped)
- Main chunk: < 300 KB
- Vendor chunks: < 500 KB

---

## בדיקת Errors

### Critical Errors (Must Fix)

#### Backend

1. **Import Errors**
   ```bash
   ModuleNotFoundError: No module named 'xyz'
   ```
   **Fix**: `poetry add xyz`

2. **Syntax Errors**
   ```bash
   SyntaxError: invalid syntax
   ```
   **Fix**: Check Python version compatibility

3. **Type Errors (mypy)**
   ```bash
   error: Incompatible types in assignment
   ```
   **Fix**: Add proper type hints

#### Frontend

1. **TypeScript Errors**
   ```bash
   error TS2322: Type 'X' is not assignable to type 'Y'
   ```
   **Fix**: Fix type definitions

2. **Import Errors**
   ```bash
   Cannot find module '@/components/XYZ'
   ```
   **Fix**: Check file path or add missing file

3. **Build Errors**
   ```bash
   [vite]: Rollup failed to resolve import
   ```
   **Fix**: Install missing dependency

---

## בדיקת כפילויות

### Files

```powershell
# Find duplicate filenames
Get-ChildItem -Recurse -File |
  Group-Object Name |
  Where-Object { $_.Count -gt 1 } |
  Select-Object Name, Count
```

### Components (Frontend)

```powershell
cd frontend
Get-ChildItem -Path src -Recurse -Filter "*.tsx" |
  Group-Object Name |
  Where-Object { $_.Count -gt 1 }
```

**Common Duplicates to Check**:
- `Button.tsx` / `Button.tsx` (different dirs)
- `Card.tsx` / `RoomCard.tsx` (different purpose?)
- `Modal.tsx` / `Dialog.tsx` (same functionality?)

### Code Duplication

**Tools**:
- Backend: `radon cc -a .` (cyclomatic complexity)
- Frontend: `jscpd src/` (copy-paste detector)

---

## הקטנת גודל קוד

### Backend

#### 1. Remove Unused Dependencies

```powershell
cd backend
poetry show | Select-String "Used"
# Manually review and remove unused packages
poetry remove <unused-package>
```

#### 2. Optimize Imports

```python
# ❌ Bad
from app.db.models import User, Room, Task, Category, Todo, ...

# ✅ Good
from app.db.models import User, Room
```

#### 3. Remove Dead Code

- Unused functions
- Commented-out code
- Debug print statements

### Frontend

#### 1. Tree Shaking

Ensure unused exports are removed:

```typescript
// ❌ Bad - exports everything
export * from './utils';

// ✅ Good - explicit exports
export { formatDate, parseDate } from './utils';
```

#### 2. Code Splitting

```typescript
// ✅ Good - lazy load heavy components
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
```

#### 3. Remove Unused Dependencies

```powershell
cd frontend
npm run build
npx depcheck
# Remove unused packages
npm uninstall <unused-package>
```

#### 4. Optimize Images

```powershell
cd frontend
node scripts/optimize-images.js
```

**Expected Results**:
- WebP format (50-80% smaller)
- Responsive sizes (400w, 800w, 1200w)
- Lazy loading

---

## שיפור ביצועים

### Backend

#### 1. Database Queries

**Check N+1 queries**:
```python
# ❌ Bad - N+1 query
for room in rooms:
    room.tasks  # Separate query for each room

# ✅ Good - Single query with joinedload
rooms = db.query(Room).options(joinedload(Room.tasks)).all()
```

#### 2. Caching

```python
# Add caching for frequent queries
from app.core.cache import cache_get, cache_set

@router.get("/rooms")
async def get_rooms(...):
    cached = await cache_get(f"user:{user_id}:rooms")
    if cached:
        return cached
    # ... fetch from DB ...
    await cache_set(f"user:{user_id}:rooms", rooms, ttl=60)
```

#### 3. Indexes

Ensure all frequently queried columns have indexes:

```sql
CREATE INDEX ix_tasks_user_id ON tasks(user_id);
CREATE INDEX ix_tasks_room_id ON tasks(room_id);
CREATE INDEX ix_tasks_created_at ON tasks(created_at);
```

### Frontend

#### 1. React Performance

**Use React.memo**:
```typescript
export const RoomCard = React.memo(({ room }) => {
  // ...
});
```

**Use useCallback**:
```typescript
const handleDelete = useCallback(() => {
  deleteRoom(room.id);
}, [room.id]);
```

**Use useMemo**:
```typescript
const filteredTasks = useMemo(() =>
  tasks.filter(t => t.completed === false),
  [tasks]
);
```

#### 2. Bundle Optimization

**vite.config.ts**:
```typescript
build: {
  minify: 'esbuild',  // Fast minification
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom'],
        'query-vendor': ['@tanstack/react-query'],
        // ... split vendors
      }
    }
  }
}
```

#### 3. Network Optimization

- ✅ HTTP/2 Push (NGINX)
- ✅ Compression (gzip/brotli)
- ✅ CDN for static assets
- ✅ Service Worker caching

---

## Checklist לפני Production

### Backend

- [ ] All tests pass (`pytest`)
- [ ] No linter errors (`ruff check`)
- [ ] Type checking passes (`mypy`)
- [ ] Security scan clean (`bandit`, `safety`)
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] Secrets secured (Vault/AWS Secrets Manager)
- [ ] Logging configured (CloudWatch/ELK)
- [ ] Monitoring setup (Prometheus/Grafana)

### Frontend

- [ ] TypeScript check passes (`npx tsc --noEmit`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Bundle size < 1MB
- [ ] Images optimized (WebP, lazy loading)
- [ ] PWA configured (manifest, service worker)
- [ ] Accessibility tested (WCAG AA)
- [ ] i18n translations complete
- [ ] Dark mode works

### Performance

- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Core Web Vitals pass
- [ ] No memory leaks
- [ ] API response time < 200ms

---

## Monitoring & Alerts

### Metrics to Track

**Backend**:
- Request rate (requests/sec)
- Error rate (%)
- Response time (p50, p95, p99)
- Database query time
- Cache hit rate

**Frontend**:
- Page load time
- Bundle size
- Error rate (Sentry)
- User engagement
- Bounce rate

### Alerts

Set up alerts for:
- Error rate > 1%
- Response time > 500ms (p95)
- Database connections > 80% pool
- Memory usage > 80%
- Disk usage > 90%

---

## Tools Reference

### Backend

| Tool | Purpose | Command |
|------|---------|---------|
| ruff | Linter | `poetry run ruff check .` |
| mypy | Type checker | `poetry run mypy .` |
| bandit | Security | `poetry run bandit -r .` |
| pytest | Testing | `poetry run pytest` |
| coverage | Code coverage | `poetry run pytest --cov` |

### Frontend

| Tool | Purpose | Command |
|------|---------|---------|
| TypeScript | Type checker | `npx tsc --noEmit` |
| ESLint | Linter | `npm run lint` |
| Prettier | Formatter | `npm run format` |
| Vitest | Testing | `npm run test` |
| Cypress | E2E testing | `npm run e2e` |

---

## Quick Commands

```powershell
# Full test & optimization cycle
.\TEST-ALL.ps1            # Check for issues
.\OPTIMIZE-CODE.ps1       # Auto-fix what can be fixed
.\TEST-ALL.ps1            # Verify fixes

# Backend
cd backend
poetry run ruff check --fix .
poetry run ruff format .
poetry run pytest

# Frontend
cd frontend
npm run lint:fix
npm run format
npm run build
npm run test

# Start servers
.\RUN-SERVERS.ps1
```

---

## Support

For issues or questions:
1. Check logs: `backend/logs/` or browser console
2. Review error messages
3. Run `.\TEST-ALL.ps1` for diagnosis
4. Check documentation in `docs/`
