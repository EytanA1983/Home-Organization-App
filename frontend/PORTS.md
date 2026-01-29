# Ports Configuration - הסבר

## שני מצבים שונים

### 1. Development (Vite Dev Server)
- **פורט**: `5173` (ברירת מחדל של Vite)
- **קובץ**: `frontend/vite.config.ts`
- **הרצה**: `npm run dev`
- **גישה**: `http://localhost:5173`

### 2. Production (Docker + NGINX)
- **פורט**: `3000` (חיצונית)
- **קובץ**: `docker-compose.yml`
- **הרצה**: `docker-compose up`
- **גישה**: `http://localhost:3000`
- **פרטים**:
  - NGINX בתוך הקונטיינר מאזין על פורט `80`
  - Docker מפנה `3000:80` (חיצונית:פנימית)

## למה שני פורטים?

1. **Development** (`5173`):
   - Vite dev server עם HMR (Hot Module Replacement)
   - לא צריך NGINX
   - פורט ברירת מחדל של Vite

2. **Production** (`3000`):
   - NGINX מגיש קבצים סטטיים (build)
   - Docker מפנה את הפורט
   - פורט סטנדרטי לאפליקציות web

## קבצי תצורה

### `frontend/vite.config.ts`
```typescript
server: {
  host: '0.0.0.0',
  port: 5173, // Development port
  strictPort: false,
}
```

### `docker-compose.yml`
```yaml
frontend:
  ports:
    - "3000:80"  # NGINX מאזין על 80, חיצונית 3000
```

## איך להריץ?

### Development:
```powershell
cd frontend
npm run dev
# פתח: http://localhost:5173
```

### Production:
```powershell
docker-compose up
# פתח: http://localhost:3000
```

## סיכום

| מצב | פורט | שרת | קובץ |
|-----|------|-----|------|
| **Development** | `5173` | Vite Dev Server | `vite.config.ts` |
| **Production** | `3000` | NGINX (Docker) | `docker-compose.yml` |
