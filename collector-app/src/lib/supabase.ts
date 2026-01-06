import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database helper functions for collector app
export const collectorApi = {
  // Get collector profile
  getProfile: async (collectorId: string) => {
    const { data, error } = await supabase
      .from('collectors')
      .select('*')
      .eq('collector_id', collectorId)
      .eq('status', 'active')
      .single();

    return { data, error };
  },

  // Get today's collections
  getTodayCollections: async (collectorId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('collected_by', collectorId)
      .gte('created_at', today)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Create new payment
  createPayment: async (paymentData: any) => {
    const { data, error } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    return { data, error };
  },

  // Get revenue types
  getRevenueTypes: async () => {
    const { data, error } = await supabase
      .from('revenue_types')
      .select('*')
      .eq('is_active', true)
      .order('name');

    return { data, error };
  },

  // Search payers
  searchPayers: async (phone: string) => {
    const { data, error } = await supabase
      .from('payments')
      .select('payer_name, payer_phone, payer_email, business_address, registration_number')
      .eq('payer_phone', phone)
      .order('created_at', { ascending: false })
      .limit(5);

    return { data, error };
  },

  // Update collector location
  updateLocation: async (collectorId: string, latitude: number, longitude: number) => {
    const { data, error } = await supabase
      .from('collectors')
      .update({
        last_location: `POINT(${longitude} ${latitude})`,
        last_location_updated: new Date().toISOString(),
      })
      .eq('id', collectorId);

    return { data, error };
  },

  // Get zones
  getZones: async () => {
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .eq('is_active', true)
      .order('name');

    return { data, error };
  },

  // Generate receipt
  generateReceipt: async (paymentId: string) => {
    const { data, error } = await supabase
      .rpc('generate_receipt_number', {
        payment_id: paymentId
      });

    return { data, error };
  },
};
