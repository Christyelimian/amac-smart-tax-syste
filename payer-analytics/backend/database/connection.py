"""
Database connection and initialization
"""

import logging
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from contextlib import asynccontextmanager

from config.settings import settings

logger = logging.getLogger(__name__)

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
    poolclass=NullPool,
    echo=settings.DEBUG,
)

# Create session factory
async_session = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

@asynccontextmanager
async def get_db_session():
    """Get database session"""
    session = async_session()
    try:
        yield session
    finally:
        await session.close()

async def init_database():
    """Initialize database connection and create tables"""
    try:
        # Test connection
        async with engine.begin() as conn:
            await conn.run_sync(lambda sync_conn: None)

        logger.info("Database connection established successfully")

        # Import all models to ensure they are registered
        import database.models  # noqa

        # Create tables
        async with engine.begin() as conn:
            # Import Base from models
            from database.models import Base
            await conn.run_sync(Base.metadata.create_all)

        logger.info("Database tables created successfully")

    except Exception as e:
        logger.warning(f"Failed to initialize database: {e}")
        logger.warning("Continuing without database connection - some features may not work")
        # Don't raise exception - allow app to start without database

async def close_database():
    """Close database connection"""
    await engine.dispose()
    logger.info("Database connection closed")
