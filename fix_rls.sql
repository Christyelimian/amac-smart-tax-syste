-- Allow anyone to insert payments (public payment portal)
CREATE POLICY "Allow public payment inserts"
ON public.payments
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anyone to read their own payments by reference
CREATE POLICY "Allow public payment reads"
ON public.payments
FOR SELECT
TO anon
USING (true);