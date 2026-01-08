# Payer Analytics Backend

FastAPI-based backend for the AMAC payer database and analytics system.

## Features

- **Asynchronous Web Scraping**: Multi-source data collection with rate limiting
- **Data Processing Pipeline**: ETL operations with deduplication and validation
- **RESTful API**: Full CRUD operations and analytics endpoints
- **PostgreSQL Integration**: Robust data storage with full-text search
- **Modular Architecture**: Easy to extend with new scrapers and processors

## Quick Start

### 1. Environment Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Database Setup

```bash
# Initialize database
python ../database/init_db.py
```

### 3. Environment Configuration

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/payer_analytics

# Application
ENVIRONMENT=development
DEBUG=true
HOST=0.0.0.0
PORT=8000

# Scraping
USER_AGENT=PayerAnalytics/1.0 (https://amac.gov.ng)
REQUEST_TIMEOUT=30
MAX_RETRIES=3
```

### 4. Run the Application

```bash
# Start the FastAPI server
python main.py

# API will be available at: http://localhost:8000
# Documentation at: http://localhost:8000/docs
```

## Usage

### Running Scrapers

#### Command Line Interface

```bash
# List available scrapers
python run_scraper.py --list

# Test a scraper (limited data)
python run_scraper.py --scraper "Government Business Registry" --test

# Run a specific scraper
python run_scraper.py --scraper "Government Business Registry"

# Run all scrapers
python run_scraper.py
```

#### API Endpoints

```bash
# Start scraping via API
curl -X POST http://localhost:8000/api/v1/scraping/start \
  -H "Content-Type: application/json" \
  -d '{"scraper_name": "Government Business Registry"}'

# Get scraping status
curl http://localhost:8000/api/v1/scraping/status

# Test scraper via API
curl -X POST http://localhost:8000/api/v1/scraping/test \
  -H "Content-Type: application/json" \
  -d '{"scraper_name": "Government Business Registry"}'
```

### API Endpoints

#### Payers
- `GET /api/v1/payers` - List payers with filtering
- `GET /api/v1/payers/{id}` - Get specific payer
- `GET /api/v1/payers/search` - Search payers

#### Analytics
- `GET /api/v1/analytics/overview` - Dashboard analytics
- `GET /api/v1/analytics/revenue` - Revenue analytics

#### Scraping
- `POST /api/v1/scraping/start` - Start scraping job
- `POST /api/v1/scraping/test` - Test scraper
- `GET /api/v1/scraping/status` - Get scraping status
- `GET /api/v1/scraping/available` - List available scrapers

## Architecture

### Core Components

1. **Scrapers** (`scrapers/`): Data collection modules
   - `BaseScraper`: Abstract base class with retry logic
   - `GovernmentBusinessScraper`: Official government data
   - `DirectoryScraper`: Business directory data

2. **Processors** (`processors/`): Data processing pipeline
   - `DataProcessor`: ETL operations and deduplication

3. **API** (`api/`): RESTful endpoints
   - `routes.py`: FastAPI route definitions

4. **Database** (`database/`): Data models and connections
   - `models.py`: SQLAlchemy models
   - `connection.py`: Database session management

### Data Flow

```
Scrapers → Raw Data → Data Processor → Database
    ↓              ↓              ↓
Validation → Cleaning → Deduplication → Storage
```

## Adding New Scrapers

1. **Create Scraper Class**:
```python
from scrapers.base_scraper import BaseScraper

class MyNewScraper(BaseScraper):
    def __init__(self):
        super().__init__(
            name="My Data Source",
            source_url="https://example.com",
            source_type="api"
        )

    async def scrape(self) -> List[Dict[str, Any]]:
        # Implement scraping logic
        pass

    def parse_data(self, raw_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        # Parse into standardized format
        pass
```

2. **Register Scraper**:
Add to `ScraperOrchestrator._load_scrapers()`:
```python
self.scrapers.append(MyNewScraper())
```

3. **Test Scraper**:
```bash
python run_scraper.py --scraper "My Data Source" --test
```

## Database Schema

### Key Tables

- **payers**: Main taxpayer entities
- **contacts**: Contact information
- **businesses**: Business registration data
- **properties**: Property ownership data
- **payment_history**: Revenue collection records
- **data_sources**: Data source metadata
- **scraping_jobs**: Scraping job tracking

### Indexes

- Full-text search on names and addresses
- Geospatial indexes for location data
- Composite indexes for common queries

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `DEBUG` | Enable debug mode | `true` |
| `PORT` | Server port | `8000` |
| `REQUEST_TIMEOUT` | HTTP request timeout | `30` |
| `MAX_RETRIES` | Max retry attempts | `3` |
| `RATE_LIMIT_DELAY` | Delay between requests | `1.0` |

## Testing

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_scrapers.py

# Run with coverage
pytest --cov=backend --cov-report=html
```

## Monitoring

### Health Checks

- `GET /health` - Basic health check
- `GET /api/v1/scraping/status` - Scraping system status

### Logging

- Structured JSON logging in production
- Console logging in development
- Configurable log levels

## Security

- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration
- Secure headers

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check `DATABASE_URL` in `.env`
   - Ensure PostgreSQL is running
   - Verify user permissions

2. **Scraper Timeout**
   - Increase `REQUEST_TIMEOUT`
   - Check network connectivity
   - Verify target website is accessible

3. **Memory Issues**
   - Reduce concurrent scrapers with `MAX_CONCURRENT_SCRAPERS`
   - Process data in smaller batches

### Debug Mode

Enable debug logging:
```bash
export LOG_LEVEL=DEBUG
python main.py
```

## Contributing

1. Follow existing code patterns
2. Add tests for new features
3. Update documentation
4. Use type hints and docstrings
5. Run linting: `flake8` and `mypy`
