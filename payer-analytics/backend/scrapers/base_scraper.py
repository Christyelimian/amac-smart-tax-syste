"""
Base scraper class for all data sources
"""

import asyncio
import logging
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
from datetime import datetime
import aiohttp
import backoff

from config.settings import settings
from database.connection import get_db_session
from database.models import DataSource, ScrapingJob

logger = logging.getLogger(__name__)

class BaseScraper(ABC):
    """Base class for all scrapers"""

    def __init__(
        self,
        name: str,
        source_url: str,
        source_type: str = "scraped"
    ):
        self.name = name
        self.source_url = source_url
        self.source_type = source_type
        self.session: Optional[aiohttp.ClientSession] = None
        self.data_source_id: Optional[str] = None

    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            headers={
                "User-Agent": settings.USER_AGENT,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Accept-Encoding": "gzip, deflate",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
            },
            timeout=aiohttp.ClientTimeout(total=settings.REQUEST_TIMEOUT)
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()

    @backoff.on_exception(
        backoff.expo,
        (aiohttp.ClientError, asyncio.TimeoutError),
        max_tries=settings.MAX_RETRIES,
        giveup=lambda e: isinstance(e, aiohttp.ClientResponseError) and e.status == 404
    )
    async def make_request(
        self,
        url: str,
        method: str = "GET",
        **kwargs
    ) -> aiohttp.ClientResponse:
        """Make HTTP request with retry logic"""
        if not self.session:
            raise RuntimeError("Scraper session not initialized")

        logger.debug(f"Making {method} request to {url}")
        await asyncio.sleep(settings.RATE_LIMIT_DELAY)  # Rate limiting

        async with self.session.request(method, url, **kwargs) as response:
            response.raise_for_status()
            return response

    async def get_text(self, url: str, **kwargs) -> str:
        """Get text content from URL"""
        response = await self.make_request(url, **kwargs)
        return await response.text()

    async def get_json(self, url: str, **kwargs) -> Dict[str, Any]:
        """Get JSON content from URL"""
        response = await self.make_request(url, **kwargs)
        return await response.json()

    @abstractmethod
    async def scrape(self) -> List[Dict[str, Any]]:
        """Main scraping method - must be implemented by subclasses"""
        pass

    @abstractmethod
    def parse_data(self, raw_data: Any) -> List[Dict[str, Any]]:
        """Parse raw data into standardized format"""
        pass

    async def run_scraping_job(self) -> Dict[str, Any]:
        """Run complete scraping job with database tracking"""
        async with get_db_session() as db:
            # Create or get data source
            if not self.data_source_id:
                # Check if data source exists
                result = await db.execute(
                    DataSource.__table__.select().where(DataSource.name == self.name)
                )
                data_source = result.first()

                if not data_source:
                    # Create new data source
                    data_source = DataSource(
                        name=self.name,
                        source_type=self.source_type,
                        url=self.source_url,
                        reliability_score=0.5,
                        last_scraped=datetime.utcnow()
                    )
                    db.add(data_source)
                    await db.commit()
                    await db.refresh(data_source)

                self.data_source_id = data_source.id

            # Create scraping job
            job = ScrapingJob(
                data_source_id=self.data_source_id,
                job_type="full_scrape",
                status="running",
                started_at=datetime.utcnow()
            )
            db.add(job)
            await db.commit()
            await db.refresh(job)

            try:
                # Run scraping
                logger.info(f"Starting scraping job for {self.name}")
                raw_data = await self.scrape()

                # Parse data
                parsed_data = self.parse_data(raw_data)

                # Process and store data
                processed_count = await self.process_and_store_data(db, parsed_data)

                # Update job status
                job.status = "completed"
                job.completed_at = datetime.utcnow()
                job.records_processed = len(parsed_data)
                job.records_added = processed_count

                # Update data source
                data_source.last_scraped = datetime.utcnow()

                await db.commit()

                logger.info(f"Completed scraping job for {self.name}: {processed_count} records processed")

                return {
                    "job_id": str(job.id),
                    "status": "completed",
                    "records_processed": len(parsed_data),
                    "records_added": processed_count
                }

            except Exception as e:
                # Update job with error
                job.status = "failed"
                job.completed_at = datetime.utcnow()
                job.error_message = str(e)

                await db.commit()

                logger.error(f"Failed scraping job for {self.name}: {e}")
                raise

    async def process_and_store_data(
        self,
        db_session,
        parsed_data: List[Dict[str, Any]]
    ) -> int:
        """Process and store parsed data - can be overridden by subclasses"""
        # Default implementation - subclasses should implement specific logic
        logger.warning(f"process_and_store_data not implemented for {self.name}")
        return 0
