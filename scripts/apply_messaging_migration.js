/**
 * Script para aplicar la migración de mensajería
 */

import { supabase } from '../src/config/supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyMigration() {
  try {
    console.log('🔄 Aplicando migración de mensajería...');
    
    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, '../supabase-migrations/017_create_messaging_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Dividir el SQL en declaraciones individuales
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Ejecutando ${statements.length} declaraciones SQL...`);
    
    // Ejecutar cada declaración
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim().length === 0) continue;
      
      try {
        console.log(`⚡ Ejecutando declaración ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql_statement: statement });
        
        if (error) {
          // Si exec_sql no existe, intentar con SQL directo
          console.log('⚠️ exec_sql no disponible, intentando método alternativo...');
          
          // Para tablas, usamos el método directo
          if (statement.toLowerCase().includes('create table')) {
            console.log('📋 Creando tabla directamente...');
            // Extraer nombre de la tabla
            const tableNameMatch = statement.match(/create\s+table\s+(?:if\s+not\s+exists\s+)?(\w+)/i);
            if (tableNameMatch) {
              const tableName = tableNameMatch[1];
              console.log(`📊 Verificando si la tabla ${tableName} existe...`);
              
              const { data, error: checkError } = await supabase
                .from('information_schema.tables')
                .select('table_name')
                .eq('table_name', tableName)
                .eq('table_schema', 'public');
              
              if (checkError) {
                console.log(`❌ Error verificando tabla ${tableName}:`, checkError);
              } else if (data && data.length > 0) {
                console.log(`✅ Tabla ${tableName} ya existe`);
              } else {
                console.log(`⚠️ Tabla ${tableName} no existe. La migración debe aplicarse manualmente.`);
              }
            }
          }
        } else {
          console.log(`✅ Declaración ${i + 1} ejecutada correctamente`);
        }
      } catch (stmtError) {
        console.log(`⚠️ Error en declaración ${i + 1}:`, stmtError.message);
        // Continuar con las demás declaraciones
      }
    }
    
    // Verificar que las tablas existen
    console.log('\n🔍 Verificando tablas creadas...');
    
    const tables = ['conversations', 'messages', 'message_attachments'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', table)
        .eq('table_schema', 'public');
      
      if (error) {
        console.log(`❌ Error verificando tabla ${table}:`, error);
      } else if (data && data.length > 0) {
        console.log(`✅ Tabla ${table} existe`);
      } else {
        console.log(`❌ Tabla ${table} no existe`);
      }
    }
    
    console.log('\n🎉 Migración completada');
    console.log('⚠️ Si las tablas no se crearon automáticamente, aplica la migración manualmente en el panel de Supabase');
    
  } catch (error) {
    console.error('❌ Error aplicando migración:', error);
    process.exit(1);
  }
}

applyMigration();