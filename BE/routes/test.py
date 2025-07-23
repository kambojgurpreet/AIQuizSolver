"""
Test routes for development and debugging
"""

from fastapi import APIRouter
from schemas.responses import TestResponse
from datetime import datetime

router = APIRouter(tags=["test"])


@router.get("/test", response_model=TestResponse)
async def test_endpoint():
    """
    Test endpoint for CORS and connectivity - Chrome extension compatible
    """
    return TestResponse(
        message="Enhanced Quiz Assistant API - CORS test successful",
        timestamp=datetime.now().isoformat(),
        version="2.0 - Chrome Extension Compatible",
        cors="enabled",
        endpoints=["/test", "/ask", "/ask-batch", "/health", "/docs"]
    )
