"""
Enhanced Quiz Assistant API Server

This FastAPI server provides AI-powered quiz assistance with proper MVC architecture.
Organized into routes, schemas, and services for better maintainability.

Features:
- CORS support for Chrome extensions
- Modular architecture with separated concerns
- Async processing for better performance
- Enhanced error handling and logging
- Health check endpoints
- Batch processing support
- Request timing and monitoring

Author: Quiz Assistant Team
Version: 2.0
"""

import os
import time
import uvicorn
import logging
import asyncio
import signal
from contextlib import asynccontextmanager
from datetime import datetime

# FastAPI and related imports
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routes import quiz_router, health_router, test_router

# Config import
from config import settings

# Cache service import
from services.cache_service import cache_manager

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Verify OpenAI API key
if not os.getenv("OPENAI_API_KEY"):
    print("⚠️  Warning: OPENAI_API_KEY not found in environment variables")
    print("   Please ensure you have a .env file with your OpenAI API key")
    print("   Example: OPENAI_API_KEY=your_key_here")
else:
    print("✅ OpenAI API key loaded successfully")

print()
print("🎯 Quiz Assistant API Server v2.0")
print("=" * 50)
print("📍 Server will be available at:")
print("   • Main API: http://localhost:3000")
print("   • Documentation: http://localhost:3000/docs")
print("   • Health Check: http://localhost:3000/health")
print()
print("🔧 Chrome Extension Setup:")
print("   1. Load the extension in Chrome")
print("   2. Navigate to a quiz page")
print("   3. Click the extension icon")
print("   4. Monitor this console for request logs")
print()
print("🚀 Starting server...")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan event handler for startup and shutdown
    """
    # Startup
    logger.info("🚀 Starting Quiz Assistant API Server...")
    logger.info("📂 Loading cache files...")
    # Cache manager is already initialized and loaded
    
    # Setup signal handlers for graceful shutdown
    def signal_handler(signum, frame):
        logger.info(f"🛑 Received signal {signum}, initiating graceful shutdown...")
        # The lifespan shutdown will handle the cleanup
    
    # Register signal handlers (only on Unix-like systems)
    if os.name != 'nt':  # Not Windows
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Quiz Assistant API Server...")
    logger.info("💾 Saving all cache files before shutdown...")
    
    # Ensure all caches are saved before shutdown
    try:
        cache_manager.save_caches_now()
        # Wait a bit for any pending background saves
        await asyncio.sleep(0.5)
        cache_manager.shutdown()
        logger.info("✅ Cache files saved successfully")
    except Exception as e:
        logger.error(f"❌ Error during cache shutdown: {e}")
    
    logger.info("👋 Server shutdown complete")

# Initialize FastAPI app with metadata and lifespan
app = FastAPI(
    title="Quiz Assistant API",
    description="AI-powered quiz assistant with Chrome extension support",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Enhanced CORS configuration for Chrome extensions
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Origin", 
        "X-Requested-With", 
        "Content-Type", 
        "Accept", 
        "Authorization", 
        "X-Chrome-Extension-Id"
    ],
    max_age=86400  # 24 hours
)

# App startup time for uptime calculation
start_time = time.time()


# --- API Key Authentication Middleware ---
@app.middleware("http")
async def api_key_auth_middleware(request: Request, call_next):
    # Allow docs and openapi endpoints without API key
    open_endpoints = ["/docs", "/openapi.json", "/redoc"]
    if any(request.url.path.startswith(ep) for ep in open_endpoints):
        return await call_next(request)

    # Check for API key in header
    api_key = request.headers.get("X-API-Key")
    if not api_key or api_key != settings.api_key:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={
                "detail": "Unauthorized: Invalid or missing API key. Set X-API-Key header."
            },
            headers={"WWW-Authenticate": "API-Key"}
        )
    return await call_next(request)

app.include_router(quiz_router)
app.include_router(health_router)
app.include_router(test_router)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Request logging middleware for monitoring"""
    start_time_req = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time_req
    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Time: {process_time:.3f}s - "
        f"Client: {request.client.host if request.client else 'unknown'}"
    )
    
    return response

@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException):
    """Custom 404 handler with helpful information"""
    return JSONResponse(
        status_code=404,
        content={
            "error": "Endpoint not found",
            "available_endpoints": ["/test", "/ask", "/ask-batch", "/health", "/docs"],
            "message": "Check the API documentation at /docs"
        }
    )

@app.exception_handler(500)
async def server_error_handler(request: Request, exc: HTTPException):
    """Custom 500 handler with error details"""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "Please check server logs for details",
            "timestamp": datetime.now().isoformat()
        }
    )

# Main execution
if __name__ == "__main__":
    # Run with uvicorn for development
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=3000,
        reload=True,  # Auto-reload on code changes
        log_level="info",
        ssl_keyfile="../key.pem",
        ssl_certfile="../cert.pem"
    )
