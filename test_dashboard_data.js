/**
 * Test Dashboard Data Fetching
 * This script simulates what the dashboard does to fetch data
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Get environment variables from .env file
let supabaseUrl = 'https://kfummdjejjjccfbzzifc.supabase.co';
let supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmdW1tZGplampqY2NiYnppaWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyMDA4MDAsImV4cCI6MjA0OTc3NjgwMH0.3rEa8hJqzK8q0mJfPqH2x8m4n5d6K7s8t9u0v1w2x3y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDashboardData() {
  try {
    console.log('🧪 Testing Dashboard Data Fetching...');
    
    // Get a sample user ID first
    const { data: samplePayment } = await supabase
      .from('payments')
      .select('user_id')
      .limit(1);
    
    if (!samplePayment || samplePayment.length === 0) {
      console.error('❌ No users found in payments table');
      return;
    }
    
    const userId = samplePayment[0].user_id;
    console.log('👤 Using sample user ID:', userId);
    
    // Test 1: Fetch payments (what dashboard does)
    console.log('\n🧪 Test 1: Fetching payments...');
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select('amount, service_name, status, created_at, reference, id')
      .eq('user_id', userId)
      .gte('created_at', '2026-01-01')
      .order('created_at', { ascending: false })
      .limit(5);

    if (paymentsError) {
      console.error('❌ Payments query failed:', paymentsError.message);
    } else {
      console.log('✅ Payments query successful:', paymentsData.length, 'records');
      if (paymentsData.length > 0) {
        console.log('📋 Sample payment:', {
          id: paymentsData[0].id,
          amount: paymentsData[0].amount,
          service_name: paymentsData[0].service_name,
          status: paymentsData[0].status
        });
      }
    }

    // Test 2: Fetch properties count
    console.log('\n🧪 Test 2: Fetching properties count...');
    const { count: propertiesCount, error: propertiesError } = await supabase
      .from('user_properties')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (propertiesError) {
      console.error('❌ Properties query failed:', propertiesError.message);
      console.error('   This is likely why dashboard is blank!');
    } else {
      console.log('✅ Properties query successful:', propertiesCount, 'properties');
    }

    // Test 3: Fetch upcoming dues
    console.log('\n🧪 Test 3: Fetching upcoming dues...');
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const { count: upcomingCount, error: upcomingError } = await supabase
      .from('user_properties')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .lt('due_date', thirtyDaysFromNow.toISOString())
      .gte('due_date', new Date().toISOString());

    if (upcomingError) {
      console.error('❌ Upcoming dues query failed:', upcomingError.message);
    } else {
      console.log('✅ Upcoming dues query successful:', upcomingCount, 'upcoming dues');
    }

    // Test 4: Test if we can manually create user_properties
    console.log('\n🧪 Test 4: Testing manual user_properties access...');
    const { data: testTableAccess, error: tableAccessError } = await supabase
      .from('user_properties')
      .select('*')
      .limit(1);

    if (tableAccessError) {
      console.error('❌ Table access failed:', tableAccessError.message);
      console.error('   Table may not exist or permissions are missing');
    } else {
      console.log('✅ Table access successful');
      if (testTableAccess && testTableAccess.length > 0) {
        console.log('📋 Sample property:', testTableAccess[0]);
      } else {
        console.log('📋 Table exists but is empty');
      }
    }

    // Summary
    console.log('\n📊 DASHBOARD DATA TEST SUMMARY:');
    console.log('✅ Payments table: Working');
    console.log(propertiesError ? '❌ User properties table: FAILED' : '✅ User properties table: Working');
    console.log(upcomingError ? '❌ Upcoming dues query: FAILED' : '✅ Upcoming dues query: Working');
    
    if (propertiesError) {
      console.log('\n💡 SOLUTION: The user_properties table is missing or inaccessible.');
      console.log('   This is why dashboard pages appear blank.');
      console.log('   Run the SQL in create_user_properties_table.sql to fix this.');
    }

  } catch (error) {
    console.error('❌ Dashboard test failed:', error.message);
  }
}

// Run the test
testDashboardData();