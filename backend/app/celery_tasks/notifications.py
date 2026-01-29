from celery import Task
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.workers.celery_app import celery
from app.db.session import SessionLocal
from app.models.user import User
from app.models.task import Task as TaskModel
from app.models.notification import Notification, NotificationType
from app.services.redis_pubsub import redis_pubsub

@celery.task(bind=True, name="app.celery_tasks.notifications.send_daily_notifications")
def send_daily_notifications(self: Task) -> dict:
    """Send daily notifications to users about upcoming tasks"""
    db: Session = SessionLocal()
    try:
        now = datetime.utcnow()
        tomorrow = now + timedelta(days=1)
        
        users = db.query(User).filter(User.is_active == True).all()
        notifications_sent = 0
        
        for user in users:
            upcoming_tasks = db.query(TaskModel).filter(
                TaskModel.owner_id == user.id,
                TaskModel.is_completed == False,
                TaskModel.due_date.between(now, tomorrow)
            ).all()
            
            if upcoming_tasks:
                task_list = "\n".join([f"- {task.title}" for task in upcoming_tasks])
                notification = Notification(
                    user_id=user.id,
                    title="תזכורת יומית - משימות מתקרבות",
                    message=f"יש לך {len(upcoming_tasks)} משימות שצריך לבצע היום:\n{task_list}",
                    type=NotificationType.REMINDER
                )
                db.add(notification)
                notifications_sent += 1
                
                # Publish to Redis Pub/Sub
                notification_dict = {
                    "id": notification.id,
                    "title": notification.title,
                    "message": notification.message,
                    "type": notification.type.value,
                    "created_at": now.isoformat(),
                }
                redis_pubsub.publish_notification(user.id, notification_dict)
        
        db.commit()
        return {
            "status": "success",
            "notifications_sent": notifications_sent,
            "timestamp": now.isoformat()
        }
    except Exception as e:
        db.rollback()
        raise self.retry(exc=e, countdown=60, max_retries=3)
    finally:
        db.close()


@celery.task(bind=True, name="app.celery_tasks.notifications.send_weekly_summary")
def send_weekly_summary(self: Task) -> dict:
    """Send weekly summary to users"""
    db: Session = SessionLocal()
    try:
        now = datetime.utcnow()
        week_ago = now - timedelta(days=7)
        
        users = db.query(User).filter(User.is_active == True).all()
        summaries_sent = 0
        
        for user in users:
            completed_tasks = db.query(TaskModel).filter(
                TaskModel.owner_id == user.id,
                TaskModel.is_completed == True,
                TaskModel.completed_at >= week_ago
            ).count()
            
            pending_tasks = db.query(TaskModel).filter(
                TaskModel.owner_id == user.id,
                TaskModel.is_completed == False
            ).count()
            
            overdue_tasks = db.query(TaskModel).filter(
                TaskModel.owner_id == user.id,
                TaskModel.is_completed == False,
                TaskModel.due_date < now
            ).count()
            
            if completed_tasks > 0 or pending_tasks > 0:
                message = f"סיכום שבועי:\n"
                message += f"✅ משימות שהושלמו השבוע: {completed_tasks}\n"
                message += f"📋 משימות ממתינות: {pending_tasks}\n"
                if overdue_tasks > 0:
                    message += f"⚠️ משימות שפג תוקפן: {overdue_tasks}"
                
                notification = Notification(
                    user_id=user.id,
                    title="סיכום שבועי",
                    message=message,
                    type=NotificationType.SYSTEM
                )
                db.add(notification)
                summaries_sent += 1
                
                # Publish to Redis Pub/Sub
                notification_dict = {
                    "id": notification.id,
                    "title": notification.title,
                    "message": notification.message,
                    "type": notification.type.value,
                    "created_at": now.isoformat(),
                }
                redis_pubsub.publish_notification(user.id, notification_dict)
        
        db.commit()
        return {
            "status": "success",
            "summaries_sent": summaries_sent,
            "timestamp": now.isoformat()
        }
    except Exception as e:
        db.rollback()
        raise self.retry(exc=e, countdown=60, max_retries=3)
    finally:
        db.close()


@celery.task(bind=True, name="app.celery_tasks.notifications.check_due_tasks")
def check_due_tasks(self: Task) -> dict:
    """Check for tasks due soon and create notifications"""
    from app.services.notification_service import NotificationService
    
    db: Session = SessionLocal()
    try:
        notifications_created = NotificationService.check_due_tasks(db)
        db.commit()
        return {
            "status": "success",
            "notifications_created": len(notifications_created),
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        db.rollback()
        raise self.retry(exc=e, countdown=60, max_retries=3)
    finally:
        db.close()
