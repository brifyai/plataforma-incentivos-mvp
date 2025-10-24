const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setVerificationStatus() {
  try {
    console.log('🔧 Estableciendo estado de verificación para empresa@nexupay.cl...');

    // 1. Obtener el usuario
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'empresa@nexupay.cl')
      .single();

    if (userError || !user) {
      console.error('❌ Error obteniendo usuario:', userError);
      return;
    }

    console.log('✅ Usuario encontrado:', user.email);

    // 2. Obtener la empresa del usuario
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, validation_status')
      .eq('user_id', user.id)
      .single();

    if (companyError || !company) {
      console.error('❌ Error obteniendo empresa:', companyError);
      return;
    }

    console.log('✅ Empresa encontrada:', company.id);
    console.log('📋 Estado actual:', company.validation_status);

    // 3. Si ya está validada, no hacer nada
    if (company.validation_status === 'validated') {
      console.log('✅ La empresa ya está validada. No se necesitan cambios.');
      console.log('   🎉 La empresa ya puede acceder a Gestión de Clientes');
      return;
    }

    // 4. Actualizar el estado de validación a validated
    const { data: updatedCompany, error: updateError } = await supabase
      .from('companies')
      .update({
        validation_status: 'validated',
        updated_at: new Date().toISOString()
      })
      .eq('id', company.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error actualizando estado de validación:', updateError);
      return;
    }

    console.log('✅ Estado de validación actualizado exitosamente:');
    console.log('   📋 Nuevo estado:', updatedCompany.validation_status);
    console.log('   📅 Fecha de actualización:', updatedCompany.updated_at);

    // 5. Verificar el cambio
    const { data: verifiedCompany } = await supabase
      .from('companies')
      .select('id, validation_status')
      .eq('id', company.id)
      .single();

    console.log('🔍 Verificación final:');
    console.log('   📋 Estado confirmado:', verifiedCompany.validation_status);
    console.log('   🎉 La empresa ahora puede acceder a Gestión de Clientes');

  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
}

setVerificationStatus();