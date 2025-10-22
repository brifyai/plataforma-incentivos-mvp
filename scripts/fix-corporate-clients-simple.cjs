const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCorporateClientsSimple() {
  try {
    console.log('🔧 Corrigiendo clientes corporativos con estructura simple...\n');

    // 1. Verificar estructura actual de corporate_clients
    console.log('📋 Verificando estructura de corporate_clients...');
    const { data: sampleCorporate, error: sampleError } = await supabase
      .from('corporate_clients')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ Error consultando corporate_clients:', sampleError);
      return;
    }

    if (sampleCorporate && sampleCorporate.length > 0) {
      console.log('   Columnas disponibles:', Object.keys(sampleCorporate[0]));
    }

    // 2. Obtener empresas y clientes existentes
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, company_name, contact_email, contact_phone, rut');

    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*');

    if (companiesError || clientsError) {
      console.error('❌ Error consultando datos:', { companiesError, clientsError });
      return;
    }

    console.log(`✅ Empresas encontradas: ${companies?.length || 0}`);
    console.log(`✅ Clientes encontrados: ${clients?.length || 0}`);

    // 3. Crear clientes corporativos simplificados para cada empresa
    console.log('\n🔧 Creando clientes corporativos simplificados...');
    
    for (const company of companies || []) {
      // Verificar si ya existe un cliente corporativo para esta empresa
      const { data: existingCorporate } = await supabase
        .from('corporate_clients')
        .select('*')
        .eq('company_id', company.id)
        .maybeSingle();

      if (!existingCorporate) {
        console.log(`   Creando cliente corporativo para: ${company.company_name}`);
        
        // Usar estructura simplificada sin contact_info
        const corporateData = {
          company_id: company.id,
          name: company.company_name || 'Empresa sin nombre',
          display_category: 'Corporativo',
          is_active: true,
          trust_level: 'verified'
        };

        const { data: newCorporate, error: createError } = await supabase
          .from('corporate_clients')
          .insert(corporateData)
          .select()
          .single();

        if (createError) {
          console.error(`   ❌ Error creando cliente corporativo:`, createError);
        } else {
          console.log(`   ✅ Cliente corporativo creado: ${newCorporate.name} (ID: ${newCorporate.id})`);
        }
      } else {
        console.log(`   ✅ Cliente corporativo ya existe: ${existingCorporate.name}`);
      }
    }

    // 4. Actualizar clientes existentes
    console.log('\n🔧 Actualizando clientes existentes...');
    
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
          console.log(`   Actualizando: ${client.business_name} -> Corporate ID: ${corporateClient.id}`);
          
          const { error: updateError } = await supabase
            .from('clients')
            .update({
              corporate_client_id: corporateClient.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', client.id);

          if (updateError) {
            console.error(`   ❌ Error actualizando:`, updateError);
          } else {
            console.log(`   ✅ Actualizado: ${client.business_name}`);
            updatedCount++;
          }
        } else {
          console.error(`   ❌ No se encontró cliente corporativo para: ${client.business_name}`);
        }
      } else {
        console.log(`   ✅ Ya tiene corporate_client_id: ${client.business_name}`);
      }
    }

    // 5. Verificación final
    console.log('\n📊 Verificación final:');
    
    const { data: finalClients } = await supabase
      .from('clients')
      .select('id, business_name, corporate_client_id, company_id');

    const { data: finalCorporateClients } = await supabase
      .from('corporate_clients')
      .select('id, name, company_id');

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

    // 6. Mostrar estado final
    if (clientsWithoutCorporate.length === 0 && companiesWithoutCorporate.length === 0) {
      console.log('\n🎉 SISTEMA CORPORATIVO 100% FUNCIONAL');
      console.log('=====================================');
      console.log('✅ Todas las empresas tienen cliente corporativo');
      console.log('✅ Todos los clientes tienen corporate_client_id');
      console.log('✅ Sistema listo para producción');
    } else {
      console.log('\n⚠️  ESTADO PARCIAL');
      console.log('================');
      console.log('Quedan algunos elementos por configurar manualmente');
    }

    // 7. Mostrar detalles si hay problemas
    if (clientsWithoutCorporate.length > 0) {
      console.log('\n⚠️  Clientes que necesitan corporate_client_id:');
      clientsWithoutCorporate.forEach(client => {
        console.log(`   - ${client.business_name} (Company: ${client.company_id})`);
      });
    }

  } catch (error) {
    console.error('💥 Error en corrección:', error);
  }
}

// Ejecutar corrección
fixCorporateClientsSimple();