"""
Authentication Tests - 15+ test cases
Tests for: register, login, logout, token refresh, user management
"""
import pytest
from fastapi import status
from sqlalchemy.orm import Session
from app.db.models import User
from app.core.security import get_password_hash


class TestUserRegistration:
    """Tests for user registration endpoint"""
    
    @pytest.mark.auth
    def test_register_user_success(self, client, db: Session):
        """Test successful user registration"""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "securepassword123",
            }
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert "id" in data
        assert "hashed_password" not in data  # Password should not be returned
    
    @pytest.mark.auth
    def test_register_duplicate_email(self, client, test_user: User):
        """Test registration with existing email fails"""
        response = client.post(
            "/api/auth/register",
            json={
                "email": test_user.email,
                "password": "anotherpassword123",
            }
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already registered" in response.json()["detail"].lower()
    
    @pytest.mark.auth
    def test_register_invalid_email(self, client):
        """Test registration with invalid email format"""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "invalid-email",
                "password": "securepassword123",
            }
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    @pytest.mark.auth
    def test_register_short_password(self, client):
        """Test registration with password shorter than minimum"""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "user@example.com",
                "password": "short",  # Less than 8 characters
            }
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    @pytest.mark.auth
    def test_register_missing_fields(self, client):
        """Test registration with missing required fields"""
        response = client.post(
            "/api/auth/register",
            json={"email": "user@example.com"}  # Missing password
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestUserLogin:
    """Tests for user login endpoint"""
    
    @pytest.mark.auth
    def test_login_success(self, client, test_user: User):
        """Test successful login"""
        response = client.post(
            "/api/auth/login",
            data={
                "username": test_user.email,
                "password": "testpassword123",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert "expires_in" in data
    
    @pytest.mark.auth
    def test_login_wrong_password(self, client, test_user: User):
        """Test login with wrong password"""
        response = client.post(
            "/api/auth/login",
            data={
                "username": test_user.email,
                "password": "wrongpassword",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    @pytest.mark.auth
    def test_login_nonexistent_user(self, client):
        """Test login with non-existent email"""
        response = client.post(
            "/api/auth/login",
            data={
                "username": "nonexistent@example.com",
                "password": "anypassword",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    @pytest.mark.auth
    def test_login_inactive_user(self, client, db: Session):
        """Test login with inactive user account"""
        # Create inactive user
        inactive_user = User(
            email="inactive@example.com",
            hashed_password=get_password_hash("password123"),
            is_active=False,
        )
        db.add(inactive_user)
        db.commit()
        
        response = client.post(
            "/api/auth/login",
            data={
                "username": "inactive@example.com",
                "password": "password123",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestCurrentUser:
    """Tests for current user endpoint"""
    
    @pytest.mark.auth
    def test_get_current_user_authenticated(self, client, test_user: User, auth_headers):
        """Test getting current user when authenticated"""
        response = client.get("/api/auth/me", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == test_user.email
        assert data["id"] == test_user.id
    
    @pytest.mark.auth
    def test_get_current_user_unauthenticated(self, client):
        """Test getting current user without authentication"""
        response = client.get("/api/auth/me")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    @pytest.mark.auth
    def test_get_current_user_invalid_token(self, client):
        """Test getting current user with invalid token"""
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    @pytest.mark.auth
    def test_delete_current_user(self, client, test_user: User, auth_headers, db: Session):
        """Test soft-deleting current user account"""
        response = client.delete("/api/auth/me", headers=auth_headers)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Verify user is deactivated
        db.refresh(test_user)
        assert test_user.is_active == False
        assert "deleted_user" in test_user.email


class TestTokenRefresh:
    """Tests for token refresh endpoint"""
    
    @pytest.mark.auth
    def test_refresh_token_success(self, client, test_user: User):
        """Test successful token refresh"""
        # First login to get refresh token
        login_response = client.post(
            "/api/auth/login",
            data={
                "username": test_user.email,
                "password": "testpassword123",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        refresh_token = login_response.json()["refresh_token"]
        
        # Use refresh token
        response = client.post(
            "/api/auth/refresh",
            json={"refresh_token": refresh_token}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
    
    @pytest.mark.auth
    def test_refresh_token_invalid(self, client):
        """Test refresh with invalid token"""
        response = client.post(
            "/api/auth/refresh",
            json={"refresh_token": "invalid_refresh_token"}
        )
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_400_BAD_REQUEST]


class TestLogout:
    """Tests for logout endpoints"""
    
    @pytest.mark.auth
    def test_logout_success(self, client, test_user: User):
        """Test successful logout (single device)"""
        # Login first
        login_response = client.post(
            "/api/auth/login",
            data={
                "username": test_user.email,
                "password": "testpassword123",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        tokens = login_response.json()
        
        # Logout
        response = client.post(
            "/api/auth/logout",
            json={"refresh_token": tokens["refresh_token"]},
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        assert response.status_code == status.HTTP_200_OK
    
    @pytest.mark.auth
    def test_logout_all_devices(self, client, test_user: User):
        """Test logout from all devices"""
        # Login first
        login_response = client.post(
            "/api/auth/login",
            data={
                "username": test_user.email,
                "password": "testpassword123",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        tokens = login_response.json()
        
        # Logout all
        response = client.post(
            "/api/auth/logout-all",
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        assert response.status_code == status.HTTP_200_OK
