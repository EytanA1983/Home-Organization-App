from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from app.db.session import get_db
from app.db.models import Task, Recurrence, User
from app.schemas.task import TaskCreate, TaskRead, TaskUpdate
from app.schemas.todo import TodoRead
from app.api.deps import get_current_user
from app.api.deps_audit import get_audit_context
from app.services.audit import audit_service, AuditAction
from app.workers.tasks import schedule_notification_for_task
from app.services.notification import send_voice_feedback
from app.services.recurring_tasks import recurring_tasks_service
from app.core.logging import logger
from app.core.cache import invalidate_user_cache, cache_get, cache_set, make_cache_key, CACHE_TTL_LONG

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

@router.get("/", response_model=List[TaskRead])
def list_tasks(
    completed: Optional[bool] = None,
    category_id: Optional[int] = None,
    room_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List tasks with Redis caching (TTL: 2 minutes)"""
    # Try cache first
    cache_key = make_cache_key("tasks", user.id, completed=completed, category_id=category_id, room_id=room_id)
    cached = cache_get(cache_key)
    if cached is not None:
        return cached  # Return cached list directly

    # Query database
    q = db.query(Task).filter(Task.user_id == user.id)
    if completed is not None:
        q = q.filter(Task.completed == completed)
    if category_id:
        q = q.filter(Task.category_id == category_id)
    if room_id:
        q = q.filter(Task.room_id == room_id)

    # Order by position, then by created_at
    q = q.order_by(Task.position.asc(), Task.created_at.asc())

    tasks = q.all()

    # Cache the result (serialize for JSON storage)
    cache_data = []
    for t in tasks:
        task_dict = {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "due_date": t.due_date.isoformat() if t.due_date else None,
            "completed": t.completed,
            "category_id": t.category_id,
            "room_id": t.room_id,
            "user_id": t.user_id,
            "position": t.position,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        }
        cache_data.append(task_dict)

    cache_set(cache_key, cache_data, CACHE_TTL_LONG)

    return tasks

@router.post("/", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(
    request: Request,
    task_in: TaskCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    audit_context: dict = Depends(get_audit_context),
):
    """Create a new task (supports recurring tasks with RRULE)"""
    task_data = task_in.dict()

    # Check if this is a recurring task
    is_recurring = bool(task_data.get("rrule_string") and task_data.get("rrule_start_date"))

    if is_recurring:
        # Validate RRULE
        is_valid, error_msg = recurring_tasks_service.validate_rrule(task_data["rrule_string"])
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"RRULE לא תקין: {error_msg}"
            )

        # Mark as recurring template
        task_data["is_recurring_template"] = True
        # Set due_date from rrule_start_date if not provided
        if not task_data.get("due_date") and task_data.get("rrule_start_date"):
            task_data["due_date"] = task_data["rrule_start_date"]

    task = Task(**task_data, user_id=user.id)
    db.add(task)
    db.commit()
    db.refresh(task)

    # If recurring, generate initial instances
    if is_recurring:
        try:
            until_date = task_data.get("rrule_end_date") or (datetime.utcnow() + timedelta(days=30))
            instances = recurring_tasks_service.create_recurring_instances(
                db=db,
                template_task=task,
                until_date=until_date,
                max_instances=50,
            )
            logger.info(
                f"Created recurring task with {len(instances)} initial instances",
                extra={"task_id": task.id, "rrule": task.rrule_string}
            )
        except Exception as e:
            logger.error(f"Error creating recurring instances: {e}", exc_info=True)
            # Don't fail the task creation if instance generation fails

    # אם יש due_date – תזמון נוטיפיקציה
    if task.due_date:
        background_tasks.add_task(schedule_notification_for_task, task.id)

    # Invalidate tasks cache for this user
    invalidate_user_cache(user.id, ["tasks"])

    # Create audit log
    new_values = {
        "title": task.title,
        "description": task.description,
        "due_date": task.due_date.isoformat() if task.due_date else None,
        "completed": task.completed,
        "category_id": task.category_id,
        "room_id": task.room_id,
        "user_id": task.user_id,
        "position": task.position,
    }
    audit_service.create_audit_log(
        session=db,
        instance=task,
        action=AuditAction.CREATE,
        user_id=audit_context["user_id"],
        user_email=audit_context["user_email"],
        new_values=new_values,
        ip_address=audit_context["ip_address"],
        user_agent=audit_context["user_agent"],
    )
    db.commit()

    return task

@router.get("/{task_id}", response_model=TaskRead)
def get_task(task_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="משימה לא קיימת")
    return task

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
        raise HTTPException(status_code=404, detail="משימה לא קיימת")

    # Get changed fields before update
    changed_fields = audit_service.get_changed_fields(task, db)

    # Update task
    for key, value in task_in.dict(exclude_unset=True).items():
        setattr(task, key, value)

    db.flush()  # Flush to get updated values

    # Get new changed fields after update
    changed_fields = audit_service.get_changed_fields(task, db)

    if changed_fields:
        # Prepare old and new values
        old_values = {field: data["old"] for field, data in changed_fields.items()}
        new_values = {field: data["new"] for field, data in changed_fields.items()}

        # Create audit log
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
    db.refresh(task)

    # Invalidate tasks cache
    invalidate_user_cache(user.id, ["tasks"])

    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    request: Request,
    task_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    audit_context: dict = Depends(get_audit_context),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="משימה לא קיימת")

    # Create audit log before delete
    old_values = {
        "title": task.title,
        "description": task.description,
        "due_date": task.due_date.isoformat() if task.due_date else None,
        "completed": task.completed,
        "category_id": task.category_id,
        "room_id": task.room_id,
        "user_id": task.user_id,
        "position": task.position,
    }
    audit_service.create_audit_log(
        session=db,
        instance=task,
        action=AuditAction.DELETE,
        user_id=audit_context["user_id"],
        user_email=audit_context["user_email"],
        old_values=old_values,
        ip_address=audit_context["ip_address"],
        user_agent=audit_context["user_agent"],
    )

    db.delete(task)
    db.commit()

    # Invalidate tasks cache
    invalidate_user_cache(user.id, ["tasks"])

    return None

@router.put("/{task_id}/complete", response_model=TaskRead)
def complete_task(
    request: Request,
    task_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    audit_context: dict = Depends(get_audit_context),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="משימה לא קיימת")

    # Get old value before update
    old_completed = task.completed
    task.completed = True

    # פידבק קולי (ב‑frontend) – נשלח אירוע WebSocket, אבל כאן רק דוגמה:
    send_voice_feedback(
        text="המשימה הסתיימה בהצלחה! כל הכבוד!",
        language="he-IL"
    )

    # Create audit log for completion change
    audit_service.create_audit_log(
        session=db,
        instance=task,
        action=AuditAction.UPDATE,
        user_id=audit_context["user_id"],
        user_email=audit_context["user_email"],
        old_values={"completed": old_completed},
        new_values={"completed": True},
        changed_fields={"completed": {"old": old_completed, "new": True}},
        ip_address=audit_context["ip_address"],
        user_agent=audit_context["user_agent"],
    )

    db.commit()
    db.refresh(task)

    # Invalidate tasks cache
    invalidate_user_cache(user.id, ["tasks"])

    return task

# Endpoint עבור ה‑todos המשויכים למשימה
@router.get("/{task_id}/todos", response_model=List[TodoRead])
def get_task_todos(task_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="משימה לא קיימת")
    return task.todos

# אפשר להוסיף endpoint לשינוי עקביות (recurrence) וכו׳…
