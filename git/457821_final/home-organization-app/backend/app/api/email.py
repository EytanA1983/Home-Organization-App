"""
API endpoints for email management
"""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.db.models import User
from app.services.email import email_service
from app.core.logging import logger
from app.workers.email_tasks import send_daily_task_reminders, send_daily_summaries
import asyncio

router = APIRouter(prefix="/email", tags=["email"])


@router.post("/test")
async def send_test_email(
    current_user: User = Depends(get_current_user),
):
    """
    Send test email to current user
    """
    success = await email_service.send_email(
        recipients=[current_user.email],
        subject="Test Email",
        body="This is a test email from the system",
        body_html="<h1>Test Email</h1><p>This is a test email from the system</p>",
    )

    if success:
        return {"message": "Test email sent successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send test email",
        )


@router.post("/trigger-reminders")
def trigger_reminders(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
):
    """
    Manually trigger email reminders (admin only)
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superusers can trigger reminders",
        )

    # Trigger in background
    background_tasks.add_task(send_daily_task_reminders)

    logger.info("Email reminders triggered manually", extra={"user_id": current_user.id})

    return {"message": "Email reminders triggered"}


@router.post("/trigger-summaries")
def trigger_summaries(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
):
    """
    Manually trigger daily summaries (admin only)
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superusers can trigger summaries",
        )

    # Trigger in background
    background_tasks.add_task(send_daily_summaries)

    logger.info("Daily summaries triggered manually", extra={"user_id": current_user.id})

    return {"message": "Daily summaries triggered"}
