"""
Celery tasks for email reminders
"""
from datetime import datetime, timedelta
from app.workers.celery_app import celery
from app.db.session import SessionLocal
from app.db.models import Task, User, Room
from app.services.email import email_service
from app.core.logging import logger
from typing import List, Dict, Any


@celery.task(name="app.workers.email_tasks.send_daily_task_reminders")
def send_daily_task_reminders():
    """
    שולח תזכורות אימייל למשתמשים עם משימות שלא הושלמו ביום האחרון
    """
    db = SessionLocal()
    try:
        # Get yesterday's date
        yesterday = datetime.utcnow() - timedelta(days=1)
        yesterday_start = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
        yesterday_end = yesterday.replace(hour=23, minute=59, second=59, microsecond=999)

        # Find all users with incomplete tasks from yesterday
        users_with_tasks = (
            db.query(User)
            .join(Task, User.id == Task.user_id)
            .filter(
                Task.completed == False,
                Task.due_date >= yesterday_start,
                Task.due_date <= yesterday_end,
            )
            .distinct()
            .all()
        )

        emails_sent = 0
        for user in users_with_tasks:
            # Get incomplete tasks for this user from yesterday
            incomplete_tasks = (
                db.query(Task)
                .filter(
                    Task.user_id == user.id,
                    Task.completed == False,
                    Task.due_date >= yesterday_start,
                    Task.due_date <= yesterday_end,
                )
                .all()
            )

            if not incomplete_tasks:
                continue

            # Prepare task data for email
            tasks_data = []
            for task in incomplete_tasks:
                task_data = {
                    "title": task.title,
                    "description": task.description,
                    "due_date": task.due_date.strftime("%d/%m/%Y %H:%M") if task.due_date else None,
                }

                # Get room name if exists
                if task.room_id:
                    room = db.query(Room).filter(Room.id == task.room_id).first()
                    if room:
                        task_data["room_name"] = room.name

                tasks_data.append(task_data)

            # Send email reminder
            try:
                # Use asyncio to run async function
                import asyncio
                loop = asyncio.get_event_loop()
                if loop.is_closed():
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)

                success = loop.run_until_complete(
                    email_service.send_task_reminder(
                        user_email=user.email,
                        user_name=getattr(user, "full_name", None),
                        tasks=tasks_data,
                    )
                )

                if success:
                    emails_sent += 1
                    logger.info(
                        f"Sent task reminder email to {user.email}",
                        extra={
                            "user_id": user.id,
                            "tasks_count": len(tasks_data),
                        },
                    )
                else:
                    logger.warning(
                        f"Failed to send reminder email to {user.email}",
                        extra={"user_id": user.id},
                    )

            except Exception as e:
                logger.error(
                    f"Error sending reminder email to {user.email}: {e}",
                    extra={"user_id": user.id},
                    exc_info=True,
                )

        logger.info(
            f"Sent {emails_sent} task reminder emails",
            extra={"total_users": len(users_with_tasks)},
        )

        return {"emails_sent": emails_sent, "users_processed": len(users_with_tasks)}

    except Exception as e:
        logger.error(f"Error in send_daily_task_reminders: {e}", exc_info=True)
        return {"error": str(e)}
    finally:
        db.close()


@celery.task(name="app.workers.email_tasks.send_daily_summaries")
def send_daily_summaries():
    """
    שולח סיכום יומי למשתמשים
    """
    db = SessionLocal()
    try:
        from app.services.statistics import statistics_service

        # Get all active users
        users = db.query(User).filter(User.is_active == True).all()

        emails_sent = 0
        for user in users:
            try:
                # Calculate statistics for user
                stats = statistics_service.calculate_overall_statistics(db, user.id)

                summary = {
                    "total_tasks": stats["overall"]["total"],
                    "completed_tasks": stats["overall"]["completed"],
                    "pending_tasks": stats["overall"]["pending"],
                    "completion_rate": stats["overall"]["completion_rate"],
                }

                # Send email
                import asyncio
                loop = asyncio.get_event_loop()
                if loop.is_closed():
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)

                success = loop.run_until_complete(
                    email_service.send_daily_summary(
                        user_email=user.email,
                        user_name=getattr(user, "full_name", None),
                        summary=summary,
                    )
                )

                if success:
                    emails_sent += 1
                    logger.info(f"Sent daily summary to {user.email}", extra={"user_id": user.id})

            except Exception as e:
                logger.error(
                    f"Error sending daily summary to {user.email}: {e}",
                    extra={"user_id": user.id},
                    exc_info=True,
                )

        logger.info(f"Sent {emails_sent} daily summary emails")
        return {"emails_sent": emails_sent}

    except Exception as e:
        logger.error(f"Error in send_daily_summaries: {e}", exc_info=True)
        return {"error": str(e)}
    finally:
        db.close()


@celery.task(name="app.workers.email_tasks.send_welcome_email")
def send_welcome_email(user_id: int):
    """
    שולח אימייל ברכה למשתמש חדש
    """
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.warning(f"User {user_id} not found for welcome email")
            return {"error": "User not found"}

        import asyncio
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        success = loop.run_until_complete(
            email_service.send_welcome_email(
                user_email=user.email,
                user_name=getattr(user, "full_name", None),
            )
        )

        if success:
            logger.info(f"Sent welcome email to {user.email}", extra={"user_id": user_id})
        else:
            logger.warning(f"Failed to send welcome email to {user.email}", extra={"user_id": user_id})

        return {"success": success, "user_id": user_id}

    except Exception as e:
        logger.error(f"Error sending welcome email: {e}", exc_info=True)
        return {"error": str(e)}
    finally:
        db.close()
