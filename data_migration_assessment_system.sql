-- ===========================================
-- DATA MIGRATION: OLD PAYMENTS → ASSESSMENT SYSTEM
-- ===========================================
-- Migrates existing payment data to the new assessment-first architecture
-- Run this after setting up the assessment system schema

-- ===========================================
-- PHASE 1: BACKUP EXISTING DATA
-- ===========================================

-- Create backup tables (run this first)
CREATE TABLE IF NOT EXISTS migration_backup_payments AS
SELECT * FROM public.payments;

CREATE TABLE IF NOT EXISTS migration_backup_payment_history AS
SELECT * FROM public.payment_history;

SELECT 'BACKUP CREATED:' as info;
SELECT 'payments backup: ' || COUNT(*) as payments_backup FROM migration_backup_payments;
SELECT 'payment_history backup: ' || COUNT(*) as history_backup FROM migration_backup_payment_history;

-- ===========================================
-- PHASE 2: CREATE ASSESSMENTS FROM EXISTING PAYMENTS
-- ===========================================

-- Insert assessments for existing payments
-- This creates retrospective assessments based on historical payments
INSERT INTO public.assessments (
  assessment_number,
  taxpayer_id, -- Will be NULL for now, can be linked later
  revenue_type_code,
  zone_id,
  assessment_data,
  assessed_amount,
  calculation_method,
  calculation_details,
  status,
  assessment_date,
  valid_from,
  valid_until,
  notes,
  created_at,
  updated_at
)
SELECT
  'MIGRATED-' || p.reference as assessment_number,
  NULL as taxpayer_id, -- Link to profiles table if available
  p.revenue_type_code,
  p.zone_id,
  jsonb_build_object(
    'migrated_from_payment', p.reference,
    'original_amount', p.amount,
    'payment_date', p.created_at,
    'payer_name', p.customer_details->>'payerName',
    'payer_email', p.customer_details->>'payerEmail',
    'payer_phone', p.customer_details->>'payerPhone',
    'business_name', COALESCE(p.property_name, 'Migrated Business'),
    'migration_notes', 'Created from historical payment data'
  ) as assessment_data,
  p.amount as assessed_amount,
  'migrated_from_old_system' as calculation_method,
  jsonb_build_object(
    'original_payment_reference', p.reference,
    'migration_date', NOW(),
    'migration_type', 'historical_payment_conversion'
  ) as calculation_details,
  CASE
    WHEN p.status IN ('confirmed', 'paid') THEN 'paid'
    ELSE 'pending'
  END as status,
  p.created_at as assessment_date,
  p.created_at as valid_from,
  (p.created_at + INTERVAL '1 year') as valid_until,
  'Migrated from old payment system - ' || p.reference as notes,
  NOW() as created_at,
  NOW() as updated_at
FROM public.payments p
WHERE p.status IN ('confirmed', 'paid', 'pending_verification')
  AND NOT EXISTS (
    SELECT 1 FROM public.assessments a
    WHERE a.assessment_number = 'MIGRATED-' || p.reference
  );

-- ===========================================
-- PHASE 3: LINK PAYMENTS TO ASSESSMENTS
-- ===========================================

-- Update payments table to link to newly created assessments
UPDATE public.payments p
SET
  assessment_id = a.id,
  payment_type = 'assessed',
  updated_at = NOW()
FROM public.assessments a
WHERE a.assessment_number = 'MIGRATED-' || p.reference
  AND p.assessment_id IS NULL;

-- ===========================================
-- PHASE 4: GENERATE RETROSPECTIVE DEMAND NOTICES
-- ===========================================

-- Create demand notices for migrated assessments
INSERT INTO public.demand_notices (
  notice_number,
  assessment_id,
  taxpayer_id,
  revenue_type_code,
  zone_id,
  amount_due,
  issue_date,
  due_date,
  payment_status,
  payment_id,
  paid_at,
  created_at,
  created_by
)
SELECT
  'DN-MIGRATED-' || a.assessment_number as notice_number,
  a.id as assessment_id,
  a.taxpayer_id,
  a.revenue_type_code,
  a.zone_id,
  a.assessed_amount as amount_due,
  DATE(a.assessment_date) as issue_date,
  DATE(a.assessment_date + INTERVAL '30 days') as due_date,
  CASE
    WHEN a.status = 'paid' THEN 'paid'
    ELSE 'unpaid'
  END as payment_status,
  p.id as payment_id,
  CASE
    WHEN a.status = 'paid' THEN p.confirmed_at
    ELSE NULL
  END as paid_at,
  NOW() as created_at,
  'system_migration' as created_by
FROM public.assessments a
LEFT JOIN public.payments p ON p.reference = REPLACE(a.assessment_number, 'MIGRATED-', '')
WHERE a.calculation_method = 'migrated_from_old_system'
  AND NOT EXISTS (
    SELECT 1 FROM public.demand_notices dn
    WHERE dn.assessment_id = a.id
  );

-- ===========================================
-- PHASE 5: UPDATE ASSESSMENT LINKS TO DEMAND NOTICES
-- ===========================================

-- Update assessments to link to their demand notices
UPDATE public.assessments a
SET
  demand_notice_number = dn.notice_number,
  demand_notice_issued_at = dn.created_at,
  updated_at = NOW()
FROM public.demand_notices dn
WHERE dn.assessment_id = a.id
  AND a.demand_notice_number IS NULL;

