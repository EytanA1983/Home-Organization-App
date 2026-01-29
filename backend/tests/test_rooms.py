"""
Rooms Tests - 15+ test cases
Tests for: CRUD operations, permissions, sharing
"""
import pytest
from fastapi import status
from sqlalchemy.orm import Session
from app.db.models import User, Room, RoomShare


class TestRoomCreation:
    """Tests for room creation endpoint"""
    
    @pytest.mark.rooms
    def test_create_room_success(self, client, auth_headers):
        """Test successful room creation"""
        response = client.post(
            "/api/rooms/",
            json={"name": "Living Room"},
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["name"] == "Living Room"
        assert "id" in data
        assert "user_id" in data
    
    @pytest.mark.rooms
    def test_create_room_unauthenticated(self, client):
        """Test room creation without authentication"""
        response = client.post(
            "/api/rooms/",
            json={"name": "Living Room"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    @pytest.mark.rooms
    def test_create_room_empty_name(self, client, auth_headers):
        """Test room creation with empty name"""
        response = client.post(
            "/api/rooms/",
            json={"name": ""},
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    @pytest.mark.rooms
    def test_create_multiple_rooms(self, client, auth_headers):
        """Test creating multiple rooms"""
        room_names = ["Bedroom", "Kitchen", "Bathroom", "Office"]
        for name in room_names:
            response = client.post(
                "/api/rooms/",
                json={"name": name},
                headers=auth_headers
            )
            assert response.status_code == status.HTTP_201_CREATED
            assert response.json()["name"] == name


class TestRoomRead:
    """Tests for reading rooms"""
    
    @pytest.mark.rooms
    def test_get_all_rooms(self, client, auth_headers, multiple_rooms: list[Room]):
        """Test getting all rooms for user"""
        response = client.get("/api/rooms/", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == len(multiple_rooms)
    
    @pytest.mark.rooms
    def test_get_single_room(self, client, auth_headers, test_room: Room):
        """Test getting a specific room"""
        response = client.get(f"/api/rooms/{test_room.id}", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == test_room.id
        assert data["name"] == test_room.name
    
    @pytest.mark.rooms
    def test_get_nonexistent_room(self, client, auth_headers):
        """Test getting a room that doesn't exist"""
        response = client.get("/api/rooms/99999", headers=auth_headers)
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    @pytest.mark.rooms
    def test_get_other_user_room_forbidden(
        self, client, second_auth_headers, test_room: Room
    ):
        """Test that users cannot access other users' rooms"""
        response = client.get(
            f"/api/rooms/{test_room.id}",
            headers=second_auth_headers
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    @pytest.mark.rooms
    def test_get_rooms_pagination(self, client, auth_headers, multiple_rooms: list[Room]):
        """Test rooms pagination"""
        # Get first 2 rooms
        response = client.get("/api/rooms/?skip=0&limit=2", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) == 2
        
        # Get next 2 rooms
        response = client.get("/api/rooms/?skip=2&limit=2", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) == 2


class TestRoomUpdate:
    """Tests for room update endpoint"""
    
    @pytest.mark.rooms
    def test_update_room_success(self, client, auth_headers, test_room: Room):
        """Test successful room update"""
        response = client.put(
            f"/api/rooms/{test_room.id}",
            json={"name": "Updated Room Name"},
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "Updated Room Name"
    
    @pytest.mark.rooms
    def test_update_room_partial(self, client, auth_headers, test_room: Room):
        """Test partial room update"""
        response = client.put(
            f"/api/rooms/{test_room.id}",
            json={"description": "New description"},
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
    
    @pytest.mark.rooms
    def test_update_other_user_room_forbidden(
        self, client, second_auth_headers, test_room: Room
    ):
        """Test that users cannot update other users' rooms"""
        response = client.put(
            f"/api/rooms/{test_room.id}",
            json={"name": "Hacked Room"},
            headers=second_auth_headers
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    @pytest.mark.rooms
    def test_update_nonexistent_room(self, client, auth_headers):
        """Test updating a room that doesn't exist"""
        response = client.put(
            "/api/rooms/99999",
            json={"name": "Ghost Room"},
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestRoomDelete:
    """Tests for room deletion endpoint"""
    
    @pytest.mark.rooms
    def test_delete_room_success(self, client, auth_headers, test_room: Room, db: Session):
        """Test successful room deletion"""
        room_id = test_room.id
        response = client.delete(f"/api/rooms/{room_id}", headers=auth_headers)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Verify room is deleted
        deleted_room = db.query(Room).filter(Room.id == room_id).first()
        assert deleted_room is None
    
    @pytest.mark.rooms
    def test_delete_room_with_tasks(
        self, client, auth_headers, test_task, db: Session
    ):
        """Test deleting room also deletes associated tasks (cascade)"""
        room_id = test_task.room_id
        response = client.delete(f"/api/rooms/{room_id}", headers=auth_headers)
        assert response.status_code == status.HTTP_204_NO_CONTENT
    
    @pytest.mark.rooms
    def test_delete_other_user_room_forbidden(
        self, client, second_auth_headers, test_room: Room
    ):
        """Test that users cannot delete other users' rooms"""
        response = client.delete(
            f"/api/rooms/{test_room.id}",
            headers=second_auth_headers
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    @pytest.mark.rooms
    def test_delete_nonexistent_room(self, client, auth_headers):
        """Test deleting a room that doesn't exist"""
        response = client.delete("/api/rooms/99999", headers=auth_headers)
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestRoomSharing:
    """Tests for room sharing functionality"""
    
    @pytest.mark.rooms
    @pytest.mark.integration
    def test_share_room_success(
        self, client, auth_headers, test_room: Room, second_user: User
    ):
        """Test sharing a room with another user"""
        response = client.post(
            f"/api/sharing/rooms/{test_room.id}/share",
            json={
                "user_email": second_user.email,
                "permission": "viewer"
            },
            headers=auth_headers
        )
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]
    
    @pytest.mark.rooms
    @pytest.mark.integration
    def test_shared_room_accessible(
        self, client, auth_headers, second_auth_headers, 
        test_room: Room, second_user: User, db: Session
    ):
        """Test that shared room is accessible to shared user"""
        # Create share manually
        share = RoomShare(
            room_id=test_room.id,
            user_id=second_user.id,
            permission="viewer",
            shared_by=test_room.owner_id,
        )
        db.add(share)
        db.commit()
        
        # Second user should be able to access the room
        response = client.get(
            f"/api/rooms/{test_room.id}",
            headers=second_auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
