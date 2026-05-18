from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.user import User
from app.models.datasource import Datasource
from app.schemas.datasource import DatasourceResponse, DatasourceUploadResponse
from app.api.v1.auth import get_current_user
from app.processors.excel_processor import ExcelProcessor
import shutil
import uuid
from pathlib import Path

router = APIRouter(prefix="/datasources", tags=["数据源"])

@router.post("/upload", response_model=DatasourceUploadResponse)
async def upload_datasource(
    file: UploadFile = File(...),
    name: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 验证文件格式
    allowed = ['.xlsx', '.xls', '.csv']
    ext = '.' + file.filename.split('.')[-1]
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"只支持{allowed}格式")

    # 保存文件
    file_id = str(uuid.uuid4())
    upload_dir = Path(f"storage/datasources/{current_user.id}")
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / f"{file_id}{ext}"

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # 解析Excel
    processor = ExcelProcessor(str(file_path))
    columns = processor.read_headers()
    row_count = processor.get_row_count()
    preview = processor.get_data_preview(5)

    # 创建记录
    datasource = Datasource(
        user_id=current_user.id,
        name=name,
        file_path=str(file_path),
        file_size=file_path.stat().st_size,
        columns=columns,
        row_count=row_count
    )
    db.add(datasource)
    db.commit()
    db.refresh(datasource)

    return DatasourceUploadResponse(
        datasource_id=datasource.id,
        name=datasource.name,
        columns=columns,
        row_count=row_count,
        preview=preview
    )

@router.get("", response_model=List[DatasourceResponse])
def list_datasources(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Datasource).filter(
        Datasource.user_id == current_user.id,
        Datasource.status == "active"
    ).all()

@router.get("/{datasource_id}")
def get_datasource(
    datasource_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ds = db.query(Datasource).filter(
        Datasource.id == datasource_id,
        Datasource.user_id == current_user.id,
        Datasource.status == "active"
    ).first()
    if not ds:
        raise HTTPException(status_code=404, detail="数据源不存在")

    # 获取预览数据
    processor = ExcelProcessor(ds.file_path)
    preview = processor.get_data_preview(5)

    return {
        "id": ds.id,
        "name": ds.name,
        "columns": ds.columns,
        "row_count": ds.row_count,
        "preview": preview,
        "created_at": ds.created_at
    }

@router.delete("/{datasource_id}")
def delete_datasource(
    datasource_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ds = db.query(Datasource).filter(
        Datasource.id == datasource_id,
        Datasource.user_id == current_user.id
    ).first()
    if not ds:
        raise HTTPException(status_code=404, detail="数据源不存在")

    ds.status = "deleted"
    db.commit()
    return {"message": "删除成功"}