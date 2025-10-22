const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkCompany() {
  try {
    console.log('🔍 Verificando empresa creada...');
    
    const { data: companies, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', '2bd733fc-fad8-4d5f-b2bc-3db431bb5b25');
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    console.log(`✅ Encontradas ${companies.length} empresas para el usuario:`);
    
    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      console.log(`\n📋 Empresa ${i + 1}:`);
      console.log('   ID:', company.id);
      console.log('   Nombre:', company.company_name || 'SIN NOMBRE');
      console.log('   RUT:', company.rut || 'SIN RUT');
      console.log('   Estado:', company.verification_status || 'SIN ESTADO');
      console.log('   Usuario ID:', company.user_id);
      console.log('   Creada:', company.created_at);
      
      // Verificar si tiene los campos necesarios
      const requiredFields = ['company_name', 'rut', 'validation_status'];
      const missingFields = requiredFields.filter(field => !company[field]);
      
      if (missingFields.length > 0) {
        console.log('⚠️ Campos faltantes:', missingFields);
        
        // Actualizar con valores por defecto
        const updateData = {};
        if (missingFields.includes('company_name')) {
          updateData.company_name = 'Empresa NexuPay';
        }
        if (missingFields.includes('rut')) {
          updateData.rut = '76.123.456-7';
        }
        if (missingFields.includes('validation_status')) {
          updateData.validation_status = 'pending';
        }
        
        console.log('🔧 Actualizando campos faltantes...');
        const { error: updateError } = await supabase
          .from('companies')
          .update(updateData)
          .eq('id', company.id);
        
        if (updateError) {
          console.error('❌ Error actualizando:', updateError);
        } else {
          console.log('✅ Campos actualizados exitosamente');
        }
      } else {
        console.log('✅ Todos los campos requeridos están presentes');
      }
    }
    
    // Verificar el estado final de todas las empresas
    const { data: finalCompanies } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', '2bd733fc-fad8-4d5f-b2bc-3db431bb5b25');
    
    console.log('\n🎯 Estado final de todas las empresas:');
    finalCompanies.forEach((company, index) => {
      console.log(`\n   Empresa ${index + 1}:`);
      console.log('     Nombre:', company.company_name);
      console.log('     RUT:', company.rut);
      console.log('     Estado:', company.validation_status);
      console.log('     ID:', company.id);
    });
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkCompany();