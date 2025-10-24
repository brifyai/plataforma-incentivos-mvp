const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixVerificationStatus() {
  try {
    console.log('🔧 Arreglando estado de verificación...');
    
    const companyId = '7c834069-d92e-44b1-b0c0-474310fad1ff';
    
    // Actualizar company_verifications a "rejected"
    const { data: updateResult, error: updateError } = await supabase
      .from('company_verifications')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        reviewed_by: 'ad09560a-2d57-4a59-859b-c7a7f3f93f6e', // ID del administrador asignado
        decision_notes: 'Rechazado desde script de corrección',
        rejection_reason: 'documento_ilegible', // Motivo del rechazo
        updated_at: new Date().toISOString()
      })
      .eq('company_id', companyId)
      .select();
    
    if (updateError) {
      console.error('❌ Error actualizando company_verifications:', updateError);
      return;
    }
    
    console.log('✅ company_verifications actualizado:');
    console.log(JSON.stringify(updateResult, null, 2));
    
    // Verificar el estado final
    const { data: finalVerification, error: finalError } = await supabase
      .from('company_verifications')
      .select('*')
      .eq('company_id', companyId)
      .single();
    
    if (finalError) {
      console.error('❌ Error verificando estado final:', finalError);
    } else {
      console.log('📋 Estado final de company_verifications:');
      console.log(`- ID: ${finalVerification.id}`);
      console.log(`- Status: ${finalVerification.status}`);
      console.log(`- Rejected at: ${finalVerification.rejected_at}`);
      console.log(`- Rejection reason: ${finalVerification.rejection_reason}`);
    }
    
    // También verificar companies
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('id, company_name, validation_status')
      .eq('id', companyId)
      .single();
    
    if (companyError) {
      console.error('❌ Error verificando companies:', companyError);
    } else {
      console.log('🏢 Estado final de companies:');
      console.log(`- ID: ${companyData.id}`);
      console.log(`- Name: ${companyData.company_name}`);
      console.log(`- Validation status: ${companyData.validation_status}`);
    }
    
    console.log('✅ ¡Corrección completada! Ahora ambos estados deberían ser "rejected".');
    
  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

fixVerificationStatus();