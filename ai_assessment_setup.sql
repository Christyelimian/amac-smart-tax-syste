-- ===========================================
-- AI ASSESSMENT SYSTEM SETUP
-- ===========================================
-- Sets up AI-powered assessment capabilities using Claude API

-- ===========================================
-- 1. AI ASSESSMENT LOGS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.ai_assessment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenue_type_code TEXT REFERENCES public.revenue_types(code),
  zone_id TEXT REFERENCES public.zones(id),

  -- Assessment inputs
  assessment_data JSONB NOT NULL,

  -- AI response
  ai_response JSONB NOT NULL,
  formula_used UUID REFERENCES public.assessment_formulas(id),

  -- Metadata
  model_version TEXT DEFAULT 'claude-sonnet-4-20250514',
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  processing_time_ms INTEGER,

  -- Audit trail
  requested_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS ai_assessment_logs_revenue_type_idx ON public.ai_assessment_logs(revenue_type_code);
CREATE INDEX IF NOT EXISTS ai_assessment_logs_zone_idx ON public.ai_assessment_logs(zone_id);
CREATE INDEX IF NOT EXISTS ai_assessment_logs_created_at_idx ON public.ai_assessment_logs(created_at DESC);

-- RLS policies
ALTER TABLE public.ai_assessment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all AI assessment logs" ON public.ai_assessment_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'auditor')
  )
);

CREATE POLICY "System can insert AI assessment logs" ON public.ai_assessment_logs
FOR INSERT WITH CHECK (true);

-- ===========================================
-- 2. AI FORMULA TEMPLATES
-- ===========================================

-- Insert AI assessment formulas for complex scenarios
INSERT INTO public.assessment_formulas (
  revenue_type_code, zone_id, formula_type, ai_prompt_template,
  ai_model, ai_temperature, is_active, context_requirements
) VALUES
-- High-end Hotel Assessment (AI-assisted)
('hotel-license', 'a', 'ai_assisted',
'You are an expert property valuer specializing in Abuja hotel market assessments for AMAC revenue collection.

TASK: Assess the annual license fee for a high-end hotel in Zone A (Central Business District).

CONSIDERATIONS:
- Hotel category and star rating
- Number of rooms and occupancy rates
- Location premium in CBD
- Annual turnover estimates
- Market comparables in Abuja
- Economic factors affecting hospitality

METHODOLOGY:
1. Base fee: ₦100,000 (standard for hotels)
2. Room-based calculation: ₦1,500 per room
3. Category premium: 5-star = ₦200,000, 4-star = ₦150,000, 3-star = ₦100,000
4. Location adjustment for Zone A: +20%
5. Market adjustment based on turnover estimates
6. Apply professional judgment for luxury properties

LOCATION CONTEXT:
- Zone A includes Maitama, Asokoro, Wuse CBD
- High demand for business and diplomatic travel
- Premium rates justified by location

{{revenue_type}}
{{zone}}',
'claude-sonnet-4-20250514', 0.1, true,
ARRAY['location', 'market_data', 'comparable_properties']
),

-- Commercial Property Assessment (AI-assisted)
('property-tax', 'a', 'ai_assisted',
'You are a certified property valuer assessing commercial property tax in Abuja for AMAC.

TASK: Determine the annual tenement rate for a commercial property in Zone A.

VALUATION FACTORS:
- Property size in square meters
- Location in CBD (Zone A premium)
- Property type (office, retail, mixed-use)
- Building quality and condition
- Rental income potential
- Market comparables

CALCULATION APPROACH:
1. Base rate: ₦50 per sqm for commercial properties
2. Zone A multiplier: 1.5x (premium location)
3. Property type adjustment: Office = 1.2x, Retail = 1.5x, Mixed-use = 1.3x
4. Size-based scaling with economies of scale
5. Quality adjustment based on building condition
6. Market adjustment for current economic conditions

ZONE A CHARACTERISTICS:
- Central Business District
- High commercial activity
- Premium rental rates
- Limited supply of quality space

COMPARABLE ANALYSIS:
Consider recent transactions in Wuse II, Maitama Central Business District, and similar premium locations.

{{revenue_type}}
{{zone}}',
'claude-sonnet-4-20250514', 0.1, true,
ARRAY['location', 'market_data', 'economic_indicators']
),

-- Large Shopping Mall Assessment (AI-assisted)
('supermarket-license', 'a', 'ai_assisted',
'You are a retail property valuation expert assessing shopping mall license fees in Abuja.

TASK: Assess annual license fee for a supermarket/mall in Zone A.

ANALYSIS FRAMEWORK:
- Total retail space in square meters
- Store mix (groceries, fashion, electronics, etc.)
- Foot traffic and location accessibility
- Competition in the area
- Annual turnover estimates
- Operating costs and profitability

VALUATION METHODOLOGY:
1. Base license fee: ₦45,000 (standard for supermarkets)
2. Size premium: ₦50 per sqm over 500 sqm
3. Location premium for Zone A: +30%
4. Category premium based on store quality
5. Market adjustment based on economic indicators
6. Competition adjustment

LOCATION ANALYSIS:
- Zone A premium positioning
- Access to high-income residential areas
- Business district proximity
- Tourist and diplomatic traffic

MARKET CONTEXT:
- Abuja retail market growth
- Consumer spending patterns
- Competition from modern malls
- Economic indicators affecting retail

{{revenue_type}}
{{zone}}',
'claude-sonnet-4-20250514', 0.2, true,
ARRAY['market_data', 'economic_indicators', 'comparable_properties']
),

