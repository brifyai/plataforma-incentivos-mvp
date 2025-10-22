const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCompaniesStructure() {
  console.log('🔍 Verificando estructura de la tabla companies\n');

  try {
    // 1. Obtener todas las empresas para ver la estructura
    console.log('1. 📋 TODAS LAS EMPRESAS:');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*');

    if (companiesError) {
      console.error('❌ Error al obtener empresas:', companiesError);
      return;
    }

    console.log(`✅ Se encontraron ${companies.length} empresas:`);
    if (companies.length > 0) {
      // Mostrar columnas disponibles
      const columns = Object.keys(companies[0]);
      console.log('   Columnas disponibles:', columns.join(', '));
      console.log('');
      
      companies.forEach(company => {
        console.log(`   - ID: ${company.id}`);
        console.log(`     Nombre: ${company.business_name || company.name || 'Sin nombre'}`);
        console.log(`     Email: ${company.contact_email || company.email || 'Sin email'}`);
        console.log(`     Validada: ${company.is_validated ? 'Sí' : 'No'}`);
        console.log('');
      });
    } else {
      console.log('❌ No se encontraron empresas');
    }

    // 2. Buscar empresa por email en users
    console.log('2. 👤 BUSCANDO USUARIO empresa@nexupay.cl:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'empresa@nexupay.cl');

    if (usersError) {
      console.error('❌ Error al buscar usuario:', usersError);
    } else {
      if (users.length > 0) {
        console.log('✅ Usuario encontrado:');
        const user = users[0];
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Company ID: ${user.company_id || 'NULL'}`);
        
        // Si tiene company_id, buscar la empresa asociada
        if (user.company_id) {
          const { data: userCompany } = await supabase
            .from('companies')
            .select('*')
            .eq('id', user.company_id)
            .single();
          
          if (userCompany) {
            console.log(`   Empresa asociada: ${userCompany.business_name || userCompany.name || 'Sin nombre'}`);
          }
        }
      } else {
        console.log('❌ Usuario empresa@nexupay.cl NO encontrado');
      }
    }
    console.log('');

    // 3. Verificar clientes corporativos
    console.log('3. 🏢 CLIENTES CORPORATIVOS:');
    const { data: corporateClients, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*');

    if (corporateError) {
      console.error('❌ Error al obtener clientes corporativos:', corporateError);
    } else {
      console.log(`✅ Se encontraron ${corporateClients.length} clientes corporativos:`);
      corporateClients.forEach(client => {
        console.log(`   - ID: ${client.id}`);
        console.log(`     Nombre: ${client.company_name || client.contact_email || 'Sin nombre'}`);
        console.log(`     Email: ${client.contact_email || 'Sin email'}`);
        console.log(`     Company ID: ${client.company_id || 'NULL'}`);
        console.log(`     Activo: ${client.is_active ? 'Sí' : 'No'}`);
      });
    }
    console.log('');

    // 4. Verificar clientes individuales
    console.log('4. 👥 CLIENTES INDIVIDUALES:');
    const { data: individualClients, error: individualError } = await supabase
      .from('clients')
      .select('*');

    if (individualError) {
      console.error('❌ Error al obtener clientes individuales:', individualError);
    } else {
      console.log(`✅ Se encontraron ${individualClients.length} clientes individuales:`);
      individualClients.forEach(client => {
        console.log(`   - ID: ${client.id}`);
        console.log(`     Nombre: ${client.business_name || 'Sin nombre'}`);
        console.log(`     RUT: ${client.rut || 'Sin RUT'}`);
        console.log(`     Email: ${client.contact_email || 'Sin email'}`);
        console.log(`     Corporate Client ID: ${client.corporate_client_id || 'NULL'}`);
      });
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkCompaniesStructure();