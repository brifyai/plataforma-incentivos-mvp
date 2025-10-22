const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function vincularEmpresaValidada() {
  try {
    console.log('🔍 Diagnosticando situación actual de empresas...');
    
    // 1. Buscar todas las empresas con estado validated
    const { data: validatedCompanies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .eq('validation_status', 'validated');
    
    if (companiesError) {
      console.error('❌ Error buscando empresas validadas:', companiesError);
      return;
    }
    
    console.log(`📊 Se encontraron ${validatedCompanies.length} empresas validadas:`);
    validatedCompanies.forEach((company, index) => {
      console.log(`  ${index + 1}. ID: ${company.id}`);
      console.log(`     Nombre: ${company.company_name}`);
      console.log(`     RUT: ${company.rut}`);
      console.log(`     Email: ${company.contact_email}`);
      console.log(`     User ID: ${company.user_id}`);
      console.log(`     Estado: ${company.validation_status}`);
      console.log('');
    });
    
    // 2. Buscar el usuario empresa@nexupay.cl
    const { data: empresaUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'empresa@nexupay.cl')
      .eq('role', 'company')
      .single();
    
    if (userError) {
      console.error('❌ Error buscando usuario empresa@nexupay.cl:', userError);
      return;
    }
    
    console.log('✅ Usuario empresa@nexupay.cl encontrado:');
    console.log(`  ID: ${empresaUser.id}`);
    console.log(`  Email: ${empresaUser.email}`);
    console.log(`  Nombre: ${empresaUser.full_name}`);
    console.log(`  RUT: ${empresaUser.rut}`);
    console.log('');
    
    // 3. Verificar si este usuario ya tiene una empresa asociada
    const { data: currentCompany, error: currentCompanyError } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', empresaUser.id)
      .maybeSingle();
    
    if (currentCompanyError && currentCompanyError.code !== 'PGRST116') {
      console.error('❌ Error buscando empresa actual del usuario:', currentCompanyError);
      return;
    }
    
    if (currentCompany) {
      console.log('📋 El usuario ya tiene una empresa asociada:');
      console.log(`  ID: ${currentCompany.id}`);
      console.log(`  Nombre: ${currentCompany.company_name}`);
      console.log(`  RUT: ${currentCompany.rut}`);
      console.log('');
      
      // Verificar si hay otras empresas validadas sin usuario asociado
      const companiesWithoutUser = validatedCompanies.filter(c => !c.user_id);
      if (companiesWithoutUser.length > 0) {
        console.log('⚠️ Hay empresas validadas sin usuario asociado:');
        companiesWithoutUser.forEach((company, index) => {
          console.log(`  ${index + 1}. ${company.company_name} (${company.id})`);
        });
        console.log('');
        console.log('🤔 ¿Desea reasignar una de estas empresas al usuario empresa@nexupay.cl?');
      }
    } else {
      console.log('📋 El usuario empresa@nexupay.cl no tiene empresa asociada');
      
      // Buscar empresas validadas sin usuario
      const companiesWithoutUser = validatedCompanies.filter(c => !c.user_id);
      
      if (companiesWithoutUser.length > 0) {
        console.log(`\n🎯 Se encontraron ${companiesWithoutUser.length} empresas validadas sin usuario:`);
        companiesWithoutUser.forEach((company, index) => {
          console.log(`  ${index + 1}. ID: ${company.id}`);
          console.log(`     Nombre: ${company.company_name}`);
          console.log(`     RUT: ${company.rut}`);
          console.log(`     Email: ${company.contact_email}`);
          console.log('');
        });
        
        // Vincular automáticamente la primera empresa sin usuario
        const targetCompany = companiesWithoutUser[0];
        console.log(`🔄 Vinculando usuario empresa@nexupay.cl con ${targetCompany.company_name}...`);
        
        // Actualizar la empresa con el user_id
        const { error: updateError } = await supabase
          .from('companies')
          .update({ 
            user_id: empresaUser.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', targetCompany.id);
        
        if (updateError) {
          console.error('❌ Error actualizando empresa:', updateError);
        } else {
          console.log('✅ Empresa vinculada exitosamente');
          
          // Verificar la vinculación
          const { data: verifyCompany } = await supabase
            .from('companies')
            .select('*')
            .eq('id', targetCompany.id)
            .single();
          
          console.log('📋 Verificación de la vinculación:');
          console.log(`  Empresa ID: ${verifyCompany.id}`);
          console.log(`  Nombre: ${verifyCompany.company_name}`);
          console.log(`  User ID vinculado: ${verifyCompany.user_id}`);
          console.log(`  Email del usuario: ${empresaUser.email}`);
        }
      } else {
        console.log('❌ No hay empresas validadas sin usuario asociado');
        console.log('Todas las empresas validadas ya tienen un usuario vinculado');
      }
    }
    
    // 4. Resumen final
    console.log('\n📊 Resumen final del estado:');
    const { data: finalCompanies } = await supabase
      .from('companies')
      .select('id, company_name, user_id, validation_status')
      .eq('validation_status', 'validated');
    
    console.log('Empresas validadas:');
    finalCompanies.forEach((company) => {
      const status = company.user_id ? `✅ Vinculada (User ID: ${company.user_id})` : '❌ Sin vincular';
      console.log(`  - ${company.company_name}: ${status}`);
    });
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
}

vincularEmpresaValidada();