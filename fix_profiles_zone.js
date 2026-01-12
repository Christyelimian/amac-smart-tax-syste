/**
 * Fix Profiles Table Zone Column
 * Adds the missing 'zone' column to the profiles table
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: './frontend/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are set in frontend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixProfilesTable() {
  console.log('🔧 Fixing profiles table zone column...\n');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'fix_profiles_zone_column.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📄 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);

        try {
          const { data, error } = await supabase.rpc('exec_sql', {
            sql: statement + ';'
          });

          if (error) {
            console.log(`⚠️ Statement ${i + 1} error:`, error.message);
            // Continue with other statements
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.log(`⚠️ Statement ${i + 1} failed:`, err.message);
        }
      }
    }

    console.log('\n🔍 Verifying the fix...');

    // Check if zone column exists now
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles')
      .eq('column_name', 'zone');

    if (columnsError) {
      console.log('❌ Error checking columns:', columnsError.message);
    } else if (columns && columns.length > 0) {
      console.log('✅ Zone column successfully added!');
      console.log('📋 Column details:', columns[0]);
    } else {
      console.log('❌ Zone column still missing');
    }

    // Test profile creation
    console.log('\n🧪 Testing profile creation...');
    const testUserId = 'test-fix-' + Date.now();

    const { data: testProfile, error: testError } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        email: 'test@example.com',
        full_name: 'Test User',
        phone: '+1234567890',
        zone: 'a'
      })
      .select()
      .single();

    if (testError) {
      console.log('❌ Profile creation test failed:', testError.message);
    } else {
      console.log('✅ Profile creation test successful!');
      console.log('📋 Created profile:', testProfile);

      // Clean up test profile
      await supabase.from('profiles').delete().eq('id', testUserId);
      console.log('🧹 Cleaned up test profile');
    }

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

// Alternative approach using direct SQL execution
async function fixWithDirectSQL() {
  console.log('🔧 Attempting direct SQL execution...\n');

  try {
    // First, check if zone column exists
    const { data: existingColumns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles')
      .eq('column_name', 'zone');

    if (checkError) {
      console.log('❌ Error checking existing columns:', checkError.message);
      return;
    }

    if (existingColumns && existingColumns.length > 0) {
      console.log('ℹ️ Zone column already exists');
      return;
    }

    // Add zone column
    console.log('📝 Adding zone column...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.profiles ADD COLUMN zone public.zone DEFAULT \'a\';'
    });

    if (alterError) {
      console.log('❌ Failed to add zone column:', alterError.message);
    } else {
      console.log('✅ Zone column added successfully!');
    }

  } catch (error) {
    console.error('❌ Direct SQL fix failed:', error.message);
  }
}

// Run the fix
fixProfilesTable().then(() => {
  console.log('\n🎉 Profiles table fix completed!');
}).catch(console.error);
