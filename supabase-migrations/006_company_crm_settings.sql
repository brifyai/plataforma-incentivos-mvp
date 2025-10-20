-- Agregar campos de configuración CRM a la tabla companies
-- Cada empresa puede configurar su propio CRM

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS crm_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS crm_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS crm_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS crm_last_sync TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS crm_sync_status VARCHAR(50) DEFAULT 'disconnected';

-- Comentarios para documentación
COMMENT ON COLUMN companies.crm_provider IS 'Proveedor CRM activo (hubspot, salesforce, zoho)';
COMMENT ON COLUMN companies.crm_config IS 'Configuración específica del CRM (tokens, URLs, etc.)';
COMMENT ON COLUMN companies.crm_connected IS 'Indica si la integración CRM está activa';
COMMENT ON COLUMN companies.crm_last_sync IS 'Última sincronización exitosa con el CRM';
COMMENT ON COLUMN companies.crm_sync_status IS 'Estado actual de sincronización (connected, error, syncing)';

-- Crear tabla para historial de sincronización CRM
CREATE TABLE IF NOT EXISTS crm_sync_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    crm_provider VARCHAR(50) NOT NULL,
    sync_type VARCHAR(50) NOT NULL, -- 'full', 'incremental', 'manual'
    status VARCHAR(50) NOT NULL, -- 'success', 'error', 'partial'
    records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_crm_sync_history_company_id ON crm_sync_history(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_sync_history_started_at ON crm_sync_history(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_companies_crm_provider ON companies(crm_provider) WHERE crm_provider IS NOT NULL;

-- Comentarios
COMMENT ON TABLE crm_sync_history IS 'Historial de sincronizaciones CRM por empresa';
COMMENT ON COLUMN crm_sync_history.company_id IS 'Empresa que realizó la sincronización';
COMMENT ON COLUMN crm_sync_history.crm_provider IS 'Proveedor CRM utilizado';
COMMENT ON COLUMN crm_sync_history.sync_type IS 'Tipo de sincronización realizada';
COMMENT ON COLUMN crm_sync_history.status IS 'Estado final de la sincronización';
COMMENT ON COLUMN crm_sync_history.records_processed IS 'Total de registros procesados';
COMMENT ON COLUMN crm_sync_history.records_created IS 'Registros nuevos creados';
COMMENT ON COLUMN crm_sync_history.records_updated IS 'Registros existentes actualizados';
COMMENT ON COLUMN crm_sync_history.records_failed IS 'Registros que fallaron';
COMMENT ON COLUMN crm_sync_history.error_message IS 'Mensaje de error si aplica';
COMMENT ON COLUMN crm_sync_history.started_at IS 'Fecha/hora de inicio';
COMMENT ON COLUMN crm_sync_history.completed_at IS 'Fecha/hora de finalización';

-- Políticas RLS para crm_sync_history
ALTER TABLE crm_sync_history ENABLE ROW LEVEL SECURITY;

-- Solo la empresa propietaria puede ver su historial
CREATE POLICY "Users can view their company CRM sync history" ON crm_sync_history
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

-- Solo la empresa propietaria puede insertar su historial
CREATE POLICY "Users can insert their company CRM sync history" ON crm_sync_history
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

-- Políticas RLS para campos CRM en companies
-- Solo la empresa puede ver/modificar su configuración CRM
CREATE POLICY "Users can view their company CRM config" ON companies
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their company CRM config" ON companies
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());