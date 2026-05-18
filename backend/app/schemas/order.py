from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class OrderCreate(BaseModel):
    package_id: int
    payment_method: str = "wechat"

class OrderResponse(BaseModel):
    id: int
    order_no: str
    package_name: str
    price: float
    payment_status: str
    created_at: datetime

    class Config:
        from_attributes = True

class WechatPayResponse(BaseModel):
    order_no: str
    qr_code_url: str
    amount: float
    expire_minutes: int = 30
