from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.user import User
from app.models.template import Template
from app.models.template_field import TemplateField
from app.schemas.template import TemplateResponse, TemplateUploadResponse
from app.api.v1.auth import get_current_user
from app.processors.word_processor import WordProcessor
from app.processors.placeholder_engine import PlaceholderEngine
import shutil
import uuid
from pathlib import Path

router = APIRouter(prefix="/templates", tags=["模板管理"])

word_processor = WordProcessor()
placeholder_engine = PlaceholderEngine()

@router.post("/upload", response_model=TemplateUploadResponse)
async def upload_template(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: str = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 验证文件
    if not file.filename.endswith('.docx'):
        raise HTTPException(status_code=400, detail="只支持.docx格式")

    # 保存文件
    file_id = str(uuid.uuid4())
    upload_dir = Path(f"storage/templates/{current_user.id}")
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / f"{file_id}.docx"

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # 提取占位符
    placeholders = word_processor.extract_placeholders(str(file_path))

    # 创建模板记录
    template = Template(
        user_id=current_user.id,
        name=name,
        description=description,
        file_path=str(file_path),
        file_size=file_path.stat().st_size,
        placeholders=placeholders
    )
    db.add(template)
    db.commit()
    db.refresh(template)

    return TemplateUploadResponse(
        template_id=template.id,
        name=template.name,
        placeholders=[{"name": p, "type": "text"} for p in placeholders],
        file_size=template.file_size
    )

@router.get("", response_model=List[TemplateResponse])
def list_templates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    templates = db.query(Template).filter(
        Template.user_id == current_user.id,
        Template.status == "active"
    ).all()
    return templates

@router.get("/marked")
def list_marked_templates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取已标记的模板列表（用于创建任务）"""
    templates = db.query(Template).filter(
        Template.user_id == current_user.id,
        Template.status == "active",
        Template.is_marked == 1
    ).all()
    return [
        {
            "id": t.id,
            "name": t.name,
            "placeholders": t.placeholders or [],
            "marked_file_path": t.marked_file_path
        }
        for t in templates
    ]

# 注意：自定义路由必须放在 /{template_id} 之前，否则会被当作 template_id 解析
@router.post("/mark-field")
async def mark_field(
    template_id: int = Form(...),
    original_text: str = Form(...),
    field_name: str = Form(...),
    font_name: str = Form("宋体"),
    font_size: str = Form("五号"),
    bold: int = Form(0),
    italic: int = Form(0),
    color: str = Form("#000000"),
    alignment: str = Form("left"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """标记字段：将文档中的原文本替换为占位符"""
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.user_id == current_user.id
    ).first()
    if not template:
        raise HTTPException(status_code=404, detail="模板不存在")

    placeholder = "{{" + field_name + "}}"

    # 创建带标记的副本文件路径
    marked_path = template.file_path.replace(".docx", "_marked.docx")

    # 如果已存在标记文件，从标记文件读取；否则从原始文件读取
    source_path = marked_path if Path(marked_path).exists() else template.file_path

    # 调用占位符引擎替换文本
    success = placeholder_engine.mark_field(
        source_path,
        original_text,
        field_name,
        marked_path
    )

    if not success:
        raise HTTPException(status_code=400, detail="未找到要替换的文本或替换失败")

    # 保存字段记录（包含格式设置）
    field_record = TemplateField(
        template_id=template_id,
        field_name=field_name,
        original_text=original_text,
        placeholder=placeholder,
        font_name=font_name,
        font_size=font_size,
        bold=bold,
        italic=italic,
        color=color,
        alignment=alignment
    )
    db.add(field_record)

    # 更新模板的占位符列表
    placeholders = template.placeholders or []
    if field_name not in placeholders:
        placeholders.append(field_name)
    template.placeholders = placeholders

    # 标记模板为已标记状态（添加第一个字段时自动标记）
    if template.is_marked != 1:
        template.is_marked = 1

    db.commit()

    return {
        "success": True,
        "field_name": field_name,
        "placeholder": placeholder,
        "marked_file": marked_path
    }

@router.post("/insert-field")
async def insert_field(
    template_id: int = Form(...),
    field_name: str = Form(...),
    position: str = Form("end"),
    table_index: Optional[int] = Form(None),
    row: Optional[int] = Form(None),
    col: Optional[int] = Form(None),
    font_name: str = Form("宋体"),
    font_size: str = Form("五号"),
    bold: int = Form(0),
    italic: int = Form(0),
    color: str = Form("#000000"),
    alignment: str = Form("left"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """在空白区域或指定表格单元格中插入占位符字段"""
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.user_id == current_user.id
    ).first()
    if not template:
        raise HTTPException(status_code=404, detail="模板不存在")

    placeholder = "{{" + field_name + "}}"

    # 创建带标记的副本文件路径
    marked_path = template.file_path.replace(".docx", "_marked.docx")

    # 如果已存在标记文件，从标记文件读取；否则从原始文件读取
    source_path = marked_path if Path(marked_path).exists() else template.file_path

    # 调用占位符引擎插入占位符
    success = placeholder_engine.insert_field(
        source_path,
        field_name,
        marked_path,
        position,
        table_index,
        row,
        col
    )

    if not success:
        raise HTTPException(status_code=400, detail="插入失败")

    # 保存字段记录（包含格式设置）
    field_record = TemplateField(
        template_id=template_id,
        field_name=field_name,
        original_text="[插入占位符]",
        placeholder=placeholder,
        font_name=font_name,
        font_size=font_size,
        bold=bold,
        italic=italic,
        color=color,
        alignment=alignment
    )
    db.add(field_record)

    # 更新模板的占位符列表
    placeholders = template.placeholders or []
    if field_name not in placeholders:
        placeholders.append(field_name)
    template.placeholders = placeholders

    # 标记模板为已标记状态（添加第一个字段时自动标记）
    if template.is_marked != 1:
        template.is_marked = 1

    db.commit()

    return {
        "success": True,
        "field_name": field_name,
        "placeholder": placeholder,
        "marked_file": marked_path
    }

@router.get("/fields/{template_id}")
def get_template_fields(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取模板的所有标记字段"""
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.user_id == current_user.id
    ).first()
    if not template:
        raise HTTPException(status_code=404, detail="模板不存在")

    fields = db.query(TemplateField).filter(
        TemplateField.template_id == template_id
    ).all()

    return [
        {
            "id": f.id,
            "field_name": f.field_name,
            "original_text": f.original_text,
            "placeholder": f.placeholder,
            "font_name": f.font_name,
            "font_size": f.font_size,
            "bold": f.bold,
            "italic": f.italic,
            "color": f.color,
            "alignment": f.alignment
        }
        for f in fields
    ]

