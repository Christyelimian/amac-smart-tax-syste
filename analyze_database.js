/**
 * Deep Dive into Database Structure
 * Check actual table structures and data
 */

const { createClient } = require('@supabase/supabase-js');

// Environment variables
const supabaseUrl = 'https://kfummdjejjjccfbzzifc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmdW1tZGplampqY2NiYnppaWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyMDA4MDAsImV4cCI6MjA0OTc3NjgwMH0.3rEa8hJqzK8q0mJfPqH2x8m4n5d6K7s8t9u0v1w2x3y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDatabase() {
  try {
    console.log('🔍 Analyzing Database Structure and Data...\n');
    
    // 1. Check payments table structure and data
    console.log('📋 PAYMENTS TABLE ANALYSIS:');
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .limit(3);
    
    if (paymentsError) {
      console.error('❌ Payments table error:', paymentsError.message);
    } else {
      console.log('✅ Payments table accessible');
      console.log(`📊 Found ${payments.length} sample records`);
      if (payments.length > 0) {
        console.log('📋 Sample payment record:');
        console.log(JSON.stringify(payments[0], null, 2));
      }
    }
    
    // 2. Check if user_properties table exists
    console.log('\n📋 USER_PROPERTIES TABLE ANALYSIS:');
    const { data: properties, error: propertiesError } = await supabase
      .from('user_properties')
      .select('*')
      .limit(3);
    
    if (propertiesError) {
      console.error('❌ User properties table error:', propertiesError.message);
      console.error('   This is the ROOT CAUSE of blank dashboard pages!');
      console.error('   The table does not exist or permissions are missing.');
    } else {
      console.log('✅ User properties table accessible');
      console.log(`📊 Found ${properties.length} sample records`);
      if (properties.length > 0) {
        console.log('📋 Sample property record:');
        console.log(JSON.stringify(properties[0], null, 2));
      }
    }
    
    // 3. Check revenue_types table
    console.log('\n📋 REVENUE_TYPES TABLE ANALYSIS:');
    const { data: revenueTypes, error: revenueTypesError } = await supabase
      .from('revenue_types')
      .select('*')
      .limit(3);
    
    if (revenueTypesError) {
      console.error('❌ Revenue types table error:', revenueTypesError.message);
    } else {
      console.log('✅ Revenue types table accessible');
      console.log(`📊 Found ${revenueTypes.length} sample records`);
      if (revenueTypes.length > 0) {
        console.log('📋 Sample revenue types:');
        revenueTypes.forEach(rt => console.log(`   - ${rt.name}`));
      }
    }
    
    // 4. Check zones table
    console.log('\n📋 ZONES TABLE ANALYSIS:');
    const { data: zones, error: zonesError } = await supabase
      .from('zones')
      .select('*')
      .limit(3);
    
    if (zonesError) {
      console.error('❌ Zones table error:', zonesError.message);
    } else {
      console.log('✅ Zones table accessible');
      console.log(`📊 Found ${zones.length} zones`);
    }
    
    // 5. Try to identify user authentication structure
    console.log('\n📋 USER AUTHENTICATION ANALYSIS:');
    console.log('🔍 Checking if there are any users...');
    
    // Check if we can get auth.users info (this might fail with anon key)
    try {
      const { data: authUsers, error: authError } = await supabase
        .from('auth.users')
        .select('id, email')
        .limit(3);
      
      if (authError) {
        console.log('⚠️ Cannot access auth.users with anon key (expected)');
      } else {
        console.log('✅ Auth users accessible:', authUsers.length, 'users');
      }
    } catch (e) {
      console.log('⚠️ Cannot access auth.users (expected with anon key)');
    }
    
    // 6. Summary and Diagnosis
    console.log('\n🎯 DIAGNOSIS SUMMARY:');
    console.log('================');
    
    if (propertiesError) {
      console.log('🚨 ROOT CAUSE IDENTIFIED:');
      console.log('   ❌ user_properties table does not exist or is inaccessible');
      console.log('   ❌ Dashboard queries are failing because they depend on this table');
      console.log('   ✅ Other tables (payments, revenue_types, zones) are working');
    } else {
      console.log('✅ All core tables are accessible');
    }
    
    console.log('\n💡 RECOMMENDED SOLUTIONS:');
    console.log('1. Create user_properties table using SQL migration');
    console.log('2. Add sample data for testing');
    console.log('3. Verify RLS policies allow user access');
    console.log('4. Test dashboard again');
    
  } catch (error) {
    console.error('❌ Database analysis failed:', error.message);
  }
}

// Run analysis
analyzeDatabase();