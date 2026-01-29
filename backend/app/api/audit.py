"""
API endpoints for viewing audit trail / history
"""
import json
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.api.deps import get_current_user
from app.db.models import User, AuditLog
from app.services.audit import audit_service
from app.core.logging import logger, log_api_call
from pydantic import BaseModel
from datetime import datetime


router = APIRouter(prefix="/audit", tags=["audit"])


# Schemas
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    user_email: Optional[str]
    table_name: str
    record_id: int
    action: str
    old_values: Optional[dict] = None
    new_values: Optional[dict] = None
    changed_fields: Optional[List[str]] = None
    created_at: datetime
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("/history/{table_name}/{record_id}", response_model=List[AuditLogResponse])
def get_record_history(
    table_name: str,
    record_id: int,
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    קבל היסטוריית שינויים לרשומה ספציפית
    Example: /api/audit/history/tasks/123
    """
    log_api_call(f"/api/audit/history/{table_name}/{record_id}", "GET", user_id=current_user.id)

    # Verify user has access to this record
    # (This is a simplified check - you might want to add more specific checks)
    if table_name == "tasks":
        from app.db.models import Task
        task = db.query(Task).filter(Task.id == record_id, Task.user_id == current_user.id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found or access denied")
    elif table_name == "rooms":
        from app.db.models import Room
        room = db.query(Room).filter(Room.id == record_id, Room.owner_id == current_user.id).first()
        if not room:
            raise HTTPException(status_code=404, detail="Room not found or access denied")

    # Get audit history
    history = audit_service.get_audit_history(db, table_name, record_id, limit=limit, offset=offset)

    # Parse JSON fields
    result = []
    for log in history:
        log_dict = {
            "id": log.id,
            "user_id": log.user_id,
            "user_email": log.user_email,
            "table_name": log.table_name,
            "record_id": log.record_id,
            "action": log.action.value,
            "old_values": json.loads(log.old_values) if log.old_values else None,
            "new_values": json.loads(log.new_values) if log.new_values else None,
            "changed_fields": json.loads(log.changed_fields) if log.changed_fields else None,
            "created_at": log.created_at,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
        }
        result.append(AuditLogResponse(**log_dict))

    return result


@router.get("/my-history", response_model=List[AuditLogResponse])
def get_my_history(
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    קבל את כל ההיסטוריה של המשתמש הנוכחי
    """
    log_api_call("/api/audit/my-history", "GET", user_id=current_user.id)

    history = audit_service.get_user_audit_history(db, current_user.id, limit=limit, offset=offset)

    # Parse JSON fields
    result = []
    for log in history:
        log_dict = {
            "id": log.id,
            "user_id": log.user_id,
            "user_email": log.user_email,
            "table_name": log.table_name,
            "record_id": log.record_id,
            "action": log.action.value,
            "old_values": json.loads(log.old_values) if log.old_values else None,
            "new_values": json.loads(log.new_values) if log.new_values else None,
            "changed_fields": json.loads(log.changed_fields) if log.changed_fields else None,
            "created_at": log.created_at,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
        }
        result.append(AuditLogResponse(**log_dict))

    return result


@router.get("/changes/{table_name}/{record_id}", response_model=dict)
def get_changes_summary(
    table_name: str,
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    קבל סיכום של כל השינויים לרשומה (מי, מתי, מה השתנה)
    """
    log_api_call(f"/api/audit/changes/{table_name}/{record_id}", "GET", user_id=current_user.id)

    history = audit_service.get_audit_history(db, table_name, record_id, limit=1000)

    # Group changes by field
    changes_by_field = {}
    for log in history:
        if log.changed_fields:
            changed_fields = json.loads(log.changed_fields)
            old_values = json.loads(log.old_values) if log.old_values else {}
            new_values = json.loads(log.new_values) if log.new_values else {}

            for field in changed_fields:
                if field not in changes_by_field:
                    changes_by_field[field] = []

                changes_by_field[field].append({
                    "timestamp": log.created_at.isoformat(),
                    "user": log.user_email or f"User {log.user_id}",
                    "action": log.action.value,
                    "old_value": old_values.get(field),
                    "new_value": new_values.get(field),
                })

    return {
        "table_name": table_name,
        "record_id": record_id,
        "total_changes": len(history),
        "changes_by_field": changes_by_field,
    }
