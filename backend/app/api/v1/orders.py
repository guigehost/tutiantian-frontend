from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import uuid

from app.db.database import get_db
from app.models.user import User
from app.models.package import Package
from app.models.order import Order
from app.schemas.order import OrderCreate, OrderResponse
from app.api.v1.auth import get_current_user

router = APIRouter(prefix="/orders", tags=["订单"])

@router.post("/create", response_model=dict)
async def create_order(
    request: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 获取套餐
    package = db.query(Package).filter(
        Package.id == request.package_id,
        Package.status == "active"
    ).first()
    if not package:
        raise HTTPException(status_code=404, detail="套餐不存在")

    # 免费套餐直接发放
    if package.price == 0:
        current_user.balance += package.quota
        db.commit()
        return {
            "success": True,
            "message": f"恭喜获得 {package.quota} 次填充机会！",
            "balance": current_user.balance,
            "package_name": package.name
        }

    # 半自动支付模式：创建订单并返回收款信息
    order_no = f"WT{uuid.uuid4().hex[:12].upper()}"

    # 创建订单记录
    order = Order(
        order_no=order_no,
        user_id=current_user.id,
        package_id=package.id,
        price=package.price,
        payment_status="pending"
    )
    db.add(order)
    db.commit()

    # 返回收款码和订单信息
    return {
        "success": True,
        "order_no": order_no,
        "message": "请使用微信扫描下方收款码转账，转账时备注您的手机号或邮箱以便核实",
        "qr_code_url": "/assets/wechat_qr.png",  # 前端显示本地收款码图片
        "contact": {
            "wechat": "openclaw876",
            "email": "guige20231@outlook.com",
            "phone": "请备注手机号以便核实"
        },
        "package": {
            "name": package.name,
            "price": float(package.price),
            "quota": package.quota
        }
    }

@router.post("/wechat/callback")
async def wechat_callback(request: Request, db: Session = Depends(get_db)):
    """微信支付回调"""
    body = await request.body()
    # 实际应解析XML并验证签名
    # 这里简化处理
    return {"return_code": "SUCCESS", "return_msg": "OK"}

@router.get("/{order_no}", response_model=OrderResponse)
def get_order(
    order_no: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(
        Order.order_no == order_no,
        Order.user_id == current_user.id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")

    package = db.query(Package).filter(Package.id == order.package_id).first()

    return OrderResponse(
        id=order.id,
        order_no=order.order_no,
        package_name=package.name if package else "",
        price=float(order.price),
        payment_status=order.payment_status,
        created_at=order.created_at
    )

@router.get("", response_model=List[OrderResponse])
def list_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    orders = db.query(Order).filter(
        Order.user_id == current_user.id
    ).order_by(Order.created_at.desc()).limit(50).all()

    result = []
    for order in orders:
        package = db.query(Package).filter(Package.id == order.package_id).first()
        result.append(OrderResponse(
            id=order.id,
            order_no=order.order_no,
            package_name=package.name if package else "",
            price=float(order.price),
            payment_status=order.payment_status,
            created_at=order.created_at
        ))

    return result

@router.delete("/{order_no}")
def delete_order(
    order_no: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(
        Order.order_no == order_no,
        Order.user_id == current_user.id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")

    if order.payment_status == "paid":
        raise HTTPException(status_code=400, detail="已支付的订单无法删除")

    db.delete(order)
    db.commit()
    return {"message": "订单已删除"}

@router.post("/{order_no}/confirm")
def confirm_order(
    order_no: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """确认订单（充值到账）"""
    order = db.query(Order).filter(
        Order.order_no == order_no,
        Order.user_id == current_user.id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")

    if order.payment_status == "paid":
        raise HTTPException(status_code=400, detail="订单已完成")

    package = db.query(Package).filter(Package.id == order.package_id).first()
    if not package:
        raise HTTPException(status_code=404, detail="套餐不存在")

    # 记录变化前的余额
    balance_before = current_user.balance

    # 更新订单状态
    order.payment_status = "paid"

    # 将次数添加到已充值余额
    current_user.purchased_balance += package.quota
    current_user.balance += package.quota

    # 记录使用日志
    from app.models.usage_log import UsageLog
    log = UsageLog(
        user_id=current_user.id,
        action="purchase",
        change_amount=package.quota,
        balance_before=balance_before,
        balance_after=current_user.balance,
        description=f"购买{package.name}，获得{package.quota}次",
        related_order=order_no
    )
    db.add(log)

    db.commit()
    return {
        "success": True,
        "message": "充值成功",
        "balance": current_user.balance,
        "purchased_balance": current_user.purchased_balance
    }
