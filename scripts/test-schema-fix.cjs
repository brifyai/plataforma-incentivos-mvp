const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSchemaFix() {
  console.log('🔍 Probando correcciones de schema (business_name → company_name)...');
  
  try {
    // 1. Probar consulta a companies con company_name
    console.log('\n1. Probando consulta a companies con company_name...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, company_name, contact_email')
      .eq('id', 'e27b3162-e7db-4b00-bc60-32abea7e171b');
    
    if (companiesError) {
      console.error('❌ Error en consulta companies:', companiesError);
    } else {
      console.log('✅ Consulta companies exitosa:', companies[0]?.company_name);
    }
    
    // 2. Probar consulta a clients con business_name
    console.log('\n2. Probando consulta a clients con business_name...');
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, business_name, contact_email, company_id')
      .eq('company_id', 'e27b3162-e7db-4b00-bc60-32abea7e171b');
    
    if (clientsError) {
      console.error('❌ Error en consulta clients:', clientsError);
    } else {
      console.log('✅ Consulta clients exitosa:', clients.length, 'clientes encontrados');
      clients.forEach(client => {
        console.log(`  - ${client.business_name} (${client.contact_email})`);
      });
    }
    
    // 3. Probar consulta con relaciones
    console.log('\n3. Probando consulta con relaciones...');
    const { data: relations, error: relationsError } = await supabase
      .from('debts')
      .select(`
        id,
        amount,
        company:companies(id, company_name),
        client:clients(id, business_name)
      `)
      .eq('company_id', 'e27b3162-e7db-4b00-bc60-32abea7e171b');
    
    if (relationsError) {
      console.error('❌ Error en consulta con relaciones:', relationsError);
    } else {
      console.log('✅ Consulta con relaciones exitosa:', relations.length, 'deudas encontradas');
      relations.forEach(debt => {
        console.log(`  - Deuda $${debt.amount}: ${debt.company?.company_name} → ${debt.client?.name}`);
      });
    }
    
    // 4. Verificar que no existan columnas business_name
    console.log('\n4. Verificando que no existan columnas business_name...');
    const { data: schemaCheck, error: schemaError } = await supabase
      .from('companies')
      .select('business_name')
      .limit(1);
    
    if (schemaError && schemaError.message.includes('column "business_name" does not exist')) {
      console.log('✅ Confirmado: la columna business_name no existe en companies');
    } else if (!schemaError) {
      console.log('⚠️ Advertencia: La columna business_name todavía existe en companies');
    } else {
      console.log('ℹ️ Error esperado (business_name no existe):', schemaError.message);
    }
    
    console.log('\n🎉 Prueba de schema completada');
    
  } catch (error) {
    console.error('❌ Error en prueba de schema:', error);
  }
}

testSchemaFix();