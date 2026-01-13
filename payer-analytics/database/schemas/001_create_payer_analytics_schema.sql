-- ===========================================
-- PAYER ANALYTICS DATABASE SCHEMA
-- ===========================================
-- This script creates the complete database schema for the AMAC payer analytics system
-- Run this against your PostgreSQL database

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ===========================================
-- 1. ENUM TYPES
-- ===========================================

-- Business categories aligned with AMAC revenue types
CREATE TYPE business_category AS ENUM (
    'retail', 'wholesale', 'manufacturing', 'services', 'construction',
    'transport', 'healthcare', 'education', 'hospitality', 'finance',
    'real_estate', 'technology', 'agriculture', 'entertainment', 'other'
);

-- Property types
CREATE TYPE property_type AS ENUM (
    'residential', 'commercial', 'industrial', 'mixed_use', 'vacant_land'
);

-- Data source types
CREATE TYPE data_source_type AS ENUM (
    'government', 'directory', 'social_media', 'api', 'manual', 'scraped'
);

-- Job status
CREATE TYPE job_status AS ENUM (
    'pending', 'running', 'completed', 'failed', 'cancelled'
);

-- ===========================================
-- 2. MAIN TABLES
-- ===========================================

-- Data sources table
CREATE TABLE data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    source_type data_source_type NOT NULL,
    url TEXT,
    api_key TEXT, -- For API-based sources
    reliability_score DECIMAL(3,2) DEFAULT 0.50 CHECK (reliability_score >= 0 AND reliability_score <= 1),
    last_scraped TIMESTAMP WITH TIME ZONE,
    scrape_frequency_hours INTEGER DEFAULT 24,
    is_active BOOLEAN DEFAULT true,
    config JSONB, -- Additional configuration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Main payers table
CREATE TABLE payers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    taxpayer_id VARCHAR(50), -- Link to AMAC system
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    business_name VARCHAR(255),
    business_type VARCHAR(100),
    business_category business_category,
    zone VARCHAR(100),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    estimated_income DECIMAL(15,2),
    property_value DECIMAL(15,2),
    business_size VARCHAR(50), -- small, medium, large
    data_source_id UUID REFERENCES data_sources(id),
    confidence_score DECIMAL(3,2) DEFAULT 0.50 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Full text search
    search_vector TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(business_name, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(address, '')), 'C')
    ) STORED
);

-- Additional contacts
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payer_id UUID NOT NULL REFERENCES payers(id) ON DELETE CASCADE,
    contact_type VARCHAR(50) NOT NULL, -- phone, email, address, website
    contact_value VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMP WITH TIME ZONE,
    source VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(payer_id, contact_type, contact_value)
);

-- Properties
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payer_id UUID NOT NULL REFERENCES payers(id) ON DELETE CASCADE,
    property_id VARCHAR(100) UNIQUE, -- AMAC property ID
    address TEXT NOT NULL,
    property_type property_type,
    zone VARCHAR(100),
    land_area DECIMAL(10,2), -- in square meters
    building_area DECIMAL(10,2), -- in square meters
    estimated_value DECIMAL(15,2),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    data_source_id UUID REFERENCES data_sources(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Full text search on address
    search_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(address, ''))
    ) STORED
);

-- Businesses
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payer_id UUID NOT NULL REFERENCES payers(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(100),
    category business_category,
    registration_number VARCHAR(100),
    employees_count INTEGER,
    annual_revenue DECIMAL(15,2),
    business_address TEXT,
    operating_hours JSONB, -- {"monday": "9:00-17:00", ...}
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, closed
    data_source_id UUID REFERENCES data_sources(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Full text search
    search_vector TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(business_name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(business_address, '')), 'B')
    ) STORED
);

