import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './.env' });

// Hardcoded for testing (remove after confirming it works)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kfummdjejjjccfbzzifc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmdW1tZGplampqY2NmYnp6aWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2OTIyMzQsImV4cCI6MjA4MzI2ODIzNH0.MWQbDQ0YINAAWC0OpByVE4tCWWHlVWE4rXnRi8d_sYg';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Checking current database state...\n');

  try {
    // Check if payments table exists
    console.log('📋 Checking tables:');
    const tables = [
      'payments',
      'user_roles',
      'revenue_types',
      'zones',
      'receipts',
      'reminders',
      'reconciliation_log',
      'payment_history',
      'virtual_accounts'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ ${table} - Error: ${error.message}`);
        } else {
          console.log(`✅ ${table} - Exists`);
        }
      } catch (err) {
        console.log(`❌ ${table} - Error: ${err.message}`);
      }
    }

    console.log('\n📊 Checking data counts:');

    // Check data in key tables
    const dataChecks = [
      { table: 'revenue_types', description: 'Revenue Types' },
      { table: 'zones', description: 'Zones' },
      { table: 'payments', description: 'Payments' }
    ];

    for (const check of dataChecks) {
      try {
        const { count, error } = await supabase
          .from(check.table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`❌ ${check.description}: Error - ${error.message}`);
        } else {
          console.log(`✅ ${check.description}: ${count} records`);
        }
      } catch (err) {
        console.log(`❌ ${check.description}: Error - ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
}

checkDatabase();
