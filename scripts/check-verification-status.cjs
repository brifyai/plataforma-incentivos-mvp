const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVerificationStatus() {
  console.log('🔍 Verificando estado de verificación de empresa@nexupay.cl...\n');

  try {
    // 1. Obtener usuario
    console.log('📋 Paso 1: Obteniendo usuario...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', 'empresa@nexupay.cl')
      .single();

    if (userError || !user) {
      console.error('❌ Error obteniendo usuario:', userError);
      return;
    }

    console.log('✅ Usuario encontrado:', { id: user.id, email: user.email, role: user.role });

    // 2. Obtener empresa
    console.log('\n📋 Paso 2: Obteniendo empresa...');
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (companyError || !company) {
      console.error('❌ Error obteniendo empresa:', companyError);
      return;
    }

    console.log('✅ Empresa encontrada:', { 
      id: company.id, 
      name: company.business_name,
      verification_status: company.verification_status 
    });

    // 3. Verificar si hay registro en verification_requests
    console.log('\n📋 Paso 3: Verificando solicitudes de verificación...');
    const { data: verificationRequests, error: verificationError } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('company_id', company.id);

    if (verificationError) {
      console.error('❌ Error obteniendo solicitudes de verificación:', verificationError);
    } else {
      console.log('✅ Solicitudes de verificación encontradas:', verificationRequests?.length || 0);
      if (verificationRequests && verificationRequests.length > 0) {
        verificationRequests.forEach((req, index) => {
          console.log(`  ${index + 1}. Estado: ${req.status}, Creada: ${req.created_at}`);
        });
      }
    }

    // 4. Verificar estado final
    console.log('\n📋 Paso 4: Estado final de verificación:');
    const verificationStatus = company.verification_status;
    
    if (!verificationStatus) {
      console.log('⚠️  La empresa NO ha iniciado el proceso de verificación');
      console.log('   🔒 La página de clientes debería estar BLOQUEADA');
    } else if (verificationStatus === 'pending') {
      console.log('⚠️  La empresa está PENDIENTE de verificación');
      console.log('   🔒 La página de clientes debería estar BLOQUEADA');
    } else if (verificationStatus === 'approved') {
      console.log('✅ La empresa está VERIFICADA');
      console.log('   🔓 La página de clientes debería estar DESBLOQUEADA');
    } else {
      console.log(`❓ Estado desconocido: ${verificationStatus}`);
    }

  } catch (error) {
    console.error('💥 Error en la verificación:', error);
  }
}

checkVerificationStatus();