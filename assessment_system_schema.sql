-- ===========================================
-- ASSESSMENT SYSTEM SCHEMA REDESIGN
-- ===========================================
-- This script adds the assessment-first architecture to the existing AMAC system
-- Run this after comprehensive_database_fix.sql

-- ===========================================
-- 1. ASSESSMENTS TABLE (CORE TABLE)
-- ===========================================

CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_number TEXT UNIQUE NOT NULL, -- ASS-2026-001234

  -- Links
  taxpayer_id UUID REFERENCES public.profiles(id),
  revenue_type_code TEXT REFERENCES public.revenue_types(code) NOT NULL,
  zone_id TEXT REFERENCES public.zones(id) NOT NULL,

  -- Assessment details (varies by revenue type)
  assessment_data JSONB NOT NULL, -- Stores all assessment inputs

  -- Calculation results
  assessed_amount DECIMAL(15,2) NOT NULL,
  calculation_method TEXT CHECK (calculation_method IN ('formula_based', 'manual', 'ai_assisted', 'spot_assessment')),
  calculation_details JSONB, -- Shows how amount was derived

  -- Assessment metadata
  assessed_by UUID REFERENCES auth.users(id), -- Admin who did assessment
  assessment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_from DATE,
  valid_until DATE, -- For annual licenses

  -- Status tracking
  status TEXT CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'paid', 'overdue')) DEFAULT 'pending',

  -- Demand notice (generated after assessment)
  demand_notice_number TEXT UNIQUE, -- DN-2026-001234 (set when demand notice is generated)
  demand_notice_issued_at TIMESTAMPTZ,
  demand_notice_pdf_url TEXT,
  qr_code_url TEXT, -- For easy payment

  -- Notes and tracking
  notes TEXT,
  internal_notes TEXT,
  site_inspection_required BOOLEAN DEFAULT false,
  site_inspection_completed BOOLEAN DEFAULT false,
  site_inspection_date DATE,

  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS assessments_taxpayer_idx ON public.assessments(taxpayer_id);
CREATE INDEX IF NOT EXISTS assessments_revenue_type_idx ON public.assessments(revenue_type_code);
CREATE INDEX IF NOT EXISTS assessments_zone_idx ON public.assessments(zone_id);
CREATE INDEX IF NOT EXISTS assessments_status_idx ON public.assessments(status);
CREATE INDEX IF NOT EXISTS assessments_demand_notice_idx ON public.assessments(demand_notice_number);

-- ===========================================
-- 2. DEMAND NOTICES TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.demand_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_number TEXT UNIQUE NOT NULL, -- DN-2026-001234
  assessment_id UUID REFERENCES public.assessments(id) NOT NULL,

  -- Links for quick access
  taxpayer_id UUID REFERENCES public.profiles(id) NOT NULL,
  revenue_type_code TEXT REFERENCES public.revenue_types(code) NOT NULL,
  zone_id TEXT REFERENCES public.zones(id) NOT NULL,

  -- Payment details
  amount_due DECIMAL(15,2) NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,

  -- Payment tracking (linked to payments table)
  payment_id UUID REFERENCES public.payments(id), -- Links to actual payment record
  amount_paid DECIMAL(15,2) DEFAULT 0,
  payment_status TEXT CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'overdue')) DEFAULT 'unpaid',
  paid_at TIMESTAMPTZ,

  -- Delivery tracking
  sent_via_email BOOLEAN DEFAULT false,
  sent_via_sms BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  sms_sent_at TIMESTAMPTZ,

  -- Additional details
  reminder_count INTEGER DEFAULT 0,
  last_reminder_sent_at TIMESTAMPTZ,

  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS demand_notices_assessment_idx ON public.demand_notices(assessment_id);
CREATE INDEX IF NOT EXISTS demand_notices_taxpayer_idx ON public.demand_notices(taxpayer_id);
CREATE INDEX IF NOT EXISTS demand_notices_payment_status_idx ON public.demand_notices(payment_status);
CREATE INDEX IF NOT EXISTS demand_notices_due_date_idx ON public.demand_notices(due_date);

