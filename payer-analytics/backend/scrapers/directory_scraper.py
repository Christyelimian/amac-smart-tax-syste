"""
Business Directory Scraper
Scrapes business data from online business directories
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional
from urllib.parse import urlencode, urljoin
import re
import json

from bs4 import BeautifulSoup
from scrapers.base_scraper import BaseScraper

logger = logging.getLogger(__name__)

class DirectoryScraper(BaseScraper):
    """Scraper for online business directories"""

    def __init__(self, directory_name: str = "Yellow Pages Nigeria"):
        super().__init__(
            name=directory_name,
            source_url="https://yellowpages.com.ng",
            source_type="directory"
        )
        self.base_url = "https://yellowpages.com.ng"
        self.search_url = f"{self.base_url}/search"

    async def scrape(self) -> List[Dict[str, Any]]:
        """
        Main scraping method for business directory data
        """
        logger.info(f"Starting {self.name} directory scraping")

        all_businesses = []

        try:
            # Define search categories relevant to AMAC revenue
            categories = [
                "Construction", "Real Estate", "Manufacturing",
                "Retail Trade", "Wholesale Trade", "Transportation",
                "Hotels", "Restaurants", "Healthcare", "Education",
                "Financial Services", "Technology", "Agriculture"
            ]

            for category in categories:
                logger.info(f"Scraping category: {category}")
                category_businesses = await self._scrape_category(category)
                all_businesses.extend(category_businesses)

                # Rate limiting between categories
                await asyncio.sleep(3)

            # Also scrape general business listings
            general_businesses = await self._scrape_general_listings()
            all_businesses.extend(general_businesses)

            logger.info(f"Collected {len(all_businesses)} businesses from {self.name}")
            return all_businesses

        except Exception as e:
            logger.error(f"Error scraping {self.name}: {e}")
            raise

    async def _scrape_category(self, category: str) -> List[Dict[str, Any]]:
        """Scrape businesses from a specific category"""
        businesses = []

        try:
            # Construct search URL
            params = {
                'category': category,
                'location': 'Abuja'  # Focus on Abuja area
            }
            search_url = f"{self.search_url}?{urlencode(params)}"

            page = 1
            max_pages = 10  # Limit to avoid infinite scraping

            while page <= max_pages:
                page_url = f"{search_url}&page={page}"
                logger.debug(f"Scraping page {page}: {page_url}")

                response = await self.make_request(page_url)
                html_content = await response.text()

                page_businesses = self._parse_search_results(html_content, category)
                businesses.extend(page_businesses)

                # Check if there are more pages
                if not self._has_next_page(html_content):
                    break

                page += 1
                await asyncio.sleep(2)  # Rate limiting

            logger.info(f"Scraped {len(businesses)} businesses in category '{category}'")

        except Exception as e:
            logger.error(f"Error scraping category {category}: {e}")

        return businesses

    async def _scrape_general_listings(self) -> List[Dict[str, Any]]:
        """Scrape general business listings"""
        businesses = []

        try:
            # Scrape featured/popular businesses
            featured_url = f"{self.base_url}/featured-businesses"
            response = await self.make_request(featured_url)
            html_content = await response.text()

            businesses.extend(self._parse_business_listings(html_content, "featured"))

        except Exception as e:
            logger.error(f"Error scraping general listings: {e}")

        return businesses

    def _parse_search_results(self, html_content: str, category: str) -> List[Dict[str, Any]]:
        """Parse search results page"""
        businesses = []

        try:
            soup = BeautifulSoup(html_content, 'html.parser')

            # Find business listing elements (adjust selectors based on actual site)
            business_cards = soup.find_all('div', class_=re.compile(r'business-card|listing-item'))

            for card in business_cards:
                business_data = self._parse_business_card(card, category)
                if business_data:
                    businesses.append(business_data)

        except Exception as e:
            logger.error(f"Error parsing search results: {e}")

        return businesses

    def _parse_business_listings(self, html_content: str, list_type: str) -> List[Dict[str, Any]]:
        """Parse general business listings"""
        businesses = []

        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            business_cards = soup.find_all('div', class_=re.compile(r'business|listing'))

            for card in business_cards:
                business_data = self._parse_business_card(card, list_type)
                if business_data:
                    businesses.append(business_data)

        except Exception as e:
            logger.error(f"Error parsing {list_type} listings: {e}")

        return businesses

    def _parse_business_card(self, card, category: str) -> Optional[Dict[str, Any]]:
        """Parse individual business card element"""
        try:
            # Extract business information
            name_elem = card.find('h3', class_=re.compile(r'name|title')) or \
                       card.find('a', class_=re.compile(r'business-name'))

            if not name_elem:
                return None

            name = name_elem.get_text(strip=True)

            # Extract other details
            address_elem = card.find('div', class_=re.compile(r'address|location'))
            phone_elem = card.find('span', class_=re.compile(r'phone|contact'))
            category_elem = card.find('span', class_=re.compile(r'category|type'))
            website_elem = card.find('a', class_=re.compile(r'website|web'))

            business = {
                "name": name,
                "business_name": name,
                "business_type": category_elem.get_text(strip=True) if category_elem else category,
                "address": address_elem.get_text(strip=True) if address_elem else None,
                "phone": phone_elem.get_text(strip=True) if phone_elem else None,
                "website": website_elem.get('href') if website_elem else None,
                "source_url": urljoin(self.base_url, name_elem.get('href')) if name_elem.get('href') else self.base_url,
                "confidence_score": 0.75  # Directory data is generally reliable
            }

            return business

        except Exception as e:
            logger.error(f"Error parsing business card: {e}")
            return None

    def _has_next_page(self, html_content: str) -> bool:
        """Check if there are more pages to scrape"""
        try:
            soup = BeautifulSoup(html_content, 'html.parser')

            # Look for next page link or pagination
            next_link = soup.find('a', text=re.compile(r'next|>|»', re.IGNORECASE))
            next_button = soup.find('button', text=re.compile(r'next|>', re.IGNORECASE))

            return bool(next_link or next_button)

        except Exception:
            return False

    def parse_data(self, raw_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Parse raw scraped data into standardized format
        """
        parsed_businesses = []

        for item in raw_data:
            try:
                parsed_business = {
                    "name": item.get("name", "").strip(),
                    "business_name": item.get("business_name", "").strip(),
                    "business_type": item.get("business_type", "General Business"),
                    "address": item.get("address", "").strip() if item.get("address") else None,
                    "phone": self._normalize_phone(item.get("phone")),
                    "email": None,  # Directories rarely have emails
                    "website": item.get("website"),
                    "business_category": self._categorize_business(item.get("business_type", "")),
                    "zone": self._extract_zone_from_address(item.get("address")),
                    "data_source": self.name,
                    "confidence_score": item.get("confidence_score", 0.75),
                    "raw_data": item
                }

                if parsed_business["name"]:
                    parsed_businesses.append(parsed_business)

            except Exception as e:
                logger.error(f"Error parsing directory business data: {e}")
                continue

        logger.info(f"Parsed {len(parsed_businesses)} businesses from directory data")
        return parsed_businesses

    def _normalize_phone(self, phone: Optional[str]) -> Optional[str]:
        """Normalize phone number format"""
        if not phone:
            return None

        # Clean the phone number
        cleaned = re.sub(r'[^\d+]', '', phone.strip())

        # Handle Nigerian numbers
        if cleaned.startswith('0') and len(cleaned) == 11:
            cleaned = '+234' + cleaned[1:]
        elif cleaned.startswith('234') and not cleaned.startswith('+'):
            cleaned = '+' + cleaned

        return cleaned

    def _categorize_business(self, business_type: str) -> str:
        """Categorize business type"""
        type_lower = business_type.lower()

        # Enhanced mapping for directory categories
        category_mappings = {
            'retail': ['retail', 'shop', 'store', 'supermarket', 'mall'],
            'manufacturing': ['manufactur', 'production', 'factory', 'industrial'],
            'construction': ['construct', 'building', 'engineering', 'contractor'],
            'transport': ['transport', 'logistics', 'delivery', 'taxi', 'bus'],
            'healthcare': ['health', 'medical', 'hospital', 'clinic', 'pharmacy'],
            'education': ['education', 'school', 'training', 'college', 'university'],
            'hospitality': ['hotel', 'restaurant', 'bar', 'lodging', 'hospitality'],
            'finance': ['finance', 'bank', 'insurance', 'accounting', 'financial'],
            'real_estate': ['real estate', 'property', 'housing', 'estate'],
            'technology': ['technology', 'software', 'computer', 'it', 'tech'],
            'agriculture': ['agricult', 'farm', 'crop', 'livestock', 'farming'],
            'wholesale': ['wholesale', 'distribution', 'supplier'],
            'services': ['services', 'consulting', 'professional']
        }

        for category, keywords in category_mappings.items():
            if any(keyword in type_lower for keyword in keywords):
                return category

        return 'services'  # Default category

    def _extract_zone_from_address(self, address: Optional[str]) -> Optional[str]:
        """Extract zone information from address"""
        if not address:
            return None

        address_lower = address.lower()

        # Abuja zones
        zones = {
            'wuse': 'Wuse',
            'maitama': 'Maitama',
            'asokoro': 'Asokoro',
            'garki': 'Garki',
            'kuje': 'Kuje',
            'bwari': 'Bwari',
            'kwali': 'Kwali',
            'abaji': 'Abaji',
            'central business district': 'Central Business District',
            'cbd': 'Central Business District'
        }

        for zone_key, zone_name in zones.items():
            if zone_key in address_lower:
                return zone_name

        # Check for general Abuja reference
        if 'abuja' in address_lower or 'fct' in address_lower:
            return 'Central Business District'

        return None
