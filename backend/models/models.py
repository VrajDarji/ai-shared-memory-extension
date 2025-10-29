# backend/types/models.py
"""
Pydantic models for SabkiSoch API request/response validation
"""

from pydantic import BaseModel, field_validator
from typing import Optional
from constants import (
    MAX_USER_ID_LENGTH,
    MAX_TEXT_LENGTH,
    MAX_SOURCE_LENGTH,
    MAX_URL_LENGTH
)


class StoreRequest(BaseModel):
    """Request model for storing conversation data"""
    user_id: str
    source: str = "unknown"
    text: str
    url: str | None = None
    
    @field_validator('user_id')
    @classmethod
    def validate_user_id(cls, v):
        if not v or not v.strip():
            raise ValueError('user_id cannot be empty')
        if len(v) > MAX_USER_ID_LENGTH:
            raise ValueError(f'user_id too long (max {MAX_USER_ID_LENGTH} characters)')
        return v.strip()
    
    @field_validator('text')
    @classmethod
    def validate_text(cls, v):
        if not v or not v.strip():
            raise ValueError('text cannot be empty')
        v = v.strip()
        # Truncate text if it exceeds the limit instead of throwing error
        if len(v) > MAX_TEXT_LENGTH:
            v = v[:MAX_TEXT_LENGTH]
            print(f"Warning: Text truncated to {MAX_TEXT_LENGTH} characters")
        return v
    
    @field_validator('source')
    @classmethod
    def validate_source(cls, v):
        if not v or not v.strip():
            return "unknown"
        if len(v) > MAX_SOURCE_LENGTH:
            raise ValueError(f'source too long (max {MAX_SOURCE_LENGTH} characters)')
        return v.strip()
    
    @field_validator('url')
    @classmethod
    def validate_url(cls, v):
        if v is None:
            return v
        if not v.strip():
            return None
        if len(v) > MAX_URL_LENGTH:
            raise ValueError(f'url too long (max {MAX_URL_LENGTH} characters)')
        return v.strip()


class ContextRequest(BaseModel):
    """Request model for generating context from conversations"""
    user_id: str
    max_length: Optional[int] = 2000  # Max length for generated context
