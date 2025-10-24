// Script para agregar columnas de representante legal usando el método directo
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wvluqdldygmgncqqjkow.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

console.log('🔧 AGREGANDO COLUMNAS DE REPRESENTANTE LEGAL');
console.log('='.repeat(50));

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function addLegalRepresentativeColumns() {
  try {
    // Paso 1: Verificar estado actual
    console.log('📋 Verificando estado actual...');
    
    const { data: currentData, error: currentError } = await supabase
      .from('companies')
      .select('*')
      .eq('contact_email', 'empresa@nexupay.cl')
      .single();
    
    if (currentError) {
      console.error('❌ Error obteniendo datos:', currentError.message);
      return;
    }
    
    console.log('✅ Empresa encontrada:', currentData.company_name);
    console.log('📋 Columnas actuales:', Object.keys(currentData).length);
    
    // Paso 2: Intentar agregar columnas usando el método de actualización directa
    console.log('\n🔧 Intentando agregar columnas...');
    
    // Método: intentar actualizar con las nuevas columnas
    // Si las columnas no existen, Supabase dará un error específico
    const updateData = {
      company_name: 'NexuPay Cobranzas',
      rut: '78179864-9',
      contact_phone: '+56966685967',
      legal_representative_name: 'Camilo Alegria',
      legal_representative_rut: '16323735-0',
      updated_at: new Date().toISOString()
    };
    
    const { data: updateResult, error: updateError } = await supabase
      .from('companies')
      .update(updateData)
      .eq('contact_email', 'empresa@nexupay.cl')
      .select();
    
    if (updateError) {
      console.log('⚠️ Las columnas no existen aún:', updateError.message);
      
      // Paso 3: Crear script SQL manual para ejecutar en Supabase Dashboard
      console.log('\n📝 Creando script SQL para ejecución manual...');
      
      const sqlScript = `
-- Agregar columnas de representante legal a la tabla companies
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS legal_representative_name TEXT,
ADD COLUMN IF NOT EXISTS legal_representative_rut TEXT;

-- Actualizar datos de NexuPay Cobranzas
UPDATE public.companies 
SET 
    legal_representative_name = 'Camilo Alegria',
    legal_representative_rut = '16323735-0',
    updated_at = NOW()
WHERE contact_email = 'empresa@nexupay.cl';

-- Verificar resultados
SELECT 
    company_name,
    rut,
    contact_phone,
    legal_representative_name,
    legal_representative_rut,
    updated_at
FROM public.companies 
WHERE contact_email = 'empresa@nexupay.cl';
      `;
      
      // Guardar script SQL
      const fs = require('fs');
      fs.writeFileSync('scripts/add-legal-representative-manual.sql', sqlScript);
      
      console.log('✅ Script SQL creado: scripts/add-legal-representative-manual.sql');
      console.log('\n📋 INSTRUCCIONES MANUALES:');
      console.log('1. Ve a Supabase Dashboard > SQL Editor');
      console.log('2. Copia y pega el contenido del script');
      console.log('3. Ejecuta el script para agregar las columnas');
      console.log('4. Vuelve a ejecutar este script para verificar');
      
    } else {
      console.log('✅ Columnas agregadas y datos actualizados exitosamente');
      
      // Paso 4: Verificación final
      console.log('\n🔍 Verificando actualización...');
      
      const { data: finalData, error: finalError } = await supabase
        .from('companies')
        .select('*')
        .eq('contact_email', 'empresa@nexupay.cl')
        .single();
      
      if (finalError) {
        console.error('❌ Error en verificación:', finalError.message);
      } else {
        console.log('📋 DATOS FINALES:');
        console.log('   • Nombre:', finalData.company_name);
        console.log('   • RUT:', finalData.rut);
        console.log('   • Teléfono:', finalData.contact_phone);
        console.log('   • Representante Legal:', finalData.legal_representative_name);
        console.log('   • RUT Representante:', finalData.legal_representative_rut);
        console.log('   • Actualizado:', finalData.updated_at);
        
        // Verificación final
        const allCorrect = 
          finalData.company_name === 'NexuPay Cobranzas' &&
          finalData.rut === '78179864-9' &&
          finalData.contact_phone === '+56966685967' &&
          finalData.legal_representative_name === 'Camilo Alegria' &&
          finalData.legal_representative_rut === '16323735-0';
        
        if (allCorrect) {
          console.log('\n🎉 ¡TODOS LOS DATOS SON CORRECTOS!');
          console.log('✅ NexuPay Cobranzas está completamente actualizado');
        } else {
          console.log('\n⚠️ Algunos datos aún necesitan corrección');
        }
      }
    }
    
    console.log('\n🏁 Proceso completado');
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

addLegalRepresentativeColumns().then(() => {
  console.log('\n🎯 Script finalizado');
}).catch(error => {
  console.error('❌ Error en promesa:', error.message);
});