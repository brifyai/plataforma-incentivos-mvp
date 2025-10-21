/**
 * Script para establecer contraseña para el usuario empresa@nexupay.cl
 * 
 * El problema es que el usuario existe pero no tiene contraseña hasheada
 * Este script establece una contraseña segura para el usuario
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Configuración de Supabase - usar variables de entorno del proyecto
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

// Importar fetch para Node.js
const fetch = require('node-fetch');

// Configurar el cliente con fetch personalizado
const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: fetch
  }
});

async function setEmpresaPassword() {
  try {
    console.log('🔐 Estableciendo contraseña para empresa@nexupay.cl...');
    
    // Buscar el usuario
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'empresa@nexupay.cl')
      .single();
    
    if (findError) {
      console.error('❌ Error buscando usuario:', findError);
      return;
    }
    
    if (!user) {
      console.error('❌ Usuario no encontrado');
      return;
    }
    
    console.log('✅ Usuario encontrado:', {
      id: user.id,
      email: user.email,
      role: user.role,
      hasPassword: !!user.password
    });
    
    // Generar hash de la contraseña "empresa123"
    const password = 'empresa123';
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    console.log('🔒 Contraseña hasheada generada');
    
    // Actualizar el usuario con la contraseña hasheada
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('email', 'empresa@nexupay.cl');
    
    if (updateError) {
      console.error('❌ Error actualizando contraseña:', updateError);
      return;
    }
    
    console.log('✅ ¡Contraseña establecida exitosamente!');
    console.log('');
    console.log('📋 Credenciales para login:');
    console.log('   Email: empresa@nexupay.cl');
    console.log('   Contraseña: empresa123');
    console.log('');
    console.log('🚀 Ahora puedes iniciar sesión con estas credenciales');
    
  } catch (error) {
    console.error('❌ Error en el script:', error);
  }
}

// Ejecutar el script
setEmpresaPassword();