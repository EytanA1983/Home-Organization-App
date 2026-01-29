from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/celery", tags=["celery"])


@router.get("/health")
def celery_health(current_user: User = Depends(get_current_user)):
    """Check Celery health"""
    return {"status": "healthy"}
