from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class MappingItem(BaseModel):
    placeholder: str
    column: str
    type: str = "text"

class ProjectCreate(BaseModel):
    name: str
    template_id: int
    datasource_id: int
    mappings: List[MappingItem] = []

class ProjectResponse(BaseModel):
    id: int
    name: str
    template_id: int
    datasource_id: int
    mappings: List[MappingItem]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class AutoMapRequest(BaseModel):
    threshold: float = 0.6

class AutoMapResponse(BaseModel):
    mappings: List[dict]  # [{"placeholder": "{{xxx}}", "column": "xxx", "confidence": 0.95}]
    unmapped_placeholders: List[str]
    unmapped_columns: List[str]