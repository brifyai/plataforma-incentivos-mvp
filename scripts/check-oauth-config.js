/**
 * Script de Verificación de Configuración OAuth
 * 
 * Este script ayuda a verificar que la configuración de OAuth
 * sea correcta para el entorno actual.
 */

// Función para verificar configuración de OAuth
const checkOAuthConfig = () => {
  console.log('🔍 Verificando configuración OAuth...\n');
  
  // Obtener información del entorno actual
  const currentUrl = window.location.origin;
  const currentHostname = window.location.hostname;
  const currentPort = window.location.port || '80';
  const callbackUrl = `${currentUrl}/auth/callback`;
  
  console.log('📍 Información del Entorno Actual:');
  console.log(`   URL actual: ${currentUrl}`);
  console.log(`   Hostname: ${currentHostname}`);
  console.log(`   Puerto: ${currentPort}`);
  console.log(`   URL de callback: ${callbackUrl}\n`);
  
  // Determinar el entorno
  const isLocalhost = currentHostname === 'localhost' || currentHostname === '127.0.0.1';
  const isDevelopment = isLocalhost || currentHostname.includes('dev') || currentHostname.includes('staging');
  
  console.log('🏷️ Tipo de Entorno:');
  if (isLocalhost) {
    console.log('   ✅ Entorno de desarrollo local detectado');
  } else if (isDevelopment) {
    console.log('   ✅ Entorno de desarrollo/staging detectado');
  } else {
    console.log('   ✅ Entorno de producción detectado');
  }
  console.log('');
  
  // URLs que deberían estar configuradas en Supabase
  console.log('📋 URLs que deben estar configuradas en Supabase Dashboard:');
  
  if (isLocalhost) {
    console.log('   Site URL:');
    console.log(`   - http://${currentHostname}:${currentPort}`);
    console.log('');
    console.log('   Redirect URLs:');
    console.log(`   - ${callbackUrl}`);
    console.log(`   - http://127.0.0.1:${currentPort}/auth/callback`);
    
    if (currentPort !== '3002') {
      console.log('');
      console.log('   ⚠️ ADVERTENCIA: Estás usando un puerto diferente al estándar (3002)');
      console.log('   Asegúrate de configurar este puerto específico en Supabase');
    }
  } else {
    console.log('   Site URL:');
    console.log(`   - ${currentUrl}`);
    console.log('');
    console.log('   Redirect URLs:');
    console.log(`   - ${callbackUrl}`);
  }
  
  console.log('');
  
  // Verificar variables de entorno
  console.log('🔧 Verificando variables de entorno:');
  const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;
  
  if (supabaseUrl) {
    console.log('   ✅ VITE_SUPABASE_URL configurada');
    console.log(`   - URL: ${supabaseUrl}`);
  } else {
    console.log('   ❌ VITE_SUPABASE_URL no encontrada');
  }
  
  if (supabaseAnonKey) {
    console.log('   ✅ VITE_SUPABASE_ANON_KEY configurada');
    console.log(`   - Key: ${supabaseAnonKey.substring(0, 10)}...`);
  } else {
    console.log('   ❌ VITE_SUPABASE_ANON_KEY no encontrada');
  }
  
  console.log('');
  
  // Verificar si hay errores en la URL actual
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');
  const errorDescription = urlParams.get('error_description');
  
  if (error) {
    console.log('🚨 Error detectado en la URL actual:');
    console.log(`   Error: ${error}`);
    console.log(`   Descripción: ${errorDescription}`);
    
    // Sugerencias basadas en el error
    if (error.includes('invalid_redirect_uri') || error.includes('Invalid redirect_uri')) {
      console.log('');
      console.log('💡 Solución sugerida:');
      console.log('   1. Ve a Supabase Dashboard → Authentication → Providers → Google');
      console.log('   2. Agrega la URL exacta a "Redirect URLs"');
      console.log(`   3. Asegúrate de incluir: ${callbackUrl}`);
    }
    
    if (error.includes('auth_session_missing')) {
      console.log('');
      console.log('💡 Solución sugerida:');
      console.log('   1. Verifica que la URL de callback coincida exactamente');
      console.log('   2. Asegúrate de que no haya caracteres extraños');
      console.log('   3. Limpia las cookies y localStorage');
    }
  } else {
    console.log('✅ No hay errores detectados en la URL actual');
  }
  
  console.log('');
  
  // Instrucciones para configuración
  console.log('📝 Pasos para configurar OAuth correctamente:');
  console.log('   1. Ve a https://supabase.com/dashboard');
  console.log('   2. Selecciona tu proyecto');
  console.log('   3. Ve a Authentication → Providers → Google');
  console.log('   4. Configura las URLs como se indican arriba');
  console.log('   5. Guarda y espera 5 minutos');
  console.log('   6. Prueba el flujo de OAuth nuevamente');
  
  console.log('');
  
  // Función para probar OAuth
  console.log('🧪 Para probar OAuth manualmente:');
  console.log('   1. Abre la consola del navegador');
  console.log('   2. Ejecuta: testOAuthFlow()');
  console.log('   3. Sigue las instrucciones');
  
  return {
    currentUrl,
    callbackUrl,
    isLocalhost,
    isDevelopment,
    supabaseUrl,
    supabaseAnonKey: !!supabaseAnonKey,
    hasError: !!error
  };
};

