"""
Government Business Registry Scraper
Scrapes business data from official government sources in Nigeria
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import re
import json

from bs4 import BeautifulSoup
from scrapers.base_scraper import BaseScraper

logger = logging.getLogger(__name__)

class GovernmentBusinessScraper(BaseScraper):
    """Scraper for Nigerian government business registries"""

    def __init__(self):
        super().__init__(
            name="Government Business Registry",
            source_url="https://www.cac.gov.ng",
            source_type="government"
        )

    async def scrape(self) -> List[Dict[str, Any]]:
        """
        Main scraping method for government business data
        Note: This is a template implementation. Actual scraping would depend on
        the specific government website structure and APIs available.
        """
        logger.info("Starting government business registry scraping")

        all_businesses = []

        try:
            # Example: Scrape CAC (Corporate Affairs Commission) data
            # In reality, you'd need to check their actual API or website structure
            cac_businesses = await self._scrape_cac_registry()
            all_businesses.extend(cac_businesses)

            # Example: Scrape FIRS (Federal Inland Revenue Service) business data
            firs_businesses = await self._scrape_firs_businesses()
            all_businesses.extend(firs_businesses)

            # Example: Scrape state-level business registries
            state_businesses = await self._scrape_state_registries()
            all_businesses.extend(state_businesses)

            logger.info(f"Collected {len(all_businesses)} businesses from government sources")
            return all_businesses

        except Exception as e:
            logger.error(f"Error scraping government registries: {e}")
            raise

    async def _scrape_cac_registry(self) -> List[Dict[str, Any]]:
        """
        Scrape Corporate Affairs Commission business registry
        This is a template - actual implementation depends on CAC's website
        """
        businesses = []

        try:
            # CAC company search URL (hypothetical)
            search_url = "https://www.cac.gov.ng/company-search/"

            # This would typically involve:
            # 1. Making requests to search endpoints
            # 2. Handling pagination
            # 3. Parsing HTML/JSON responses

            # For now, return sample data structure
            sample_businesses = [
                {
                    "name": "ABC Trading Company Ltd",
                    "registration_number": "RC123456",
                    "business_type": "Trading",
                    "registration_date": "2020-01-15",
                    "status": "active",
                    "directors": ["John Doe", "Jane Smith"],
                    "address": "123 Lagos Street, Lagos, Nigeria",
                    "phone": "+2348012345678",
                    "email": "info@abctrading.com",
                    "source_url": "https://www.cac.gov.ng/company/RC123456",
                    "confidence_score": 0.95
                }
            ]

            businesses.extend(sample_businesses)
            logger.info(f"Scraped {len(businesses)} businesses from CAC")

        except Exception as e:
            logger.error(f"Error scraping CAC registry: {e}")

        return businesses

    async def _scrape_firs_businesses(self) -> List[Dict[str, Any]]:
        """
        Scrape FIRS taxpayer/business data
        This would require proper API access or web scraping
        """
        businesses = []

        try:
            # FIRS might have public business listings or APIs
            # This is a template implementation
            sample_businesses = [
                {
                    "name": "XYZ Manufacturing Ltd",
                    "tin": "12345678-0001",
                    "business_type": "Manufacturing",
                    "sector": "Industrial",
                    "address": "456 Abuja Road, Abuja, Nigeria",
                    "phone": "+2348098765432",
                    "source_url": "https://www.firs.gov.ng/taxpayer/12345678-0001",
                    "confidence_score": 0.90
                }
            ]

            businesses.extend(sample_businesses)
            logger.info(f"Scraped {len(businesses)} businesses from FIRS")

        except Exception as e:
            logger.error(f"Error scraping FIRS data: {e}")

        return businesses

    async def _scrape_state_registries(self) -> List[Dict[str, Any]]:
        """
        Scrape state-level business registries
        Focus on FCT (Abuja) and surrounding states
        """
        businesses = []

        # List of state business registry URLs (hypothetical)
        state_urls = [
            "https://www.abuja.gov.ng/business-registry",
            "https://www.nasarawa.gov.ng/businesses",
            "https://www.niger.gov.ng/companies"
        ]

        for url in state_urls:
            try:
                state_businesses = await self._scrape_single_state_registry(url)
                businesses.extend(state_businesses)
                await asyncio.sleep(2)  # Rate limiting

            except Exception as e:
                logger.error(f"Error scraping {url}: {e}")
                continue

        logger.info(f"Scraped {len(businesses)} businesses from state registries")
        return businesses

    async def _scrape_single_state_registry(self, url: str) -> List[Dict[str, Any]]:
        """Scrape a single state business registry"""
        businesses = []

        try:
            # Make request to state registry
            response = await self.make_request(url)

            if response.status == 200:
                html_content = await response.text()
                soup = BeautifulSoup(html_content, 'html.parser')

                # Parse business listings (this would depend on actual HTML structure)
                business_elements = soup.find_all('div', class_='business-item')

                for element in business_elements:
                    business_data = self._parse_business_element(element, url)
                    if business_data:
                        businesses.append(business_data)

            logger.debug(f"Found {len(businesses)} businesses on {url}")

        except Exception as e:
            logger.error(f"Error scraping state registry {url}: {e}")

        return businesses

    def _parse_business_element(self, element, source_url: str) -> Optional[Dict[str, Any]]:
        """Parse a business element from HTML"""
        try:
            # Extract business information from HTML element
            # This is highly dependent on the actual website structure

            name_elem = element.find('h3', class_='business-name')
            address_elem = element.find('div', class_='business-address')
            phone_elem = element.find('span', class_='business-phone')

            if not name_elem:
                return None

            business = {
                "name": name_elem.get_text(strip=True),
                "business_type": "General Business",  # Default
                "address": address_elem.get_text(strip=True) if address_elem else None,
                "phone": phone_elem.get_text(strip=True) if phone_elem else None,
                "source_url": source_url,
                "confidence_score": 0.70  # Lower confidence for state registries
            }

            return business

        except Exception as e:
            logger.error(f"Error parsing business element: {e}")
            return None

    def parse_data(self, raw_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Parse raw scraped data into standardized format for database insertion
        """
        parsed_businesses = []

        for item in raw_data:
            try:
                # Standardize the data format
                parsed_business = {
                    "name": item.get("name", "").strip(),
                    "business_name": item.get("name", "").strip(),
                    "business_type": item.get("business_type", "General Business"),
                    "registration_number": item.get("registration_number") or item.get("tin"),
                    "address": item.get("address", "").strip() if item.get("address") else None,
                    "phone": self._normalize_phone(item.get("phone")),
                    "email": item.get("email"),
                    "business_category": self._categorize_business(item.get("business_type", "")),
                    "zone": self._extract_zone_from_address(item.get("address")),
                    "data_source": self.name,
                    "confidence_score": item.get("confidence_score", 0.7),
                    "raw_data": item  # Keep original data for reference
                }

                # Only include if we have at least a name
                if parsed_business["name"]:
                    parsed_businesses.append(parsed_business)

            except Exception as e:
                logger.error(f"Error parsing business data: {e}")
                continue

        logger.info(f"Parsed {len(parsed_businesses)} businesses from {len(raw_data)} raw items")
        return parsed_businesses

    def _normalize_phone(self, phone: Optional[str]) -> Optional[str]:
        """Normalize phone number format"""
        if not phone:
            return None

        # Remove all non-digit characters except +
        cleaned = re.sub(r'[^\d+]', '', phone.strip())

        # Handle Nigerian numbers
        if cleaned.startswith('0') and len(cleaned) == 11:
            # Convert 08012345678 to +2348012345678
            cleaned = '+234' + cleaned[1:]
        elif cleaned.startswith('234') and not cleaned.startswith('+'):
            cleaned = '+' + cleaned

        return cleaned

    def _categorize_business(self, business_type: str) -> str:
        """Categorize business type into our enum categories"""
        type_lower = business_type.lower()

        # Mapping logic (simplified)
        if any(word in type_lower for word in ['trading', 'retail', 'shop', 'store']):
            return 'retail'
        elif any(word in type_lower for word in ['manufactur', 'production', 'factory']):
            return 'manufacturing'
        elif any(word in type_lower for word in ['construct', 'building', 'engineering']):
            return 'construction'
        elif any(word in type_lower for word in ['transport', 'logistics', 'delivery']):
            return 'transport'
        elif any(word in type_lower for word in ['health', 'medical', 'hospital']):
            return 'healthcare'
        elif any(word in type_lower for word in ['education', 'school', 'training']):
            return 'education'
        elif any(word in type_lower for word in ['hospitality', 'hotel', 'restaurant']):
            return 'hospitality'
        elif any(word in type_lower for word in ['finance', 'bank', 'insurance']):
            return 'finance'
        elif any(word in type_lower for word in ['real estate', 'property']):
            return 'real_estate'
        elif any(word in type_lower for word in ['technology', 'software', 'it']):
            return 'technology'
        elif any(word in type_lower for word in ['agricult', 'farm', 'crop']):
            return 'agriculture'
        else:
            return 'services'

    def _extract_zone_from_address(self, address: Optional[str]) -> Optional[str]:
        """Extract zone information from address for Abuja-focused system"""
        if not address:
            return None

        address_lower = address.lower()

        # Abuja zones mapping
        zones = {
            'wuse': 'Wuse',
            'maitama': 'Maitama',
            'asokoro': 'Asokoro',
            'garki': 'Garki',
            'kuje': 'Kuje',
            'bwari': 'Bwari',
            'kwali': 'Kwali',
            'abaji': 'Abaji'
        }

        for zone_key, zone_name in zones.items():
            if zone_key in address_lower:
                return zone_name

        # Default to Central Business District if in Abuja
        if 'abuja' in address_lower or 'fct' in address_lower:
            return 'Central Business District'

        return None
