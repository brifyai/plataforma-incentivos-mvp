const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function showAllEntities() {
  try {
    console.log('📋 === REPORTE COMPLETO DE ENTIDADES EN NEXUPAY ===\n');

    // 1. USUARIOS REGISTRADOS
    console.log('👥 === USUARIOS REGISTRADOS ===');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role, full_name, created_at')
      .order('created_at');

    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError);
    } else {
      console.log(`📊 Total usuarios: ${users.length}`);
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.email}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Rol: ${user.role}`);
        console.log(`   Nombre: ${user.full_name || 'No especificado'}`);
        console.log(`   Creado: ${new Date(user.created_at).toLocaleDateString('es-CL')}`);
      });
    }

    // 2. EMPRESAS (COMPANIES)
    console.log('\n\n🏢 === EMPRESAS REGISTRADAS ===');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select(`
        id,
        company_name,
        rut,
        contact_email,
        contact_phone,
        validation_status,
        user_id,
        created_at,
        updated_at,
        bank_account_info,
        mercadopago_beneficiary_id
      `)
      .order('created_at');

    if (companiesError) {
      console.error('❌ Error obteniendo empresas:', companiesError);
    } else {
      console.log(`📊 Total empresas: ${companies.length}`);
      companies.forEach((company, index) => {
        console.log(`\n${index + 1}. ${company.company_name || 'Sin nombre'}`);
        console.log(`   ID: ${company.id}`);
        console.log(`   RUT: ${company.rut || 'No especificado'}`);
        console.log(`   Email: ${company.contact_email || 'No especificado'}`);
        console.log(`   Teléfono: ${company.contact_phone || 'No especificado'}`);
        console.log(`   Estado validación: ${company.validation_status || 'No validada'}`);
        console.log(`   ID Usuario: ${company.user_id || 'No asociado'}`);
        console.log(`   Cuenta bancaria: ${company.bank_account_info ? 'Configurada' : 'No configurada'}`);
        console.log(`   MercadoPago: ${company.mercadopago_beneficiary_id ? 'Configurado' : 'No configurado'}`);
        console.log(`   Creada: ${new Date(company.created_at).toLocaleDateString('es-CL')}`);
      });
    }

    // 3. EMPRESAS GLOBALES (CORPORATE CLIENTS)
    console.log('\n\n🌐 === EMPRESAS GLOBALES (CORPORATE CLIENTS) ===');
    const { data: corporateClients, error: corporateError } = await supabase
      .from('corporate_clients')
      .select(`
        id,
        rut,
        industry,
        contact_email,
        contact_phone,
        company_id,
        created_at,
        updated_at
      `)
      .order('created_at');

    if (corporateError) {
      console.error('❌ Error obteniendo empresas globales:', corporateError);
    } else {
      console.log(`📊 Total empresas globales: ${corporateClients.length}`);
      
      // Mostrar relación con empresas principales
      for (let i = 0; i < corporateClients.length; i++) {
        const corporate = corporateClients[i];
        // Buscar nombre de la empresa principal primero
        let mainCompanyName = 'Sin nombre';
        if (corporate.company_id && companies) {
          const mainCompany = companies.find(c => c.id === corporate.company_id);
          if (mainCompany) {
            mainCompanyName = mainCompany.company_name || 'Sin nombre';
          }
        }
        
        console.log(`\n${i + 1}. ${mainCompanyName}`);
        console.log(`   ID: ${corporate.id}`);
        console.log(`   RUT: ${corporate.rut || 'No especificado'}`);
        console.log(`   Industria: ${corporate.industry || 'No especificada'}`);
        console.log(`   Email: ${corporate.contact_email || 'No especificado'}`);
        console.log(`   Teléfono: ${corporate.contact_phone || 'No especificado'}`);
        console.log(`   ID Empresa principal: ${corporate.company_id || 'No asociada'}`);
        console.log(`   Empresa principal: ${mainCompanyName}`);
        console.log(`   Creada: ${new Date(corporate.created_at).toLocaleDateString('es-CL')}`);
      }
    }

    // 4. PERSONAS/CLIENTES (CLIENTS)
    console.log('\n\n👤 === PERSONAS/CLIENTES REGISTRADOS ===');
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select(`
        id,
        business_name,
        rut,
        contact_email,
        contact_phone,
        corporate_client_id,
        created_at,
        updated_at
      `)
      .order('created_at');

    if (clientsError) {
      console.error('❌ Error obteniendo clientes:', clientsError);
    } else {
      console.log(`📊 Total personas/clientes: ${clients.length}`);
      
      // Mostrar relación con empresas globales
      for (let i = 0; i < clients.length; i++) {
        const client = clients[i];
        console.log(`\n${i + 1}. ${client.business_name || 'Sin nombre'}`);
        console.log(`   ID: ${client.id}`);
        console.log(`   RUT: ${client.rut || 'No especificado'}`);
        console.log(`   Email: ${client.contact_email || 'No especificado'}`);
        console.log(`   Teléfono: ${client.contact_phone || 'No especificado'}`);
        console.log(`   ID Empresa global: ${client.corporate_client_id || 'No asociada'}`);
        
        // Buscar nombre de la empresa global
        if (client.corporate_client_id) {
          const corporate = corporateClients.find(c => c.id === client.corporate_client_id);
          if (corporate) {
            console.log(`   Empresa global: ${corporate.business_name || 'Sin nombre'}`);
          }
        }
        console.log(`   Creado: ${new Date(client.created_at).toLocaleDateString('es-CL')}`);
      }
    }

    // 5. DEUDAS
    console.log('\n\n💰 === DEUDAS REGISTRADAS ===');
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select(`
        id,
        user_id,
        company_id,
        client_id,
        original_amount,
        current_amount,
        description,
        status,
        due_date,
        created_at
      `)
      .order('created_at');

    if (debtsError) {
      console.error('❌ Error obteniendo deudas:', debtsError);
    } else {
      console.log(`📊 Total deudas: ${debts.length}`);
      
      for (let i = 0; i < debts.length; i++) {
        const debt = debts[i];
        console.log(`\n${i + 1}. Deuda ID: ${debt.id}`);
        console.log(`   Monto original: $${debt.original_amount?.toLocaleString('es-CL') || '0'}`);
        console.log(`   Monto actual: $${debt.current_amount?.toLocaleString('es-CL') || '0'}`);
        console.log(`   Descripción: ${debt.description || 'Sin descripción'}`);
        console.log(`   Estado: ${debt.status || 'Sin estado'}`);
        console.log(`   Fecha vencimiento: ${debt.due_date ? new Date(debt.due_date).toLocaleDateString('es-CL') : 'No especificada'}`);
        console.log(`   ID Usuario: ${debt.user_id || 'No asociado'}`);
        console.log(`   ID Empresa: ${debt.company_id || 'No asociada'}`);
        console.log(`   ID Cliente: ${debt.client_id || 'No asociado'}`);
        
        // Buscar información del cliente
        if (debt.client_id) {
          const client = clients.find(c => c.id === debt.client_id);
          if (client) {
            console.log(`   Cliente: ${client.business_name || 'Sin nombre'} (${client.rut || 'Sin RUT'})`);
          }
        }
        
        // Buscar información de la empresa
        if (debt.company_id) {
          const company = companies.find(c => c.id === debt.company_id);
          if (company) {
            console.log(`   Empresa: ${company.company_name || 'Sin nombre'}`);
          }
        }
        
        console.log(`   Creada: ${new Date(debt.created_at).toLocaleDateString('es-CL')}`);
      }
    }

    // 6. RESUMEN FINAL
    console.log('\n\n📊 === RESUMEN FINAL ===');
    console.log(`👥 Usuarios totales: ${users?.length || 0}`);
    console.log(`🏢 Empresas totales: ${companies?.length || 0}`);
    console.log(`🌐 Empresas globales totales: ${corporateClients?.length || 0}`);
    console.log(`👤 Personas/Clientes totales: ${clients?.length || 0}`);
    console.log(`💰 Deudas totales: ${debts?.length || 0}`);
    
    // Calcular total de deudas
    const totalDebtAmount = debts?.reduce((sum, debt) => sum + (debt.current_amount || 0), 0) || 0;
    console.log(`💵 Monto total de deudas: $${totalDebtAmount.toLocaleString('es-CL')}`);

    console.log('\n✅ === FIN DEL REPORTE ===');

  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
}

showAllEntities();