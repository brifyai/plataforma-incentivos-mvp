/**
 * Script to apply the client_id column migration to the debts table
 * This fixes the issue where getCompanyDebts fails because client_id column doesn't exist
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyClientIdMigration() {
  try {
    console.log('🔄 Applying client_id column migration to debts table...');

    // First, check if the column already exists
    const { data: columns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'debts')
      .eq('column_name', 'client_id')
      .eq('table_schema', 'public');

    if (checkError) {
      console.error('❌ Error checking if client_id column exists:', checkError);
      return;
    }

    if (columns && columns.length > 0) {
      console.log('✅ client_id column already exists in debts table');
      return;
    }

    console.log('📝 client_id column does not exist, adding it...');

    // Apply the migration SQL directly
    const migrationSQL = `
      -- Add the client_id column as a foreign key to clients table
      ALTER TABLE public.debts 
      ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
      
      -- Add index for better query performance
      CREATE INDEX IF NOT EXISTS idx_debts_client_id ON public.debts(client_id);
      
      -- Optional: Create a composite index for company_id + client_id queries
      CREATE INDEX IF NOT EXISTS idx_debts_company_client ON public.debts(company_id, client_id) WHERE client_id IS NOT NULL;
    `;

    // Execute the migration using RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Error applying migration:', error);
      
      // Try alternative approach using direct SQL if RPC fails
      console.log('🔄 Trying alternative approach...');
      
      try {
        // Add client_id column
        const { error: alterError } = await supabase
          .from('debts')
          .select('id')
          .limit(1); // This will fail if column doesn't exist, but we need to try a different approach
        
        if (alterError) {
          console.log('⚠️ Cannot add column directly via JS API. You need to run the SQL manually:');
          console.log('\n-- Run this SQL in your Supabase SQL Editor:\n');
          console.log(migrationSQL);
          console.log('\nOr use the Supabase CLI: supabase db push');
        }
      } catch (e) {
        console.log('⚠️ Cannot add column directly via JS API. You need to run the SQL manually:');
        console.log('\n-- Run this SQL in your Supabase SQL Editor:\n');
        console.log(migrationSQL);
        console.log('\nOr use the Supabase CLI: supabase db push');
      }
    } else {
      console.log('✅ Migration applied successfully!');
    }

    // Verify the column was added
    console.log('🔍 Verifying the column was added...');
    const { data: verifyColumns, error: verifyError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'debts')
      .eq('column_name', 'client_id')
      .eq('table_schema', 'public');

    if (verifyError) {
      console.error('❌ Error verifying column:', verifyError);
    } else if (verifyColumns && verifyColumns.length > 0) {
      console.log('✅ client_id column verified:', verifyColumns[0]);
    } else {
      console.log('⚠️ Column verification failed. Please check manually.');
    }

  } catch (error) {
    console.error('💥 Error in applyClientIdMigration:', error);
  }
}

// Also create a function to check the current state of the debts table
async function checkDebtsTableStructure() {
  try {
    console.log('\n🔍 Current structure of debts table:');
    
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'debts')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (error) {
      console.error('❌ Error getting table structure:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('📋 Columns in debts table:');
      data.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } else {
      console.log('⚠️ No columns found or table does not exist');
    }

    // Check if client_id specifically exists
    const hasClientId = data?.some(col => col.column_name === 'client_id');
    console.log(`\n🎯 client_id column exists: ${hasClientId ? '✅ YES' : '❌ NO'}`);

  } catch (error) {
    console.error('💥 Error checking table structure:', error);
  }
}

// Run the functions
async function main() {
  await checkDebtsTableStructure();
  await applyClientIdMigration();
  await checkDebtsTableStructure(); // Check again after migration
}

main();