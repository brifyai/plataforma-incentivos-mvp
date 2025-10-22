require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createTestDebt() {
  try {
    console.log('🔍 Creando deuda de prueba para María Concha...');

    // Primero verificar si María Concha existe como usuario
    let { data: users, error: userError } = await supabase
      .from('users')
      .select('id, full_name, email, rut')
      .eq('rut', '16610128-k')
      .maybeSingle();

    if (userError || !users) {
      console.log('⚠️ Usuario María Concha no encontrado, creándolo...');
      
      // Crear usuario María Concha
      const newUser = {
        full_name: 'María Concha',
        email: 'maria.concha@ejemplo.com',
        rut: '16610128-k',
        role: 'debtor',
        validation_status: 'validated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: createdUser, error: createUserError } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();

      if (createUserError) {
        console.error('❌ Error creando usuario María Concha:', createUserError);
        return;
      }

      users = createdUser;
      console.log('✅ Usuario María Concha creado:', users.full_name, 'ID:', users.id);
    } else {
      console.log('✅ Usuario encontrado:', users.full_name, 'ID:', users.id);
    }

    // Obtener el ID de la empresa NexuPay Cobranzas
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .select('id, company_name, contact_email')
      .eq('contact_email', 'empresa@nexupay.cl')
      .single();

    if (companyError || !companies) {
      console.error('❌ Error obteniendo empresa:', companyError);
      return;
    }

    console.log('✅ Empresa encontrada:', companies.company_name, 'ID:', companies.id);

    // Obtener el ID del cliente individual María Concha
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, business_name, corporate_client_id')
      .eq('business_name', 'María Concha')
      .single();

    if (clientError || !clients) {
      console.error('❌ Error obteniendo cliente María Concha:', clientError);
      return;
    }

    console.log('✅ Cliente encontrado:', clients.business_name, 'ID:', clients.id);

    // Crear la deuda
    const debtData = {
      user_id: users.id,
      company_id: companies.id,
      client_id: clients.id, // Asociar al cliente individual
      original_amount: 500000,
      current_amount: 500000,
      description: 'Deuda de prueba para María Concha',
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días desde ahora
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: debt, error: debtError } = await supabase
      .from('debts')
      .insert(debtData)
      .select()
      .single();

    if (debtError) {
      console.error('❌ Error creando deuda:', debtError);
      return;
    }

    console.log('✅ Deuda creada exitosamente:');
    console.log('   ID:', debt.id);
    console.log('   Usuario:', users.full_name);
    console.log('   Empresa:', companies.business_name);
    console.log('   Cliente:', clients.business_name);
    console.log('   Monto:', debt.current_amount);
    console.log('   Estado:', debt.status);

    // Verificar que la deuda se creó correctamente
    const { data: verifyDebt, error: verifyError } = await supabase
      .from('debts')
      .select(`
        *,
        user:users(id, full_name, email, rut),
        company:companies(id, business_name, contact_email),
        client:clients(id, business_name, corporate_client_id)
      `)
      .eq('id', debt.id)
      .single();

    if (verifyError) {
      console.error('❌ Error verificando deuda:', verifyError);
      return;
    }

    console.log('\n✅ Verificación completa:');
    console.log('   📋 Deuda ID:', verifyDebt.id);
    console.log('   👤 Usuario:', verifyDebt.user?.full_name, '(', verifyDebt.user?.rut, ')');
    console.log('   🏢 Empresa:', verifyDebt.company?.business_name);
    console.log('   👥 Cliente:', verifyDebt.client?.business_name);
    console.log('   💰 Monto:', verifyDebt.current_amount);
    console.log('   📅 Estado:', verifyDebt.status);
    console.log('   🔗 Client ID:', verifyDebt.client_id);

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

createTestDebt();