// Función para probar el flujo de OAuth
const testOAuthFlow = async () => {
  console.log('🧪 Iniciando prueba de flujo OAuth...\n');
  
  try {
    // Importar el servicio de autenticación
    const { signInWithGoogle } = await import('../src/services/authService.js');
    
    console.log('📞 Llamando a signInWithGoogle()...');
    const result = await signInWithGoogle();
    
    console.log('📊 Resultado:', result);
    
    if (result.error) {
      console.log('❌ Error en OAuth:', result.error);
    } else {
      console.log('✅ OAuth iniciado correctamente');
      console.log('🔄 Deberías ser redirigido a Google...');
    }
  } catch (error) {
    console.error('❌ Error en prueba de OAuth:', error);
  }
};

// Función para limpiar sesión
const clearAuthSession = () => {
  console.log('🧹 Limpiando sesión de autenticación...');
  
  // Limpiar localStorage
  localStorage.removeItem('mock_session');
  localStorage.removeItem('secure_session');
  localStorage.removeItem('pending_oauth_registration');
  
  // Limpiar sessionStorage
  sessionStorage.clear();
  
  console.log('✅ Sesión limpiada. Puedes intentar OAuth nuevamente.');
};

// Función para verificar estado de autenticación
const checkAuthState = async () => {
  console.log('🔍 Verificando estado de autenticación...\n');
  
  try {
    const { getCurrentUser } = await import('../src/services/authService.js');
    const { user, error } = await getCurrentUser();
    
    if (user) {
      console.log('✅ Usuario autenticado:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Rol: ${user.user_metadata?.role || 'no definido'}`);
    } else {
      console.log('❌ No hay usuario autenticado');
      if (error) {
        console.log(`   Error: ${error}`);
      }
    }
  } catch (error) {
    console.error('❌ Error verificando estado:', error);
  }
};

// Exportar funciones para uso en la consola
window.checkOAuthConfig = checkOAuthConfig;
window.testOAuthFlow = testOAuthFlow;
window.clearAuthSession = clearAuthSession;
window.checkAuthState = checkAuthState;

// Auto-ejecutar verificación al cargar el script
console.log('🚀 Script de verificación OAuth cargado');
console.log('💡 Funciones disponibles:');
console.log('   - checkOAuthConfig() - Verifica configuración actual');
console.log('   - testOAuthFlow() - Prueba el flujo de OAuth');
console.log('   - clearAuthSession() - Limpia la sesión');
console.log('   - checkAuthState() - Verifica estado de autenticación');
console.log('');

// Ejecutar verificación automáticamente
checkOAuthConfig();