-- Entertainment Complex Assessment (AI-assisted)
('event-center', 'a', 'ai_assisted',
'You are an entertainment venue valuation specialist assessing Abuja event centers.

TASK: Determine annual license fee for an event center/entertainment complex in Zone A.

ASSESSMENT CRITERIA:
- Total capacity (seating/standing)
- Facility type (conference, wedding, concerts, sports)
- Location accessibility and visibility
- Operating hours and seasonality
- Equipment quality and amenities
- Market positioning (budget, mid-range, luxury)

VALUATION APPROACH:
1. Base license fee: ₦60,000 (standard for event centers)
2. Capacity premium: ₦200 per seat over 200 seats
3. Location premium for Zone A: +25%
4. Facility type adjustment: Conference +10%, Wedding +15%, Multi-purpose +20%
5. Quality adjustment based on amenities
6. Market demand adjustment

ZONE A CONSIDERATIONS:
- High demand for corporate events
- Diplomatic and government functions
- Wedding market premium
- Tourist and business traveler demand

OPERATIONAL FACTORS:
- Seasonal demand patterns
- Competition from hotels and other venues
- Maintenance and operating costs
- Revenue generation potential

{{revenue_type}}
{{zone}}',
'claude-sonnet-4-20250514', 0.2, true,
ARRAY['market_data', 'economic_indicators']
)
ON CONFLICT (revenue_type_code, zone_id) DO UPDATE SET
  ai_prompt_template = EXCLUDED.ai_prompt_template,
  ai_model = EXCLUDED.ai_model,
  ai_temperature = EXCLUDED.ai_temperature,
  context_requirements = EXCLUDED.context_requirements,
  updated_at = NOW();

-- ===========================================
-- 3. UTILITY FUNCTIONS
-- ===========================================

-- Function to get AI assessment statistics
CREATE OR REPLACE FUNCTION get_ai_assessment_stats(
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  revenue_type TEXT,
  total_assessments BIGINT,
  avg_confidence DECIMAL,
  avg_processing_time INTEGER,
  success_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    atl.revenue_type_code::TEXT,
    COUNT(*)::BIGINT as total_assessments,
    ROUND(AVG(atl.confidence_score)::DECIMAL, 2) as avg_confidence,
    ROUND(AVG(atl.processing_time_ms)::DECIMAL)::INTEGER as avg_processing_time,
    ROUND(
      (COUNT(*)::DECIMAL /
       NULLIF(COUNT(*) FILTER (WHERE atl.ai_response->>'error' IS NULL), 0)
      ) * 100, 1
    ) as success_rate
  FROM public.ai_assessment_logs atl
  WHERE atl.created_at >= NOW() - INTERVAL '1 day' * days_back
  GROUP BY atl.revenue_type_code
  ORDER BY total_assessments DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get recent AI assessments
CREATE OR REPLACE FUNCTION get_recent_ai_assessments(
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  revenue_type TEXT,
  zone TEXT,
  assessed_amount INTEGER,
  confidence DECIMAL,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    atl.id,
    atl.revenue_type_code::TEXT,
    atl.zone_id::TEXT,
    (atl.ai_response->>'recommended_amount')::INTEGER,
    atl.confidence_score::DECIMAL,
    atl.created_at
  FROM public.ai_assessment_logs atl
  ORDER BY atl.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- 4. VERIFICATION QUERIES
-- ===========================================

SELECT 'AI ASSESSMENT SYSTEM SETUP VERIFICATION:' as info;

-- Check AI formulas
SELECT 'AI FORMULAS CREATED:' as info;
SELECT
  revenue_type_code,
  zone_id,
  ai_model,
  ai_temperature,
  array_length(context_requirements, 1) as context_items
FROM public.assessment_formulas
WHERE formula_type = 'ai_assisted' AND is_active = true
ORDER BY revenue_type_code, zone_id;

-- Check AI logs table
SELECT 'AI LOGS TABLE:' as info;
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename = 'ai_assessment_logs';

-- Test utility functions
SELECT 'UTILITY FUNCTIONS:' as info;
SELECT
  proname as function_name,
  obj_description(oid, 'pg_proc') as description
FROM pg_proc
WHERE proname LIKE '%ai_assessment%'
ORDER BY proname;

SELECT '✅ AI ASSESSMENT SYSTEM SETUP COMPLETED!' as final_result;