-- Social media profiles
CREATE TABLE social_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payer_id UUID NOT NULL REFERENCES payers(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- facebook, twitter, instagram, linkedin
    username VARCHAR(255),
    profile_url TEXT,
    follower_count INTEGER,
    post_count INTEGER,
    last_active TIMESTAMP WITH TIME ZONE,
    verified BOOLEAN DEFAULT false,
    data_source_id UUID REFERENCES data_sources(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(payer_id, platform, username)
);

-- Payment history (links to AMAC system)
CREATE TABLE payment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payer_id UUID NOT NULL REFERENCES payers(id) ON DELETE CASCADE,
    revenue_type VARCHAR(100),
    amount DECIMAL(15,2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'paid', -- paid, overdue, pending
    notice_number VARCHAR(100),
    assessment_number VARCHAR(100),
    transaction_id VARCHAR(100),
    payment_method VARCHAR(50), -- cash, bank_transfer, online
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scraping jobs tracking
CREATE TABLE scraping_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_source_id UUID NOT NULL REFERENCES data_sources(id),
    job_type VARCHAR(50) DEFAULT 'full_scrape', -- full_scrape, update, targeted
    status job_status DEFAULT 'pending',
    records_processed INTEGER DEFAULT 0,
    records_added INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    config JSONB, -- Job-specific configuration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 3. INDEXES FOR PERFORMANCE
-- ===========================================

-- Payers table indexes
CREATE INDEX idx_payers_taxpayer_id ON payers(taxpayer_id);
CREATE INDEX idx_payers_zone ON payers(zone);
CREATE INDEX idx_payers_business_category ON payers(business_category);
CREATE INDEX idx_payers_data_source ON payers(data_source_id);
CREATE INDEX idx_payers_search_vector ON payers USING gin(search_vector);
CREATE INDEX idx_payers_location ON payers USING gist (point(longitude, latitude));

-- Contacts indexes
CREATE INDEX idx_contacts_payer_id ON contacts(payer_id);
CREATE INDEX idx_contacts_type_value ON contacts(contact_type, contact_value);

-- Properties indexes
CREATE INDEX idx_properties_payer_id ON properties(payer_id);
CREATE INDEX idx_properties_zone ON properties(zone);
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_search_vector ON properties USING gin(search_vector);
CREATE INDEX idx_properties_location ON properties USING gist (point(longitude, latitude));

-- Businesses indexes
CREATE INDEX idx_businesses_payer_id ON businesses(payer_id);
CREATE INDEX idx_businesses_category ON businesses(category);
CREATE INDEX idx_businesses_status ON businesses(status);
CREATE INDEX idx_businesses_search_vector ON businesses USING gin(search_vector);

-- Social profiles indexes
CREATE INDEX idx_social_profiles_payer_id ON social_profiles(payer_id);
CREATE INDEX idx_social_profiles_platform ON social_profiles(platform);

-- Payment history indexes
CREATE INDEX idx_payment_history_payer_id ON payment_history(payer_id);
CREATE INDEX idx_payment_history_date ON payment_history(payment_date);
CREATE INDEX idx_payment_history_status ON payment_history(status);
CREATE INDEX idx_payment_history_revenue_type ON payment_history(revenue_type);

-- Scraping jobs indexes
CREATE INDEX idx_scraping_jobs_data_source ON scraping_jobs(data_source_id);
CREATE INDEX idx_scraping_jobs_status ON scraping_jobs(status);
CREATE INDEX idx_scraping_jobs_created_at ON scraping_jobs(created_at DESC);

-- ===========================================
-- 4. VIEWS FOR ANALYTICS
-- ===========================================

-- Consolidated payer view
CREATE VIEW payer_summary AS
SELECT
    p.id,
    p.name,
    p.business_name,
    p.business_category,
    p.zone,
    p.estimated_income,
    p.confidence_score,
    p.last_updated,
    COUNT(DISTINCT pr.id) as property_count,
    COUNT(DISTINCT b.id) as business_count,
    COUNT(DISTINCT sp.id) as social_profiles_count,
    MAX(ph.payment_date) as last_payment_date,
    SUM(ph.amount) as total_paid_amount,
    COUNT(ph.id) as total_payments,
    ds.name as primary_data_source
FROM payers p
LEFT JOIN properties pr ON p.id = pr.payer_id
LEFT JOIN businesses b ON p.id = b.payer_id
LEFT JOIN social_profiles sp ON p.id = sp.payer_id
LEFT JOIN payment_history ph ON p.id = ph.payer_id
LEFT JOIN data_sources ds ON p.data_source_id = ds.id
GROUP BY p.id, p.name, p.business_name, p.business_category, p.zone,
         p.estimated_income, p.confidence_score, p.last_updated, ds.name;

-- Revenue analytics view
CREATE VIEW revenue_analytics AS
SELECT
    DATE_TRUNC('month', payment_date) as month,
    revenue_type,
    zone,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount,
    COUNT(DISTINCT payer_id) as unique_payers
FROM payment_history ph
JOIN payers p ON ph.payer_id = p.id
WHERE status = 'paid'
GROUP BY DATE_TRUNC('month', payment_date), revenue_type, zone
ORDER BY month DESC, total_amount DESC;

-- ===========================================
-- 5. FUNCTIONS AND TRIGGERS
-- ===========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_data_sources_updated_at BEFORE UPDATE ON data_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payers_updated_at BEFORE UPDATE ON payers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function for duplicate detection
CREATE OR REPLACE FUNCTION find_similar_payers(
    input_name TEXT,
    input_business_name TEXT DEFAULT NULL,
    input_phone TEXT DEFAULT NULL,
    similarity_threshold DECIMAL DEFAULT 0.8
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    business_name TEXT,
    phone TEXT,
    similarity_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.name,
        p.business_name,
        p.phone,
        GREATEST(
            similarity(lower(input_name), lower(p.name)),
            COALESCE(similarity(lower(input_business_name), lower(p.business_name)), 0),
            COALESCE(similarity(lower(input_phone), lower(p.phone)), 0)
        ) as similarity_score
    FROM payers p
    WHERE
        similarity(lower(input_name), lower(p.name)) > similarity_threshold
        OR (input_business_name IS NOT NULL AND similarity(lower(input_business_name), lower(p.business_name)) > similarity_threshold)
        OR (input_phone IS NOT NULL AND similarity(lower(input_phone), lower(p.phone)) > similarity_threshold)
    ORDER BY similarity_score DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- 6. INITIAL DATA SEEDING
-- ===========================================

-- Insert default data sources
INSERT INTO data_sources (name, source_type, url, reliability_score, description) VALUES
('Government Business Registry', 'government', 'https://www.cac.gov.ng', 0.95, 'Corporate Affairs Commission business registry'),
('AMAC Property Database', 'government', 'https://amac.abuja.gov.ng', 0.90, 'Abuja Municipal property records'),
('Yellow Pages Nigeria', 'directory', 'https://yellowpages.com.ng', 0.75, 'Business directory service'),
('Facebook Business', 'social_media', 'https://facebook.com', 0.70, 'Facebook business pages'),
('LinkedIn Company', 'social_media', 'https://linkedin.com', 0.80, 'LinkedIn company profiles'),
('Manual Entry', 'manual', NULL, 1.00, 'Manually entered data');

-- ===========================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ===========================================

-- Enable RLS on sensitive tables
ALTER TABLE payers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create policies (these would be customized based on your user roles)
-- For now, allow all operations (you'll want to restrict based on user roles)
CREATE POLICY "Allow all operations on payers" ON payers FOR ALL USING (true);
CREATE POLICY "Allow all operations on payment_history" ON payment_history FOR ALL USING (true);
CREATE POLICY "Allow all operations on contacts" ON contacts FOR ALL USING (true);

-- ===========================================
-- 8. COMMENTS FOR DOCUMENTATION
-- ===========================================

COMMENT ON TABLE payers IS 'Main taxpayer entities with business and contact information';
COMMENT ON TABLE properties IS 'Property ownership and location data';
COMMENT ON TABLE businesses IS 'Business registration and operational information';
COMMENT ON TABLE payment_history IS 'Revenue collection transaction history';
COMMENT ON TABLE data_sources IS 'Tracking data collection sources and reliability';
COMMENT ON TABLE scraping_jobs IS 'Web scraping job tracking and status';

COMMENT ON COLUMN payers.confidence_score IS 'Data quality score (0-1, higher is better)';
COMMENT ON COLUMN payers.search_vector IS 'Full text search index for name and business';
COMMENT ON COLUMN data_sources.reliability_score IS 'Source reliability score (0-1, higher is better)';

-- ===========================================
-- SCHEMA CREATION COMPLETE
-- ===========================================

-- Verify schema creation
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND table_name IN ('payers', 'properties', 'businesses', 'payment_history', 'data_sources');

    RAISE NOTICE 'Created % tables successfully', table_count;

    IF table_count < 5 THEN
        RAISE EXCEPTION 'Schema creation incomplete. Expected 5+ tables, got %', table_count;
    END IF;
END $$;
