-- Script para corregir los datos de NexuPay Cobranzas
-- Actualizar RUT de la empresa y datos del representante legal

-- Actualizar datos de la empresa NexuPay Cobranzas
UPDATE public.companies 
SET 
    company_name = 'NexuPay Cobranzas',
    rut = '78179864-9',
    legal_representative_name = 'Camilo Alegria',
    legal_representative_rut = '16323735-0',
    contact_phone = '+56966685967',
    updated_at = NOW()
WHERE contact_email = 'empresa@nexupay.cl';

-- Verificar los cambios
SELECT 
    id,
    company_name,
    rut,
    legal_representative_name,
    legal_representative_rut,
    contact_email,
    contact_phone,
    updated_at
FROM public.companies 
WHERE contact_email = 'empresa@nexupay.cl';

-- Mostrar mensaje de confirmación
SELECT '✅ Datos de NexuPay Cobranzas actualizados correctamente:' as mensaje UNION ALL
SELECT '   • RUT Empresa: 78179864-9' UNION ALL
SELECT '   • Representante Legal: Camilo Alegria' UNION ALL
SELECT '   • RUT Representante: 16323735-0' UNION ALL
SELECT '   • Teléfono: +56966685967';