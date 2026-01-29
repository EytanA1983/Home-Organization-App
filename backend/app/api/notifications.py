from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.api.deps import get_current_user
from app.db.models import NotificationSubscription, User
from app.schemas.notification import NotificationSubscriptionRead

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

@router.get("/subscriptions", response_model=List[NotificationSubscriptionRead])
def list_subscriptions(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List current user's push notification subscriptions."""
    return (
        db.query(NotificationSubscription)
        .filter(NotificationSubscription.user_id == user.id)
        .order_by(NotificationSubscription.created_at.desc())
        .all()
    )

@router.post("/subscribe")
def subscribe(
    subscription: dict = Body(..., example={
        "endpoint": "https://fcm.googleapis.com/fcm/send/xxxx",
        "keys": {"p256dh": "...", "auth": "..."}
    }),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    שמירת subscription שמגיעה מה‑ServiceWorker של ה‑frontend.
    """
    # וידוא שה‑endpoint קיים לפני הוספה
    existing = (
        db.query(NotificationSubscription)
        .filter(
            NotificationSubscription.user_id == user.id,
            NotificationSubscription.endpoint == subscription["endpoint"],
        )
        .first()
    )
    if existing:
        return {"detail": "already registered"}

    sub = NotificationSubscription(
        user_id=user.id,
        endpoint=subscription["endpoint"],
        p256dh=subscription["keys"]["p256dh"],
        auth=subscription["keys"]["auth"],
    )
    db.add(sub)
    db.commit()
    return {"detail": "registered"}

@router.post("/unsubscribe")
def unsubscribe(
    endpoint: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    sub = (
        db.query(NotificationSubscription)
        .filter(NotificationSubscription.user_id == user.id, NotificationSubscription.endpoint == endpoint)
        .first()
    )
    if not sub:
        raise HTTPException(status_code=404, detail="subscription not found")
    db.delete(sub)
    db.commit()
    return {"detail": "unregistered"}
