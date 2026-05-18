from sqlalchemy import Column, Integer, String, Text, BigInteger, DateTime, ForeignKey, JSON
from datetime import datetime, timezone, timedelta
from app.db.database import Base

# 北京时间 (UTC+8)
BEIJING_TZ = timezone(timedelta(hours=8))

def beijing_now():
    return datetime.now(BEIJING_TZ)

class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    file_path = Column(String(500), nullable=False)  # 原始文件路径
    marked_file_path = Column(String(500), nullable=True)  # 标记后的文件路径
    file_size = Column(BigInteger, default=0)
    placeholders = Column(JSON, default=list)  # ["字段1", "字段2"]
    mappings = Column(JSON, default=dict)  # {"{{字段1}}": "Excel列1"}
    usage_count = Column(Integer, default=0)
    status = Column(String(20), default="active")
    is_marked = Column(Integer, default=0)  # 是否已标记 0=未标记 1=已标记
    created_at = Column(DateTime, default=beijing_now)
    updated_at = Column(DateTime, default=beijing_now, onupdate=beijing_now)