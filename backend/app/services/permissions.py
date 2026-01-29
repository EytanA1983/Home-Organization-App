"""
Permission Management Service
ניהול הרשאות למשתמשים מרובים ושיתוף חדרים
"""
from enum import Enum
from typing import Optional, List
from sqlalchemy.orm import Session
from app.db.models import User, Room, RoomShare, Task
from app.core.logging import logger


class Permission(str, Enum):
    """סוגי הרשאות"""
    OWNER = "owner"      # בעלים - יכול הכל
    EDITOR = "editor"    # עורך - יכול לערוך משימות
    VIEWER = "viewer"    # צופה - יכול רק לראות


class PermissionService:
    """Service for managing permissions"""

    @staticmethod
    def can_access_room(
        db: Session,
        user_id: int,
        room_id: int,
        required_permission: Permission = Permission.VIEWER,
    ) -> bool:
        """
        בדוק אם משתמש יכול לגשת לחדר
        """
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            return False

        # Owner always has access
        if room.owner_id == user_id:
            return True

        # Check shared access
        share = (
            db.query(RoomShare)
            .filter(
                RoomShare.room_id == room_id,
                RoomShare.user_id == user_id,
            )
            .first()
        )

        if not share:
            return False

        # Check permission level
        permission_levels = {
            Permission.VIEWER: 1,
            Permission.EDITOR: 2,
            Permission.OWNER: 3,
        }

        user_level = permission_levels.get(Permission(share.permission), 0)
        required_level = permission_levels.get(required_permission, 0)

        return user_level >= required_level

    @staticmethod
    def can_edit_room(db: Session, user_id: int, room_id: int) -> bool:
        """בדוק אם משתמש יכול לערוך חדר"""
        return PermissionService.can_access_room(
            db, user_id, room_id, Permission.EDITOR
        )

    @staticmethod
    def can_delete_room(db: Session, user_id: int, room_id: int) -> bool:
        """בדוק אם משתמש יכול למחוק חדר (רק owner)"""
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            return False
        return room.owner_id == user_id

    @staticmethod
    def can_access_task(
        db: Session,
        user_id: int,
        task_id: int,
        required_permission: Permission = Permission.VIEWER,
    ) -> bool:
        """
        בדוק אם משתמש יכול לגשת למשימה
        (דרך החדר שלה)
        """
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task or not task.room_id:
            # Task without room - check if user owns it
            return task.user_id == user_id if task else False

        return PermissionService.can_access_room(
            db, user_id, task.room_id, required_permission
        )

    @staticmethod
    def get_user_rooms(db: Session, user_id: int) -> List[Room]:
        """
        קבל את כל החדרים שהמשתמש יכול לגשת אליהם
        (owned + shared)
        """
        # Owned rooms
        owned_rooms = db.query(Room).filter(Room.owner_id == user_id).all()

        # Shared rooms
        shared_shares = (
            db.query(RoomShare)
            .filter(RoomShare.user_id == user_id)
            .all()
        )
        shared_room_ids = [share.room_id for share in shared_shares]
        shared_rooms = (
            db.query(Room).filter(Room.id.in_(shared_room_ids)).all()
            if shared_room_ids
            else []
        )

        # Combine and deduplicate
        all_rooms = {room.id: room for room in owned_rooms + shared_rooms}
        return list(all_rooms.values())

    @staticmethod
    def get_room_permission(
        db: Session, user_id: int, room_id: int
    ) -> Optional[Permission]:
        """
        קבל את הרשאת המשתמש בחדר
        """
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            return None

        # Owner
        if room.owner_id == user_id:
            return Permission.OWNER

        # Check shared permission
        share = (
            db.query(RoomShare)
            .filter(
                RoomShare.room_id == room_id,
                RoomShare.user_id == user_id,
            )
            .first()
        )

        if share:
            return Permission(share.permission)

        return None

    @staticmethod
    def share_room(
        db: Session,
        room_id: int,
        shared_with_user_id: int,
        permission: Permission,
        shared_by_user_id: int,
    ) -> RoomShare:
        """
        שתף חדר עם משתמש אחר
        """
        # Verify room exists and user is owner
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            raise ValueError("Room not found")

        if room.owner_id != shared_by_user_id:
            raise PermissionError("Only room owner can share the room")

        # Don't share with owner
        if shared_with_user_id == room.owner_id:
            raise ValueError("Cannot share room with owner")

        # Check if already shared
        existing = (
            db.query(RoomShare)
            .filter(
                RoomShare.room_id == room_id,
                RoomShare.user_id == shared_with_user_id,
            )
            .first()
        )

        if existing:
            # Update permission
            existing.permission = permission.value
            db.commit()
            db.refresh(existing)
            logger.info(
                f"Updated room share permission",
                extra={
                    "room_id": room_id,
                    "user_id": shared_with_user_id,
                    "permission": permission.value,
                },
            )
            return existing

        # Create new share
        share = RoomShare(
            room_id=room_id,
            user_id=shared_with_user_id,
            permission=permission.value,
            shared_by=shared_by_user_id,
        )
        db.add(share)

        # Mark room as shared
        room.is_shared = True
        db.commit()
        db.refresh(share)

        logger.info(
            f"Room shared successfully",
            extra={
                "room_id": room_id,
                "user_id": shared_with_user_id,
                "permission": permission.value,
            },
        )

        return share

    @staticmethod
    def unshare_room(
        db: Session, room_id: int, user_id: int, removed_by_user_id: int
    ) -> bool:
        """
        הסר שיתוף חדר עם משתמש
        """
        # Verify room exists and user is owner
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            return False

        if room.owner_id != removed_by_user_id:
            raise PermissionError("Only room owner can unshare the room")

        # Remove share
        share = (
            db.query(RoomShare)
            .filter(
                RoomShare.room_id == room_id,
                RoomShare.user_id == user_id,
            )
            .first()
        )

        if share:
            db.delete(share)
            db.commit()

            # Check if room still has shares
            remaining_shares = (
                db.query(RoomShare).filter(RoomShare.room_id == room_id).count()
            )
            if remaining_shares == 0:
                room.is_shared = False
                db.commit()

            logger.info(
                f"Room unshared",
                extra={"room_id": room_id, "user_id": user_id},
            )
            return True

        return False

    @staticmethod
    def get_room_shares(db: Session, room_id: int) -> List[RoomShare]:
        """
        קבל את כל השיתופים של חדר
        """
        return db.query(RoomShare).filter(RoomShare.room_id == room_id).all()


# Global instance
permission_service = PermissionService()
