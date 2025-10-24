const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Verificación de Esquema de Base de Datos');
console.log('==========================================\n');

async function checkDatabaseSchema() {
  try {
    // Verificar estructura de tabla clients
    console.log('📋 Estructura de tabla clients:');
    console.log('-------------------------------');
    
    // Intentar obtener un registro para ver las columnas
    const { data: clientSample, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);
    
    if (clientError) {
      console.error('❌ Error al obtener muestra de clients:', clientError.message);
    } else if (clientSample && clientSample.length > 0) {
      console.log('Columnas encontradas en clients:');
      Object.keys(clientSample[0]).forEach(key => {
        console.log(`  - ${key}: ${clientSample[0][key]}`);
      });
    } else {
      console.log('⚠️ No hay registros en la tabla clients');
    }
    
    // Verificar estructura de tabla debts
    console.log('\n📋 Estructura de tabla debts:');
    console.log('------------------------------');
    
    const { data: debtSample, error: debtError } = await supabase
      .from('debts')
      .select('*')
      .limit(1);
    
    if (debtError) {
      console.error('❌ Error al obtener muestra de debts:', debtError.message);
    } else if (debtSample && debtSample.length > 0) {
      console.log('Columnas encontradas en debts:');
      Object.keys(debtSample[0]).forEach(key => {
        console.log(`  - ${key}: ${debtSample[0][key]}`);
      });
    } else {
      console.log('⚠️ No hay registros en la tabla debts');
    }
    
    // Verificar estructura de tabla companies
    console.log('\n📋 Estructura de tabla companies:');
    console.log('---------------------------------');
    
    const { data: companySample, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .limit(1);
    
    if (companyError) {
      console.error('❌ Error al obtener muestra de companies:', companyError.message);
    } else if (companySample && companySample.length > 0) {
      console.log('Columnas encontradas en companies:');
      Object.keys(companySample[0]).forEach(key => {
        console.log(`  - ${key}: ${companySample[0][key]}`);
      });
    } else {
      console.log('⚠️ No hay registros en la tabla companies');
    }
    
    // Verificar estructura de tabla corporate_clients
    console.log('\n📋 Estructura de tabla corporate_clients:');
    console.log('--------------------------------------');
    
    const { data: corporateSample, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*')
      .limit(1);
    
    if (corporateError) {
      console.error('❌ Error al obtener muestra de corporate_clients:', corporateError.message);
    } else if (corporateSample && corporateSample.length > 0) {
      console.log('Columnas encontradas en corporate_clients:');
      Object.keys(corporateSample[0]).forEach(key => {
        console.log(`  - ${key}: ${corporateSample[0][key]}`);
      });
    } else {
      console.log('⚠️ No hay registros en la tabla corporate_clients');
    }
    
    // Verificar tablas disponibles
    console.log('\n📊 Verificando tablas disponibles...');
    
    const tables = ['companies', 'corporate_clients', 'clients', 'debts', 'users'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ Tabla ${table}: ${error.message}`);
      } else {
        console.log(`✅ Tabla ${table}: ${data} registros`);
      }
    }
    
    // Verificar datos actuales con sus IDs
    console.log('\n🔍 Datos actuales detallados:');
    console.log('-----------------------------');
    
    // Companies
    const { data: companies } = await supabase
      .from('companies')
      .select('id, company_name, contact_email, validation_status');
    
    console.log('\n🏢 Companies:');
    companies?.forEach(c => {
      console.log(`  ${c.id} | ${c.company_name} | ${c.contact_email} | ${c.validation_status}`);
    });
    
    // Corporate Clients
    const { data: corporateClients } = await supabase
      .from('corporate_clients')
      .select('id, company_id, contact_email, industry');
    
    console.log('\n🏢 Corporate Clients:');
    corporateClients?.forEach(cc => {
      console.log(`  ${cc.id} | ${cc.company_id} | ${cc.contact_email} | ${cc.industry}`);
    });
    
    // Clients
    const { data: clients } = await supabase
      .from('clients')
      .select('*');
    
    console.log('\n👥 Clients:');
    clients?.forEach(c => {
      console.log(`  ${c.id} | ${JSON.stringify(c)}`);
    });
    
    // Debts
    const { data: debts } = await supabase
      .from('debts')
      .select('*');
    
    console.log('\n💰 Debts:');
    debts?.forEach(d => {
      console.log(`  ${d.id} | ${JSON.stringify(d)}`);
    });
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
  }
}

// Ejecutar verificación
checkDatabaseSchema().then(() => {
  console.log('\n✅ Verificación de esquema completada');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error en la verificación:', error);
  process.exit(1);
});