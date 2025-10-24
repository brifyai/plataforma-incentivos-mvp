-- =============================================
-- TRIGGERS PARA SINCRONIZACIÓN AUTOMÁTICA
-- Previene inconsistencias entre debts, clients y estados
-- =============================================

-- 1. Trigger para crear automáticamente un cliente cuando se crea una deuda
CREATE OR REPLACE FUNCTION create_client_on_debt_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar si ya existe un cliente para este deudor y empresa
    IF NOT EXISTS (
        SELECT 1 FROM public.clients 
        WHERE company_id = NEW.company_id 
        AND rut = (SELECT rut FROM public.users WHERE id = NEW.user_id)
    ) THEN
        -- Crear automáticamente el registro en clients
        INSERT INTO public.clients (
            company_id,
            business_name,
            rut,
            contact_email,
            contact_phone,
            created_at,
            updated_at
        )
        SELECT 
            NEW.company_id,
            u.full_name,
            u.rut,
            u.email,
            u.phone,
            NOW(),
            NOW()
        FROM public.users u
        WHERE u.id = NEW.user_id;
        
        RAISE LOG 'Cliente creado automáticamente para usuario %, empresa %', NEW.user_id, NEW.company_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_create_client_on_debt_insert ON public.debts;
CREATE TRIGGER trigger_create_client_on_debt_insert
    AFTER INSERT ON public.debts
    FOR EACH ROW
    EXECUTE FUNCTION create_client_on_debt_insert();

-- 2. Trigger para sincronizar estados de verificación
CREATE OR REPLACE FUNCTION sync_verification_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se actualiza users.validation_status, sincronizar con companies
    IF TG_TABLE_NAME = 'users' AND NEW.validation_status != OLD.validation_status THEN
        UPDATE public.companies 
        SET validation_status = NEW.validation_status,
            updated_at = NOW()
        WHERE user_id = NEW.id;
        
        -- También sincronizar con company_verifications si existe
        UPDATE public.company_verifications 
        SET status = CASE 
            WHEN NEW.validation_status = 'validated' THEN 'approved'
            WHEN NEW.validation_status = 'pending' THEN 'under_review'
            WHEN NEW.validation_status = 'rejected' THEN 'rejected'
            ELSE NEW.validation_status
        END,
        updated_at = NOW()
        WHERE company_id = (SELECT id FROM public.companies WHERE user_id = NEW.id);
        
        RAISE LOG 'Estados sincronizados para usuario %: %', NEW.id, NEW.validation_status;
    END IF;
    
    -- Si se actualiza companies.validation_status, sincronizar con users
    IF TG_TABLE_NAME = 'companies' AND NEW.validation_status != OLD.validation_status THEN
        UPDATE public.users 
        SET validation_status = NEW.validation_status,
            updated_at = NOW()
        WHERE id = NEW.user_id;
        
        -- También sincronizar con company_verifications
        UPDATE public.company_verifications 
        SET status = CASE 
            WHEN NEW.validation_status = 'validated' THEN 'approved'
            WHEN NEW.validation_status = 'pending' THEN 'under_review'
            WHEN NEW.validation_status = 'rejected' THEN 'rejected'
            ELSE NEW.validation_status
        END,
        updated_at = NOW()
        WHERE company_id = NEW.id;
        
        RAISE LOG 'Estados sincronizados para empresa %: %', NEW.id, NEW.validation_status;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para sincronización de estados
DROP TRIGGER IF EXISTS trigger_sync_user_verification ON public.users;
CREATE TRIGGER trigger_sync_user_verification
    AFTER UPDATE ON public.users
    FOR EACH ROW
    WHEN (OLD.validation_status IS DISTINCT FROM NEW.validation_status)
    EXECUTE FUNCTION sync_verification_status();

DROP TRIGGER IF EXISTS trigger_sync_company_verification ON public.companies;
CREATE TRIGGER trigger_sync_company_verification
    AFTER UPDATE ON public.companies
    FOR EACH ROW
    WHEN (OLD.validation_status IS DISTINCT FROM NEW.validation_status)
    EXECUTE FUNCTION sync_verification_status();

-- 3. Función para sincronización masiva (para datos existentes)
CREATE OR REPLACE FUNCTION sync_all_debtors_to_clients()
RETURNS TABLE(
    company_name TEXT,
    debtors_synced INTEGER,
    errors TEXT
) AS $$
DECLARE
    company_record RECORD;
    debtor_record RECORD;
    sync_count INTEGER;
    error_msg TEXT;
