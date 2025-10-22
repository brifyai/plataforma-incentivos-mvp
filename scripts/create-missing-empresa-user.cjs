const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createMissingEmpresaUser() {
  try {
    console.log('🔧 Creando usuario empresarial faltante para empresa@nexupay.cl');
    
    // Datos del problema
    const empresaEmail = 'empresa@nexupay.cl';
    const empresaUserId = 'ad09560a-2d57-4a59-859b-c7a7f3f93f6e'; // Admin user actual
    const companyId = 'e27b3162-e7db-4b00-bc60-32abea7e171b'; // Empresa existente
    
    console.log(`📋 Datos actuales:`);
    console.log(`   Empresa email: ${empresaEmail}`);
    console.log(`   Company ID: ${companyId}`);
    console.log(`   Admin User ID: ${empresaUserId}`);
    
    // 1. Verificar que no exista ya un usuario con email empresa@nexupay.cl
    console.log(`\n🔍 Verificando si ya existe un usuario con email ${empresaEmail}`);
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', empresaEmail)
      .maybeSingle();
    
    if (checkError) {
      console.error('❌ Error verificando email existente:', checkError);
      return;
    }
    
    if (existingUser) {
      console.error(`❌ Ya existe un usuario con email ${empresaEmail}`);
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Nombre: ${existingUser.full_name}`);
      console.log(`   Rol: ${existingUser.role}`);
      console.log(`\n💡 Si este es el usuario correcto, intenta iniciar sesión con la contraseña correspondiente`);
      return;
    }
    
    // 2. Crear nuevo usuario empresarial
    console.log(`\n👤 Creando nuevo usuario empresarial con email ${empresaEmail}`);
    
    // Generar contraseña temporal (puedes cambiarla después)
    const tempPassword = 'Empresa2024!';
    const hashedPassword = await bcrypt.hash(tempPassword, 12);
    
    // Generar nuevo ID válido para el usuario (formato UUID v4)
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
    const newUserId = generateUUID();
    
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: newUserId,
        email: empresaEmail,
        password: hashedPassword,
        full_name: 'NexuPay Cobranzas',
        rut: '76.123.456-7',
        phone: null,
        role: 'company',
        validation_status: 'validated',
        wallet_balance: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error creando usuario empresarial:', createError);
      return;
    }
    
    console.log(`✅ Usuario empresarial creado exitosamente:`);
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Nombre: ${newUser.full_name}`);
    console.log(`   Rol: ${newUser.role}`);
    console.log(`   Estado: ${newUser.validation_status}`);
    
    // 3. Actualizar la empresa para que apunte al nuevo usuario
    console.log(`\n🏢 Actualizando empresa para asociarla al nuevo usuario`);
    const { data: updatedCompany, error: updateCompanyError } = await supabase
      .from('companies')
      .update({
        user_id: newUser.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', companyId)
      .select()
      .single();
    
    if (updateCompanyError) {
      console.error('❌ Error actualizando empresa:', updateCompanyError);
      console.log('⚠️ El usuario fue creado pero la empresa no pudo ser actualizada');
      return;
    }
    
    console.log(`✅ Empresa actualizada exitosamente:`);
    console.log(`   ID: ${updatedCompany.id}`);
    console.log(`   User ID: ${updatedCompany.user_id}`);
    console.log(`   Email: ${updatedCompany.contact_email}`);
    console.log(`   Nombre: ${updatedCompany.business_name}`);
    
    // 4. Verificar el estado final
    console.log(`\n🔍 Verificando estado final:`);
    
    // Verificar usuario
    const { data: finalUser, error: finalUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', newUser.id)
      .single();
    
    // Verificar empresa
    const { data: finalCompany, error: finalCompanyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();
    
    if (finalUserError || finalCompanyError) {
      console.error('❌ Error verificando estado final:', finalUserError || finalCompanyError);
      return;
    }
    
    console.log(`✅ Estado final del usuario:`);
    console.log(`   ID: ${finalUser.id}`);
    console.log(`   Email: ${finalUser.email}`);
    console.log(`   Nombre: ${finalUser.full_name}`);
    console.log(`   Rol: ${finalUser.role}`);
    console.log(`   Estado: ${finalUser.validation_status}`);
    
    console.log(`\n✅ Estado final de la empresa:`);
    console.log(`   ID: ${finalCompany.id}`);
    console.log(`   User ID: ${finalCompany.user_id}`);
    console.log(`   Email: ${finalCompany.contact_email}`);
    console.log(`   Nombre: ${finalCompany.business_name}`);
    
    console.log(`\n🎉 Creación completada exitosamente!`);
    console.log(`📝 Ahora puedes iniciar sesión como empresa con:`);
    console.log(`   Email: ${empresaEmail}`);
    console.log(`   Contraseña: ${tempPassword}`);
    console.log(`\n⚠️ IMPORTANTE: Cambia la contraseña después del primer inicio de sesión`);
    
  } catch (err) {
    console.error('💥 Error general:', err);
  }
}

createMissingEmpresaUser();