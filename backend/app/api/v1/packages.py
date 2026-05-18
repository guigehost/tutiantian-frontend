from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.package import Package
from app.schemas.package import PackageResponse

router = APIRouter(prefix="/packages", tags=["套餐"])

@router.get("", response_model=List[PackageResponse])
def list_packages(db: Session = Depends(get_db)):
    packages = db.query(Package).filter(
        Package.status == "active"
    ).order_by(Package.sort_order).all()
    return packages

@router.get("/{package_id}", response_model=PackageResponse)
def get_package(package_id: int, db: Session = Depends(get_db)):
    package = db.query(Package).filter(
        Package.id == package_id,
        Package.status == "active"
    ).first()
    if not package:
        raise HTTPException(status_code=404, detail="套餐不存在")
    return package
