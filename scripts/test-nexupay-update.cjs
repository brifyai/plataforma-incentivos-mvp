// Script simple para probar la actualización de datos de NexuPay
console.log('🚀 Iniciando script de actualización...');

const { createClient } = require('@supabase/supabase-js');

// Configuración directa desde .env
const SUPABASE_URL = 'https://wvluqdldygmgncqqjkow.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

console.log('📡 Creando cliente Supabase...');
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function updateData() {
  try {
    console.log('🔍 Buscando empresa NexuPay...');
    
    // Primero verificar si existe la empresa
    const { data: company, error: findError } = await supabase
      .from('companies')
      .select('*')
      .eq('contact_email', 'empresa@nexupay.cl')
      .single();
    
    if (findError) {
      console.error('❌ Error buscando empresa:', findError.message);
      return;
    }
    
    console.log('✅ Empresa encontrada:', company.company_name);
    console.log('📋 RUT actual:', company.rut);
    console.log('👤 Representante actual:', company.legal_representative_name);
    console.log('📋 Todas las columnas disponibles:', Object.keys(company));
    
    // Actualizar solo los campos que existen
    console.log('🔧 Actualizando datos...');
    const updateData = {
      company_name: 'NexuPay Cobranzas',
      rut: '78179864-9',
      contact_phone: '+56966685967',
      updated_at: new Date().toISOString()
    };
    
    // Agregar campos de representante legal solo si existen
    if (company.hasOwnProperty('legal_representative_name')) {
      updateData.legal_representative_name = 'Camilo Alegria';
    }
    if (company.hasOwnProperty('legal_representative_rut')) {
      updateData.legal_representative_rut = '16323735-0';
    }
    
    console.log('📋 Datos a actualizar:', updateData);
    
    const { data, error } = await supabase
      .from('companies')
      .update(updateData)
      .eq('contact_email', 'empresa@nexupay.cl')
      .select();
    
    if (error) {
      console.error('❌ Error actualizando:', error.message);
      return;
    }
    
    console.log('✅ Actualización exitosa');
    
    // Verificar cambios
    console.log('🔍 Verificando cambios...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('companies')
      .select('*')
      .eq('contact_email', 'empresa@nexupay.cl')
      .single();
    
    if (verifyError) {
      console.error('❌ Error verificando:', verifyError.message);
    } else {
      console.log('📋 Datos actualizados:');
      console.log('   • Nombre:', verifyData.company_name);
      console.log('   • RUT:', verifyData.rut);
      console.log('   • Teléfono:', verifyData.contact_phone);
      if (verifyData.legal_representative_name) {
        console.log('   • Representante Legal:', verifyData.legal_representative_name);
      }
      if (verifyData.legal_representative_rut) {
        console.log('   • RUT Representante:', verifyData.legal_representative_rut);
      }
      console.log('   • Actualizado:', verifyData.updated_at);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

updateData().then(() => {
  console.log('🏁 Script finalizado');
}).catch(error => {
  console.error('❌ Error en promesa:', error.message);
});