#!/usr/bin/env python3
"""
Simple schema migration script for Supabase
"""

import asyncio
import sys
from pathlib import Path
import asyncpg
import logging

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from config.settings import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def run_schema_migration():
    """Run the database schema migration"""
    try:
        logger.info("Connecting to database...")
        conn = await asyncpg.connect(settings.DATABASE_URL)

        # Read and execute schema file
        schema_path = Path(__file__).parent / "schemas" / "001_create_payer_analytics_schema.sql"
        logger.info(f"Reading schema from {schema_path}")

        with open(schema_path, "r", encoding="utf-8") as f:
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

        table_names = [row["table_name"] for row in tables]
        logger.info(f"Created tables: {', '.join(table_names)}")

        await conn.close()

    except Exception as e:
        logger.error(f"Error running schema migration: {e}")
        raise

async def main():
    """Main function"""
    logger.info("Starting schema migration for Supabase...")
    await run_schema_migration()
    logger.info("Schema migration completed successfully!")

if __name__ == "__main__":
    asyncio.run(main())
