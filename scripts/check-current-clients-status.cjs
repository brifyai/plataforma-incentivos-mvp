const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCurrentClientsStatus() {
  console.log('🔍 Verificando estado actual de clientes y empresas corporativas\n');

  try {
    // 1. Obtener información de la empresa principal
    console.log('1. 📋 EMPRESA PRINCIPAL:');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .eq('email', 'empresa@nexupay.cl');

    if (companiesError) {
      console.error('❌ Error al obtener empresas:', companiesError);
      return;
    }

    if (companies.length === 0) {
      console.log('❌ No se encontró la empresa empresa@nexupay.cl');
      return;
    }

    const mainCompany = companies[0];
    console.log('✅ Empresa principal encontrada:');
    console.log(`   ID: ${mainCompany.id}`);
    console.log(`   Nombre: ${mainCompany.business_name || mainCompany.name}`);
    console.log(`   Email: ${mainCompany.email}`);
    console.log(`   Validada: ${mainCompany.is_validated ? 'Sí' : 'No'}`);
    console.log('');

    // 2. Obtener clientes corporativos de esta empresa
    console.log('2. 🏢 CLIENTES CORPORATIVOS:');
    const { data: corporateClients, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*')
      .eq('company_id', mainCompany.id);

    if (corporateError) {
      console.error('❌ Error al obtener clientes corporativos:', corporateError);
      return;
    }

    console.log(`✅ Se encontraron ${corporateClients.length} clientes corporativos:`);
    corporateClients.forEach(client => {
      console.log(`   - ID: ${client.id}`);
      console.log(`     Nombre: ${client.company_name || client.contact_email}`);
      console.log(`     Email: ${client.contact_email}`);
      console.log(`     Activo: ${client.is_active ? 'Sí' : 'No'}`);
    });
    console.log('');

    // 3. Obtener clientes individuales asociados a estos clientes corporativos
    console.log('3. 👥 CLIENTES INDIVIDUALES:');
    if (corporateClients.length > 0) {
      const corporateClientIds = corporateClients.map(client => client.id);
      
      const { data: individualClients, error: individualError } = await supabase
        .from('clients')
        .select('*')
        .in('corporate_client_id', corporateClientIds);

      if (individualError) {
        console.error('❌ Error al obtener clientes individuales:', individualError);
        return;
      }

      console.log(`✅ Se encontraron ${individualClients.length} clientes individuales:`);
      individualClients.forEach(client => {
        const corporateClient = corporateClients.find(cc => cc.id === client.corporate_client_id);
        console.log(`   - ID: ${client.id}`);
        console.log(`     Nombre: ${client.business_name || 'Sin nombre'}`);
        console.log(`     RUT: ${client.rut || 'Sin RUT'}`);
        console.log(`     Email: ${client.contact_email || 'Sin email'}`);
        console.log(`     Cliente Corporativo: ${corporateClient?.contact_email || 'No encontrado'}`);
        console.log(`     Creado: ${client.created_at}`);
      });
    } else {
      console.log('❌ No hay clientes corporativos, por lo tanto no se pueden buscar clientes individuales');
    }
    console.log('');

    // 4. Verificar específicamente a María Concha
    console.log('4. 🔎 BÚSQUEDA ESPECÍFICA DE MARÍA CONCHA:');
    const { data: mariaSearch, error: mariaError } = await supabase
      .from('clients')
      .select('*')
      .eq('rut', '16610128-k');

    if (mariaError) {
      console.error('❌ Error al buscar a María Concha:', mariaError);
    } else {
      if (mariaSearch.length > 0) {
        console.log('✅ María Concha encontrada en la tabla clients:');
        const maria = mariaSearch[0];
        console.log(`   ID: ${maria.id}`);
        console.log(`   Nombre: ${maria.business_name || 'Sin nombre'}`);
        console.log(`   RUT: ${maria.rut}`);
        console.log(`   Email: ${maria.contact_email || 'Sin email'}`);
        console.log(`   Cliente Corporativo ID: ${maria.corporate_client_id}`);
        
        // Buscar el nombre del cliente corporativo asociado
        if (maria.corporate_client_id) {
          const { data: associatedCorporate } = await supabase
            .from('corporate_clients')
            .select('contact_email, company_name')
            .eq('id', maria.corporate_client_id)
            .single();
          
          if (associatedCorporate) {
            console.log(`   Cliente Corporativo: ${associatedCorporate.company_name || associatedCorporate.contact_email}`);
          }
        }
      } else {
        console.log('❌ María Concha NO encontrada en la tabla clients');
      }
    }
    console.log('');

    // 5. Verificar deudas para ver si hay datos allí
    console.log('5. 💰 DEUDAS DE LA EMPRESA:');
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .eq('company_id', mainCompany.id);

    if (debtsError) {
      console.error('❌ Error al obtener deudas:', debtsError);
    } else {
      console.log(`✅ Se encontraron ${debts.length} deudas:`);
      debts.forEach(debt => {
        console.log(`   - ID: ${debt.id}`);
        console.log(`     Deudor: ${debt.name}`);
        console.log(`     RUT: ${debt.rut}`);
        console.log(`     Monto: $${debt.amount}`);
        console.log(`     Client ID: ${debt.client_id || 'NULL'}`);
      });
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkCurrentClientsStatus();