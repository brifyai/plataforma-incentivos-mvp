-- CONFIGURACION AUTOMATICA DE OAUTH PARA DESARROLLO
-- Ejecutar en el dashboard de Supabase: SQL Editor

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

-- Mostrar configuración actual para verificar
SELECT 
  name,
  config->>'redirect_uris' as redirect_urls,
  config->>'site_url' as site_url,
  config->>'client_id' as has_client_id,
  CASE 
    WHEN config->>'enabled' = 'true' THEN 'Habilitado'
    ELSE 'Deshabilitado'
  END as status
FROM auth.providers 
WHERE name = 'google';

-- Verificar que el provider esté habilitado
SELECT 
  'Google OAuth Status' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM auth.providers 
      WHERE name = 'google' AND config->>'enabled' = 'true'
    ) THEN 'Configurado y habilitado'
    ELSE 'No configurado o deshabilitado'
  END as status;