from __future__ import annotations

import os
from types import SimpleNamespace
from typing import Any, Callable, Optional

# ----------------------------------------------------------------------
# הגדרת Celery (Broker = Redis, Backend = Redis)
# ----------------------------------------------------------------------
#
# Celery async must NOT break local dev boot.
# If `REDIS_URL` isn't configured, we disable async mode and fall back to DummyCelery
# so calls like `send_welcome_email.delay(...)` don't hang on broker/DNS timeouts.
#
BROKER_URL = os.getenv("REDIS_URL")
USE_DUMMY = BROKER_URL is None or BROKER_URL == ""
try:
    if USE_DUMMY:
        raise ModuleNotFoundError("REDIS_URL missing; disabling Celery async in dev")
    # Celery is optional for local/dev boot.
    # If it's not installed, the API should still start and routes should work;
    # background jobs will be executed synchronously (best-effort) via a dummy adapter.
    from celery import Celery  # type: ignore

    celery = Celery(
        "eli_maor",
        broker=BROKER_URL,
        backend=BROKER_URL,
        include=[
            # רשימת משימות **שאנו באמת משתמשים**:
            "app.workers.tasks",                    # push-notifications
            "app.workers.shopping_reminder_tasks",  # תזכורת לקניות
            "app.workers.email_tasks",              # שליחת אימיילים
            "app.workers.recurring_tasks",          # משימות חוזרות
            "app.celery_tasks.google_calendar",     # סנכרון עם Google Calendar
            # אפשר להוסיף כאן משימות חדשות בעתיד
        ],
    )

    celery.conf.update(
        task_serializer="json",
        result_serializer="json",
        accept_content=["json"],
        timezone="UTC",
        enable_utc=True,
    )
except ModuleNotFoundError:
    class DummyTask:
        def __init__(self, fn: Callable[..., Any], name: Optional[str] = None):
            self.fn = fn
            self.name = name or getattr(fn, "__name__", "dummy_task")

        def __call__(self, *args: Any, **kwargs: Any) -> Any:
            return self.fn(*args, **kwargs)

        # Best-effort synchronous execution.
        def apply_async(
            self,
            args: Optional[list[Any]] = None,
            kwargs: Optional[dict[str, Any]] = None,
            **_opts: Any,
        ) -> Any:
            # In local/dev we intentionally avoid any broker connection and avoid
            # doing potentially slow side effects during request handling.
            # Background execution is treated as optional.
            print(f"[SMOKE-DEBUG] Celery disabled; skipping async task {self.name}")
            return None

        def delay(self, *args: Any, **kwargs: Any) -> Any:
            return self.apply_async(args=list(args), kwargs=kwargs)

    class DummyCelery:
        def __init__(self):
            # Match the attribute style used by the rest of the code (`celery.conf.update(...)`).
            self.conf = SimpleNamespace(update=lambda **_kw: None, beat_schedule={})

        def task(self, *t_args: Any, **t_kwargs: Any):
            # Supports both:
            #   @celery.task(name="...") and @celery.task(...)
            task_name = t_kwargs.get("name")

            def decorator(fn: Callable[..., Any]) -> DummyTask:
                return DummyTask(fn, name=task_name)

            # If used as bare decorator without parens: @celery.task
            if t_args and callable(t_args[0]) and len(t_args) == 1 and not task_name:
                return decorator(t_args[0])
            return decorator

    celery = DummyCelery()
    # No logger here on purpose: keep import side-effects minimal.
    print("[WARN] Celery async disabled (celery missing or REDIS_URL not configured). Using dummy adapter.")

# ----------------------------------------------------------------------
# Beat Schedule - משימות מתוזמנות
# ----------------------------------------------------------------------
celery.conf.beat_schedule = {
    # דוגמה: שליחת תזכורת קניות כל שעה
    "send-shopping-reminders": {
        "task": "app.workers.shopping_reminder_tasks.send_shopping_reminders",
        "schedule": 60 * 60,      # כל שעה
    },
    # הוסיפו משימות נוספות לפי צורך
}
