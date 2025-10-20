/**
 * Script para verificar y crear clientes corporativos de prueba
 * 
 * Este script verifica si existen clientes corporativos en la base de datos
 * y, si no hay ninguno, crea algunos datos de prueba para que la 
 * funcionalidad de importación masiva de deudas funcione correctamente.
 */

import { supabase } from '../src/config/supabase.js';
import { createClient } from '../src/services/databaseService.js';

async function checkAndCreateCorporateClients() {
  console.log('🔍 Verificando clientes corporativos en la base de datos...');

  try {
    // 1. Verificar si hay empresas en la base de datos
    console.log('📋 Obteniendo empresas disponibles...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, business_name, email')
      .limit(5);

    if (companiesError) {
      console.error('❌ Error obteniendo empresas:', companiesError);
      return;
    }

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
      let { data: corporateClients, error: corporateError } = await supabase
        .from('corporate_clients')
        .select('*')
        .eq('company_id', company.id)
        .eq('is_active', true);

      let hasCorporateClientsTable = !corporateError;
      
      // Si hay error, probablemente la tabla no existe
      if (corporateError) {
        console.log(`⚠️ Tabla corporate_clients no disponible para ${company.business_name}:`, corporateError.message);
        hasCorporateClientsTable = false;
        
        // Intentar con la tabla clients como fallback
        const { data: clients, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .eq('company_id', company.id);

        if (!clientsError && clients && clients.length > 0) {
          console.log(`✅ Se encontraron ${clients.length} clientes en la tabla clients (fallback)`);
          continue; // Pasar a la siguiente empresa
        }
      } else if (corporateClients && corporateClients.length > 0) {
        console.log(`✅ Se encontraron ${corporateClients.length} clientes corporativos en corporate_clients`);
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
        const { data: insertedClients, error: insertError } = await supabase
          .from('corporate_clients')
          .insert(sampleClients)
          .select();

        if (insertError) {
          console.error('❌ Error insertando en corporate_clients:', insertError);
          console.log('🔄 Intentando insertar en tabla clients como fallback...');
          
          // Fallback: insertar en tabla clients
          const { data: fallbackClients, error: fallbackError } = await supabase
            .from('clients')
            .insert(sampleClients)
            .select();

          if (fallbackError) {
            console.error('❌ Error insertando en clients también:', fallbackError);
          } else {
            console.log(`✅ Se crearon ${fallbackClients?.length || 0} clientes corporativos en tabla clients (fallback)`);
          }
        } else {
          console.log(`✅ Se crearon ${insertedClients?.length || 0} clientes corporativos en tabla corporate_clients`);
        }
      } else {
        // Insertar directamente en tabla clients
        console.log('💾 Insertando en tabla clients...');
        const { data: insertedClients, error: insertError } = await supabase
          .from('clients')
          .insert(sampleClients)
          .select();

        if (insertError) {
          console.error('❌ Error insertando en clients:', insertError);
        } else {
          console.log(`✅ Se crearon ${insertedClients?.length || 0} clientes corporativos en tabla clients`);
        }
      }
    }

    console.log('\n🎉 Proceso completado. Ahora deberías poder ver los clientes corporativos en la Importación Masiva de Deudas.');

  } catch (error) {
    console.error('💥 Error en el proceso:', error);
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