@router.delete("/fields/{field_id}")
def delete_template_field(
    field_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除模板的指定字段"""
    field = db.query(TemplateField).filter(
        TemplateField.id == field_id
    ).first()
    if not field:
        raise HTTPException(status_code=404, detail="字段不存在")

    # 验证权限 - 获取字段所属的模板
    template = db.query(Template).filter(
        Template.id == field.template_id,
        Template.user_id == current_user.id
    ).first()
    if not template:
        raise HTTPException(status_code=403, detail="无权删除此字段")

    # 删除字段记录
    db.delete(field)

    # 更新模板的占位符列表
    placeholders = template.placeholders or []
    if field.field_name in placeholders:
        placeholders.remove(field.field_name)
    template.placeholders = placeholders

    db.commit()
    return {"message": "删除成功"}

@router.post("/save-template")
async def save_template(
    template_id: int,
    template_name: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """保存标记后的模板并生成CSV"""
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.user_id == current_user.id
    ).first()
    if not template:
        raise HTTPException(status_code=404, detail="模板不存在")

    # 获取所有标记字段
    fields = db.query(TemplateField).filter(
        TemplateField.template_id == template_id
    ).all()

    if not fields:
        raise HTTPException(status_code=400, detail="请先标记至少一个字段")

    # 获取带标记的docx路径
    marked_docx = template.file_path.replace(".docx", "_marked.docx")
    if not Path(marked_docx).exists():
        raise HTTPException(status_code=400, detail="未找到标记后的文档，请先添加字段")

    # 如果提供了新名称，更新模板名称
    if template_name:
        template.name = template_name

    # 复制标记后的文件到永久存储位置
    final_marked_path = marked_docx.replace(".docx", f"_v{template_id}.docx")
    shutil.copy(marked_docx, final_marked_path)

    # 更新模板记录
    template.marked_file_path = final_marked_path
    template.is_marked = 1
    template.placeholders = [f.field_name for f in fields]
    template.mappings = {f"{{{{ {f.field_name} }}}}": f.field_name for f in fields}

    # 生成CSV内容
    header = ",".join([f.field_name for f in fields])
    sample_row = ",".join([f'"${f.original_text}"' for f in fields])
    csv_content = "﻿" + header + "\n" + sample_row + "\n"  # BOM for UTF-8

    # 保存CSV文件
    csv_path = final_marked_path.replace(".docx", "_填充模板.csv")
    with open(csv_path, "w", encoding="utf-8-sig") as f:
        f.write(csv_content)

    db.commit()

    return {
        "template_id": template_id,
        "template_name": template.name,
        "csv_file": csv_path,
        "fields_count": len(fields),
        "placeholders": [f.field_name for f in fields]
    }

@router.get("/{template_id}", response_model=TemplateResponse)
def get_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.user_id == current_user.id
    ).first()
    if not template:
        raise HTTPException(status_code=404, detail="模板不存在")
    return template

@router.delete("/{template_id}")
def delete_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.user_id == current_user.id
    ).first()
    if not template:
        raise HTTPException(status_code=404, detail="模板不存在")

    template.status = "deleted"
    db.commit()
    return {"message": "删除成功"}

@router.get("/download/{template_id}")
async def download_marked_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """下载标记后的模板文件"""
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.user_id == current_user.id
    ).first()
    if not template:
        raise HTTPException(status_code=404, detail="模板不存在")

    # 优先使用带标记的版本
    marked_path = template.file_path.replace(".docx", "_marked.docx")
    if Path(marked_path).exists():
        file_path = marked_path
    else:
        file_path = template.file_path

    return FileResponse(
        file_path,
        filename=f"{template.name}_模板.docx",
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )