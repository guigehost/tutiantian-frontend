from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PackageResponse(BaseModel):
    id: int
    name: str
    billing_type: str
    quota: int
    price: float
    period_days: Optional[int]
    max_templates: int
    max_file_size: int
    is_featured: bool

    class Config:
        from_attributes = True
