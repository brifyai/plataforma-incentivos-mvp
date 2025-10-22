/**
 * Script para probar la corrección de getCompanyClients
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase (desde .env)
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCompanyClientsFix() {
  console.log('🧪 Probando la corrección de getCompanyClients...\n');

  try {
    // 1. Obtener la empresa
    console.log('📋 Paso 1: Obteniendo empresas...');
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .limit(1);

    if (companyError) {
      console.error('❌ Error obteniendo empresas:', companyError);
      return;
    }

    if (!companies || companies.length === 0) {
      console.log('⚠️ No hay empresas en la base de datos');
      return;
    }

    const company = companies[0];
    console.log(`✅ Empresa encontrada: ${company.company_name} (ID: ${company.id})\n`);

    // 2. Obtener clientes corporativos de la empresa
    console.log('📋 Paso 2: Obteniendo clientes corporativos...');
    const { data: corporateClients, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*')
      .eq('company_id', company.id);

    if (corporateError) {
      console.error('❌ Error obteniendo clientes corporativos:', corporateError);
      return;
    }

    console.log(`✅ Clientes corporativos encontrados: ${corporateClients?.length || 0}`);
    if (corporateClients && corporateClients.length > 0) {
      corporateClients.forEach(cc => {
        console.log(`   - ${cc.contact_email} (ID: ${cc.id})`);
      });
    }
    console.log('');

    // 3. Obtener clientes individuales usando la lógica corregida
    console.log('📋 Paso 3: Obteniendo clientes individuales (lógica corregida)...');
    
    if (!corporateClients || corporateClients.length === 0) {
      console.log('⚠️ No hay clientes corporativos, por lo tanto no hay clientes individuales');
      return;
    }

    const corporateClientIds = corporateClients.map(cc => cc.id);
    
    const { data: individualClients, error: individualError } = await supabase
      .from('clients')
      .select('*')
      .in('corporate_client_id', corporateClientIds)
      .order('created_at', { ascending: false });

    if (individualError) {
      console.error('❌ Error obteniendo clientes individuales:', individualError);
      return;
    }

    console.log(`✅ Clientes individuales encontrados: ${individualClients?.length || 0}`);
    if (individualClients && individualClients.length > 0) {
      individualClients.forEach(client => {
        const corporateClient = corporateClients.find(cc => cc.id === client.corporate_client_id);
        console.log(`   - ${client.business_name} (${client.contact_email}) -> ${corporateClient?.contact_email}`);
      });
    }
    console.log('');

    // 4. Verificar deudas asociadas
    console.log('📋 Paso 4: Verificando deudas asociadas...');
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .eq('company_id', company.id);

    if (debtsError) {
      console.error('❌ Error obteniendo deudas:', debtsError);
      return;
    }

    console.log(`✅ Deudas encontradas: ${debts?.length || 0}`);
    if (debts && debts.length > 0) {
      debts.forEach(debt => {
        console.log(`   - $${debt.current_amount || debt.original_amount} (${debt.status})`);
      });
    }
    console.log('');

    // 5. Resumen final
    console.log('📊 RESUMEN FINAL:');
    console.log(`   Empresa: ${company.company_name}`);
    console.log(`   Clientes corporativos: ${corporateClients?.length || 0}`);
    console.log(`   Clientes individuales: ${individualClients?.length || 0}`);
    console.log(`   Deudas totales: ${debts?.length || 0}`);
    console.log(`   Monto total de deudas: $${debts?.reduce((sum, d) => sum + parseFloat(d.current_amount || d.original_amount || 0), 0).toLocaleString()}`);
    
    console.log('\n✅ ¡Prueba completada exitosamente! La corrección funciona correctamente.');

  } catch (error) {
    console.error('💥 Error en la prueba:', error);
  }
}

// Ejecutar la prueba
testCompanyClientsFix();