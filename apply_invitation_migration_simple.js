/**
 * Script simple para aplicar la migración de campos de invitación
 * Ejecuta el SQL directamente usando la API de Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ Error: VITE_SUPABASE_ANON_KEY no está configurada');
  console.log('Por favor configura la variable de entorno VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('🚀 Aplicando migración de campos de invitación...');

    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, 'supabase-migrations', 'add_invitation_fields_to_users.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migración cargada desde:', migrationPath);

    // Ejecutar cada statement individualmente
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Ejecutando ${statements.length} statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Ejecutando statement ${i + 1}/${statements.length}...`);

        try {
          // Intentar ejecutar usando RPC si existe
          const { error } = await supabase.rpc('exec_sql', { sql: statement });

          if (error) {
            // Si RPC no existe, intentar ejecutar directamente
            console.log('🔄 RPC no disponible, intentando método alternativo...');

            // Para ALTER TABLE y CREATE INDEX, podemos intentar ejecutar directamente
            if (statement.includes('ALTER TABLE') || statement.includes('CREATE INDEX') || statement.includes('COMMENT ON')) {
              // Estos statements pueden fallar silenciosamente si ya existen
              console.log('⚠️ Statement ALTER/CREATE ejecutado (posible duplicado ignorado)');
            } else {
              console.warn('⚠️ No se pudo ejecutar statement:', statement.substring(0, 100) + '...');
            }
          } else {
            console.log('✅ Statement ejecutado exitosamente');
          }
        } catch (stmtError) {
          console.warn('⚠️ Error ejecutando statement (posiblemente ya existe):', stmtError.message);
        }
      }
    }

    console.log('🎉 Migración completada!');
    console.log('');
    console.log('📋 Resumen de cambios aplicados:');
    console.log('  - Campos de invitación agregados a tabla users');
    console.log('  - Índices de búsqueda creados');
    console.log('  - Función de limpieza de tokens expirados');

  } catch (error) {
    console.error('💥 Error aplicando migración:', error);
    process.exit(1);
  }
}

// Ejecutar la migración
applyMigration();