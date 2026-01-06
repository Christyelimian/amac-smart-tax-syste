-- SAFE DATABASE SETUP - Phase 2: Data, Policies, Functions
-- Run this AFTER Phase 1 completes successfully

-- ===========================================
-- PHASE 2: ENABLE RLS, INSERT DATA, CREATE POLICIES
-- ===========================================

-- Enable Row Level Security on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_accounts ENABLE ROW LEVEL SECURITY;

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Insert default data
INSERT INTO public.zones (id, name, description, multiplier) VALUES
  ('a', 'Zone A - Central Business District', 'Maitama, Asokoro, Wuse, Central Area', 1.5),
  ('b', 'Zone B - Maitama/Asokoro', 'Garki, Gwarinpa, Kubwa, Jabi', 1.3),
  ('c', 'Zone C - Wuse/Garki', 'Nyanya, Karu, Lugbe, Gwagwalada', 1.2),
  ('d', 'Zone D - Satellite Towns', 'Other areas', 1.0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.revenue_types (code, name, category, base_amount, has_zones, is_recurring, renewal_period, icon) VALUES
  ('property-tax', 'Property Tax', 'property', 50000, true, true, 365, '🏠'),
  ('business-premises', 'Business Premises Permit', 'business', 25000, true, true, 365, '🏢'),
  ('signage-permit', 'Signage/Billboard Permit', 'advertising', 15000, true, true, 365, '📋'),
  ('hotel-license', 'Hotel/Guest House License', 'entertainment', 100000, true, true, 365, '🏨'),
  ('restaurant-license', 'Restaurant License', 'entertainment', 35000, true, true, 365, '🍽️'),
  ('bar-license', 'Bar & Liquor License', 'entertainment', 50000, true, true, 365, '🍻'),
  ('market-stall', 'Market Stall Permit', 'business', 12000, true, true, 365, '🏪'),
  ('hawker-permit', 'Hawker''s Permit', 'business', 5000, true, true, 365, '🛒'),
  ('motor-park', 'Motor Park Levy', 'transport', 20000, true, true, 365, '🚌'),
  ('taxi-permit', 'Taxi Permit', 'transport', 8000, true, true, 365, '🚕'),
  ('tricycle-permit', 'Tricycle (Keke) Permit', 'transport', 6000, true, true, 365, '🛺'),
  ('motorcycle-permit', 'Motorcycle (Okada) Permit', 'transport', 4000, true, true, 365, '🏍️'),
  ('development-levy', 'Development Levy', 'construction', 75000, false, false, NULL, '🏗️'),
  ('building-plan', 'Building Plan Approval', 'construction', 50000, false, false, NULL, '📐'),
  ('c-of-o', 'Certificate of Occupancy', 'land', 200000, false, false, NULL, '📜'),
  ('land-use-charge', 'Land Use Charge', 'land', 40000, true, true, 365, '🗺️'),
  ('waste-disposal', 'Waste Disposal Fee', 'environmental', 10000, true, true, 365, '♻️'),
  ('environmental-levy', 'Environmental Impact Levy', 'environmental', 30000, false, false, NULL, '🌿'),
  ('water-abstraction', 'Water Abstraction Fee', 'utilities', 15000, false, false, NULL, '💧'),
  ('borehole-permit', 'Borehole Drilling Permit', 'utilities', 25000, false, false, NULL, '⛏️'),
  ('telecom-mast', 'Telecom Mast Levy', 'telecom', 500000, false, false, NULL, '📡'),
  ('bank-license', 'Bank Branch License', 'finance', 150000, false, false, NULL, '🏦'),
  ('microfinance', 'Microfinance License', 'finance', 50000, false, false, NULL, '💰'),
  ('petrol-station', 'Petrol Station License', 'utilities', 100000, false, false, NULL, '⛽'),
  ('lpg-station', 'LPG Station Permit', 'utilities', 75000, false, false, NULL, '🔥'),
  ('cinema-license', 'Cinema/Theatre License', 'entertainment', 80000, false, false, NULL, '🎬'),
  ('event-center', 'Event Center License', 'entertainment', 60000, false, false, NULL, '🎉'),
  ('nightclub-license', 'Nightclub License', 'entertainment', 100000, false, false, NULL, '🎵'),
  ('gym-license', 'Gym/Fitness Center License', 'health', 25000, true, true, 365, '💪'),
  ('spa-license', 'Spa/Wellness Center License', 'health', 30000, true, true, 365, '🧘'),
  ('pharmacy-license', 'Pharmacy License', 'health', 40000, true, true, 365, '💊'),
  ('hospital-license', 'Private Hospital License', 'health', 150000, false, false, NULL, '🏥'),
  ('school-license', 'Private School License', 'education', 100000, false, false, NULL, '🎓'),
  ('tutorial-center', 'Tutorial Center License', 'education', 20000, true, true, 365, '📚'),
  ('supermarket-license', 'Supermarket License', 'retail', 45000, true, true, 365, '🛍️'),
  ('warehouse-permit', 'Warehouse Permit', 'logistics', 35000, true, true, 365, '📦'),
  ('abattoir-license', 'Abattoir License', 'agriculture', 50000, false, false, NULL, '🥩'),
  ('farm-permit', 'Commercial Farm Permit', 'agriculture', 25000, false, false, NULL, '🌾'),
  ('quarry-license', 'Quarry/Mining License', 'mining', 200000, false, false, NULL, '⛰️'),
  ('sand-dredging', 'Sand Dredging Permit', 'mining', 100000, false, false, NULL, '🏖️'),
  ('factory-license', 'Factory License', 'manufacturing', 120000, false, false, NULL, '🏭'),
  ('workshop-permit', 'Workshop Permit', 'manufacturing', 20000, true, true, 365, '🔧'),
  ('printing-press', 'Printing Press License', 'manufacturing', 30000, true, true, 365, '🖨️'),
  ('car-wash', 'Car Wash Permit', 'services', 15000, true, true, 365, '🚗'),
  ('laundry-license', 'Laundry/Dry Cleaning License', 'services', 12000, true, true, 365, '👔'),
  ('barbing-salon', 'Barbing Salon Permit', 'services', 8000, true, true, 365, '✂️'),
  ('beauty-salon', 'Beauty Salon Permit', 'services', 10000, true, true, 365, '💄'),
  ('photography', 'Photography Studio License', 'services', 15000, true, true, 365, '📷'),
  ('radio-station', 'Radio Station License', 'media', 500000, false, false, NULL, '📻'),
  ('cable-tv', 'Cable TV License', 'media', 200000, false, false, NULL, '📺'),
  ('outdoor-advert', 'Outdoor Advertisement Permit', 'advertising', 25000, true, true, 365, '🎯')
ON CONFLICT (code) DO NOTHING;

-- ===========================================
-- PHASE 2 COMPLETE - DATA INSERTED
-- ===========================================
SELECT '✅ Phase 2 Complete: RLS enabled, data inserted!' as phase_2_status;
