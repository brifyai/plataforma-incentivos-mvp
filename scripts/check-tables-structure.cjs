require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkTablesStructure() {
  try {
    console.log('🔍 Verificando estructura de tablas principales...\n');

    // 1. Verificar estructura de companies
    console.log('1. 📋 ESTRUCTURA TABLA COMPANIES:');
    try {
      const { data: companiesColumns, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .limit(1);

      if (companiesError) {
        console.error('❌ Error en companies:', companiesError.message);
      } else {
        if (companiesColumns && companiesColumns.length > 0) {
          console.log('   Columnas disponibles:', Object.keys(companiesColumns[0]).join(', '));
        } else {
          console.log('   ⚠️ No hay datos en companies, intentando ver estructura...');
          // Intentar obtener información de la tabla de otra manera
          const { data: companiesInfo, error: infoError } = await supabase
            .rpc('get_table_columns', { table_name: 'companies' });
          
          if (!infoError && companiesInfo) {
            console.log('   Columnas (via RPC):', companiesInfo.map(col => col.column_name).join(', '));
          }
        }
      }
    } catch (error) {
      console.error('💥 Error verificando companies:', error.message);
    }

    // 2. Verificar estructura de corporate_clients
    console.log('\n2. 📋 ESTRUCTURA TABLA CORPORATE_CLIENTS:');
    try {
      const { data: corporateColumns, error: corporateError } = await supabase
        .from('corporate_clients')
        .select('*')
        .limit(1);

      if (corporateError) {
        console.error('❌ Error en corporate_clients:', corporateError.message);
      } else {
        if (corporateColumns && corporateColumns.length > 0) {
          console.log('   Columnas disponibles:', Object.keys(corporateColumns[0]).join(', '));
        } else {
          console.log('   ⚠️ No hay datos en corporate_clients');
        }
      }
    } catch (error) {
      console.error('💥 Error verificando corporate_clients:', error.message);
    }

    // 3. Verificar estructura de clients
    console.log('\n3. 📋 ESTRUCTURA TABLA CLIENTS:');
    try {
      const { data: clientsColumns, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .limit(1);

      if (clientsError) {
        console.error('❌ Error en clients:', clientsError.message);
      } else {
        if (clientsColumns && clientsColumns.length > 0) {
          console.log('   Columnas disponibles:', Object.keys(clientsColumns[0]).join(', '));
        } else {
          console.log('   ⚠️ No hay datos en clients');
        }
      }
    } catch (error) {
      console.error('💥 Error verificando clients:', error.message);
    }

    // 4. Verificar estructura de debts
    console.log('\n4. 📋 ESTRUCTURA TABLA DEBTS:');
    try {
      const { data: debtsColumns, error: debtsError } = await supabase
        .from('debts')
        .select('*')
        .limit(1);

      if (debtsError) {
        console.error('❌ Error en debts:', debtsError.message);
      } else {
        if (debtsColumns && debtsColumns.length > 0) {
          console.log('   Columnas disponibles:', Object.keys(debtsColumns[0]).join(', '));
        } else {
          console.log('   ⚠️ No hay datos en debts');
        }
      }
    } catch (error) {
      console.error('💥 Error verificando debts:', error.message);
    }

    // 5. Verificar datos existentes
    console.log('\n5. 📊 DATOS EXISTENTES:');
    
    try {
      const { data: companies, error: companiesCountError } = await supabase
        .from('companies')
        .select('id, business_name, contact_email, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!companiesCountError && companies) {
        console.log(`   Empresas (${companies.length} más recientes):`);
        companies.forEach(c => {
          console.log(`     - ${c.business_name || 'Sin nombre'} (${c.contact_email || 'Sin email'}) - ID: ${c.id}`);
        });
      }
    } catch (error) {
      console.error('   ❌ Error obteniendo empresas:', error.message);
    }

    try {
      const { data: corporateClients, error: corporateError } = await supabase
        .from('corporate_clients')
        .select('id, contact_email, company_id, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!corporateError && corporateClients) {
        console.log(`\n   Clientes Corporativos (${corporateClients.length} más recientes):`);
        corporateClients.forEach(c => {
          console.log(`     - ${c.contact_email || 'Sin email'} - Company ID: ${c.company_id} - ID: ${c.id}`);
        });
      }
    } catch (error) {
      console.error('   ❌ Error obteniendo clientes corporativos:', error.message);
    }

    try {
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, business_name, corporate_client_id, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!clientsError && clients) {
        console.log(`\n   Clientes Individuales (${clients.length} más recientes):`);
        clients.forEach(c => {
          console.log(`     - ${c.business_name || 'Sin nombre'} - Corporate ID: ${c.corporate_client_id} - ID: ${c.id}`);
        });
      }
    } catch (error) {
      console.error('   ❌ Error obteniendo clientes individuales:', error.message);
    }

    try {
      const { data: debts, error: debtsError } = await supabase
        .from('debts')
        .select('id, user_id, company_id, client_id, current_amount, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!debtsError && debts) {
        console.log(`\n   Deudas (${debts.length} más recientes):`);
        debts.forEach(d => {
          console.log(`     - ID: ${d.id} - User: ${d.user_id} - Company: ${d.company_id} - Client: ${d.client_id || 'N/A'} - Amount: ${d.current_amount}`);
        });
      }
    } catch (error) {
      console.error('   ❌ Error obteniendo deudas:', error.message);
    }

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

checkTablesStructure();