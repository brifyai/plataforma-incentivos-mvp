#!/usr/bin/env node

/**
 * Diagnóstico detallado para entender la contradicción
 * sobre las columnas client_id y corporate_client_id
 */

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 DIAGNÓSTICO DETALLADO - COLUMNAS CLIENTES CORPORATIVOS');
console.log('==========================================================');

// Verificar variables de entorno (con prefijo VITE_ para Node.js)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔗 Variables de entorno:');
console.log(`   URL: ${supabaseUrl ? '✅ Configurada' : '❌ Faltante'}`);
console.log(`   Key: ${supabaseKey ? '✅ Configurada' : '❌ Faltante'}`);

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno faltantes');
  console.log('ℹ️ Buscando variables disponibles:');
  Object.keys(process.env).forEach(key => {
    if (key.includes('SUPABASE')) {
      console.log(`   - ${key}: ${key.includes('KEY') ? '***' : process.env[key]}`);
    }
  });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function detailedDiagnosis() {
  try {
    console.log('\n📊 ANÁLISIS DETALLADO DE TABLAS Y COLUMNAS');
    console.log('==========================================');

    // 1. Verificar tabla debts con información_schema
    console.log('\n1️⃣ TABLA DEBTS - information_schema:');
    try {
      const { data: debtColumns, error: debtError } = await supabase
        .from('information_schema.columns')
        .select('table_name, column_name, data_type, is_nullable')
        .eq('table_name', 'debts')
        .eq('table_schema', 'public')
        .order('ordinal_position');

      if (debtError) {
        console.error('❌ Error consultando information_schema para debts:', debtError);
      } else {
        console.log('   Columnas encontradas en debts:');
        debtColumns?.forEach(col => {
          console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? '[NULLABLE]' : '[NOT NULL]'}`);
        });

        const hasClientId = debtColumns?.some(col => col.column_name === 'client_id');
        console.log(`   ✅ client_id existe: ${hasClientId ? 'SÍ' : 'NO'}`);
      }
    } catch (error) {
      console.error('❌ Error en análisis de debts:', error.message);
    }

    // 2. Verificar tabla clients con information_schema
    console.log('\n2️⃣ TABLA CLIENTS - information_schema:');
    try {
      const { data: clientColumns, error: clientError } = await supabase
        .from('information_schema.columns')
        .select('table_name, column_name, data_type, is_nullable')
        .eq('table_name', 'clients')
        .eq('table_schema', 'public')
        .order('ordinal_position');

      if (clientError) {
        console.error('❌ Error consultando information_schema para clients:', clientError);
      } else {
        console.log('   Columnas encontradas en clients:');
        clientColumns?.forEach(col => {
          console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? '[NULLABLE]' : '[NOT NULL]'}`);
        });

        const hasCorporateClientId = clientColumns?.some(col => col.column_name === 'corporate_client_id');
        console.log(`   ✅ corporate_client_id existe: ${hasCorporateClientId ? 'SÍ' : 'NO'}`);
      }
    } catch (error) {
      console.error('❌ Error en análisis de clients:', error.message);
    }

    // 3. Verificar tabla corporate_clients
    console.log('\n3️⃣ TABLA CORPORATE_CLIENTS - information_schema:');
    try {
      const { data: corporateColumns, error: corporateError } = await supabase
        .from('information_schema.columns')
        .select('table_name, column_name, data_type')
        .eq('table_name', 'corporate_clients')
        .eq('table_schema', 'public')
        .order('ordinal_position');

      if (corporateError) {
        console.error('❌ Error consultando information_schema para corporate_clients:', corporateError);
      } else {
        console.log('   Columnas encontradas en corporate_clients:');
        corporateColumns?.forEach(col => {
          console.log(`   - ${col.column_name} (${col.data_type})`);
        });
      }
    } catch (error) {
      console.error('❌ Error en análisis de corporate_clients:', error.message);
    }

    // 4. Intentar consulta directa a la tabla debts
    console.log('\n4️⃣ PRUEBA DIRECTA - TABLA DEBTS:');
    try {
      const { data: debtsData, error: debtsDirectError } = await supabase
        .from('debts')
        .select('*')
        .limit(1);

      if (debtsDirectError) {
        console.error('❌ Error en consulta directa a debts:', debtsDirectError);
        console.log(`   Código: ${debtsDirectError.code}`);
        console.log(`   Mensaje: ${debtsDirectError.message}`);
      } else {
        console.log('   ✅ Consulta directa a debts exitosa');
        if (debtsData && debtsData.length > 0) {
          const firstDebt = debtsData[0];
          console.log('   Columnas en primer registro:');
          Object.keys(firstDebt).forEach(key => {
            console.log(`   - ${key}: ${firstDebt[key]}`);
          });
        }
      }
    } catch (error) {
      console.error('❌ Error en prueba directa debts:', error.message);
    }

    // 5. Intentar consulta directa a la tabla clients
    console.log('\n5️⃣ PRUEBA DIRECTA - TABLA CLIENTS:');
    try {
      const { data: clientsData, error: clientsDirectError } = await supabase
        .from('clients')
        .select('*')
        .limit(1);

      if (clientsDirectError) {
        console.error('❌ Error en consulta directa a clients:', clientsDirectError);
        console.log(`   Código: ${clientsDirectError.code}`);
        console.log(`   Mensaje: ${clientsDirectError.message}`);
      } else {
        console.log('   ✅ Consulta directa a clients exitosa');
        if (clientsData && clientsData.length > 0) {
          const firstClient = clientsData[0];
          console.log('   Columnas en primer registro:');
          Object.keys(firstClient).forEach(key => {
            console.log(`   - ${key}: ${firstClient[key]}`);
          });
        }
      }
    } catch (error) {
      console.error('❌ Error en prueba directa clients:', error.message);
    }

    // 6. Verificar si hay migraciones aplicadas
    console.log('\n6️⃣ MIGRACIONES APLICADAS:');
    try {
      const { data: migrations, error: migrationError } = await supabase
        .from('schema_migrations')
        .select('name, executed_at')
        .ilike('name', '%client%')
        .order('executed_at', { ascending: false });

      if (migrationError) {
        console.log('   ⚠️ No se pudo verificar migraciones (tabla schema_migrations no existe)');
      } else {
        console.log('   Migraciones relacionadas con clientes:');
        migrations?.forEach(mig => {
          console.log(`   - ${mig.name} (${mig.executed_at})`);
        });
      }
    } catch (error) {
      console.log('   ⚠️ Error verificando migraciones:', error.message);
    }

    // 7. Verificar políticas RLS
    console.log('\n7️⃣ POLÍTICAS RLS:');
    try {
      const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select('tablename, policyname, permissive, roles, cmd')
        .in('tablename', ['debts', 'clients'])
        .order('tablename', 'policyname');

      if (policiesError) {
        console.log('   ⚠️ No se pudieron verificar políticas RLS');
      } else {
        console.log('   Políticas RLS encontradas:');
        policies?.forEach(policy => {
          console.log(`   - ${policy.tablename}: ${policy.policyname} (${policy.cmd})`);
        });
      }
    } catch (error) {
      console.log('   ⚠️ Error verificando políticas RLS:', error.message);
    }

    console.log('\n🎯 CONCLUSIÓN:');
    console.log('==========================================');
    console.log('Revisa los resultados arriba para determinar el estado real.');
    console.log('Si information_schema muestra las columnas pero la consulta directa falla,');
    console.log('puede ser un problema de permisos o políticas RLS.');
    console.log('Si information_schema NO muestra las columnas, entonces realmente no existen.');

  } catch (error) {
    console.error('💥 Error en diagnóstico detallado:', error.message);
  }
}

detailedDiagnosis().catch(console.error);