from sqlalchemy.orm import Session
from app.models.usage_log import UsageLog
from app.models.user import User


def create_usage_log(
    db: Session,
    user: User,
    action: str,
    change_amount: int,
    description: str = None,
    related_order: str = None,
    template_id: int = None,
    task_id: str = None,
    status: str = "success",
    error_message: str = None
) -> UsageLog:
    """
    创建使用记录
    action: register_bonus/purchase/generate/refund
    change_amount: 正数表示增加，负数表示减少
    """
    log = UsageLog(
        user_id=user.id,
        action=action,
        change_amount=change_amount,
        balance_before=user.balance - change_amount,  # 变化前的余额
        balance_after=user.balance,  # 变化后的余额（假设立即更新）
        description=description,
        related_order=related_order,
        template_id=template_id,
        task_id=task_id,
        status=status,
        error_message=error_message
    )
    db.add(log)
    return log
