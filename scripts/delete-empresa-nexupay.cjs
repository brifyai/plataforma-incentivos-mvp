const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteEmpresaNexuPay() {
  try {
    console.log('🗑️ Iniciando eliminación de Empresa NexuPay...');
    
    const companyId = '7c834069-d92e-44b1-b0c0-474310fad1ff';
    const userEmail = 'empresa@nexupay.cl';
    
    // 1. Primero obtener información para confirmar
    console.log('📋 Obteniendo información de la empresa...');
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();
    
    if (companyError) {
      console.error('❌ Error obteniendo empresa:', companyError);
      return;
    }
    
    console.log('🏢 Empresa encontrada:', {
      id: company.id,
      name: company.company_name,
      email: userEmail,
      rut: company.rut
    });
    
    // 2. Obtener el user_id
    const userId = company.user_id;
    console.log('👤 User ID:', userId);
    
    // 3. Eliminar en orden inverso para mantener integridad referencial
    
    // 3.1 Eliminar verificación de empresa
    console.log('🗑️ Eliminando company_verifications...');
    const { error: verificationError } = await supabase
      .from('company_verifications')
      .delete()
      .eq('company_id', companyId);
    
    if (verificationError) {
      console.error('❌ Error eliminando verificaciones:', verificationError);
    } else {
      console.log('✅ company_verifications eliminado');
    }
    
    // 3.2 Eliminar historial de verificaciones
    console.log('🗑️ Eliminando verification_history...');
    const { error: historyError } = await supabase
      .from('verification_history')
      .delete()
      .eq('verification_id', companyId); // Asumiendo que verification_id coincide con company_id
    
    if (historyError) {
      console.warn('⚠️ Error eliminando historial (puede no existir):', historyError.message);
    } else {
      console.log('✅ verification_history eliminado');
    }
    
    // 3.3 Eliminar deudas asociadas
    console.log('🗑️ Eliminando debts...');
    const { error: debtsError } = await supabase
      .from('debts')
      .delete()
      .eq('company_id', companyId);
    
    if (debtsError) {
      console.warn('⚠️ Error eliminando deudas (puede no existir):', debtsError.message);
    } else {
      console.log('✅ debts eliminados');
    }
    
    // 3.4 Eliminar clientes asociados
    console.log('🗑️ Eliminando clients...');
    const { error: clientsError } = await supabase
      .from('clients')
      .delete()
      .eq('company_id', companyId);
    
    if (clientsError) {
      console.warn('⚠️ Error eliminando clientes (puede no existir):', clientsError.message);
    } else {
      console.log('✅ clients eliminados');
    }
    
    // 3.5 Eliminar campañas asociadas
    console.log('🗑️ Eliminando campaigns...');
    const { error: campaignsError } = await supabase
      .from('campaigns')
      .delete()
      .eq('company_id', companyId);
    
    if (campaignsError) {
      console.warn('⚠️ Error eliminando campañas (puede no existir):', campaignsError.message);
    } else {
      console.log('✅ campaigns eliminados');
    }
    
    // 3.6 Eliminar empresa
    console.log('🗑️ Eliminando companies...');
    const { error: companyDeleteError } = await supabase
      .from('companies')
      .delete()
      .eq('id', companyId);
    
    if (companyDeleteError) {
      console.error('❌ Error eliminando empresa:', companyDeleteError);
      return;
    } else {
      console.log('✅ companies eliminado');
    }
    
    // 3.7 Eliminar usuario
    if (userId) {
      console.log('🗑️ Eliminando users...');
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (userError) {
        console.error('❌ Error eliminando usuario:', userError);
      } else {
        console.log('✅ users eliminado');
      }
    }
    
    // 4. Verificación final
    console.log('\n🔍 Verificando eliminación...');
    
    const { data: remainingCompany } = await supabase
      .from('companies')
      .select('id, company_name')
      .eq('id', companyId);
    
    const { data: remainingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', userEmail);
    
    if (remainingCompany && remainingCompany.length > 0) {
      console.error('❌ La empresa todavía existe:', remainingCompany);
    } else {
      console.log('✅ Empresa eliminada completamente');
    }
    
    if (remainingUser && remainingUser.length > 0) {
      console.error('❌ El usuario todavía existe:', remainingUser);
    } else {
      console.log('✅ Usuario eliminado completamente');
    }
    
    console.log('\n🎉 Eliminación de Empresa NexuPay completada exitosamente');
    
  } catch (error) {
    console.error('💥 Error general en eliminación:', error);
  }
}

deleteEmpresaNexuPay();