from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class GenerateRequest(BaseModel):
    row_start: int = 0
    row_end: Optional[int] = None
    filename_pattern: str = "{index}"

class TaskResponse(BaseModel):
    id: int
    task_id: str
    status: str
    progress: int
    total: int
    completed: int
    failed: int
    created_at: datetime

    class Config:
        from_attributes = True