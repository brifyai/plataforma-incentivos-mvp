/**
 * Script para verificar el estado de la cuenta brifyaimaster@gmail.com
 * Ejecutar con: node check_brifyai_account.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Cargar variables de entorno desde .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  const envContent = readFileSync(join(__dirname, '.env'), 'utf8');
  const envLines = envContent.split('\n');

  for (const line of envLines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      if (key && value) {
        process.env[key] = value;
      }
    }
  }
} catch (error) {
  console.error('❌ Error cargando .env:', error.message);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno no encontradas');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBrifyaiAccount() {
  try {
    console.log('🔍 Verificando cuenta: brifyaimaster@gmail.com\n');

    // 1. Verificar usuario
    console.log('=== USUARIO ===');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'brifyaimaster@gmail.com')
      .single();

    if (userError) {
      console.error('❌ Error obteniendo usuario:', userError.message);
      return;
    }

    console.log('✅ Usuario encontrado:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Nombre:', user.full_name);
    console.log('   RUT:', user.rut);
    console.log('   Rol:', user.role);
    console.log('   Estado validación:', user.validation_status);
    console.log('   Creado:', user.created_at);
    console.log('');

    // 2. Verificar empresa
    console.log('=== EMPRESA ===');
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (companyError) {
      console.error('❌ Error obteniendo empresa:', companyError.message);
      return;
    }

    console.log('✅ Empresa encontrada:');
    console.log('   ID:', company.id);
    console.log('   Nombre:', company.company_name);
    console.log('   RUT:', company.rut);
    console.log('   Email contacto:', company.contact_email);
    console.log('   Activa:', company.is_active);
    console.log('   Creada:', company.created_at);
    console.log('');

    // 3. Verificar datos bancarios
    console.log('=== DATOS BANCARIOS ===');
    const hasBankInfo = company.bank_account_info !== null;
    const hasMercadoPagoId = company.mercadopago_beneficiary_id !== null;

    console.log('   ¿Tiene datos bancarios?', hasBankInfo ? '✅ SÍ' : '❌ NO');
    console.log('   ¿Registrado en Mercado Pago?', hasMercadoPagoId ? '✅ SÍ' : '❌ NO');

    if (hasBankInfo) {
      console.log('   Datos bancarios:', JSON.stringify(company.bank_account_info, null, 2));
    }

    if (hasMercadoPagoId) {
      console.log('   ID Mercado Pago:', company.mercadopago_beneficiary_id);
    }

    console.log('');

    // 4. Diagnóstico
    console.log('=== DIAGNÓSTICO ===');
    if (hasBankInfo && !hasMercadoPagoId) {
      console.log('⚠️  EMPRESA TIENE DATOS BANCARIOS PERO NO ESTÁ REGISTRADA EN MERCADO PAGO');
      console.log('💡 SOLUCIÓN: Necesita ser registrada manualmente como beneficiario en MP');
    } else if (!hasBankInfo && !hasMercadoPagoId) {
      console.log('❌ EMPRESA NO TIENE DATOS BANCARIOS CONFIGURADOS');
      console.log('💡 SOLUCIÓN: Configurar cuenta bancaria primero');
    } else if (hasBankInfo && hasMercadoPagoId) {
      console.log('✅ EMPRESA COMPLETAMENTE CONFIGURADA');
    }

  } catch (error) {
    console.error('❌ Error en checkBrifyaiAccount:', error);
  }
}

checkBrifyaiAccount();