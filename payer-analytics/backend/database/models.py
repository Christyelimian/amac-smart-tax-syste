"""
Database models for Payer Analytics
"""

from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, Integer, String, DateTime, Text, Float, Boolean, ForeignKey, JSON, UUID
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship, DeclarativeBase
import uuid

class Base(DeclarativeBase):
    """Base class for all models"""
    pass

class Payer(Base):
    """Main payer entity"""
    __tablename__ = "payers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    taxpayer_id = Column(String(50), unique=True, nullable=True)  # Link to AMAC system
    name = Column(String(255), nullable=False)
    phone = Column(String(20))
    email = Column(String(255))
    address = Column(Text)
    business_name = Column(String(255))
    business_type = Column(String(100))
    business_category = Column(String(100))
    zone = Column(String(100))
    latitude = Column(Float)
    longitude = Column(Float)

    # Financial data
    estimated_income = Column(Float)
    property_value = Column(Float)
    business_size = Column(String(50))  # small, medium, large

    # Metadata
    data_source = Column(String(100), nullable=False)
    confidence_score = Column(Float, default=0.5)
    last_updated = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    contacts = relationship("Contact", back_populates="payer")
    properties = relationship("Property", back_populates="payer")
    businesses = relationship("Business", back_populates="payer")
    social_profiles = relationship("SocialProfile", back_populates="payer")
    payment_history = relationship("PaymentHistory", back_populates="payer")

class Contact(Base):
    """Additional contact information"""
    __tablename__ = "contacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    payer_id = Column(UUID(as_uuid=True), ForeignKey("payers.id"))
    contact_type = Column(String(50))  # phone, email, address
    contact_value = Column(String(255), nullable=False)
    is_primary = Column(Boolean, default=False)
    verified = Column(Boolean, default=False)
    source = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    payer = relationship("Payer", back_populates="contacts")

class Property(Base):
    """Property information"""
    __tablename__ = "properties"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    payer_id = Column(UUID(as_uuid=True), ForeignKey("payers.id"))
    property_id = Column(String(100), unique=True)
    address = Column(Text, nullable=False)
    property_type = Column(String(100))  # residential, commercial, industrial
    zone = Column(String(100))
    land_area = Column(Float)  # in square meters
    building_area = Column(Float)  # in square meters
    estimated_value = Column(Float)
    latitude = Column(Float)
    longitude = Column(Float)
    data_source = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    payer = relationship("Payer", back_populates="properties")

class Business(Base):
    """Business information"""
    __tablename__ = "businesses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    payer_id = Column(UUID(as_uuid=True), ForeignKey("payers.id"))
    business_name = Column(String(255), nullable=False)
    business_type = Column(String(100))
    category = Column(String(100))
    registration_number = Column(String(100))
    employees_count = Column(Integer)
    annual_revenue = Column(Float)
    business_address = Column(Text)
    operating_hours = Column(JSONB)  # JSON object with day/time info
    status = Column(String(50))  # active, inactive, closed
    data_source = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    payer = relationship("Payer", back_populates="businesses")

class SocialProfile(Base):
    """Social media and online presence"""
    __tablename__ = "social_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    payer_id = Column(UUID(as_uuid=True), ForeignKey("payers.id"))
    platform = Column(String(50))  # facebook, twitter, instagram, linkedin
    username = Column(String(255))
    profile_url = Column(Text)
    follower_count = Column(Integer)
    post_count = Column(Integer)
    last_active = Column(DateTime)
    verified = Column(Boolean, default=False)
    data_source = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    payer = relationship("Payer", back_populates="social_profiles")

class PaymentHistory(Base):
    """Payment history and patterns"""
    __tablename__ = "payment_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    payer_id = Column(UUID(as_uuid=True), ForeignKey("payers.id"))
    revenue_type = Column(String(100))
    amount = Column(Float, nullable=False)
    payment_date = Column(DateTime, nullable=False)
    due_date = Column(DateTime)
    status = Column(String(50))  # paid, overdue, pending
    notice_number = Column(String(100))
    assessment_number = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    payer = relationship("Payer", back_populates="payment_history")

class DataSource(Base):
    """Tracking data sources and their reliability"""
    __tablename__ = "data_sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    source_type = Column(String(50))  # government, directory, social, scraped
    url = Column(Text)
    reliability_score = Column(Float, default=0.5)
    last_scraped = Column(DateTime)
    scrape_frequency_hours = Column(Integer, default=24)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ScrapingJob(Base):
    """Tracking scraping jobs and their status"""
    __tablename__ = "scraping_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    data_source_id = Column(UUID(as_uuid=True), ForeignKey("data_sources.id"))
    job_type = Column(String(50))  # full_scrape, update, targeted
    status = Column(String(50))  # pending, running, completed, failed
    records_processed = Column(Integer, default=0)
    records_added = Column(Integer, default=0)
    records_updated = Column(Integer, default=0)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
