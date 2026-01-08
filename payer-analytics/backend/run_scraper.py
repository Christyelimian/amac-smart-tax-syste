#!/usr/bin/env python3
"""
Command-line interface for running scrapers
"""

import asyncio
import argparse
import logging
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from scrapers.scraper_orchestrator import ScraperOrchestrator
from config.settings import settings

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

async def main():
    """Main CLI function"""
    parser = argparse.ArgumentParser(description='Run payer data scrapers')
    parser.add_argument(
        '--scraper',
        type=str,
        help='Specific scraper to run (leave empty to run all)'
    )
    parser.add_argument(
        '--test',
        action='store_true',
        help='Run in test mode with limited data'
    )
    parser.add_argument(
        '--list',
        action='store_true',
        help='List available scrapers'
    )

    args = parser.parse_args()

    try:
        orchestrator = ScraperOrchestrator()

        if args.list:
            # List available scrapers
            scrapers = orchestrator.get_available_scrapers()
            print("Available Scrapers:")
            print("-" * 50)
            for scraper in scrapers:
                print(f"• {scraper['name']}")
                print(f"  Type: {scraper['source_type']}")
                print(f"  URL: {scraper['source_url']}")
                print()
            return

        if args.test:
            if not args.scraper:
                print("Error: --scraper is required when using --test")
                sys.exit(1)

            # Test specific scraper
            print(f"Testing scraper: {args.scraper}")
            result = await orchestrator.test_scraper(args.scraper, test_mode=True)

            print("Test Results:")
            print("-" * 30)
            print(f"Status: {result['status']}")
            print(f"Records tested: {result['records_tested']}")
            print(f"Duration: {result['duration']:.2f} seconds")

            if result['status'] == 'success' and result['sample_data']:
                print("\nSample Data:")
                for i, record in enumerate(result['sample_data'][:2]):
                    print(f"Record {i+1}:")
                    print(f"  Name: {record.get('name', 'N/A')}")
                    print(f"  Business: {record.get('business_name', 'N/A')}")
                    print(f"  Phone: {record.get('phone', 'N/A')}")
                    print()

        else:
            # Run scraping
            if args.scraper:
                print(f"Running scraper: {args.scraper}")
                result = await orchestrator.run_single_scraper(args.scraper)
            else:
                print("Running all scrapers...")
                result = await orchestrator.run_all_scrapers()

            # Print summary
            print("\nScraping Results:")
            print("=" * 50)
            print(f"Total duration: {result.get('duration_total', 0):.2f} seconds")
            print(f"Total records scraped: {result.get('total_records', 0)}")

            if 'scrapers_run' in result:
                print("\nPer-scraper results:")
                for scraper_result in result['scrapers_run']:
                    print(f"• {scraper_result['scraper_name']}: {scraper_result['records_scraped']} records")

            if result.get('errors'):
                print(f"\nErrors: {len(result['errors'])}")
                for error in result['errors'][:3]:  # Show first 3 errors
                    print(f"  - {error['scraper']}: {error['error']}")

            if 'processing_stats' in result:
                print("\nProcessing Stats:")
                stats = result['processing_stats']
                print(f"  Added: {stats.get('added', 0)}")
                print(f"  Updated: {stats.get('updated', 0)}")
                print(f"  Duplicates: {stats.get('duplicates', 0)}")
                print(f"  Errors: {stats.get('errors', 0)}")

    except Exception as e:
        logger.error(f"CLI execution failed: {e}")
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
