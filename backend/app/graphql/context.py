"""
GraphQL Context - Authentication and request context
"""
from typing import Optional
from fastapi import Request
from app.api.deps import get_current_user
from app.db.models import User


async def get_graphql_context(request: Request) -> dict:
    """
    Get GraphQL context with current user
    """
    context = {
        "request": request,
        "current_user": None,
    }
    
    # Try to get current user from token
    try:
        # Extract token from Authorization header
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "")
            
            # Import here to avoid circular imports
            from jose import jwt
            from app.config import settings
            from app.db.session import SessionLocal
            from app.api.deps import get_user_by_email
            
            try:
                # Decode token
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
                email = payload.get("sub")
                
                if email:
                    # Get user from database
                    db = SessionLocal()
                    try:
                        user = get_user_by_email(db, email)
                        if user:
                            context["current_user"] = user
                    finally:
                        db.close()
            except Exception:
                # Invalid token, continue without user
                pass
    except Exception:
        # No auth, continue without user
        pass
    
    return context
