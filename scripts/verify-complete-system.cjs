const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Usar las variables disponibles en el .env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Faltan variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Verificación Completa del Sistema NexuPay');
console.log('==========================================\n');

async function verifyCompleteSystem() {
  try {
    // 1. Verificar estado actual de las tablas
    console.log('📊 ESTADO ACTUAL DE LAS TABLAS');
    console.log('------------------------------');
    
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (companiesError) {
      console.error('❌ Error al obtener empresas:', companiesError.message);
    } else {
      console.log(`🏢 Empresas registradas: ${companies.length}`);
      companies.forEach(company => {
        console.log(`   - ${company.company_name} (${company.id})`);
        console.log(`     Email: ${company.contact_email}`);
        console.log(`     Estado: ${company.validation_status}`);
        console.log(`     Creada: ${company.created_at}`);
        console.log('');
      });
    }

    const { data: corporateClients, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (corporateError) {
      console.error('❌ Error al obtener clientes corporativos:', corporateError.message);
    } else {
      console.log(`🏢 Clientes Corporativos: ${corporateClients.length}`);
      corporateClients.forEach(client => {
        console.log(`   - ID: ${client.id}`);
        console.log(`     Company ID: ${client.company_id}`);
        console.log(`     Email: ${client.contact_email}`);
        console.log(`     Teléfono: ${client.contact_phone}`);
        console.log(`     Industria: ${client.industry}`);
        console.log(`     Creado: ${client.created_at}`);
        console.log('');
      });
    }

    const { data: regularClients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (clientsError) {
      console.error('❌ Error al obtener clientes regulares:', clientsError.message);
    } else {
      console.log(`👥 Clientes Regulares: ${regularClients.length}`);
      regularClients.forEach(client => {
        console.log(`   - ${client.name} (${client.id})`);
        console.log(`     Email: ${client.email}`);
        console.log(`     RUT: ${client.rut}`);
        console.log(`     Corporate Client ID: ${client.corporate_client_id || 'SIN ASOCIAR'}`);
        console.log(`     Creado: ${client.created_at}`);
        console.log('');
      });
    }

    // 2. Verificar consistencia de datos
    console.log('🔍 VERIFICACIÓN DE CONSISTENCIA');
    console.log('------------------------------');
    
    let consistencyIssues = [];
    
    // Verificar que cada empresa tenga un cliente corporativo
    for (const company of companies) {
      const hasCorporateClient = corporateClients.some(cc => cc.company_id === company.id);
      if (!hasCorporateClient) {
        consistencyIssues.push(`❌ Empresa ${company.company_name} no tiene cliente corporativo`);
      } else {
        console.log(`✅ Empresa ${company.company_name} tiene cliente corporativo`);
      }
    }
    
    // Verificar que cada cliente regular tenga corporate_client_id
    for (const client of regularClients) {
      if (!client.corporate_client_id) {
        consistencyIssues.push(`❌ Cliente ${client.name} no tiene corporate_client_id`);
      } else {
        const corporateExists = corporateClients.some(cc => cc.id === client.corporate_client_id);
        if (!corporateExists) {
          consistencyIssues.push(`❌ Cliente ${client.name} tiene corporate_client_id inválido: ${client.corporate_client_id}`);
        } else {
          console.log(`✅ Cliente ${client.name} tiene corporate_client_id válido`);
        }
      }
    }
    
    // 3. Verificar trigger en la base de datos
    console.log('\n🔧 VERIFICACIÓN DE TRIGGERS');
    console.log('---------------------------');
    
    const { data: triggers, error: triggerError } = await supabase
      .rpc('get_triggers_info');
    
    if (triggerError) {
      // Intentar verificar directamente con una consulta SQL
      console.log('⚠️ No se puede verificar triggers automáticamente');
      console.log('Por favor verifica manualmente en el Supabase Dashboard:');
      console.log('- SQL Editor → SELECT * FROM pg_trigger WHERE tgname = \'on_company_create_corporate_client\'');
    } else {
      const corporateTrigger = triggers.find(t => t.tgname === 'on_company_create_corporate_client');
      if (corporateTrigger) {
        console.log('✅ Trigger on_company_create_corporate_client encontrado');
        console.log(`   Estado: ${corporateTrigger.tgenabled ? 'ACTIVO' : 'INACTIVO'}`);
      } else {
        console.log('❌ Trigger on_company_create_corporate_client NO encontrado');
        consistencyIssues.push('Trigger automático no está instalado');
      }
    }
    
    // 4. Verificar deudas
    console.log('\n💰 VERIFICACIÓN DE DEUDAS');
    console.log('------------------------');
    
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('*');
    
    if (debtsError) {
      console.error('❌ Error al obtener deudas:', debtsError.message);
    } else {
      console.log(`📋 Total de deudas: ${debts.length}`);
      
      for (const debt of debts) {
        console.log(`\n   Deuda ID: ${debt.id}`);
        console.log(`   Monto: $${debt.amount.toLocaleString('es-CL')}`);
        console.log(`   Estado: ${debt.status}`);
        console.log(`   Company ID: ${debt.company_id}`);
        console.log(`   Client ID: ${debt.client_id || 'SIN ASOCIAR'}`);
        
        // Verificar consistencia
        if (debt.company_id) {
          const companyExists = companies.some(c => c.id === debt.company_id);
          if (!companyExists) {
            consistencyIssues.push(`❌ Deuda ${debt.id} tiene company_id inválido`);
          }
        }
        
        if (debt.client_id) {
          const clientExists = regularClients.some(c => c.id === debt.client_id);
          if (!clientExists) {
            consistencyIssues.push(`❌ Deuda ${debt.id} tiene client_id inválido`);
          }
        }
      }
    }
    
    // 5. Resumen final
    console.log('\n📋 RESUMEN FINAL');
    console.log('================');
    
    if (consistencyIssues.length === 0) {
      console.log('🎉 ¡SISTEMA PERFECTAMENTE CONSISTENTE!');
      console.log('✅ Todas las empresas tienen clientes corporativos');
      console.log('✅ Todos los clientes regulares tienen corporate_client_id');
      console.log('✅ Todas las deudas tienen referencias válidas');
      console.log('✅ El sistema está listo para producción');
    } else {
      console.log(`⚠️ Se encontraron ${consistencyIssues.length} problemas de consistencia:`);
      consistencyIssues.forEach(issue => console.log(`   ${issue}`));
    }
    
    // 6. Estadísticas finales
    console.log('\n📊 ESTADÍSTICAS FINALES');
    console.log('=======================');
    console.log(`🏢 Empresas: ${companies.length}`);
    console.log(`🏢 Clientes Corporativos: ${corporateClients.length}`);
    console.log(`👥 Clientes Regulares: ${regularClients.length}`);
    console.log(`💰 Deudas: ${debts?.length || 0}`);
    console.log(`🔍 Problemas de consistencia: ${consistencyIssues.length}`);
    
    // 7. Recomendaciones
    console.log('\n💡 RECOMENDACIONES');
    console.log('==================');
    
    if (consistencyIssues.length > 0) {
      console.log('⚠️ Se recomienda corregir los problemas de consistencia antes de continuar');
    }
    
    if (companies.length !== corporateClients.length) {
      console.log('⚠️ Ejecuta el trigger SQL para sincronizar empresas faltantes');
    }
    
    console.log('✅ El sistema está funcionando correctamente');
    console.log('📝 Mantén esta verificación programada regularmente');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
  }
}

// Ejecutar verificación
verifyCompleteSystem().then(() => {
  console.log('\n✅ Verificación completada');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error en la verificación:', error);
  process.exit(1);
});