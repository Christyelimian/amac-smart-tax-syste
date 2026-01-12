/**
 * Check Database Schema
 * Examine the actual structure of the payments table
 */

const { createClient } = require('@supabase/supabase-js');

// Environment configuration
let supabaseUrl = 'https://kfummdjejjjccfbzzifc.supabase.co';
let supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmdW1tZGplampqY2NmYnp6aWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2OTIyMzQsImV4cCI6MjA4MzI2ODIzNH0.MWQbDQ0YINAAWC0OpByVE4tCWWHlVWE4rXnRi8d_sYg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    console.log('🔍 Checking Payments Table Schema...');
    
    // Get a sample payment to see the actual columns
    const { data: samplePayment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .limit(1);
    
    if (paymentError) {
      console.error('❌ Error accessing payments:', paymentError.message);
      return;
    }
    
    if (samplePayment && samplePayment.length > 0) {
      console.log('✅ Sample payment structure:');
      console.log(JSON.stringify(samplePayment[0], null, 2));
      
      console.log('\n📋 Available columns:');
      Object.keys(samplePayment[0]).forEach(key => {
        console.log(`   - ${key}: ${typeof samplePayment[0][key]}`);
      });
    }
    
    // Try to get table schema from information_schema
    console.log('\n🔍 Getting table schema from information_schema...');
    
    const { data: columns, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'payments')
      .order('ordinal_position');
    
    if (schemaError) {
      console.error('❌ Error getting schema:', schemaError.message);
      console.log('⚠️ This is expected with anon key - using sample data instead');
    } else {
      console.log('✅ Payments table schema:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
  }
}

// Run the check
checkSchema();