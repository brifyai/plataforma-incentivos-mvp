/**
 * Script para ejecutar la migración de campos de comisión
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Ejecutando migración de campos de comisión...');

  try {
    // Ejecutar la migración SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Agregar columnas para tipos de comisión
        ALTER TABLE public.companies
        ADD COLUMN IF NOT EXISTS nexupay_commission_type VARCHAR(20) DEFAULT 'percentage',
        ADD COLUMN IF NOT EXISTS nexupay_commission DECIMAL(15, 2) DEFAULT 15.00,
        ADD COLUMN IF NOT EXISTS user_incentive_type VARCHAR(20) DEFAULT 'percentage',
        ADD COLUMN IF NOT EXISTS user_incentive_percentage DECIMAL(15, 2) DEFAULT 5.00;

        -- Migrar datos existentes
        UPDATE public.companies
        SET
          nexupay_commission = COALESCE(commission_percentage, 15.00),
          user_incentive_percentage = 5.00
        WHERE nexupay_commission IS NULL;
      `
    });

    if (error) {
      console.error('❌ Error ejecutando migración:', error);
      return;
    }

    console.log('✅ Migración ejecutada exitosamente');
    console.log('📊 Resultado:', data);

  } catch (error) {
    console.error('💥 Error en la migración:', error);
  }
}

runMigration();