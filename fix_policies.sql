-- Fix Policies - Use fully qualified table names
-- Run this AFTER the main setup to fix the policy issues

-- ===========================================
-- DROP EXISTING POLICIES (if any)
-- ===========================================
DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only super admins can modify roles" ON public.user_roles;
DROP POLICY IF EXISTS "Anyone can read revenue types" ON public.revenue_types;
DROP POLICY IF EXISTS "Only admins can modify revenue types" ON public.revenue_types;
DROP POLICY IF EXISTS "Anyone can read zones" ON public.zones;
DROP POLICY IF EXISTS "Only admins can modify zones" ON public.zones;
DROP POLICY IF EXISTS "Users can view their own receipts" ON public.receipts;
DROP POLICY IF EXISTS "Admins can manage receipts" ON public.receipts;
DROP POLICY IF EXISTS "Only admins can manage reminders" ON public.reminders;
DROP POLICY IF EXISTS "Only admins can manage reconciliation" ON public.reconciliation_log;
DROP POLICY IF EXISTS "Only admins can view payment history" ON public.payment_history;
DROP POLICY IF EXISTS "Only admins can manage virtual accounts" ON public.virtual_accounts;
DROP POLICY IF EXISTS "Users can upload payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view payment proofs" ON storage.objects;

-- ===========================================
-- CREATE CORRECTED POLICIES WITH FULLY QUALIFIED NAMES
-- ===========================================

-- User roles policies
CREATE POLICY "Users can read their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all roles" ON public.user_roles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Only super admins can modify roles" ON public.user_roles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'super_admin'
  )
);

-- Revenue types policies
CREATE POLICY "Anyone can read revenue types" ON public.revenue_types FOR SELECT USING (true);

CREATE POLICY "Only admins can modify revenue types" ON public.revenue_types
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Zones policies
CREATE POLICY "Anyone can read zones" ON public.zones FOR SELECT USING (true);

CREATE POLICY "Only admins can modify zones" ON public.zones
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Receipts policies
CREATE POLICY "Users can view their own receipts" ON public.receipts
FOR SELECT USING (
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

CREATE POLICY "Admins can manage receipts" ON public.receipts
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Reminders policies
CREATE POLICY "Only admins can manage reminders" ON public.reminders
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Reconciliation policies
CREATE POLICY "Only admins can manage reconciliation" ON public.reconciliation_log
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'auditor')
  )
);

-- Payment history policies
CREATE POLICY "Only admins can view payment history" ON public.payment_history
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'auditor')
  )
);

-- Virtual accounts policies
CREATE POLICY "Only admins can manage virtual accounts" ON public.virtual_accounts
FOR ALL USING (
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
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin', 'auditor')
    )
  )
);

SELECT '✅ Policies fixed successfully!' as status;
