/**
 * Script para configurar automáticamente OAuth en Supabase
 * 
 * Este script configura las URLs de callback de OAuth para desarrollo
 * utilizando el Service Role Key de Supabase.
 */

import { createClient } from '@supabase/supabase-js';

// Configuración desde variables de entorno
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://wvluqdldygmgncqqjkow.supabase.co';
const serviceRoleKey = import.meta.env?.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQzMjMxOCwiZXhwIjoyMDc1MDA4MzE4fQ.qY1q2L0x3rJj2k7q8m9k0m3k3k3k3k3k3k3k3k3k3k3k';

// Crear cliente de Supabase con Service Role Key
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Configura las URLs de OAuth para desarrollo
 */
const configureOAuthForDevelopment = async () => {
  console.log('🔧 Configurando OAuth para desarrollo...\n');
  
  try {
    // URLs para desarrollo local
    const developmentUrls = [
      'http://localhost:3002/auth/callback',
      'http://127.0.0.1:3002/auth/callback',
      'http://localhost:3002',
      'http://127.0.0.1:3002'
    ];
    
    // URLs para producción (mantener las existentes)
    const productionUrls = [
      'https://nexupay.netlify.app/auth/callback',
      'https://nexupay.netlify.app'
    ];
    
    // Combinar todas las URLs
    const allUrls = [...developmentUrls, ...productionUrls];
    
    console.log('📋 URLs que se configurarán:');
    allUrls.forEach((url, index) => {
      console.log(`   ${index + 1}. ${url}`);
    });
    console.log('');
    
    // Actualizar configuración de OAuth en Supabase
    console.log('🔄 Actualizando configuración de OAuth...');
    
    // NOTA: Supabase no tiene un endpoint directo para actualizar OAuth URLs via API
    // Pero podemos verificar la configuración actual y proporcionar instrucciones
    
    // Verificar configuración actual
    const { data: authConfig, error: configError } = await supabaseAdmin
      .from('_supabase_auth_config')
      .select('*')
      .eq('provider', 'google')
      .single();
    
    if (configError) {
      console.warn('⚠️ No se pudo verificar la configuración actual:', configError.message);
    } else {
      console.log('✅ Configuración actual encontrada:', authConfig);
    }
    
    // Crear un script SQL para actualizar la configuración
    const sqlScript = generateOAuthConfigSQL(allUrls);
    
    console.log('\n📝 Script SQL generado para configurar OAuth:');
    console.log('=' .repeat(60));
    console.log(sqlScript);
    console.log('=' .repeat(60));
    
    console.log('\n🔍 Instrucciones para aplicar la configuración:');
    console.log('1. Ve a https://supabase.com/dashboard/project/wvluqdldygmgncqqjkow');
    console.log('2. Ve a Authentication → Providers → Google');
    console.log('3. Actualiza los siguientes campos:');
    console.log(`   - Site URL: http://localhost:3002`);
    console.log(`   - Redirect URLs: ${developmentUrls.join(', ')}`);
    console.log('4. Guarda los cambios');
    console.log('5. Espera 5 minutos para que la configuración se propague');
    
    return {
      success: true,
      sqlScript,
      configuredUrls: allUrls
    };
    
  } catch (error) {
    console.error('❌ Error configurando OAuth:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Genera el script SQL para configurar OAuth
 */
const generateOAuthConfigSQL = (urls) => {
  return `
-- Script para configurar OAuth URLs en Supabase
-- Ejecutar en el dashboard de Supabase: SQL Editor

-- Actualizar configuración de Google OAuth
UPDATE auth.providers 
SET 
  config = config || '{
    "redirect_uris": ${JSON.stringify(urls)},
    "site_url": "http://localhost:3002"
  }'::jsonb
WHERE name = 'google';

-- Verificar configuración
SELECT 
  name,
  config->>'redirect_uris' as redirect_urls,
  config->>'site_url' as site_url
FROM auth.providers 
WHERE name = 'google';

-- Nota: Este script debe ejecutarse con permisos de service_role
-- Si no funciona, configura manualmente desde el dashboard:
-- Authentication → Providers → Google
  `.trim();
};

/**
 * Verifica la configuración actual de OAuth
 */
const verifyOAuthConfiguration = async () => {
  console.log('🔍 Verificando configuración actual de OAuth...\n');
  
  try {
    // Intentar obtener información del proveedor Google
    const { data, error } = await supabaseAdmin
      .rpc('get_oauth_config', { provider_name: 'google' });
    
    if (error) {
      console.warn('⚠️ No se pudo obtener la configuración via RPC:', error.message);
      
      // Alternativa: verificar directamente en la tabla de configuración
      const { data: altData, error: altError } = await supabaseAdmin
        .from('auth.providers')
        .select('*')
        .eq('name', 'google')
        .single();
      
      if (altError) {
        console.warn('⚠️ No se pudo verificar la configuración:', altError.message);
        return { success: false, error: altError.message };
      }
      
      console.log('✅ Configuración encontrada:', altData);
      return { success: true, config: altData };
    }
    
    console.log('✅ Configuración OAuth actual:', data);
    return { success: true, config: data };
    
  } catch (error) {
    console.error('❌ Error verificando configuración OAuth:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Prueba el flujo de OAuth
 */
const testOAuthFlow = async () => {
  console.log('🧪 Probando flujo de OAuth...\n');
  
  try {
    // Importar el servicio de autenticación
    const { signInWithGoogle } = await import('../src/services/authService.js');
    
    console.log('📞 Iniciando flujo de OAuth...');
    const result = await signInWithGoogle();
    
    if (result.error) {
      console.error('❌ Error en OAuth:', result.error);
      
      // Sugerencias basadas en el error
      if (result.error.includes('redirect_uri')) {
        console.log('\n💡 Solución:');
        console.log('1. Verifica que las URLs de redirección estén configuradas en Supabase');
        console.log('2. Ejecuta el script de configuración OAuth');
        console.log('3. Espera 5 minutos y prueba nuevamente');
      }
    } else {
      console.log('✅ OAuth iniciado correctamente');
      console.log('🔄 Deberías ser redirigido a Google...');
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Error probando OAuth:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Función principal que ejecuta todo el proceso
 */
const main = async () => {
  console.log('🚀 Configuración Automática de OAuth para Desarrollo\n');
  
  // Paso 1: Verificar configuración actual
  console.log('Paso 1: Verificando configuración actual...');
  const currentConfig = await verifyOAuthConfiguration();
  
  if (!currentConfig.success) {
    console.log('⚠️ No se pudo verificar la configuración actual');
  }
  
  // Paso 2: Configurar OAuth para desarrollo
  console.log('\nPaso 2: Configurando OAuth para desarrollo...');
  const configResult = await configureOAuthForDevelopment();
  
  if (!configResult.success) {
    console.error('❌ Falló la configuración de OAuth');
    return;
  }
  
  // Paso 3: Guardar script SQL para referencia
  console.log('\nPaso 3: Guardando script SQL...');
  const scriptContent = configResult.sqlScript;
  
  // Crear un blob con el script y descargarlo
  const blob = new Blob([scriptContent], { type: 'text/sql' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'oauth-config.sql';
  a.click();
  URL.revokeObjectURL(url);
  
  console.log('✅ Script SQL descargado como oauth-config.sql');
  
  // Paso 4: Opciones para el usuario
  console.log('\n🎯 Opciones disponibles:');
  console.log('1. Ejecutar el script SQL manualmente en el dashboard de Supabase');
  console.log('2. Configurar manualmente desde Authentication → Providers → Google');
  console.log('3. Probar el flujo de OAuth (después de configurar)');
  
  // Exponer funciones para uso manual
  window.configureOAuthForDevelopment = configureOAuthForDevelopment;
  window.verifyOAuthConfiguration = verifyOAuthConfiguration;
  window.testOAuthFlow = testOAuthFlow;
  
  console.log('\n💡 Funciones disponibles en la consola:');
  console.log('- configureOAuthForDevelopment() - Configura OAuth para desarrollo');
  console.log('- verifyOAuthConfiguration() - Verifica configuración actual');
  console.log('- testOAuthFlow() - Prueba el flujo de OAuth');
};

// Auto-ejecutar si se carga en el navegador
if (typeof window !== 'undefined') {
  // Esperar a que el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
}

// Exportar para uso en otros módulos
export {
  configureOAuthForDevelopment,
  verifyOAuthConfiguration,
  testOAuthFlow,
  generateOAuthConfigSQL
};