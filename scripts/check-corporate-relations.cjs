require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCorporateRelations() {
  console.log('🔍 Verificando relaciones Empresa → Cliente Corporativo');
  console.log('==================================================');

  try {
    // Obtener empresas con sus clientes corporativos
    const { data: companies, error } = await supabase
      .from('companies')
      .select(`
        id,
        company_name,
        contact_email,
        corporate_clients (
          id,
          contact_email,
          rut,
          industry
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log(`✅ ${companies.length} empresas encontradas:\n`);
    
    companies.forEach(company => {
      console.log(`🏢 ${company.company_name}`);
      console.log(`   ID: ${company.id}`);
      console.log(`   Email: ${company.contact_email}`);
      
      if (company.corporate_clients && company.corporate_clients.length > 0) {
        console.log(`   🏭 Clientes Corporativos (${company.corporate_clients.length}):`);
        company.corporate_clients.forEach(corporate => {
          console.log(`      - ${corporate.contact_email} (RUT: ${corporate.rut}) - ${corporate.industry}`);
        });
      } else {
        console.log(`   🏭 Clientes Corporativos: Ninguno`);
      }
      console.log('');
    });

    // Verificar específicamente NexuPay Cobranzas
    const nexuPay = companies.find(c => c.company_name === 'NexuPay Cobranzas');
    if (nexuPay) {
      console.log('🎯 Análisis específico para NexuPay Cobranzas:');
      console.log(`   - Empresa ID: ${nexuPay.id}`);
      console.log(`   - Clientes corporativos: ${nexuPay.corporate_clients?.length || 0}`);
      
      if (nexuPay.corporate_clients && nexuPay.corporate_clients.length > 0) {
        nexuPay.corporate_clients.forEach(corporate => {
          console.log(`     * ${corporate.contact_email} - ${corporate.industry}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
}

checkCorporateRelations();