-- Función para crear empresas durante registro OAuth (sin restricciones RLS)
CREATE OR REPLACE FUNCTION create_company_for_oauth(
    p_user_id UUID,
    p_business_name TEXT,
    p_rut TEXT,
    p_contact_email TEXT,
    p_contact_phone TEXT DEFAULT NULL,
    p_company_type TEXT DEFAULT 'collection_agency'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    company_id UUID;
BEGIN
    -- Verificar que el usuario existe
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'Usuario no encontrado';
    END IF;

    -- Verificar que no existe ya una empresa para este usuario
    IF EXISTS (SELECT 1 FROM public.companies WHERE user_id = p_user_id) THEN
        RAISE EXCEPTION 'El usuario ya tiene una empresa registrada';
    END IF;

    -- Crear la empresa
    INSERT INTO public.companies (
        user_id,
        business_name,
        rut,
        contact_email,
        contact_phone,
        company_type,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_business_name,
        p_rut,
        p_contact_email,
        p_contact_phone,
        p_company_type,
        NOW(),
        NOW()
    ) RETURNING id INTO company_id;

    RETURN company_id;
END;
$$;

-- Otorgar permisos para que los usuarios autenticados puedan usar la función
GRANT EXECUTE ON FUNCTION create_company_for_oauth(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;