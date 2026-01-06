-- SAFE DATABASE SETUP - Phase 3: Policies, Functions, Triggers
-- Run this LAST, only after Phases 1 & 2 complete successfully

-- ===========================================
-- PHASE 3: CREATE POLICIES (SAFER APPROACH)
-- ===========================================

-- Basic policies that don't reference problematic columns
CREATE POLICY "Anyone can read revenue types" ON public.revenue_types FOR SELECT USING (true);
CREATE POLICY "Anyone can read zones" ON public.zones FOR SELECT USING (true);

-- User roles policies (basic read access)
CREATE POLICY "Users can read their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

-- Admin-only policies (safer - check user_roles table directly)
CREATE POLICY "Only admins can modify revenue types" ON public.revenue_types
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Only admins can modify zones" ON public.zones
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Receipts policies (basic version)
CREATE POLICY "Users can view their own receipts" ON public.receipts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin', 'auditor')
  )
);

CREATE POLICY "Admins can manage receipts" ON public.receipts
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Other admin-only policies
CREATE POLICY "Only admins can manage reminders" ON public.reminders
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Only admins can manage reconciliation" ON public.reconciliation_log
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin', 'auditor')
  )
);

CREATE POLICY "Only admins can view payment history" ON public.payment_history
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin', 'auditor')
  )
);

CREATE POLICY "Only admins can manage virtual accounts" ON public.virtual_accounts
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Storage policies
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
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'super_admin', 'auditor')
    )
  )
);

-- ===========================================
-- PHASE 3 COMPLETE - BASIC POLICIES CREATED
-- ===========================================
SELECT '✅ Phase 3 Complete: Basic policies created!' as phase_3_status;
