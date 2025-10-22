const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🎯 VERIFICACIÓN FINAL DEL SISTEMA');
console.log('================================\n');

async function finalSystemVerification() {
  try {
    // 1. Obtener todos los datos
    console.log('📊 OBTENIENDO DATOS ACTUALES');
    console.log('---------------------------');
    
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });
    
    const { data: corporateClients, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (companiesError || corporateError || clientsError || debtsError) {
      console.error('❌ Error al obtener datos:', {
        companies: companiesError?.message,
        corporate: corporateError?.message,
        clients: clientsError?.message,
        debts: debtsError?.message
      });
      return;
    }
    
    // 2. Mostrar resumen
    console.log(`🏢 Empresas: ${companies.length}`);
    console.log(`🏢 Clientes Corporativos: ${corporateClients.length}`);
    console.log(`👥 Clientes Regulares: ${clients.length}`);
    console.log(`💰 Deudas: ${debts.length}`);
    
    // 3. Verificar consistencia
    console.log('\n🔍 VERIFICACIÓN DE CONSISTENCIA');
    console.log('------------------------------');
    
    let issues = [];
    let successes = [];
    
    // Verificar que cada empresa tenga un cliente corporativo
    for (const company of companies) {
      const hasCorporateClient = corporateClients.some(cc => cc.company_id === company.id);
      if (hasCorporateClient) {
        successes.push(`✅ Empresa ${company.company_name} tiene cliente corporativo`);
      } else {
        issues.push(`❌ Empresa ${company.company_name} NO tiene cliente corporativo`);
      }
    }
    
    // Verificar que cada cliente regular tenga corporate_client_id
    for (const client of clients) {
      if (client.corporate_client_id) {
        const corporateExists = corporateClients.some(cc => cc.id === client.corporate_client_id);
        if (corporateExists) {
          successes.push(`✅ Cliente ${client.business_name} tiene corporate_client_id válido`);
        } else {
          issues.push(`❌ Cliente ${client.business_name} tiene corporate_client_id inválido`);
        }
      } else {
        issues.push(`❌ Cliente ${client.business_name} NO tiene corporate_client_id`);
      }
    }
    
    // Verificar que cada deuda tenga referencias válidas
    for (const debt of debts) {
      if (debt.company_id && companies.some(c => c.id === debt.company_id)) {
        successes.push(`✅ Deuda ${debt.id.substring(0, 8)}... tiene company_id válido`);
      } else {
        issues.push(`❌ Deuda ${debt.id.substring(0, 8)}... tiene company_id inválido`);
      }
      
      if (debt.client_id && clients.some(c => c.id === debt.client_id)) {
        successes.push(`✅ Deuda ${debt.id.substring(0, 8)}... tiene client_id válido`);
      } else {
        issues.push(`❌ Deuda ${debt.id.substring(0, 8)}... tiene client_id inválido`);
      }
    }
    
    // 4. Mostrar resultados
    console.log('\n✅ VERIFICACIONES EXITOSAS:');
    successes.forEach(success => console.log(`  ${success}`));
    
    if (issues.length > 0) {
      console.log('\n❌ PROBLEMAS ENCONTRADOS:');
      issues.forEach(issue => console.log(`  ${issue}`));
    }
    
    // 5. Detalles de datos
    console.log('\n📋 DETALLES DE DATOS');
    console.log('-------------------');
    
    console.log('\n🏢 EMPRESAS:');
    companies.forEach(company => {
      const corporateClient = corporateClients.find(cc => cc.company_id === company.id);
      console.log(`  ${company.company_name} (${company.id.substring(0, 8)}...)`);
      console.log(`    Email: ${company.contact_email}`);
      console.log(`    Estado: ${company.validation_status}`);
      console.log(`    Cliente Corporativo: ${corporateClient ? '✅' : '❌'} ${corporateClient ? `(${corporateClient.id.substring(0, 8)}...)` : ''}`);
      console.log('');
    });
    
    console.log('👥 CLIENTES REGULARES:');
    clients.forEach(client => {
      const corporateClient = corporateClients.find(cc => cc.id === client.corporate_client_id);
      const company = companies.find(c => c.id === client.company_id);
      console.log(`  ${client.business_name} (${client.id.substring(0, 8)}...)`);
      console.log(`    Email: ${client.contact_email}`);
      console.log(`    RUT: ${client.rut}`);
      console.log(`    Empresa: ${company?.company_name || 'SIN EMPRESA'}`);
      console.log(`    Cliente Corporativo: ${corporateClient ? '✅' : '❌'} ${corporateClient ? `(${corporateClient.contact_email})` : ''}`);
      console.log('');
    });
    
    console.log('💰 DEUDAS:');
    debts.forEach(debt => {
      const client = clients.find(c => c.id === debt.client_id);
      const company = companies.find(c => c.id === debt.company_id);
      console.log(`  Deuda ${debt.id.substring(0, 8)}...`);
      console.log(`    Monto: $${debt.current_amount?.toLocaleString('es-CL') || 'N/A'}`);
      console.log(`    Estado: ${debt.status}`);
      console.log(`    Descripción: ${debt.description}`);
      console.log(`    Empresa: ${company?.company_name || 'SIN EMPRESA'}`);
      console.log(`    Cliente: ${client?.business_name || 'SIN CLIENTE'}`);
      console.log('');
    });
    
    // 6. Estado del sistema
    console.log('🎯 ESTADO DEL SISTEMA');
    console.log('-------------------');
    
    const totalChecks = successes.length + issues.length;
    const successRate = totalChecks > 0 ? (successes.length / totalChecks * 100).toFixed(1) : 0;
    
    console.log(`✅ Verificaciones exitosas: ${successes.length}/${totalChecks} (${successRate}%)`);
    console.log(`❌ Problemas encontrados: ${issues.length}`);
    
    if (issues.length === 0) {
      console.log('\n🎉 ¡SISTEMA PERFECTAMENTE CONSISTENTE!');
      console.log('✅ Todas las empresas tienen clientes corporativos');
      console.log('✅ Todos los clientes tienen corporate_client_id');
      console.log('✅ Todas las deudas tienen referencias válidas');
      console.log('✅ El sistema está listo para producción');
    } else {
      console.log('\n⚠️ Se requieren correcciones antes de producción');
      console.log(`📝 Se encontraron ${issues.length} problemas que deben ser resueltos`);
    }
    
    // 7. Recomendaciones
    console.log('\n💡 RECOMENDACIONES');
    console.log('==================');
    
    if (issues.length === 0) {
      console.log('✅ El sistema está funcionando correctamente');
      console.log('🚀 Puede proceder con la activación del trigger en producción');
      console.log('📝 Considere ejecutar esta verificación periódicamente');
    } else {
      console.log('⚠️ Se recomienda corregir los problemas antes de continuar');
      console.log('🔧 Ejecute los scripts de reparación correspondientes');
      console.log('📊 Verifique nuevamente después de las correcciones');
    }
    
    console.log('\n📋 ARCHIVOS CREADOS:');
    console.log('  - SUPABASE_TRIGGER_SQL_ONLY.sql (SQL para trigger)');
    console.log('  - INSTRUCCIONES_TRIGGER_SUPABASE.md (Guía de instalación)');
    console.log('  - scripts/verify-complete-system.cjs (Verificación)');
    console.log('  - scripts/check-database-schema.cjs (Esquema)');
    console.log('  - scripts/final-system-verification.cjs (Verificación final)');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
  }
}

// Ejecutar verificación final
finalSystemVerification().then(() => {
  console.log('\n✅ Verificación final completada');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error en la verificación final:', error);
  process.exit(1);
});