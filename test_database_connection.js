/**
 * Test Database Connection and Tables
 * This script tests the database connection and checks if required tables exist
 */

const { createClient } = require('@supabase/supabase-js');

// Try to get environment variables from .env file manually
const fs = require('fs');
let supabaseUrl = 'http://localhost:54321';
let supabaseKey = 'your-anon-key';

try {
  const envContent = fs.readFileSync('frontend/.env', 'utf8');
  const lines = envContent.split('\n');
  lines.forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1];
    }
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=')[1];
    }
  });
} catch (error) {
  console.log('⚠️ Could not read .env file, using defaults');
}

console.log('🔍 Testing Database Connection...');
console.log('📋 URL:', supabaseUrl);
console.log('🔑 Key configured:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
  try {
    // Test basic connection
    console.log('\n🧪 Testing basic connection...');
    const { data, error } = await supabase.from('payments').select('count').limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    
    // Test if payments table exists and has data
    console.log('\n🧪 Testing payments table...');
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .limit(5);
    
    if (paymentsError) {
      console.error('❌ Payments table error:', paymentsError.message);
    } else {
      console.log('✅ Payments table accessible');
      console.log(`📊 Found ${payments.length} payment records`);
      if (payments.length > 0) {
        console.log('📋 Sample payment:', {
          id: payments[0].id,
          amount: payments[0].amount,
          status: payments[0].status,
          created_at: payments[0].created_at
        });
      }
    }
    
    // Test user_properties table
    console.log('\n🧪 Testing user_properties table...');
    const { data: properties, error: propertiesError } = await supabase
      .from('user_properties')
      .select('*')
      .limit(5);
    
    if (propertiesError) {
      console.error('❌ User properties table error:', propertiesError.message);
    } else {
      console.log('✅ User properties table accessible');
      console.log(`📊 Found ${properties.length} property records`);
    }
    
    // Test revenue_types table
    console.log('\n🧪 Testing revenue_types table...');
    const { data: revenueTypes, error: revenueTypesError } = await supabase
      .from('revenue_types')
      .select('*')
      .limit(5);
    
    if (revenueTypesError) {
      console.error('❌ Revenue types table error:', revenueTypesError.message);
    } else {
      console.log('✅ Revenue types table accessible');
      console.log(`📊 Found ${revenueTypes.length} revenue types`);
      if (revenueTypes.length > 0) {
        console.log('📋 Sample revenue types:', revenueTypes.map(rt => rt.name).join(', '));
      }
    }
    
    // Test zones table
    console.log('\n🧪 Testing zones table...');
    const { data: zones, error: zonesError } = await supabase
      .from('zones')
      .select('*')
      .limit(5);
    
    if (zonesError) {
      console.error('❌ Zones table error:', zonesError.message);
    } else {
      console.log('✅ Zones table accessible');
      console.log(`📊 Found ${zones.length} zones`);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    return false;
  }
}

// Run the test
testDatabaseConnection().then(success => {
  if (success) {
    console.log('\n🎉 Database connection test completed successfully');
  } else {
    console.log('\n❌ Database connection test failed');
    console.log('\n💡 Possible solutions:');
    console.log('1. Check if Supabase is running locally');
    console.log('2. Verify environment variables in .env file');
    console.log('3. Check if database tables exist');
    console.log('4. Ensure proper permissions are set');
  }
});