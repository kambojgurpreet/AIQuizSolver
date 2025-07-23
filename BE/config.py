# Configuration settings for Quiz Assistant API
# This file prepares for future enhancements while maintaining current functionality

import os
from typing import Optional
from pydantic import BaseSettings

class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Basic API settings
    app_name: str = "Quiz Assistant API"
    app_version: str = "2.0.0"
    debug: bool = False
    
    # Server settings
    host: str = "0.0.0.0"
    port: int = 3000
    reload: bool = True
    
    # OpenAI settings
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4.1"
    openai_max_tokens: int = 150
    openai_temperature: float = 0.1
    
    # Rate limiting
    batch_size: int = 3
    rate_limit_delay: float = 1.0
    
    # CORS settings
    cors_origins: list = ["*"]
    cors_allow_credentials: bool = False
    
    # Future: Authentication settings (commented for now)
    # secret_key: Optional[str] = None
    # algorithm: str = "HS256"
    # access_token_expire_minutes: int = 30
    
    # Future: Database settings (commented for now)
    # database_url: Optional[str] = None
    # database_echo: bool = False
    # database_pool_size: int = 10
    # database_max_overflow: int = 20
    
    # Future: Redis settings (commented for now)
    # redis_url: Optional[str] = None
    # redis_db: int = 0
    
    # Logging settings
    log_level: str = "INFO"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

# Global settings instance
settings = Settings()

# Environment-specific configurations
class DevelopmentConfig(Settings):
    """Development environment configuration."""
    debug: bool = True
    reload: bool = True
    log_level: str = "DEBUG"

class ProductionConfig(Settings):
    """Production environment configuration."""
    debug: bool = False
    reload: bool = False
    log_level: str = "WARNING"
    
class TestingConfig(Settings):
    """Testing environment configuration."""
    debug: bool = True
    openai_model: str = "gpt-4.1"  # Cheaper model for testing

def get_settings() -> Settings:
    """Get settings based on environment."""
    env = os.getenv("ENVIRONMENT", "development").lower()
    
    if env == "production":
        return ProductionConfig()
    elif env == "testing":
        return TestingConfig()
    else:
        return DevelopmentConfig()
