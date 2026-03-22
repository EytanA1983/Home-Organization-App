"""Google Calendar schemas for API validation and serialization"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class CalendarEvent(BaseModel):
    """Schema for Google Calendar event"""
    id: str = Field(..., description="Event ID from Google Calendar")
    summary: Optional[str] = Field(None, description="Event title/summary")
    description: Optional[str] = Field(None, description="Event description")
    start: str = Field(..., description="Event start time (ISO format)")
    end: str = Field(..., description="Event end time (ISO format)")
    location: Optional[str] = Field(None, description="Event location")
    htmlLink: Optional[str] = Field(None, description="Link to event in Google Calendar")

    model_config = {"from_attributes": True}


class DashboardCalendarAnchor(BaseModel):
    """
    Primary calendar timezone + “today” and Sun-start week dates (YYYY-MM-DD).
    Used to align Dashboard / Vision week strip with Google Calendar.
    """

    connected: bool = Field(..., description="False if Google Calendar is not linked or metadata fetch failed")
    time_zone: Optional[str] = Field(None, description="IANA tz from calendar#primary, e.g. Asia/Jerusalem")
    today: Optional[str] = Field(None, description="Today’s calendar date in time_zone (YYYY-MM-DD)")
    week_start: Optional[str] = Field(None, description="Sunday of the week containing `today`, in time_zone")
    today_day_index: Optional[int] = Field(
        None, description="0=Sunday … 6=Saturday for `today` within that week",
        ge=0,
        le=6,
    )
    week_dates: Optional[List[str]] = Field(
        None, description="Seven YYYY-MM-DD strings Sun→Sat for the visible week",
    )

    model_config = {"from_attributes": True}
