from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from app.models.user import User
    from app.models.task import Task
    from app.models.project import Project
    from app.models.template import Template
    from app.models.template_field import TemplateField
    from app.models.datasource import Datasource
    Base.metadata.create_all(bind=engine)
    # 初始化套餐数据
    from app.db.init_data import init_packages
    init_packages()
