from enum import Enum
from typing import Optional
from pydantic import BaseModel


class DocumentStatus(str, Enum):
    PROCESSING = "PROCESSING"
    READY = "READY"
    FAILED = "FAILED"


class Document(BaseModel):
    doc_id: str
    filename: str
    status: DocumentStatus
    page_count: Optional[int] = None
    error_message: Optional[str] = None

    class Config:
        use_enum_values = True
