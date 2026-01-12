/**
 * Check and Create Missing Database Tables
 * This script checks what tables exist and creates missing ones
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Get environment variables
let supabaseUrl = 'https://kfummdjejjjccfbzzifc.supabase.co';
let supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmdW1tZGplampqY2NiYnppaWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyMDA4MDAsImV4cCI6MjA0OTc3NjgwMH0.3rEa8hJqzK8q0mJfPqH2x8m4n5d6K7s8t9u0v1w2x3y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndCreateTables() {
  try {
    console.log('🔍 Checking existing tables...');
    
    // Get all tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');
    
    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError.message);
      return;
    }
    
    const existingTables = tables.map(t => t.table_name);
    console.log('📋 Existing tables:', existingTables);
    
    // Check if user_properties table exists
    if (!existingTables.includes('user_properties')) {
      console.log('⚠️ user_properties table missing - creating it...');
      
      // Create user_properties table
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.user_properties (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            property_name TEXT NOT NULL,
            property_type TEXT NOT NULL,
            address TEXT NOT NULL,
            zone TEXT,
            revenue_type TEXT NOT NULL,
            annual_amount DECIMAL(15,2) NOT NULL,
            due_date DATE NOT NULL,
            status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'paid')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Create indexes
          CREATE INDEX IF NOT EXISTS idx_user_properties_user_id ON public.user_properties(user_id);
          CREATE INDEX IF NOT EXISTS idx_user_properties_status ON public.user_properties(status);
          CREATE INDEX IF NOT EXISTS idx_user_properties_due_date ON public.user_properties(due_date);
          
          -- Enable RLS
          ALTER TABLE public.user_properties ENABLE ROW LEVEL SECURITY;
          
          -- Create RLS policies
          CREATE POLICY "Users can view their own properties" ON public.user_properties
            FOR SELECT USING (auth.uid() = user_id);
            
          CREATE POLICY "Users can insert their own properties" ON public.user_properties
            FOR INSERT WITH CHECK (auth.uid() = user_id);
            
          CREATE POLICY "Users can update their own properties" ON public.user_properties
            FOR UPDATE USING (auth.uid() = user_id);
            
          CREATE POLICY "Users can delete their own properties" ON public.user_properties
            FOR DELETE USING (auth.uid() = user_id);
        `
      });
      
      if (createError) {
        console.error('❌ Error creating user_properties table:', createError.message);
      } else {
        console.log('✅ user_properties table created successfully');
      }
    } else {
      console.log('✅ user_properties table already exists');
    }
    
    // Add some sample data if table is empty
    const { data: sampleData, error: sampleError } = await supabase
      .from('user_properties')
      .select('*')
      .limit(1);
    
    if (!sampleError && (!sampleData || sampleData.length === 0)) {
      console.log('📝 Adding sample user_properties data...');
      
      // Get a sample user ID from payments table
      const { data: payments } = await supabase
        .from('payments')
        .select('user_id')
        .limit(1);
      
      if (payments && payments.length > 0) {
        const sampleUserId = payments[0].user_id;
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
        
        const { error: insertError } = await supabase
          .from('user_properties')
          .insert([
            {
              user_id: sampleUserId,
              property_name: 'Sample Residential Property',
              property_type: 'Residential',
              address: '123 Sample Street, Abuja',
              zone: 'A',
              revenue_type: 'Tenement Rate',
              annual_amount: 50000,
              due_date: nextMonth.toISOString().split('T')[0],
              status: 'active'
            },
            {
              user_id: sampleUserId,
              property_name: 'Sample Commercial Property',
              property_type: 'Commercial',
              address: '456 Business Avenue, Abuja',
              zone: 'B',
              revenue_type: 'Business Premises Permit',
              annual_amount: 75000,
              due_date: nextMonth.toISOString().split('T')[0],
              status: 'active'
            }
          ]);
        
        if (insertError) {
          console.error('❌ Error inserting sample data:', insertError.message);
        } else {
          console.log('✅ Sample data added successfully');
        }
      }
    }
    
    // Test the dashboard queries
    console.log('\n🧪 Testing dashboard queries...');
    
    // Test payments query
    const { data: testPayments, error: paymentsError } = await supabase
      .from('payments')
      .select('amount, service_name, status, created_at, reference, id')
      .gte('created_at', '2026-01-01')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (paymentsError) {
      console.error('❌ Payments query failed:', paymentsError.message);
    } else {
      console.log('✅ Payments query successful:', testPayments.length, 'records');
    }
    
    // Test user_properties query
    const { data: testProperties, error: propertiesError } = await supabase
      .from('user_properties')
      .select('*')
      .limit(5);
    
    if (propertiesError) {
      console.error('❌ User properties query failed:', propertiesError.message);
    } else {
      console.log('✅ User properties query successful:', testProperties.length, 'records');
    }
    
    console.log('\n🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
  }
}

// Run the setup
checkAndCreateTables();