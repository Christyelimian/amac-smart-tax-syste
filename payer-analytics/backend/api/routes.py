"""
API Routes for Payer Analytics
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import logging

from database.connection import get_db_session
from database.models import Payer
from sqlalchemy import select, func

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/payers")
async def get_payers(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    zone: Optional[str] = None,
    business_type: Optional[str] = None,
    revenue_category: Optional[str] = None
):
    """Get payers with optional filtering"""
    try:
        # Return mock data organized by AMAC revenue categories
        mock_payers = [
            {
                "id": "mock-1",
                "name": "John Doe",
                "business_name": "Grand Hotel Abuja",
                "business_type": "Hospitality",
                "revenue_category": "Hotels & Restaurants",
                "zone": "Wuse",
                "phone": "+2348012345678",
                "email": "info@grandhotel.ng",
                "data_source": "business_directory",
                "confidence_score": 0.95,
                "last_updated": "2025-01-07T14:00:00Z"
            },
            {
                "id": "mock-2",
                "name": "Jane Smith",
                "business_name": "Smith Manufacturing Ltd",
                "business_type": "Manufacturing",
                "revenue_category": "Manufacturing Industries",
                "zone": "Maitama",
                "phone": "+2348098765432",
                "email": "contact@smithmfg.com",
                "data_source": "government_registry",
                "confidence_score": 0.92,
                "last_updated": "2025-01-07T14:00:00Z"
            },
            {
                "id": "mock-3",
                "name": "Dr. Ahmed Hassan",
                "business_name": "Abuja Central Hospital",
                "business_type": "Healthcare",
                "revenue_category": "Healthcare Facilities",
                "zone": "Garki",
                "phone": "+2348034567890",
                "email": "admin@centralhospital.ng",
                "data_source": "government_registry",
                "confidence_score": 0.98,
                "last_updated": "2025-01-07T14:00:00Z"
            },
            {
                "id": "mock-4",
                "name": "Mrs. Fatima Abubakar",
                "business_name": "Abuja International School",
                "business_type": "Education",
                "revenue_category": "Schools & Colleges",
                "zone": "Wuse",
                "phone": "+2348056789012",
                "email": "admissions@abujainternationalschool.edu.ng",
                "data_source": "business_directory",
                "confidence_score": 0.94,
                "last_updated": "2025-01-07T14:00:00Z"
            },
            {
                "id": "mock-5",
                "name": "Alhaji Ibrahim Musa",
                "business_name": "Musa Construction Company",
                "business_type": "Construction",
                "revenue_category": "Construction Companies",
                "zone": "Central Business District",
                "phone": "+2348078901234",
                "email": "projects@musaconstruction.com",
                "data_source": "government_registry",
                "confidence_score": 0.89,
                "last_updated": "2025-01-07T14:00:00Z"
            },
            {
                "id": "mock-6",
                "name": "Mrs. Grace Okafor",
                "business_name": "Okafor Supermarket",
                "business_type": "Retail",
                "revenue_category": "Shopping Malls & Markets",
                "zone": "Asokoro",
                "phone": "+2348123456789",
                "email": "manager@okaforstores.com",
                "data_source": "social_media",
                "confidence_score": 0.87,
                "last_updated": "2025-01-07T14:00:00Z"
            },
            {
                "id": "mock-7",
                "name": "Chief Emmanuel Nwosu",
                "business_name": "First Abuja Bank",
                "business_type": "Financial Services",
                "revenue_category": "Banks & Financial Services",
                "zone": "Central Business District",
                "phone": "+2347012345678",
                "email": "customerservice@firstabujabank.com",
                "data_source": "government_registry",
                "confidence_score": 0.96,
                "last_updated": "2025-01-07T14:00:00Z"
            },
            {
                "id": "mock-8",
                "name": "Engr. Samuel Adebayo",
                "business_name": "Adebayo Transport Services",
                "business_type": "Transportation",
                "revenue_category": "Transportation Services",
                "zone": "Kuje",
                "phone": "+2348156789012",
                "email": "operations@adebayotransport.com",
                "data_source": "business_directory",
                "confidence_score": 0.91,
                "last_updated": "2025-01-07T14:00:00Z"
            }
        ]

        # Apply basic filtering
        filtered_payers = mock_payers
        if search:
            search_lower = search.lower()
            filtered_payers = [
                p for p in mock_payers
                if search_lower in p.get("name", "").lower() or
                   search_lower in p.get("business_name", "").lower() or
                   search_lower in p.get("phone", "").lower()
            ]

        if zone:
            filtered_payers = [p for p in filtered_payers if p.get("zone") == zone]

        if business_type:
            filtered_payers = [p for p in filtered_payers if p.get("business_type") == business_type]

        if revenue_category:
            filtered_payers = [p for p in filtered_payers if p.get("revenue_category") == revenue_category]

        # Apply pagination
        paginated_payers = filtered_payers[skip:skip + limit]

        return {
            "payers": paginated_payers,
            "count": len(paginated_payers),
            "total": len(filtered_payers),
            "skip": skip,
            "limit": limit,
            "message": "Mock data - database not connected"
        }

    except Exception as e:
        logger.error(f"Error fetching payers: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch payers")

@router.get("/payers/{payer_id}")
async def get_payer(
    payer_id: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Get a specific payer by ID"""
    try:
        query = select(Payer).where(Payer.id == payer_id)
        result = await db.execute(query)
        payer = result.scalar_one_or_none()

        if not payer:
            raise HTTPException(status_code=404, detail="Payer not found")

        return payer.__dict__

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching payer {payer_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch payer")

@router.get("/analytics/overview")
async def get_analytics_overview():
    """Get analytics overview with AMAC revenue categories"""
    try:
        # Mock data organized by AMAC revenue categories
        amac_revenue_categories = {
            "hotels_restaurants": {
                "name": "Hotels & Restaurants",
                "count": 45,
                "revenue": 1250000.00,
                "color": "#FF6B6B"
            },
            "schools_colleges": {
                "name": "Schools & Colleges",
                "count": 78,
                "revenue": 890000.00,
                "color": "#4ECDC4"
            },
            "healthcare": {
                "name": "Healthcare Facilities",
                "count": 34,
                "revenue": 675000.00,
                "color": "#45B7D1"
            },
            "banks_financial": {
                "name": "Banks & Financial Services",
                "count": 23,
                "revenue": 2100000.00,
                "color": "#96CEB4"
            },
            "shopping_malls": {
                "name": "Shopping Malls & Markets",
                "count": 56,
                "revenue": 1450000.00,
                "color": "#FFEAA7"
            },
            "construction": {
                "name": "Construction Companies",
                "count": 67,
                "revenue": 980000.00,
                "color": "#DDA0DD"
            },
            "transportation": {
                "name": "Transportation Services",
                "count": 89,
                "revenue": 750000.00,
                "color": "#98D8C8"
            },
            "manufacturing": {
                "name": "Manufacturing Industries",
                "count": 45,
                "revenue": 1650000.00,
                "color": "#F7DC6F"
            },
            "real_estate": {
                "name": "Real Estate & Property",
                "count": 123,
                "revenue": 3200000.00,
                "color": "#BB8FCE"
            },
            "telecom": {
                "name": "Telecommunications",
                "count": 12,
                "revenue": 2800000.00,
                "color": "#85C1E9"
            }
        }

        # Zone distribution
        zone_data = [
            {"zone": "Wuse", "count": 156, "revenue": 2450000.00},
            {"zone": "Maitama", "count": 134, "revenue": 1980000.00},
            {"zone": "Asokoro", "count": 98, "revenue": 1650000.00},
            {"zone": "Garki", "count": 187, "revenue": 2890000.00},
            {"zone": "Central Business District", "count": 234, "revenue": 4120000.00},
            {"zone": "Kuje", "count": 67, "revenue": 890000.00},
            {"zone": "Bwari", "count": 45, "revenue": 675000.00},
            {"zone": "Abaji", "count": 23, "revenue": 345000.00}
        ]

        return {
            "total_payers": 944,
            "total_revenue": 17245000.00,
            "payers_by_category": amac_revenue_categories,
            "payers_by_zone": zone_data,
            "top_performing_categories": [
                {"category": "Real Estate & Property", "revenue": 3200000.00, "growth": 15.2},
                {"category": "Banks & Financial Services", "revenue": 2100000.00, "growth": 12.8},
                {"category": "Manufacturing Industries", "revenue": 1650000.00, "growth": 9.4},
                {"category": "Telecommunications", "revenue": 2800000.00, "growth": 8.7},
                {"category": "Shopping Malls & Markets", "revenue": 1450000.00, "growth": 7.1}
            ],
            "data_sources": [
                {"name": "Government Registry", "count": 456, "last_updated": "2025-01-07T10:00:00Z"},
                {"name": "Business Directories", "count": 234, "last_updated": "2025-01-07T09:30:00Z"},
                {"name": "Manual Entry", "count": 123, "last_updated": "2025-01-07T08:00:00Z"},
                {"name": "Social Media", "count": 131, "last_updated": "2025-01-07T07:00:00Z"}
            ],
            "last_updated": "2025-01-07T14:00:00Z",
            "message": "Mock data organized by AMAC revenue categories"
        }

    except Exception as e:
        logger.error(f"Error fetching analytics overview: {e}")
        return {
            "total_payers": 0,
            "total_revenue": 0,
            "payers_by_category": {},
            "payers_by_zone": [],
            "top_performing_categories": [],
            "data_sources": [],
            "last_updated": None,
            "error": str(e)
        }

@router.post("/scraping/start")
async def start_scraping(scraper_name: Optional[str] = None):
    """Start scraping job"""
    from scrapers.scraper_orchestrator import ScraperOrchestrator

    try:
        orchestrator = ScraperOrchestrator()

        if scraper_name:
            # Run specific scraper
            result = await orchestrator.run_single_scraper(scraper_name)
        else:
            # Run all scrapers
            result = await orchestrator.run_all_scrapers()

        return {
            "status": "started",
            "result": result
        }

    except Exception as e:
        logger.error(f"Error starting scraping: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start scraping: {str(e)}")

@router.post("/scraping/test")
async def test_scraper(scraper_name: str):
    """Test a scraper with limited data"""
    from scrapers.scraper_orchestrator import ScraperOrchestrator

    try:
        orchestrator = ScraperOrchestrator()
        result = await orchestrator.test_scraper(scraper_name, test_mode=True)

        return {
            "status": "completed",
            "result": result
        }

    except Exception as e:
        logger.error(f"Error testing scraper {scraper_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to test scraper: {str(e)}")

@router.get("/scraping/available")
async def get_available_scrapers():
    """Get list of available scrapers"""
    from scrapers.scraper_orchestrator import ScraperOrchestrator

    try:
        orchestrator = ScraperOrchestrator()
        scrapers = orchestrator.get_available_scrapers()

        return {
            "scrapers": scrapers,
            "count": len(scrapers)
        }

    except Exception as e:
        logger.error(f"Error getting available scrapers: {e}")
        raise HTTPException(status_code=500, detail="Failed to get available scrapers")

@router.get("/scraping/status")
async def get_scraping_status(db: AsyncSession = Depends(get_db_session)):
    """Get scraping job status"""
    try:
        from database.models import ScrapingJob, DataSource

        # Get recent jobs
        query = select(ScrapingJob).order_by(ScrapingJob.created_at.desc()).limit(10)
        result = await db.execute(query)
        recent_jobs = result.scalars().all()

        # Get data sources status
        ds_query = select(DataSource)
        ds_result = await db.execute(ds_query)
        data_sources = ds_result.scalars().all()

        return {
            "active_jobs": len([j for j in recent_jobs if j.status == 'running']),
            "completed_jobs": len([j for j in recent_jobs if j.status == 'completed']),
            "failed_jobs": len([j for j in recent_jobs if j.status == 'failed']),
            "last_run": recent_jobs[0].created_at.isoformat() if recent_jobs else None,
            "data_sources": [
                {
                    "name": ds.name,
                    "last_scraped": ds.last_scraped.isoformat() if ds.last_scraped else None,
                    "reliability_score": ds.reliability_score,
                    "is_active": ds.is_active
                }
                for ds in data_sources
            ],
            "recent_jobs": [
                {
                    "id": str(job.id),
                    "data_source": job.data_source.name if job.data_source else None,
                    "status": job.status,
                    "records_processed": job.records_processed,
                    "created_at": job.created_at.isoformat(),
                    "completed_at": job.completed_at.isoformat() if job.completed_at else None
                }
                for job in recent_jobs
            ]
        }

    except Exception as e:
        logger.error(f"Error getting scraping status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get scraping status")
