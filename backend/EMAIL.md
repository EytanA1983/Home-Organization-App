# Email Reminders System

## Overview

המערכת כוללת תזכורות אימייל אוטומטיות למשתמשים שלא השלימו משימות.

## Features

- **Daily Task Reminders** - תזכורות למשימות שלא הושלמו ביום האחרון
- **Daily Summaries** - סיכום יומי עם סטטיסטיקות
- **Welcome Emails** - אימייל ברכה למשתמשים חדשים
- **HTML Templates** - תבניות אימייל יפות עם HTML

## Configuration

### Environment Variables

```bash
# Email SMTP Configuration
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=noreply@eli-maor.com
MAIL_FROM_NAME=אלי מאור - סידור וארגון הבית
MAIL_PORT=587
MAIL_SERVER=smtp.gmail.com
MAIL_STARTTLS=True
MAIL_SSL_TLS=False
MAIL_USE_CREDENTIALS=True
MAIL_VALIDATE_CERTS=True

# Email Settings
EMAIL_REMINDERS_ENABLED=True
EMAIL_REMINDER_HOUR=9  # Hour to send reminders (24h format)
```

### Gmail Setup

1. Enable 2-Step Verification
2. Generate App Password:
   - Go to Google Account → Security → App passwords
   - Create app password for "Mail"
   - Use this password in `MAIL_PASSWORD`

## Email Templates

### Task Reminder (`task_reminder.html`)

נשלח למשתמשים עם משימות שלא הושלמו ביום האחרון.

**Content:**
- רשימת משימות שלא הושלמו
- פרטי כל משימה (כותרת, תיאור, מועד, חדר)
- קישור לאפליקציה

### Daily Summary (`daily_summary.html`)

נשלח יומית עם סיכום סטטיסטיקות.

**Content:**
- סה"כ משימות
- משימות שהושלמו
- משימות ממתינות
- אחוז סיום

### Welcome Email (`welcome.html`)

נשלח למשתמשים חדשים לאחר רישום.

**Content:**
- הודעת ברכה
- הסבר על התכונות
- קישור להתחלה

## Celery Tasks

### Daily Task Reminders

```python
@celery.task(name="app.workers.email_tasks.send_daily_task_reminders")
def send_daily_task_reminders():
    # Sends reminders for tasks not completed yesterday
```

**Schedule:** Daily at configured hour

### Daily Summaries

```python
@celery.task(name="app.workers.email_tasks.send_daily_summaries")
def send_daily_summaries():
    # Sends daily summary to all active users
```

**Schedule:** Daily

### Welcome Email

```python
@celery.task(name="app.workers.email_tasks.send_welcome_email")
def send_welcome_email(user_id: int):
    # Sends welcome email to new user
```

**Triggered:** After user registration

## API Endpoints

### Send Test Email

```bash
POST /api/email/test
Authorization: Bearer <token>
```

### Trigger Reminders (Admin Only)

```bash
POST /api/email/trigger-reminders
Authorization: Bearer <admin-token>
```

### Trigger Summaries (Admin Only)

```bash
POST /api/email/trigger-summaries
Authorization: Bearer <admin-token>
```

## Usage

### Automatic Reminders

Reminders are sent automatically via Celery Beat:
- Daily at configured hour
- Only to users with incomplete tasks from yesterday
- Includes task details and room information

### Manual Triggering

Admins can manually trigger reminders via API endpoints.

### Integration with Registration

Welcome emails are automatically sent after user registration:

```python
# In registration endpoint
from app.workers.email_tasks import send_welcome_email

# After user creation
send_welcome_email.delay(user.id)
```

## Email Service

### Send Email

```python
from app.services.email import email_service

await email_service.send_email(
    recipients=["user@example.com"],
    subject="Test",
    body="Plain text",
    body_html="<h1>HTML</h1>",
)
```

### Send Template Email

```python
await email_service.send_template_email(
    recipients=["user@example.com"],
    subject="Reminder",
    template_name="task_reminder.html",
    template_data={"user_name": "John", "tasks": [...]},
)
```

### Send Task Reminder

```python
await email_service.send_task_reminder(
    user_email="user@example.com",
    user_name="John",
    tasks=[
        {
            "title": "Task 1",
            "description": "Description",
            "due_date": "15/01/2024 10:00",
            "room_name": "סלון",
        }
    ],
)
```

## Customization

### Email Templates

Templates are in `backend/app/templates/email/`:
- `task_reminder.html` - Task reminder template
- `daily_summary.html` - Daily summary template
- `welcome.html` - Welcome email template

### Styling

Templates use inline CSS for email client compatibility.

### Localization

Templates are in Hebrew (RTL). To add English:
1. Create `task_reminder_en.html`
2. Update service to select template based on user preference

## Testing

### Test Email Configuration

```bash
# Send test email
curl -X POST http://localhost:8000/api/email/test \
  -H "Authorization: Bearer <token>"
```

### Test Templates

```python
# In Python shell
from app.services.email import email_service
import asyncio

asyncio.run(email_service.send_task_reminder(
    user_email="test@example.com",
    user_name="Test User",
    tasks=[{"title": "Test Task", "description": "Test"}],
))
```

## Troubleshooting

### Emails Not Sending

1. Check SMTP credentials
2. Verify `EMAIL_REMINDERS_ENABLED=True`
3. Check Celery worker logs
4. Verify email templates exist

### Gmail Issues

- Use App Password (not regular password)
- Enable "Less secure app access" (if needed)
- Check spam folder

### Template Errors

- Verify template files exist
- Check Jinja2 syntax
- Review logs for template errors

## Best Practices

1. **Test First** - Always test email configuration before production
2. **Monitor** - Check email delivery rates
3. **Unsubscribe** - Consider adding unsubscribe option
4. **Rate Limiting** - Don't send too many emails
5. **Personalization** - Use user names in emails