BEGIN
    -- Iterar sobre todas las empresas
    FOR company_record IN 
        SELECT id, company_name FROM public.companies
    LOOP
        sync_count := 0;
        error_msg := NULL;
        
        BEGIN
            -- Obtener todos los deudores únicos de esta empresa
            FOR debtor_record IN
                SELECT DISTINCT 
                    d.user_id,
                    u.full_name,
                    u.rut,
                    u.email,
                    u.phone
                FROM public.debts d
                JOIN public.users u ON d.user_id = u.id
                WHERE d.company_id = company_record.id
            LOOP
                -- Verificar si ya existe como cliente
                IF NOT EXISTS (
                    SELECT 1 FROM public.clients 
                    WHERE company_id = company_record.id 
                    AND rut = debtor_record.rut
                ) THEN
                    -- Crear cliente
                    INSERT INTO public.clients (
                        company_id,
                        business_name,
                        rut,
                        contact_email,
                        contact_phone,
                        created_at,
                        updated_at
                    ) VALUES (
                        company_record.id,
                        debtor_record.full_name,
                        debtor_record.rut,
                        debtor_record.email,
                        debtor_record.phone,
                        NOW(),
                        NOW()
                    );
                    
                    sync_count := sync_count + 1;
                END IF;
            END LOOP;
            
        EXCEPTION WHEN OTHERS THEN
            error_msg := SQLERRM;
        END;
        
        -- Retornar resultados para esta empresa
        RETURN NEXT;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- 4. Función para verificar consistencia del sistema
CREATE OR REPLACE FUNCTION check_system_consistency()
RETURNS TABLE(
    check_type TEXT,
    total_issues BIGINT,
    details JSONB
) AS $$
BEGIN
    -- Verificar deudores sin registro en clients
    RETURN QUERY
    SELECT 
        'debtors_without_clients'::TEXT,
        COUNT(*)::BIGINT,
        jsonb_agg(
            jsonb_build_object(
                'debtor_id', d.user_id,
                'debtor_name', u.full_name,
                'debtor_rut', u.rut,
                'company_id', d.company_id,
                'company_name', c.company_name
            )
        )
    FROM public.debts d
    JOIN public.users u ON d.user_id = u.id
    JOIN public.companies c ON d.company_id = c.id
    LEFT JOIN public.clients cl ON d.company_id = cl.company_id AND u.rut = cl.rut
    WHERE cl.id IS NULL;
    
    -- Verificar inconsistencias en estados de verificación
    RETURN QUERY
    SELECT 
        'verification_status_inconsistencies'::TEXT,
        COUNT(*)::BIGINT,
        jsonb_agg(
            jsonb_build_object(
                'user_id', u.id,
                'user_email', u.email,
                'user_status', u.validation_status,
                'company_status', c.validation_status,
                'verification_status', cv.status
            )
        )
    FROM public.users u
    JOIN public.companies c ON u.id = c.user_id
    LEFT JOIN public.company_verifications cv ON c.id = cv.company_id
    WHERE 
        u.validation_status != c.validation_status
        OR (cv.status IS NOT NULL AND 
            cv.status != CASE 
                WHEN u.validation_status = 'validated' THEN 'approved'
                WHEN u.validation_status = 'pending' THEN 'under_review'
                WHEN u.validation_status = 'rejected' THEN 'rejected'
                ELSE u.validation_status
            END);
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- 5. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_debts_user_company ON public.debts(user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_clients_company_rut ON public.clients(company_id, rut);

-- =============================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =============================================

COMMENT ON FUNCTION create_client_on_debt_insert() IS 'Crea automáticamente un registro en clients cuando se inserta una nueva deuda';
COMMENT ON FUNCTION sync_verification_status() IS 'Sincroniza los estados de verificación entre users, companies y company_verifications';
COMMENT ON FUNCTION sync_all_debtors_to_clients() IS 'Sincroniza masivamente todos los deudores existentes a la tabla clients';
COMMENT ON FUNCTION check_system_consistency() IS 'Verifica la consistencia del sistema y reporta problemas';

-- =============================================
-- FIN DE LA MIGRACIÓN
-- =============================================