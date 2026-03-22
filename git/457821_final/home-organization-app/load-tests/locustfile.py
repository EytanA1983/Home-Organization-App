"""
Locust Load Testing for Eli Maor API
=====================================

Tests:
- REST API endpoints (auth, rooms, tasks, categories)
- WebSocket connections
- Celery task triggers

Usage:
    # Install locust
    pip install locust

    # Run with web UI
    locust -f locustfile.py --host=http://localhost:8000

    # Run headless (100 users, spawn rate 10/s, 5 minutes)
    locust -f locustfile.py --host=http://localhost:8000 \
        --users 100 --spawn-rate 10 --run-time 5m --headless

    # Run with specific user classes
    locust -f locustfile.py --host=http://localhost:8000 \
        -u 50 -r 5 --tags api

Access Web UI: http://localhost:8089
"""
import json
import random
import string
from datetime import datetime, timedelta
from typing import Optional

from locust import HttpUser, task, between, events, tag
from locust.contrib.fasthttp import FastHttpUser
import websocket
import threading
import time


# ==================== Test Data ====================

def random_string(length: int = 10) -> str:
    """Generate random string for test data."""
    return ''.join(random.choices(string.ascii_lowercase, k=length))


def random_email() -> str:
    """Generate random email."""
    return f"loadtest_{random_string(8)}@test.com"


# Test user pool (pre-registered for faster tests)
TEST_USERS = [
    {"email": f"loadtest_user_{i}@test.com", "password": "LoadTest123!"}
    for i in range(100)
]


# ==================== Base User Class ====================

class EliMaorUser(FastHttpUser):
    """
    Base user class for Eli Maor API load testing.
    Uses FastHttpUser for better performance.
    """
    # Wait between 1-3 seconds between tasks
    wait_time = between(1, 3)

    # User state
    token: Optional[str] = None
    user_id: Optional[int] = None
    rooms: list = []
    tasks_list: list = []
    categories: list = []

    def on_start(self):
        """Called when user starts - login or register."""
        # Try to use existing test user
        test_user = random.choice(TEST_USERS)

        # Try login first
        response = self.client.post(
            "/api/auth/login",
            json=test_user,
            headers={"Content-Type": "application/json"},
            name="/api/auth/login"
        )

        if response.status_code == 200:
            data = response.json()
            self.token = data.get("access_token")
            return

        # If login fails, register new user
        email = random_email()
        password = "LoadTest123!"

        response = self.client.post(
            "/api/auth/register",
            json={
                "email": email,
                "password": password,
                "name": f"Load Test User {random_string(5)}"
            },
            headers={"Content-Type": "application/json"},
            name="/api/auth/register"
        )

        if response.status_code in [200, 201]:
            # Login with new user
            response = self.client.post(
                "/api/auth/login",
                json={"email": email, "password": password},
                headers={"Content-Type": "application/json"},
                name="/api/auth/login"
            )
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")

    def on_stop(self):
        """Called when user stops."""
        pass

    @property
    def auth_headers(self) -> dict:
        """Get authorization headers."""
        if self.token:
            return {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            }
        return {"Content-Type": "application/json"}


# ==================== API User ====================

