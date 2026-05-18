from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone, timedelta
from app.db.database import Base

# 北京时间 (UTC+8)
BEIJING_TZ = timezone(timedelta(hours=8))

def beijing_now():
    return datetime.now(BEIJING_TZ)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    nickname = Column(String(100))
    role = Column(String(20), default="user")
    balance = Column(Integer, default=100)  # 总可用次数
    purchased_balance = Column(Integer, default=0)  # 已充值次数
    total_usage = Column(Integer, default=0)  # 历史总使用次数
    status = Column(String(20), default="active")
    is_new_user = Column(Boolean, default=True)
    registered_at = Column(DateTime, default=beijing_now)
    email_verified = Column(Boolean, default=False)
    email_code = Column(String(20), nullable=True)  # 邮箱验证码
