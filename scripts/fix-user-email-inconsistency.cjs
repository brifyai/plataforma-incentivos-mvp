const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUserEmailInconsistency() {
  try {
    console.log('🔧 Iniciando corrección de inconsistencia de email');
    
    // Datos del problema
    const companyEmail = 'empresa@nexupay.cl';
    const currentUserEmail = 'admin@nexupay.cl';
    const userId = 'ad09560a-2d57-4a59-859b-c7a7f3f93f6e';
    const companyId = 'e27b3162-e7db-4b00-bc60-32abea7e171b';
    
    console.log(`📋 Datos actuales:`);
    console.log(`   Empresa email: ${companyEmail}`);
    console.log(`   Usuario email: ${currentUserEmail}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Company ID: ${companyId}`);
    
    // Verificar que no exista ya un usuario con el email empresa@nexupay.cl
    console.log(`\n🔍 Verificando si ya existe un usuario con email ${companyEmail}`);
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', companyEmail)
      .maybeSingle();
    
    if (checkError) {
      console.error('❌ Error verificando email existente:', checkError);
      return;
    }
    
    if (existingUser) {
      console.error(`❌ Ya existe un usuario con email ${companyEmail}`);
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Nombre: ${existingUser.full_name}`);
      console.log(`   Rol: ${existingUser.role}`);
      console.log(`\n💡 Solución manual:`);
      console.log(`   1. Eliminar el usuario existente con email ${companyEmail}`);
      console.log(`   2. Volver a ejecutar este script`);
      return;
    }
    
    // Actualizar el email del usuario
    console.log(`\n🔄 Actualizando email del usuario ${userId} de ${currentUserEmail} a ${companyEmail}`);
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        email: companyEmail,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error actualizando email del usuario:', updateError);
      return;
    }
    
    console.log(`✅ Email del usuario actualizado exitosamente:`);
    console.log(`   ID: ${updatedUser.id}`);
    console.log(`   Email anterior: ${currentUserEmail}`);
    console.log(`   Email nuevo: ${updatedUser.email}`);
    console.log(`   Nombre: ${updatedUser.full_name}`);
    
    // Verificar el estado final
    console.log(`\n🔍 Verificando estado final:`);
    const { data: finalUser, error: finalError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (finalError) {
      console.error('❌ Error verificando estado final:', finalError);
      return;
    }
    
    console.log(`✅ Estado final del usuario:`);
    console.log(`   ID: ${finalUser.id}`);
    console.log(`   Email: ${finalUser.email}`);
    console.log(`   Nombre: ${finalUser.full_name}`);
    console.log(`   Rol: ${finalUser.role}`);
    console.log(`   Estado: ${finalUser.validation_status}`);
    
    console.log(`\n🎉 Corrección completada exitosamente!`);
    console.log(`📝 Ahora puedes iniciar sesión con:`);
    console.log(`   Email: ${companyEmail}`);
    console.log(`   Contraseña: (la misma que usabas antes)`);
    
  } catch (err) {
    console.error('💥 Error general:', err);
  }
}

fixUserEmailInconsistency();