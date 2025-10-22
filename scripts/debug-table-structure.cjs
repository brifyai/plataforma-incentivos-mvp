const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase (desde .env)
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTableStructure() {
  console.log('🔍 INVESTIGANDO ESTRUCTURA DE TABLAS');
  console.log('='.repeat(50));

  try {
    // 1. Verificar todas las tablas que contienen "user" o "company"
    console.log('\n1️⃣ Buscando tablas relacionadas con usuarios y empresas...');
    
    // Listar tablas principales
    const tables = [
      'users',
      'companies', 
      'user_profiles',
      'company_users',
      'user_companies',
      'employees',
      'staff'
    ];

    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ Tabla ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ Tabla ${tableName}: existe con ${data ? data.length : 0} registros`);
          if (data && data.length > 0) {
            console.log(`   Columnas: ${Object.keys(data[0]).join(', ')}`);
          }
        }
      } catch (err) {
        console.log(`❌ Tabla ${tableName}: error fatal - ${err.message}`);
      }
    }

    // 2. Verificar directamente en companies si hay campo user_id
    console.log('\n2️⃣ Verificando estructura de tabla companies...');
    try {
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .limit(3);

      if (companiesError) {
        console.log('❌ Error en companies:', companiesError.message);
      } else {
        console.log('✅ Tabla companies encontrada');
        if (companiesData && companiesData.length > 0) {
          console.log('Columnas:', Object.keys(companiesData[0]));
          companiesData.forEach(company => {
            console.log(`   - ${company.company_name} (ID: ${company.id})`);
            if (company.user_id) {
              console.log(`     → user_id: ${company.user_id}`);
            }
          });
        }
      }
    } catch (err) {
      console.log('❌ Error fatal en companies:', err.message);
    }

    // 3. Verificar usuario empresa@nexupay.cl y sus posibles empresas
    console.log('\n3️⃣ Buscando empresas para usuario empresa@nexupay.cl...');
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'empresa@nexupay.cl')
        .single();

      if (userError) {
        console.log('❌ Error obteniendo usuario:', userError.message);
        return;
      }

      console.log(`✅ Usuario encontrado: ${userData.id}`);

      // Buscar empresas donde user_id coincida
      const { data: userCompanies, error: userCompaniesError } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', userData.id);

      if (userCompaniesError) {
        console.log('❌ Error buscando empresas del usuario:', userCompaniesError.message);
      } else {
        console.log(`✅ Encontradas ${userCompanies.length} empresas para este usuario:`);
        userCompanies.forEach(company => {
          console.log(`   - ${company.company_name} (ID: ${company.id})`);
          console.log(`     Estado: ${company.validation_status || 'sin estado'}`);
        });
      }

      // Si no hay empresas, buscar todas las empresas para ver si hay alguna relación
      if (userCompanies.length === 0) {
        console.log('\n🔍 Buscando todas las empresas para encontrar relación...');
        const { data: allCompanies, error: allCompaniesError } = await supabase
          .from('companies')
          .select('*')
          .limit(10);

        if (allCompaniesError) {
          console.log('❌ Error obteniendo todas las empresas:', allCompaniesError.message);
        } else {
          console.log('Todas las empresas encontradas:');
          allCompanies.forEach(company => {
            console.log(`   - ${company.company_name} (ID: ${company.id})`);
            if (company.user_id) {
              console.log(`     → user_id: ${company.user_id} ${company.user_id === userData.id ? '✅ COINCIDE' : '❌ no coincide'}`);
            }
          });
        }
      }

    } catch (err) {
      console.log('❌ Error fatal buscando usuario:', err.message);
    }

    // 4. Verificar clientes corporativos
    console.log('\n4️⃣ Verificando clientes corporativos...');
    try {
      const { data: corporateClients, error: corporateError } = await supabase
        .from('corporate_clients')
        .select('*')
        .limit(5);

      if (corporateError) {
        console.log('❌ Error en corporate_clients:', corporateError.message);
      } else {
        console.log(`✅ Encontrados ${corporateClients.length} clientes corporativos:`);
        corporateClients.forEach(client => {
          console.log(`   - ${client.business_name} (ID: ${client.id})`);
          console.log(`     → company_id: ${client.company_id}`);
        });
      }
    } catch (err) {
      console.log('❌ Error fatal en corporate_clients:', err.message);
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

debugTableStructure();