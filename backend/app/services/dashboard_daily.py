"""
Daily dashboard content: deterministic inspiration + rule-based tips.

- Inspiration: same quote for a given calendar date (server local), rotates daily.
- Tips: derived from DB state (tasks, rooms, daily focus, progress). Structured so a
  future LLM call can replace `build_rule_based_daily_tip` without changing routes.
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from datetime import date, datetime
from typing import Literal

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.models import DailyFocus, Room, Task
from app.services.progress import compute_progress_summary

Lang = Literal["he", "en"]

# Curated bilingual lines: (he, en)
INSPIRATION_QUOTES: list[tuple[str, str]] = [
    ("קטן בכל יום — זה מה שבונה שקט גדול.", "Small steps each day build a calmer home."),
    ("סדר אחד בכל פעם. זה מספיק.", "One area at a time. That is enough."),
    ("הבית לא צריך להיות מושלם — רק נושם.", "Your home does not need to be perfect—just breathable."),
    ("חמש דקות של פוקוס עדיפות על דחיינות.", "Five focused minutes beat procrastination."),
    ("מה שיוצא מהמגירה משחרר מקום בראש.", "What leaves the drawer frees space in your mind."),
    ("בחרי משימה אחת וסיימי אותה. זה ניצחון.", "Pick one task and finish it. That is a win."),
    ("סדר הוא לא עונש — זו מתנה לעצמך.", "Tidying is not a punishment—it is a gift to yourself."),
    ("התחילי מהמקום שמפריע הכי פחות לעין — קל להמשיך.", "Start where it bothers you least—momentum follows."),
    ("כל פריט שחוזר למקום הקבוע שלו חוסך החלטות.", "Every item back in its place saves a decision."),
    ("את לא חייבת לסדר הכל היום.", "You do not have to organize everything today."),
    ("שקט בבית מתחיל ממשימה קטנה אחת.", "Calm at home starts with one small task."),
    ("סיימת משהו? עצרי לרגע והעריכי את עצמך.", "Finished something? Pause and appreciate it."),
    ("פחות חפצים בולטים = פחות רעש חזותי.", "Fewer visible items = less visual noise."),
    ("היום טוב לסדר מגירה אחת בלבד.", "Today is a good day for just one drawer."),
    ("אל תשווי את הבית שלך לסטוריז — השווי לשלכם.", "Do not compare your home to highlights—compare to your yesterday."),
    ("משימה קטנה שסיימת > רשימה ארוכה שלא התחלת.", "A tiny task done beats a long list not started."),
    ("אפשר לעצור באמצע. המשך מחר זה גם התקדמות.", "Stopping mid-way is okay. Continuing tomorrow is still progress."),
    ("סדר הוא הרגל, לא אירוע חד-פעמי.", "Tidying is a habit, not a one-time event."),
    ("בחרי נוחות על פני שלמות.", "Choose comfort over perfection."),
    ("כל פינה מסודרת נותנת לך אוויר.", "Every tidied corner gives you breathing room."),
    ("היום מתאים לזרוק דבר אחד שלא שימש שנה.", "Today is a good day to release one unused item."),
    ("אם זה לוקח פחות מדקה — עשי את זה עכשיו.", "If it takes under a minute—do it now."),
    ("הבית משקף אותך — ואת יכולה לשנות אותו לאט.", "Your home reflects you—and you can change it gently."),
    ("שימי לב למה שכבר עבד — חזרי על זה.", "Notice what already worked—repeat that."),
    ("אין צורך בהירואיזם. עקביות מנצחת.", "No heroics needed. Consistency wins."),
    ("סדר זה לא צבא — זו חמלה לעצמך.", "Tidying is not the military—it is self-kindness."),
    ("התחילי מהקל — הביטחון יבוא אחר כך.", "Start easy—confidence follows."),
    ("כל יום חדש הוא הזדמנות לעשות צעד קטן.", "Each new day is a chance for a small step."),
    ("השאירי רק מה שמשרת את החיים של עכשיו.", "Keep only what serves your life now."),
    ("סיימת? נשימה עמוקה. זה מספיק להיום.", "Done? Deep breath. That is enough for today."),
]


def _pick_index_deterministic(day: date, salt: str, modulo: int) -> int:
    payload = f"{day.isoformat()}:{salt}".encode("utf-8")
    digest = hashlib.sha256(payload).digest()
    return int.from_bytes(digest[:8], "big") % modulo


def daily_inspiration_for_date(day: date, lang: Lang) -> tuple[str, str]:
    """Return (date_str, quote) for response."""
    idx = _pick_index_deterministic(day, "inspiration-v1", len(INSPIRATION_QUOTES))
    he, en = INSPIRATION_QUOTES[idx]
    quote = en if lang == "en" else he
    return day.isoformat(), quote


@dataclass
class _TipBuild:
    tip_he: str
    tip_en: str
    room: str | None
    reason: str


def build_rule_based_daily_tip(db: Session, user_id: int, day: date, lang: Lang) -> tuple[str, str, str | None, str]:
    """
    Rule-based MVP tip. Replace this function body with LLM + structured context later.
    Returns (date_iso, tip, room_name_or_none, reason).
    """
    open_q = db.query(Task).filter(Task.user_id == user_id, Task.completed.is_(False))
    open_tasks = open_q.all()
    open_count = len(open_tasks)

    # due_date may be datetime or date
    due_today_count = 0
    for t in open_tasks:
        if t.due_date is None:
            continue
        d = t.due_date.date() if isinstance(t.due_date, datetime) else t.due_date
        if d == day:
            due_today_count += 1

    focus = db.query(DailyFocus).filter(DailyFocus.user_id == user_id, DailyFocus.date == day).first()
    focus_done = focus is not None and focus.completed_at is not None

    summary = compute_progress_summary(db, user_id, "week")
    streak = int(summary.streak_days or 0)

    rooms_count = db.query(func.count(Room.id)).filter(Room.owner_id == user_id).scalar() or 0

    # Room with most open tasks
    crowded = (
        db.query(Task.room_id, func.count(Task.id).label("cnt"))
        .filter(Task.user_id == user_id, Task.completed.is_(False), Task.room_id.isnot(None))
        .group_by(Task.room_id)
        .order_by(func.count(Task.id).desc())
        .first()
    )
    crowded_room_name: str | None = None
    if crowded and crowded[0] is not None:
        rid = crowded[0]
        room_row = db.query(Room).filter(Room.id == rid).first()
        if room_row:
            crowded_room_name = room_row.name

    # --- Rules (priority order) ---
    if open_count == 0:
        built = _TipBuild(
            tip_he="אין משימות פתוחות כרגע — הוסיפי משימה קטנה אחת כדי להתחיל מומנטום.",
            tip_en="No open tasks yet—add one small task to build gentle momentum.",
            room=None,
            reason="no_open_tasks",
        )
    elif focus_done:
        built = _TipBuild(
            tip_he="סיימת את פוקוס היום — בחרי מדף או מגירה אחת קטנה כדי לשמור על הקצב בלי עומס.",
            tip_en="You finished today’s focus—pick one small shelf or drawer to keep momentum without overload.",
            room=crowded_room_name,
            reason="daily_focus_completed",
        )
    elif streak >= 5:
        built = _TipBuild(
            tip_he=f"רצף של {streak} ימים — מדהים! היום שמרי על קלילות: משימה קצרה של 5 דקות מספיקה.",
            tip_en=f"{streak}-day streak—amazing! Keep today light: a 5-minute task is enough.",
            room=crowded_room_name,
            reason="streak_high",
        )
    elif open_count >= 12:
        built = _TipBuild(
            tip_he="יש הרבה משימות פתוחות — אל תנסי לסדר הכל. בחרי חדר אחד ומשימה אחת בלבד.",
            tip_en="Many open tasks—don’t tackle everything. Choose one room and one task only.",
            room=crowded_room_name,
            reason="many_open_tasks",
        )
    elif due_today_count >= 3:
        built = _TipBuild(
            tip_he="יש כמה משימות עם מועד היום — סדרי לפי מה שהכי מקל עליך עכשיו, לא לפי רשימה מלאה.",
            tip_en="Several tasks are due today—tackle what eases your mind most, not the whole list.",
            room=crowded_room_name,
            reason="multiple_due_today",
        )
    elif crowded_room_name and crowded and crowded[1] and int(crowded[1]) >= 3:
        built = _TipBuild(
            tip_he=f"בחדר \"{crowded_room_name}\" הצטברו כמה משימות — הקדישי 5 דקות רק שם.",
            tip_en=f"A few tasks piled up in “{crowded_room_name}”—give it just 5 minutes.",
            room=crowded_room_name,
            reason="crowded_room",
        )
    elif rooms_count == 0:
        built = _TipBuild(
            tip_he="עדיין אין חדרים מוגדרים — צרי חדר ראשון כדי שהמשימות יקבלו בית.",
            tip_en="No rooms yet—create your first room so tasks have a clear home.",
            room=None,
            reason="no_rooms",
        )
    else:
        built = _TipBuild(
            tip_he="בחרי משימה אחת קטנה והשלימי אותה היום — עדיף סיום אחד מתחילת שלוש.",
            tip_en="Pick one small task and finish it today—one done beats three started.",
            room=crowded_room_name,
            reason="default_balanced",
        )

    tip = built.tip_en if lang == "en" else built.tip_he
    return day.isoformat(), tip, built.room, built.reason
