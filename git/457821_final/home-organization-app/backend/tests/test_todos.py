"""
Todos Tests - 15+ test cases
Tests for: CRUD operations, completion toggle, task association
"""
import pytest
from fastapi import status
from sqlalchemy.orm import Session
from app.db.models import User, Task, Todo


class TestTodoCreation:
    """Tests for todo creation endpoint"""
    
    @pytest.mark.todos
    def test_create_todo_success(self, client, auth_headers, test_task: Task):
        """Test successful todo creation"""
        response = client.post(
            "/api/todos/",
            json={
                "title": "New todo item",
                "task_id": test_task.id,
            },
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["title"] == "New todo item"
        assert data["completed"] == False
        assert data["task_id"] == test_task.id
    
    @pytest.mark.todos
    def test_create_todo_already_completed(self, client, auth_headers, test_task: Task):
        """Test creating a todo that's already completed"""
        response = client.post(
            "/api/todos/",
            json={
                "title": "Already done",
                "task_id": test_task.id,
                "completed": True,
            },
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["completed"] == True
    
    @pytest.mark.todos
    def test_create_todo_unauthenticated(self, client, test_task: Task):
        """Test todo creation without authentication"""
        response = client.post(
            "/api/todos/",
            json={
                "title": "Unauthorized todo",
                "task_id": test_task.id,
            }
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    @pytest.mark.todos
    def test_create_todo_invalid_task(self, client, auth_headers):
        """Test creating todo for non-existent task"""
        response = client.post(
            "/api/todos/",
            json={
                "title": "Orphan todo",
                "task_id": 99999,
            },
            headers=auth_headers
        )
        assert response.status_code in [
            status.HTTP_404_NOT_FOUND,
            status.HTTP_400_BAD_REQUEST,
        ]
    
    @pytest.mark.todos
    def test_create_multiple_todos(self, client, auth_headers, test_task: Task):
        """Test creating multiple todos for a task"""
        todos = [
            {"title": "Step 1", "task_id": test_task.id},
            {"title": "Step 2", "task_id": test_task.id},
            {"title": "Step 3", "task_id": test_task.id},
        ]
        for todo in todos:
            response = client.post(
                "/api/todos/",
                json=todo,
                headers=auth_headers
            )
            assert response.status_code == status.HTTP_201_CREATED


class TestTodoRead:
    """Tests for reading todos"""
    
    @pytest.mark.todos
    def test_get_all_todos(self, client, auth_headers, test_todo: Todo):
        """Test getting all todos"""
        response = client.get("/api/todos/", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
    
    @pytest.mark.todos
    def test_get_single_todo(self, client, auth_headers, test_todo: Todo):
        """Test getting a specific todo"""
        response = client.get(f"/api/todos/{test_todo.id}", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == test_todo.id
        assert data["title"] == test_todo.title
    
    @pytest.mark.todos
    def test_get_nonexistent_todo(self, client, auth_headers):
        """Test getting a todo that doesn't exist"""
        response = client.get("/api/todos/99999", headers=auth_headers)
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    @pytest.mark.todos
    def test_get_todos_for_task(self, client, auth_headers, test_task: Task, db: Session):
        """Test getting todos for a specific task"""
        # Create multiple todos for the task
        for i in range(3):
            todo = Todo(title=f"Todo {i}", task_id=test_task.id)
            db.add(todo)
        db.commit()
        
        response = client.get(
            f"/api/tasks/{test_task.id}/todos",
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) >= 3


class TestTodoUpdate:
    """Tests for todo update endpoint"""
    
    @pytest.mark.todos
    def test_update_todo_title(self, client, auth_headers, test_todo: Todo):
        """Test updating todo title"""
        response = client.put(
            f"/api/todos/{test_todo.id}",
            json={"title": "Updated todo title"},
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["title"] == "Updated todo title"
    
    @pytest.mark.todos
    def test_update_todo_completion(self, client, auth_headers, test_todo: Todo):
        """Test updating todo completion status"""
        response = client.put(
            f"/api/todos/{test_todo.id}",
            json={"completed": True},
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["completed"] == True
    
    @pytest.mark.todos
    def test_toggle_todo_completion(self, client, auth_headers, test_todo: Todo):
        """Test dedicated toggle completion endpoint"""
        # First toggle - should complete
        response = client.put(
            f"/api/todos/{test_todo.id}/complete",
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["completed"] == True
        
        # Second toggle - should uncomplete
        response = client.put(
            f"/api/todos/{test_todo.id}/complete",
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["completed"] == False
    
    @pytest.mark.todos
    def test_update_nonexistent_todo(self, client, auth_headers):
        """Test updating a todo that doesn't exist"""
        response = client.put(
            "/api/todos/99999",
            json={"title": "Ghost todo"},
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestTodoDelete:
    """Tests for todo deletion endpoint"""
    
    @pytest.mark.todos
    def test_delete_todo_success(self, client, auth_headers, test_todo: Todo, db: Session):
        """Test successful todo deletion"""
        todo_id = test_todo.id
        response = client.delete(f"/api/todos/{todo_id}", headers=auth_headers)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Verify todo is deleted
        deleted_todo = db.query(Todo).filter(Todo.id == todo_id).first()
        assert deleted_todo is None
    
    @pytest.mark.todos
    def test_delete_nonexistent_todo(self, client, auth_headers):
        """Test deleting a todo that doesn't exist"""
        response = client.delete("/api/todos/99999", headers=auth_headers)
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestTodoOrdering:
    """Tests for todo ordering/positioning"""
    
    @pytest.mark.todos
    def test_todos_ordered_by_position(
        self, client, auth_headers, test_task: Task, db: Session
    ):
        """Test that todos are returned ordered by position"""
        # Create todos with different positions
        todo3 = Todo(title="Third", task_id=test_task.id, position=3)
        todo1 = Todo(title="First", task_id=test_task.id, position=1)
        todo2 = Todo(title="Second", task_id=test_task.id, position=2)
        db.add_all([todo3, todo1, todo2])
        db.commit()
        
        response = client.get(
            f"/api/tasks/{test_task.id}/todos",
            headers=auth_headers
        )
        data = response.json()
        
        # Check ordering
        positions = [todo.get("position", 0) for todo in data]
        assert positions == sorted(positions)
    
    @pytest.mark.todos
    def test_update_todo_position(self, client, auth_headers, test_todo: Todo):
        """Test updating todo position for reordering"""
        response = client.put(
            f"/api/todos/{test_todo.id}",
            json={"position": 5},
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["position"] == 5


class TestTodoIsolation:
    """Tests for user data isolation"""
    
    @pytest.mark.todos
    def test_users_cannot_access_other_users_todos(
        self, client, second_auth_headers, test_todo: Todo
    ):
        """Test that users cannot access other users' todos"""
        response = client.get(
            f"/api/todos/{test_todo.id}",
            headers=second_auth_headers
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    @pytest.mark.todos
    def test_users_cannot_update_other_users_todos(
        self, client, second_auth_headers, test_todo: Todo
    ):
        """Test that users cannot update other users' todos"""
        response = client.put(
            f"/api/todos/{test_todo.id}",
            json={"title": "Hacked todo"},
            headers=second_auth_headers
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    @pytest.mark.todos
    def test_users_cannot_delete_other_users_todos(
        self, client, second_auth_headers, test_todo: Todo
    ):
        """Test that users cannot delete other users' todos"""
        response = client.delete(
            f"/api/todos/{test_todo.id}",
            headers=second_auth_headers
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
