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
from datetime import datetime

# FastAPI and related imports
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Route imports
from routes import quiz_router, health_router, test_router

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

# Initialize FastAPI app with metadata
app = FastAPI(
    title="Quiz Assistant API",
    description="AI-powered quiz assistant with Chrome extension support",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
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

# Include routers
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
        log_level="info"
    )
