// Simple test to check database connection and query revenue types
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://localhost:54321'; // Default Supabase local URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'; // Default local anon key

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');

    // Test 1: Check if we can connect
    const { data: zones, error: zonesError } = await supabase
      .from('zones')
      .select('*')
      .limit(1);

    if (zonesError) {
      console.error('❌ Zones query failed:', zonesError);
    } else {
      console.log('✅ Zones query successful:', zones);
    }

    // Test 2: Check revenue types
    const { data: revenueTypes, error: revenueError } = await supabase
      .from('revenue_types')
      .select('*')
      .eq('code', 'tenement-rate')
      .single();

    if (revenueError) {
      console.error('❌ Revenue types query failed:', revenueError);
    } else {
      console.log('✅ Revenue types query successful:', revenueTypes);
    }

  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

testConnection();
