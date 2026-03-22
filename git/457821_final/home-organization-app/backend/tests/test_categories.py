"""
Categories Tests - 15+ test cases
Tests for: CRUD operations, user isolation
"""
import pytest
from fastapi import status
from sqlalchemy.orm import Session
from app.db.models import User, Category, Task


class TestCategoryCreation:
    """Tests for category creation endpoint"""
    
    @pytest.mark.categories
    def test_create_category_success(self, client, auth_headers):
        """Test successful category creation"""
        response = client.post(
            "/api/categories/",
            json={
                "name": "Clothes",
                "icon": "👕"
            },
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["name"] == "Clothes"
        assert data["icon"] == "👕"
        assert "id" in data
    
    @pytest.mark.categories
    def test_create_category_without_icon(self, client, auth_headers):
        """Test category creation without icon"""
        response = client.post(
            "/api/categories/",
            json={"name": "Books"},
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["name"] == "Books"
    
    @pytest.mark.categories
    def test_create_category_unauthenticated(self, client):
        """Test category creation without authentication"""
        response = client.post(
            "/api/categories/",
            json={"name": "Test Category"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    @pytest.mark.categories
    def test_create_category_empty_name(self, client, auth_headers):
        """Test category creation with empty name"""
        response = client.post(
            "/api/categories/",
            json={"name": ""},
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    @pytest.mark.categories
    def test_create_multiple_categories(self, client, auth_headers):
        """Test creating multiple categories"""
        categories = [
            {"name": "Clothes", "icon": "👕"},
            {"name": "Books", "icon": "📚"},
            {"name": "Electronics", "icon": "💻"},
            {"name": "Documents", "icon": "📄"},
        ]
        for cat in categories:
            response = client.post(
                "/api/categories/",
                json=cat,
                headers=auth_headers
            )
            assert response.status_code == status.HTTP_201_CREATED


class TestCategoryRead:
    """Tests for reading categories"""
    
    @pytest.mark.categories
    def test_get_all_categories(self, client, auth_headers, test_category: Category):
        """Test getting all categories for user"""
        response = client.get("/api/categories/", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
    
    @pytest.mark.categories
    def test_get_single_category(self, client, auth_headers, test_category: Category):
        """Test getting a specific category"""
        response = client.get(
            f"/api/categories/{test_category.id}",
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == test_category.id
        assert data["name"] == test_category.name
    
    @pytest.mark.categories
    def test_get_nonexistent_category(self, client, auth_headers):
        """Test getting a category that doesn't exist"""
        response = client.get("/api/categories/99999", headers=auth_headers)
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    @pytest.mark.categories
    def test_get_other_user_category_forbidden(
        self, client, second_auth_headers, test_category: Category
    ):
        """Test that users cannot access other users' categories"""
        response = client.get(
            f"/api/categories/{test_category.id}",
            headers=second_auth_headers
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    @pytest.mark.categories
    def test_categories_ordered_by_position(self, client, auth_headers, db: Session, test_user: User):
        """Test that categories are returned ordered by position"""
        # Create categories with different positions
        cat3 = Category(name="Third", user_id=test_user.id, position=3)
        cat1 = Category(name="First", user_id=test_user.id, position=1)
        cat2 = Category(name="Second", user_id=test_user.id, position=2)
        db.add_all([cat3, cat1, cat2])
        db.commit()
        
        response = client.get("/api/categories/", headers=auth_headers)
        data = response.json()
        
        # Check ordering
        positions = [cat.get("position", 0) for cat in data]
        assert positions == sorted(positions)


class TestCategoryUpdate:
    """Tests for category update endpoint"""
    
    @pytest.mark.categories
    def test_update_category_name(self, client, auth_headers, test_category: Category):
        """Test updating category name"""
        response = client.put(
            f"/api/categories/{test_category.id}",
            json={"name": "Updated Category"},
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "Updated Category"
    
    @pytest.mark.categories
    def test_update_category_icon(self, client, auth_headers, test_category: Category):
        """Test updating category icon"""
        response = client.put(
            f"/api/categories/{test_category.id}",
            json={"icon": "🎁"},
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["icon"] == "🎁"
    
    @pytest.mark.categories
    def test_update_category_partial(self, client, auth_headers, test_category: Category):
        """Test partial category update"""
        original_name = test_category.name
        response = client.put(
            f"/api/categories/{test_category.id}",
            json={"icon": "🔧"},
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == original_name  # Name unchanged
        assert data["icon"] == "🔧"
    
    @pytest.mark.categories
    def test_update_other_user_category_forbidden(
        self, client, second_auth_headers, test_category: Category
    ):
        """Test that users cannot update other users' categories"""
        response = client.put(
            f"/api/categories/{test_category.id}",
            json={"name": "Hacked Category"},
            headers=second_auth_headers
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestCategoryDelete:
    """Tests for category deletion endpoint"""
    
    @pytest.mark.categories
    def test_delete_category_success(
        self, client, auth_headers, test_category: Category, db: Session
    ):
        """Test successful category deletion"""
        cat_id = test_category.id
        response = client.delete(
            f"/api/categories/{cat_id}",
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Verify category is deleted
        deleted_cat = db.query(Category).filter(Category.id == cat_id).first()
        assert deleted_cat is None
    
    @pytest.mark.categories
    def test_delete_category_with_tasks(
        self, client, auth_headers, test_task: Task, db: Session
    ):
        """Test deleting category also handles associated tasks"""
        cat_id = test_task.category_id
        response = client.delete(
            f"/api/categories/{cat_id}",
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT
    
    @pytest.mark.categories
    def test_delete_other_user_category_forbidden(
        self, client, second_auth_headers, test_category: Category
    ):
        """Test that users cannot delete other users' categories"""
        response = client.delete(
            f"/api/categories/{test_category.id}",
            headers=second_auth_headers
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    @pytest.mark.categories
    def test_delete_nonexistent_category(self, client, auth_headers):
        """Test deleting a category that doesn't exist"""
        response = client.delete("/api/categories/99999", headers=auth_headers)
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestCategoryIsolation:
    """Tests for user data isolation"""
    
    @pytest.mark.categories
    def test_users_see_only_their_categories(
        self, client, auth_headers, second_auth_headers,
        test_user: User, second_user: User, db: Session
    ):
        """Test that users only see their own categories"""
        # Create categories for both users
        cat1 = Category(name="User1 Category", user_id=test_user.id)
        cat2 = Category(name="User2 Category", user_id=second_user.id)
        db.add_all([cat1, cat2])
        db.commit()
        
        # First user should only see their categories
        response1 = client.get("/api/categories/", headers=auth_headers)
        data1 = response1.json()
        assert all(cat["user_id"] == test_user.id for cat in data1)
        
        # Second user should only see their categories
        response2 = client.get("/api/categories/", headers=second_auth_headers)
        data2 = response2.json()
        assert all(cat["user_id"] == second_user.id for cat in data2)
