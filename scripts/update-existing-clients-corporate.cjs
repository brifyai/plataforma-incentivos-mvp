const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateExistingClientsCorporate() {
  try {
    console.log('🔄 Actualizando clientes existentes con corporate_client_id...\n');

    // 1. Verificar estado actual
    console.log('📊 Estado actual del sistema:');
    
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, company_name, contact_email');

    if (companiesError) {
      console.error('❌ Error consultando empresas:', companiesError);
      return;
    }

    const { data: corporateClients, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*');

    if (corporateError) {
      console.error('❌ Error consultando clientes corporativos:', corporateError);
      return;
    }

    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*');

    if (clientsError) {
      console.error('❌ Error consultando clientes:', clientsError);
      return;
    }

    console.log(`✅ Empresas: ${companies?.length || 0}`);
    console.log(`✅ Clientes Corporativos: ${corporateClients?.length || 0}`);
    console.log(`✅ Clientes Regulares: ${clients?.length || 0}`);

    // 2. Asegurar que cada empresa tenga un cliente corporativo
    console.log('\n🔧 Asegurando clientes corporativos para cada empresa...');
    
    for (const company of companies || []) {
      const existingCorporate = corporateClients?.find(cc => cc.company_id === company.id);
      
      if (!existingCorporate) {
        console.log(`   Creando cliente corporativo para: ${company.company_name}`);
        
        const corporateData = {
          company_id: company.id,
          name: company.company_name || 'Empresa sin nombre',
          display_category: 'Corporativo',
          contact_info: {
            email: company.contact_email,
            phone: company.contact_phone,
            rut: company.rut
          },
          is_active: true,
          trust_level: 'verified'
        };

        const { data: newCorporate, error: createError } = await supabase
          .from('corporate_clients')
          .insert(corporateData)
          .select()
          .single();

        if (createError) {
          console.error(`   ❌ Error creando cliente corporativo para ${company.company_name}:`, createError);
        } else {
          console.log(`   ✅ Cliente corporativo creado: ${newCorporate.name}`);
        }
      } else {
        console.log(`   ✅ Cliente corporativo ya existe: ${existingCorporate.name}`);
      }
    }

    // 3. Actualizar clientes existentes para que tengan corporate_client_id
    console.log('\n🔧 Actualizando clientes existentes con corporate_client_id...');
    
    // Obtener lista actualizada de clientes corporativos
    const { data: updatedCorporateClients } = await supabase
      .from('corporate_clients')
      .select('*');

    let updatedCount = 0;
    
    for (const client of clients || []) {
      if (!client.corporate_client_id) {
        // Buscar el cliente corporativo de esta empresa
        const corporateClient = updatedCorporateClients?.find(cc => cc.company_id === client.company_id);
        
        if (corporateClient) {
          console.log(`   Actualizando cliente: ${client.business_name} -> Corporate ID: ${corporateClient.id}`);
          
          const { error: updateError } = await supabase
            .from('clients')
            .update({
              corporate_client_id: corporateClient.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', client.id);

          if (updateError) {
            console.error(`   ❌ Error actualizando cliente ${client.business_name}:`, updateError);
          } else {
            console.log(`   ✅ Cliente actualizado: ${client.business_name}`);
            updatedCount++;
          }
        } else {
          console.error(`   ❌ No se encontró cliente corporativo para la empresa del cliente: ${client.business_name}`);
        }
      } else {
        console.log(`   ✅ Cliente ya tiene corporate_client_id: ${client.business_name}`);
      }
    }

    // 4. Verificación final
    console.log('\n📊 Verificación final:');
    
    const { data: finalClients } = await supabase
      .from('clients')
      .select('*');

    const { data: finalCorporateClients } = await supabase
      .from('corporate_clients')
      .select('*');

    const clientsWithoutCorporate = finalClients?.filter(c => !c.corporate_client_id) || [];
    const companiesWithoutCorporate = companies?.filter(company => 
      !finalCorporateClients?.some(cc => cc.company_id === company.id)
    ) || [];

    console.log(`✅ Empresas: ${companies?.length || 0}`);
    console.log(`✅ Clientes Corporativos: ${finalCorporateClients?.length || 0}`);
    console.log(`✅ Clientes Regulares: ${finalClients?.length || 0}`);
    console.log(`✅ Clientes actualizados: ${updatedCount}`);
    console.log(`⚠️  Clientes sin corporate_client_id: ${clientsWithoutCorporate.length}`);
    console.log(`⚠️  Empresas sin cliente corporativo: ${companiesWithoutCorporate.length}`);

    // 5. Mostrar detalles si hay problemas
    if (clientsWithoutCorporate.length > 0) {
      console.log('\n⚠️  Clientes que aún necesitan corporate_client_id:');
      clientsWithoutCorporate.forEach(client => {
        console.log(`   - ${client.business_name} (Company ID: ${client.company_id})`);
      });
    }

    if (companiesWithoutCorporate.length > 0) {
      console.log('\n⚠️  Empresas que aún necesitan cliente corporativo:');
      companiesWithoutCorporate.forEach(company => {
        console.log(`   - ${company.company_name} (ID: ${company.id})`);
      });
    }

    console.log('\n🎉 ACTUALIZACIÓN COMPLETADA');
    console.log('========================');
    if (clientsWithoutCorporate.length === 0 && companiesWithoutCorporate.length === 0) {
      console.log('✅ Todos los clientes y empresas están correctamente configurados');
      console.log('✅ Sistema corporativo 100% funcional');
    } else {
      console.log('⚠️  Quedan algunos elementos por configurar manualmente');
    }

  } catch (error) {
    console.error('💥 Error en actualización:', error);
  }
}

// Ejecutar actualización
updateExistingClientsCorporate();