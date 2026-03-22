"""Defaults and row ↔ schema mapping for vision board."""

from __future__ import annotations

from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from app.db.models import VisionBoard
from app.schemas.vision_board import VisionBoardRead, VisionBoardUpdate


def friendly_defaults(lang: str) -> Tuple[str, List[str], None, None]:
    """When no DB row exists, return starter copy (per requested language)."""
    if (lang or "he").lower() == "en":
        return (
            "A calm home that supports my energy and daily rhythm.",
            [
                "Clear surfaces I use every day",
                "Everything has an easy home",
                "Small tidy wins, consistently",
            ],
            None,
            None,
        )
    return (
        "בית רגוע שתומך באנרגיה שלי ובקצב היומי.",
        [
            "משטחים נקיים במה שבשימוש יומיומי",
            "לכל דבר יש מקום קבוע",
            "ניצחונות קטנים וקבועים בסידור",
        ],
        None,
        None,
    )


def read_for_user(db: Session, user_id: int, lang: str) -> VisionBoardRead:
    row = db.query(VisionBoard).filter(VisionBoard.user_id == user_id).first()
    if row is None:
        vs, ints, img, qt = friendly_defaults(lang)
        return VisionBoardRead(vision_statement=vs, intentions=ints, image_url=img, quote=qt)
    return VisionBoardRead(
        vision_statement=row.vision_statement or "",
        intentions=[
            row.intention_1 or "",
            row.intention_2 or "",
            row.intention_3 or "",
        ],
        image_url=row.image_url,
        quote=row.quote,
    )


def upsert_for_user(db: Session, user_id: int, payload: VisionBoardUpdate) -> VisionBoardRead:
    intents = list(payload.intentions)
    while len(intents) < 3:
        intents.append("")
    intents = intents[:3]

    row = db.query(VisionBoard).filter(VisionBoard.user_id == user_id).first()
    if row is None:
        row = VisionBoard(user_id=user_id)
        db.add(row)

    row.vision_statement = (payload.vision_statement or "").strip()[:4000]
    row.intention_1 = intents[0][:500] if intents[0] else ""
    row.intention_2 = intents[1][:500] if len(intents) > 1 and intents[1] else ""
    row.intention_3 = intents[2][:500] if len(intents) > 2 and intents[2] else ""
    row.image_url = (payload.image_url.strip()[:2048] if payload.image_url else None) or None
    row.quote = (payload.quote.strip()[:2000] if payload.quote else None) or None

    db.commit()
    db.refresh(row)

    return VisionBoardRead(
        vision_statement=row.vision_statement or "",
        intentions=[row.intention_1 or "", row.intention_2 or "", row.intention_3 or ""],
        image_url=row.image_url,
        quote=row.quote,
    )
