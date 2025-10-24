const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCorporateClientsMinimal() {
  try {
    console.log('🔧 Creando clientes corporativos con estructura mínima...\n');

    // 1. Obtener empresas y clientes existentes
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

    // 2. Crear clientes corporativos mínimos para cada empresa
    console.log('\n🔧 Creando clientes corporativos mínimos...');
    
    for (const company of companies || []) {
      // Verificar si ya existe un cliente corporativo para esta empresa
      const { data: existingCorporate } = await supabase
        .from('corporate_clients')
        .select('*')
        .eq('company_id', company.id)
        .maybeSingle();

      if (!existingCorporate) {
        console.log(`   Creando cliente corporativo para: ${company.company_name}`);
        
        // Usar solo las columnas que existen en la tabla
        const corporateData = {
          company_id: company.id,
          contact_email: company.contact_email,
          contact_phone: company.contact_phone || null,
          rut: company.rut || null,
          industry: 'Corporativo'
        };

        const { data: newCorporate, error: createError } = await supabase
          .from('corporate_clients')
          .insert(corporateData)
          .select()
          .single();

        if (createError) {
          console.error(`   ❌ Error creando cliente corporativo:`, createError);
        } else {
          console.log(`   ✅ Cliente corporativo creado: ID ${newCorporate.id}`);
        }
      } else {
        console.log(`   ✅ Cliente corporativo ya existe: ID ${existingCorporate.id}`);
      }
    }

    // 3. Actualizar clientes existentes
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

    // 4. Verificación final
    console.log('\n📊 Verificación final:');
    
    const { data: finalClients } = await supabase
      .from('clients')
      .select('id, business_name, corporate_client_id, company_id');

    const { data: finalCorporateClients } = await supabase
      .from('corporate_clients')
      .select('id, company_id, contact_email');

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

    // 5. Mostrar estado final
    if (clientsWithoutCorporate.length === 0 && companiesWithoutCorporate.length === 0) {
      console.log('\n🎉 SISTEMA CORPORATIVO 100% FUNCIONAL');
      console.log('=====================================');
      console.log('✅ Todas las empresas tienen cliente corporativo');
      console.log('✅ Todos los clientes tienen corporate_client_id');
      console.log('✅ Sistema listo para producción');
      
      // Mostrar detalles del sistema
      console.log('\n📋 Detalles del sistema:');
      finalCorporateClients?.forEach(cc => {
        const company = companies?.find(c => c.id === cc.company_id);
        console.log(`   - ${company?.company_name || 'Empresa desconocida'} -> Corporate ID: ${cc.id}`);
      });
      
      finalClients?.forEach(client => {
        const corporate = finalCorporateClients?.find(cc => cc.id === client.corporate_client_id);
        console.log(`   - ${client.business_name} -> Corporate ID: ${client.corporate_client_id}`);
      });
    } else {
      console.log('\n⚠️  ESTADO PARCIAL');
      console.log('================');
      console.log('Quedan algunos elementos por configurar manualmente');
    }

    // 6. Mostrar detalles si hay problemas
    if (clientsWithoutCorporate.length > 0) {
      console.log('\n⚠️  Clientes que necesitan corporate_client_id:');
      clientsWithoutCorporate.forEach(client => {
        console.log(`   - ${client.business_name} (Company: ${client.company_id})`);
      });
    }

    if (companiesWithoutCorporate.length > 0) {
      console.log('\n⚠️  Empresas que necesitan cliente corporativo:');
      companiesWithoutCorporate.forEach(company => {
        console.log(`   - ${company.company_name} (ID: ${company.id})`);
      });
    }

  } catch (error) {
    console.error('💥 Error en corrección:', error);
  }
}

// Ejecutar corrección
fixCorporateClientsMinimal();