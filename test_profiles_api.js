import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kfummdjejjjccfbzzifc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmdW1tZGplampqY2NmYnp6aWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2OTIyMzQsImV4cCI6MjA4MzI2ODIzNH0.MWQbDQ0YINAAWC0OpByVE4tCWWHlVWE4rXnRi8d_sYg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProfilesAPI() {
  console.log('🧪 Testing Supabase REST API for profiles...\n');

  try {
    // Test 1: Check if profiles table exists via REST API
    console.log('1️⃣ Testing profiles table accessibility via REST API...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .limit(1);

    if (profilesError) {
      console.log('❌ Profiles REST API Error:', profilesError.message);
      if (profilesError.message.includes('404')) {
        console.log('🔍 This confirms the 404 error you were seeing!');
      }
    } else {
      console.log('✅ Profiles REST API works!');
      console.log('Sample profile:', profiles[0] || 'No profiles found');
    }

    // Test 2: Check if user_roles table works
    console.log('\n2️⃣ Testing user_roles table...');
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .limit(1);

    if (rolesError) {
      console.log('❌ User roles Error:', rolesError.message);
    } else {
      console.log('✅ User roles works!');
      console.log('Sample role:', roles[0] || 'No roles found');
    }

    // Test 3: Simulate the exact failing query from AuthContext
    console.log('\n3️⃣ Testing the exact failing query from AuthContext...');
    const testUserId = '0b58dcc2-560c-4f99-a303-bf329d4a60aa';

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();

    if (profileError) {
      console.log('❌ AuthContext query fails:', profileError.message);
      console.log('This is the exact error you were seeing in the browser!');
    } else {
      console.log('✅ AuthContext query works!');
      console.log('Profile found:', profile);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testProfilesAPI();
