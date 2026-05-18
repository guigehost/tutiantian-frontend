from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from datetime import datetime, timezone, timedelta
from app.db.database import Base

# 北京时间 (UTC+8)
BEIJING_TZ = timezone(timedelta(hours=8))

def beijing_now():
    return datetime.now(BEIJING_TZ)

class UsageLog(Base):
    __tablename__ = "usage_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(50), nullable=False)  # register_bonus/purchase/generate/refund
    change_amount = Column(Integer, default=0)  # 变化数量（正数增加，负数减少）
    balance_before = Column(Integer, default=0)  # 变化前余额
    balance_after = Column(Integer, default=0)  # 变化后余额
    description = Column(String(255), nullable=True)  # 描述信息
    related_order = Column(String(64), nullable=True)  # 关联订单号
    template_id = Column(Integer, nullable=True)
    task_id = Column(String(64), nullable=True)
    status = Column(String(20), default="success")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=beijing_now)
