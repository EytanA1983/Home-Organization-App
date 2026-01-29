# Audit Logging - רישום כל שינוי (CRUD)

## סקירה כללית

מערכת ה-Audit Logging רושמת את כל השינויים (CRUD) במערכת בטבלת `audit_logs`. זה מאפשר לעקוב אחר:
- **מי** ביצע את השינוי (user_id, user_email)
- **מתי** השינוי בוצע (created_at)
- **מה** השתנה (old_values → new_values)
- **איפה** השינוי בוצע (ip_address, user_agent)

## מודל AuditLog

```python
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: int
    user_id: Optional[int]  # NULL אם לא מחובר
    user_email: Optional[str]  # נשמר גם אם משתמש נמחק
    table_name: str  # שם הטבלה (tasks, rooms, etc.)
    record_id: int  # ID של הרשומה
    action: AuditAction  # CREATE, UPDATE, DELETE
    old_values: Optional[str]  # JSON string של ערכים ישנים
    new_values: Optional[str]  # JSON string של ערכים חדשים
    changed_fields: Optional[str]  # JSON array של שדות שהשתנו
    created_at: datetime
    ip_address: Optional[str]
    user_agent: Optional[str]
```

## AuditAction Enum

```python
class AuditAction(enum.Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
```

## שימוש ב-Audit Logging

### 1. Dependency: `get_audit_context`

```python
from app.api.deps_audit import get_audit_context

@router.post("/")
def create_item(
    request: Request,
    item_data: ItemCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    audit_context: dict = Depends(get_audit_context),  # הוסף את זה
):
    # ...
```

### 2. CREATE - יצירת רשומה חדשה

```python
from app.services.audit import audit_service, AuditAction

# יצירת הרשומה
item = Item(**item_data.dict(), user_id=user.id)
db.add(item)
db.flush()  # Flush כדי לקבל את ה-ID

# רישום audit log
new_values = item_data.dict()
audit_service.create_audit_log(
    session=db,
    instance=item,
    action=AuditAction.CREATE,
    user_id=audit_context["user_id"],
    user_email=audit_context["user_email"],
    new_values=new_values,
    ip_address=audit_context["ip_address"],
    user_agent=audit_context["user_agent"],
)

db.commit()
```

### 3. UPDATE - עדכון רשומה

```python
# קבלת השדות שהשתנו לפני העדכון
changed_fields = audit_service.get_changed_fields(item, db)

# עדכון הרשומה
for key, value in item_data.dict(exclude_unset=True).items():
    setattr(item, key, value)

db.flush()  # Flush כדי לקבל ערכים מעודכנים

# קבלת השדות שהשתנו אחרי העדכון
changed_fields = audit_service.get_changed_fields(item, db)

if changed_fields:
    # הכנת old ו-new values
    old_values = {field: data["old"] for field, data in changed_fields.items()}
    new_values = {field: data["new"] for field, data in changed_fields.items()}

    # רישום audit log
    audit_service.create_audit_log(
        session=db,
        instance=item,
        action=AuditAction.UPDATE,
        user_id=audit_context["user_id"],
        user_email=audit_context["user_email"],
        old_values=old_values,
        new_values=new_values,
        changed_fields=changed_fields,
        ip_address=audit_context["ip_address"],
        user_agent=audit_context["user_agent"],
    )

db.commit()
```

### 4. DELETE - מחיקת רשומה

```python
# רישום audit log לפני המחיקה
old_values = {
    "title": item.title,
    "description": item.description,
    # ... כל השדות הרלוונטיים
}
audit_service.create_audit_log(
    session=db,
    instance=item,
    action=AuditAction.DELETE,
    user_id=audit_context["user_id"],
    user_email=audit_context["user_email"],
    old_values=old_values,
    ip_address=audit_context["ip_address"],
    user_agent=audit_context["user_agent"],
)

db.delete(item)
db.commit()
```

## Endpoints שכבר משתמשים ב-Audit Logging

### ✅ Rooms (`/api/rooms`)
- `POST /api/rooms` - Create room
- `PUT /api/rooms/{room_id}` - Update room
- `DELETE /api/rooms/{room_id}` - Delete room

