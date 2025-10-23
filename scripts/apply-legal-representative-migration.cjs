// Script para aplicar la migración de representante legal y actualizar datos
const { createClient } = require('@supabase/supabase-js');

// Configuración desde .env
const SUPABASE_URL = 'https://wvluqdldygmgncqqjkow.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

console.log('🚀 Aplicando migración de representante legal...');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function applyMigration() {
  try {
    // Paso 1: Ejecutar la migración SQL
    console.log('📋 Ejecutando migración SQL...');
    
    const { error: migrationError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.companies 
        ADD COLUMN IF NOT EXISTS legal_representative_name TEXT,
        ADD COLUMN IF NOT EXISTS legal_representative_rut TEXT;
        
        COMMENT ON COLUMN public.companies.legal_representative_name IS 'Nombre completo del representante legal de la empresa';
        COMMENT ON COLUMN public.companies.legal_representative_rut IS 'RUT del representante legal de la empresa';
        
        UPDATE public.companies 
        SET 
            legal_representative_name = 'Camilo Alegria',
            legal_representative_rut = '16323735-0',
            updated_at = NOW()
        WHERE contact_email = 'empresa@nexupay.cl';
      `
    });
    
    if (migrationError) {
      console.error('❌ Error en migración:', migrationError.message);
      
      // Intentar método alternativo: actualizar directamente
      console.log('🔄 Intentando actualización directa...');
      
      const { data, error } = await supabase
        .from('companies')
        .update({
          legal_representative_name: 'Camilo Alegria',
          legal_representative_rut: '16323735-0',
          updated_at: new Date().toISOString()
        })
        .eq('contact_email', 'empresa@nexupay.cl')
        .select();
      
      if (error) {
        console.error('❌ Error en actualización directa:', error.message);
        return;
      }
      
      console.log('✅ Actualización directa exitosa');
    } else {
      console.log('✅ Migración SQL exitosa');
    }
    
    // Paso 2: Verificar los cambios
    console.log('🔍 Verificando cambios...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('companies')
      .select('*')
      .eq('contact_email', 'empresa@nexupay.cl')
      .single();
    
    if (verifyError) {
      console.error('❌ Error verificando:', verifyError.message);
    } else {
      console.log('📋 Datos finales:');
      console.log('   • Nombre:', verifyData.company_name);
      console.log('   • RUT Empresa:', verifyData.rut);
      console.log('   • Representante Legal:', verifyData.legal_representative_name || 'No disponible');
      console.log('   • RUT Representante:', verifyData.legal_representative_rut || 'No disponible');
      console.log('   • Teléfono:', verifyData.contact_phone);
      console.log('   • Actualizado:', verifyData.updated_at);
    }
    
    console.log('\n🎉 ¡Migración completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

applyMigration().then(() => {
  console.log('🏁 Script finalizado');
}).catch(error => {
  console.error('❌ Error en promesa:', error.message);
});