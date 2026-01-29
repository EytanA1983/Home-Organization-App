# תיקון get_db_session במקום get_db

## סיכום השינויים

שונה השימוש ב-`get_db` ל-`get_db_session` (alias) בקבצי API כדי להיות עקבי.

## קבצים שעודכנו

### 1. API Routes
- ✅ `backend/app/api/rooms.py` - עודכן להשתמש ב-`get_db_session`
- ✅ `backend/app/api/tasks.py` - עודכן להשתמש ב-`get_db_session`
- ✅ `backend/app/api/todos.py` - עודכן להשתמש ב-`get_db_session`

## איך זה עובד?

### Import Pattern
```python
from app.db.session import get_db as get_db_session
```

### Usage
```python
def some_endpoint(
    db: Session = Depends(get_db_session),
    ...
):
    ...
```

## למה זה חשוב?

1. **עקביות**: כל הקוד משתמש באותו pattern
2. **בהירות**: השם `get_db_session` יותר ברור
3. **תחזוקה**: קל יותר לשנות את ה-implementation בעתיד

## קבצים שעדיין משתמשים ב-`get_db` ישירות

הקבצים הבאים עדיין משתמשים ב-`get_db` ישירות (לא `get_db_session`):
- `backend/app/api/audit.py`
- `backend/app/api/sharing.py`
- `backend/app/api/categories.py`
- `backend/app/api/drag_drop.py`
- `backend/app/api/ai.py`
- `backend/app/api/auth.py`
- `backend/app/api/email.py`
- `backend/app/api/statistics.py`
- `backend/app/api/recurring_tasks.py`
- `backend/app/api/notifications.py`
- `backend/app/api/google_calendar.py`

> **הערה**: אם רוצים, אפשר לעדכן גם את הקבצים האלה להשתמש ב-`get_db_session`.

## בדיקה

לאחר השינויים, ודא:
- [ ] כל הקוד ב-`rooms.py`, `tasks.py`, `todos.py` משתמש ב-`get_db_session`
- [ ] אין שגיאות runtime
- [ ] בדוק את כל ה-endpoints
