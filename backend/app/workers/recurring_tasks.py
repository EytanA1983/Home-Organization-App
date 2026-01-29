"""
Celery tasks for managing recurring tasks
"""
from datetime import datetime, timedelta
from app.workers.celery_app import celery
from app.db.session import SessionLocal
from app.db.models import Task
from app.services.recurring_tasks import recurring_tasks_service
from app.core.logging import logger


@celery.task(name="app.workers.recurring_tasks.generate_recurring_instances")
def generate_recurring_instances():
    """
    Generate instances for all recurring tasks
    Runs daily to create future task instances
    """
    db = SessionLocal()
    try:
        # Find all recurring template tasks
        recurring_templates = (
            db.query(Task)
            .filter(
                Task.is_recurring_template == True,
                Task.rrule_string.isnot(None),
                Task.completed == False,
            )
            .all()
        )

        total_instances = 0
        for template in recurring_templates:
            # Generate instances for the next 30 days
            until_date = datetime.utcnow() + timedelta(days=30)
            instances = recurring_tasks_service.create_recurring_instances(
                db=db,
                template_task=template,
                until_date=until_date,
                max_instances=50,
            )
            total_instances += len(instances)

        logger.info(
            f"Generated {total_instances} recurring task instances",
            extra={"templates_processed": len(recurring_templates)}
        )

        return {"instances_created": total_instances, "templates_processed": len(recurring_templates)}

    except Exception as e:
        logger.error(f"Error generating recurring instances: {e}", exc_info=True)
        return {"error": str(e)}
    finally:
        db.close()


@celery.task(name="app.workers.recurring_tasks.cleanup_old_instances")
def cleanup_old_instances():
    """
    Clean up old completed recurring task instances
    Keeps only instances from the last 30 days
    """
    db = SessionLocal()
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=30)

        # Delete old completed instances
        deleted = (
            db.query(Task)
            .filter(
                Task.parent_task_id.isnot(None),
                Task.completed == True,
                Task.due_date < cutoff_date,
            )
            .delete()
        )

        db.commit()

        logger.info(f"Cleaned up {deleted} old recurring task instances")
        return {"deleted": deleted}

    except Exception as e:
        logger.error(f"Error cleaning up old instances: {e}", exc_info=True)
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()
