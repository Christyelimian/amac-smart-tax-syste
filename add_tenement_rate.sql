-- Add missing tenement-rate revenue type
INSERT INTO public.revenue_types (code, name, category, base_amount, has_zones, is_recurring, renewal_period, icon) VALUES
  ('tenement-rate', 'Tenement Rate', 'property', 50000, true, true, 365, '🏠')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  base_amount = EXCLUDED.base_amount,
  has_zones = EXCLUDED.has_zones,
  is_recurring = EXCLUDED.is_recurring,
  renewal_period = EXCLUDED.renewal_period,
  icon = EXCLUDED.icon,
  updated_at = NOW();