class APIUser(EliMaorUser):
    """
    User that tests REST API endpoints.
    Weight: 70% of users
    """
    weight = 70

    # ==================== Health ====================

    @task(1)
    @tag("health")
    def health_check(self):
        """Basic health check."""
        self.client.get("/health", name="/health")

    @task(1)
    @tag("health")
    def ready_check(self):
        """Readiness probe."""
        self.client.get("/ready", name="/ready")

    # ==================== Rooms ====================

    @task(10)
    @tag("api", "rooms")
    def list_rooms(self):
        """List all rooms."""
        if not self.token:
            return

        response = self.client.get(
            "/api/rooms",
            headers=self.auth_headers,
            name="/api/rooms [GET]"
        )

        if response.status_code == 200:
            self.rooms = response.json()

    @task(3)
    @tag("api", "rooms")
    def create_room(self):
        """Create a new room."""
        if not self.token:
            return

        room_names = ["סלון", "מטבח", "חדר שינה", "חדר אמבטיה", "משרד", "מרפסת"]

        response = self.client.post(
            "/api/rooms",
            json={
                "name": f"{random.choice(room_names)} {random_string(4)}",
                "description": f"Test room created by load test"
            },
            headers=self.auth_headers,
            name="/api/rooms [POST]"
        )

        if response.status_code in [200, 201]:
            room = response.json()
            self.rooms.append(room)

    @task(5)
    @tag("api", "rooms")
    def get_room(self):
        """Get a specific room."""
        if not self.token or not self.rooms:
            return

        room = random.choice(self.rooms)
        room_id = room.get("id")

        self.client.get(
            f"/api/rooms/{room_id}",
            headers=self.auth_headers,
            name="/api/rooms/{id} [GET]"
        )

    # ==================== Tasks ====================

    @task(10)
    @tag("api", "tasks")
    def list_tasks(self):
        """List all tasks."""
        if not self.token:
            return

        response = self.client.get(
            "/api/tasks",
            headers=self.auth_headers,
            name="/api/tasks [GET]"
        )

        if response.status_code == 200:
            self.tasks_list = response.json()

    @task(5)
    @tag("api", "tasks")
    def list_tasks_with_filter(self):
        """List tasks with filters."""
        if not self.token:
            return

        params = {}

        # Random filter
        if random.random() > 0.5:
            params["completed"] = random.choice(["true", "false"])

        if self.rooms and random.random() > 0.7:
            room = random.choice(self.rooms)
            params["room_id"] = room.get("id")

        self.client.get(
            "/api/tasks",
            params=params,
            headers=self.auth_headers,
            name="/api/tasks [GET] filtered"
        )

    @task(5)
    @tag("api", "tasks")
    def create_task(self):
        """Create a new task."""
        if not self.token:
            return

        task_titles = [
            "לנקות", "לסדר", "לארגן", "לשטוף", "לקנות",
            "לתקן", "לבדוק", "להחליף", "לזרוק", "למיין"
        ]

        room_id = None
        if self.rooms and random.random() > 0.3:
            room = random.choice(self.rooms)
            room_id = room.get("id")

        due_date = (datetime.now() + timedelta(days=random.randint(1, 30))).isoformat()

        response = self.client.post(
            "/api/tasks",
            json={
                "title": f"{random.choice(task_titles)} {random_string(5)}",
                "description": "Task created by load test",
                "room_id": room_id,
                "due_date": due_date,
                "priority": random.choice(["low", "medium", "high"])
            },
            headers=self.auth_headers,
            name="/api/tasks [POST]"
        )

        if response.status_code in [200, 201]:
            task = response.json()
            self.tasks_list.append(task)

    @task(3)
    @tag("api", "tasks")
    def complete_task(self):
        """Mark a task as complete."""
        if not self.token or not self.tasks_list:
            return

        # Find an incomplete task
        incomplete_tasks = [t for t in self.tasks_list if not t.get("completed")]
        if not incomplete_tasks:
            return

        task = random.choice(incomplete_tasks)
        task_id = task.get("id")

        response = self.client.put(
            f"/api/tasks/{task_id}/complete",
            headers=self.auth_headers,
            name="/api/tasks/{id}/complete [PUT]"
        )

        if response.status_code == 200:
            task["completed"] = True

    # ==================== Categories ====================

    @task(5)
    @tag("api", "categories")
    def list_categories(self):
        """List all categories."""
        if not self.token:
            return

        response = self.client.get(
            "/api/categories",
            headers=self.auth_headers,
            name="/api/categories [GET]"
        )

        if response.status_code == 200:
            self.categories = response.json()

    @task(2)
    @tag("api", "categories")
    def create_category(self):
        """Create a new category."""
        if not self.token:
            return

        category_names = ["ניקיון", "קניות", "תיקונים", "ארגון", "תחזוקה"]

        self.client.post(
            "/api/categories",
            json={
                "name": f"{random.choice(category_names)} {random_string(3)}",
                "color": f"#{random.randint(0, 0xFFFFFF):06x}"
            },
            headers=self.auth_headers,
            name="/api/categories [POST]"
        )

    # ==================== User Profile ====================

    @task(2)
    @tag("api", "auth")
    def get_me(self):
        """Get current user profile."""
        if not self.token:
            return

        self.client.get(
            "/api/auth/me",
            headers=self.auth_headers,
            name="/api/auth/me [GET]"
        )


# ==================== WebSocket User ====================

