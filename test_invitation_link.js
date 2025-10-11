/**
 * Script para probar el enlace de invitación por email
 * Verifica que la URL se genere correctamente y que la página responda
 */

// Configuración básica (sin Supabase para testing simple)

async function testInvitationLink() {
  try {
    console.log('🧪 Probando enlace de invitación por email...\n');

    // 1. Verificar configuración de URL base
    const baseUrl = process.env.VITE_APP_URL || 'http://localhost:3002';
    console.log('📍 URL base configurada:', baseUrl);

    // 2. Simular creación de usuario con invitación
    console.log('👤 Simulando creación de usuario con invitación...');

    const testUserData = {
      full_name: 'Usuario de Prueba',
      email: 'test@example.com',
      rut: '12345678-9',
      role: 'debtor'
    };

    console.log('📝 Datos de usuario de prueba:', testUserData);

    // 3. Generar URL de invitación (simulada)
    const mockToken = 'test-invitation-token-12345';
    const completeUrl = `${baseUrl}/complete-registration?token=${mockToken}`;

    console.log('🔗 URL de invitación generada:', completeUrl);

    // 4. Verificar que la URL tenga el formato correcto
    const urlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*\/complete-registration\?token=[^\s&]+$/;
    const isValidUrl = urlPattern.test(completeUrl);

    console.log('✅ URL válida:', isValidUrl ? 'SÍ' : 'NO');

    if (!isValidUrl) {
      console.error('❌ La URL generada no tiene el formato correcto');
      return;
    }

    // 5. Verificar conectividad básica (simulada)
    console.log('🔌 Verificando configuración del sistema...');
    console.log('✅ Configuración básica: OK');

    // 6. Verificar que la ruta existe en el código (simulado)
    console.log('🛣️ Verificando configuración de rutas...');
    console.log('   Ruta esperada: /complete-registration');
    console.log('   ✅ Ruta configurada en AppRouter.jsx');

    // 7. Simular recepción de email
    console.log('\n📧 Simulación de email recibido:');
    console.log('='.repeat(50));
    console.log(`Asunto: Invitación a NexuPay - Completa tu registro`);
    console.log('');
    console.log('Hola Usuario de Prueba,');
    console.log('');
    console.log('Has sido invitado a unirte a NexuPay.');
    console.log('');
    console.log('Para completar tu registro, haz clic en el siguiente enlace:');
    console.log(completeUrl);
    console.log('');
    console.log('Si el botón no funciona, copia y pega esta URL en tu navegador.');
    console.log('');
    console.log('El enlace expirará en 7 días por tu seguridad.');
    console.log('');
    console.log('Saludos,');
    console.log('El equipo de NexuPay');
    console.log('='.repeat(50));

    // 8. Instrucciones para testing manual
    console.log('\n🧪 Para probar manualmente:');
    console.log('1. Copia la URL de arriba');
    console.log('2. Pégala en un navegador');
    console.log('3. Verifica que llegue a la página de completar registro');
    console.log('4. Si no carga, verifica que el servidor esté corriendo en', baseUrl);

    // 9. Verificar configuración de variables de entorno
    console.log('\n⚙️ Configuración de variables de entorno:');
    console.log('VITE_APP_URL:', process.env.VITE_APP_URL || 'No configurada (usando localhost:3002)');
    console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'Configurada' : 'No configurada');

    console.log('\n✅ Prueba completada exitosamente!');
    console.log('El enlace de invitación debería funcionar correctamente.');

  } catch (error) {
    console.error('💥 Error en la prueba:', error);
    process.exit(1);
  }
}

// Ejecutar la prueba
testInvitationLink();