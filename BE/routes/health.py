"""
Health check routes
"""

import os
import time
from fastapi import APIRouter
from schemas.responses import HealthResponse
from datetime import datetime

router = APIRouter(tags=["health"])

# Track server start time (imported from main)
start_time = time.time()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint with uptime and system status
    """
    uptime = time.time() - start_time
    return HealthResponse(
        status="healthy",
        uptime=uptime,
        timestamp=datetime.now().isoformat(),
        openai="configured" if os.getenv("OPENAI_API_KEY") else "not_configured"
    )
