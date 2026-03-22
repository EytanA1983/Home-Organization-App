"""
Tasks Tests - 15+ test cases
Tests for: CRUD operations, filtering, completion, todos
"""
import pytest
from fastapi import status
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.db.models import User, Room, Task, Category, Todo


class TestTaskCreation:
    """Tests for task creation endpoint"""
    
    @pytest.mark.tasks
    def test_create_task_success(self, client, auth_headers, test_room: Room):
        """Test successful task creation"""
        response = client.post(
            "/api/tasks/",
            json={
                "title": "Clean the room",
                "description": "Deep cleaning needed",
                "room_id": test_room.id,
            },
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["title"] == "Clean the room"
        assert data["completed"] == False
        assert "id" in data
    
    @pytest.mark.tasks
    def test_create_task_with_due_date(self, client, auth_headers, test_room: Room):
        """Test task creation with due date"""
        due_date = (datetime.utcnow() + timedelta(days=7)).isoformat()
        response = client.post(
            "/api/tasks/",
            json={
                "title": "Task with deadline",
                "due_date": due_date,
                "room_id": test_room.id,
            },
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["due_date"] is not None
    
    @pytest.mark.tasks
    def test_create_task_with_category(
        self, client, auth_headers, test_room: Room, test_category: Category
    ):
        """Test task creation with category"""
        response = client.post(
            "/api/tasks/",
            json={
                "title": "Categorized task",
                "room_id": test_room.id,
                "category_id": test_category.id,
            },
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["category_id"] == test_category.id
    
    @pytest.mark.tasks
    def test_create_task_unauthenticated(self, client):
        """Test task creation without authentication"""
        response = client.post(
            "/api/tasks/",
            json={"title": "Unauthorized task"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    @pytest.mark.tasks
    def test_create_task_empty_title(self, client, auth_headers):
        """Test task creation with empty title"""
        response = client.post(
            "/api/tasks/",
            json={"title": ""},
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestTaskRead:
    """Tests for reading tasks"""
    
    @pytest.mark.tasks
    def test_get_all_tasks(self, client, auth_headers, multiple_tasks: list[Task]):
        """Test getting all tasks for user"""
        response = client.get("/api/tasks/", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == len(multiple_tasks)
    
    @pytest.mark.tasks
    def test_get_single_task(self, client, auth_headers, test_task: Task):
        """Test getting a specific task"""
        response = client.get(f"/api/tasks/{test_task.id}", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == test_task.id
        assert data["title"] == test_task.title
    
    @pytest.mark.tasks
    def test_filter_tasks_by_completed(
        self, client, auth_headers, multiple_tasks: list[Task]
    ):
        """Test filtering tasks by completion status"""
        # Get completed tasks
        response = client.get("/api/tasks/?completed=true", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        completed_tasks = response.json()
        assert all(t["completed"] for t in completed_tasks)
        
        # Get incomplete tasks
        response = client.get("/api/tasks/?completed=false", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        incomplete_tasks = response.json()
        assert all(not t["completed"] for t in incomplete_tasks)
    
    @pytest.mark.tasks
    def test_filter_tasks_by_room(
        self, client, auth_headers, test_task: Task
    ):
        """Test filtering tasks by room"""
        response = client.get(
            f"/api/tasks/?room_id={test_task.room_id}",
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert all(t["room_id"] == test_task.room_id for t in data)
    
    @pytest.mark.tasks
    def test_filter_tasks_by_category(
        self, client, auth_headers, test_task: Task
    ):
        """Test filtering tasks by category"""
        response = client.get(
            f"/api/tasks/?category_id={test_task.category_id}",
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert all(t["category_id"] == test_task.category_id for t in data)
    
    @pytest.mark.tasks
    def test_get_other_user_task_forbidden(
        self, client, second_auth_headers, test_task: Task
    ):
        """Test that users cannot access other users' tasks"""
        response = client.get(
            f"/api/tasks/{test_task.id}",
            headers=second_auth_headers
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestTaskUpdate:
    """Tests for task update endpoint"""
    
    @pytest.mark.tasks
    def test_update_task_title(self, client, auth_headers, test_task: Task):
        """Test updating task title"""
        response = client.put(
            f"/api/tasks/{test_task.id}",
            json={"title": "Updated Task Title"},
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["title"] == "Updated Task Title"
    
    @pytest.mark.tasks
    def test_update_task_completion(self, client, auth_headers, test_task: Task):
        """Test updating task completion status"""
        response = client.put(
            f"/api/tasks/{test_task.id}",
            json={"completed": True},
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["completed"] == True
    
    @pytest.mark.tasks
    def test_complete_task_endpoint(self, client, auth_headers, test_task: Task):
        """Test dedicated task completion endpoint"""
        response = client.put(
            f"/api/tasks/{test_task.id}/complete",
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["completed"] == True
    
    @pytest.mark.tasks
    def test_update_task_due_date(self, client, auth_headers, test_task: Task):
        """Test updating task due date"""
        new_due_date = (datetime.utcnow() + timedelta(days=14)).isoformat()
        response = client.put(
            f"/api/tasks/{test_task.id}",
            json={"due_date": new_due_date},
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK


class TestTaskDelete:
    """Tests for task deletion endpoint"""
    
    @pytest.mark.tasks
    def test_delete_task_success(self, client, auth_headers, test_task: Task, db: Session):
        """Test successful task deletion"""
        task_id = test_task.id
        response = client.delete(f"/api/tasks/{task_id}", headers=auth_headers)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Verify task is deleted
        deleted_task = db.query(Task).filter(Task.id == task_id).first()
        assert deleted_task is None
    
    @pytest.mark.tasks
    def test_delete_task_with_todos(
        self, client, auth_headers, test_todo: Todo, db: Session
    ):
        """Test deleting task also deletes associated todos (cascade)"""
        task_id = test_todo.task_id
        response = client.delete(f"/api/tasks/{task_id}", headers=auth_headers)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Verify todo is also deleted
        deleted_todo = db.query(Todo).filter(Todo.task_id == task_id).first()
        assert deleted_todo is None


class TestTaskTodos:
    """Tests for task todos sub-resources"""
    
    @pytest.mark.tasks
    def test_get_task_todos(self, client, auth_headers, test_task: Task, test_todo: Todo):
        """Test getting todos for a task"""
        response = client.get(
            f"/api/tasks/{test_task.id}/todos",
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) >= 1
        assert any(t["id"] == test_todo.id for t in data)
    
    @pytest.mark.tasks
    def test_create_todo_for_task(self, client, auth_headers, test_task: Task):
        """Test creating a todo for a task"""
        response = client.post(
            f"/api/todos/",
            json={
                "title": "New Todo Item",
                "task_id": test_task.id,
            },
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["title"] == "New Todo Item"
        assert data["task_id"] == test_task.id
        assert data["completed"] == False


class TestRecurringTasks:
    """Tests for recurring task functionality"""
    
    @pytest.mark.tasks
    @pytest.mark.integration
    def test_create_recurring_task(self, client, auth_headers, test_room: Room):
        """Test creating a recurring task with RRULE"""
        response = client.post(
            "/api/tasks/",
            json={
                "title": "Weekly cleaning",
                "room_id": test_room.id,
                "rrule_string": "FREQ=WEEKLY;INTERVAL=1",
                "rrule_start_date": datetime.utcnow().isoformat(),
            },
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["is_recurring_template"] == True
