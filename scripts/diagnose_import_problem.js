/**
 * Script para diagnosticar y corregir problemas de importación masiva
 * 
 * Este script analiza el flujo completo de importación y corrige los problemas
 * identificados que impiden que los datos se guarden en la base de datos.
 */

import { supabase } from '../src/config/supabase.js';
import { createClient } from '@supabase/supabase-js';

// Obtener variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Iniciando diagnóstico de problemas de importación...');

// 1. Verificar configuración de Supabase
console.log('\n📋 1. Verificando configuración de Supabase:');
console.log('URL:', supabaseUrl ? '✅ Configurada' : '❌ No configurada');
console.log('Service Key:', supabaseServiceKey ? '✅ Configurada' : '❌ No configurada');

// 2. Crear cliente con permisos elevados
let supabaseAdmin = null;
if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  console.log('✅ Cliente admin creado');
} else {
  console.log('❌ No se puede crear cliente admin - faltan variables de entorno');
}

// 3. Verificar estructura de tablas
const verifyTableStructure = async () => {
  console.log('\n🏗️ 3. Verificando estructura de tablas...');
  
  try {
    // Verificar tabla users
    const { data: usersColumns, error: usersError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'users')
      .eq('table_schema', 'public');
    
    if (usersError) {
      console.error('❌ Error verificando tabla users:', usersError);
    } else {
      console.log('✅ Estructura tabla users:');
      usersColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
      });
    }

    // Verificar tabla debts
    const { data: debtsColumns, error: debtsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'debts')
      .eq('table_schema', 'public');
    
    if (debtsError) {
      console.error('❌ Error verificando tabla debts:', debtsError);
    } else {
      console.log('✅ Estructura tabla debts:');
      debtsColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
      });
    }

    // Verificar si existe tabla corporate_clients
    const { data: corporateClientsExists, error: corporateCheckError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'corporate_clients')
      .eq('table_schema', 'public')
      .single();
    
    if (corporateCheckError) {
      console.log('⚠️ Tabla corporate_clients no existe');
    } else {
      console.log('✅ Tabla corporate_clients existe');
    }

  } catch (error) {
    console.error('❌ Error verificando estructura:', error);
  }
};

// 4. Verificar políticas RLS
const verifyRLSPolicies = async () => {
  console.log('\n🔒 4. Verificando políticas RLS...');
  
  try {
    const { data: policies, error } = await supabaseAdmin
      .from('pg_policies')
      .select('tablename, policyname, permissive, roles, cmd, qual')
      .eq('tablename', 'debts');
    
    if (error) {
      console.error('❌ Error verificando políticas RLS:', error);
    } else {
      console.log('✅ Políticas RLS para debts:');
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname}: ${policy.cmd} (${policy.permissive ? 'PERMISSIVE' : 'RESTRICTIVE'})`);
      });
    }
  } catch (error) {
    console.error('❌ Error verificando políticas:', error);
  }
};

// 5. Probar inserción directa
const testDirectInsert = async () => {
  console.log('\n🧪 5. Probando inserción directa...');
  
  try {
    // Primero crear un usuario de prueba
    const testUser = {
      email: `test_${Date.now()}@example.com`,
      rut: `${Math.floor(Math.random() * 20000000) + 10000000}-9`,
      full_name: 'Usuario Test Importación',
      role: 'debtor',
      validation_status: 'pending',
      email_verified: false
    };

    console.log('📝 Creando usuario de prueba...');
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert(testUser)
      .select()
      .single();

    if (userError) {
      console.error('❌ Error creando usuario:', userError);
      return null;
    }

    console.log('✅ Usuario creado:', newUser.id);

    // Obtener una empresa de prueba
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id')
      .limit(1)
      .single();

    if (companyError) {
      console.error('❌ Error obteniendo empresa:', companyError);
      return null;
    }

    console.log('✅ Empresa encontrada:', company.id);

    // Crear deuda de prueba
    const testDebt = {
      user_id: newUser.id,
      company_id: company.id,
      original_amount: 100000.00,
      current_amount: 100000.00,
      due_date: '2024-12-31',
      status: 'active',
      description: 'Deuda de prueba importación'
    };

    console.log('💰 Creando deuda de prueba...');
    const { data: newDebt, error: debtError } = await supabaseAdmin
      .from('debts')
      .insert(testDebt)
      .select()
      .single();

    if (debtError) {
      console.error('❌ Error creando deuda:', debtError);
      return null;
    }

    console.log('✅ Deuda creada:', newDebt.id);

    // Limpiar datos de prueba
    await supabaseAdmin.from('debts').delete().eq('id', newDebt.id);
    await supabaseAdmin.from('users').delete().eq('id', newUser.id);

    console.log('🧹 Datos de prueba limpiados');
    return { success: true };

  } catch (error) {
    console.error('❌ Error en prueba de inserción:', error);
    return { success: false, error: error.message };
  }
};

// 6. Generar SQL de corrección
const generateFixSQL = () => {
  console.log('\n🔧 6. Generando SQL de corrección...');
  
  const sql = `
-- =============================================
-- CORRECCIÓN DE PROBLEMAS DE IMPORTACIÓN MASIVA
-- =============================================

-- 1. Crear política RLS para permitir inserciones masivas
DROP POLICY IF EXISTS "Companies can insert debts for import" ON public.debts;

CREATE POLICY "Companies can insert debts for import" ON public.debts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = debts.company_id
            AND companies.user_id = auth.uid()
        )
    );

