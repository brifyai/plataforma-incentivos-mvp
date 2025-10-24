/**
 * Script para crear el usuario hola@aintelligence.cl
 */

const { createClient } = require('@supabase/supabase-js');
// Generar UUID simple sin dependencia externa
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
const fetch = require('node-fetch');

// Configuración de Supabase
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: fetch
  }
});

async function createAIntelligenceUser() {
  try {
    console.log('🔍 Verificando si el usuario hola@aintelligence.cl existe...');
    
    // Buscar el usuario
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'hola@aintelligence.cl')
      .single();
    
    if (!findError && existingUser) {
      console.log('✅ Usuario ya existe:');
      console.log('   ID:', existingUser.id);
      console.log('   Email:', existingUser.email);
      console.log('   Rol:', existingUser.role);
      console.log('   Nombre:', existingUser.full_name);
      return;
    }
    
    console.log('👤 Creando usuario hola@aintelligence.cl...');
    
    // Generar ID único
    const userId = generateUUID();
    
    // Crear usuario
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: 'hola@aintelligence.cl',
        full_name: 'AIntelligence',
        rut: '11.111.111-1',
        role: 'company',
        phone: '+56 9 1111 1111',
        validation_status: 'validated',
        wallet_balance: 0,
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
    
    // Crear perfil de empresa
    console.log('🏢 Creando perfil de empresa...');
    
    const { error: companyError } = await supabase
      .from('companies')
      .insert({
        user_id: userId,
        company_name: 'AIntelligence',
        rut: '11.111.111-1',
        contact_email: 'hola@aintelligence.cl',
        contact_phone: '+56 9 1111 1111',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (companyError) {
      console.warn('⚠️ Error creando empresa:', companyError.message);
    } else {
      console.log('✅ Empresa creada exitosamente');
    }
    
    // Crear notificaciones de bienvenida
    console.log('📝 Creando notificaciones de bienvenida...');
    
    const notifications = [
      {
        user_id: userId,
        title: '¡Bienvenido a NexuPay!',
        message: 'Tu cuenta AIntelligence ha sido configurada correctamente. Comienza a gestionar tus deudas.',
        type: 'success',
        read: false
      },
      {
        user_id: userId,
        title: 'Sistema de Analytics',
        message: 'Accede a tus analíticas empresariales en el dashboard de analytics.',
        type: 'info',
        read: false
      },
      {
        user_id: userId,
        title: 'Campana de Notificaciones',
        message: 'Haz click en la campana para ver tus notificaciones en formato SweetAlert compacto.',
        type: 'info',
        read: false
      }
    ];
    
    for (const notification of notifications) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notification);
      
      if (notifError) {
        console.warn('⚠️ Error insertando notificación:', notifError.message);
      } else {
        console.log('✅ Notificación insertada:', notification.title);
      }
    }
    
    console.log('');
    console.log('🎉 Proceso completado para hola@aintelligence.cl');
    console.log('');
    console.log('📋 Credenciales para login:');
    console.log('   Email: hola@aintelligence.cl');
    console.log('   Contraseña: (debe ser establecida con el script de contraseña)');
    console.log('');
    console.log('🔑 Para establecer contraseña, ejecuta:');
    console.log('   node scripts/set-aintelligence-password.cjs');
    
  } catch (error) {
    console.error('❌ Error en el script:', error);
  }
}

// Ejecutar el script
createAIntelligenceUser();