/**
 * Script para poblar la base de datos de producción con datos de prueba
 * Ejecutar después de las migraciones en Supabase
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

async function populateDatabase() {
  console.log('🚀 Iniciando población de base de datos de producción...');
  console.log('=' .repeat(60));

  try {
    // 1. Crear usuario administrador (god_mode)
    console.log('👑 1. Creando usuario administrador...');
    const adminUser = {
      id: 'admin-001',
      full_name: 'Administrador NexuPay',
      email: 'admin@nexupay.cl',
      rut: '11111111-1',
      role: 'god_mode',
      phone: '+56912345678',
      validation_status: 'validated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: adminData, error: adminError } = await supabase
      .from('users')
      .insert(adminUser)
      .select();

    if (adminError && !adminError.message.includes('duplicate key')) {
      console.error('❌ Error creando admin:', adminError);
    } else {
      console.log('✅ Usuario administrador creado');
    }

    // 2. Crear empresa de cobranza
    console.log('🏢 2. Creando empresa de cobranza...');
    const company = {
      id: 'company-001',
      user_id: 'admin-001',
      business_name: 'NexuPay Cobranzas',
      contact_email: 'empresa@nexupay.cl',
      contact_phone: '+56987654321',
      rut: '22222222-2',
      business_address: 'Av. Providencia 123, Santiago',
      nexupay_commission: 15,
      nexupay_commission_type: 'percentage',
      user_incentive_percentage: 5,
      user_incentive_type: 'percentage',
      validation_status: 'validated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert(company)
      .select();

    if (companyError && !companyError.message.includes('duplicate key')) {
      console.error('❌ Error creando empresa:', companyError);
    } else {
      console.log('✅ Empresa de cobranza creada');
    }

    // 3. Crear cliente corporativo
    console.log('🏭 3. Creando cliente corporativo...');
    const corporateClient = {
      id: 'corporate-001',
      business_name: 'TechCorp S.A.',
      contact_email: 'contacto@techcorp.cl',
      contact_phone: '+56911223344',
      rut: '33333333-3',
      business_address: 'Av. Apoquindo 456, Las Condes',
      industry: 'Tecnología',
      company_size: 'medium',
      credit_limit: 50000000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: corpClientData, error: corpClientError } = await supabase
      .from('corporate_clients')
      .insert(corporateClient)
      .select();

    if (corpClientError && !corpClientError.message.includes('duplicate key')) {
      console.error('❌ Error creando cliente corporativo:', corpClientError);
    } else {
      console.log('✅ Cliente corporativo creado');
    }

    // 4. Crear cliente específico de la empresa
    console.log('👤 4. Creando cliente específico...');
    const client = {
      id: 'client-001',
      company_id: 'company-001',
      business_name: 'TechCorp - División Desarrollo',
      contact_email: 'desarrollo@techcorp.cl',
      contact_phone: '+56955667788',
      rut: '44444444-4',
      corporate_client_id: 'corporate-001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .insert(client)
      .select();

    if (clientError && !clientError.message.includes('duplicate key')) {
      console.error('❌ Error creando cliente:', clientError);
    } else {
      console.log('✅ Cliente específico creado');
    }

    // 5. Crear usuario deudor
    console.log('👨‍💼 5. Creando usuario deudor...');
    const debtorUser = {
      id: 'debtor-001',
      full_name: 'María Concha',
      email: 'hola@aintelligence.cl',
      rut: '16610128-k',
      role: 'debtor',
      phone: '+56966871175',
      validation_status: 'validated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: debtorData, error: debtorError } = await supabase
      .from('users')
      .insert(debtorUser)
      .select();

    if (debtorError && !debtorError.message.includes('duplicate key')) {
      console.error('❌ Error creando deudor:', debtorError);
    } else {
      console.log('✅ Usuario deudor creado');
    }

    // 6. Crear deuda
    console.log('💰 6. Creando deuda...');
    const debt = {
      id: 'debt-001',
      user_id: 'debtor-001',
      company_id: 'company-001',
      client_id: 'client-001',
      original_amount: 2500000,
      current_amount: 2500000,
      description: 'Desarrollo de software - Proyecto NexuPay',
      status: 'active',
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: debtData, error: debtError } = await supabase
      .from('debts')
      .insert(debt)
      .select();

    if (debtError && !debtError.message.includes('duplicate key')) {
      console.error('❌ Error creando deuda:', debtError);
    } else {
      console.log('✅ Deuda creada');
    }

    // 7. Crear oferta
    console.log('📋 7. Creando oferta...');
    const offer = {
      id: 'offer-001',
      company_id: 'company-001',
      debt_id: 'debt-001',
      proposed_amount: 2000000,
      payment_plan: 'Pago en 6 cuotas mensuales',
      description: 'Propuesta de acuerdo: reducción del 20% por pago inmediato',
      status: 'active',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: offerData, error: offerError } = await supabase
      .from('offers')
      .insert(offer)
      .select();

    if (offerError && !offerError.message.includes('duplicate key')) {
      console.error('❌ Error creando oferta:', offerError);
    } else {
      console.log('✅ Oferta creada');
    }

    // 8. Crear acuerdo
    console.log('🤝 8. Creando acuerdo...');
    const agreement = {
      id: 'agreement-001',
      user_id: 'debtor-001',
      company_id: 'company-001',
      debt_id: 'debt-001',
      offer_id: 'offer-001',
      agreed_amount: 2000000,
      payment_plan: 'Pago en 6 cuotas mensuales',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: agreementData, error: agreementError } = await supabase
      .from('agreements')
      .insert(agreement)
      .select();

    if (agreementError && !agreementError.message.includes('duplicate key')) {
      console.error('❌ Error creando acuerdo:', agreementError);
    } else {
      console.log('✅ Acuerdo creado');
    }

    // 9. Crear pago
    console.log('💳 9. Creando pago...');
    const payment = {
      id: 'payment-001',
      user_id: 'debtor-001',
      company_id: 'company-001',
      debt_id: 'debt-001',
      agreement_id: 'agreement-001',
      amount: 333333, // Primera cuota
      status: 'completed',
      payment_method: 'mercadopago',
      transaction_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert(payment)
      .select();

    if (paymentError && !paymentError.message.includes('duplicate key')) {
      console.error('❌ Error creando pago:', paymentError);
    } else {
      console.log('✅ Pago creado');
    }

    // 10. Actualizar balance de billetera del deudor
    console.log('👛 10. Actualizando billetera...');
    const { error: walletError } = await supabase
      .from('users')
      .update({
        wallet_balance: 333333,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'debtor-001');

    if (walletError) {
      console.error('❌ Error actualizando billetera:', walletError);
    } else {
      console.log('✅ Billetera actualizada');
    }

    // 11. Crear transacción de billetera
    console.log('📊 11. Creando transacción de billetera...');
    const walletTransaction = {
      id: 'wallet-tx-001',
      user_id: 'debtor-001',
      amount: 333333,
      transaction_type: 'credit',
      concept: 'Pago de cuota - Proyecto NexuPay',
      reference_id: 'payment-001',
      balance_before: 0,
      balance_after: 333333,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: walletTxError } = await supabase
      .from('wallet_transactions')
      .insert(walletTransaction);

    if (walletTxError && !walletTxError.message.includes('duplicate key')) {
      console.error('❌ Error creando transacción de billetera:', walletTxError);
    } else {
      console.log('✅ Transacción de billetera creada');
    }

    console.log('');
    console.log('🎉 ¡Base de datos poblada exitosamente!');
    console.log('');
    console.log('📊 RESUMEN DE DATOS CREADOS:');
    console.log('-'.repeat(40));
    console.log('👑 1 Usuario Administrador');
    console.log('🏢 1 Empresa de Cobranza');
    console.log('🏭 1 Cliente Corporativo');
    console.log('👤 1 Cliente Específico');
    console.log('👨‍💼 1 Usuario Deudor');
    console.log('💰 1 Deuda Activa');
    console.log('📋 1 Oferta Activa');
    console.log('🤝 1 Acuerdo Activo');
    console.log('💳 1 Pago Completado');
    console.log('👛 1 Transacción de Billetera');
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
    console.error('💥 Error poblando base de datos:', error);
    process.exit(1);
  }
}

// Ejecutar el script
populateDatabase();