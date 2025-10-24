const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanDuplicateCompanies() {
  try {
    console.log('🧹 Iniciando limpieza de empresas duplicadas...');

    // 1. Obtener el usuario empresa@nexupay.cl
    console.log('\n📋 Paso 1: Buscando usuario empresa@nexupay.cl...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'empresa@nexupay.cl')
      .single();

    if (userError) {
      console.error('❌ Error obteniendo usuario:', userError);
      return;
    }

    console.log('✅ Usuario encontrado:', {
      id: user.id,
      email: user.email,
      full_name: user.full_name
    });

    // 2. Obtener todas las empresas del usuario
    console.log('\n📋 Paso 2: Listando todas las empresas del usuario...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (companiesError) {
      console.error('❌ Error obteniendo empresas:', companiesError);
      return;
    }

    console.log(`✅ Encontradas ${companies.length} empresas:`);
    companies.forEach((company, index) => {
      console.log(`  ${index + 1}. ID: ${company.id}`);
      console.log(`     - Business Name: ${company.business_name || 'SIN NOMBRE'}`);
      console.log(`     - Contact Email: ${company.contact_email || 'SIN EMAIL'}`);
      console.log(`     - Validation Status: ${company.validation_status}`);
      console.log(`     - Created: ${company.created_at}`);
      console.log('');
    });

    // 3. Identificar empresas a eliminar
    const companiesToDelete = companies.filter(company => {
      const contactEmail = company.contact_email || '';
      
      // Eliminar "Empresa Test Corporativa" (email test@corporate.com) y "NexuPay SPA" (sin email)
      return (
        contactEmail === 'test@corporate.com' ||
        !contactEmail || // Sin email = NexuPay SPA
        contactEmail === null
      );
    });

    const companyToKeep = companies.find(company => {
      const contactEmail = company.contact_email || '';
      // Conservar la que tiene email empresa@nexupay.cl
      return contactEmail === 'empresa@nexupay.cl';
    });

    console.log('📋 Paso 3: Análisis de empresas a eliminar/conservar...');
    console.log(`🗑️ Empresas a eliminar: ${companiesToDelete.length}`);
    companiesToDelete.forEach(company => {
      console.log(`   - ${company.business_name || 'SIN NOMBRE'} (ID: ${company.id})`);
    });

    if (companyToKeep) {
      console.log(`✅ Empresa a conservar: ${companyToKeep.business_name} (ID: ${companyToKeep.id})`);
    } else {
      console.log('❌ No se encontró "NexuPay Cobranzas" para conservar');
      return;
    }

    // 4. Eliminar empresas duplicadas
    console.log('\n📋 Paso 4: Eliminando empresas duplicadas...');
    
    for (const company of companiesToDelete) {
      console.log(`🗑️ Eliminando empresa: ${company.business_name || 'SIN NOMBRE'} (ID: ${company.id})`);
      
      // Primero eliminar registros relacionados si existen
      try {
        // Eliminar clientes corporativos relacionados
        const { error: corporateError } = await supabase
          .from('corporate_clients')
          .delete()
          .eq('company_id', company.id);
        
        if (corporateError) {
          console.warn(`⚠️ Error eliminando corporate_clients: ${corporateError.message}`);
        } else {
          console.log(`   ✅ Corporate clients eliminados`);
        }
      } catch (err) {
        console.warn(`⚠️ Error eliminando corporate_clients: ${err.message}`);
      }

      try {
        // Eliminar clientes relacionados
        const { error: clientsError } = await supabase
          .from('clients')
          .delete()
          .eq('company_id', company.id);
        
        if (clientsError) {
          console.warn(`⚠️ Error eliminando clients: ${clientsError.message}`);
        } else {
          console.log(`   ✅ Clients eliminados`);
        }
      } catch (err) {
        console.warn(`⚠️ Error eliminando clients: ${err.message}`);
      }

      // Eliminar la empresa
      const { error: deleteError } = await supabase
        .from('companies')
        .delete()
        .eq('id', company.id);

      if (deleteError) {
        console.error(`❌ Error eliminando empresa ${company.id}:`, deleteError);
      } else {
        console.log(`   ✅ Empresa eliminada exitosamente`);
      }
    }

    // 5. Verificar resultado final
    console.log('\n📋 Paso 5: Verificando resultado final...');
    const { data: finalCompanies, error: finalError } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (finalError) {
      console.error('❌ Error verificando resultado:', finalError);
      return;
    }

    console.log(`✅ Empresas restantes: ${finalCompanies.length}`);
    finalCompanies.forEach((company, index) => {
      console.log(`  ${index + 1}. ${company.business_name || 'SIN NOMBRE'} (ID: ${company.id})`);
      console.log(`     - Email: ${company.contact_email || 'SIN EMAIL'}`);
      console.log(`     - Status: ${company.validation_status}`);
    });

    if (finalCompanies.length === 1) {
      console.log('\n🎉 ¡LIMPIEZA COMPLETADA CON ÉXITO!');
      console.log('✅ El usuario ahora tiene solo una empresa');
      console.log('✅ getCompanyProfile debería funcionar correctamente');
      console.log('✅ El dashboard debería cargar sin problemas');
    } else {
      console.log('\n⚠️ Quedan múltiples empresas, revisar manualmente');
    }

  } catch (error) {
    console.error('💥 Error en limpieza:', error);
  }
}

// Ejecutar limpieza
cleanDuplicateCompanies();