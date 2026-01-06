-- Create payments table for storing transaction records
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference TEXT UNIQUE NOT NULL,
  rrr TEXT,
  revenue_type TEXT NOT NULL,
  service_name TEXT NOT NULL,
  zone TEXT,
  amount DECIMAL(15,2) NOT NULL,
  payer_name TEXT NOT NULL,
  payer_phone TEXT NOT NULL,
  payer_email TEXT,
  business_address TEXT,
  registration_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'confirmed', 'failed')),
  payment_method TEXT,
  gateway_response JSONB,
  receipt_number TEXT UNIQUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policy for public inserts (anyone can create a payment)
CREATE POLICY "Anyone can create payments" 
ON public.payments 
FOR INSERT 
WITH CHECK (true);

-- Create policy for public reads (anyone can read payments by reference)
CREATE POLICY "Anyone can read payments by reference" 
ON public.payments 
FOR SELECT 
USING (true);

-- Create policy for updates (only pending payments can be updated by webhook)
CREATE POLICY "Payments can be updated" 
ON public.payments 
FOR UPDATE 
USING (true);

-- Enable realtime for payments table
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_payments_updated_at();

-- Create index for faster lookups
CREATE INDEX idx_payments_reference ON public.payments(reference);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_created_at ON public.payments(created_at DESC);