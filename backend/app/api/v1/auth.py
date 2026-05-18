from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.core.security import verify_password, get_password_hash, create_access_token, decode_token
from app.core.logging import get_logger
import uuid
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

router = APIRouter(prefix="/auth", tags=["认证"])
logger = get_logger("auth")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# QQ邮箱SMTP配置
SMTP_HOST = "smtp.qq.com"
SMTP_PORT = 465
SMTP_USER = "3561867008@qq.com"
SMTP_PASSWORD = "suqvdmlliikacjdj"  # QQ邮箱授权码


def send_verification_email(to_email: str, verification_code: str):
    """发送验证邮件"""
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = 'TuTianTian Email Verification'

        body = f"""
您好！

感谢注册兔填填 Word模板填充服务。

您的邮箱验证码为：{verification_code}

请在验证页面输入此验证码完成注册。

如果您的账号无法使用，建议您配置真实邮箱服务后再使用。

--
兔填填 Word模板填充服务
        """
        msg.attach(MIMEText(body, 'plain', 'utf-8'))

        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)

        logger.info(f"Verification email sent to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send verification email to {to_email}: {e}")


@router.post("/register")
def register(user: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """注册用户，验证邮箱后赠送100次"""
    # Check if email already exists
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="邮箱已被注册")

    # 生成验证码
    verification_code = str(uuid.uuid4().hex[:6]).upper()

    # Create user - 初始balance=0，验证后赠送100
    db_user = User(
        email=user.email,
        password_hash=get_password_hash(user.password),
        nickname=user.nickname,
        balance=0,  # 验证邮箱后赠送100次
        email_verified=False,
        email_code=verification_code  # 存储验证码用于验证
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # 后台发送验证邮件
    background_tasks.add_task(send_verification_email, user.email, verification_code)

    logger.info(f"User registered: {user.email}, verification code: {verification_code}")

    return {
        "message": "注册成功，请查收验证码邮件完成验证",
        "email": user.email,
        "need_verify": True
    }


@router.post("/verify-email")
def verify_email(email: str, code: str, db: Session = Depends(get_db)):
    """验证邮箱验证码"""
    user = db.query(User).filter(
        User.email == email,
        User.email_code == code
    ).first()
    if not user:
        raise HTTPException(status_code=400, detail="无效的验证码")

    if user.email_verified:
        raise HTTPException(status_code=400, detail="邮箱已验证")

    # 验证成功，赠送100次
    balance_before = user.balance
    user.email_verified = True
    user.email_code = None
    user.balance = 100  # 赠送100次免费使用

    # 记录使用日志
    from app.models.usage_log import UsageLog
    log = UsageLog(
        user_id=user.id,
        action="register_bonus",
        change_amount=100,
        balance_before=balance_before,
        balance_after=user.balance,
        description="注册赠送100次免费使用"
    )
    db.add(log)

    db.commit()

    logger.info(f"Email verified for user: {user.email}, 100 uses credited")

    return {
        "message": "邮箱验证成功，已赠送100次免费使用",
        "balance": user.balance
    }


@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="邮箱或密码错误")

    access_token = create_access_token(data={"sub": str(db_user.id)})
    logger.info(f"User logged in: {user.email}")
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "email_verified": db_user.email_verified
    }


@router.post("/resend-verification")
def resend_verification(
    email: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """重新发送验证邮件"""
    db_user = db.query(User).filter(User.email == email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="用户不存在")

    if db_user.email_verified:
        raise HTTPException(status_code=400, detail="邮箱已验证")

    verification_code = str(uuid.uuid4().hex[:6]).upper()
    db_user.email_code = verification_code
    db.commit()

    background_tasks.add_task(send_verification_email, db_user.email, verification_code)
    logger.info(f"Resent verification code to {email}: {verification_code}")

    return {"message": "验证码已发送", "email": email}

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = decode_token(token)
        user_id = int(payload.get("sub"))
    except Exception as e:
        logger.warning(f"Token decode failed: {e}")
        raise HTTPException(status_code=401, detail="无效的Token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user
