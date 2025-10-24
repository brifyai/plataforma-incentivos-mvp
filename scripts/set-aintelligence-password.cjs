/**
 * Script para establecer contraseña para el usuario hola@aintelligence.cl
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const fetch = require('node-fetch');

// Configuración de Supabase
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: fetch
  }
});

async function setAIntelligencePassword() {
  try {
    console.log('🔐 Estableciendo contraseña para hola@aintelligence.cl...');
    
    // Buscar el usuario
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'hola@aintelligence.cl')
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
    
    // Generar hash de la contraseña "aintelligence123"
    const password = 'aintelligence123';
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
      .eq('email', 'hola@aintelligence.cl');
    
    if (updateError) {
      console.error('❌ Error actualizando contraseña:', updateError);
      return;
    }
    
    console.log('✅ ¡Contraseña establecida exitosamente!');
    console.log('');
    console.log('📋 Credenciales para login:');
    console.log('   Email: hola@aintelligence.cl');
    console.log('   Contraseña: aintelligence123');
    console.log('   Rol:', user.role);
    console.log('   Nombre:', user.full_name);
    console.log('');
    console.log('🚀 Ahora puedes iniciar sesión con estas credenciales');
    
  } catch (error) {
    console.error('❌ Error en el script:', error);
  }
}

// Ejecutar el script
setAIntelligencePassword();