"""
Payer Analytics Backend - Main Application
FastAPI application for payer database management and analytics
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import logging

from api.routes import router
from config.settings import settings
from database.connection import init_database
from utils.logger import setup_logging

# Setup logging
setup_logging()

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger = logging.getLogger(__name__)
    logger.info("Starting Payer Analytics Backend")

    # Initialize database
    await init_database()

    yield

    # Shutdown
    logger.info("Shutting down Payer Analytics Backend")

# Create FastAPI app
app = FastAPI(
    title="Payer Analytics API",
    description="API for AMAC payer database and analytics system",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(router, prefix="/api/v1")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Payer Analytics Backend API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )
