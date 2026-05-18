from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import verify_password, get_password_hash, create_access_token
from datetime import timedelta
from typing import Optional

class AuthService:
    @staticmethod
    def register_user(db: Session, email: str, password: str, nickname: Optional[str] = None) -> User:
        """Register a new user"""
        user = User(
            email=email,
            password_hash=get_password_hash(password),
            nickname=nickname or email.split("@")[0],
            balance=100  # Registration bonus (100次免费使用)
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        """Authenticate user by email and password"""
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user

    @staticmethod
    def create_token(user_id: int) -> str:
        """Create access token for user"""
        return create_access_token(data={"sub": str(user_id)})

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Get user by email"""
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return db.query(User).filter(User.id == user_id).first()
