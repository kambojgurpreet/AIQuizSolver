"""
Pydantic schemas for request/response validation
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class QuestionRequest(BaseModel):
    """Single question request schema"""
    question: str = Field(..., description="The quiz question")
    options: List[str] = Field(..., min_items=2, max_items=4, description="Answer options")


class QuestionData(BaseModel):
    """Individual question data for batch processing"""
    question: str
    options: List[str]


class BatchRequest(BaseModel):
    """Batch questions request schema"""
    questions: List[QuestionData] = Field(..., description="List of questions to process")


class AnswerResponse(BaseModel):
    """Single answer response schema"""
    answer: str = Field(..., description="Selected answer (A, B, C, or D)")
    confidence: int = Field(..., ge=1, le=10, description="Confidence level 1-10")
    raw: str = Field(..., description="Raw AI response")
    model: str = Field(default="gpt-4.1", description="AI model used")
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class BatchAnswerResponse(BaseModel):
    """Individual answer response for batch processing"""
    index: int
    answer: Optional[str] = None
    confidence: Optional[int] = None
    raw: Optional[str] = None
    error: Optional[str] = None


class TestResponse(BaseModel):
    """Test endpoint response schema"""
    message: str
    timestamp: str
    version: str
    cors: str
    endpoints: List[str]


class HealthResponse(BaseModel):
    """Health check response schema"""
    status: str
    uptime: float
    timestamp: str
    openai: str
