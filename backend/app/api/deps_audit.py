"""
Dependencies for audit trail - get current user context
"""
from typing import Optional
from fastapi import Request, Depends
from sqlalchemy.orm import Session
from app.db.models import User
from app.api.deps import get_db, get_current_user


def get_audit_context(
    request: Request,
    current_user: Optional[User] = Depends(get_current_user),
) -> dict:
    """
    Get context for audit trail (user, IP, user agent)
    Usage: audit_context = Depends(get_audit_context)
    """
    # Get client IP
    client_ip = None
    if request.client:
        client_ip = request.client.host
    
    # Get user agent
    user_agent = request.headers.get("user-agent")
    
    return {
        "user_id": current_user.id if current_user else None,
        "user_email": current_user.email if current_user else None,
        "ip_address": client_ip,
        "user_agent": user_agent,
    }
