from sqlalchemy import Column, Integer, String, Numeric, DateTime, Boolean
from datetime import datetime, timezone, timedelta
from app.db.database import Base

# 北京时间 (UTC+8)
BEIJING_TZ = timezone(timedelta(hours=8))

def beijing_now():
    return datetime.now(BEIJING_TZ)

class Package(Base):
    __tablename__ = "packages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    billing_type = Column(String(20), default="quota")  # quota(按次)/subscription(订阅)
    quota = Column(Integer, default=0)  # 0=无限次
    price = Column(Numeric(10, 2), default=0)
    period_days = Column(Integer, nullable=True)  # 30=月
    max_templates = Column(Integer, default=10)
    max_file_size = Column(Integer, default=10485760)  # 10MB
    is_featured = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=beijing_now)
