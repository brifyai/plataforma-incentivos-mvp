/**
 * Script simple para crear clientes corporativos de prueba
 * 
 * Este script crea clientes corporativos directamente usando fetch API
 * para no depender de los módulos de la aplicación.
 */

// Cargar variables de entorno desde .env
import { config } from 'dotenv';
config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY son requeridas');
  process.exit(1);
}

// Función helper para hacer peticiones a Supabase
async function supabaseRequest(table, method = 'GET', data = null, filters = {}) {
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
  
  // Agregar filtros como query params
  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      url.searchParams.append(key, `(${value.join(',')})`);
    } else {
      url.searchParams.append(key, value);
    }
  });

  const options = {
    method,
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  };

  if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url.toString(), options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    if (method === 'DELETE') {
      return null; // DELETE no retorna contenido
    }

    return await response.json();
  } catch (error) {
    console.error(`Error en ${method} ${table}:`, error);
    throw error;
  }
}

async function checkAndCreateCorporateClients() {
  console.log('🔍 Verificando clientes corporativos en la base de datos...');

  try {
    // 1. Verificar si hay empresas en la base de datos
    console.log('📋 Obteniendo empresas disponibles...');
    const companies = await supabaseRequest('companies', 'GET');
    
    if (!companies || companies.length === 0) {
      console.log('⚠️ No hay empresas en la base de datos. No se pueden crear clientes corporativos.');
      return;
    }

    console.log(`✅ Se encontraron ${companies.length} empresas:`);
    companies.forEach(company => {
      console.log(`   - ${company.business_name} (${company.id})`);
    });

    // 2. Para cada empresa, verificar si tiene clientes corporativos
    for (const company of companies) {
      console.log(`\n🔍 Verificando clientes corporativos para: ${company.business_name}`);
      
      // Intentar obtener de corporate_clients primero
      let corporateClients = [];
      let hasCorporateClientsTable = true;
      
      try {
        corporateClients = await supabaseRequest('corporate_clients', 'GET', null, {
          'company_id': `eq.${company.id}`,
          'is_active': 'eq.true'
        });
        console.log(`✅ Se encontraron ${corporateClients?.length || 0} clientes corporativos en corporate_clients`);
      } catch (error) {
        console.log(`⚠️ Tabla corporate_clients no disponible: ${error.message}`);
        hasCorporateClientsTable = false;
        
        // Intentar con la tabla clients como fallback
        try {
          const clients = await supabaseRequest('clients', 'GET', null, {
            'company_id': `eq.${company.id}`
          });
          
          if (clients && clients.length > 0) {
            console.log(`✅ Se encontraron ${clients.length} clientes en la tabla clients (fallback)`);
            continue; // Pasar a la siguiente empresa
          }
        } catch (fallbackError) {
          console.log(`⚠️ Tabla clients tampoco disponible: ${fallbackError.message}`);
        }
      }

      if (corporateClients && corporateClients.length > 0) {
        continue; // Pasar a la siguiente empresa
      }

      // 3. Si no hay clientes corporativos, crear algunos de prueba
      console.log(`📝 Creando clientes corporativos de prueba para ${company.business_name}...`);

      const sampleClients = [
        {
          company_id: company.id,
          name: 'Retail Solutions S.A.',
          business_name: 'Retail Solutions S.A.',
          rut: '76.123.456-7',
          contact_email: 'contacto@retailsolutions.cl',
          contact_phone: '+56223456789',
          industry: 'Retail',
          contract_value: 50000000,
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          company_id: company.id,
          name: 'Servicios Financieros Ltda.',
          business_name: 'Servicios Financieros Ltda.',
          rut: '77.234.567-8',
          contact_email: 'admin@serviciosfinancieros.cl',
          contact_phone: '+56987654321',
          industry: 'Finanzas',
          contract_value: 75000000,
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          company_id: company.id,
          name: 'Constructora del Norte S.A.',
          business_name: 'Constructora del Norte S.A.',
          rut: '78.345.678-9',
          contact_email: 'gerencia@constructoranorte.cl',
          contact_phone: '+56234567890',
          industry: 'Construcción',
          contract_value: 100000000,
          is_active: true,
          created_at: new Date().toISOString()
        }
      ];

      // Intentar insertar en corporate_clients primero
      if (hasCorporateClientsTable) {
        console.log('💾 Insertando en tabla corporate_clients...');
        try {
          const insertedClients = await supabaseRequest('corporate_clients', 'POST', sampleClients);
          console.log(`✅ Se crearon ${insertedClients?.length || 0} clientes corporativos en tabla corporate_clients`);
        } catch (insertError) {
          console.error('❌ Error insertando en corporate_clients:', insertError.message);
          console.log('🔄 Intentando insertar en tabla clients como fallback...');
          
          // Fallback: insertar en tabla clients
          try {
            const fallbackClients = await supabaseRequest('clients', 'POST', sampleClients);
            console.log(`✅ Se crearon ${fallbackClients?.length || 0} clientes corporativos en tabla clients (fallback)`);
          } catch (fallbackError) {
            console.error('❌ Error insertando en clients también:', fallbackError.message);
          }
        }
      } else {
        // Insertar directamente en tabla clients
        console.log('💾 Insertando en tabla clients...');
        try {
          const insertedClients = await supabaseRequest('clients', 'POST', sampleClients);
          console.log(`✅ Se crearon ${insertedClients?.length || 0} clientes corporativos en tabla clients`);
        } catch (insertError) {
          console.error('❌ Error insertando en clients:', insertError.message);
        }
      }
    }

    console.log('\n🎉 Proceso completado. Ahora deberías poder ver los clientes corporativos en la Importación Masiva de Deudas.');
    console.log('\n📝 Instrucciones:');
    console.log('1. Ve a http://localhost:3002/empresa/importacion-deudas');
    console.log('2. Deberías ver los clientes corporativos en el selector');
    console.log('3. Selecciona un cliente corporativo');
    console.log('4. Sube un archivo CSV/Excel con los deudores');
    console.log('5. Los deudores serán asignados al cliente corporativo seleccionado');

  } catch (error) {
    console.error('💥 Error en el proceso:', error);
    process.exit(1);
  }
}

// Ejecutar el script
checkAndCreateCorporateClients().then(() => {
  console.log('\n✅ Script finalizado');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});