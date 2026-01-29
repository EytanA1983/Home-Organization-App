from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/push-subscriptions", tags=["push-subscriptions"])


@router.get("/")
def get_push_subscriptions(current_user: User = Depends(get_current_user)):
    """Get push subscriptions"""
    return {"subscriptions": []}
