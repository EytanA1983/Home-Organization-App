"""
Progress + streak from Task completion timestamps.

Completion instant (per task, only when completed=True):
  1) task.completed_at — set by API on complete (preferred).
  2) task.updated_at — fallback for legacy rows missing completed_at (weak proxy:
     any edit updates updated_at, so counts can be slightly inaccurate).

Tasks with completed=True but both timestamps NULL are ignored for all date-based stats
(streak, weekly counts, daily trend) — avoids guessing.
"""

from __future__ import annotations

from collections import Counter, defaultdict
from datetime import date, datetime, timedelta, timezone
from typing import Optional, Set, Tuple

from sqlalchemy.orm import Session, joinedload

from app.db.models import Task
from app.schemas.progress import CategoryProgressItem, DailyCompletedCount, ProgressSummaryRead
from app.services.product_category_inference import infer_category_for_task


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _as_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def effective_completion_at(task: Task) -> Optional[datetime]:
    """UTC instant when the task was treated as completed, or None if unknown."""
    if not task.completed:
        return None
    raw = task.completed_at or task.updated_at
    if raw is None:
        return None
    return _as_utc(raw)


def _period_bounds_utc(range_key: str, today: date) -> Tuple[datetime, datetime]:
    """
    Return [start, end) in UTC for the summary period.

    week: ISO week (Monday 00:00 UTC through next Monday 00:00 UTC).
    month: trailing 30 days ending now (not aligned to calendar month).
    """
    if range_key == "month":
        end = _utc_now()
        start = end - timedelta(days=30)
        return start, end

    monday = today - timedelta(days=today.weekday())
    start = datetime.combine(monday, datetime.min.time(), tzinfo=timezone.utc)
    end = start + timedelta(days=7)
    return start, end


def compute_progress_summary(db: Session, user_id: int, range_key: str) -> ProgressSummaryRead:
    if range_key not in ("week", "month"):
        range_key = "week"

    today = _utc_now().date()
    period_start, period_end = _period_bounds_utc(range_key, today)

    tasks = (
        db.query(Task)
        .filter(Task.user_id == user_id, Task.completed.is_(True))
        .all()
    )

    completed_tasks_in_period = 0
    rooms_with_completion_in_period: Set[int] = set()
    all_completion_dates: Set[date] = set()
    per_day_counter: Counter[date] = Counter()

    for t in tasks:
        eff = effective_completion_at(t)
        if eff is None:
            continue
        d = eff.date()
        all_completion_dates.add(d)
        per_day_counter[d] += 1

        if period_start <= eff < period_end:
            completed_tasks_in_period += 1
            if t.room_id is not None:
                rooms_with_completion_in_period.add(t.room_id)

    # -------------------------------------------------------------------------
    # Streak (explicit product rule):
    # - A streak is consecutive calendar days (UTC) on which the user completed
    #   at least one task.
    # - The streak must *end today* (UTC): if there is no completion on today's
    #   date, streak_days = 0 — even if yesterday had completions.
    # -------------------------------------------------------------------------
    streak_days = 0
    if today in all_completion_dates:
        cursor = today
        while cursor in all_completion_dates:
            streak_days += 1
            cursor -= timedelta(days=1)

    # Last 7 UTC calendar days ending today, always returned (stable chart length)
    daily_completed_counts: list[DailyCompletedCount] = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        daily_completed_counts.append(DailyCompletedCount(date=d, count=per_day_counter.get(d, 0)))

    # -------------------------------------------------------------------------
    # Category-level progress (all tasks for user; slice sizes = workload share).
    # -------------------------------------------------------------------------
    all_tasks = (
        db.query(Task)
        .options(joinedload(Task.room), joinedload(Task.category))
        .filter(Task.user_id == user_id)
        .all()
    )
    totals: dict[str, int] = defaultdict(int)
    completed_by_cat: dict[str, int] = defaultdict(int)
    for t in all_tasks:
        room_name = t.room.name if t.room else None
        cat_name = t.category.name if t.category else None
        key = infer_category_for_task(room_name, cat_name)
        if key is None:
            key = "other"
        totals[key] += 1
        if t.completed:
            completed_by_cat[key] += 1

    category_progress: list[CategoryProgressItem] = []
    for cat_key in sorted(totals.keys(), key=lambda k: (-totals[k], k)):
        tot = totals[cat_key]
        done = completed_by_cat.get(cat_key, 0)
        pct = int(round(100.0 * done / tot)) if tot > 0 else 0
        category_progress.append(
            CategoryProgressItem(category=cat_key, completed=done, total=tot, percent=pct)
        )

    return ProgressSummaryRead(
        completed_tasks_this_week=completed_tasks_in_period,
        rooms_progressed_this_week=len(rooms_with_completion_in_period),
        streak_days=streak_days,
        daily_completed_counts=daily_completed_counts,
        category_progress=category_progress,
        range=range_key,  # type: ignore[arg-type]
    )
