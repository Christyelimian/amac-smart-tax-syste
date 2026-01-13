#!/usr/bin/env python3
"""
Database initialization script for Payer Analytics
"""

import asyncio
import os
import sys
from pathlib import Path
import asyncpg
import logging

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from config.settings import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def create_database_if_not_exists():
    """Create the database if it doesn't exist"""
    try:
        # Connect to postgres default database to create our database
        conn = await asyncpg.connect(
            user=settings.DATABASE_URL.split('://')[1].split(':')[0],
            password=settings.DATABASE_URL.split(':')[2].split('@')[0],
            host=settings.DATABASE_URL.split('@')[1].split(':')[0],
            port=settings.DATABASE_URL.split(':')[2].split('/')[0],
            database='postgres'
        )

        db_name = settings.DATABASE_URL.split('/')[-1]
        logger.info(f"Checking if database '{db_name}' exists...")

        # Check if database exists
        result = await conn.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            db_name
        )

        if not result:
            logger.info(f"Creating database '{db_name}'...")
            await conn.execute(f'CREATE DATABASE "{db_name}"')
            logger.info(f"Database '{db_name}' created successfully")
        else:
            logger.info(f"Database '{db_name}' already exists")

        await conn.close()

    except Exception as e:
        logger.error(f"Error creating database: {e}")
        raise

async def run_schema_migration():
    """Run the database schema migration"""
    try:
        logger.info("Connecting to database...")
        conn = await asyncpg.connect(settings.DATABASE_URL)

        # Read and execute schema file
        schema_path = Path(__file__).parent / "schemas" / "001_create_payer_analytics_schema.sql"
        logger.info(f"Reading schema from {schema_path}")

        with open(schema_path, 'r', encoding='utf-8') as f:
            schema_sql = f.read()

        logger.info("Executing schema migration...")
        await conn.execute(schema_sql)

        logger.info("Schema migration completed successfully")

        # Verify tables were created
        tables = await conn.fetch("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """)

        logger.info(f"Created tables: {', '.join([row['table_name'] for row in tables])}")

        await conn.close()

    except Exception as e:
        logger.error(f"Error running schema migration: {e}")
        raise

async def seed_initial_data():
    """Seed initial data if needed"""
    try:
        logger.info("Checking if initial data seeding is needed...")
        conn = await asyncpg.connect(settings.DATABASE_URL)

        # Check if we have data sources
        result = await conn.fetchval("SELECT COUNT(*) FROM data_sources")

        if result == 0:
            logger.info("Seeding initial data...")
            # The schema already includes initial data seeding
            # But we can add more here if needed
            pass
        else:
            logger.info("Initial data already exists")

        await conn.close()

    except Exception as e:
        logger.error(f"Error seeding data: {e}")
        raise

async def main():
    """Main initialization function"""
    try:
        logger.info("Starting database initialization...")

        # Skip database creation for Supabase (database already exists)
        if "supabase" not in settings.DATABASE_URL.lower():
            await create_database_if_not_exists()
        else:
            logger.info("Using Supabase database - skipping database creation")

        # Run schema migration
        await run_schema_migration()

        # Seed initial data
        await seed_initial_data()

        logger.info("Database initialization completed successfully! ✅")

        # Print connection info
        logger.info(f"Database URL: {settings.DATABASE_URL}")
        logger.info("You can now start the backend server: python main.py")

    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Check if .env file exists
    env_path = Path(__file__).parent.parent / "backend" / ".env"
    if not env_path.exists():
        logger.warning(".env file not found. Creating template...")
        env_template = """
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/payer_analytics

# Other settings...
ENVIRONMENT=development
DEBUG=true
HOST=0.0.0.0
PORT=8000
"""
        with open(env_path, 'w') as f:
            f.write(env_template.strip())
        logger.info("Created .env template. Please edit with your database credentials.")
        sys.exit(1)

    asyncio.run(main())
