-- Migration 039: Add Missing UI Fields
-- Agregar campos faltantes identificados en el análisis UI-BD
-- Basado en verificación directa de campos críticos

-- ==========================================
-- AGREGAR CAMPOS FALTANTES A TABLA COMPANIES
-- ==========================================

-- Campo: company_type (Tipo de empresa)
-- Usado en UI para clasificar el tipo de empresa
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS company_type TEXT DEFAULT 'collection_agency';

-- ==========================================
-- AGREGAR CAMPOS FALTANTES A TABLA USERS
-- ==========================================

-- Campo: oauth_signup (Registro OAuth)
-- Usado en UI para identificar usuarios registrados via OAuth (Google, etc.)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS oauth_signup BOOLEAN DEFAULT FALSE;

-- Campo: needs_profile_completion (Necesita completar perfil)
-- Usado en UI para identificar usuarios que necesitan completar su perfil
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS needs_profile_completion BOOLEAN DEFAULT FALSE;

-- Campo: email_verified (Email verificado)
-- Usado en UI para verificar si el email del usuario ha sido verificado
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- ==========================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ==========================================

COMMENT ON COLUMN companies.company_type IS 'Tipo de empresa (collection_agency, direct_creditor, etc.)';
COMMENT ON COLUMN users.oauth_signup IS 'Indica si el usuario se registró mediante OAuth (Google, etc.)';
COMMENT ON COLUMN users.needs_profile_completion IS 'Indica si el usuario necesita completar su perfil';
COMMENT ON COLUMN users.email_verified IS 'Indica si el email del usuario ha sido verificado';

-- ==========================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ==========================================

-- Índices para campos recién agregados si no existen
CREATE INDEX IF NOT EXISTS idx_companies_company_type ON companies(company_type);
CREATE INDEX IF NOT EXISTS idx_users_oauth_signup ON users(oauth_signup);
CREATE INDEX IF NOT EXISTS idx_users_needs_profile_completion ON users(needs_profile_completion);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- ==========================================
-- VALORES POR DEFECTO PARA DATOS EXISTENTES
-- ==========================================

-- Actualizar datos existentes con valores por defecto lógicos
UPDATE companies 
SET company_type = 'collection_agency' 
WHERE company_type IS NULL;

UPDATE users 
SET oauth_signup = FALSE 
WHERE oauth_signup IS NULL;

UPDATE users 
SET needs_profile_completion = FALSE 
WHERE needs_profile_completion IS NULL AND 
      (full_name IS NOT NULL AND rut IS NOT NULL AND phone IS NOT NULL);

UPDATE users 
SET needs_profile_completion = TRUE 
WHERE needs_profile_completion IS NULL AND 
      (full_name IS NULL OR rut IS NULL OR phone IS NULL);

UPDATE users 
SET email_verified = FALSE 
WHERE email_verified IS NULL;

-- ==========================================
-- VERIFICACIÓN
-- ==========================================

-- Verificar que los campos se hayan agregado correctamente
SELECT 
    'companies.company_type' as campo,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN company_type IS NOT NULL THEN 1 END) as con_valor
FROM companies
UNION ALL
SELECT 
    'users.oauth_signup' as campo,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN oauth_signup IS NOT NULL THEN 1 END) as con_valor
FROM users
UNION ALL
SELECT 
    'users.needs_profile_completion' as campo,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN needs_profile_completion IS NOT NULL THEN 1 END) as con_valor
FROM users
UNION ALL
SELECT 
    'users.email_verified' as campo,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN email_verified IS NOT NULL THEN 1 END) as con_valor
FROM users;

-- ==========================================
-- LOG DE MIGRACIÓN
-- ==========================================

-- Nota: La tabla migration_logs no existe, omitiendo logging
-- La migración se ha completado exitosamente