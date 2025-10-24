/**
 * Script para verificar la estructura real de las tablas
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkTableStructure() {
  try {
    console.log('🔍 Verificando estructura de tabla companies...');
    
    // Intentar obtener todas las columnas de la tabla companies
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error consultando companies:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Estructura de tabla companies:');
      console.log('📋 Columnas encontradas:', Object.keys(data[0]));
      console.log('📊 Datos de ejemplo:', data[0]);
    } else {
      console.log('⚠️ No hay datos en la tabla companies');
    }

    console.log('\n🔍 Verificando estructura de tabla debts...');
    
    const { data: debtsData, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .limit(1);

    if (debtsError) {
      console.error('❌ Error consultando debts:', debtsError);
      return;
    }

    if (debtsData && debtsData.length > 0) {
      console.log('✅ Estructura de tabla debts:');
      console.log('📋 Columnas encontradas:', Object.keys(debtsData[0]));
      console.log('📊 Datos de ejemplo:', debtsData[0]);
    } else {
      console.log('⚠️ No hay datos en la tabla debts');
    }

    console.log('\n🔍 Verificando estructura de tabla corporate_clients...');
    
    const { data: corporateData, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*')
      .limit(1);

    if (corporateError) {
      console.error('❌ Error consultando corporate_clients:', corporateError);
      return;
    }

    if (corporateData && corporateData.length > 0) {
      console.log('✅ Estructura de tabla corporate_clients:');
      console.log('📋 Columnas encontradas:', Object.keys(corporateData[0]));
      console.log('📊 Datos de ejemplo:', corporateData[0]);
    } else {
      console.log('⚠️ No hay datos en la tabla corporate_clients');
    }

    console.log('\n🔍 Verificando estructura de tabla clients...');
    
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);

    if (clientsError) {
      console.error('❌ Error consultando clients:', clientsError);
      return;
    }

    if (clientsData && clientsData.length > 0) {
      console.log('✅ Estructura de tabla clients:');
      console.log('📋 Columnas encontradas:', Object.keys(clientsData[0]));
      console.log('📊 Datos de ejemplo:', clientsData[0]);
    } else {
      console.log('⚠️ No hay datos en la tabla clients');
    }

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

checkTableStructure();