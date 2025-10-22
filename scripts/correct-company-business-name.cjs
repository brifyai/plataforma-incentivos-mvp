/**
 * Script para corregir el business_name de la empresa
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function correctCompanyBusinessName() {
  console.log('🔧 Corrigiendo business_name de la empresa...');
  
  try {
    // Actualizar el company_name de la empresa
    const { data, error } = await supabase
      .from('companies')
      .update({
        company_name: 'NexuPay Cobranzas'
      })
      .eq('id', 'e27b3162-e7db-4b00-bc60-32abea7e171b')
      .select();
    
    if (error) {
      console.error('❌ Error actualizando empresa:', error);
      return false;
    }
    
    console.log('✅ Empresa actualizada:', data[0]);
    
    // Verificar la actualización
    const { data: verifyData, error: verifyError } = await supabase
      .from('companies')
      .select('id, company_name, contact_email')
      .eq('id', 'e27b3162-e7db-4b00-bc60-32abea7e171b')
      .single();
    
    if (verifyError) {
      console.error('❌ Error verificando actualización:', verifyError);
      return false;
    }
    
    console.log('✅ Verificación exitosa:', verifyData);
    return true;
    
  } catch (error) {
    console.error('❌ Error en el script:', error);
    return false;
  }
}

// Ejecutar el script
correctCompanyBusinessName().then(success => {
  if (success) {
    console.log('🎉 business_name corregido exitosamente');
  } else {
    console.log('💥 Falló la corrección del business_name');
  }
  process.exit(success ? 0 : 1);
});