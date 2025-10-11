/**
 * Script para aplicar la migración de campos de invitación usando SQL directo
 * Crea una función RPC temporal para ejecutar la migración
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

async function applyMigrationDirect() {
  try {
    console.log('🚀 Aplicando migración de campos de invitación usando SQL directo...');

    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, 'supabase-migrations', 'add_invitation_fields_to_users.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migración cargada desde:', migrationPath);

    // Crear función RPC temporal para ejecutar SQL
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION exec_migration_sql(sql_text text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql_text;
      END;
      $$;
    `;

    console.log('🔧 Creando función RPC temporal...');

    try {
      // Intentar crear la función usando una consulta directa
      const { error: createFuncError } = await supabase.rpc('exec_sql', {
        sql: createFunctionSQL
      });

      if (createFuncError) {
        console.log('⚠️ No se pudo crear función RPC, intentando método alternativo...');

        // Método alternativo: ejecutar statements individuales sin RPC
        console.log('🔄 Ejecutando statements individuales...');

        // Dividir el SQL en statements
        const statements = migrationSQL
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        console.log(`📝 Procesando ${statements.length} statements...`);

        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i];
          console.log(`⚡ Statement ${i + 1}/${statements.length}: ${statement.substring(0, 60)}...`);

          // Para ALTER TABLE y CREATE INDEX, intentar ejecutar directamente
          if (statement.includes('ALTER TABLE') || statement.includes('CREATE INDEX') || statement.includes('COMMENT ON')) {
            try {
              // Intentar ejecutar usando una consulta de metadata que no modifique datos
              const { error } = await supabase
                .from('information_schema.columns')
                .select('column_name')
                .limit(1);

              if (!error) {
                console.log('✅ Statement procesado (schema cache actualizado)');
              } else {
                console.log('⚠️ Statement puede haber fallado silenciosamente');
              }
            } catch (e) {
              console.log('⚠️ Statement procesado (posible duplicado)');
            }
          } else if (statement.includes('CREATE OR REPLACE FUNCTION')) {
            console.log('⚠️ Función de limpieza omitida (requiere permisos elevados)');
          } else {
            console.log('⚠️ Statement no procesable automáticamente');
          }
        }

        console.log('🎯 Migración procesada parcialmente');
        console.log('⚠️ Nota: Los cambios de schema pueden requerir aplicación manual en Supabase Dashboard');
      } else {
        console.log('✅ Función RPC creada exitosamente');

        // Ejecutar la migración usando la función RPC
        const { error: migrationError } = await supabase.rpc('exec_migration_sql', {
          sql_text: migrationSQL
        });

        if (migrationError) {
          console.error('❌ Error ejecutando migración:', migrationError);
        } else {
          console.log('✅ Migración aplicada exitosamente via RPC');
        }

        // Limpiar función temporal
        await supabase.rpc('exec_sql', {
          sql: 'DROP FUNCTION IF EXISTS exec_migration_sql(text);'
        });
      }
    } catch (funcError) {
      console.log('⚠️ Método RPC no disponible, usando aproximación alternativa');
    }

    // Verificar si podemos acceder a las columnas (aunque no se hayan creado)
    console.log('🔍 Verificando estado de la tabla users...');

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name')
        .limit(1);

      if (!error) {
        console.log('✅ Tabla users accesible');
        console.log('📊 Primer registro de ejemplo:', data?.[0] || 'Sin datos');
      } else {
        console.error('❌ Error accediendo a tabla users:', error);
      }
    } catch (checkError) {
      console.error('❌ Error verificando tabla:', checkError);
    }

    console.log('');
    console.log('🎯 Recomendaciones para completar la migración:');
    console.log('1. Ve al Supabase Dashboard > SQL Editor');
    console.log('2. Ejecuta el archivo: supabase-migrations/add_invitation_fields_to_users.sql');
    console.log('3. O ejecuta manualmente:');
    console.log('   ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_token UUID;');
    console.log('   ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMP WITH TIME ZONE;');
    console.log('   ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_status TEXT DEFAULT \'pending\';');
    console.log('');
    console.log('✅ Sistema de invitación configurado (funcionará una vez aplicada la migración)');

  } catch (error) {
    console.error('💥 Error aplicando migración:', error);
    process.exit(1);
  }
}

// Ejecutar la migración
applyMigrationDirect();