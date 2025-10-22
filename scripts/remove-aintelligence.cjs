const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function removeAIntelligence() {
  try {
    console.log('🗑️ === ELIMINANDO AINTELLIGENCE SPA COMPLETAMENTE ===\n');

    // 1. Obtener IDs de AIntelligence para eliminar
    console.log('🔍 Buscando registros de AIntelligence...');
    
    const { data: aIntelligenceCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('rut', '77.888.999-0')
      .single();

    const { data: aIntelligenceCorporate } = await supabase
      .from('corporate_clients')
      .select('id')
      .eq('rut', '77.888.999-0')
      .single();

    console.log(`📋 Empresa AIntelligence ID: ${aIntelligenceCompany?.id || 'No encontrada'}`);
    console.log(`📋 Empresa Global AIntelligence ID: ${aIntelligenceCorporate?.id || 'No encontrada'}`);

    // 2. Eliminar empresa global (corporate_client) si existe
    if (aIntelligenceCorporate) {
      console.log('\n🗑️ Eliminando empresa global AIntelligence...');
      const { error: corporateError } = await supabase
        .from('corporate_clients')
        .delete()
        .eq('id', aIntelligenceCorporate.id);

      if (corporateError) {
        console.error('❌ Error eliminando empresa global:', corporateError);
      } else {
        console.log('✅ Empresa global AIntelligence eliminada');
      }
    }

    // 3. Eliminar empresa principal si existe
    if (aIntelligenceCompany) {
      console.log('\n🗑️ Eliminando empresa principal AIntelligence...');
      const { error: companyError } = await supabase
        .from('companies')
        .delete()
        .eq('id', aIntelligenceCompany.id);

      if (companyError) {
        console.error('❌ Error eliminando empresa principal:', companyError);
      } else {
        console.log('✅ Empresa principal AIntelligence eliminada');
      }
    }

    // 4. Verificar estado final de NexuPay Cobranzas
    console.log('\n🔍 Verificando estado final de NexuPay Cobranzas...');
    
    const { data: nexupayCompany } = await supabase
      .from('companies')
      .select('*')
      .eq('rut', '76.123.456-7')
      .single();

    const { data: nexupayCorporate } = await supabase
      .from('corporate_clients')
      .select('*')
      .eq('rut', '76.123.456-7')
      .single();

    const { data: mariaClient } = await supabase
      .from('clients')
      .select('*')
      .eq('rut', '16610128-k')
      .single();

    const { data: mariaDebt } = await supabase
      .from('debts')
      .select('*')
      .eq('client_id', mariaClient?.id)
      .single();

    console.log('\n✅ === ESTADO FINAL DE NEXUPAY COBRANZAS ===');
    
    if (nexupayCompany) {
      console.log('\n🏢 EMPRESA PRINCIPAL:');
      console.log(`   Nombre: ${nexupayCompany.company_name || 'NexuPay Cobranzas'}`);
      console.log(`   RUT: ${nexupayCompany.rut}`);
      console.log(`   Email: ${nexupayCompany.contact_email}`);
      console.log(`   Estado: ${nexupayCompany.validation_status}`);
      console.log(`   ID: ${nexupayCompany.id}`);
    }

    if (nexupayCorporate) {
      console.log('\n🌐 EMPRESA GLOBAL:');
      console.log(`   Nombre: NexuPay Cobranzas`);
      console.log(`   RUT: ${nexupayCorporate.rut}`);
      console.log(`   Industria: ${nexupayCorporate.industry}`);
      console.log(`   ID: ${nexupayCorporate.id}`);
      console.log(`   ID Empresa Principal: ${nexupayCorporate.company_id}`);
    }

    if (mariaClient) {
      console.log('\n👤 CLIENTE (MARÍA CONCHA):');
      console.log(`   Nombre: ${mariaClient.business_name}`);
      console.log(`   RUT: ${mariaClient.rut}`);
      console.log(`   Email: ${mariaClient.contact_email}`);
      console.log(`   ID: ${mariaClient.id}`);
      console.log(`   ID Empresa Global: ${mariaClient.corporate_client_id}`);
    }

    if (mariaDebt) {
      console.log('\n💰 DEUDA DE MARÍA CONCHA:');
      console.log(`   Monto: $${mariaDebt.current_amount?.toLocaleString('es-CL')}`);
      console.log(`   Descripción: ${mariaDebt.description}`);
      console.log(`   Estado: ${mariaDebt.status}`);
      console.log(`   ID: ${mariaDebt.id}`);
    }

    // 5. Verificar vinculación correcta
    console.log('\n🔗 === VERIFICACIÓN DE VÍNCULOS ===');
    
    const isLinked = 
      nexupayCompany && 
      nexupayCorporate && 
      nexupayCorporate.company_id === nexupayCompany.id &&
      mariaClient && 
      mariaClient.corporate_client_id === nexupayCorporate.id &&
      mariaDebt && 
      mariaDebt.company_id === nexupayCompany.id &&
      mariaDebt.client_id === mariaClient.id;

    if (isLinked) {
      console.log('✅ TODOS LOS VÍNCULOS SON CORRECTOS');
      console.log('   🏢 NexuPay Cobranzas (Empresa)');
      console.log('   └── 🌐 NexuPay Cobranzas (Empresa Global)');
      console.log('       └── 👤 María Concha (Cliente)');
      console.log('           └── 💰 Deuda: $500.000');
    } else {
      console.log('❌ HAY PROBLEMAS EN LOS VÍNCULOS');
      console.log('   Revisar las relaciones entre las tablas');
    }

    console.log('\n✅ === LIMPIEZA COMPLETADA ===');

  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
}

removeAIntelligence();