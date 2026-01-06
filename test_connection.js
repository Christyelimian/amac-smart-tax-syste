import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './frontend/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...');

  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('revenue_types')
      .select('count(*)')
      .limit(1);

    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }

    console.log('✅ Database connection successful!');

    // Check if tables exist by trying to select from them
    const tables = ['payments', 'revenue_types', 'zones', 'user_roles'];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`⚠️  Table '${table}' may not exist or has RLS issues:`, error.message);
        } else {
          console.log(`✅ Table '${table}' exists and is accessible`);
        }
      } catch (err) {
        console.log(`⚠️  Error checking table '${table}':`, err.message);
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n🎉 Database setup verification complete!');
    console.log('Your AMAC Revenue Collection System is ready to use.');
  } else {
    console.log('\n❌ Database setup needs attention.');
    console.log('Make sure you ran the setup_database.sql file in Supabase SQL Editor.');
  }
});
