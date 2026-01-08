#!/usr/bin/env python3
"""
Comprehensive system test script
Tests the entire payer analytics system setup
"""

import asyncio
import os
import sys
import subprocess
from pathlib import Path
import time
import requests
import json

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

def print_header(title: str):
    """Print a formatted header"""
    print("\n" + "=" * 60)
    print(f" {title}")
    print("=" * 60)

def print_result(test_name: str, success: bool, message: str = ""):
    """Print test result"""
    status = "[PASS]" if success else "[FAIL]"
    print(f"{status} {test_name}")
    if message:
        print(f"      {message}")

def test_python_version():
    """Test Python version"""
    version = sys.version_info
    success = version.major == 3 and version.minor >= 9
    message = f"Python {version.major}.{version.minor}.{version.micro}"
    print_result("Python Version Check", success, message)
    return success

def test_dependencies():
    """Test if required packages are installed"""
    required_packages = [
        'fastapi', 'uvicorn', 'sqlalchemy', 'psycopg2', 'pydantic',
        'aiohttp', 'beautifulsoup4', 'pandas', 'requests'
    ]

    failed_packages = []
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            failed_packages.append(package)

    success = len(failed_packages) == 0
    message = f"Missing packages: {', '.join(failed_packages)}" if failed_packages else "All packages installed"
    print_result("Dependencies Check", success, message)
    return success

def test_node_version():
    """Test if Node.js is available"""
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            version = result.stdout.strip()
            success = True
            message = f"Node.js {version}"
        else:
            success = False
            message = "Node.js not found"
    except FileNotFoundError:
        success = False
        message = "Node.js not installed"

    print_result("Node.js Check", success, message)
    return success

def test_database_connection():
    """Test database connection"""
    try:
        from config.settings import settings
        import asyncpg

        async def test_conn():
            conn = await asyncpg.connect(settings.DATABASE_URL)
            await conn.close()
            return True

        success = asyncio.run(test_conn())
        message = "Database connection successful"

    except ImportError:
        success = False
        message = "asyncpg not installed"
    except Exception as e:
        success = False
        message = f"Database connection failed: {e}"

    print_result("Database Connection", success, message)
    return success

def test_database_schema():
    """Test if database schema is properly set up"""
    try:
        from database.connection import get_db_session
        from database.models import Payer, DataSource

        async def test_schema():
            async with get_db_session() as session:
                # Check if tables exist
                result = await session.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")
                table_count = result.scalar()
                return table_count > 5  # Should have at least 6 tables

        success = asyncio.run(test_schema())
        message = "Database schema is set up correctly"

    except Exception as e:
        success = False
        message = f"Schema check failed: {e}"

    print_result("Database Schema", success, message)
    return success

def test_scraper_import():
    """Test if scrapers can be imported"""
    try:
        from scrapers.base_scraper import BaseScraper
        from scrapers.government_scraper import GovernmentBusinessScraper
        from scrapers.directory_scraper import DirectoryScraper
        from scrapers.scraper_orchestrator import ScraperOrchestrator

        # Test scraper instantiation
        orchestrator = ScraperOrchestrator()
        scrapers = orchestrator.get_available_scrapers()

        success = len(scrapers) > 0
        message = f"Found {len(scrapers)} scrapers"

    except Exception as e:
        success = False
        message = f"Scraper import failed: {e}"

    print_result("Scraper Import", success, message)
    return success

def test_api_import():
    """Test if API components can be imported"""
    try:
        from api.routes import router
        from processors.data_processor import DataProcessor

        success = True
        message = "API components imported successfully"

    except Exception as e:
        success = False
        message = f"API import failed: {e}"

    print_result("API Import", success, message)
    return success

def test_frontend_build():
    """Test if frontend can be built"""
    frontend_dir = Path(__file__).parent / "frontend"

    try:
        # Check if package.json exists
        if not (frontend_dir / "package.json").exists():
            success = False
            message = "package.json not found"
        else:
            # Try to install dependencies (dry run)
            result = subprocess.run(
                ['npm', 'list', '--depth=0'],
                cwd=frontend_dir,
                capture_output=True,
                text=True
            )
            success = result.returncode == 0
            message = "Frontend dependencies available"

    except Exception as e:
        success = False
        message = f"Frontend check failed: {e}"

    print_result("Frontend Setup", success, message)
    return success

def test_configuration():
    """Test configuration setup"""
    try:
        from config.settings import settings

        # Check required settings
        required_settings = ['DATABASE_URL', 'SECRET_KEY']
        missing_settings = []

        for setting in required_settings:
            if not getattr(settings, setting, None):
                missing_settings.append(setting)

        if missing_settings:
            success = False
            message = f"Missing required settings: {', '.join(missing_settings)}"
        else:
            success = True
            message = "Configuration is properly set up"

    except Exception as e:
        success = False
        message = f"Configuration check failed: {e}"

    print_result("Configuration", success, message)
    return success

def test_api_startup():
    """Test if API can start up (basic smoke test)"""
    try:
        # This is a basic import test - full startup would require async context
        from main import app

        # Check if app has routes
        routes = [route.path for route in app.routes]
        success = len(routes) > 0
        message = f"API has {len(routes)} routes defined"

    except Exception as e:
        success = False
        message = f"API startup test failed: {e}"

    print_result("API Startup", success, message)
    return success

def generate_report(results):
    """Generate a summary report"""
    print_header("SYSTEM TEST REPORT")

    total_tests = len(results)
    passed_tests = sum(1 for result in results if result['success'])
    failed_tests = total_tests - passed_tests

    print(f"Total Tests: {total_tests}")
    print(f"Passed: {passed_tests}")
    print(f"Failed: {failed_tests}")
    print(".1f")

    if failed_tests > 0:
        print("\nFailed Tests:")
        for result in results:
            if not result['success']:
                print(f"  • {result['name']}")

    print("\nNext Steps:")
    if passed_tests == total_tests:
        print("  [SUCCESS] All tests passed! You can proceed with development.")
        print("  1. Start the backend: cd backend && python main.py")
        print("  2. Start the frontend: cd frontend && npm run dev")
        print("  3. Test scraping: python backend/run_scraper.py --list")
    else:
        print("  [ERROR] Some tests failed. Please resolve the issues above.")
        print("  - Check your .env file configuration")
        print("  - Ensure PostgreSQL is running")
        print("  - Install missing dependencies")
        print("  - Run: python backend/test_setup.py")

    return passed_tests == total_tests

def main():
    """Run all system tests"""
    print_header("PAYER ANALYTICS SYSTEM TEST SUITE")

    tests = [
        ("Python Version", test_python_version),
        ("Dependencies", test_dependencies),
        ("Node.js", test_node_version),
        ("Database Connection", test_database_connection),
        ("Database Schema", test_database_schema),
        ("Scraper Import", test_scraper_import),
        ("API Import", test_api_import),
        ("Frontend Setup", test_frontend_build),
        ("Configuration", test_configuration),
        ("API Startup", test_api_startup),
    ]

    results = []

    for test_name, test_func in tests:
        result = {
            'name': test_name,
            'success': test_func()
        }
        results.append(result)

    # Generate final report
    success = generate_report(results)

    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