### ✅ Tasks (`/api/tasks`)
- `POST /api/tasks` - Create task
- `PUT /api/tasks/{task_id}` - Update task
- `PUT /api/tasks/{task_id}/complete` - Complete task
- `DELETE /api/tasks/{task_id}` - Delete task

### ✅ Categories (`/api/categories`)
- `POST /api/categories` - Create category
- `PUT /api/categories/{cat_id}` - Update category
- `DELETE /api/categories/{cat_id}` - Delete category

### ✅ Todos (`/api/todos`)
- `POST /api/todos` - Create todo
- `PUT /api/todos/{todo_id}` - Update todo
- `PUT /api/todos/{todo_id}/complete` - Complete todo
- `DELETE /api/todos/{todo_id}` - Delete todo

### ✅ Auth (`/api/auth`)
- `POST /api/auth/register` - Register new user
- `DELETE /api/auth/me` - Delete (soft-delete) user account

## API Endpoints לצפייה ב-Audit Logs

### 1. היסטוריה של רשומה ספציפית

```http
GET /api/audit/history/{table_name}/{record_id}?limit=50&offset=0
```

**דוגמה:**
```http
GET /api/audit/history/tasks/123
```

**תגובה:**
```json
[
  {
    "id": 1,
    "user_id": 5,
    "user_email": "user@example.com",
    "table_name": "tasks",
    "record_id": 123,
    "action": "update",
    "old_values": {"completed": false},
    "new_values": {"completed": true},
    "changed_fields": ["completed"],
    "created_at": "2024-01-15T10:30:00Z",
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0..."
  }
]
```

### 2. היסטוריה של המשתמש הנוכחי

```http
GET /api/audit/my-history?limit=50&offset=0
```

**תגובה:**
```json
[
  {
    "id": 1,
    "user_id": 5,
    "user_email": "user@example.com",
    "table_name": "tasks",
    "record_id": 123,
    "action": "create",
    "old_values": null,
    "new_values": {"title": "New Task", "completed": false},
    "changed_fields": null,
    "created_at": "2024-01-15T10:00:00Z",
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0..."
  }
]
```

### 3. סיכום שינויים לרשומה

```http
GET /api/audit/changes/{table_name}/{record_id}
```

**תגובה:**
```json
{
  "table_name": "tasks",
  "record_id": 123,
  "total_changes": 5,
  "changes_by_field": {
    "completed": [
      {
        "timestamp": "2024-01-15T10:30:00Z",
        "user": "user@example.com",
        "action": "update",
        "old_value": false,
        "new_value": true
      }
    ],
    "title": [
      {
        "timestamp": "2024-01-15T10:00:00Z",
        "user": "user@example.com",
        "action": "create",
        "old_value": null,
        "new_value": "New Task"
      }
    ]
  }
}
```

## AuditService Methods

### `get_changed_fields(instance, session)`

מחזיר את השדות שהשתנו ב-instance:

```python
changed_fields = audit_service.get_changed_fields(item, db)
# Returns: {"field_name": {"old": old_value, "new": new_value}}
```

### `create_audit_log(...)`

יוצר רשומת audit log:

```python
audit_service.create_audit_log(
    session=db,
    instance=item,
    action=AuditAction.CREATE,
    user_id=user_id,
    user_email=user_email,
    new_values=new_values,
    ip_address=ip_address,
    user_agent=user_agent,
)
```

### `get_audit_history(session, table_name, record_id, limit, offset)`

מחזיר את ההיסטוריה של רשומה ספציפית:

```python
history = audit_service.get_audit_history(
    db,
    table_name="tasks",
    record_id=123,
    limit=50,
    offset=0
)
```

### `get_user_audit_history(session, user_id, limit, offset)`

מחזיר את כל ה-audit logs של משתמש:

```python
history = audit_service.get_user_audit_history(
    db,
    user_id=5,
    limit=50,
    offset=0
)
```

## Best Practices

### 1. תמיד להשתמש ב-`db.flush()` לפני audit logging

```python
db.add(item)
db.flush()  # ✅ נכון - מקבל את ה-ID
# עכשיו אפשר ליצור audit log
```

### 2. ל-CREATE: רק `new_values`

```python
audit_service.create_audit_log(
    # ...
    new_values=new_values,  # ✅ רק new_values
    old_values=None,  # ✅ אין old_values ב-CREATE
)
```

