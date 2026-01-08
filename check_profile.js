import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kfummdjejjjccfbzzifc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmdW1tZGplampqY2NmYnp6aWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2OTIyMzQsImV4cCI6MjA4MzI2ODIzNH0.MWQbDQ0YINAAWC0OpByVE4tCWWHlVWE4rXnRi8d_sYg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfile() {
  const userId = '0b58dcc2-560c-4f99-a303-bf329d4a60aa';

  try {
    console.log('🔍 Checking profile for user:', userId);

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.log('❌ Profile not found:', profileError.message);
    } else {
      console.log('✅ Profile found:', profile);
    }

    // Check if user exists in auth.users (we can't directly query this, but we can try to get user metadata)
    console.log('\n🔍 Checking if user exists in auth...');

    // Check user roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);

    if (rolesError) {
      console.log('❌ Error checking roles:', rolesError.message);
    } else {
      console.log('✅ User roles found:', roles);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkProfile();
