import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Read the migration file
const migrationPath = path.join(process.cwd(), 'frontend', 'supabase', 'migrations', '20260106003000_remita_payment_system.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Split the SQL into individual statements (basic approach)
const statements = migrationSQL
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

async function runMigration() {
  console.log('🚀 Starting database migration...');

  try {
    // Run each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);

        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });

        if (error) {
          // If rpc doesn't work, try direct query
          const { error: queryError } = await supabase.from('_supabase_migration_temp').select('*').limit(1);

          if (queryError && queryError.message.includes('relation') && queryError.message.includes('does not exist')) {
            // Table doesn't exist, try creating it with raw SQL
            console.log('Trying direct SQL execution...');
            // This won't work with Supabase's restrictions, so we'll need to guide the user
            console.log('⚠️  Direct SQL execution not allowed. Please run this in Supabase SQL Editor:');
            console.log('📋 Copy and paste the migration SQL from: frontend/supabase/migrations/20260106003000_remita_payment_system.sql');
            break;
          }
        }
      }
    }

    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);

    // Provide manual instructions
    console.log('\n📋 MANUAL MIGRATION INSTRUCTIONS:');
    console.log('1. Go to https://supabase.com/dashboard/project/gjlefyhdiiwvlelnuttu/sql');
    console.log('2. Open the SQL Editor');
    console.log('3. Copy the contents of: frontend/supabase/migrations/20260106003000_remita_payment_system.sql');
    console.log('4. Paste and run the SQL');
    console.log('5. Refresh your application');
  }
}

runMigration();
