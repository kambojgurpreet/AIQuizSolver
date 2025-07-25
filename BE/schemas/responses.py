"""
Response schemas for API endpoints
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ModelResponse(BaseModel):
    """Individual model response"""
    model: str = Field(..., description="AI model name")
    answer: str = Field(..., description="Selected answer (A, B, C, or D)")
    confidence: int = Field(..., ge=1, le=10, description="Confidence level 1-10")
    raw: str = Field(..., description="Raw AI response")
    reasoning: Optional[str] = Field(None, description="Reasoning explanation from the model")
    error: Optional[bool] = Field(False, description="Whether this model response is an error fallback")

    model_config = {"protected_namespaces": ()}


class MultiModelAnalysis(BaseModel):
    """Analysis of multiple model responses"""
    consensus: bool = Field(..., description="Whether all models agree")
    consensus_answer: Optional[str] = Field(None, description="Agreed answer if consensus exists")
    avg_confidence: float = Field(..., description="Average confidence across models")
    conflicting_answers: List[str] = Field(default=[], description="Different answers if no consensus")
    ai_model_responses: List[ModelResponse] = Field(..., description="Individual model responses")

    model_config = {"protected_namespaces": ()}


class AnswerResponse(BaseModel):
    """Enhanced answer response schema supporting multi-model analysis"""
    # Legacy fields for backward compatibility
    answer: str = Field(..., description="Primary answer (consensus or highest confidence)")
    confidence: int = Field(..., ge=1, le=10, description="Primary confidence level")
    raw: str = Field(..., description="Raw AI response from primary model")
    reasoning: Optional[str] = Field(None, description="Reasoning explanation for the answer")
    model: str = Field(default="multi-model", description="AI model used")
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    
    # New multi-model fields
    multi_model_analysis: Optional[MultiModelAnalysis] = Field(None, description="Multi-model analysis results")
    highlight_type: str = Field(default="single", description="UI highlight type: 'single' or 'multiple'")
    
    # Extension compatibility fields
    consensus: Optional[bool] = Field(None, description="Whether models reached consensus (for extension compatibility)")
    individual_answers: Optional[Dict[str, Dict[str, Any]]] = Field(None, description="Individual model answers for extension")

    class Config:
        json_schema_extra = {
            "example": {
                "answer": "C",
                "confidence": 9,
                "raw": "Consensus analysis from multiple models",
                "model": "multi-model",
                "timestamp": "2025-07-23T17:30:00.000000",
                "multi_model_analysis": {
                    "consensus": True,
                    "consensus_answer": "C",
                    "avg_confidence": 8.7,
                    "conflicting_answers": [],
                    "ai_model_responses": [
                        {
                            "model": "gpt-4.1",
                            "answer": "C",
                            "confidence": 9,
                            "raw": "Answer: C\nConfidence: 9\nReasoning: Based on analysis..."
                        },
                        {
                            "model": "gemini-2.5-pro",
                            "answer": "C", 
                            "confidence": 8,
                            "raw": "Answer: C\nConfidence: 8\nReasoning: After evaluation..."
                        }
                    ]
                },
                "highlight_type": "single"
            }
        }


class BatchAnswerResponse(BaseModel):
    """Individual answer response for batch processing"""
    index: int
    answer: Optional[str] = None
    confidence: Optional[int] = None
    raw: Optional[str] = None
    reasoning: Optional[str] = None
    error: Optional[str] = None
    
    # Multi-model fields for extension compatibility
    consensus: Optional[bool] = None
    individual_answers: Optional[Dict[str, Dict[str, Any]]] = None

    class Config:
        json_schema_extra = {
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
        json_schema_extra = {
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
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "uptime": 1234.56,
                "timestamp": "2025-07-23T17:30:00.000000",
                "openai": "configured"
            }
        }
