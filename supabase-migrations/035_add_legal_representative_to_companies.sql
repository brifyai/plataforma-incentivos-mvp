-- Agregar columnas de representante legal a la tabla companies
-- Migration: 035_add_legal_representative_to_companies.sql

-- Agregar columnas para representante legal
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS legal_representative_name TEXT,
ADD COLUMN IF NOT EXISTS legal_representative_rut TEXT;

-- Agregar comentarios a las nuevas columnas
COMMENT ON COLUMN public.companies.legal_representative_name IS 'Nombre completo del representante legal de la empresa';
COMMENT ON COLUMN public.companies.legal_representative_rut IS 'RUT del representante legal de la empresa';

-- Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_companies_legal_representative_name ON public.companies(legal_representative_name);
CREATE INDEX IF NOT EXISTS idx_companies_legal_representative_rut ON public.companies(legal_representative_rut);

-- Actualizar datos de NexuPay Cobranzas con la información correcta
UPDATE public.companies 
SET 
    legal_representative_name = 'Camilo Alegria',
    legal_representative_rut = '16323735-0',
    updated_at = NOW()
WHERE contact_email = 'empresa@nexupay.cl';

-- Verificar la actualización
SELECT 
    company_name,
    rut,
    legal_representative_name,
    legal_representative_rut,
    contact_phone,
    updated_at
FROM public.companies 
WHERE contact_email = 'empresa@nexupay.cl';