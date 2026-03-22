"""My Vision Board — per-user statement, intentions, optional image & quote."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import User
from app.db.session import get_db
from app.schemas.vision_board import VisionBoardRead, VisionBoardUpdate
from app.services.vision_board import read_for_user, upsert_for_user

router = APIRouter(prefix="/api/vision-board", tags=["vision-board"])


@router.get("", response_model=VisionBoardRead)
def get_vision_board(
    lang: str = Query("he", description="he | en — affects default copy when no row exists"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    lc = "en" if (lang or "").lower() == "en" else "he"
    return read_for_user(db, user.id, lc)


@router.put("", response_model=VisionBoardRead)
def put_vision_board(
    payload: VisionBoardUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return upsert_for_user(db, user.id, payload)
