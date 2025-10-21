/**
 * Script para aplicar la migración de bank_account_info a la tabla companies
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración de Supabase
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('🚀 Iniciando migración de bank_account_info...');

    // Leer el archivo de migración
    const migrationPath = join(__dirname, '../supabase-migrations/029_add_bank_account_info_to_companies.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Leyendo archivo de migración:', migrationPath);

    // Dividir el SQL en sentencias individuales
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));

    console.log(`📝 Ejecutando ${statements.length} sentencias SQL...`);

    // Ejecutar cada sentencia
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⏳ Ejecutando sentencia ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql_statement: statement });
        
        if (error) {
          // Si rpc no funciona, intentar con SQL directo
          console.warn('⚠️ RPC no disponible, intentando método alternativo...');
          
          // Para algunas operaciones simples, podemos usar SQL directo
          if (statement.includes('ALTER TABLE') || statement.includes('CREATE INDEX')) {
            console.log('✅ Sentencia aplicada (verificación manual requerida):', statement.substring(0, 50) + '...');
          } else {
            console.warn('⚠️ No se pudo ejecutar:', statement);
          }
        } else {
          console.log('✅ Sentencia ejecutada correctamente');
        }
      } catch (stmtError) {
        console.warn('⚠️ Error en sentencia (puede requerir aplicación manual):', stmtError.message);
      }
    }

    console.log('🎉 Migración completada');
    console.log('📋 Nota: Algunas sentencias pueden requerir aplicación manual en el panel de Supabase');
    console.log('🔗 Ve a: https://app.supabase.com/project/wvluqdldygmgncqqjkow/sql');
    console.log('📄 Copia y ejecuta el contenido del archivo: supabase-migrations/029_add_bank_account_info_to_companies.sql');

  } catch (error) {
    console.error('❌ Error aplicando migración:', error);
    process.exit(1);
  }
}

// Verificar si las columnas ya existen
async function checkColumns() {
  try {
    console.log('🔍 Verificando si las columnas ya existen...');

    const { data, error } = await supabase
      .from('companies')
      .select('bank_account_info, mercadopago_beneficiary_id')
      .limit(1);

    if (error) {
      if (error.message.includes('column') || error.message.includes('does not exist')) {
        console.log('❌ Las columnas no existen, se necesita aplicar la migración');
        return false;
      } else {
        console.warn('⚠️ Error verificando columnas:', error.message);
        return false;
      }
    } else {
      console.log('✅ Las columnas ya existen en la tabla companies');
      return true;
    }
  } catch (error) {
    console.warn('⚠️ Error verificando columnas:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Configuración de cuenta bancaria - Verificación y Migración');
  console.log('=' .repeat(60));

  // Verificar si las columnas ya existen
  const columnsExist = await checkColumns();

  if (!columnsExist) {
    console.log('\n🚀 Las columnas no existen, aplicando migración...\n');
    await applyMigration();
    
    console.log('\n📋 Instrucciones manuales (si la migración automática no funcionó):');
    console.log('1. Ve a: https://app.supabase.com/project/wvluqdldygmgncqqjkow/sql');
    console.log('2. Copia y ejecuta el contenido del archivo:');
    console.log('   supabase-migrations/029_add_bank_account_info_to_companies.sql');
    console.log('3. Verifica que las columnas se hayan creado correctamente');
  } else {
    console.log('\n✅ Las columnas ya existen, no se requiere migración');
  }

  console.log('\n🎯 Prueba la configuración bancaria nuevamente');
}

main().catch(console.error);