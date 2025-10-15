-- ==========================================
-- CONFIGURACIÓN AUTOMÁTICA DE OAUTH PARA DESARROLLO
-- ==========================================
-- 
-- Instrucciones:
-- 1. Ve a https://supabase.com/dashboard/project/wvluqdldygmgncqqjkow
-- 2. Ve a SQL Editor
-- 3. Copia y pega este script
-- 4. Haz clic en "Run"
--
-- Este script configurará Google OAuth para funcionar en desarrollo local
-- y mantendrá la configuración de producción existente.

-- ==========================================
-- ACTUALIZAR CONFIGURACIÓN DE GOOGLE OAUTH
-- ==========================================

-- Actualizar provider de Google con URLs de desarrollo y producción
UPDATE auth.providers 
SET 
  config = jsonb_set(
    jsonb_set(
      config,
      '{redirect_uris}',
      '[
        "http://localhost:3002/auth/callback",
        "http://127.0.0.1:3002/auth/callback",
        "https://nexupay.netlify.app/auth/callback"
      ]'::jsonb
    ),
    '{site_url}',
    '"http://localhost:3002"'::jsonb
  )
WHERE name = 'google';

-- ==========================================
-- VERIFICAR CONFIGURACIÓN
-- ==========================================

-- Mostrar configuración actual para verificar
SELECT 
  name,
  config->>'redirect_uris' as redirect_urls,
  config->>'site_url' as site_url,
  config->>'client_id' as has_client_id,
  CASE 
    WHEN config->>'enabled' = 'true' THEN '✅ Habilitado'
    ELSE '❌ Deshabilitado'
  END as status
FROM auth.providers 
WHERE name = 'google';

-- ==========================================
-- CONFIGURACIÓN ADICIONAL (OPCIONAL)
-- ==========================================

-- Si necesitas agregar más puertos de desarrollo, ejecuta esto:
-- UPDATE auth.providers 
-- SET config = jsonb_set(
--   config,
--   '{redirect_uris}',
--   '[
--     "http://localhost:3000/auth/callback",
--     "http://localhost:3001/auth/callback",
--     "http://localhost:3002/auth/callback",
--     "http://127.0.0.1:3000/auth/callback",
--     "http://127.0.0.1:3001/auth/callback",
--     "http://127.0.0.1:3002/auth/callback",
--     "https://nexupay.netlify.app/auth/callback"
--   ]'::jsonb
-- )
-- WHERE name = 'google';

-- ==========================================
-- VERIFICACIÓN DE ESTADO
-- ==========================================

-- Verificar que el provider esté habilitado
SELECT 
  'Google OAuth Status' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM auth.providers 
      WHERE name = 'google' AND config->>'enabled' = 'true'
    ) THEN '✅ Configurado y habilitado'
    ELSE '❌ No configurado o deshabilitado'
  END as status;

-- ==========================================
-- INSTRUCCIONES POST-EJECUCIÓN
-- ==========================================

/*
Después de ejecutar este script:

1. ESPERA 5 MINUTOS para que la configuración se propague
2. Prueba el flujo de OAuth en tu aplicación local
3. Si aún tienes problemas, verifica:
   - Que estés usando el puerto 3002
   - Que no haya firewall bloqueando las conexiones
   - Que las variables de entorno estén configuradas correctamente

Para probar OAuth:
1. Ve a http://localhost:3002/login
2. Haz clic en "Iniciar con Google"
3. Debería redirigirte a Google y volver a tu aplicación

Si necesitas ayuda:
- Revisa la consola del navegador para errores
- Ejecuta el script check-oauth-config.js en la consola
- Contacta al desarrollador si persiste el problema
*/