"""Dashboard: daily inspiration (deterministic) + rule-based daily tip (LLM-ready)."""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import User
from app.db.session import get_db
from app.schemas.dashboard import DailyInspirationRead, DailyTipContextRead, DailyTipRead
from app.services.dashboard_daily import Lang, build_rule_based_daily_tip, daily_inspiration_for_date

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/daily-inspiration", response_model=DailyInspirationRead)
def get_daily_inspiration(
    lang: str = Query("he", description="he | en"),
    user: User = Depends(get_current_user),
):
    """One inspiration line per calendar day; deterministic (same quote all day for everyone)."""
    _ = user  # authenticated dashboard surface; quote is not personalized
    lc_raw = (lang or "he").lower()
    lc: Lang = "en" if lc_raw == "en" else "he"
    today = date.today()
    d_iso, quote = daily_inspiration_for_date(today, lc)
    return DailyInspirationRead(date=d_iso, quote=quote)


@router.get("/daily-tip", response_model=DailyTipRead)
def get_daily_tip(
    lang: str = Query("he", description="he | en"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Rule-based daily tip from tasks, daily focus, rooms, streak; stable for the calendar day."""
    lc_raw = (lang or "he").lower()
    lc: Lang = "en" if lc_raw == "en" else "he"
    today = date.today()
    d_iso, tip, room_name, reason = build_rule_based_daily_tip(db, user.id, today, lc)
    return DailyTipRead(
        date=d_iso,
        tip=tip,
        context=DailyTipContextRead(room=room_name, reason=reason),
    )
