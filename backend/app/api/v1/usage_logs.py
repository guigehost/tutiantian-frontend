from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from pydantic import BaseModel

from app.db.database import get_db
from app.models.user import User
from app.models.usage_log import UsageLog
from app.api.v1.auth import get_current_user

router = APIRouter(prefix="/usage-logs", tags=["使用记录"])


class UsageLogResponse(BaseModel):
    id: int
    action: str
    change_amount: int
    balance_before: int
    balance_after: int
    description: str | None
    related_order: str | None
    template_id: int | None
    task_id: str | None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("", response_model=List[UsageLogResponse])
def list_usage_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取用户的使用记录列表"""
    logs = db.query(UsageLog).filter(
        UsageLog.user_id == current_user.id
    ).order_by(UsageLog.created_at.desc()).limit(100).all()

    return logs
