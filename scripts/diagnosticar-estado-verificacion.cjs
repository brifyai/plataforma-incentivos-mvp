const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnosticarEstadoVerificacion() {
  try {
    console.log('🔍 Diagnosticando estado de verificación de la empresa...');
    
    // 1. Buscar usuario empresa@nexupay.cl
    const { data: empresaUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'empresa@nexupay.cl')
      .eq('role', 'company')
      .single();
    
    if (userError) {
      console.error('❌ Error buscando usuario:', userError);
      return;
    }
    
    console.log('👤 Usuario empresa@nexupay.cl:');
    console.log(`  ID: ${empresaUser.id}`);
    console.log(`  Email: ${empresaUser.email}`);
    console.log(`  validation_status: ${empresaUser.validation_status}`);
    console.log('');
    
    // 2. Buscar la compañía asociada
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', empresaUser.id)
      .single();
    
    if (companyError) {
      console.error('❌ Error buscando compañía:', companyError);
      return;
    }
    
    console.log('🏢 Compañía asociada:');
    console.log(`  ID: ${company.id}`);
    console.log(`  Nombre: ${company.company_name}`);
    console.log(`  validation_status: ${company.validation_status}`);
    console.log('');
    
    // 3. Buscar en tabla de verifications si existe
    const { data: verifications, error: verificationError } = await supabase
      .from('verifications')
      .select('*')
      .eq('company_id', company.id)
      .maybeSingle();
    
    if (verificationError && verificationError.code !== 'PGRST116') {
      console.error('❌ Error buscando verifications:', verificationError);
    } else if (verifications) {
      console.log('📋 Registro en verifications:');
      console.log(`  ID: ${verifications.id}`);
      console.log(`  Status: ${verifications.status}`);
      console.log(`  Company ID: ${verifications.company_id}`);
      console.log('');
    } else {
      console.log('📋 No hay registro en tabla verifications');
      console.log('');
    }
    
    // 4. Verificar si hay otras tablas que puedan afectar el estado
    console.log('🔍 Buscando otras tablas relacionadas con verificación...');
    
    // Buscar en company_verification_requests si existe
    const { data: verificationRequests, error: requestsError } = await supabase
      .from('company_verification_requests')
      .select('*')
      .eq('company_id', company.id)
      .maybeSingle();
    
    if (requestsError && requestsError.code !== 'PGRST116') {
      console.error('❌ Error buscando company_verification_requests:', requestsError);
    } else if (verificationRequests) {
      console.log('📋 Registro en company_verification_requests:');
      console.log(`  ID: ${verificationRequests.id}`);
      console.log(`  Status: ${verificationRequests.status}`);
      console.log(`  Company ID: ${verificationRequests.company_id}`);
      console.log('');
    } else {
      console.log('📋 No hay registro en tabla company_verification_requests');
      console.log('');
    }
    
    // 5. Analizar inconsistencia
    console.log('🔍 Análisis de inconsistencia:');
    console.log(`  Estado en users.validation_status: ${empresaUser.validation_status}`);
    console.log(`  Estado en companies.validation_status: ${company.validation_status}`);
    
    if (verifications) {
      console.log(`  Estado en verifications.status: ${verifications.status}`);
    }
    
    if (verificationRequests) {
      console.log(`  Estado en company_verification_requests.status: ${verificationRequests.status}`);
    }
    
    console.log('');
    
    // 6. Sincronizar estados si hay inconsistencia
    const userStatus = empresaUser.validation_status;
    const companyStatus = company.validation_status;
    
    if (userStatus !== companyStatus) {
      console.log('⚠️ Se detectó inconsistencia entre users y companies');
      console.log('🔄 Sincronizando estados...');
      
      // Actualizar companies.validation_status para que coincida con users
      const { error: updateError } = await supabase
        .from('companies')
        .update({ 
          validation_status: userStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', company.id);
      
      if (updateError) {
        console.error('❌ Error actualizando companies.validation_status:', updateError);
      } else {
        console.log('✅ companies.validation_status actualizado correctamente');
      }
      
      // Si existe verifications, también actualizarlo
      if (verifications) {
        const { error: updateVerificationError } = await supabase
          .from('verifications')
          .update({ 
            status: userStatus === 'validated' ? 'approved' : userStatus,
            updated_at: new Date().toISOString()
          })
          .eq('company_id', company.id);
        
        if (updateVerificationError) {
          console.error('❌ Error actualizando verifications.status:', updateVerificationError);
        } else {
          console.log('✅ verifications.status actualizado correctamente');
        }
      }
      
      // Si existe verification_requests, también actualizarlo
      if (verificationRequests) {
        const { error: updateRequestsError } = await supabase
          .from('company_verification_requests')
          .update({ 
            status: userStatus === 'validated' ? 'approved' : userStatus,
            updated_at: new Date().toISOString()
          })
          .eq('company_id', company.id);
        
        if (updateRequestsError) {
          console.error('❌ Error actualizando company_verification_requests.status:', updateRequestsError);
        } else {
          console.log('✅ company_verification_requests.status actualizado correctamente');
        }
      }
    } else {
      console.log('✅ Los estados son consistentes entre users y companies');
    }
    
    // 7. Verificación final
    console.log('\n🔍 Verificación final después de sincronización:');
    
    const { data: finalCompany } = await supabase
      .from('companies')
      .select('validation_status')
      .eq('id', company.id)
      .single();
    
    const { data: finalUser } = await supabase
      .from('users')
      .select('validation_status')
      .eq('id', empresaUser.id)
      .single();
    
    console.log(`  Estado final en users: ${finalUser.validation_status}`);
    console.log(`  Estado final en companies: ${finalCompany.validation_status}`);
    
    console.log('\n🎉 Proceso completado');
    console.log('💡 Refresca ambos paneles para ver los estados actualizados');
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
}

diagnosticarEstadoVerificacion();