-- ===========================================
-- PHASE 6: CREATE BUSINESS/PROPERTY REGISTRY (OPTIONAL)
-- ===========================================

-- Create business registry entries for migrated assessments
INSERT INTO public.business_properties (
  taxpayer_id,
  business_name,
  property_address,
  business_registration_number,
  property_type,
  current_assessment_id,
  current_demand_notice_id,
  status,
  created_at,
  updated_at
)
SELECT
  a.taxpayer_id,
  COALESCE(
    a.assessment_data->>'business_name',
    a.assessment_data->>'property_name',
    'Migrated Business'
  ) as business_name,
  COALESCE(
    a.assessment_data->>'business_address',
    a.assessment_data->>'property_address',
    'Address from migration'
  ) as property_address,
  a.assessment_data->>'business_registration_number' as business_registration_number,
  CASE
    WHEN a.revenue_type_code LIKE '%property%' THEN 'residential'
    WHEN a.revenue_type_code LIKE '%hotel%' THEN 'commercial'
    WHEN a.revenue_type_code LIKE '%shop%' THEN 'commercial'
    ELSE 'commercial'
  END as property_type,
  a.id as current_assessment_id,
  dn.id as current_demand_notice_id,
  'active' as status,
  NOW() as created_at,
  NOW() as updated_at
FROM public.assessments a
LEFT JOIN public.demand_notices dn ON dn.assessment_id = a.id
WHERE a.calculation_method = 'migrated_from_old_system'
  AND NOT EXISTS (
    SELECT 1 FROM public.business_properties bp
    WHERE bp.business_name = COALESCE(
      a.assessment_data->>'business_name',
      a.assessment_data->>'property_name',
      'Migrated Business'
    )
  );

-- ===========================================
-- PHASE 7: MIGRATION VERIFICATION
-- ===========================================

SELECT 'MIGRATION VERIFICATION:' as info;

-- Check assessments created
SELECT 'Assessments migrated: ' || COUNT(*) as assessments_count
FROM public.assessments
WHERE calculation_method = 'migrated_from_old_system';

-- Check payments linked
SELECT 'Payments linked to assessments: ' || COUNT(*) as linked_payments
FROM public.payments
WHERE assessment_id IS NOT NULL;

-- Check demand notices created
SELECT 'Demand notices created: ' || COUNT(*) as demand_notices_count
FROM public.demand_notices
WHERE notice_number LIKE 'DN-MIGRATED-%';

-- Check business properties created
SELECT 'Business properties created: ' || COUNT(*) as business_properties_count
FROM public.business_properties;

-- Revenue breakdown
SELECT
  revenue_type_code,
  COUNT(*) as count,
  SUM(assessed_amount) as total_amount
FROM public.assessments
WHERE calculation_method = 'migrated_from_old_system'
GROUP BY revenue_type_code
ORDER BY total_amount DESC;

-- Status breakdown
SELECT
  status,
  COUNT(*) as count,
  SUM(assessed_amount) as total_amount
FROM public.assessments
WHERE calculation_method = 'migrated_from_old_system'
GROUP BY status;

-- ===========================================
-- PHASE 8: CLEANUP AND OPTIMIZATION
-- ===========================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS assessments_migration_method_idx ON public.assessments(calculation_method);
CREATE INDEX IF NOT EXISTS demand_notices_migrated_idx ON public.demand_notices(notice_number) WHERE notice_number LIKE 'DN-MIGRATED-%';

-- Update statistics
ANALYZE public.assessments;
ANALYZE public.demand_notices;
ANALYZE public.business_properties;

-- ===========================================
-- PHASE 9: POST-MIGRATION REPORT
-- ===========================================

SELECT 'MIGRATION COMPLETED SUCCESSFULLY!' as final_result;
SELECT 'Summary:' as info;
SELECT
  'Total assessments: ' || COUNT(*) as total_assessments,
  'Migrated assessments: ' || COUNT(CASE WHEN calculation_method = 'migrated_from_old_system' THEN 1 END) as migrated_assessments,
  'New assessments: ' || COUNT(CASE WHEN calculation_method != 'migrated_from_old_system' THEN 1 END) as new_assessments,
  'Linked payments: ' || (SELECT COUNT(*) FROM public.payments WHERE assessment_id IS NOT NULL) as linked_payments,
  'Demand notices: ' || COUNT(*) as total_demand_notices,
  'Business properties: ' || (SELECT COUNT(*) FROM public.business_properties) as business_properties
FROM public.assessments;

-- ===========================================
-- ROLLBACK SCRIPT (IF NEEDED)
-- ===========================================

/*
-- CAUTION: Only run this if you need to rollback the migration

-- Remove migrated demand notices
DELETE FROM public.demand_notices
WHERE notice_number LIKE 'DN-MIGRATED-%';

-- Remove migrated assessments
DELETE FROM public.assessments
WHERE calculation_method = 'migrated_from_old_system';

-- Remove migrated business properties
DELETE FROM public.business_properties
WHERE created_at >= '2024-01-01'; -- Adjust date as needed

-- Unlink payments
UPDATE public.payments
SET assessment_id = NULL, payment_type = NULL
WHERE assessment_id IS NOT NULL;

-- Remove backup tables (optional)
-- DROP TABLE IF EXISTS migration_backup_payments;
-- DROP TABLE IF EXISTS migration_backup_payment_history;
*/
