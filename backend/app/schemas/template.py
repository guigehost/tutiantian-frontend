from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class TemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None

class TemplateResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    file_size: int
    placeholders: List[str]
    usage_count: int
    is_marked: int = 0
    created_at: datetime

    class Config:
        from_attributes = True

class TemplateUploadResponse(BaseModel):
    template_id: int
    name: str
    placeholders: List[dict]  # [{"name": "xxx", "type": "text"}]
    file_size: int