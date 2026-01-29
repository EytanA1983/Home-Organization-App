"""
Audit Trail Service - עוקב אחר שינויים במודלים
מאפשר לראות מי, מתי, מה השתנה (old value → new value)
"""
import json
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import event
from sqlalchemy.orm.attributes import get_history
from datetime import datetime
from app.db.models import AuditLog, AuditAction, Base
from app.core.logging import logger


class AuditService:
    """Service for tracking changes to database models"""

    @staticmethod
    def get_changed_fields(instance: Base, session: Session) -> Dict[str, Dict[str, Any]]:
        """
        מחזיר את השדות שהשתנו ב-instance
        Returns: {field_name: {"old": old_value, "new": new_value}}
        """
        changes = {}
        
        for attr in instance.__table__.columns:
            attr_name = attr.name
            history = get_history(instance, attr_name)
            
            if history.has_changes():
                old_value = history.deleted[0] if history.deleted else None
                new_value = history.added[0] if history.added else None
                
                # Convert to JSON-serializable format
                old_value = AuditService._serialize_value(old_value)
                new_value = AuditService._serialize_value(new_value)
                
                changes[attr_name] = {
                    "old": old_value,
                    "new": new_value
                }
        
        return changes

    @staticmethod
    def _serialize_value(value: Any) -> Any:
        """Convert value to JSON-serializable format"""
        if value is None:
            return None
        if isinstance(value, datetime):
            return value.isoformat()
        if isinstance(value, (int, float, str, bool)):
            return value
        if hasattr(value, '__dict__'):
            return str(value)
        return str(value)

    @staticmethod
    def create_audit_log(
        session: Session,
        instance: Base,
        action: AuditAction,
        user_id: Optional[int] = None,
        user_email: Optional[str] = None,
        old_values: Optional[Dict] = None,
        new_values: Optional[Dict] = None,
        changed_fields: Optional[Dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ):
        """Create an audit log entry"""
        try:
            # Get table name
            table_name = instance.__table__.name
            
            # Get record ID
            record_id = getattr(instance, 'id', None)
            if record_id is None:
                logger.warning("Cannot create audit log: instance has no 'id' attribute")
                return
            
            # Serialize values to JSON
            old_values_json = json.dumps(old_values, ensure_ascii=False) if old_values else None
            new_values_json = json.dumps(new_values, ensure_ascii=False) if new_values else None
            changed_fields_json = json.dumps(list(changed_fields.keys()), ensure_ascii=False) if changed_fields else None
            
            # Create audit log
            audit_log = AuditLog(
                user_id=user_id,
                user_email=user_email,
                table_name=table_name,
                record_id=record_id,
                action=action,
                old_values=old_values_json,
                new_values=new_values_json,
                changed_fields=changed_fields_json,
                ip_address=ip_address,
                user_agent=user_agent,
            )
            
            session.add(audit_log)
            # Don't commit here - let the caller commit
            
        except Exception as e:
            logger.error(f"Error creating audit log: {e}", exc_info=True)
            # Don't fail the main operation if audit logging fails

    @staticmethod
    def get_audit_history(
        session: Session,
        table_name: str,
        record_id: int,
        limit: int = 50,
        offset: int = 0,
    ) -> list[AuditLog]:
        """Get audit history for a specific record"""
        return (
            session.query(AuditLog)
            .filter(
                AuditLog.table_name == table_name,
                AuditLog.record_id == record_id,
            )
            .order_by(AuditLog.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_user_audit_history(
        session: Session,
        user_id: int,
        limit: int = 50,
        offset: int = 0,
    ) -> list[AuditLog]:
        """Get all audit logs for a specific user"""
        return (
            session.query(AuditLog)
            .filter(AuditLog.user_id == user_id)
            .order_by(AuditLog.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )


# SQLAlchemy event listeners for automatic audit trail
def setup_audit_trail():
    """Setup SQLAlchemy event listeners for automatic audit trail"""
    
    @event.listens_for(Session, "after_flush")
    def receive_after_flush(session: Session, flush_context):
        """Track changes after flush (before commit)"""
        # This will be called by the session context manager
        pass
    
    @event.listens_for(Session, "before_commit")
    def receive_before_commit(session: Session):
        """Track changes before commit"""
        # Get current user from session info (if available)
        # This is a placeholder - actual implementation depends on how you pass user context
        pass


# Global instance
audit_service = AuditService()
