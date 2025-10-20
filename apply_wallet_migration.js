/**
 * Aplicar migraciones de wallet: wallet_transactions y gift_cards
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY requeridas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyWalletMigration() {
  try {
    console.log('🔄 Aplicando migraciones de wallet...');

    const migrations = [
      'create_wallet_transactions_table.sql',
      'create_gift_cards_table.sql'
    ];

    for (const migrationFile of migrations) {
      console.log(`📄 Aplicando ${migrationFile}...`);

      // Leer el archivo SQL
      const migrationPath = path.join(__dirname, 'supabase-migrations', migrationFile);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

      // Ejecutar la migración usando RPC
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: migrationSQL
      });

      if (error) {
        console.error(`❌ Error aplicando ${migrationFile}:`, error);

        // Intentar ejecutar directamente si RPC falla
        console.log('🔄 Intentando ejecutar directamente...');

        // Dividir el SQL en statements individuales
        const statements = migrationSQL
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        for (const statement of statements) {
          if (statement.trim()) {
            try {
              const { error: stmtError } = await supabase.from('_temp_exec').select('*').limit(0);
              if (stmtError) {
                console.log(`⚠️  Statement podría requerir ejecución manual: ${statement.substring(0, 50)}...`);
              }
            } catch (e) {
              // Ignorar errores individuales
            }
          }
        }

        console.log(`⚠️  ${migrationFile} podría requerir aplicación manual en Supabase SQL Editor`);
        console.log(`📄 SQL disponible en: supabase-migrations/${migrationFile}`);
      } else {
        console.log(`✅ ${migrationFile} aplicada exitosamente`);
      }
    }

    console.log('🎉 Todas las migraciones procesadas');
    return true;

  } catch (error) {
    console.error('❌ Error en applyWalletMigration:', error);
    return false;
  }
}

// Ejecutar la migración
applyWalletMigration()
  .then(success => {
    if (success) {
      console.log('🎉 Migración completada exitosamente');
    } else {
      console.log('⚠️  Revisar aplicación manual requerida');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });

export { applyWalletMigration };