// Test zones API calls
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with actual credentials
const supabase = createClient(
  'https://kfummdjejjjccfbzzifc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmdW1tZGplampqY2NmYnp6aWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2OTIyMzQsImV4cCI6MjA4MzI2ODIzNH0.MWQbDQ0YINAAWC0opByVE4tCWWHlVWE4rXnRi8d_sYg'
);

async function testZonesAPI() {
  console.log('🧪 Testing zones API calls...\n');

  try {
    // Test 1: General zones query
    console.log('1️⃣ Testing general zones query...');
    const { data: zonesData, error: zonesError } = await supabase
      .from('zones')
      .select('*')
      .order('id');

    if (zonesError) {
      console.log('❌ Zones query failed:', zonesError.message);
      console.log('Error details:', zonesError);
    } else {
      console.log('✅ Zones query works!');
      console.log('Zones count:', zonesData?.length || 0);
      if (zonesData && zonesData.length > 0) {
        console.log('First zone:', zonesData[0]);
      }
    }

    console.log('\n2️⃣ Testing zones RLS policies...');
    // Test if we can query zones as anonymous user
    const { data: anonZones, error: anonError } = await supabase
      .from('zones')
      .select('id, name, multiplier')
      .limit(1);

    if (anonError) {
      console.log('❌ Anonymous zones access failed:', anonError.message);
    } else {
      console.log('✅ Anonymous zones access works!');
      console.log('Sample zone:', anonZones?.[0]);
    }

    console.log('\n3️⃣ Testing combined revenue type + zones query...');
    // Test the exact query pattern used in PaymentForm
    const [serviceResponse, zonesResponse] = await Promise.all([
      supabase.from('revenue_types').select('*').eq('code', 'tenement-rate').single(),
      supabase.from('zones').select('*').order('id')
    ]);

    if (serviceResponse.error) {
      console.log('❌ Tenement-rate query failed:', serviceResponse.error.message);
    } else {
      console.log('✅ Tenement-rate query works!');
      console.log('Service has_zones:', serviceResponse.data?.has_zones);
    }

    if (zonesResponse.error) {
      console.log('❌ Zones query failed:', zonesResponse.error.message);
    } else {
      console.log('✅ Zones query works!');
      console.log('Zones available:', zonesResponse.data?.length || 0);
    }

    if (!serviceResponse.error && !zonesResponse.error) {
      console.log('\n4️⃣ Testing zone selection logic...');
      const service = serviceResponse.data;
      const zones = zonesResponse.data || [];
      
      if (service?.has_zones && zones.length > 0) {
        console.log('✅ Zone selection should work!');
        console.log('Available zones:', zones.map(z => `${z.id} - ${z.name}`));
      } else if (!service?.has_zones) {
        console.log('⚠️ Service does not have zones enabled');
      } else if (zones.length === 0) {
        console.log('❌ No zones available in database');
      }
    }

    console.log('\n✅ All tests completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Error details:', error);
  }
}

// Run the test
testZonesAPI();