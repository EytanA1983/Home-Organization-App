# תצורת פורטים - Ports Configuration

## 🎯 פורטים ייחודיים

### Development (פיתוח)
- **Frontend**: `5178` ✅ (פורט ייחודי - שונה מ-5173 למניעת התנגשויות)
- **Backend**: `8000`
- **API Docs**: `http://localhost:8000/docs`

### Production (Docker)
- **Frontend**: `3000` (NGINX)
- **Backend**: `8000`
- **API Docs**: `http://localhost:8000/docs`

---

## 📋 טבלת פורטים

| שירות | Development | Production (Docker) |
|--------|-------------|---------------------|
| **Frontend** | `5178` (Vite) | `3000` (NGINX) |
| **Backend** | `8000` | `8000` |
| **Database** | `5432` | `5432` |
| **Redis** | `6379` | `6379` |

---

## 🔧 קבצי תצורה

### `frontend/vite.config.ts`
```typescript
server: {
  port: 5178, // Development port (unique port to avoid conflicts)
}
```

### `backend/app/main.py` (CORS)
```python
allow_origins=[
    "http://localhost:3000",
    "http://localhost:5178",  # Development
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5178",
]
```

### `backend/app/config.py` (CORS_ORIGINS)
```python
CORS_ORIGINS: List[str] = Field(
    default=["https://eli-maor.com", "http://localhost:3000", "http://localhost:5178", "http://localhost:8000"],
)
```

---

## 🚀 איך להריץ?

### Development:
```powershell
cd frontend
npm run dev
# פתח: http://localhost:5178
```

### Production:
```powershell
docker compose up
# פתח: http://localhost:3000
```

---

## ⚠️ למה 5178?

- **5173** הוא פורט ברירת מחדל של Vite ונפוץ מאוד
- **5178** הוא פורט ייחודי יותר - פחות סיכוי להתנגשויות
- קל לזכור: 5178 (קצת יותר מ-5173)

---

## 📝 עדכונים

✅ `frontend/vite.config.ts` - שונה ל-5178
✅ `backend/app/main.py` - CORS עודכן ל-5178
✅ `backend/app/config.py` - CORS_ORIGINS עודכן ל-5178
✅ `start-app.ps1` - עודכן ל-5178
