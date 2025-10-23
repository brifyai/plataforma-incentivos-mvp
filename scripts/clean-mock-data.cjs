/**
 * Script para limpiar datos mock de la base de datos
 * 
 * Este script elimina todos los datos de prueba/mock que interfieren
 * con los datos reales de la aplicación.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas');
  console.error('   Asegúrate de tener VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Función principal para limpiar datos mock
 */
async function cleanMockData() {
  console.log('🧹 Iniciando limpieza de datos mock de la base de datos...\n');

  try {
    // 1. Eliminar usuario admin con datos de prueba
    await cleanAdminUser();
    
    // 2. Eliminar cliente corporativo "prueba"
    await cleanMockCorporateClient();
    
    // 3. Eliminar cliente "Juan Pérez Prueba"
    await cleanMockClient();
    
    // 4. Eliminar deuda "testing"
    await cleanMockDebt();
    
    console.log('\n✅ Limpieza de datos mock completada exitosamente');
    
  } catch (error) {
    console.error('\n❌ Error durante la limpieza:', error);
    process.exit(1);
  }
}

/**
 * Eliminar usuario admin con datos de prueba
 */
async function cleanAdminUser() {
  console.log('🔍 Buscando usuario admin con datos de prueba...');
  
  try {
    // Buscar usuarios con email de admin o datos de prueba
    const { data: adminUsers, error } = await supabase
      .from('users')
      .select('*')
      .or('email.eq.admin@test.com,email.eq.admin@prueba.cl,full_name.ilike.%admin%,rut.ilike.%ADMIN%');
    
    if (error) {
      console.warn('⚠️ Error buscando usuarios admin:', error.message);
      return;
    }
    
    if (adminUsers && adminUsers.length > 0) {
      console.log(`📋 Encontrados ${adminUsers.length} usuarios admin de prueba:`);
      
      for (const user of adminUsers) {
        console.log(`   - ID: ${user.id}, Email: ${user.email}, Nombre: ${user.full_name}`);
        
        // Eliminar registros relacionados en companies si es empresa
        if (user.role === 'company') {
          const { error: companyError } = await supabase
            .from('companies')
            .delete()
            .eq('user_id', user.id);
          
          if (companyError) {
            console.warn(`⚠️ Error eliminando empresa del usuario ${user.id}:`, companyError.message);
          } else {
            console.log(`   ✅ Empresa eliminada para usuario ${user.id}`);
          }
        }
        
        // Eliminar el usuario
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', user.id);
        
        if (deleteError) {
          console.warn(`⚠️ Error eliminando usuario ${user.id}:`, deleteError.message);
        } else {
          console.log(`   ✅ Usuario ${user.id} eliminado`);
        }
      }
    } else {
      console.log('   ℹ️ No se encontraron usuarios admin de prueba');
    }
    
  } catch (error) {
    console.error('❌ Error en cleanAdminUser:', error);
  }
}

/**
 * Eliminar cliente corporativo "prueba"
 */
async function cleanMockCorporateClient() {
  console.log('\n🏢 Buscando clientes corporativos de prueba...');
  
  try {
    // Buscar clientes corporativos con datos de prueba
    const { data: corporateClients, error } = await supabase
      .from('corporate_clients')
      .select('*')
      .or('name.ilike.%prueba%,name.ilike.%test%,name.ilike.%demo%,email.ilike.%prueba%,email.ilike.%test%');
    
    if (error) {
      console.warn('⚠️ Error buscando clientes corporativos:', error.message);
      return;
    }
    
    if (corporateClients && corporateClients.length > 0) {
      console.log(`📋 Encontrados ${corporateClients.length} clientes corporativos de prueba:`);
      
      for (const client of corporateClients) {
        console.log(`   - ID: ${client.id}, Nombre: ${client.name}, Email: ${client.email}`);
        
        // Eliminar clientes individuales asociados
        const { error: clientsError } = await supabase
          .from('clients')
          .delete()
          .eq('corporate_client_id', client.id);
        
        if (clientsError) {
          console.warn(`⚠️ Error eliminando clientes asociados a ${client.id}:`, clientsError.message);
        } else {
          console.log(`   ✅ Clientes asociados eliminados para ${client.id}`);
        }
        
        // Eliminar el cliente corporativo
        const { error: deleteError } = await supabase
          .from('corporate_clients')
          .delete()
          .eq('id', client.id);
        
        if (deleteError) {
          console.warn(`⚠️ Error eliminando cliente corporativo ${client.id}:`, deleteError.message);
        } else {
          console.log(`   ✅ Cliente corporativo ${client.id} eliminado`);
        }
      }
    } else {
      console.log('   ℹ️ No se encontraron clientes corporativos de prueba');
    }
    
  } catch (error) {
    console.error('❌ Error en cleanMockCorporateClient:', error);
  }
}

/**
 * Eliminar cliente "Juan Pérez Prueba"
 */
