from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/push-notifications", tags=["push-notifications"])


@router.get("/test")
def test_push(current_user: User = Depends(get_current_user)):
    """Test push notification"""
    return {"status": "ok"}
