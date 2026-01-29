from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.package import Package
from app.schemas.package import PackageCreate, PackageUpdate, PackageResponse

router = APIRouter(prefix="/packages", tags=["packages"])


@router.post("/", response_model=PackageResponse, status_code=status.HTTP_201_CREATED)
def create_package(
    package_data: PackageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new package"""
    package = Package(**package_data.model_dump(), owner_id=current_user.id)
    db.add(package)
    db.commit()
    db.refresh(package)
    return package


@router.get("/", response_model=List[PackageResponse])
def get_packages(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all packages for current user"""
    packages = db.query(Package).filter(
        Package.owner_id == current_user.id
    ).offset(skip).limit(limit).all()
    return packages


@router.get("/{package_id}", response_model=PackageResponse)
def get_package(
    package_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific package"""
    package = db.query(Package).filter(
        Package.id == package_id,
        Package.owner_id == current_user.id
    ).first()
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Package not found"
        )
    return package


@router.put("/{package_id}", response_model=PackageResponse)
def update_package(
    package_id: int,
    package_data: PackageUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a package"""
    package = db.query(Package).filter(
        Package.id == package_id,
        Package.owner_id == current_user.id
    ).first()
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Package not found"
        )

    update_data = package_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(package, field, value)

    db.commit()
    db.refresh(package)
    return package


@router.delete("/{package_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_package(
    package_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a package"""
    package = db.query(Package).filter(
        Package.id == package_id,
        Package.owner_id == current_user.id
    ).first()
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Package not found"
        )
    db.delete(package)
    db.commit()
    return None
