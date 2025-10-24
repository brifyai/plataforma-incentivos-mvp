/**
 * Script para probar la conexión a Supabase
 */

// Cargar variables de entorno
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Probando conexión a Supabase...');
console.log('URL:', process.env.VITE_SUPABASE_URL ? '✅ Configurada' : '❌ No configurada');
console.log('ANON KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ No configurada');

if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

// Crear cliente de Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testConnection() {
  try {
    console.log('\n📊 Probando conexión con tabla users...');
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .limit(5);

    if (error) {
      console.error('❌ Error en consulta users:', error);
      return;
    }

    console.log('✅ Conexión exitosa');
    console.log(`📋 Usuarios encontrados: ${data?.length || 0}`);
    
    if (data && data.length > 0) {
      console.log('👥 Usuarios:');
      data.forEach(user => {
        console.log(`  - ${user.full_name || user.email} (${user.role})`);
      });
    }

    console.log('\n🏢 Probando conexión con tabla companies...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, business_name, contact_email')
      .limit(5);

    if (companiesError) {
      console.error('❌ Error en consulta companies:', companiesError);
      return;
    }

    console.log(`📋 Empresas encontradas: ${companies?.length || 0}`);
    
    if (companies && companies.length > 0) {
      console.log('🏢 Empresas:');
      companies.forEach(company => {
        console.log(`  - ${company.business_name} (${company.contact_email})`);
      });
    }

    console.log('\n💰 Probando conexión con tabla debts...');
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('id, current_amount, status')
      .limit(5);

    if (debtsError) {
      console.error('❌ Error en consulta debts:', debtsError);
      return;
    }

    console.log(`📋 Deudas encontradas: ${debts?.length || 0}`);
    
    if (debts && debts.length > 0) {
      console.log('💰 Deudas:');
      debts.forEach(debt => {
        console.log(`  - $${debt.current_amount} (${debt.status})`);
      });
    }

    console.log('\n✅ Todas las pruebas de conexión exitosas');
    console.log('🎯 La base de datos está accesible y contiene datos');

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

testConnection();