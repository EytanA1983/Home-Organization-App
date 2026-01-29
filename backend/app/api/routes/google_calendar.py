from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/google-calendar", tags=["google-calendar"])


@router.get("/status")
def get_calendar_status(
    current_user: User = Depends(get_current_user)
):
    """Check Google Calendar connection status"""
    is_connected = bool(current_user.google_calendar_token)
    return {
        "connected": is_connected,
        "valid": is_connected
    }
