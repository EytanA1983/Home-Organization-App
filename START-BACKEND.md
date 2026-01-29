# 🚀 הרצת Backend - הוראות

## אופציה 1: עם Poetry (מומלץ)

```powershell
cd backend
poetry install
poetry run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## אופציה 2: עם Python ישירות

```powershell
cd backend
python -m pip install -r requirements.txt
python run-dev.py
```

או:

```powershell
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## אופציה 3: עם Docker

```powershell
docker compose up backend
```

## לפני הרצה - ודא שיש:

1. **קובץ `.env` ב-`backend/`** עם לפחות:
   ```
   SECRET_KEY=your-secret-key-here-change-this
   ```

2. **Database** - כברירת מחדל משתמש ב-SQLite (לא צריך כלום)
   - או PostgreSQL: `DATABASE_URL=postgresql+psycopg2://user:pass@localhost:5432/eli_maor`

## בדיקה:

פתח בדפדפן: http://localhost:8000/docs

אם אתה רואה את Swagger UI - הכל עובד! ✅
