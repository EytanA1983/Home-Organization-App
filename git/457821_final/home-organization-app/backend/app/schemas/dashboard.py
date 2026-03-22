"""Dashboard daily inspiration + rule-based daily tip (MVP; LLM-ready later)."""

from __future__ import annotations

from pydantic import BaseModel, Field


class DailyInspirationRead(BaseModel):
    date: str = Field(..., description="Calendar day YYYY-MM-DD (server local)")
    quote: str = Field(..., description="Inspiration line for the day")


class DailyTipContextRead(BaseModel):
    room: str | None = Field(None, description="Related room name if any")
    reason: str = Field(..., description="Rule id for debugging / future AI context")


class DailyTipRead(BaseModel):
    date: str = Field(..., description="Calendar day YYYY-MM-DD (server local)")
    tip: str = Field(..., description="Personalized daily tip (rule-based MVP)")
    context: DailyTipContextRead
