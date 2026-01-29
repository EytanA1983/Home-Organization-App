from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import google.auth
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from app.db.session import get_db
from app.db.models import User, Task
from app.api.deps import get_current_user
from app.config import settings

router = APIRouter(prefix="/google-calendar", tags=["google-calendar"])

def get_google_service(user: User) -> "googleapiclient.discovery.Resource":
    """מחזיר Google Calendar service בעזרת ה‑refresh token השמור."""
    if not user.google_refresh_token:
        raise HTTPException(status_code=400, detail="חשבון Google לא מקושר")
    credentials = Credentials(
        None,
        refresh_token=user.google_refresh_token,
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        token_uri="https://oauth2.googleapis.com/token",
    )
    # refresh automatically
    credentials.refresh(google.auth.transport.requests.Request())
    service = build("calendar", "v3", credentials=credentials)
    return service

@router.post("/sync-tasks")
def sync_tasks_to_google(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    """מכניס את כל המשימות הלא-גמורות עם due_date ל‑Google Calendar."""
    service = get_google_service(user)
    tasks = (
        db.query(Task)
        .filter(Task.user_id == user.id, Task.due_date != None, Task.completed == False)
        .all()
    )
    for t in tasks:
        event = {
            "summary": t.title,
            "description": t.description or "",
            "start": {"dateTime": t.due_date.isoformat(), "timeZone": "Asia/Jerusalem"},
            "end": {
                "dateTime": (t.due_date + timedelta(hours=1)).isoformat(),
                "timeZone": "Asia/Jerusalem",
            },
            "reminders": {"useDefault": True},
        }
        service.events().insert(calendarId="primary", body=event).execute()
    return {"detail": f"סונכרנו {len(tasks)} משימות ל‑Google Calendar"}
