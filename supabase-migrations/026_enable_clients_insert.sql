-- 026_enable_clients_insert.sql
-- Habilita políticas RLS para que las empresas puedan insertar sus propios clientes

-- Asegurarse de que RLS esté habilitado (ya lo estaba, pero se deja explícito)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas previas con el mismo nombre para permitir recrearlas idempotentemente
DROP POLICY IF EXISTS "companies_insert_own_clients" ON public.clients;

-- Permitir que la empresa propietaria inserte sus propios clientes
CREATE POLICY "companies_insert_own_clients"
ON public.clients
FOR INSERT
WITH CHECK (
  -- Caso 1: company_id coincide con el UID del usuario autenticado (entornos antiguos)
  auth.uid() = company_id
  OR
  -- Caso 2: la empresa tiene un registro en public.companies cuyo user_id es el UID autenticado (entornos actuales)
  EXISTS (
    SELECT 1
    FROM public.companies c
    WHERE c.id = public.clients.company_id
      AND c.user_id = auth.uid()
  )
);