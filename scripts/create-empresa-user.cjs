const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Configuración de Supabase
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createEmpresaUser() {
  try {
    console.log('🔍 Verificando si el usuario empresa@nexupay.cl existe...');
    
    // Verificar si el usuario ya existe
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'empresa@nexupay.cl')
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error verificando usuario:', checkError);
      return;
    }
    
    if (existingUser) {
      console.log('✅ Usuario ya existe:', existingUser);
      console.log('   ID:', existingUser.id);
      console.log('   Email:', existingUser.email);
      console.log('   Rol:', existingUser.role);
      return;
    }
    
    console.log('📝 Creando usuario empresa@nexupay.cl...');
    
    // Generar ID único para el usuario
    const userId = crypto.randomUUID();
    
    // Crear el usuario
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: 'empresa@nexupay.cl',
        role: 'company',
        full_name: 'Empresa NexuPay',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error creando usuario:', createError);
      return;
    }
    
    console.log('✅ Usuario creado exitosamente:');
    console.log('   ID:', newUser.id);
    console.log('   Email:', newUser.email);
    console.log('   Rol:', newUser.role);
    console.log('   Nombre:', newUser.full_name);
    
    // También crear en auth.users si es posible
    console.log('🔐 Nota: Este usuario solo existe en la tabla users.');
    console.log('   Para el login, necesitas crearlo también en el sistema de autenticación de Supabase.');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

createEmpresaUser();