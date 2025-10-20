#!/usr/bin/env node

/**
 * Script para aplicar la migración segura inmediatamente
 * Ejecutar con: node apply_migration_now.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyMigration() {
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

    console.log('🚀 Aplicando migración segura...\n');

    // Migración SQL segura
    const migrationSQL = `
-- MIGRACIÓN SEGURA: Solo agrega lo que falta
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('debtor', 'company', 'god_mode');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE validation_status AS ENUM ('pending', 'validated', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE debt_status AS ENUM ('active', 'negotiating', 'agreed', 'paid', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Crear tablas si no existen
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    rut VARCHAR(12) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL,
    validation_status validation_status DEFAULT 'pending',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    profile_image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    rut VARCHAR(12) NOT NULL UNIQUE,
    api_key VARCHAR(255) UNIQUE,
    webhook_url VARCHAR(500),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AGREGAR COLUMNAS FALTANTES A COMPANIES (esto es lo más importante)
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS company_type TEXT DEFAULT 'direct_creditor' CHECK (company_type IN ('direct_creditor', 'collection_agency')),
ADD COLUMN IF NOT EXISTS nexupay_commission_type TEXT DEFAULT 'percentage' CHECK (nexupay_commission_type IN ('percentage', 'fixed')),
ADD COLUMN IF NOT EXISTS nexupay_commission DECIMAL(10,2) DEFAULT 15.00,
ADD COLUMN IF NOT EXISTS user_incentive_type TEXT DEFAULT 'percentage' CHECK (user_incentive_type IN ('percentage', 'fixed')),
ADD COLUMN IF NOT EXISTS user_incentive_percentage DECIMAL(10,2) DEFAULT 5.00;

-- Agregar columna password si falta
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password TEXT;

-- Crear tablas adicionales si no existen
CREATE TABLE IF NOT EXISTS public.debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    original_amount DECIMAL(15, 2) NOT NULL,
    current_amount DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(5, 2),
    due_date DATE,
    status debt_status DEFAULT 'active',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date DATE,
    installment_number INTEGER,
    status payment_status DEFAULT 'pending',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

SELECT 'SUCCESS: Migration completed successfully!' as status, NOW() as completed_at;
`;

    // Ejecutar la migración
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Error ejecutando migración:', error);
      return;
    }

    console.log('✅ Migración aplicada exitosamente!');
    console.log('📊 Resultado:', data);

    // Verificar columnas de companies
    console.log('\n🔍 Verificando columnas de companies...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'companies')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (columnsError) {
      console.error('❌ Error verificando columnas:', columnsError);
    } else {
      console.log('📋 Columnas de companies:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });

      // Verificar columnas específicas
      const requiredColumns = ['company_type', 'nexupay_commission_type', 'nexupay_commission', 'user_incentive_type', 'user_incentive_percentage'];
      const existingColumns = columns.map(c => c.column_name);
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

      if (missingColumns.length === 0) {
        console.log('\n✅ ¡Todas las columnas necesarias están presentes!');
        console.log('🎉 Ahora puedes guardar el perfil de empresa correctamente.');
      } else {
        console.log('\n⚠️ Columnas faltantes:', missingColumns);
      }
    }

  } catch (err) {
    console.error('❌ Error general:', err);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  applyMigration();
}

export { applyMigration };