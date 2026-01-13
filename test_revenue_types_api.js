import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kfummdjejjjccfbzzifc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmdW1tZGplampqY2NmYnp6aWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2OTIyMzQsImV4cCI6MjA4MzI2ODIzNH0.MWQbDQ0YINAAWC0OpByVE4tCWWHlVWE4rXnRi8d_sYg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRevenueTypesAPI() {
  console.log('🧪 Testing revenue_types API calls...\n');

  try {
    // Test 1: General revenue_types query
    console.log('1️⃣ Testing general revenue_types query...');
    const { data: allTypes, error: allError } = await supabase
      .from('revenue_types')
      .select('*')
      .limit(5);

    if (allError) {
      console.log('❌ General query failed:', allError.message);
    } else {
      console.log('✅ General query works!');
      console.log('Sample records:', allTypes.length);
    }

    // Test 2: Specific failing query - tenement-rate
    console.log('\n2️⃣ Testing tenement-rate query (the failing one)...');
    const { data: tenementRate, error: tenementError } = await supabase
      .from('revenue_types')
      .select('*')
      .eq('code', 'tenement-rate');

    if (tenementError) {
      console.log('❌ Tenement-rate query failed:', tenementError.message);
      console.log('Status code:', tenementError.code);
    } else {
      console.log('✅ Tenement-rate query works!');
      console.log('Result:', tenementRate);
    }

    // Test 3: Specific failing query - ground-rent
    console.log('\n3️⃣ Testing ground-rent query (the failing one)...');
    const { data: groundRent, error: groundError } = await supabase
      .from('revenue_types')
      .select('*')
      .eq('code', 'ground-rent');

    if (groundError) {
      console.log('❌ Ground-rent query failed:', groundError.message);
      console.log('Status code:', groundError.code);
    } else {
      console.log('✅ Ground-rent query works!');
      console.log('Result:', groundRent);
    }

    // Test 4: Check if table exists via direct query
    console.log('\n4️⃣ Checking if revenue_types table is accessible...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('revenue_types')
      .select('code')
      .limit(1);

    if (tableError) {
      console.log('❌ Table access failed:', tableError.message);
      if (tableError.message.includes('404')) {
        console.log('🔍 Table does not exist or is not exposed to REST API');
      } else if (tableError.message.includes('406')) {
        console.log('🔍 406 error - likely RLS policy issue');
      }
    } else {
      console.log('✅ Table is accessible via REST API');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRevenueTypesAPI();