### 3. ל-UPDATE: גם `old_values` וגם `new_values`

```python
audit_service.create_audit_log(
    # ...
    old_values=old_values,  # ✅ ערכים ישנים
    new_values=new_values,  # ✅ ערכים חדשים
    changed_fields=changed_fields,  # ✅ שדות שהשתנו
)
```

### 4. ל-DELETE: רק `old_values`

```python
audit_service.create_audit_log(
    # ...
    old_values=old_values,  # ✅ רק old_values
    new_values=None,  # ✅ אין new_values ב-DELETE
)
```

### 5. תמיד להשתמש ב-`audit_context`

```python
audit_context: dict = Depends(get_audit_context)  # ✅ נכון

# לא:
# ip_address = request.client.host  # ❌ לא נכון
```

## Indexes על AuditLog

הטבלה כוללת indexes על:
- `user_id` - חיפוש לפי משתמש
- `table_name` - חיפוש לפי טבלה
- `record_id` - חיפוש לפי רשומה
- `action` - חיפוש לפי פעולה
- `created_at` - חיפוש לפי תאריך

## ניקוי Audit Logs ישנים

ניתן להוסיף Celery task לניקוי audit logs ישנים:

```python
@celery.task
def cleanup_old_audit_logs():
    """Delete audit logs older than 1 year"""
    cutoff = datetime.utcnow() - timedelta(days=365)
    db.query(AuditLog).filter(AuditLog.created_at < cutoff).delete()
    db.commit()
```

## אבטחה

- ✅ כל audit logs נשמרים עם `user_id` ו-`user_email`
- ✅ גם אם משתמש נמחק, `user_email` נשמר ב-audit log
- ✅ `ip_address` ו-`user_agent` נשמרים לכל פעולה
- ✅ רק משתמשים מחוברים יכולים לראות את ה-audit logs שלהם
- ✅ בדיקת הרשאות לפני הצגת audit logs

## דוגמאות שימוש

### דוגמה 1: יצירת Task

```python
@router.post("/", response_model=TaskRead)
def create_task(
    request: Request,
    task_in: TaskCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    audit_context: dict = Depends(get_audit_context),
):
    task = Task(**task_in.dict(), user_id=user.id)
    db.add(task)
    db.flush()

    audit_service.create_audit_log(
        session=db,
        instance=task,
        action=AuditAction.CREATE,
        user_id=audit_context["user_id"],
        user_email=audit_context["user_email"],
        new_values=task_in.dict(),
        ip_address=audit_context["ip_address"],
        user_agent=audit_context["user_agent"],
    )

    db.commit()
    return task
```

### דוגמה 2: עדכון Task

```python
@router.put("/{task_id}", response_model=TaskRead)
def update_task(
    request: Request,
    task_id: int,
    task_in: TaskUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    audit_context: dict = Depends(get_audit_context),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    changed_fields = audit_service.get_changed_fields(task, db)

    for key, value in task_in.dict(exclude_unset=True).items():
        setattr(task, key, value)

    db.flush()
    changed_fields = audit_service.get_changed_fields(task, db)

    if changed_fields:
        old_values = {field: data["old"] for field, data in changed_fields.items()}
        new_values = {field: data["new"] for field, data in changed_fields.items()}

        audit_service.create_audit_log(
            session=db,
            instance=task,
            action=AuditAction.UPDATE,
            user_id=audit_context["user_id"],
            user_email=audit_context["user_email"],
            old_values=old_values,
            new_values=new_values,
            changed_fields=changed_fields,
            ip_address=audit_context["ip_address"],
            user_agent=audit_context["user_agent"],
        )

    db.commit()
    return task
```

## סיכום

מערכת ה-Audit Logging מספקת:
- ✅ רישום מלא של כל פעולות CRUD
- ✅ מעקב אחר מי, מתי, מה השתנה
- ✅ שמירת IP address ו-user agent
- ✅ API endpoints לצפייה בהיסטוריה
- ✅ תמיכה ב-soft-delete (משתמשים)
- ✅ Indexes לביצועים טובים

כל ה-endpoints העיקריים (Rooms, Tasks, Categories, Todos, Auth) כבר משתמשים ב-audit logging.
