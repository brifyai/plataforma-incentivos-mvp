-- =============================================
-- Agregar columna email_verified a tabla users
-- =============================================

-- Agregar columna email_verified si no existe
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Agregar columna phone_verified si no existe (para consistencia)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON public.users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_phone_verified ON public.users(phone_verified);

-- Comentarios para documentación
COMMENT ON COLUMN public.users.email_verified IS 'Indica si el email del usuario ha sido verificado';
COMMENT ON COLUMN public.users.phone_verified IS 'Indica si el teléfono del usuario ha sido verificado';