import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kfummdjejjjccfbzzifc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmdW1tZGplampqY2NmYnp6aWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzY5MjIzNCwiZXhwIjoyMDgzMjY4MjM0fQ.s9Lv9O9FdoRxB6UCPOLssZI4vhd1Z8y52hS7no71enw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLS() {
  try {
    console.log('Creating RLS policies...');
    
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Allow public payment inserts" ON public.payments;
        DROP POLICY IF EXISTS "Allow public payment reads" ON public.payments;
        
        CREATE POLICY "Allow public payment inserts"
        ON public.payments
        FOR INSERT
        TO anon
        WITH CHECK (true);
        
        CREATE POLICY "Allow public payment reads"
        ON public.payments
        FOR SELECT
        TO anon
        USING (true);
      `
    });
    
    if (error) {
      console.error('Error creating policies:', error);
    } else {
      console.log('✅ RLS policies created successfully!');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

fixRLS();