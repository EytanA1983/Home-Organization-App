from celery import Celery
from app.config import settings

celery = Celery(
    "worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.workers.tasks",
        "app.workers.recurring_tasks",
        "app.workers.email_tasks",
        "app.celery_tasks.maintenance",
    ],
)

celery.conf.update(
    timezone="Asia/Jerusalem",
    enable_utc=False,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    beat_schedule={
        "daily-notifications": {
            "task": "app.workers.tasks.send_daily_notifications",
            "schedule": 60 * 60 * 24,  # once a day
        },
        "weekly-notifications": {
            "task": "app.workers.tasks.send_weekly_notifications",
            "schedule": 60 * 60 * 24 * 7,  # once a week
        },
        "generate-recurring-instances": {
            "task": "app.workers.recurring_tasks.generate_recurring_instances",
            "schedule": 60 * 60 * 24,  # once a day - generate future instances
        },
        "cleanup-old-instances": {
            "task": "app.workers.recurring_tasks.cleanup_old_instances",
            "schedule": 60 * 60 * 24 * 7,  # once a week - cleanup old instances
        },
        "send-daily-task-reminders": {
            "task": "app.workers.email_tasks.send_daily_task_reminders",
            "schedule": 60 * 60 * 24,  # once a day - send reminders for yesterday's tasks
        },
        "send-daily-summaries": {
            "task": "app.workers.email_tasks.send_daily_summaries",
            "schedule": 60 * 60 * 24,  # once a day - send daily summaries
        },
        "cleanup-expired-tokens": {
            "task": "app.celery_tasks.maintenance.cleanup_expired_tokens",
            "schedule": 60 * 60 * 24,  # once a day - cleanup expired tokens from blocklist
        },
        "cleanup-old-notifications": {
            "task": "app.celery_tasks.maintenance.cleanup_old_notifications",
            "schedule": 60 * 60 * 24 * 7,  # once a week - cleanup old notifications
        },
    },
)
