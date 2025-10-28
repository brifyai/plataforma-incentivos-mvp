#!/usr/bin/env node

/**
 * Script para aplicar el fix de clientes corporativos automáticamente
 * Este script ejecuta el SQL necesario para agregar las columnas faltantes
 */

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

console.log('🔧 Aplicando fix para clientes corporativos...');
console.log('=====================================');

// Verificar variables de entorno
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno no encontradas:');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌');
  console.error('\n💡 Asegúrate de que el archivo .env contiene las variables necesarias');
  process.exit(1);
}

console.log('🔗 Conectando a Supabase...');
console.log('📍 URL:', supabaseUrl);
console.log('🔑 Key:', supabaseKey.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

// SQL para agregar las columnas faltantes
const sqlFix = `
-- Add client_id column to debts table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'debts' 
        AND column_name = 'client_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE debts ADD COLUMN client_id UUID REFERENCES clients(id);
        RAISE NOTICE '✅ Columna client_id agregada a debts';
    ELSE
        RAISE NOTICE '⚠️ Columna client_id ya existe en debts';
    END IF;
END $$;

-- Add corporate_client_id column to clients table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'corporate_client_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE clients ADD COLUMN corporate_client_id UUID REFERENCES corporate_clients(id);
        RAISE NOTICE '✅ Columna corporate_client_id agregada a clients';
    ELSE
        RAISE NOTICE '⚠️ Columna corporate_client_id ya existe en clients';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_debts_client_id ON debts(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_corporate_client_id ON clients(corporate_client_id);

RAISE NOTICE '✅ Índices creados';
`;

async function applyFix() {
  try {
    console.log('\n🚀 Ejecutando SQL para agregar columnas...');
    
    // Ejecutar el SQL usando RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlFix });
    
    if (error) {
      console.error('❌ Error ejecutando SQL:', error);
      
      // Si el RPC no existe, intentar con una consulta directa
      console.log('\n🔄 Intentando método alternativo...');
      
      try {
        // Verificar si las columnas existen
        const { data: columnsCheck } = await supabase
          .from('information_schema.columns')
          .select('table_name, column_name')
          .in('table_name', ['debts', 'clients'])
          .in('column_name', ['client_id', 'corporate_client_id']);
        
        console.log('📋 Columnas encontradas:', columnsCheck);
        
        if (columnsCheck && columnsCheck.length > 0) {
          console.log('✅ Las columnas ya existen');
        } else {
          console.log('❌ Las columnas siguen faltantes');
          console.log('\n📝 Necesitas ejecutar el SQL manualmente:');
          console.log('1. Ve a https://app.supabase.com');
          console.log('2. Selecciona tu proyecto');
          console.log('3. Ve a "SQL Editor"');
          console.log('4. Copia y ejecuta el SQL del archivo SQL_SEGURO_EXISTE.sql');
        }
      } catch (altError) {
        console.error('❌ Error en método alternativo:', altError);
      }
      
      return;
    }
    
    console.log('✅ SQL ejecutado exitosamente');
    console.log('📋 Resultado:', data);
    
  } catch (error) {
    console.error('💥 Error aplicando el fix:', error.message);
    
    console.log('\n📝 Instrucciones manuales:');
    console.log('1. Ve a https://app.supabase.com');
    console.log('2. Selecciona tu proyecto: wvluqdldygmgncqqjkow');
    console.log('3. Ve a "SQL Editor" en el menú lateral');
    console.log('4. Copia y ejecuta el contenido del archivo SQL_SEGURO_EXISTE.sql');
    console.log('5. Vuelve a ejecutar: node scripts/check-client-debt-structure.cjs');
  }
}

// Verificar resultado después de aplicar el fix
async function verifyFix() {
  console.log('\n🔍 Verificando el fix...');
  
  try {
    // Verificar tabla debts
    const { data: debtColumns, error: debtError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'debts')
      .eq('column_name', 'client_id')
      .eq('table_schema', 'public');
    
    // Verificar tabla clients
    const { data: clientColumns, error: clientError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'clients')
      .eq('column_name', 'corporate_client_id')
      .eq('table_schema', 'public');
    
    const hasClientId = debtColumns && debtColumns.length > 0;
    const hasCorporateClientId = clientColumns && clientColumns.length > 0;
    
    console.log('\n📊 Resultado de la verificación:');
    console.log(`   debts.client_id: ${hasClientId ? '✅ EXISTE' : '❌ FALTA'}`);
    console.log(`   clients.corporate_client_id: ${hasCorporateClientId ? '✅ EXISTE' : '❌ FALTA'}`);
    
    if (hasClientId && hasCorporateClientId) {
      console.log('\n🎉 ¡Fix aplicado exitosamente!');
      console.log('✅ Los clientes corporativos deberían funcionar ahora');
    } else {
      console.log('\n⚠️ El fix no se aplicó completamente');
      console.log('💡 Ejecuta el SQL manualmente siguiendo las instrucciones');
    }
    
  } catch (error) {
    console.error('❌ Error verificando el fix:', error.message);
  }
}

async function main() {
  await applyFix();
  await verifyFix();
  
  console.log('\n=====================================');
  console.log('🏁 Script finalizado');
  
  if (process.platform === 'win32') {
    console.log('\nPresiona cualquier tecla para continuar...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', () => process.exit(0));
  }
}

main().catch(console.error);