-- 2. Crear política RLS para permitir inserciones con service role
DROP POLICY IF EXISTS "Service role can insert debts" ON public.debts;

CREATE POLICY "Service role can insert debts" ON public.debts
    FOR INSERT USING (
        EXISTS (
            SELECT 1 FROM public.jwt_claims()
            WHERE role() = 'service_role'
        )
    );

-- 3. Asegurar que la tabla users tenga los campos necesarios
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- 4. Crear tabla corporate_clients si no existe
CREATE TABLE IF NOT EXISTS public.corporate_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    rut VARCHAR(12) NOT NULL,
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    address TEXT,
    industry VARCHAR(100),
    contract_value DECIMAL(15, 2),
    contract_start_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Habilitar RLS en corporate_clients
ALTER TABLE public.corporate_clients ENABLE ROW LEVEL SECURITY;

-- 6. Políticas para corporate_clients
CREATE POLICY "Companies can view their corporate clients" ON public.corporate_clients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = corporate_clients.company_id
            AND companies.user_id = auth.uid()
        )
    );

CREATE POLICY "Companies can manage their corporate clients" ON public.corporate_clients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = corporate_clients.company_id
            AND companies.user_id = auth.uid()
        )
    );

-- 7. Trigger para updated_at en corporate_clients
CREATE TRIGGER update_corporate_clients_updated_at BEFORE UPDATE ON public.corporate_clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Datos de ejemplo para corporate_clients
INSERT INTO public.corporate_clients (company_id, name, rut, contact_name, contact_email, industry, contract_value)
SELECT 
    c.id,
    'Cliente Corporativo Ejemplo',
    '76543210-K',
    'Contacto Ejemplo',
    'contacto@ejemplo.com',
    'Retail',
    5000000.00
FROM public.companies c
LIMIT 1
ON CONFLICT DO NOTHING;
`;

  console.log('✅ SQL de corrección generado:');
  console.log(sql);
  
  return sql;
};

// 7. Ejecutar diagnóstico completo
const runDiagnosis = async () => {
  console.log('🚀 Ejecutando diagnóstico completo...\n');
  
  await verifyTableStructure();
  await verifyRLSPolicies();
  
  if (supabaseAdmin) {
    const insertResult = await testDirectInsert();
    if (insertResult?.success) {
      console.log('\n✅ La inserción directa funciona correctamente');
    } else {
      console.log('\n❌ La inserción directa falla - se necesitan correcciones');
    }
  }
  
  const fixSQL = generateFixSQL();
  
  console.log('\n📋 Resumen del diagnóstico:');
  console.log('1. Estructura de tablas verificada');
  console.log('2. Políticas RLS analizadas');
  console.log('3. Prueba de inserción realizada');
  console.log('4. SQL de corrección generado');
  console.log('\n🔧 Pasos a seguir:');
  console.log('1. Ejecutar el SQL generado en Supabase');
  console.log('2. Verificar que las variables de entorno estén configuradas');
  console.log('3. Probar la importación masiva nuevamente');
};

// Exportar funciones para uso en otros scripts
export {
  verifyTableStructure,
  verifyRLSPolicies,
  testDirectInsert,
  generateFixSQL,
  runDiagnosis
};

// Ejecutar diagnóstico si este script se corre directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runDiagnosis().catch(console.error);
}