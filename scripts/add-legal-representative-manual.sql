
-- Agregar columnas de representante legal a la tabla companies
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS legal_representative_name TEXT,
ADD COLUMN IF NOT EXISTS legal_representative_rut TEXT;

-- Actualizar datos de NexuPay Cobranzas
UPDATE public.companies 
SET 
    legal_representative_name = 'Camilo Alegria',
    legal_representative_rut = '16323735-0',
    updated_at = NOW()
WHERE contact_email = 'empresa@nexupay.cl';

-- Verificar resultados
SELECT 
    company_name,
    rut,
    contact_phone,
    legal_representative_name,
    legal_representative_rut,
    updated_at
FROM public.companies 
WHERE contact_email = 'empresa@nexupay.cl';
      