"""
Data Processing Pipeline
Handles ETL operations for scraped payer data
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import asyncio
import re
import hashlib

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
import asyncpg

from database.models import Payer, Contact, Business, Property, DataSource
from config.settings import settings

logger = logging.getLogger(__name__)

class DataProcessor:
    """Processes and stores scraped payer data"""

    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session
        self.stats = {
            'processed': 0,
            'added': 0,
            'updated': 0,
            'duplicates': 0,
            'errors': 0
        }

    async def process_batch(
        self,
        raw_data: List[Dict[str, Any]],
        data_source_name: str
    ) -> Dict[str, Any]:
        """
        Process a batch of scraped data
        """
        logger.info(f"Processing batch of {len(raw_data)} records from {data_source_name}")

        # Get or create data source
        data_source = await self._get_or_create_data_source(data_source_name)

        for item in raw_data:
            try:
                await self._process_single_record(item, data_source)
                self.stats['processed'] += 1

            except Exception as e:
                logger.error(f"Error processing record {item.get('name', 'unknown')}: {e}")
                self.stats['errors'] += 1
                continue

        logger.info(f"Batch processing completed: {self.stats}")
        return self.stats.copy()

    async def _process_single_record(
        self,
        data: Dict[str, Any],
        data_source: DataSource
    ) -> None:
        """
        Process a single payer record
        """
        # Check for duplicates
        existing_payer = await self._find_existing_payer(data)

        if existing_payer:
            # Update existing record
            await self._update_payer(existing_payer, data, data_source)
            self.stats['updated'] += 1
        else:
            # Create new record
            await self._create_payer(data, data_source)
            self.stats['added'] += 1

    async def _find_existing_payer(self, data: Dict[str, Any]) -> Optional[Payer]:
        """
        Find existing payer using multiple matching strategies
        """
        name = data.get('name', '').strip()
        business_name = data.get('business_name', '').strip()
        phone = data.get('phone')
        address = data.get('address', '').strip() if data.get('address') else None

        if not name and not business_name:
            return None

        # Strategy 1: Exact phone match (most reliable)
        if phone:
            query = select(Payer).where(Payer.phone == phone)
            result = await self.db_session.execute(query)
            payer = result.scalar_one_or_none()
            if payer:
                return payer

        # Strategy 2: Business name similarity (for businesses)
        if business_name and len(business_name) > 3:
            # Use PostgreSQL's similarity function
            similarity_query = text("""
                SELECT id, name, business_name,
                       GREATEST(
                           similarity(lower(:business_name), lower(name)),
                           similarity(lower(:business_name), lower(business_name))
                       ) as sim_score
                FROM payers
                WHERE similarity(lower(:business_name), lower(name)) > 0.8
                   OR similarity(lower(:business_name), lower(business_name)) > 0.8
                ORDER BY sim_score DESC
                LIMIT 1
            """)

            result = await self.db_session.execute(
                similarity_query,
                {'business_name': business_name}
            )
            row = result.first()
            if row and row.sim_score > 0.8:
                query = select(Payer).where(Payer.id == row.id)
                result = await self.db_session.execute(query)
                return result.scalar_one_or_none()

        # Strategy 3: Name and address combination
        if name and address:
            # Create address hash for comparison
            address_hash = hashlib.md5(address.lower().encode()).hexdigest()
            query = select(Payer).where(
                func.lower(Payer.name) == name.lower(),
                func.md5(func.lower(Payer.address)) == address_hash
            )
            result = await self.db_session.execute(query)
            payer = result.scalar_one_or_none()
            if payer:
                return payer

        return None

    async def _create_payer(
        self,
        data: Dict[str, Any],
        data_source: DataSource
    ) -> Payer:
        """
        Create a new payer record
        """
        # Clean and validate data
        cleaned_data = self._clean_payer_data(data)

        # Create payer
        payer = Payer(
            taxpayer_id=cleaned_data.get('taxpayer_id'),
            name=cleaned_data['name'],
            phone=cleaned_data.get('phone'),
            email=cleaned_data.get('email'),
            address=cleaned_data.get('address'),
            business_name=cleaned_data.get('business_name'),
            business_type=cleaned_data.get('business_type'),
            business_category=cleaned_data.get('business_category'),
            zone=cleaned_data.get('zone'),
            latitude=cleaned_data.get('latitude'),
            longitude=cleaned_data.get('longitude'),
            estimated_income=cleaned_data.get('estimated_income'),
            property_value=cleaned_data.get('property_value'),
            business_size=cleaned_data.get('business_size'),
            data_source_id=data_source.id,
            confidence_score=cleaned_data.get('confidence_score', 0.5),
            last_updated=datetime.utcnow()
        )

        self.db_session.add(payer)
        await self.db_session.flush()  # Get the ID

        # Create related records
        await self._create_related_records(payer, cleaned_data, data_source)

        await self.db_session.commit()
        logger.debug(f"Created new payer: {payer.name}")

        return payer

    async def _update_payer(
        self,
        existing_payer: Payer,
        new_data: Dict[str, Any],
        data_source: DataSource
    ) -> None:
        """
        Update existing payer with new information
        """
        cleaned_data = self._clean_payer_data(new_data)

        # Update fields if new data is available and confidence is higher
        new_confidence = cleaned_data.get('confidence_score', 0.5)
        current_confidence = existing_payer.confidence_score or 0.5

        if new_confidence > current_confidence:
            # Update core information
            update_fields = [
                'phone', 'email', 'address', 'business_name',
                'business_type', 'business_category', 'zone',
                'latitude', 'longitude', 'estimated_income',
                'property_value', 'business_size'
            ]

            for field in update_fields:
                if cleaned_data.get(field) and not getattr(existing_payer, field):
                    setattr(existing_payer, field, cleaned_data[field])

            existing_payer.confidence_score = max(current_confidence, new_confidence)
            existing_payer.last_updated = datetime.utcnow()

        # Update data source if more reliable
        if data_source.reliability_score > (existing_payer.data_source.reliability_score if existing_payer.data_source else 0):
            existing_payer.data_source_id = data_source.id

        # Add new contact information
        await self._create_related_records(existing_payer, cleaned_data, data_source)

        await self.db_session.commit()
        logger.debug(f"Updated existing payer: {existing_payer.name}")

    async def _create_related_records(
        self,
        payer: Payer,
        data: Dict[str, Any],
        data_source: DataSource
    ) -> None:
        """
        Create related records (contacts, businesses, properties)
        """
        # Create additional contacts
        if data.get('phone') and not await self._contact_exists(payer.id, 'phone', data['phone']):
            contact = Contact(
                payer_id=payer.id,
                contact_type='phone',
                contact_value=data['phone'],
                is_primary=True,
                source=data_source.name
            )
            self.db_session.add(contact)

        if data.get('email') and not await self._contact_exists(payer.id, 'email', data['email']):
            contact = Contact(
                payer_id=payer.id,
                contact_type='email',
                contact_value=data['email'],
                source=data_source.name
            )
            self.db_session.add(contact)

        if data.get('website') and not await self._contact_exists(payer.id, 'website', data['website']):
            contact = Contact(
                payer_id=payer.id,
                contact_type='website',
                contact_value=data['website'],
                source=data_source.name
            )
            self.db_session.add(contact)

        # Create business record if business data exists
        if data.get('business_name') or payer.business_name:
            business_name = data.get('business_name') or payer.business_name

            # Check if business already exists
            query = select(Business).where(
                Business.payer_id == payer.id,
                func.lower(Business.business_name) == business_name.lower()
            )
            result = await self.db_session.execute(query)
            existing_business = result.scalar_one_or_none()

            if not existing_business:
                business = Business(
                    payer_id=payer.id,
                    business_name=business_name,
                    business_type=data.get('business_type') or payer.business_type,
                    category=data.get('business_category') or payer.business_category,
                    registration_number=data.get('registration_number'),
                    employees_count=data.get('employees_count'),
                    annual_revenue=data.get('annual_revenue'),
                    business_address=data.get('business_address') or payer.address,
                    operating_hours=data.get('operating_hours'),
                    status='active',
                    data_source_id=data_source.id
                )
                self.db_session.add(business)

        # Create property record if property data exists
        if data.get('property_address') or data.get('property_id'):
            property_data = {
                'property_id': data.get('property_id'),
                'address': data.get('property_address') or payer.address,
                'property_type': data.get('property_type'),
                'zone': data.get('zone') or payer.zone,
                'land_area': data.get('land_area'),
                'building_area': data.get('building_area'),
                'estimated_value': data.get('property_value') or payer.property_value,
                'latitude': data.get('latitude') or payer.latitude,
                'longitude': data.get('longitude') or payer.longitude
            }

            # Check if property already exists
            query = select(Property).where(
                Property.payer_id == payer.id,
                func.lower(Property.address) == property_data['address'].lower()
            )
            result = await self.db_session.execute(query)
            existing_property = result.scalar_one_or_none()

            if not existing_property:
                property_record = Property(
                    payer_id=payer.id,
                    **{k: v for k, v in property_data.items() if v is not None},
                    data_source_id=data_source.id
                )
                self.db_session.add(property_record)

    async def _contact_exists(self, payer_id: str, contact_type: str, contact_value: str) -> bool:
        """Check if contact already exists"""
        query = select(Contact).where(
            Contact.payer_id == payer_id,
            Contact.contact_type == contact_type,
            func.lower(Contact.contact_value) == contact_value.lower()
        )
        result = await self.db_session.execute(query)
        return result.scalar_one_or_none() is not None

    def _clean_payer_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Clean and validate payer data
        """
        cleaned = {}

        # Clean strings
        string_fields = [
            'name', 'business_name', 'business_type', 'address',
            'phone', 'email', 'website', 'zone', 'business_size'
        ]

        for field in string_fields:
            value = data.get(field)
            if value:
                cleaned[field] = str(value).strip()
                if field == 'email':
                    cleaned[field] = cleaned[field].lower()

        # Clean business category
        if data.get('business_category'):
            cleaned['business_category'] = str(data['business_category']).lower()

        # Clean numeric fields
        numeric_fields = [
            'estimated_income', 'property_value', 'latitude', 'longitude'
        ]

        for field in numeric_fields:
            value = data.get(field)
            if value is not None:
                try:
                    cleaned[field] = float(value)
                except (ValueError, TypeError):
                    pass

        # Copy other fields as-is
        other_fields = ['taxpayer_id', 'registration_number', 'confidence_score']
        for field in other_fields:
            if data.get(field) is not None:
                cleaned[field] = data[field]

        return cleaned

    async def _get_or_create_data_source(self, source_name: str) -> DataSource:
        """Get or create data source record"""
        query = select(DataSource).where(DataSource.name == source_name)
        result = await self.db_session.execute(query)
        data_source = result.scalar_one_or_none()

        if not data_source:
            # Create new data source
            data_source = DataSource(
                name=source_name,
                source_type='scraped',
                reliability_score=0.75,  # Default reliability
                last_scraped=datetime.utcnow()
            )
            self.db_session.add(data_source)
            await self.db_session.flush()

        return data_source

    async def get_processing_stats(self) -> Dict[str, int]:
        """Get processing statistics"""
        return self.stats.copy()
