const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyMariaCleanup() {
  console.log('🔍 Verificando que no queden datos de "María Concha"...\n');

  try {
    const searchTerms = ['maria', 'maría', 'concha', 'Maria', 'María', 'Concha'];
    
    // 1. Verificar en companies
    console.log('📋 Verificando tabla companies...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*');

    if (companiesError) {
      console.error('❌ Error en companies:', companiesError);
    } else {
      const found = companies.filter(company => 
        searchTerms.some(term => 
          company.company_name?.toLowerCase().includes(term.toLowerCase()) ||
          company.contact_email?.toLowerCase().includes(term.toLowerCase()) ||
          company.rut?.toLowerCase().includes(term.toLowerCase())
        )
      );
      
      if (found.length > 0) {
        console.log('❌ Found in companies:', found);
      } else {
        console.log('✅ No se encontraron datos de María Concha en companies');
      }
    }

    // 2. Verificar en corporate_clients
    console.log('\n📋 Verificando tabla corporate_clients...');
    const { data: corporateClients, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*');

    if (corporateError) {
      console.error('❌ Error en corporate_clients:', corporateError);
    } else {
      const found = corporateClients.filter(client => 
        searchTerms.some(term => 
          client.contact_email?.toLowerCase().includes(term.toLowerCase()) ||
          client.contact_phone?.toLowerCase().includes(term.toLowerCase()) ||
          client.rut?.toLowerCase().includes(term.toLowerCase()) ||
          client.industry?.toLowerCase().includes(term.toLowerCase())
        )
      );
      
      if (found.length > 0) {
        console.log('❌ Found in corporate_clients:', found);
      } else {
        console.log('✅ No se encontraron datos de María Concha en corporate_clients');
      }
    }

    // 3. Verificar en clients
    console.log('\n📋 Verificando tabla clients...');
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*');

    if (clientsError) {
      console.error('❌ Error en clients:', clientsError);
    } else {
      const found = clients.filter(client => 
        searchTerms.some(term => 
          client.business_name?.toLowerCase().includes(term.toLowerCase()) ||
          client.contact_email?.toLowerCase().includes(term.toLowerCase()) ||
          client.contact_phone?.toLowerCase().includes(term.toLowerCase()) ||
          client.rut?.toLowerCase().includes(term.toLowerCase())
        )
      );
      
      if (found.length > 0) {
        console.log('❌ Found in clients:', found);
      } else {
        console.log('✅ No se encontraron datos de María Concha en clients');
      }
    }

    // 4. Verificar en debts
    console.log('\n📋 Verificando tabla debts...');
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('*');

    if (debtsError) {
      console.error('❌ Error en debts:', debtsError);
    } else {
      const found = debts.filter(debt => 
        searchTerms.some(term => 
          debt.description?.toLowerCase().includes(term.toLowerCase())
        )
      );
      
      if (found.length > 0) {
        console.log('❌ Found in debts:', found);
      } else {
        console.log('✅ No se encontraron datos de María Concha en debts');
      }
    }

    // 5. Verificar en users
    console.log('\n📋 Verificando tabla users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) {
      console.error('❌ Error en users:', usersError);
    } else {
      const found = users.filter(user => 
        searchTerms.some(term => 
          user.full_name?.toLowerCase().includes(term.toLowerCase()) ||
          user.email?.toLowerCase().includes(term.toLowerCase()) ||
          user.rut?.toLowerCase().includes(term.toLowerCase())
        )
      );
      
      if (found.length > 0) {
        console.log('❌ Found in users:', found);
      } else {
        console.log('✅ No se encontraron datos de María Concha en users');
      }
    }

    console.log('\n✅ ¡Verificación completada!');
    console.log('📝 Si no se encontraron datos en ninguna tabla, la limpieza fue exitosa.');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  }
}

verifyMariaCleanup();