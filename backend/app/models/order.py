from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Text
from datetime import datetime, timezone, timedelta
from app.db.database import Base

# 北京时间 (UTC+8)
BEIJING_TZ = timezone(timedelta(hours=8))

def beijing_now():
    return datetime.now(BEIJING_TZ)

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    package_id = Column(Integer, ForeignKey("packages.id"), nullable=False)
    order_no = Column(String(64), unique=True, nullable=False)
    price = Column(Numeric(10, 2), default=0)
    payment_status = Column(String(20), default="pending")  # pending/paid/cancelled/refunded
    payment_method = Column(String(20), nullable=True)
    paid_at = Column(DateTime, nullable=True)
    wechat_transaction_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=beijing_now)
    updated_at = Column(DateTime, default=beijing_now, onupdate=beijing_now)
