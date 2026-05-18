from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class DatasourceResponse(BaseModel):
    id: int
    name: str
    columns: List[str]
    row_count: int
    created_at: datetime

    class Config:
        from_attributes = True

class DatasourceUploadResponse(BaseModel):
    datasource_id: int
    name: str
    columns: List[str]
    row_count: int
    preview: List[dict]