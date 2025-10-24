const { createClient } = require('@supabase/supabase-js');

// Configuración directa - reemplaza con tus datos reales
const SUPABASE_URL = 'https://wvluqdldygmgncqqjkow.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQxNDk1NzAsImV4cCI6MjA0OTcyNTU3MH0.LpKIVPv9lJgH2QKtT3YQ0VJ2YqN1R8wX7s9k2mF4k3o';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixNexuPayData() {
  try {
    console.log('🔧 Actualizando datos de NexuPay Cobranzas...');
    
    // Primero verificar datos actuales
    console.log('\n📋 Datos actuales:');
    const { data: currentData, error: currentError } = await supabase
      .from('companies')
      .select('*')
      .eq('contact_email', 'empresa@nexupay.cl')
      .single();
    
    if (currentError) {
      console.error('❌ Error al obtener datos actuales:', currentError);
      return;
    }
    
    console.log('Empresa encontrada:', currentData.company_name);
    console.log('RUT actual:', currentData.rut);
    console.log('Representante actual:', currentData.legal_representative_name);
    
    // Actualizar datos
    const { data, error } = await supabase
      .from('companies')
      .update({
        company_name: 'NexuPay Cobranzas',
        rut: '78179864-9',
        legal_representative_name: 'Camilo Alegria',
        legal_representative_rut: '16323735-0',
        contact_phone: '+56966685967',
        updated_at: new Date().toISOString()
      })
      .eq('contact_email', 'empresa@nexupay.cl')
      .select();
    
    if (error) {
      console.error('❌ Error al actualizar datos:', error);
      return;
    }
    
    console.log('\n✅ Datos actualizados correctamente:');
    console.log('   • RUT Empresa: 78179864-9');
    console.log('   • Representante Legal: Camilo Alegria');
    console.log('   • RUT Representante: 16323735-0');
    console.log('   • Teléfono: +56966685967');
    
    // Verificar los cambios
    const { data: verifyData, error: verifyError } = await supabase
      .from('companies')
      .select('company_name, rut, legal_representative_name, legal_representative_rut, contact_phone')
      .eq('contact_email', 'empresa@nexupay.cl')
      .single();
    
    if (verifyError) {
      console.error('❌ Error al verificar:', verifyError);
    } else {
      console.log('\n📋 Datos verificados después de la actualización:');
      console.log(JSON.stringify(verifyData, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

fixNexuPayData();