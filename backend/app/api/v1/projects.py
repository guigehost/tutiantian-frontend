from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from pathlib import Path

from app.db.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.template import Template
from app.models.datasource import Datasource
from app.schemas.project import (
    ProjectCreate, ProjectResponse, ProjectResponse,
    AutoMapRequest, AutoMapResponse, MappingItem
)
from app.api.v1.auth import get_current_user
from app.processors.word_processor import WordProcessor
from app.processors.excel_processor import ExcelProcessor

router = APIRouter(prefix="/projects", tags=["项目管理"])

def calculate_similarity(s1: str, s2: str) -> float:
    """计算两个字符串的相似度"""
    if not s1 or not s2:
        return 0.0
    s1, s2 = s1.lower(), s2.lower()
    if s1 == s2:
        return 1.0
    if s1 in s2 or s2 in s1:
        return 0.8
    # 简单的编辑距离
    len1, len2 = len(s1), len(s2)
    if len1 == 0 or len2 == 0:
        return 0.0
    # 简化：字符集合交集
    common = len(set(s1) & set(s2))
    return common / max(len(set(s1)), len(set(s2)))

@router.post("", response_model=ProjectResponse)
def create_project(
    project: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 验证模板和数据源
    template = db.query(Template).filter(
        Template.id == project.template_id,
        Template.user_id == current_user.id
    ).first()
    if not template:
        raise HTTPException(status_code=404, detail="模板不存在")

    datasource = db.query(Datasource).filter(
        Datasource.id == project.datasource_id,
        Datasource.user_id == current_user.id
    ).first()
    if not datasource:
        raise HTTPException(status_code=404, detail="数据源不存在")

    # 创建项目
    db_project = Project(
        user_id=current_user.id,
        template_id=project.template_id,
        datasource_id=project.datasource_id,
        name=project.name,
        mappings=[m.model_dump() for m in project.mappings]
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)

    return db_project

@router.get("", response_model=List[ProjectResponse])
def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Project).filter(
        Project.user_id == current_user.id,
        Project.status == "active"
    ).all()

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    return project

@router.post("/{project_id}/auto-map", response_model=AutoMapResponse)
def auto_map(
    project_id: int,
    request: AutoMapRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")

    template = db.query(Template).filter(Template.id == project.template_id).first()
    datasource = db.query(Datasource).filter(Datasource.id == project.datasource_id).first()

    placeholders = template.placeholders or []
    columns = datasource.columns or []

    mappings = []
    used_columns = set()

    for ph in placeholders:
        best_match = None
        best_score = 0

        for col in columns:
            if col in used_columns:
                continue
            score = calculate_similarity(ph, col)
            if score >= request.threshold and score > best_score:
                best_score = score
                best_match = col

        if best_match:
            mappings.append({
                "placeholder": f"{{{{{ph}}}}}",
                "column": best_match,
                "confidence": best_score
            })
            used_columns.add(best_match)

    unmapped_placeholders = [f"{{{{{ph}}}}}" for ph in placeholders if ph not in [m["placeholder"].strip("{}") for m in mappings]]
    unmapped_columns = [c for c in columns if c not in used_columns]

    return AutoMapResponse(
        mappings=mappings,
        unmapped_placeholders=unmapped_placeholders,
        unmapped_columns=unmapped_columns
    )

@router.put("/{project_id}/mappings")
def update_mappings(
    project_id: int,
    mappings: List[MappingItem],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")

    project.mappings = [m.model_dump() for m in mappings]
    db.commit()
    return {"message": "映射已更新"}

@router.post("/{project_id}/preview")
def preview_document(
    project_id: int,
    row_index: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """预览填充结果"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")

    template = db.query(Template).filter(Template.id == project.template_id).first()
    datasource = db.query(Datasource).filter(Datasource.id == project.datasource_id).first()

    # 读取Excel指定行
    excel_processor = ExcelProcessor(datasource.file_path)
    df = excel_processor.read_data()

    if row_index >= len(df):
        raise HTTPException(status_code=400, detail="行索引超出范围")

    row = df.iloc[row_index]

    # 构建填充数据
    data = {}
    for m in project.mappings:
        placeholder = m.get("placeholder", "").strip("{}")
        column = m.get("column", "")
        if placeholder and column and column in df.columns:
            data[placeholder] = row.get(column, "")

    # 生成预览文件
    preview_dir = Path(f"storage/previews/{current_user.id}")
    preview_dir.mkdir(parents=True, exist_ok=True)
    preview_path = preview_dir / f"preview_{project_id}.docx"

    word_processor = WordProcessor()
    word_processor.fill_and_save(template.file_path, data, str(preview_path))

    return FileResponse(
        path=str(preview_path),
        filename="preview.docx",
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )