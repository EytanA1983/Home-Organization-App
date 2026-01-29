# התקנת תלויות - Backend

## ⚠️ חשוב: זה **FastAPI**, לא Django!

הפרויקט הזה משתמש ב-**FastAPI** (framework מודרני ל-Python), לא Django.

## התקנת תלויות

### אפשרות 1: pip (פשוט)
```powershell
cd backend
pip install fastapi uvicorn sqlalchemy pydantic pydantic-settings python-dotenv python-jose[cryptography] passlib[bcrypt] redis celery[redis] pywebpush
```

### אפשרות 2: Poetry (מומלץ)
```powershell
cd backend
poetry install
```

### אפשרות 3: requirements.txt
```powershell
cd backend
pip install -r requirements.txt
```

## תלויות עיקריות:
- **fastapi** - Framework ל-API
- **uvicorn** - שרת ASGI
- **sqlalchemy** - ORM למסד נתונים
- **pydantic** - Validation של נתונים
- **celery** - Task queue
- **redis** - Broker ל-Celery

## בדיקה:
```powershell
python -c "import fastapi; print('FastAPI installed!')"
```

## אם יש שגיאות:
1. ודא ש-Python 3.11+ מותקן
2. נסה: `python -m pip install --upgrade pip`
3. נסה: `pip install --user fastapi uvicorn`
