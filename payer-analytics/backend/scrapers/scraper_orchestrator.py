"""
Scraper Orchestrator
Manages and coordinates multiple scrapers
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import json

from scrapers.base_scraper import BaseScraper
from scrapers.government_scraper import GovernmentBusinessScraper
from scrapers.directory_scraper import DirectoryScraper
from processors.data_processor import DataProcessor
from database.connection import get_db_session
from config.settings import settings

logger = logging.getLogger(__name__)

class ScraperOrchestrator:
    """Orchestrates multiple scrapers and data processing"""

    def __init__(self):
        self.scrapers = []
        self._load_scrapers()

    def _load_scrapers(self):
        """Load available scrapers"""
        self.scrapers = [
            GovernmentBusinessScraper(),
            DirectoryScraper(),
            # Add more scrapers here as they are implemented
        ]

        logger.info(f"Loaded {len(self.scrapers)} scrapers")

    async def run_all_scrapers(self) -> Dict[str, Any]:
        """
        Run all available scrapers
        """
        logger.info("Starting scraper orchestrator")

        results = {
            'start_time': datetime.utcnow().isoformat(),
            'scrapers_run': [],
            'total_records': 0,
            'processing_stats': {},
            'errors': []
        }

        async with get_db_session() as db_session:
            processor = DataProcessor(db_session)

            for scraper in self.scrapers:
                try:
                    logger.info(f"Running scraper: {scraper.name}")

                    # Run the scraper
                    scraper_results = await self._run_single_scraper(scraper)

                    # Process the data
                    processing_stats = await processor.process_batch(
                        scraper_results['data'],
                        scraper.name
                    )

                    scraper_summary = {
                        'scraper_name': scraper.name,
                        'records_scraped': len(scraper_results['data']),
                        'processing_stats': processing_stats,
                        'duration_seconds': scraper_results.get('duration', 0),
                        'status': 'completed'
                    }

                    results['scrapers_run'].append(scraper_summary)
                    results['total_records'] += len(scraper_results['data'])

                    # Update overall processing stats
                    for key, value in processing_stats.items():
                        results['processing_stats'][key] = results['processing_stats'].get(key, 0) + value

                    logger.info(f"Completed scraper: {scraper.name}")

                    # Rate limiting between scrapers
                    await asyncio.sleep(settings.RATE_LIMIT_DELAY * 2)

                except Exception as e:
                    error_msg = f"Error running scraper {scraper.name}: {str(e)}"
                    logger.error(error_msg)

                    results['errors'].append({
                        'scraper': scraper.name,
                        'error': str(e),
                        'timestamp': datetime.utcnow().isoformat()
                    })

                    results['scrapers_run'].append({
                        'scraper_name': scraper.name,
                        'records_scraped': 0,
                        'processing_stats': {},
                        'duration_seconds': 0,
                        'status': 'failed',
                        'error': str(e)
                    })

        results['end_time'] = datetime.utcnow().isoformat()
        results['duration_total'] = (
            datetime.fromisoformat(results['end_time']) -
            datetime.fromisoformat(results['start_time'])
        ).total_seconds()

        logger.info(f"Scraper orchestrator completed. Total records: {results['total_records']}")
        return results

    async def run_single_scraper(self, scraper_name: str) -> Dict[str, Any]:
        """
        Run a specific scraper by name
        """
        scraper = self._get_scraper_by_name(scraper_name)
        if not scraper:
            raise ValueError(f"Scraper '{scraper_name}' not found")

        return await self._run_single_scraper(scraper)

    async def _run_single_scraper(self, scraper: BaseScraper) -> Dict[str, Any]:
        """
        Run a single scraper instance
        """
        start_time = datetime.utcnow()

        try:
            # Scrape the data
            raw_data = await scraper.scrape()

            # Parse the data
            parsed_data = scraper.parse_data(raw_data)

            duration = (datetime.utcnow() - start_time).total_seconds()

            return {
                'scraper_name': scraper.name,
                'data': parsed_data,
                'raw_count': len(raw_data),
                'parsed_count': len(parsed_data),
                'duration': duration,
                'status': 'success'
            }

        except Exception as e:
            duration = (datetime.utcnow() - start_time).total_seconds()
            logger.error(f"Scraper {scraper.name} failed: {e}")

            return {
                'scraper_name': scraper.name,
                'data': [],
                'raw_count': 0,
                'parsed_count': 0,
                'duration': duration,
                'status': 'failed',
                'error': str(e)
            }

    def _get_scraper_by_name(self, name: str) -> Optional[BaseScraper]:
        """Get scraper instance by name"""
        for scraper in self.scrapers:
            if scraper.name == name:
                return scraper
        return None

    def get_available_scrapers(self) -> List[Dict[str, str]]:
        """Get list of available scrapers"""
        return [
            {
                'name': scraper.name,
                'source_url': scraper.source_url,
                'source_type': scraper.source_type
            }
            for scraper in self.scrapers
        ]

    async def test_scraper(self, scraper_name: str, test_mode: bool = True) -> Dict[str, Any]:
        """
        Test a scraper with limited data collection
        """
        scraper = self._get_scraper_by_name(scraper_name)
        if not scraper:
            raise ValueError(f"Scraper '{scraper_name}' not found")

        logger.info(f"Testing scraper: {scraper_name}")

        # Run a limited version of the scraper
        start_time = datetime.utcnow()

        try:
            # For testing, we'll just run the scraping logic without full processing
            async with scraper:
                # Limit the scraping to just get a sample
                raw_data = await scraper.scrape()

                # Take only first few records for testing
                test_data = raw_data[:5] if test_mode else raw_data
                parsed_data = scraper.parse_data(test_data)

            duration = (datetime.utcnow() - start_time).total_seconds()

            return {
                'scraper_name': scraper_name,
                'test_mode': test_mode,
                'records_tested': len(parsed_data),
                'sample_data': parsed_data[:2],  # Show first 2 records as sample
                'duration': duration,
                'status': 'success'
            }

        except Exception as e:
            duration = (datetime.utcnow() - start_time).total_seconds()

            return {
                'scraper_name': scraper_name,
                'test_mode': test_mode,
                'records_tested': 0,
                'sample_data': [],
                'duration': duration,
                'status': 'failed',
                'error': str(e)
            }
