from datetime import datetime, timedelta
from app.workers.celery_app import celery
from app.db.session import SessionLocal
from app.db.models import Task, Recurrence
from app.services.notification import push_notification
from app.services.recurring_tasks import recurring_tasks_service
from app.core.logging import logger

@celery.task(name="app.workers.tasks.send_daily_notifications")
def send_daily_notifications():
    """שולח נוטיפיקציות לכל משימה עם due_date היום."""
    db = SessionLocal()
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    tasks = (
        db.query(Task)
        .filter(
            Task.due_date >= today_start,
            Task.due_date < today_end,
            Task.completed == False,
        )
        .all()
    )
    for t in tasks:
        push_notification(
            user_id=t.user_id,
            title="היום יש משימה",
            body=f"‏{t.title} – תזכורת למועד היום",
        )
    db.close()

@celery.task(name="app.workers.tasks.send_weekly_notifications")
def send_weekly_notifications():
    """שולח נוטיפיקציות למשימות שמיועדות לשבוע הקרוב."""
    db = SessionLocal()
    now = datetime.utcnow()
    week_later = now + timedelta(days=7)
    tasks = (
        db.query(Task)
        .filter(
            Task.due_date >= now,
            Task.due_date <= week_later,
            Task.completed == False,
        )
        .all()
    )
    for t in tasks:
        push_notification(
            user_id=t.user_id,
            title="שבוע לפני מועד משימה",
            body=f"‏{t.title} – נזכרים לך שהמועד מתקרב",
        )
    db.close()

@celery.task(name="app.workers.tasks.schedule_notification_for_task")
def schedule_notification_for_task(task_id: int):
    """מתזמן נוטיפיקציה עבור משימה ספציפית לפי due_date."""
    db = SessionLocal()
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task or task.completed:
        db.close()
        return

    # חישוב זמן המתנה (seconds_until_due)
    now = datetime.utcnow()
    if task.due_date > now:
        delay = (task.due_date - now).total_seconds()
    else:
        delay = 0

    # שליחת נוטיפיקציה במועד
    push_notification.apply_async(
        kwargs=dict(
            user_id=task.user_id,
            title="זמן לבצע משימה",
            body=f"‏{task.title} – הגיע מועד לביצוע",
        ),
        countdown=delay,
    )
    db.close()
