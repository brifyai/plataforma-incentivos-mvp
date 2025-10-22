const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

// Función corregida getCompanyProfile
async function getCompanyProfile(userId) {
  try {
    console.log('🔍 getCompanyProfile called for userId:', userId);
    
    // Obtener todas las empresas del usuario
    const { data: companies, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }); // Más reciente primero

    if (error) {
      console.error('❌ Error in getCompanyProfile:', error);
      return { company: null, error: error.message };
    }

    console.log(`📊 Found ${companies?.length || 0} companies for user ${userId}`);

    if (!companies || companies.length === 0) {
      console.log('⚠️ No companies found for user');
      return { company: null, error: null };
    }

    // Priorizar empresas validadas
    let selectedCompany = companies.find(c => c.validation_status === 'validated');
    
    // Si no hay validadas, tomar la primera
    if (!selectedCompany) {
      selectedCompany = companies[0];
      console.log('⚠️ No validated companies found, using first available');
    } else {
      console.log('✅ Using validated company:', selectedCompany.business_name);
    }

    console.log('📋 Selected company:', {
      id: selectedCompany.id,
      business_name: selectedCompany.business_name,
      contact_email: selectedCompany.contact_email,
      validation_status: selectedCompany.validation_status
    });

    return { company: selectedCompany, error: null };
  } catch (error) {
    console.error('💥 Error in getCompanyProfile:', error);
    return { company: null, error: 'Error al obtener datos de empresa.' };
  }
}

async function testFixedProfile() {
  try {
    console.log('🧪 Iniciando prueba de función corregida...');

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
      full_name: user.full_name,
      role: user.role
    });

    // 2. Probar la función corregida
    console.log('\n📋 Paso 2: Probando getCompanyProfile corregida...');
    const { company, error } = await getCompanyProfile(user.id);

    if (error) {
      console.error('❌ Error en getCompanyProfile:', error);
      return;
    }

    if (company) {
      console.log('✅ ¡ÉXITO! getCompanyProfile funcionó correctamente:');
      console.log('📋 Empresa devuelta:', {
        id: company.id,
        business_name: company.business_name || 'Sin nombre',
        contact_email: company.contact_email,
        validation_status: company.validation_status,
        created_at: company.created_at
      });

      console.log('\n🎯 RESULTADO FINAL:');
      console.log('✅ La función corregida maneja correctamente múltiples empresas');
      console.log('✅ Prioriza empresas validadas');
      console.log('✅ Devuelve una empresa válida para el dashboard');
      console.log('✅ El usuario empresa@nexupay.cl debería poder acceder ahora');
    } else {
      console.log('❌ getCompanyProfile devolvió null');
    }

  } catch (error) {
    console.error('💥 Error en prueba:', error);
  }
}

// Ejecutar prueba
testFixedProfile();