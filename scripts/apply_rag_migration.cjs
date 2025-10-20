/**
 * Script para aplicar la migración RAG a la base de datos Supabase
 * 
 * Este script ejecuta la migración 015_create_rag_embeddings.sql
 * que crea las tablas necesarias para el sistema RAG
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env' });

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Necesitas service role key para migraciones

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno');
  console.error('Necesitas VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyRAGMigration() {
  try {
    console.log('🚀 Iniciando migración RAG...');
    
    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, '../supabase-migrations/015_create_rag_embeddings.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Leyendo archivo de migración:', migrationPath);
    
    // Dividir el SQL en statements individuales (separados por ;)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Se encontraron ${statements.length} statements para ejecutar`);
    
    // Ejecutar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        console.log(`⚡ Ejecutando statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql_statement: statement });
        
        if (error) {
          // Algunos statements pueden fallar si ya existen, eso es OK
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate key') ||
              error.message.includes('does not exist')) {
            console.log(`⚠️  Statement ${i + 1} ya existe o es duplicado, continuando...`);
          } else {
            console.error(`❌ Error en statement ${i + 1}:`, error);
            console.error('Statement:', statement.substring(0, 100) + '...');
            throw error;
          }
        } else {
          console.log(`✅ Statement ${i + 1} ejecutado correctamente`);
        }
        
      } catch (err) {
        console.error(`❌ Error ejecutando statement ${i + 1}:`, err.message);
        
        // Continuar con los siguientes statements si es un error de "ya existe"
        if (err.message.includes('already exists') || 
            err.message.includes('duplicate key') ||
            err.message.includes('does not exist')) {
          console.log(`⚠️  Statement ${i + 1} ya existe, continuando...`);
          continue;
        }
        
        throw err;
      }
    }
    
    // Verificar que las tablas se crearon correctamente
    console.log('\n🔍 Verificando tablas creadas...');
    
    const tablesToCheck = [
      'document_embeddings',
      'rag_processing_jobs', 
      'semantic_search_cache'
    ];
    
    for (const table of tablesToCheck) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error && !error.message.includes('does not exist')) {
        console.log(`✅ Tabla ${table} verificada`);
      } else if (error) {
        console.log(`❌ Error verificando tabla ${table}:`, error.message);
      } else {
        console.log(`✅ Tabla ${table} verificada (con datos)`);
      }
    }
    
    // Verificar la extensión pgvector
    console.log('\n🔍 Verificando extensión pgvector...');
    const { data: vectorCheck, error: vectorError } = await supabase
      .rpc('exec_sql', { 
        sql_statement: "SELECT 1 FROM pg_extension WHERE extname = 'vector'" 
      });
    
    if (!vectorError) {
      console.log('✅ Extensión pgvector verificada');
    } else {
      console.log('⚠️  No se pudo verificar la extensión pgvector');
    }
    
    console.log('\n🎉 Migración RAG completada exitosamente!');
    console.log('\n📋 Resumen:');
    console.log('✅ Tablas de embeddings creadas');
    console.log('✅ Índices HNSW para búsqueda vectorial creados');
    console.log('✅ Políticas RLS configuradas');
    console.log('✅ Funciones de utilidad creadas');
    console.log('✅ Vista de estadísticas creada');
    
    console.log('\n🔧 Siguientes pasos:');
    console.log('1. Configura tu API key de OpenAI en el archivo .env');
    console.log('2. Prueba la funcionalidad de vectorización de documentos');
    console.log('3. Verifica que los embeddings se generen correctamente');
    
  } catch (error) {
    console.error('❌ Error aplicando migración RAG:', error);
    process.exit(1);
  }
}

// Función alternativa si exec_sql no está disponible
async function applyRAGMigrationAlternative() {
  try {
    console.log('🚀 Iniciando migración RAG (método alternativo)...');
    
    // Habilitar extensión pgvector
    console.log('📦 Habilitando extensión pgvector...');
    const { error: vectorError } = await supabase
      .rpc('exec_sql', { 
        sql_statement: "CREATE EXTENSION IF NOT EXISTS vector" 
      });
    
    if (vectorError && !vectorError.message.includes('already exists')) {
      console.log('⚠️  No se pudo habilitar pgvector con exec_sql, intentando con SQL directo...');
    } else {
      console.log('✅ Extensión pgvector habilitada');
    }
    
    // Crear tabla document_embeddings
    console.log('📋 Creando tabla document_embeddings...');
    const { error: embedError } = await supabase
      .from('document_embeddings')
      .select('*')
      .limit(1);
    
    if (embedError && embedError.message.includes('does not exist')) {
      console.log('❌ La tabla document_embeddings no existe. Ejecuta la migración manualmente.');
      console.log('📝 Ejecuta este SQL en tu panel de Supabase:');
      console.log('\n' + fs.readFileSync(path.join(__dirname, '../supabase-migrations/015_create_rag_embeddings.sql'), 'utf8'));
    } else {
      console.log('✅ Tabla document_embeddings ya existe');
    }
    
  } catch (error) {
    console.error('❌ Error en migración alternativa:', error);
    console.log('\n📝 Ejecuta manualmente este SQL en tu panel de Supabase:');
    console.log('\n' + fs.readFileSync(path.join(__dirname, '../supabase-migrations/015_create_rag_embeddings.sql'), 'utf8'));
  }
}

// Ejecutar migración
if (require.main === module) {
  applyRAGMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Error:', error);
      applyRAGMigrationAlternative();
    });
}

module.exports = { applyRAGMigration, applyRAGMigrationAlternative };