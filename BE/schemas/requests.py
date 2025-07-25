"""
Request schemas for API endpoints
"""

from typing import List
from pydantic import BaseModel, Field


class QuestionRequest(BaseModel):
    """Single question request schema"""
    question: str = Field(..., description="The quiz question")
    options: List[str] = Field(..., min_items=2, max_items=4, description="Answer options")

    class Config:
        json_schema_extra = {
            "example": {
                "question": "What is the capital of France?",
                "options": ["London", "Berlin", "Paris", "Madrid"]
            }
        }


class QuestionData(BaseModel):
    """Individual question data for batch processing"""
    question: str
    options: List[str]

    class Config:
        json_schema_extra = {
            "example": {
                "question": "What is 2 + 2?",
                "options": ["3", "4", "5", "6"]
            }
        }


class BatchRequest(BaseModel):
    """Batch questions request schema"""
    questions: List[QuestionData] = Field(..., description="List of questions to process")

    class Config:
        json_schema_extra = {
            "example": {
                "questions": [
                    {
                        "question": "What is 2 + 2?",
                        "options": ["3", "4", "5", "6"]
                    },
                    {
                        "question": "Which planet is closest to the Sun?",
                        "options": ["Venus", "Mercury", "Earth", "Mars"]
                    }
                ]
            }
        }
