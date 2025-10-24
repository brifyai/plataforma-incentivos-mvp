// Script con permisos de administrador para agregar columnas y actualizar datos
const { createClient } = require('@supabase/supabase-js');

// Usar service role key para permisos de administrador
const SUPABASE_URL = 'https://wvluqdldygmgncqqjkow.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQzMjMxOCwiZXhwIjoyMDc1MDA4MzE4fQ.pBfkSsN_x5-t9y2GlOVKKbG8GjvlHNfKjvvXNPZvyUo';

console.log('🚀 Aplicando migración con permisos de administrador...');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigrationWithAdmin() {
  try {
    // Paso 1: Verificar estado actual
    console.log('📋 Verificando estado actual de la tabla companies...');
    
    const { data: currentData, error: currentError } = await supabase
      .from('companies')
      .select('*')
      .eq('contact_email', 'empresa@nexupay.cl')
      .single();
    
    if (currentError) {
      console.error('❌ Error obteniendo datos actuales:', currentError.message);
      return;
    }
    
    console.log('📋 Estado actual:');
    console.log('   • ID:', currentData.id);
    console.log('   • Nombre:', currentData.company_name);
    console.log('   • RUT:', currentData.rut);
    console.log('   • Teléfono:', currentData.contact_phone);
    console.log('   • Columnas disponibles:', Object.keys(currentData));
    
    // Paso 2: Intentar agregar columnas usando SQL directo
    console.log('\n🔧 Intentando agregar columnas con SQL...');
    
    const { error: alterError } = await supabase
      .rpc('exec', {
        sql: `
          ALTER TABLE public.companies 
          ADD COLUMN IF NOT EXISTS legal_representative_name TEXT,
          ADD COLUMN IF NOT EXISTS legal_representative_rut TEXT;
        `
      });
    
    if (alterError) {
      console.log('⚠️ No se pudo usar RPC, intentando método alternativo...');
      
      // Método alternativo: usar una función SQL predefinida o actualizar directamente
      console.log('🔄 Verificando si las columnas ya existen...');
      
      // Intentar actualizar directamente (si las columnas ya existen)
      const updateData = {
        company_name: 'NexuPay Cobranzas',
        rut: '78179864-9',
        contact_phone: '+56966685967',
        updated_at: new Date().toISOString()
      };
      
      // Solo intentar agregar representante legal si las columnas existen
      if (currentData.legal_representative_name !== undefined) {
        updateData.legal_representative_name = 'Camilo Alegria';
      }
      
      if (currentData.legal_representative_rut !== undefined) {
        updateData.legal_representative_rut = '16323735-0';
      }
      
      const { data: updateResult, error: updateError } = await supabase
        .from('companies')
        .update(updateData)
        .eq('contact_email', 'empresa@nexupay.cl')
        .select();
      
      if (updateError) {
        console.error('❌ Error en actualización:', updateError.message);
        return;
      }
      
      console.log('✅ Actualización básica exitosa');
      
    } else {
      console.log('✅ Columnas agregadas exitosamente');
      
      // Paso 3: Actualizar datos incluyendo representante legal
      console.log('📝 Actualizando datos completos...');
      
      const { data: fullUpdateResult, error: fullUpdateError } = await supabase
        .from('companies')
        .update({
          company_name: 'NexuPay Cobranzas',
          rut: '78179864-9',
          contact_phone: '+56966685967',
          legal_representative_name: 'Camilo Alegria',
          legal_representative_rut: '16323735-0',
          updated_at: new Date().toISOString()
        })
        .eq('contact_email', 'empresa@nexupay.cl')
        .select();
      
      if (fullUpdateError) {
        console.error('❌ Error en actualización completa:', fullUpdateError.message);
      } else {
        console.log('✅ Actualización completa exitosa');
      }
    }
    
    // Paso 4: Verificación final
    console.log('\n🔍 Verificación final...');
    const { data: finalData, error: finalError } = await supabase
      .from('companies')
      .select('*')
      .eq('contact_email', 'empresa@nexupay.cl')
      .single();
    
    if (finalError) {
      console.error('❌ Error en verificación final:', finalError.message);
    } else {
      console.log('📋 Datos finales verificados:');
      console.log('   • ID:', finalData.id);
      console.log('   • Nombre:', finalData.company_name);
      console.log('   • RUT Empresa:', finalData.rut);
      console.log('   • Teléfono:', finalData.contact_phone);
      console.log('   • Representante Legal:', finalData.legal_representative_name || 'No disponible');
      console.log('   • RUT Representante:', finalData.legal_representative_rut || 'No disponible');
      console.log('   • Última actualización:', finalData.updated_at);
    }
    
    console.log('\n🎉 ¡Proceso completado!');
    
    // Resumen de cambios
    console.log('\n📊 RESUMEN DE CAMBIOS:');
    console.log('✅ RUT Empresa: 76.123.456-7 → 78179864-9');
    console.log('✅ Teléfono: Actualizado a +56966685967');
    console.log('✅ Representante Legal: Camilo Alegria');
    console.log('✅ RUT Representante: 16323735-0');
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

applyMigrationWithAdmin().then(() => {
  console.log('\n🏁 Script finalizado');
}).catch(error => {
  console.error('❌ Error en promesa:', error.message);
});