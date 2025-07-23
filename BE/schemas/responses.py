"""
Response schemas for API endpoints
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class AnswerResponse(BaseModel):
    """Single answer response schema"""
    answer: str = Field(..., description="Selected answer (A, B, C, or D)")
    confidence: int = Field(..., ge=1, le=10, description="Confidence level 1-10")
    raw: str = Field(..., description="Raw AI response")
    model: str = Field(default="gpt-4.1", description="AI model used")
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())

    class Config:
        schema_extra = {
            "example": {
                "answer": "C",
                "confidence": 10,
                "raw": "Answer: C\nConfidence: 10\nReasoning: Paris is the capital of France.",
                "model": "gpt-4.1",
                "timestamp": "2025-07-23T17:30:00.000000"
            }
        }


class BatchAnswerResponse(BaseModel):
    """Individual answer response for batch processing"""
    index: int
    answer: Optional[str] = None
    confidence: Optional[int] = None
    raw: Optional[str] = None
    error: Optional[str] = None

    class Config:
        schema_extra = {
            "example": {
                "index": 0,
                "answer": "B",
                "confidence": 10,
                "raw": "Answer: B\nConfidence: 10\nReasoning: 2 + 2 equals 4.",
                "error": None
            }
        }


class TestResponse(BaseModel):
    """Test endpoint response schema"""
    message: str
    timestamp: str
    version: str
    cors: str
    endpoints: List[str]

    class Config:
        schema_extra = {
            "example": {
                "message": "Enhanced Quiz Assistant Proxy - CORS test successful",
                "timestamp": "2025-07-23T17:30:00.000000",
                "version": "2.0 - Chrome Extension Compatible",
                "cors": "enabled",
                "endpoints": ["/test", "/ask", "/ask-batch", "/health", "/docs"]
            }
        }


class HealthResponse(BaseModel):
    """Health check response schema"""
    status: str
    uptime: float
    timestamp: str
    openai: str

    class Config:
        schema_extra = {
            "example": {
                "status": "healthy",
                "uptime": 1234.56,
                "timestamp": "2025-07-23T17:30:00.000000",
                "openai": "configured"
            }
        }
