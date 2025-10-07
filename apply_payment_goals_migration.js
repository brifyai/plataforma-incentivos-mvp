#!/usr/bin/env node

/**
 * Script para aplicar la migración de objetivos de pago
 * Ejecutar con: node apply_payment_goals_migration.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyPaymentGoalsMigration() {
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

    console.log('🚀 Aplicando migración de objetivos de pago...\n');

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'supabase-migrations', 'create_payment_goals_table.sql');
    const migrationSQL = fs.readFileSync(sqlPath, 'utf8');

    console.log('🔍 Verificando tabla payment_goals...');

    // Verificar si la tabla existe
    const { data: existingData, error: checkError } = await supabase
      .from('payment_goals')
      .select('*')
      .limit(1);

    if (checkError && checkError.code === '42P01') {
      console.log('⚠️ Tabla payment_goals no existe en Supabase.');
      console.log('📋 Necesitas crear la tabla manualmente en el dashboard de Supabase.');
      console.log('📄 SQL a ejecutar en el SQL Editor de Supabase:');
      console.log('==================================================');
      console.log(migrationSQL);
      console.log('==================================================');
      console.log('\nDespués de ejecutar el SQL, vuelve a ejecutar este script.');
      return;
    } else if (checkError) {
      console.error('❌ Error verificando tabla:', checkError);
      return;
    }

    console.log('✅ Tabla payment_goals existe');
    console.log('📊 Datos actuales:', existingData);

    // Si la tabla está vacía, insertar datos por defecto
    if (!existingData || existingData.length === 0) {
      console.log('📝 Insertando datos por defecto...');
      const { error: insertError } = await supabase
        .from('payment_goals')
        .insert({
          monthly_commission_goal: 2500000,
          monthly_nexupay_goal: 2500000
        });

      if (insertError) {
        console.error('❌ Error insertando datos por defecto:', insertError);
      } else {
        console.log('✅ Datos por defecto insertados exitosamente');
      }
    }

    console.log('✅ Migración de objetivos de pago completada!');

    // Verificar que la tabla se creó correctamente
    console.log('\n🔍 Verificando tabla payment_goals...');
    const { data: tableData, error: tableError } = await supabase
      .from('payment_goals')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Error verificando tabla:', tableError);
    } else {
      console.log('✅ Tabla payment_goals creada correctamente');
      console.log('📋 Datos iniciales:', tableData);
    }

  } catch (err) {
    console.error('❌ Error general:', err);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  applyPaymentGoalsMigration();
}

export { applyPaymentGoalsMigration };