-- ===========================================
-- 3. ASSESSMENT FORMULAS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.assessment_formulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenue_type_code TEXT REFERENCES public.revenue_types(code) NOT NULL,
  zone_id TEXT REFERENCES public.zones(id), -- NULL means applies to all zones

  -- Formula definition
  formula_type TEXT CHECK (formula_type IN ('fixed', 'calculated', 'tiered', 'ai_assisted')) NOT NULL,
  base_amount DECIMAL(15,2),
  formula_expression TEXT, -- e.g., "base + (rooms * room_rate) + category_premium"

  -- Input requirements (what assessor needs to collect)
  required_inputs JSONB, -- Defines form fields needed

  -- Rate tables for calculations
  rate_table JSONB, -- Stores rate tables for tiered pricing

  -- AI configuration (for ai_assisted formulas)
  ai_prompt_template TEXT,
  ai_model TEXT DEFAULT 'claude-sonnet-4-20250514',
  ai_temperature DECIMAL(2,1) DEFAULT 0.1,

  -- Validity period
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_until DATE,

  -- Status
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,

  -- Audit trail
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS assessment_formulas_revenue_type_idx ON public.assessment_formulas(revenue_type_code);
CREATE INDEX IF NOT EXISTS assessment_formulas_zone_idx ON public.assessment_formulas(zone_id);
CREATE INDEX IF NOT EXISTS assessment_formulas_active_idx ON public.assessment_formulas(is_active, effective_from, effective_until);

-- ===========================================
-- 4. UPDATE PAYMENTS TABLE LINKS
-- ===========================================

-- Add assessment and demand notice links to payments
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS assessment_id UUID REFERENCES public.assessments(id),
  ADD COLUMN IF NOT EXISTS demand_notice_id UUID REFERENCES public.demand_notices(id),
  ADD COLUMN IF NOT EXISTS payment_type TEXT CHECK (payment_type IN ('assessed', 'voluntary', 'penalty')) DEFAULT 'assessed';

-- Add indexes for the new payment links
CREATE INDEX IF NOT EXISTS payments_assessment_idx ON public.payments(assessment_id);
CREATE INDEX IF NOT EXISTS payments_demand_notice_idx ON public.payments(demand_notice_id);

-- ===========================================
-- 5. APPLICATIONS TABLE (for assessment requests)
-- ===========================================

CREATE TABLE IF NOT EXISTS public.assessment_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number TEXT UNIQUE NOT NULL, -- APP-2026-001234

  -- Applicant details
  taxpayer_id UUID REFERENCES public.profiles(id),
  applicant_name TEXT NOT NULL,
  applicant_phone TEXT NOT NULL,
  applicant_email TEXT,

  -- Application details
  revenue_type_code TEXT REFERENCES public.revenue_types(code) NOT NULL,
  zone_id TEXT REFERENCES public.zones(id),
  application_data JSONB NOT NULL, -- Form responses

  -- Documents
  supporting_documents JSONB, -- Array of uploaded document URLs/metadata

  -- Status tracking
  status TEXT CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'assessment_completed')) DEFAULT 'draft',

  -- Links to assessment (once created)
  assessment_id UUID REFERENCES public.assessments(id),

  -- Processing
  submitted_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS assessment_applications_taxpayer_idx ON public.assessment_applications(taxpayer_id);
CREATE INDEX IF NOT EXISTS assessment_applications_status_idx ON public.assessment_applications(status);
CREATE INDEX IF NOT EXISTS assessment_applications_revenue_type_idx ON public.assessment_applications(revenue_type_code);

-- ===========================================
-- 6. SAMPLE FORMULAS INSERTION
-- ===========================================

