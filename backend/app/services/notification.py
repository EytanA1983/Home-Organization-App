import json
from typing import List
from app.config import settings
from pywebpush import webpush, WebPushException
from app.workers.celery_app import celery

# כאן נשמור (ב‑DB או ב‑Redis) את subscription_info של כל משתמש.
# לדוגמה נשתמש במפת (dict) פשוטה למטרות הדגמה:
_SUBSCRIPTIONS: dict[int, List[dict]] = {}

def register_subscription(user_id: int, subscription: dict):
    """שומר subscription של משתמש. משמש endpoint ב‑frontend."""
    _SUBSCRIPTIONS.setdefault(user_id, []).append(subscription)

@celery.task(name="app.services.notification.push_notification")
def push_notification(user_id: int, title: str, body: str):
    """שליחת Web Push לכל המכשירים של משתמש."""
    subs = _SUBSCRIPTIONS.get(user_id, [])
    payload = json.dumps({"title": title, "body": body, "icon": "/favicon.ico"})
    for sub in subs:
        try:
            webpush(
                subscription_info=sub,
                data=payload,
                vapid_private_key=settings.vapid_private_key_decrypted or settings.VAPID_PRIVATE_KEY,
                vapid_claims={"sub": "mailto:admin@example.com"},
            )
        except WebPushException as exc:
            print(f"Push failed: {exc}")

# -- Voice feedback (client‑side) --
def send_voice_feedback(text: str, language: str = "he-IL"):
    """פונקציה מקומית שנקראת רק ב‑backend למטרות לוג. בפועל
    הפידבק הקולי יבוצע ב‑frontend בעזרת Web Speech API."""
    print(f"[VOICE FEEDBACK] ({language}) {text}")
