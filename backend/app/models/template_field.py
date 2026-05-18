from sqlalchemy import Column, Integer, String, Text, BigInteger, DateTime, ForeignKey
from datetime import datetime, timezone, timedelta
from app.db.database import Base

# 北京时间 (UTC+8)
BEIJING_TZ = timezone(timedelta(hours=8))

def beijing_now():
    return datetime.now(BEIJING_TZ)

class TemplateField(Base):
    __tablename__ = "template_fields"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=False)
    field_name = Column(String(255), nullable=False)  # 字段名，如 "姓名"
    original_text = Column(String(500), nullable=False)  # 被替换的原文本
    placeholder = Column(String(255), nullable=False)  # 占位符，如 "{{姓名}}"
    # 格式设置
    font_name = Column(String(50), default='宋体')  # 字体
    font_size = Column(String(20), default='五号')  # 字号
    bold = Column(Integer, default=0)  # 加粗 0-否 1-是
    italic = Column(Integer, default=0)  # 斜体 0-否 1-是
    color = Column(String(20), default='#000000')  # 颜色
    alignment = Column(String(20), default='left')  # 对齐 left/center/right
    created_at = Column(DateTime, default=beijing_now)