-- Insert sample formulas for common revenue types
INSERT INTO public.assessment_formulas (
  revenue_type_code, zone_id, formula_type, base_amount, formula_expression,
  required_inputs, rate_table, ai_prompt_template
) VALUES
-- Hotel License
('hotel-license', 'a', 'calculated', 100000, 'base + (rooms * room_rate) + category_premium',
 '{
   "hotel_category": {
     "type": "select",
     "label": "Hotel Category",
     "options": ["5-star", "4-star", "3-star", "2-star", "budget"],
     "required": true
   },
   "total_rooms": {
     "type": "number",
     "label": "Total Number of Rooms",
     "min": 1,
     "required": true
   },
   "property_size_sqm": {
     "type": "number",
     "label": "Property Size (sqm)",
     "min": 1,
     "required": false
   },
   "annual_turnover_estimate": {
     "type": "number",
     "label": "Annual Turnover Estimate",
     "required": false
   }
 }',
 '{
   "room_rate": 1500,
   "category_premium": {
     "5-star": 200000,
     "4-star": 150000,
     "3-star": 100000,
     "2-star": 50000,
     "budget": 0
   }
 }',
 NULL
),
-- Tenement Rate (Property Tax)
('property-tax', 'a', 'calculated', 0, 'size * rate_per_sqm * zone_multiplier * type_multiplier',
 '{
   "property_size_sqm": {
     "type": "number",
     "label": "Property Size (sqm)",
     "min": 1,
     "required": true
   },
   "property_type": {
     "type": "select",
     "label": "Property Type",
     "options": ["residential", "commercial", "industrial"],
     "required": true
   },
   "num_rooms": {
     "type": "number",
     "label": "Number of Rooms/Units",
     "min": 1,
     "required": false
   },
   "property_address": {
     "type": "text",
     "label": "Property Address",
     "required": true
   }
 }',
 '{
   "rate_per_sqm": 50,
   "zone_multiplier": {
     "a": 1.5,
     "b": 1.2,
     "c": 1.0,
     "d": 0.8
   },
   "type_multiplier": {
     "residential": 1.0,
     "commercial": 2.0,
     "industrial": 1.5
   }
 }',
 NULL
),
-- Market Stall
('market-stall', 'a', 'calculated', 2000, 'base + (size * rate) + location_premium',
 '{
   "stall_size_sqm": {
     "type": "number",
     "label": "Stall Size (sqm)",
     "min": 1,
     "required": true
   },
   "location_type": {
     "type": "select",
     "label": "Location Type",
     "options": ["prime", "regular", "corner"],
     "required": true
   },
   "market_name": {
     "type": "text",
     "label": "Market Name",
     "required": true
   },
   "business_type": {
     "type": "select",
     "label": "Business Type",
     "options": ["food", "clothing", "electronics", "general"],
     "required": false
   }
 }',
 '{
   "rate": 300,
   "location_premium": {
     "prime": 1500,
     "regular": 500,
     "corner": 1000
   }
 }',
 NULL
),
-- Motorcycle Permit (Fixed)
('motorcycle-permit', NULL, 'fixed', 15000, 'base',
 '{}',
 '{}',
 NULL
)
ON CONFLICT DO NOTHING;

-- ===========================================
-- 7. RLS POLICIES
-- ===========================================

-- Assessments: Public can create applications, admins can manage assessments
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Assessment applications: Anyone can create, taxpayers can view their own, admins can view all
ALTER TABLE public.assessment_applications ENABLE ROW LEVEL SECURITY;

-- Demand notices: Taxpayers can view their own, admins can manage all
ALTER TABLE public.demand_notices ENABLE ROW LEVEL SECURITY;

-- Assessment formulas: Public read access, admins can modify
ALTER TABLE public.assessment_formulas ENABLE ROW LEVEL SECURITY;

-- Policies for assessments
CREATE POLICY "Admins can manage assessments" ON public.assessments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'auditor')
  )
);

CREATE POLICY "Taxpayers can view their own assessments" ON public.assessments
FOR SELECT USING (taxpayer_id = auth.uid());

-- Policies for assessment applications
CREATE POLICY "Anyone can create assessment applications" ON public.assessment_applications
FOR INSERT WITH CHECK (true);

CREATE POLICY "Taxpayers can view their own applications" ON public.assessment_applications
FOR SELECT USING (taxpayer_id = auth.uid());

CREATE POLICY "Admins can manage all applications" ON public.assessment_applications
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Policies for demand notices
CREATE POLICY "Admins can manage demand notices" ON public.demand_notices
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'auditor')
  )
);

CREATE POLICY "Taxpayers can view their own demand notices" ON public.demand_notices
FOR SELECT USING (taxpayer_id = auth.uid());

-- Policies for assessment formulas
CREATE POLICY "Public can read assessment formulas" ON public.assessment_formulas
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage assessment formulas" ON public.assessment_formulas
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- ===========================================
-- 7. BUSINESS/PROPERTY REGISTRY TABLE
-- ===========================================

