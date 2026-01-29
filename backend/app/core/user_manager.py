from typing import Optional
from fastapi_users import BaseUserManager, IntegerIDMixin
from fastapi_users.exceptions import UserAlreadyExists
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.db.models import User
from app.core.user_db import get_user_db


class UserManager(IntegerIDMixin, BaseUserManager[User, int]):
    reset_password_token_secret = settings.SECRET_KEY
    verification_token_secret = settings.SECRET_KEY

    async def on_after_register(
        self, user: User, request: Optional[dict] = None
    ):
        print(f"User {user.id} has registered.")

    async def on_after_forgot_password(
        self, user: User, token: str, request: Optional[dict] = None
    ):
        print(f"User {user.id} has forgot their password. Reset token: {token}")

    async def on_after_request_verify(
        self, user: User, token: str, request: Optional[dict] = None
    ):
        print(f"Verification requested for user {user.id}. Verification token: {token}")


async def get_user_manager(user_db: AsyncSession = None):
    if user_db is None:
        async for db in get_user_db():
            user_db = db
            break
    
    yield UserManager(user_db)
