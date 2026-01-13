"""
Configuration settings for Payer Analytics Backend
"""

import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    """Application settings"""

    # Environment
    ENVIRONMENT: str = Field(default="development")
    DEBUG: bool = Field(default=True)

    # Server
    HOST: str = Field(default="0.0.0.0")
    PORT: int = Field(default=8000)
    ALLOWED_ORIGINS: List[str] = Field(default=["http://localhost:3000", "http://localhost:5173"])

    # Database
    DATABASE_URL: str = Field(default="postgresql://user:password@localhost:5432/payer_analytics")
    DB_POOL_SIZE: int = Field(default=10)
    DB_MAX_OVERFLOW: int = Field(default=20)

    # Redis (for Celery)
    REDIS_URL: str = Field(default="redis://localhost:6379/0")

    # Scraping
    USER_AGENT: str = Field(default="PayerAnalytics/1.0 (https://amac.gov.ng)")
    REQUEST_TIMEOUT: int = Field(default=30)
    MAX_RETRIES: int = Field(default=3)
    RATE_LIMIT_DELAY: float = Field(default=1.0)

    # External APIs
    # Google APIs (for Phase 2)
    GOOGLE_MAPS_API_KEY: str = Field(default="")
    GOOGLE_BUSINESS_API_KEY: str = Field(default="")

    # Data Sources
    SCRAPE_INTERVAL_HOURS: int = Field(default=24)
    MAX_CONCURRENT_SCRAPERS: int = Field(default=5)

    # Security
    SECRET_KEY: str = Field(default="your-secret-key-here")
    API_KEY_EXPIRY_HOURS: int = Field(default=24)

    # Logging
    LOG_LEVEL: str = Field(default="INFO")
    LOG_FORMAT: str = Field(default="json")

    # Data Quality
    DUPLICATE_THRESHOLD: float = Field(default=0.8)
    CONFIDENCE_THRESHOLD: float = Field(default=0.6)

    class Config:
        env_file = ".env"
        case_sensitive = False

# Global settings instance
settings = Settings()
