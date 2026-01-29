"""
Email Service - שליחת אימיילים עם fastapi-mail
"""
from typing import List, Optional, Dict, Any
from pathlib import Path
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from jinja2 import Environment, FileSystemLoader, select_autoescape
from app.config import settings
from app.core.logging import logger
import os


# Email configuration
conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=settings.MAIL_USE_CREDENTIALS,
    VALIDATE_CERTS=settings.MAIL_VALIDATE_CERTS,
    TEMPLATE_FOLDER=Path(__file__).parent.parent / "templates" / "email",
)

# Initialize FastMail
fastmail = FastMail(conf)

# Jinja2 environment for templates
template_dir = Path(__file__).parent.parent / "templates" / "email"
template_dir.mkdir(parents=True, exist_ok=True)

jinja_env = Environment(
    loader=FileSystemLoader(str(template_dir)),
    autoescape=select_autoescape(["html", "xml"]),
)


class EmailService:
    """Service for sending emails"""

    @staticmethod
    async def send_email(
        recipients: List[str],
        subject: str,
        body: str,
        body_html: Optional[str] = None,
    ) -> bool:
        """
        Send email to recipients
        """
        if not settings.EMAIL_REMINDERS_ENABLED:
            logger.debug("Email reminders disabled, skipping")
            return False

        if not settings.MAIL_USERNAME or not settings.MAIL_PASSWORD:
            logger.warning("Email credentials not configured, skipping")
            return False

        try:
            message = MessageSchema(
                subject=subject,
                recipients=recipients,
                body=body,
                subtype=MessageType.html if body_html else MessageType.plain,
            )

            if body_html:
                message.body = body_html

            await fastmail.send_message(message)

            logger.info(
                "Email sent successfully",
                extra={
                    "recipients": recipients,
                    "subject": subject,
                },
            )
            return True

        except Exception as e:
            logger.error(
                f"Failed to send email: {e}",
                extra={
                    "recipients": recipients,
                    "subject": subject,
                },
                exc_info=True,
            )
            return False

    @staticmethod
    async def send_template_email(
        recipients: List[str],
        subject: str,
        template_name: str,
        template_data: Dict[str, Any],
    ) -> bool:
        """
        Send email using Jinja2 template
        """
        try:
            template = jinja_env.get_template(template_name)
            body_html = template.render(**template_data)

            return await EmailService.send_email(
                recipients=recipients,
                subject=subject,
                body="",  # Plain text fallback
                body_html=body_html,
            )

        except Exception as e:
            logger.error(
                f"Failed to render email template: {e}",
                extra={"template": template_name},
                exc_info=True,
            )
            return False

    @staticmethod
    async def send_task_reminder(
        user_email: str,
        user_name: Optional[str],
        tasks: List[Dict[str, Any]],
    ) -> bool:
        """
        Send task reminder email
        """
        subject = "תזכורת: יש לך משימות שלא הושלמו"

        template_data = {
            "user_name": user_name or "משתמש",
            "tasks": tasks,
            "tasks_count": len(tasks),
            "app_name": settings.PROJECT_NAME,
        }

        return await EmailService.send_template_email(
            recipients=[user_email],
            subject=subject,
            template_name="task_reminder.html",
            template_data=template_data,
        )

    @staticmethod
    async def send_daily_summary(
        user_email: str,
        user_name: Optional[str],
        summary: Dict[str, Any],
    ) -> bool:
        """
        Send daily summary email
        """
        subject = f"סיכום יומי - {settings.PROJECT_NAME}"

        template_data = {
            "user_name": user_name or "משתמש",
            "summary": summary,
            "app_name": settings.PROJECT_NAME,
        }

        return await EmailService.send_template_email(
            recipients=[user_email],
            subject=subject,
            template_name="daily_summary.html",
            template_data=template_data,
        )

    @staticmethod
    async def send_welcome_email(
        user_email: str,
        user_name: Optional[str],
    ) -> bool:
        """
        Send welcome email to new user
        """
        subject = f"ברוכים הבאים ל-{settings.PROJECT_NAME}"

        template_data = {
            "user_name": user_name or "משתמש",
            "app_name": settings.PROJECT_NAME,
        }

        return await EmailService.send_template_email(
            recipients=[user_email],
            subject=subject,
            template_name="welcome.html",
            template_data=template_data,
        )


# Global instance
email_service = EmailService()
