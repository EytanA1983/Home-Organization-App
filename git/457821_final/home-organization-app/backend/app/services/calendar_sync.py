from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google.auth.transport.requests import Request
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class GoogleCalendarService:
    def __init__(self):
        self.scopes = [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events'
        ]
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.redirect_uri = settings.GOOGLE_REDIRECT_URI

    def get_authorization_url(self, state: str = None) -> str:
        """Get Google OAuth authorization URL"""
        if not self.client_id or not self.client_secret:
            raise ValueError("Google OAuth credentials not configured")
        
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [self.redirect_uri]
                }
            },
            scopes=self.scopes
        )
        flow.redirect_uri = self.redirect_uri
        authorization_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent',
            state=state
        )
        return authorization_url

    def get_credentials_from_code(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for credentials"""
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [self.redirect_uri]
                }
            },
            scopes=self.scopes
        )
        flow.redirect_uri = self.redirect_uri
        flow.fetch_token(code=code)
        
        return {
            "token": flow.credentials.token,
            "refresh_token": flow.credentials.refresh_token,
            "token_uri": flow.credentials.token_uri,
            "client_id": flow.credentials.client_id,
            "client_secret": flow.credentials.client_secret,
            "scopes": flow.credentials.scopes,
            "expiry": flow.credentials.expiry.isoformat() if flow.credentials.expiry else None
        }

    def get_credentials(self, token: str, refresh_token: str) -> Optional[Credentials]:
        """Get Credentials object from stored tokens"""
        try:
            creds = Credentials(
                token=token,
                refresh_token=refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=self.client_id,
                client_secret=self.client_secret,
                scopes=self.scopes
            )
            
            # Refresh token if expired
            if creds.expired and creds.refresh_token:
                creds.refresh(Request())
            
            return creds
        except Exception as e:
            logger.error(f"Error creating credentials: {e}")
            return None

    def get_service(self, token: str, refresh_token: str) -> Optional[object]:
        """Get Google Calendar service instance"""
        creds = self.get_credentials(token, refresh_token)
        if not creds:
            return None

        try:
            service = build('calendar', 'v3', credentials=creds)
            return service
        except Exception as e:
            logger.error(f"Error creating service: {e}")
            return None

    def sync_task_to_calendar(
        self,
        token: str,
        refresh_token: str,
        task_title: str,
        task_description: str = "",
        due_date: datetime = None,
        task_id: int = None,
        room_name: str = None,
        priority: str = None
    ) -> Optional[str]:
        """Sync task to Google Calendar"""
        if not due_date:
            return None

        service = self.get_service(token, refresh_token)
        if not service:
            return None

        # Map priority to color
        color_map = {
            "urgent": "11",  # Red
            "high": "6",     # Orange
            "medium": "5",   # Yellow
            "low": "10"       # Green
        }
        color_id = color_map.get(priority, "9")  # Default: Blue

        # Build description
        description = task_description or ""
        if task_id:
            description += f"\n\nTask ID: {task_id}"
        if room_name:
            description += f"\nRoom: {room_name}"

        # Calculate end time (1 hour default)
        end_time = due_date + timedelta(hours=1)

        event = {
            'summary': task_title,
            'description': description,
            'start': {
                'dateTime': due_date.isoformat(),
                'timeZone': 'Asia/Jerusalem',
            },
            'end': {
                'dateTime': end_time.isoformat(),
                'timeZone': 'Asia/Jerusalem',
            },
            'colorId': color_id,
        }

        try:
            created_event = service.events().insert(
                calendarId='primary',
                body=event
            ).execute()
            
            logger.info(f"Event created: {created_event.get('id')}")
            return created_event.get('id')
        except HttpError as error:
            logger.error(f"An error occurred creating event: {error}")
            return None
