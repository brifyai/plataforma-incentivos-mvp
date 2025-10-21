/**
 * Script MÍNIMO para poblar la base de datos de producción
 * Solo usa las columnas que definitivamente existen
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leer configuración de Supabase
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');

let supabaseUrl = '';
let supabaseKey = '';

envLines.forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1];
  }
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
    supabaseKey = line.split('=')[1];
  }
});

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function populateProductionMinimal() {
  console.log('🚀 Poblando base de datos de producción (versión mínima)...');
  console.log('=' .repeat(70));

  try {
    // 1. Crear usuario empresa (solo columnas mínimas que existen)
    console.log('🏢 1. Creando usuario empresa...');
    const companyUserId = crypto.randomUUID();
    const companyUser = {
      id: companyUserId,
      full_name: 'Empresa NexuPay',
      email: 'empresa@nexupay.cl',
      rut: '22222222-2',
      role: 'company',
      phone: '+56987654321',
      wallet_balance: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: companyUserData, error: companyUserError } = await supabase
      .from('users')
      .insert(companyUser)
      .select();

    if (companyUserError) {
      console.error('❌ Error creando usuario empresa:', companyUserError);
      return;
    } else {
      console.log('✅ Usuario empresa creado:', companyUserData[0].id);
    }

    // 2. Crear empresa de cobranza (solo columnas mínimas que existen)
    console.log('🏭 2. Creando empresa de cobranza...');
    const companyId = crypto.randomUUID();
    const company = {
      id: companyId,
      user_id: companyUserId,
      company_name: 'NexuPay Cobranzas',
      contact_email: 'empresa@nexupay.cl',
      contact_phone: '+56987654321',
      rut: '22222222-2',
      nexupay_commission: 15,
      nexupay_commission_type: 'percentage',
      user_incentive_percentage: 5,
      user_incentive_type: 'percentage',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert(company)
      .select();

    if (companyError) {
      console.error('❌ Error creando empresa:', companyError);
      return;
    } else {
      console.log('✅ Empresa de cobranza creada:', companyData[0].id);
    }

    // 3. Crear cliente corporativo (solo columnas mínimas que existen)
    console.log('🏢 3. Creando cliente corporativo...');
    const corpClientId = crypto.randomUUID();
    const corporateClient = {
      id: corpClientId,
      contact_email: 'contacto@techcorp.cl',
      contact_phone: '+56911223344',
      rut: '33333333-3',
      industry: 'Tecnología',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: corpClientData, error: corpClientError } = await supabase
      .from('corporate_clients')
      .insert(corporateClient)
      .select();

    if (corpClientError) {
      console.error('❌ Error creando cliente corporativo:', corpClientError);
      return;
    } else {
      console.log('✅ Cliente corporativo creado:', corpClientData[0].id);
    }

    // 4. Crear cliente específico (solo columnas mínimas que existen)
    console.log('👤 4. Creando cliente específico...');
    const clientId = crypto.randomUUID();
    const client = {
      id: clientId,
      company_id: companyId,
      contact_email: 'desarrollo@techcorp.cl',
      contact_phone: '+56955667788',
      rut: '44444444-4',
      corporate_client_id: corpClientId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .insert(client)
      .select();

    if (clientError) {
      console.error('❌ Error creando cliente específico:', clientError);
      return;
    } else {
      console.log('✅ Cliente específico creado:', clientData[0].id);
    }

    // 5. Crear usuario deudor (solo columnas mínimas que existen)
    console.log('👨‍💼 5. Creando usuario deudor...');
    const debtorId = crypto.randomUUID();
    const debtorUser = {
      id: debtorId,
      full_name: 'María Concha',
      email: 'hola@aintelligence.cl',
      rut: '16610128-k',
      role: 'debtor',
      phone: '+56966871175',
      wallet_balance: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: debtorData, error: debtorError } = await supabase
      .from('users')
      .insert(debtorUser)
      .select();

    if (debtorError) {
      console.error('❌ Error creando usuario deudor:', debtorError);
      return;
    } else {
      console.log('✅ Usuario deudor creado:', debtorData[0].id);
    }

    // 6. Crear deuda (solo columnas mínimas que existen)
    console.log('💰 6. Creando deuda...');
    const debtId = crypto.randomUUID();
    const debt = {
      id: debtId,
      user_id: debtorId,
      company_id: companyId,
      client_id: clientId,
      original_amount: 2500000,
      current_amount: 2500000,
      description: 'Desarrollo de software - Proyecto NexuPay',
      status: 'active',
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: debtData, error: debtError } = await supabase
      .from('debts')
      .insert(debt)
      .select();

    if (debtError) {
      console.error('❌ Error creando deuda:', debtError);
      return;
    } else {
      console.log('✅ Deuda creada:', debtData[0].id);
    }

    console.log('');
    console.log('🎉 ¡Datos de producción poblados exitosamente!');
    console.log('');
    console.log('📊 RESUMEN DE DATOS CREADOS:');
    console.log('-'.repeat(50));
    console.log('👑 1 Usuario Administrador (ya existía)');
    console.log('🏢 1 Usuario Empresa');
    console.log('🏭 1 Empresa de Cobranza');
    console.log('🏢 1 Cliente Corporativo');
    console.log('👤 1 Cliente Específico');
    console.log('👨‍💼 1 Usuario Deudor');
    console.log('💰 1 Deuda Activa');
    console.log('');
    console.log('✅ Ahora puedes probar todos los portales:');
    console.log('   - Portal Admin: admin@nexupay.cl');
    console.log('   - Portal Empresa: empresa@nexupay.cl');
    console.log('   - Portal Personas: hola@aintelligence.cl');
    console.log('');
    console.log('🔐 Credenciales de prueba:');
    console.log('   Usuario: cualquiera de los emails arriba');
    console.log('   Contraseña: 123456 (o la que configures)');
    console.log('');

  } catch (error) {
    console.error('💥 Error poblando datos de producción:', error);
    process.exit(1);
  }
}

// Ejecutar el script
populateProductionMinimal();