const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA2OTI3NiwiZXhwIjoyMDc2NjQ1Mjc2fQ.q1J2s2Jk3V4R5t6u7v8w9x0y1z2a3b4c5d6e7f8g9h';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVerificationStatus() {
  try {
    console.log('🔍 Verificando estado de company_verifications...');
    
    const companyId = '7c834069-d92e-44b1-b0c0-474310fad1ff';
    
    // Verificar company_verifications
    const { data: verifications, error: verificationError } = await supabase
      .from('company_verifications')
      .select('*')
      .eq('company_id', companyId)
      .order('updated_at', { ascending: false });
    
    if (verificationError) {
      console.error('❌ Error en company_verifications:', verificationError);
    } else {
      console.log('📋 Company_verifications:');
      console.log(JSON.stringify(verifications, null, 2));
    }
    
    // Verificar companies
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .select('id, company_name, validation_status, updated_at')
      .eq('id', companyId);
    
    if (companyError) {
      console.error('❌ Error en companies:', companyError);
    } else {
      console.log('🏢 Companies:');
      console.log(JSON.stringify(companies, null, 2));
    }
    
    // Verificar todas las verificaciones
    const { data: allVerifications, error: allError } = await supabase
      .from('company_verifications')
      .select(`
        id,
        company_id,
        status,
        submitted_at,
        updated_at,
        company:companies (
          company_name,
          validation_status
        )
      `)
      .order('updated_at', { ascending: false })
      .limit(10);
    
    if (allError) {
      console.error('❌ Error obteniendo todas las verificaciones:', allError);
    } else {
      console.log('📊 Todas las verificaciones (últimas 10):');
      allVerifications.forEach(v => {
        console.log(`- ${v.company?.company_name}: ${v.status} (company validation_status: ${v.company?.validation_status})`);
      });
    }
    
  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

checkVerificationStatus();