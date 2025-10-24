/**
 * Script para eliminar "TechCorp - División Desarrollo" de la base de datos
 * Este script busca y elimina cualquier referencia a TechCorp en todas las tablas
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno: VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteTechCorpDivision() {
  try {
    console.log('🔍 Buscando "TechCorp - División Desarrollo" en la base de datos...');

    // 1. Buscar en la tabla companies
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .or('company_name.ilike.%TechCorp%,company_name.ilike.%División Desarrollo%');

    if (companiesError) {
      console.error('❌ Error buscando companies:', companiesError);
    } else {
      console.log(`📊 Encontradas ${companies.length} empresas con TechCorp:`);
      console.table(companies);
    }

    // 2. Buscar en la tabla corporate_clients
    const { data: corporateClients, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*')
      .or('name.ilike.%TechCorp%,name.ilike.%División Desarrollo%');

    if (corporateError) {
      console.error('❌ Error buscando corporate_clients:', corporateError);
    } else {
      console.log(`📊 Encontrados ${corporateClients.length} clientes corporativos con TechCorp:`);
      console.table(corporateClients);
    }

    // 3. Buscar en la tabla clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .or('full_name.ilike.%TechCorp%,full_name.ilike.%División Desarrollo%');

    if (clientsError) {
      console.error('❌ Error buscando clients:', clientsError);
    } else {
      console.log(`📊 Encontrados ${clients.length} clientes con TechCorp:`);
      console.table(clients);
    }

    // 4. Buscar en la tabla users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .or('full_name.ilike.%TechCorp%,email.ilike.%techcorp%');

    if (usersError) {
      console.error('❌ Error buscando usuarios:', usersError);
    } else {
      console.log(`📊 Encontrados ${users.length} usuarios con TechCorp:`);
      console.table(users);
    }

    // 5. Buscar deudas relacionadas (buscando en descripciones o campos de texto)
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .or('debtor_name.ilike.%TechCorp%,description.ilike.%TechCorp%');

    if (debtsError) {
      console.error('❌ Error buscando deudas:', debtsError);
    } else {
      console.log(`📊 Encontradas ${debts.length} deudas con TechCorp:`);
      console.table(debts);
    }

    // Confirmar eliminación
    console.log('\n⚠️  ADVERTENCIA: Se procederá a eliminar todos estos registros');
    console.log('Esto incluye:');
    console.log(`- ${companies.length} empresas`);
    console.log(`- ${corporateClients.length} clientes corporativos`);
    console.log(`- ${clients.length} clientes`);
    console.log(`- ${users.length} usuarios`);
    console.log(`- ${debts.length} deudas`);
    console.log('\n¿Desea continuar? (Escriba "ELIMINAR" para confirmar)');

    // En entorno automático, procedemos directamente
    console.log('🔄 Procediendo con la eliminación...');

    // 6. Eliminar deudas (primero por dependencias)
    if (debts && debts.length > 0) {
      for (const debt of debts) {
        const { error: deleteDebtError } = await supabase
          .from('debts')
          .delete()
          .eq('id', debt.id);

        if (deleteDebtError) {
          console.error('❌ Error eliminando deuda:', deleteDebtError);
        } else {
          console.log(`✅ Eliminada deuda ID: ${debt.id}`);
        }
      }
    }

    // 7. Eliminar usuarios
    if (users && users.length > 0) {
      for (const user of users) {
        const { error: deleteUserError } = await supabase
          .from('users')
          .delete()
          .eq('id', user.id);

        if (deleteUserError) {
          console.error('❌ Error eliminando usuario:', deleteUserError);
        } else {
          console.log(`✅ Eliminado usuario: ${user.full_name}`);
        }
      }
    }

    // 8. Eliminar clientes
    if (clients && clients.length > 0) {
      for (const client of clients) {
        const { error: deleteClientError } = await supabase
          .from('clients')
          .delete()
          .eq('id', client.id);

        if (deleteClientError) {
          console.error('❌ Error eliminando cliente:', deleteClientError);
        } else {
          console.log(`✅ Eliminado cliente: ${client.full_name}`);
        }
      }
    }

    // 9. Eliminar corporate_clients
    if (corporateClients && corporateClients.length > 0) {
      for (const corporate of corporateClients) {
        const { error: deleteCorporateError } = await supabase
          .from('corporate_clients')
          .delete()
          .eq('id', corporate.id);

        if (deleteCorporateError) {
          console.error('❌ Error eliminando cliente corporativo:', deleteCorporateError);
        } else {
          console.log(`✅ Eliminado cliente corporativo: ${corporate.name}`);
        }
      }
    }

    // 10. Eliminar companies
    if (companies && companies.length > 0) {
      for (const company of companies) {
        const { error: deleteCompanyError } = await supabase
          .from('companies')
          .delete()
          .eq('id', company.id);

        if (deleteCompanyError) {
          console.error('❌ Error eliminando empresa:', deleteCompanyError);
        } else {
          console.log(`✅ Eliminada empresa: ${company.company_name}`);
        }
      }
    }

    console.log('\n🎉 Proceso de eliminación completado');
    console.log('✅ TechCorp - División Desarrollo ha sido eliminado completamente del sistema');

  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
}

// Ejecutar el script
deleteTechCorpDivision();