-- Table to track individual businesses/properties per taxpayer
CREATE TABLE IF NOT EXISTS public.business_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxpayer_id UUID REFERENCES public.profiles(id) NOT NULL,

  -- Business/Property identification
  business_name TEXT,
  property_address TEXT,
  business_registration_number TEXT, -- CAC/RC number
  property_type TEXT CHECK (property_type IN ('residential', 'commercial', 'industrial', 'mixed_use')),

  -- Assessment tracking
  current_assessment_id UUID REFERENCES public.assessments(id),
  current_demand_notice_id UUID REFERENCES public.demand_notices(id),

  -- Status
  status TEXT CHECK (status IN ('active', 'inactive', 'under_assessment')) DEFAULT 'active',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique business per taxpayer (optional - comment out if one taxpayer can have multiple same-named businesses)
  UNIQUE(taxpayer_id, business_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS business_properties_taxpayer_idx ON public.business_properties(taxpayer_id);
CREATE INDEX IF NOT EXISTS business_properties_assessment_idx ON public.business_properties(current_assessment_id);
CREATE INDEX IF NOT EXISTS business_properties_demand_notice_idx ON public.business_properties(current_demand_notice_id);

-- Update assessments to optionally link to specific business/property
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS business_property_id UUID REFERENCES public.business_properties(id);

-- ===========================================
-- 8. FUNCTIONS AND TRIGGERS
-- ===========================================

-- Function to generate assessment numbers
CREATE OR REPLACE FUNCTION generate_assessment_number()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  next_num INTEGER;
  assessment_number TEXT;
BEGIN
  year := EXTRACT(YEAR FROM NOW())::TEXT;
  SELECT COALESCE(MAX(CAST(SPLIT_PART(assessment_number, '-', 3) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.assessments
  WHERE assessment_number LIKE 'ASS-' || year || '-%';

  assessment_number := 'ASS-' || year || '-' || LPAD(next_num::TEXT, 6, '0');
  RETURN assessment_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate demand notice numbers
CREATE OR REPLACE FUNCTION generate_demand_notice_number()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  next_num INTEGER;
  notice_number TEXT;
BEGIN
  year := EXTRACT(YEAR FROM NOW())::TEXT;
  SELECT COALESCE(MAX(CAST(SPLIT_PART(notice_number, '-', 3) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.demand_notices
  WHERE notice_number LIKE 'DN-' || year || '-%';

  notice_number := 'DN-' || year || '-' || LPAD(next_num::TEXT, 6, '0');
  RETURN notice_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate application numbers
CREATE OR REPLACE FUNCTION generate_application_number()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  next_num INTEGER;
  application_number TEXT;
BEGIN
  year := EXTRACT(YEAR FROM NOW())::TEXT;
  SELECT COALESCE(MAX(CAST(SPLIT_PART(application_number, '-', 3) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.assessment_applications
  WHERE application_number LIKE 'APP-' || year || '-%';

  application_number := 'APP-' || year || '-' || LPAD(next_num::TEXT, 6, '0');
  RETURN application_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate assessment numbers
CREATE OR REPLACE FUNCTION set_assessment_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assessment_number IS NULL THEN
    NEW.assessment_number := generate_assessment_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assessment_number_trigger
  BEFORE INSERT ON public.assessments
  FOR EACH ROW
  EXECUTE FUNCTION set_assessment_number();

-- Trigger to auto-generate application numbers
CREATE OR REPLACE FUNCTION set_application_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.application_number IS NULL THEN
    NEW.application_number := generate_application_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER application_number_trigger
  BEFORE INSERT ON public.assessment_applications
  FOR EACH ROW
  EXECUTE FUNCTION set_application_number();

-- ===========================================
-- 9. USEFUL VIEWS FOR QUERIES
-- ===========================================

-- View for easy taxpayer demand notice lookup
CREATE OR REPLACE VIEW taxpayer_demand_notices AS
SELECT
  dn.id as demand_notice_id,
  dn.notice_number,
  dn.amount_due,
  dn.issue_date,
  dn.due_date,
  dn.payment_status,

  -- Assessment details
  a.id as assessment_id,
  a.assessment_number,
  a.revenue_type_code,
  a.zone_id,
  a.assessment_data,
  a.calculation_details,

  -- Taxpayer details
  p.id as taxpayer_id,
  p.full_name as taxpayer_name,
  p.phone as taxpayer_phone,
  p.email as taxpayer_email,

  -- Business details (if available)
  COALESCE(
    a.assessment_data->>'business_name',
    a.assessment_data->>'property_name',
    a.assessment_data->>'hotel_name',
    'Business/Property'
  ) as business_name,

  COALESCE(
    a.assessment_data->>'business_address',
    a.assessment_data->>'property_address',
    a.assessment_data->>'address',
    'Address not specified'
  ) as business_address

FROM public.demand_notices dn
JOIN public.assessments a ON dn.assessment_id = a.id
LEFT JOIN public.profiles p ON a.taxpayer_id = p.id
WHERE dn.payment_status IN ('unpaid', 'partial')
ORDER BY dn.due_date ASC, dn.issue_date DESC;

-- View for taxpayer assessment summary
CREATE OR REPLACE VIEW taxpayer_assessment_summary AS
SELECT
  p.id as taxpayer_id,
  p.full_name as taxpayer_name,
  p.phone as taxpayer_phone,
  COUNT(DISTINCT a.id) as total_assessments,
  COUNT(DISTINCT dn.id) as unpaid_demand_notices,
  COALESCE(SUM(dn.amount_due), 0) as total_amount_due,
  MIN(dn.due_date) as earliest_due_date,
  MAX(dn.issue_date) as latest_assessment_date
FROM public.profiles p
LEFT JOIN public.assessments a ON p.id = a.taxpayer_id
LEFT JOIN public.demand_notices dn ON a.id = dn.assessment_id AND dn.payment_status IN ('unpaid', 'partial')
GROUP BY p.id, p.full_name, p.phone;

-- ===========================================
-- 10. VERIFICATION QUERIES
-- ===========================================

-- Verify new tables were created
SELECT 'NEW TABLES CREATED:' as info;
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('assessments', 'demand_notices', 'assessment_formulas', 'assessment_applications')
ORDER BY tablename;

-- Verify sample formulas were inserted
SELECT 'SAMPLE FORMULAS INSERTED:' as info;
SELECT
  revenue_type_code,
  zone_id,
  formula_type,
  base_amount
FROM public.assessment_formulas
ORDER BY revenue_type_code, zone_id;

-- Test number generation functions
SELECT 'NUMBER GENERATION TEST:' as info;
SELECT
  generate_assessment_number() as next_assessment,
  generate_demand_notice_number() as next_demand_notice,
  generate_application_number() as next_application;

SELECT '✅ ASSESSMENT SYSTEM SCHEMA COMPLETED!' as final_result;

-- ===========================================
-- MULTIPLE BUSINESS SCENARIO DOCUMENTATION
-- ===========================================

/*
MULTIPLE BUSINESSES PER TAXPAYER - HOW IT WORKS:

1. SCENARIO: Taxpayer "John Doe" owns 3 businesses:
   - Transcorp Hilton Hotel (Hotel License)
   - John Doe Supermarket (Shop License)
   - JD Fast Food Restaurant (Restaurant License)

2. PHONE NUMBER LOOKUP:
   - All businesses registered under phone: 0801234567
   - When user searches by phone, system returns ALL unpaid demand notices

3. USER EXPERIENCE:
   - Shows list of all businesses with unpaid bills
   - User selects which business to pay
   - Proceeds to payment for selected business only

4. DATABASE DESIGN:
   - Each assessment is linked to taxpayer_id (not business)
   - Business details stored in assessment_data JSON
   - Views provide easy querying of all taxpayer bills

5. USEFUL QUERIES:

   -- Get all unpaid demand notices for a phone number:
   SELECT * FROM taxpayer_demand_notices
   WHERE taxpayer_phone = '0801234567';

   -- Get taxpayer summary:
   SELECT * FROM taxpayer_assessment_summary
   WHERE taxpayer_phone = '0801234567';

6. FUTURE ENHANCEMENT:
   - business_properties table for better business registry
   - Separate business registration from taxpayer profile
   - Business-specific assessment history

This design properly handles the Nigerian business reality where
one person often owns multiple businesses under the same phone number.
*/
