"""
AI Model Clients service for managing OpenAI, Gemini, and xAI connections
Handles client initialization and configuration
"""

import os
import logging
from typing import Optional

# AI Model imports
from openai import AsyncOpenAI
from google import genai
from google.genai import types

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

logger = logging.getLogger(__name__)

# Global client variables
_openai_client: Optional[AsyncOpenAI] = None
_xai_client: Optional[AsyncOpenAI] = None
_gemini_client: Optional[genai.Client] = None


def get_openai_client() -> AsyncOpenAI:
    """Get or create OpenAI client with lazy initialization"""
    global _openai_client
    if _openai_client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        _openai_client = AsyncOpenAI(
            api_key=api_key,
            timeout=30.0  # 30 second timeout
        )
        logger.info("OpenAI client initialized")
    
    return _openai_client


def get_xai_client() -> AsyncOpenAI:
    """Get or create xAI client with lazy initialization"""
    global _xai_client
    if _xai_client is None:
        api_key = os.getenv("XAI_API_KEY")
        if not api_key:
            raise ValueError("XAI_API_KEY environment variable is required")
        
        _xai_client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://api.x.ai/v1",
            timeout=30.0  # 30 second timeout
        )
        logger.info("xAI client initialized")
    
    return _xai_client


def get_gemini_client() -> genai.Client:
    """Get or create Gemini client with lazy initialization"""
    global _gemini_client
    if _gemini_client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        _gemini_client = genai.Client(api_key=api_key)
        logger.info("Gemini client initialized")
    
    return _gemini_client


def reset_clients() -> None:
    """Reset all clients (useful for testing or configuration changes)"""
    global _openai_client, _xai_client, _gemini_client
    _openai_client = None
    _xai_client = None
    _gemini_client = None
    logger.info("All AI clients reset")


def check_client_configurations() -> dict:
    """Check if all required API keys are configured"""
    return {
        "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
        "xai_configured": bool(os.getenv("XAI_API_KEY")),
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY"))
    }
