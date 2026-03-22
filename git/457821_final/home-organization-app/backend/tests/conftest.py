"""
Test configuration and fixtures for pytest.
Uses SQLite in-memory database for isolation and speed.
"""
import pytest
from typing import Generator, Dict, Any
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from httpx import AsyncClient, ASGITransport
import asyncio

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.db.models import User, Room, Task, Category, Todo
from app.core.security import get_password_hash, create_access_token
from app.config import settings


# Test database URL - SQLite in memory
TEST_DATABASE_URL = "sqlite:///:memory:"

# Create test engine with StaticPool for thread safety
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db() -> Generator[Session, None, None]:
    """Override database dependency for tests"""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


# Override the get_db dependency
app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="function")
def db() -> Generator[Session, None, None]:
    """Create a fresh database for each test function"""
    # Create all tables
    Base.metadata.create_all(bind=test_engine)
    
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        # Drop all tables after test
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db: Session) -> Generator[TestClient, None, None]:
    """Create a test client with database override"""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def async_client(db: Session) -> AsyncClient:
    """Create an async test client for async tests"""
    return AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    )


@pytest.fixture
def test_user(db: Session) -> User:
    """Create a test user"""
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpassword123"),
        full_name="Test User",
        is_active=True,
        is_superuser=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_user_token(test_user: User) -> str:
    """Create an access token for the test user"""
    return create_access_token(data={"sub": test_user.email})


@pytest.fixture
def auth_headers(test_user_token: str) -> Dict[str, str]:
    """Create authorization headers for authenticated requests"""
    return {"Authorization": f"Bearer {test_user_token}"}


@pytest.fixture
def second_user(db: Session) -> User:
    """Create a second test user for permission tests"""
    user = User(
        email="second@example.com",
        hashed_password=get_password_hash("password123"),
        full_name="Second User",
        is_active=True,
        is_superuser=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def second_user_token(second_user: User) -> str:
    """Create an access token for the second user"""
    return create_access_token(data={"sub": second_user.email})


@pytest.fixture
def second_auth_headers(second_user_token: str) -> Dict[str, str]:
    """Create authorization headers for the second user"""
    return {"Authorization": f"Bearer {second_user_token}"}


@pytest.fixture
def test_room(db: Session, test_user: User) -> Room:
    """Create a test room"""
    room = Room(
        name="Test Room",
        owner_id=test_user.id,
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


@pytest.fixture
def test_category(db: Session, test_user: User) -> Category:
    """Create a test category"""
    category = Category(
        name="Test Category",
        icon="📦",
        user_id=test_user.id,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@pytest.fixture
def test_task(db: Session, test_user: User, test_room: Room, test_category: Category) -> Task:
    """Create a test task"""
    task = Task(
        title="Test Task",
        description="Test task description",
        user_id=test_user.id,
        room_id=test_room.id,
        category_id=test_category.id,
        completed=False,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@pytest.fixture
def test_todo(db: Session, test_task: Task) -> Todo:
    """Create a test todo"""
    todo = Todo(
        title="Test Todo",
        task_id=test_task.id,
        completed=False,
    )
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo


@pytest.fixture
def multiple_rooms(db: Session, test_user: User) -> list[Room]:
    """Create multiple test rooms"""
    rooms = []
    for i in range(5):
        room = Room(
            name=f"Room {i + 1}",
            owner_id=test_user.id,
        )
        db.add(room)
        rooms.append(room)
    db.commit()
    for room in rooms:
        db.refresh(room)
    return rooms


@pytest.fixture
def multiple_tasks(db: Session, test_user: User, test_room: Room) -> list[Task]:
    """Create multiple test tasks"""
    tasks = []
    for i in range(10):
        task = Task(
            title=f"Task {i + 1}",
            description=f"Description for task {i + 1}",
            user_id=test_user.id,
            room_id=test_room.id,
            completed=i % 2 == 0,  # Half completed
        )
        db.add(task)
        tasks.append(task)
    db.commit()
    for task in tasks:
        db.refresh(task)
    return tasks


# Pytest configuration
def pytest_configure(config):
    """Configure pytest markers"""
    config.addinivalue_line("markers", "auth: Tests for authentication")
    config.addinivalue_line("markers", "rooms: Tests for rooms")
    config.addinivalue_line("markers", "tasks: Tests for tasks")
    config.addinivalue_line("markers", "notifications: Tests for notifications")
    config.addinivalue_line("markers", "integration: Integration tests")
    config.addinivalue_line("markers", "slow: Slow tests")
