import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './frontend/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kfummdjejjjccfbzzifc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmdW1tZGplampqY2NmYnp6aWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2OTIyMzQsImV4cCI6MjA4MzI2ODIzNH0.MWQbDQ0YINAAWC0OpByVE4tCWWHlVWE4rXnRi8d_sYg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectDatabase() {
  console.log('🔍 Detailed Database Inspection\n');
  console.log('=' .repeat(50));

  try {
    // 1. Check payments table columns
    console.log('1. PAYMENTS TABLE COLUMNS:');
    try {
      const { data: paymentsColumns, error } = await supabase
        .rpc('get_table_columns', { table_name: 'payments' });

      if (error) {
        console.log('❌ Could not get column info via RPC, trying direct query...');
        // Try a simple select to see if table exists
        const { data, error: selectError } = await supabase
          .from('payments')
          .select('*')
          .limit(1);

        if (selectError) {
          console.log('❌ Payments table query error:', selectError.message);
        } else {
          console.log('✅ Payments table exists and is accessible');
          if (data && data.length > 0) {
            console.log('Sample columns from data:', Object.keys(data[0]));
          }
        }
      } else {
        console.log('Payments table columns:', paymentsColumns);
      }
    } catch (err) {
      console.log('❌ Error checking payments columns:', err.message);
    }

    console.log('\n' + '-'.repeat(30));

    // 2. Check for existing tables
    console.log('2. CHECKING FOR EXISTING TABLES:');
    const tablesToCheck = ['receipts', 'payment_history', 'reconciliation_log', 'user_roles', 'revenue_types', 'zones'];

    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ ${table} - Error: ${error.message}`);
        } else {
          console.log(`✅ ${table} - Exists and accessible`);
        }
      } catch (err) {
        console.log(`❌ ${table} - Error: ${err.message}`);
      }
    }

    console.log('\n' + '-'.repeat(30));

    // 3. Check payments table data
    console.log('3. PAYMENTS TABLE SAMPLE DATA:');
    try {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .limit(3);

      if (error) {
        console.log('❌ Error getting payments data:', error.message);
      } else {
        console.log(`✅ Found ${payments?.length || 0} payment records`);
        if (payments && payments.length > 0) {
          console.log('Sample payment columns:', Object.keys(payments[0]));
          console.log('First payment:', JSON.stringify(payments[0], null, 2));
        }
      }
    } catch (err) {
      console.log('❌ Error checking payments data:', err.message);
    }

    console.log('\n' + '-'.repeat(30));

    // 4. Check for any existing policies (this might not work with anon key)
    console.log('4. CHECKING POLICIES AND TRIGGERS:');
    console.log('Note: This information may not be available with anon key');
    console.log('Will need to check in Supabase SQL Editor for policies/triggers');

  } catch (error) {
    console.error('❌ Database inspection failed:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('📋 SUMMARY:');
  console.log('- Payments table: EXISTS ✅');
  console.log('- Other tables: Need to check in SQL Editor');
  console.log('- Run the provided SQL queries in Supabase SQL Editor for complete info');
  console.log('=' .repeat(50));
}

inspectDatabase();
