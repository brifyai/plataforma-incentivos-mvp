#!/usr/bin/env node

/**
 * Verificación simple de columnas sin usar information_schema
 */

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 VERIFICACIÓN SIMPLE DE COLUMNAS');
console.log('==================================');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  try {
    console.log('\n📊 Verificando columna client_id en debts:');
    
    // Intentar seleccionar client_id específicamente
    const { data: debtsData, error: debtsError } = await supabase
      .from('debts')
      .select('client_id')
      .limit(1);

    if (debtsError) {
      console.log('❌ client_id NO existe en debts:', debtsError.message);
    } else {
      console.log('✅ client_id EXISTE en debts');
    }

    console.log('\n📊 Verificando columna corporate_client_id en clients:');
    
    // Intentar seleccionar corporate_client_id específicamente
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('corporate_client_id')
      .limit(1);

    if (clientsError) {
      console.log('❌ corporate_client_id NO existe en clients:', clientsError.message);
    } else {
      console.log('✅ corporate_client_id EXISTE en clients');
    }

    console.log('\n📊 Verificando estructura actual de debts:');
    
    // Obtener un registro completo para ver todas las columnas
    const { data: fullDebt, error: fullDebtError } = await supabase
      .from('debts')
      .select('*')
      .limit(1);

    if (fullDebtError) {
      console.log('❌ Error obteniendo estructura de debts:', fullDebtError.message);
    } else if (fullDebt && fullDebt.length > 0) {
      console.log('📋 Columnas actuales en debts:');
      Object.keys(fullDebt[0]).forEach(key => {
        console.log(`   - ${key}`);
      });
    } else {
      console.log('📋 No hay datos en debts para mostrar estructura');
    }

    console.log('\n📊 Verificando estructura actual de clients:');
    
    // Obtener un registro completo para ver todas las columnas
    const { data: fullClient, error: fullClientError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);

    if (fullClientError) {
      console.log('❌ Error obteniendo estructura de clients:', fullClientError.message);
    } else if (fullClient && fullClient.length > 0) {
      console.log('📋 Columnas actuales en clients:');
      Object.keys(fullClient[0]).forEach(key => {
        console.log(`   - ${key}`);
      });
    } else {
      console.log('📋 No hay datos en clients para mostrar estructura');
    }

    console.log('\n🎯 CONCLUSIÓN:');
    console.log('=============');
    console.log('Si las columnas client_id y corporate_client_id no existen,');
    console.log('necesitas ejecutar el SQL_SEGURO_EXISTE.sql en Supabase.');

  } catch (error) {
    console.error('💥 Error en verificación:', error.message);
  }
}

checkColumns().catch(console.error);