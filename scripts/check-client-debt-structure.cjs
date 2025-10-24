/**
 * Script simple para verificar la estructura de tablas cliente-deuda
 * y mostrar instrucciones claras para aplicar la migración
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

// Configuración de Supabase - SIEMPRE usar variables de entorno del .env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

// Validar que las variables de entorno existan
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Faltan variables de entorno en el archivo .env');
  console.error('📋 Asegúrate de que tu archivo .env contenga:');
  console.error('   VITE_SUPABASE_URL=tu_url_de_supabase');
  console.error('   VITE_SUPABASE_ANON_KEY=tu_key_anon_de_supabase');
  console.error('\n🔧 Si no tienes archivo .env, copia .env.example a .env y completa los valores');
  process.exit(1);
}

console.log('🔗 Conectando a Supabase usando variables de entorno del archivo .env');
console.log(`📍 URL: ${supabaseUrl}`);
console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  console.log('🔍 Verificando estructura de tablas cliente-deuda...');
  console.log('='.repeat(60));
  
  try {
    // Verificar tabla debts
    console.log('\n📊 Tabla debts:');
    const { data: debtsData, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .limit(1);
    
    if (debtsError) {
      console.error('❌ Error accediendo a tabla debts:', debtsError.message);
    } else {
      const columns = debtsData && debtsData.length > 0 ? Object.keys(debtsData[0]) : [];
      console.log('✅ Tabla debts accesible');
      console.log('📋 Columnas:', columns.join(', '));
      
      const hasClientId = columns.includes('client_id');
      console.log('🔍 Tiene columna client_id:', hasClientId ? '✅ SÍ' : '❌ NO');
      
      if (!hasClientId) {
        console.log('⚠️ La columna client_id es NECESARIA para que funcionen los clientes corporativos');
      }
    }
    
    // Verificar tabla clients
    console.log('\n📊 Tabla clients:');
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);
    
    if (clientsError) {
      console.error('❌ Error accediendo a tabla clients:', clientsError.message);
    } else {
      const columns = clientsData && clientsData.length > 0 ? Object.keys(clientsData[0]) : [];
      console.log('✅ Tabla clients accesible');
      console.log('📋 Columnas:', columns.join(', '));
      
      const hasCorporateClientId = columns.includes('corporate_client_id');
      console.log('🔍 Tiene columna corporate_client_id:', hasCorporateClientId ? '✅ SÍ' : '❌ NO');
      
      if (!hasCorporateClientId) {
        console.log('⚠️ La columna corporate_client_id es NECESARIA para relacionar clientes con corporativos');
      }
    }
    
    // Verificar tabla corporate_clients
    console.log('\n📊 Tabla corporate_clients:');
    const { data: corporateData, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*')
      .limit(1);
    
    if (corporateError) {
      console.error('❌ Error accediendo a tabla corporate_clients:', corporateError.message);
    } else {
      const columns = corporateData && corporateData.length > 0 ? Object.keys(corporateData[0]) : [];
      console.log('✅ Tabla corporate_clients accesible');
      console.log('📋 Columnas:', columns.join(', '));
    }
    
    // Verificar si hay datos existentes
    console.log('\n📈 Verificando datos existentes:');
    
    const { count: debtsCount, error: debtsCountError } = await supabase
      .from('debts')
      .select('*', { count: 'exact', head: true });
    
    if (!debtsCountError) {
      console.log('💰 Total de deudas:', debtsCount || 0);
    }
    
    const { count: clientsCount, error: clientsCountError } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });
    
    if (!clientsCountError) {
      console.log('👥 Total de clientes:', clientsCount || 0);
    }
    
    const { count: corporateCount, error: corporateCountError } = await supabase
      .from('corporate_clients')
      .select('*', { count: 'exact', head: true });
    
    if (!corporateCountError) {
      console.log('🏢 Total de clientes corporativos:', corporateCount || 0);
    }
    
    // Mostrar instrucciones si faltan columnas
    console.log('\n' + '='.repeat(60));
    console.log('📝 INSTRUCCIONES PARA CORREGIR EL PROBLEMA:');
    console.log('='.repeat(60));
    
    console.log('\n🔧 PASO 1: Aplicar migración en Supabase');
    console.log('1. Ir a: https://app.supabase.com');
    console.log('2. Seleccionar el proyecto: wvluqdldygmgncqqjkow');
    console.log('3. Ir a "SQL Editor" en el menú lateral');
    console.log('4. Copiar y ejecutar el siguiente SQL:');
    
    // Leer y mostrar la migración
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, '../supabase-migrations/041_fix_client_debt_relations.sql');
    
    try {
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      console.log('\n' + '='.repeat(50));
      console.log('SQL A EJECUTAR:');
      console.log('='.repeat(50));
      console.log(migrationSQL);
      console.log('='.repeat(50));
    } catch (fileError) {
      console.log('⚠️ No se pudo leer el archivo de migración');
      console.log('Ejecutar manualmente las siguientes sentencias SQL:');
      console.log(`
-- Agregar columna client_id a la tabla debts
ALTER TABLE debts ADD COLUMN client_id UUID REFERENCES clients(id);

-- Agregar columna corporate_client_id a la tabla clients
ALTER TABLE clients ADD COLUMN corporate_client_id UUID REFERENCES corporate_clients(id);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_debts_client_id ON debts(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_corporate_client_id ON clients(corporate_client_id);
      `);
    }
    
    console.log('\n🔧 PASO 2: Verificar la migración');
    console.log('1. Después de ejecutar el SQL, volver a ejecutar este script');
    console.log('2. Debería mostrar "✅ SÍ" para ambas columnas');
    
    console.log('\n🔧 PASO 3: Probar la aplicación');
    console.log('1. Recargar la aplicación en http://localhost:3002');
    console.log('2. Intentar agregar un cliente corporativo');
    console.log('3. Debería funcionar sin errores');
    
    console.log('\n🎯 RESUMEN DEL PROBLEMA:');
    console.log('❌ El error "client_id column does not exist" ocurre porque:');
    console.log('   - La tabla debts no tiene la columna client_id');
    console.log('   - La tabla clients no tiene la columna corporate_client_id');
    console.log('   - Estas columnas son necesarias para relacionar deudas con clientes corporativos');
    
    return true;
    
  } catch (error) {
    console.error('💥 Error verificando estructura:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Script de diagnóstico para clientes corporativos');
  
  const success = await checkTableStructure();
  
  if (success) {
    console.log('\n✅ Diagnóstico completado. Siga las instrucciones arriba.');
  } else {
    console.log('\n❌ Error en el diagnóstico. Revise los mensajes arriba.');
  }
}

main().catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});