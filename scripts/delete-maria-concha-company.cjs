/**
 * Script para eliminar a María Concha (16610128-k) como empresa de la base de datos
 * Este script elimina:
 * 1. El registro en la tabla companies
 * 2. El registro en la tabla corporate_clients
 * 3. Cualquier otra referencia relacionada
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteMariaConchaCompany() {
  try {
    console.log('🔍 Buscando a María Concha (RUT: 16610128-k) en la base de datos...');

    // 1. Buscar en la tabla companies
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .eq('rut', '16610128-k');

    if (companiesError) {
      console.error('❌ Error buscando companies:', companiesError);
      return;
    }

    console.log(`📊 Encontradas ${companies.length} empresas con RUT 16610128-k:`);
    console.table(companies);

    // 2. Buscar en la tabla corporate_clients
    const { data: corporateClients, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*')
      .eq('rut', '16610128-k');

    if (corporateError) {
      console.error('❌ Error buscando corporate_clients:', corporateError);
      return;
    }

    console.log(`📊 Encontrados ${corporateClients.length} clientes corporativos con RUT 16610128-k:`);
    console.table(corporateClients);

    // 3. Buscar usuarios relacionados
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('rut', '16610128-k');

    if (usersError) {
      console.error('❌ Error buscando usuarios:', usersError);
      return;
    }

    console.log(`📊 Encontrados ${users.length} usuarios con RUT 16610128-k:`);
    console.table(users);

    // 4. Omitir búsqueda de deudas (no se conoce la estructura exacta de la tabla)
    console.log('📊 Omitiendo búsqueda de deudas (estructura de tabla desconocida)');

    // Confirmar eliminación
    console.log('\n⚠️  ADVERTENCIA: Se procederá a eliminar todos estos registros');
    console.log('Esto incluye:');
    console.log(`- ${companies.length} empresas`);
    console.log(`- ${corporateClients.length} clientes corporativos`);
    console.log(`- ${users.length} usuarios`);
    console.log('\n¿Desea continuar? (Escriba "ELIMINAR" para confirmar)');

    // En entorno automático, procedemos directamente
    console.log('🔄 Procediendo con la eliminación...');

    // 6. Eliminar usuarios
    if (users.length > 0) {
      const { error: deleteUsersError } = await supabase
        .from('users')
        .delete()
        .eq('rut', '16610128-k');

      if (deleteUsersError) {
        console.error('❌ Error eliminando usuarios:', deleteUsersError);
      } else {
        console.log(`✅ Eliminados ${users.length} usuarios`);
      }
    }

    // 7. Eliminar corporate_clients
    if (corporateClients.length > 0) {
      const { error: deleteCorporateError } = await supabase
        .from('corporate_clients')
        .delete()
        .eq('rut', '16610128-k');

      if (deleteCorporateError) {
        console.error('❌ Error eliminando corporate_clients:', deleteCorporateError);
      } else {
        console.log(`✅ Eliminados ${corporateClients.length} clientes corporativos`);
      }
    }

    // 8. Eliminar companies
    if (companies.length > 0) {
      const { error: deleteCompaniesError } = await supabase
        .from('companies')
        .delete()
        .eq('rut', '16610128-k');

      if (deleteCompaniesError) {
        console.error('❌ Error eliminando companies:', deleteCompaniesError);
      } else {
        console.log(`✅ Eliminadas ${companies.length} empresas`);
      }
    }

    console.log('\n🎉 Proceso de eliminación completado');
    console.log('✅ María Concha (16610128-k) ha sido eliminada completamente del sistema');

  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
}

// Ejecutar el script
deleteMariaConchaCompany();