from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import List, Dict, Optional
from app.api.deps import get_user_by_email
from app.db.models import User
from app.config import settings
from app.core.logging import logger
from jose import JWTError, jwt

router = APIRouter()

# מחזיק רשימת חיבורים לכל משתמש
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, user_id: int, ws: WebSocket):
        await ws.accept()
        self.active_connections.setdefault(user_id, []).append(ws)
        logger.info(
            f"WebSocket connection established for user {user_id}",
            extra={"user_id": user_id, "active_connections": len(self.active_connections.get(user_id, []))}
        )

    def disconnect(self, user_id: int, ws: WebSocket):
        if user_id in self.active_connections and ws in self.active_connections[user_id]:
            self.active_connections[user_id].remove(ws)
            remaining = len(self.active_connections[user_id])
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                logger.info(
                    f"WebSocket connection closed for user {user_id} (no remaining connections)",
                    extra={"user_id": user_id}
                )
            else:
                logger.info(
                    f"WebSocket connection closed for user {user_id} ({remaining} remaining)",
                    extra={"user_id": user_id, "remaining_connections": remaining}
                )

    async def broadcast(self, user_id: int, message: dict):
        if user_id not in self.active_connections:
            return
        disconnected = []
        for ws in self.active_connections[user_id]:
            try:
                await ws.send_json(message)
            except:
                disconnected.append(ws)
        
        # Remove disconnected connections
        for ws in disconnected:
            self.disconnect(user_id, ws)
    
    async def broadcast_to_user(self, message: dict, user_id: int):
        """Alias for broadcast for compatibility"""
        await self.broadcast(user_id, message)

manager = ConnectionManager()


async def get_current_user_from_token(token: str) -> Optional[User]:
    """
    Authenticate user from JWT token (for WebSocket)
    Similar to get_current_user but works with token string directly
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
    except JWTError:
        return None
    
    # Get user from database
    from app.db.session import SessionLocal
    db = SessionLocal()
    try:
        user = get_user_by_email(db, email=email)
        return user
    finally:
        db.close()


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(..., description="JWT token for authentication")
):
    """
    WebSocket endpoint עם אימות דרך token ב-query parameter
    משתמש ב-get_current_user logic לאימות
    """
    # Authenticate user from token
    if not token:
        await websocket.close(code=1008, reason="Authentication required")
        return
    
    # Use get_current_user logic to authenticate
    user = await get_current_user_from_token(token)
    if not user:
        logger.warning("WebSocket connection rejected: Invalid token")
        await websocket.close(code=1008, reason="Invalid token")
        return
    
    if not user.is_active:
        logger.warning(f"WebSocket connection rejected: User {user.id} is inactive")
        await websocket.close(code=1008, reason="User is inactive")
        return
    
    await manager.connect(user.id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # אפשר להוסיף כאן קבלת פקודות (לדוגמה: "ping")
            if data.get("type") == "ping":
                await manager.broadcast(user.id, {"type": "pong"})
            else:
                await manager.broadcast(user.id, {"type": "echo", "payload": data})
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user {user.id}")
        manager.disconnect(user.id, websocket)
