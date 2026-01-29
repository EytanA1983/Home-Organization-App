# תיקון owner_id במקום user_id - Room Model

## סיכום השינויים

שונה המודל `Room` להשתמש ב-`owner_id` במקום `user_id` כדי להיות עקבי עם מודלים אחרים (Task, Package, TodoList).

## קבצים שעודכנו

### 1. Models
- ✅ `backend/app/db/models.py` - שונה `user_id` ל-`owner_id` ב-Room model

### 2. API Routes
- ✅ `backend/app/api/rooms.py` - עודכן להשתמש ב-`owner_id`
- ✅ `backend/app/api/sharing.py` - עודכן להשתמש ב-`owner_id`
- ✅ `backend/app/api/audit.py` - עודכן להשתמש ב-`owner_id`

### 3. Services
- ✅ `backend/app/services/permissions.py` - עודכן להשתמש ב-`owner_id`
- ✅ `backend/app/services/statistics.py` - עודכן להשתמש ב-`owner_id`

### 4. GraphQL
- ✅ `backend/app/graphql/types.py` - עודכן להשתמש ב-`owner_id`
- ✅ `backend/app/graphql/queries.py` - עודכן להשתמש ב-`owner_id`
- ✅ `backend/app/graphql/mutations.py` - עודכן להשתמש ב-`owner_id`

### 5. Schemas
- ✅ `backend/app/schemas/room.py` - ה-RoomResponse עדיין מחזיר `user_id` ב-API (תאימות), אבל ממופה מ-`owner_id`

## הערות חשובות

1. **API Compatibility**: ה-`RoomResponse` schema עדיין מחזיר `user_id` ב-API response (לא `owner_id`) כדי לשמור על תאימות עם frontend. זה ממופה מ-`room.owner_id` ל-`user_id` ב-response.

2. **Database Migration**: אם יש מיגרציה קיימת, ייתכן שצריך ליצור מיגרציה חדשה לשנות את שם העמודה ב-DB מ-`user_id` ל-`owner_id`.

3. **Frontend**: ה-frontend לא צריך שינוי כי ה-API עדיין מחזיר `user_id` ב-response.

## בדיקה

לאחר השינויים, ודא:
- [ ] כל הקוד משתמש ב-`room.owner_id` (לא `room.user_id`)
- [ ] ה-API עדיין מחזיר `user_id` ב-response (תאימות)
- [ ] אין שגיאות runtime
- [ ] בדוק את כל ה-endpoints של rooms

## אם יש מיגרציה DB

אם יש מיגרציה קיימת, ייתכן שצריך:

```python
# alembic/versions/XXX_rename_room_user_id_to_owner_id.py
def upgrade():
    op.alter_column('rooms', 'user_id', new_column_name='owner_id')

def downgrade():
    op.alter_column('rooms', 'owner_id', new_column_name='user_id')
```
