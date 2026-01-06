-- AMAC Database Setup (Part 3)
-- Run this LAST after all tables are created

-- ===========================================
-- INSERT DEFAULT DATA
-- ===========================================

-- Insert zones
INSERT INTO public.zones (id, name, description, multiplier) VALUES
  ('a', 'Zone A - Central Business District', 'Maitama, Asokoro, Wuse, Central Area', 1.5),
  ('b', 'Zone B - Maitama/Asokoro', 'Garki, Gwarinpa, Kubwa, Jabi', 1.3),
  ('c', 'Zone C - Wuse/Garki', 'Nyanya, Karu, Lugbe, Gwagwalada', 1.2),
  ('d', 'Zone D - Satellite Towns', 'Other areas', 1.0)
ON CONFLICT (id) DO NOTHING;

-- Insert revenue types (first 25)
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
  ('lpg-station', 'LPG Station Permit', 'utilities', 75000, false, false, NULL, '🔥')
ON CONFLICT (code) DO NOTHING;

-- ===========================================
-- CREATE POLICIES
-- ===========================================

-- User roles policies
CREATE POLICY "Users can read their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all roles" ON public.user_roles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin')
  )
);
CREATE POLICY "Only super admins can modify roles" ON public.user_roles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'super_admin'
  )
);

-- Revenue types policies
CREATE POLICY "Anyone can read revenue types" ON public.revenue_types FOR SELECT USING (true);
CREATE POLICY "Only admins can modify revenue types" ON public.revenue_types FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Zones policies
CREATE POLICY "Anyone can read zones" ON public.zones FOR SELECT USING (true);
CREATE POLICY "Only admins can modify zones" ON public.zones FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Receipts policies
CREATE POLICY "Users can view their own receipts" ON public.receipts FOR SELECT USING (
  payment_id IN (
    SELECT id FROM public.payments
    WHERE payer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'auditor')
  )
);
CREATE POLICY "Admins can manage receipts" ON public.receipts FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Storage policies for payment proofs
CREATE POLICY "Users can upload payment proofs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'payment-proofs'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can view payment proofs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'payment-proofs'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin', 'auditor')
    )
  )
);

-- Success message
SELECT 'Data and policies setup successfully!' as status;
