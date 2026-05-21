from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import zipfile
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path

from app.db.database import get_db
from app.models.user import User
from app.models.task import Task
from app.models.project import Project
from app.models.template import Template
from app.models.datasource import Datasource
from app.models.template_field import TemplateField
from app.schemas.task import GenerateRequest, TaskResponse
from app.api.v1.auth import get_current_user
from app.processors.word_processor import WordProcessor
from app.processors.excel_processor import ExcelProcessor
from app.core.logging import get_logger

router = APIRouter(prefix="/tasks", tags=["任务管理"])
logger = get_logger("tasks")

@router.post("/{project_id}/generate")
async def generate_documents(
    project_id: int,
    request: GenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 验证项目和用户余额
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")

    # 获取模板和数据源
    template = db.query(Template).filter(Template.id == project.template_id).first()
    datasource = db.query(Datasource).filter(Datasource.id == project.datasource_id).first()

    # 读取Excel数据
    excel_processor = ExcelProcessor(datasource.file_path)
    df = excel_processor.read_data()
    total = len(df)

    # 创建任务记录（余额检查已由前端通过 guige.host API 完成）
    task_no = f"task_{uuid.uuid4().hex[:12]}"
    task = Task(
        user_id=current_user.id,
        project_id=project_id,
        task_no=task_no,
        total=total,
        status="processing"
    )
    db.add(task)
    db.commit()

    # 创建输出目录
    output_dir = Path(f"storage/outputs/{current_user.id}/{task_no}")
    output_dir.mkdir(parents=True, exist_ok=True)

    # 构建映射字典
    mappings = {}
    for m in project.mappings:
        placeholder = m.get("placeholder", "")
        column = m.get("column", "")
        if placeholder and column:
            mappings[placeholder] = column

    # 获取字段格式设置
    field_formats = {}
    fields = db.query(TemplateField).filter(TemplateField.template_id == template.id).all()
    for f in fields:
        field_formats[f.field_name] = {
            "font_name": f.font_name,
            "font_size": f.font_size,
            "bold": f.bold,
            "italic": f.italic,
            "color": f.color,
            "alignment": f.alignment
        }

    # 处理每行数据
    word_processor = WordProcessor()
    completed = 0
    failed = 0
    success_count = 0

    for idx, row in df.iterrows():
        try:
            # 构建填充数据
            data = {}
            for ph, col in mappings.items():
                field_name = ph.strip("{}")
                if field_name in df.columns:
                    data[field_name] = row.get(col, "")

            # 生成文件名
            filename = request.filename_pattern.format(index=idx + 1) + ".docx"
            output_path = output_dir / filename

            # 填充并保存（优先使用标记后的模板，传递格式设置）
            template_path = template.marked_file_path or template.file_path
            logger.debug(f"[{task_no}] data keys={list(data.keys())}, field_formats keys={list(field_formats.keys())}")
            word_processor.fill_and_save(template_path, data, str(output_path), field_formats)
            completed += 1
            success_count += 1
        except Exception as e:
            failed += 1
            logger.error(f"[{task_no}] 生成第{idx}行失败: {e}")

    # 打包成ZIP
    try:
        zip_path = output_dir.parent / f"{task_no}.zip"
        with zipfile.ZipFile(str(zip_path), 'w') as zf:
            for f in output_dir.glob("*.docx"):
                zf.write(f, f.name)
    except Exception as e:
        logger.error(f"[{task_no}] 打包ZIP失败: {e}")
        task.status = "failed"
        task.completed = completed
        task.failed = failed
        db.commit()
        return {
            "task_id": task_no,
            "status": "failed",
            "total": total,
            "completed": completed,
            "failed": failed,
            "error": "打包文件失败"
        }

    # 更新任务状态
    task.status = "completed"
    task.completed = completed
    task.failed = failed
    task.output_path = str(zip_path)
    task.completed_at = datetime.now(timezone(timedelta(hours=8)))

    # 更新模板使用统计（余额已由前端通过 guige.host API 扣除）
    template.usage_count += completed
    db.commit()

    return {
        "task_id": task_no,
        "status": "completed",
        "total": total,
        "completed": completed,
        "failed": failed,
        "download_url": f"/api/v1/tasks/{task_no}/download"
    }

@router.get("/{task_id}")
def get_task_status(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(
        Task.task_no == task_id,
        Task.user_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    return TaskResponse(
        id=task.id,
        task_id=task.task_no,
        status=task.status,
        progress=int((task.completed / task.total * 100) if task.total > 0 else 0),
        total=task.total,
        completed=task.completed,
        failed=task.failed,
        created_at=task.created_at
    )

@router.get("/{task_id}/download")
def download_result(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(
        Task.task_no == task_id,
        Task.user_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    if task.status != "completed" or not task.output_path:
        raise HTTPException(status_code=400, detail="任务未完成")

    return FileResponse(
        path=task.output_path,
        filename=f"results_{task_id}.zip",
        media_type="application/zip"
    )

@router.get("", response_model=List[TaskResponse])
def list_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tasks = db.query(Task).filter(
        Task.user_id == current_user.id
    ).order_by(Task.created_at.desc()).limit(50).all()

    return [
        TaskResponse(
            id=t.id,
            task_id=t.task_no,
            status=t.status,
            progress=int((t.completed / t.total * 100) if t.total > 0 else 0),
            total=t.total,
            completed=t.completed,
            failed=t.failed,
            created_at=t.created_at
        )
        for t in tasks
    ]