/**
 * Script para aplicar la migración de la tabla company_ai_config
 * Usa el CLI de Supabase para ejecutar la migración
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  try {
    console.log('🚀 Aplicando migración para crear tabla company_ai_config...');
    
    // Verificar si el archivo de migración existe
    const migrationPath = './supabase-migrations/create_company_ai_config_table.sql';
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ No se encuentra el archivo de migración:', migrationPath);
      return;
    }
    
    console.log('📄 Archivo de migración encontrado:', migrationPath);
    
    // Leer el contenido del archivo
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📝 Contenido de la migración cargado');
    
    // Crear un archivo temporal para la migración
    const tempMigrationPath = './temp_ai_config_migration.sql';
    fs.writeFileSync(tempMigrationPath, migrationSQL);
    
    try {
      // Intentar aplicar con Supabase CLI
      console.log('🔧 Intentando aplicar migración con Supabase CLI...');
      
      // Verificar si Supabase CLI está instalado
      try {
        execSync('supabase --version', { stdio: 'inherit' });
      } catch (error) {
        console.log('❌ Supabase CLI no está instalado. Instalando...');
        execSync('npm install -g supabase', { stdio: 'inherit' });
      }
      
      // Aplicar la migración
      execSync(`supabase db push --db-url ${process.env.VITE_SUPABASE_URL}`, { 
        stdio: 'inherit',
        cwd: __dirname
      });
      
      console.log('✅ Migración aplicada exitosamente con Supabase CLI');
      
    } catch (supabaseError) {
      console.log('⚠️ Error con Supabase CLI, intentando método alternativo...');
      
      // Método alternativo: crear script SQL para ejecución manual
      console.log('📋 Creando instrucciones para ejecución manual...');
      
      const instructions = `
INSTRUCCIONES PARA CREAR TABLA company_ai_config MANUALMENTE:

1. Ve al panel de Supabase: https://supabase.com/dashboard/project/wvluqdldygmgncqqjkow/sql
2. Copia y ejecuta el siguiente SQL:

${migrationSQL}

3. Verifica que la tabla se haya creado correctamente ejecutando:
   SELECT COUNT(*) FROM company_ai_config;

La tabla debe estar vacía inicialmente pero existente.
`;
      
      console.log(instructions);
      
      // Guardar instrucciones en archivo
      fs.writeFileSync('./CREATE_TABLE_INSTRUCTIONS.md', instructions);
      console.log('📄 Instrucciones guardadas en CREATE_TABLE_INSTRUCTIONS.md');
    }
    
    // Limpiar archivo temporal
    if (fs.existsSync(tempMigrationPath)) {
      fs.unlinkSync(tempMigrationPath);
    }
    
    // Verificar si la tabla existe ahora
    console.log('🔍 Verificando si la tabla existe...');
    
    const { createClient } = require('@supabase/supabase-js');
    require('dotenv').config();
    
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL, 
      process.env.VITE_SUPABASE_ANON_KEY
    );
    
    try {
      const { data, error } = await supabase
        .from('company_ai_config')
        .select('count')
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('⚠️ La tabla aún no existe. Por favor, sigue las instrucciones manuales.');
        } else {
          console.log('❌ Error al verificar tabla:', error);
        }
      } else {
        console.log('✅ Tabla verificada exitosamente. Registros:', data);
      }
    } catch (verifyError) {
      console.log('❌ Error en verificación:', verifyError.message);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar la migración
applyMigration();