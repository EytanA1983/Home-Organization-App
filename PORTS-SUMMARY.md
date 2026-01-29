# סיכום פורטים - Ports Summary

## 🎯 שני מצבים שונים

### 1. Development (ללא Docker)
**הרצה:** `npm run dev` בתיקיית `frontend/`

- **Frontend**: `http://localhost:5173` ✅
- **Backend**: `http://localhost:8000`
- **API Docs**: `http://localhost:8000/docs`

### 2. Production (עם Docker Compose)
**הרצה:** `docker-compose up`

- **Frontend**: `http://localhost:3000` ✅
- **Backend**: `http://localhost:8000`
- **API Docs**: `http://localhost:8000/docs`

---

## 📋 טבלת פורטים

| שירות | Development | Production (Docker) |
|--------|-------------|---------------------|
| **Frontend** | `5173` (Vite) | `3000` (NGINX) |
| **Backend** | `8000` | `8000` |
| **Database** | `5432` | `5432` |
| **Redis** | `6379` | `6379` |

---

## 🔧 קבצי תצורה

### `frontend/vite.config.ts`
```typescript
server: {
  port: 5173, // Development port
}
```

### `docker-compose.yml`
```yaml
frontend:
  ports:
    - "3000:80"  # NGINX מאזין על 80, חיצונית 3000
```

---

## 📝 קבצים עודכנו

- ✅ `frontend/vite.config.ts` - פורט 5173
- ✅ `frontend/README-DEV.md` - עודכן ל-5173
- ✅ `frontend/PORTS.md` - מסמך הסבר
- ✅ `QUICK-START-FRONTEND.md` - עודכן
- ✅ `START-HERE-SIMPLE.md` - עודכן
- ✅ `RUN-FRONTEND.ps1` - עודכן
- ✅ `start-app.ps1` - עודכן
- ✅ `start-all.ps1` - עודכן

---

## 🚀 איך להריץ?

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

---

## ⚠️ הערות חשובות

1. **Vite ברירת מחדל**: אם `5173` תפוס, Vite יבחר פורט אחר אוטומטית
2. **Docker Compose**: NGINX בתוך הקונטיינר מאזין על פורט `80`, Docker מפנה `3000:80`
3. **CORS**: Backend מוגדר לתמוך בשני הפורטים (`5173` ו-`3000`)
