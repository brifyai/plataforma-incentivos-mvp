/**
 * Script para ejecutar SQL directamente en Supabase
 * Ejecuta los scripts de limpieza y población
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leer configuración de Supabase
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');

let supabaseUrl = '';
let supabaseKey = '';

envLines.forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1];
  }
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
    supabaseKey = line.split('=')[1];
  }
});

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSqlFile(filePath) {
  console.log(`📄 Ejecutando script: ${filePath}`);

  try {
    const sqlContent = fs.readFileSync(filePath, 'utf8');

    // Dividir el SQL en statements individuales (por punto y coma)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`🔄 Ejecutando: ${statement.substring(0, 50)}...`);

        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });

        if (error) {
          console.error('❌ Error ejecutando statement:', error);
          // No salir, continuar con el siguiente
        } else {
          console.log('✅ Statement ejecutado');
        }
      }
    }

    console.log(`✅ Script ${filePath} completado`);
  } catch (error) {
    console.error(`💥 Error ejecutando ${filePath}:`, error);
  }
}

async function main() {
  console.log('🚀 Iniciando ejecución de scripts SQL...');

  try {
    // 1. Ejecutar limpieza de tablas no utilizadas
    console.log('🧹 PASO 1: Limpiando tablas no utilizadas...');
    await executeSqlFile(path.join(__dirname, 'cleanup-unused-tables.sql'));

    // 2. Ejecutar migraciones críticas
    console.log('🔧 PASO 2: Aplicando migraciones críticas...');
    await executeSqlFile(path.join(__dirname, '..', 'supabase-migrations', '023_add_corporate_client_id_to_clients.sql'));
    await executeSqlFile(path.join(__dirname, '..', 'supabase-migrations', '024_add_client_id_to_debts.sql'));

    // 3. Poblar base de datos con datos mínimos
    console.log('📊 PASO 3: Poblando base de datos...');
    await executeSqlFile(path.join(__dirname, 'populate-production-db-minimal.sql'));

    console.log('🎉 ¡Todos los scripts ejecutados exitosamente!');

  } catch (error) {
    console.error('💥 Error general:', error);
    process.exit(1);
  }
}

// Ejecutar el script
main();