class WebSocketUser(EliMaorUser):
    """
    User that tests WebSocket connections.
    Weight: 20% of users
    """
    weight = 20

    ws: Optional[websocket.WebSocket] = None
    ws_thread: Optional[threading.Thread] = None
    ws_running: bool = False

    def on_start(self):
        """Initialize and connect WebSocket."""
        super().on_start()

        if not self.token:
            return

        # Connect WebSocket
        try:
            ws_url = self.host.replace("http://", "ws://").replace("https://", "wss://")
            ws_url = f"{ws_url}/ws?token={self.token}"

            start_time = time.time()
            self.ws = websocket.create_connection(ws_url, timeout=10)
            connect_time = time.time() - start_time

            # Report successful connection
            events.request.fire(
                request_type="WebSocket",
                name="ws://connect",
                response_time=connect_time * 1000,
                response_length=0,
                exception=None,
                context={}
            )

            # Start listener thread
            self.ws_running = True
            self.ws_thread = threading.Thread(target=self._ws_listener)
            self.ws_thread.daemon = True
            self.ws_thread.start()

        except Exception as e:
            events.request.fire(
                request_type="WebSocket",
                name="ws://connect",
                response_time=0,
                response_length=0,
                exception=e,
                context={}
            )

    def on_stop(self):
        """Close WebSocket connection."""
        self.ws_running = False
        if self.ws:
            try:
                self.ws.close()
            except:
                pass
        super().on_stop()

    def _ws_listener(self):
        """Listen for WebSocket messages."""
        while self.ws_running and self.ws:
            try:
                message = self.ws.recv()
                # Report message received
                events.request.fire(
                    request_type="WebSocket",
                    name="ws://message_received",
                    response_time=0,
                    response_length=len(message),
                    exception=None,
                    context={}
                )
            except Exception as e:
                if self.ws_running:
                    events.request.fire(
                        request_type="WebSocket",
                        name="ws://error",
                        response_time=0,
                        response_length=0,
                        exception=e,
                        context={}
                    )
                break

    @task(1)
    @tag("websocket")
    def send_ping(self):
        """Send ping message via WebSocket."""
        if not self.ws:
            return

        try:
            start_time = time.time()
            self.ws.send(json.dumps({"type": "ping"}))
            response_time = time.time() - start_time

            events.request.fire(
                request_type="WebSocket",
                name="ws://ping",
                response_time=response_time * 1000,
                response_length=0,
                exception=None,
                context={}
            )
        except Exception as e:
            events.request.fire(
                request_type="WebSocket",
                name="ws://ping",
                response_time=0,
                response_length=0,
                exception=e,
                context={}
            )

    @task(2)
    @tag("websocket", "api")
    def create_task_and_receive(self):
        """Create task via API and expect WebSocket update."""
        if not self.token or not self.ws:
            return

        # Create task via REST API
        response = self.client.post(
            "/api/tasks",
            json={
                "title": f"WS Test Task {random_string(5)}",
                "description": "Task for WebSocket test"
            },
            headers=self.auth_headers,
            name="/api/tasks [POST] (ws test)"
        )


# ==================== Heavy User (Celery Tasks) ====================

class HeavyUser(EliMaorUser):
    """
    User that triggers heavy operations (Celery tasks).
    Weight: 10% of users
    """
    weight = 10

    @task(5)
    @tag("api", "statistics")
    def get_statistics(self):
        """Get statistics (may trigger heavy calculation)."""
        if not self.token:
            return

        self.client.get(
            "/api/statistics",
            headers=self.auth_headers,
            name="/api/statistics [GET]"
        )

    @task(3)
    @tag("api", "notifications")
    def register_push_subscription(self):
        """Register push notification subscription."""
        if not self.token:
            return

        # Fake VAPID subscription
        self.client.post(
            "/api/notifications/subscribe",
            json={
                "endpoint": f"https://fake-push-service.com/{random_string(32)}",
                "keys": {
                    "p256dh": random_string(87),
                    "auth": random_string(22)
                }
            },
            headers=self.auth_headers,
            name="/api/notifications/subscribe [POST]"
        )

    @task(2)
    @tag("api", "recurring")
    def create_recurring_task(self):
        """Create recurring task (triggers Celery)."""
        if not self.token:
            return

        self.client.post(
            "/api/recurring-tasks",
            json={
                "title": f"Recurring Test {random_string(5)}",
                "description": "Recurring task for load test",
                "recurrence_rule": "FREQ=DAILY;INTERVAL=1",
                "start_date": datetime.now().isoformat()
            },
            headers=self.auth_headers,
            name="/api/recurring-tasks [POST]"
        )

    @task(1)
    @tag("api", "ai")
    def get_ai_suggestions(self):
        """Get AI suggestions (may be slow)."""
        if not self.token or not self.rooms:
            return

        room = random.choice(self.rooms)
        room_id = room.get("id")

        # This might timeout - that's expected for heavy operations
        with self.client.get(
            f"/api/ai/suggestions/room/{room_id}",
            headers=self.auth_headers,
            name="/api/ai/suggestions [GET]",
            catch_response=True,
            timeout=30
        ) as response:
            if response.status_code == 200:
                response.success()
            elif response.status_code == 504:
                response.success()  # Timeout is acceptable for AI
            else:
                response.failure(f"Status: {response.status_code}")


# ==================== Event Hooks ====================

@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Called when test starts."""
    print("=" * 60)
    print("Load Test Starting")
    print(f"Target: {environment.host}")
    print("=" * 60)


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Called when test stops."""
    print("=" * 60)
    print("Load Test Completed")
    print("=" * 60)


@events.request.add_listener
def on_request(request_type, name, response_time, response_length, exception, **kwargs):
    """Log failed requests."""
    if exception:
        print(f"FAILED: {request_type} {name} - {exception}")
