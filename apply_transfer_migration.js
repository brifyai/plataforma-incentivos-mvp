#!/usr/bin/env node

/**
 * Script para aplicar la migración de transferencias
 * Ejecutar con: node apply_transfer_migration.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyTransferMigration() {
  try {
    // Leer variables de entorno
    const envPath = path.join(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = envContent.split('\n').reduce((acc, line) => {
      const [key, value] = line.split('=');
      if (key && value) acc[key.trim()] = value.trim();
      return acc;
    }, {});

    const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

    console.log('🚀 Aplicando migración de transferencias...\n');

    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, 'add_transfer_tracking.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Ejecutando SQL:', migrationSQL.substring(0, 200) + '...');

    // Ejecutar directamente con Supabase (esto requiere permisos de admin)
    // Como alternativa, vamos a ejecutar las sentencias una por una
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim().length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          console.log(`🔄 Ejecutando: ${statement.trim().substring(0, 50)}...`);

          // Para Supabase, necesitamos usar el cliente con permisos elevados
          // Como workaround, vamos a intentar ejecutar directamente
          const { error } = await supabase.rpc('exec', { query: statement.trim() });

          if (error) {
            console.log(`⚠️ Error en statement (ignorando): ${error.message}`);
          } else {
            console.log(`✅ Statement ejecutado`);
          }
        } catch (err) {
          console.log(`⚠️ Error ejecutando statement: ${err.message}`);
        }
      }
    }

    console.log('\n🔍 Verificando columnas agregadas...');

    // Verificar si las columnas fueron agregadas
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'companies')
      .eq('table_schema', 'public')
      .in('column_name', ['bank_account_info', 'mercadopago_beneficiary_id']);

    if (columnsError) {
      console.error('❌ Error verificando columnas:', columnsError);
    } else {
      console.log('📋 Nuevas columnas en companies:');
      if (columns.length > 0) {
        columns.forEach(col => {
          console.log(`  ✅ ${col.column_name} (${col.data_type})`);
        });
        console.log('\n🎉 ¡Migración de transferencias aplicada exitosamente!');
      } else {
        console.log('  ❌ No se encontraron las columnas nuevas');
        console.log('  💡 Es posible que necesites ejecutar la migración manualmente en Supabase SQL Editor');
      }
    }

    // Verificar transactions table
    const { data: txColumns, error: txError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'transactions')
      .eq('table_schema', 'public')
      .in('column_name', ['transfer_status', 'transfer_id', 'transfer_amount']);

    if (!txError && txColumns.length > 0) {
      console.log('\n📋 Nuevas columnas en transactions:');
      txColumns.forEach(col => {
        console.log(`  ✅ ${col.column_name} (${col.data_type})`);
      });
    }

  } catch (err) {
    console.error('❌ Error general:', err);
    console.log('\n💡 Solución: Copia el contenido de add_transfer_tracking.sql y pégalo en Supabase SQL Editor');
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  applyTransferMigration();
}

export { applyTransferMigration };