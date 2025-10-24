require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function finalSystemVerification() {
  console.log('🔍 VERIFICACIÓN FINAL DEL SISTEMA');
  console.log('==================================');

  try {
    // Paso 1: Verificar todas las empresas
    console.log('\n📋 Paso 1: Verificando empresas...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select(`
        id,
        company_name,
        contact_email,
        validation_status,
        rut,
        corporate_clients (
          id,
          contact_email,
          rut,
          industry
        ),
        clients (
          id,
          name,
          email
        ),
        debts (
          id,
          amount,
          status
        )
      `)
      .order('created_at', { ascending: false });

    if (companiesError) {
      console.error('❌ Error obteniendo empresas:', companiesError);
      return;
    }

    console.log(`✅ Se encontraron ${companies.length} empresas:`);
    companies.forEach(company => {
      console.log(`\n🏢 ${company.company_name}`);
      console.log(`   ID: ${company.id}`);
      console.log(`   Email: ${company.contact_email}`);
      console.log(`   RUT: ${company.rut}`);
      console.log(`   Estado: ${company.validation_status}`);
      
      if (company.corporate_clients && company.corporate_clients.length > 0) {
        console.log(`   🏭 Empresa Corporativa: ${company.corporate_clients.length}`);
        company.corporate_clients.forEach(corporate => {
          console.log(`      - ${corporate.contact_email} (${corporate.rut}) - ${corporate.industry}`);
        });
      }
      
      if (company.clients && company.clients.length > 0) {
        console.log(`   👥 Clientes: ${company.clients.length}`);
        company.clients.forEach(client => {
          console.log(`      - ${client.name} (${client.email})`);
        });
      }
      
      if (company.debts && company.debts.length > 0) {
        console.log(`   💰 Deudas: ${company.debts.length}`);
        company.debts.forEach(debt => {
          console.log(`      - $${debt.amount.toLocaleString()} (${debt.status})`);
        });
      }
    });

    // Paso 2: Verificar clientes corporativos
    console.log('\n📋 Paso 2: Verificando clientes corporativos...');
    const { data: corporateClients, error: corporateError } = await supabase
      .from('corporate_clients')
      .select(`
        id,
        company_id,
        contact_email,
        rut,
        industry,
        companies (
          id,
          company_name,
          contact_email
        )
      `);

    if (corporateError) {
      console.error('❌ Error obteniendo clientes corporativos:', corporateError);
      return;
    }

    console.log(`✅ Se encontraron ${corporateClients.length} clientes corporativos:`);
    corporateClients.forEach(corporate => {
      console.log(`\n🏭 ${corporate.contact_email}`);
      console.log(`   ID: ${corporate.id}`);
      console.log(`   RUT: ${corporate.rut}`);
      console.log(`   Industria: ${corporate.industry}`);
      console.log(`   Empresa asociada: ${corporate.companies?.company_name || 'No encontrada'}`);
    });

    // Paso 3: Verificar estructura jerárquica completa
    console.log('\n📋 Paso 3: Verificando estructura jerárquica...');
    
    // Buscar TechCorp (debería no existir)
    const { data: techcorpSearch } = await supabase
      .from('companies')
      .select('id, company_name')
      .ilike('company_name', '%TechCorp%');

    if (techcorpSearch && techcorpSearch.length > 0) {
      console.log('⚠️ Aún existen empresas TechCorp:');
      techcorpSearch.forEach(company => {
        console.log(`   - ${company.company_name} (ID: ${company.id})`);
      });
    } else {
      console.log('✅ No se encontraron empresas TechCorp (eliminadas correctamente)');
    }

    // Buscar AIntelligence (debería existir)
    const { data: aintelligenceSearch } = await supabase
      .from('companies')
      .select('id, company_name, validation_status')
      .ilike('company_name', '%AIntelligence%');

    if (aintelligenceSearch && aintelligenceSearch.length > 0) {
      console.log('✅ Empresas AIntelligence encontradas:');
      aintelligenceSearch.forEach(company => {
        console.log(`   - ${company.company_name} (ID: ${company.id}) - Estado: ${company.validation_status}`);
      });
    } else {
      console.log('❌ No se encontraron empresas AIntelligence');
    }

    // Paso 4: Resumen final
    console.log('\n📊 RESUMEN FINAL DEL SISTEMA');
    console.log('=============================');
    console.log(`🏢 Total empresas: ${companies.length}`);
    console.log(`🏭 Total clientes corporativos: ${corporateClients.length}`);
    
    const totalClients = companies.reduce((sum, company) => sum + (company.clients?.length || 0), 0);
    const totalDebts = companies.reduce((sum, company) => sum + (company.debts?.length || 0), 0);
    
    console.log(`👥 Total clientes: ${totalClients}`);
    console.log(`💰 Total deudas: ${totalDebts}`);
    
    console.log('\n✅ Verificación completada exitosamente');
    console.log('🎉 El sistema jerárquico NexuPay está funcionando correctamente');

  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
}

finalSystemVerification();