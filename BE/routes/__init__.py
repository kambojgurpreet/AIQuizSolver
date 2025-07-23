"""
Routes package initialization
"""

from .quiz import router as quiz_router
from .health import router as health_router
from .test import router as test_router

__all__ = ["quiz_router", "health_router", "test_router"]
