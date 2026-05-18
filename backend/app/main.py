from contextlib import asynccontextmanager
from datetime import datetime, timezone, timedelta
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import api_router as v1_router
from app.core.config import get_settings
from app.db.database import init_db, SessionLocal
from app.models.task import Task

settings = get_settings()


def check_stale_tasks():
    """将超时的processing任务标记为failed"""
    db = SessionLocal()
    try:
        beijing_tz = timezone(timedelta(hours=8))
        timeout = datetime.now(beijing_tz) - timedelta(minutes=10)
        stale_tasks = db.query(Task).filter(
            Task.status == "processing",
            Task.created_at < timeout
        ).all()
        for task in stale_tasks:
            task.status = "failed"
            task.failed = task.total
        db.commit()
        if stale_tasks:
            print(f"[Startup] Marked {len(stale_tasks)} stale tasks as failed")
    except Exception as e:
        print(f"[Startup] Error checking stale tasks: {e}")
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    check_stale_tasks()
    yield
    # Shutdown


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS configuration - allow frontend development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(v1_router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "Welcome to WordTemplateFiller API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
