"""
Data Sanitizer Service
GDPR-compliant data sanitization before sending to external APIs
"""
from typing import Dict, Any, List, Optional


class DataSanitizer:
    """Service for sanitizing data before sending to external APIs"""
    
    # Fields that are safe to send (non-PII)
    SAFE_TASK_FIELDS = ['id', 'title', 'description', 'completed', 'priority']
    SAFE_CATEGORY_FIELDS = ['id', 'name', 'icon']
    SAFE_ROOM_FIELDS = ['id', 'name']
    
    # Fields that should NEVER be sent (PII)
    FORBIDDEN_FIELDS = [
        'user_id',
        'user_email',
        'email',
        'owner_id',
        'owner_email',
        'full_name',
        'hashed_password',
        'google_refresh_token',
    ]
    
    @staticmethod
    def sanitize_task_data(tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Sanitize task data - remove PII, keep only safe fields
        """
        sanitized = []
        for task in tasks:
            sanitized_task = {}
            for field in DataSanitizer.SAFE_TASK_FIELDS:
                if field in task:
                    sanitized_task[field] = task[field]
            sanitized.append(sanitized_task)
        return sanitized
    
    @staticmethod
    def sanitize_category_data(categories: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Sanitize category data - remove PII, keep only safe fields
        """
        sanitized = []
        for cat in categories:
            sanitized_cat = {}
            for field in DataSanitizer.SAFE_CATEGORY_FIELDS:
                if field in cat:
                    sanitized_cat[field] = cat[field]
            sanitized.append(sanitized_cat)
        return sanitized
    
    @staticmethod
    def sanitize_room_data(rooms: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Sanitize room data - remove PII, keep only safe fields
        """
        sanitized = []
        for room in rooms:
            sanitized_room = {}
            for field in DataSanitizer.SAFE_ROOM_FIELDS:
                if field in room:
                    sanitized_room[field] = room[field]
            sanitized.append(sanitized_room)
        return sanitized
    
    @staticmethod
    def sanitize_dict(data: Dict[str, Any], allowed_fields: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Sanitize a dictionary - remove PII, keep only allowed fields
        """
        if not data:
            return {}
        
        sanitized = {}
        for key, value in data.items():
            # Skip forbidden fields
            if key in DataSanitizer.FORBIDDEN_FIELDS:
                continue
            
            # If allowed_fields specified, only include those
            if allowed_fields and key not in allowed_fields:
                continue
            
            # Recursively sanitize nested dicts
            if isinstance(value, dict):
                sanitized[key] = DataSanitizer.sanitize_dict(value, allowed_fields)
            elif isinstance(value, list):
                # For lists, sanitize each item if it's a dict
                sanitized[key] = [
                    DataSanitizer.sanitize_dict(item, allowed_fields) if isinstance(item, dict) else item
                    for item in value
                ]
            else:
                sanitized[key] = value
        
        return sanitized


# Global instance
data_sanitizer = DataSanitizer()