async function cleanMockClient() {
  console.log('\n👤 Buscando clientes individuales de prueba...');
  
  try {
    // Buscar clientes con datos de prueba
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .or('name.ilike.%juan pérez%,name.ilike.%prueba%,name.ilike.%test%,email.ilike.%prueba%,email.ilike.%test%,rut.ilike.%prueba%');
    
    if (error) {
      console.warn('⚠️ Error buscando clientes:', error.message);
      return;
    }
    
    if (clients && clients.length > 0) {
      console.log(`📋 Encontrados ${clients.length} clientes de prueba:`);
      
      for (const client of clients) {
        console.log(`   - ID: ${client.id}, Nombre: ${client.name}, Email: ${client.email}`);
        
        // Eliminar deudas asociadas
        const { error: debtsError } = await supabase
          .from('debts')
          .delete()
          .eq('client_id', client.id);
        
        if (debtsError) {
          console.warn(`⚠️ Error eliminando deudas del cliente ${client.id}:`, debtsError.message);
        } else {
          console.log(`   ✅ Deudas eliminadas para cliente ${client.id}`);
        }
        
        // Eliminar el cliente
        const { error: deleteError } = await supabase
          .from('clients')
          .delete()
          .eq('id', client.id);
        
        if (deleteError) {
          console.warn(`⚠️ Error eliminando cliente ${client.id}:`, deleteError.message);
        } else {
          console.log(`   ✅ Cliente ${client.id} eliminado`);
        }
      }
    } else {
      console.log('   ℹ️ No se encontraron clientes de prueba');
    }
    
  } catch (error) {
    console.error('❌ Error en cleanMockClient:', error);
  }
}

/**
 * Eliminar deuda "testing"
 */
async function cleanMockDebt() {
  console.log('\n💰 Buscando deudas de prueba...');
  
  try {
    // Buscar deudas con datos de prueba
    const { data: debts, error } = await supabase
      .from('debts')
      .select('*')
      .or('description.ilike.%testing%,description.ilike.%prueba%,description.ilike.%test%,reference.ilike.%test%,reference.ilike.%prueba%');
    
    if (error) {
      console.warn('⚠️ Error buscando deudas:', error.message);
      return;
    }
    
    if (debts && debts.length > 0) {
      console.log(`📋 Encontradas ${debts.length} deudas de prueba:`);
      
      for (const debt of debts) {
        console.log(`   - ID: ${debt.id}, Referencia: ${debt.reference}, Descripción: ${debt.description}`);
        
        // Eliminar pagos asociados
        const { error: paymentsError } = await supabase
          .from('payments')
          .delete()
          .eq('debt_id', debt.id);
        
        if (paymentsError) {
          console.warn(`⚠️ Error eliminando pagos de la deuda ${debt.id}:`, paymentsError.message);
        } else {
          console.log(`   ✅ Pagos eliminados para deuda ${debt.id}`);
        }
        
        // Eliminar la deuda
        const { error: deleteError } = await supabase
          .from('debts')
          .delete()
          .eq('id', debt.id);
        
        if (deleteError) {
          console.warn(`⚠️ Error eliminando deuda ${debt.id}:`, deleteError.message);
        } else {
          console.log(`   ✅ Deuda ${debt.id} eliminada`);
        }
      }
    } else {
      console.log('   ℹ️ No se encontraron deudas de prueba');
    }
    
  } catch (error) {
    console.error('❌ Error en cleanMockDebt:', error);
  }
}

/**
 * Verificar estado final de la base de datos
 */
async function verifyCleanup() {
  console.log('\n🔍 Verificando estado final de la base de datos...');
  
  try {
    // Verificar usuarios
    const { data: users } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .limit(10);
    
    console.log(`📊 Usuarios en BD: ${users?.length || 0}`);
    users?.forEach(user => {
      console.log(`   - ${user.full_name} (${user.email}) - ${user.role}`);
    });
    
    // Verificar clientes corporativos
    const { data: corporateClients } = await supabase
      .from('corporate_clients')
      .select('id, name')
      .limit(10);
    
    console.log(`📊 Clientes corporativos en BD: ${corporateClients?.length || 0}`);
    corporateClients?.forEach(client => {
      console.log(`   - ${client.name}`);
    });
    
    // Verificar clientes individuales
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name')
      .limit(10);
    
    console.log(`📊 Clientes individuales en BD: ${clients?.length || 0}`);
    clients?.forEach(client => {
      console.log(`   - ${client.name}`);
    });
    
    // Verificar deudas
    const { data: debts } = await supabase
      .from('debts')
      .select('id, reference, description')
      .limit(10);
    
    console.log(`📊 Deudas en BD: ${debts?.length || 0}`);
    debts?.forEach(debt => {
      console.log(`   - ${debt.reference}: ${debt.description}`);
    });
    
  } catch (error) {
    console.warn('⚠️ Error en verificación:', error.message);
  }
}

// Ejecutar el script
async function main() {
  await cleanMockData();
  await verifyCleanup();
  
  console.log('\n🎉 Script de limpieza completado');
  console.log('💡 La aplicación ahora debería funcionar solo con datos reales');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  cleanMockData,
  cleanAdminUser,
  cleanMockCorporateClient,
  cleanMockClient,
  cleanMockDebt,
  verifyCleanup
};