/**
 * Script para crear un usuario administrador
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function createAdminUser() {
  console.log('👑 Creando usuario administrador...\n');
  
  try {
    // Datos del usuario admin
    const adminData = {
      email: 'admin@nexupay.cl',
      full_name: 'Administrador NexuPay',
      rut: '11.111.111-1',
      role: 'god_mode',
      validation_status: 'validated',
      wallet_balance: 0
    };
    
    // Contraseña por defecto
    const password = 'Admin2024!';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    console.log('📧 Email:', adminData.email);
    console.log('👤 Nombre:', adminData.full_name);
    console.log('🔑 Contraseña:', password);
    console.log('🎭 Rol:', adminData.role);
    
    // Verificar si el usuario ya existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', adminData.email)
      .single();
    
    if (existingUser) {
      console.log('⚠️ El usuario admin ya existe. Actualizando contraseña...');
      
      // Actualizar contraseña del usuario existente
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password: hashedPassword,
          role: adminData.role,
          validation_status: adminData.validation_status,
          updated_at: new Date().toISOString()
        })
        .eq('email', adminData.email);
      
      if (updateError) {
        console.error('❌ Error actualizando usuario:', updateError.message);
        return;
      }
      
      console.log('✅ Usuario admin actualizado exitosamente');
    } else {
      console.log('🆕 Creando nuevo usuario admin...');
      
      // Crear nuevo usuario
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          ...adminData,
          password: hashedPassword,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creando usuario:', createError.message);
        return;
      }
      
      console.log('✅ Usuario admin creado exitosamente');
      console.log('🆔 ID:', newUser.id);
    }
    
    console.log('\n🎉 Puedes iniciar sesión con:');
    console.log('   Email: admin@nexupay.cl');
    console.log('   Contraseña: Admin2024!');
    console.log('   Rol: god_mode (acceso completo al sistema)');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

createAdminUser();