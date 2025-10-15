-- Agregar campos para manejo de OAuth y completación de perfil
-- Migration: add_oauth_fields.sql
-- Created: 2025-10-13

-- Agregar campo para identificar usuarios registrados via OAuth
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS oauth_signup BOOLEAN DEFAULT FALSE;

-- Agregar campo para identificar si el usuario necesita completar su perfil
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS needs_profile_completion BOOLEAN DEFAULT FALSE;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_users_oauth_signup ON users(oauth_signup);
CREATE INDEX IF NOT EXISTS idx_users_needs_profile_completion ON users(needs_profile_completion);

-- Comentarios para documentación
COMMENT ON COLUMN users.oauth_signup IS 'Indica si el usuario se registró mediante OAuth (Google, etc.)';
COMMENT ON COLUMN users.needs_profile_completion IS 'Indica si el usuario necesita completar información del perfil';