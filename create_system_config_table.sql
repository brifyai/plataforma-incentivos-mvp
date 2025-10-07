-- =============================================
-- CREAR TABLA SYSTEM_CONFIG
-- Para almacenar configuración del sistema
-- =============================================

-- Crear función update_updated_at_column si no existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear tabla system_config si no existe
CREATE TABLE IF NOT EXISTS public.system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    config_type VARCHAR(20) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_system_config_key ON public.system_config(config_key);
CREATE INDEX IF NOT EXISTS idx_system_config_updated_at ON public.system_config(updated_at DESC);

-- Habilitar RLS
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (usuarios autenticados pueden gestionar configuración)
CREATE POLICY "Authenticated users can view system config" ON public.system_config
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage system config" ON public.system_config
    FOR ALL USING (auth.role() = 'authenticated');

-- Insertar configuración por defecto
INSERT INTO public.system_config (config_key, config_value, config_type, description) VALUES
('oauth_enabled', 'true', 'boolean', 'Habilitar autenticación OAuth con Google'),
('user_validation_enabled', 'true', 'boolean', 'Habilitar validación automática de usuarios'),
('email_notifications_enabled', 'true', 'boolean', 'Habilitar notificaciones por email'),
('push_notifications_enabled', 'false', 'boolean', 'Habilitar notificaciones push (próximamente)'),
('mercado_pago_enabled', 'true', 'boolean', 'Habilitar integración con Mercado Pago'),
('whatsapp_enabled', 'true', 'boolean', 'Habilitar integración con WhatsApp Business'),
('query_limit_per_minute', '1000', 'number', 'Límite de consultas por minuto'),
('backup_frequency', 'daily', 'string', 'Frecuencia de backups automáticos'),
('log_retention_days', '30', 'number', 'Días para retener logs del sistema'),
('system_maintenance_mode', 'false', 'boolean', 'Modo de mantenimiento del sistema')
ON CONFLICT (config_key) DO NOTHING;

-- Trigger para updated_at
CREATE TRIGGER update_system_config_updated_at
    BEFORE UPDATE ON public.system_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FIN DE LA CREACIÓN DE TABLA SYSTEM_CONFIG
-- =============================================