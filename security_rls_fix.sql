-- =============================================
-- SECURITY RLS POLICIES FIX - Migración de seguridad
-- Corrige políticas RLS con mejores prácticas de seguridad
-- =============================================

-- =============================================
-- FUNCIONES HELPER PARA RLS
-- =============================================

-- Función para verificar si el usuario es administrador
CREATE OR REPLACE FUNCTION auth.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id AND role = 'god_mode'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario es empresa
CREATE OR REPLACE FUNCTION auth.is_company(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.companies
    WHERE user_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener el ID de empresa del usuario
CREATE OR REPLACE FUNCTION auth.get_company_id(user_id UUID DEFAULT auth.uid())
RETURNS UUID AS $$
DECLARE
  company_id UUID;
BEGIN
  SELECT id INTO company_id
  FROM public.companies
  WHERE user_id = user_id;

  RETURN company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- RECREAR POLÍTICAS RLS MÁS SEGUROS
-- =============================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Companies can view their own profile" ON public.companies;
DROP POLICY IF EXISTS "Companies can update their own profile" ON public.companies;
DROP POLICY IF EXISTS "Companies can insert their own profile" ON public.companies;
DROP POLICY IF EXISTS "Users can view their own consents" ON public.consents;
DROP POLICY IF EXISTS "Companies can view consents for their company" ON public.consents;
DROP POLICY IF EXISTS "Users can view their own debts" ON public.debts;
DROP POLICY IF EXISTS "Companies can view debts from their company" ON public.debts;
DROP POLICY IF EXISTS "Users can view offers for their debts" ON public.offers;
DROP POLICY IF EXISTS "Companies can manage offers from their company" ON public.offers;
DROP POLICY IF EXISTS "Users can view their own agreements" ON public.agreements;
DROP POLICY IF EXISTS "Companies can view agreements from their company" ON public.agreements;
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Companies can view payments from their company" ON public.payments;
DROP POLICY IF EXISTS "Users can view their own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can update their own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can view their own wallet transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Companies can view conversations for their company" ON public.conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Companies can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Companies can send messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can view their payment preferences" ON public.payment_preferences;
DROP POLICY IF EXISTS "Users can view their transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view their payment history" ON public.payment_history;

-- =============================================
-- POLÍTICAS PARA USERS
-- =============================================

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil (excepto campos sensibles)
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (OLD.role = NEW.role OR auth.is_admin()) -- Solo admin puede cambiar roles
    AND (OLD.validation_status = NEW.validation_status OR auth.is_admin()) -- Solo admin puede cambiar validación
  );

-- Los usuarios pueden insertar su propio perfil (registro)
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Los administradores pueden ver todos los usuarios
CREATE POLICY "users_select_admin" ON public.users
  FOR SELECT USING (auth.is_admin());

-- Los administradores pueden actualizar cualquier usuario
CREATE POLICY "users_update_admin" ON public.users
  FOR UPDATE USING (auth.is_admin());

-- =============================================
-- POLÍTICAS PARA COMPANIES
-- =============================================

-- Las empresas pueden ver su propio perfil
CREATE POLICY "companies_select_own" ON public.companies
  FOR SELECT USING (auth.uid() = user_id);

-- Las empresas pueden actualizar su propio perfil
CREATE POLICY "companies_update_own" ON public.companies
  FOR UPDATE USING (auth.uid() = user_id);

-- Las empresas pueden insertar su propio perfil
CREATE POLICY "companies_insert_own" ON public.companies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Los administradores pueden gestionar todas las empresas
CREATE POLICY "companies_admin" ON public.companies
  FOR ALL USING (auth.is_admin());

-- =============================================
-- POLÍTICAS PARA CONSENTS
-- =============================================

-- Los usuarios pueden ver sus propios consentimientos
CREATE POLICY "consents_select_own" ON public.consents
  FOR SELECT USING (auth.uid() = user_id);

-- Las empresas pueden ver consentimientos de su empresa
CREATE POLICY "consents_select_company" ON public.consents
  FOR SELECT USING (company_id = auth.get_company_id());

-- Los administradores pueden ver todos los consentimientos
CREATE POLICY "consents_admin" ON public.consents
  FOR ALL USING (auth.is_admin());

-- =============================================
-- POLÍTICAS PARA DEBTS
-- =============================================

-- Los usuarios pueden ver sus propias deudas
CREATE POLICY "debts_select_own" ON public.debts
  FOR SELECT USING (auth.uid() = user_id);

-- Las empresas pueden ver deudas de su empresa
CREATE POLICY "debts_select_company" ON public.debts
  FOR SELECT USING (company_id = auth.get_company_id());

-- Las empresas pueden gestionar deudas de su empresa
CREATE POLICY "debts_company_manage" ON public.debts
  FOR ALL USING (company_id = auth.get_company_id());

-- Los administradores pueden ver todas las deudas
CREATE POLICY "debts_admin" ON public.debts
  FOR ALL USING (auth.is_admin());

-- =============================================
-- POLÍTICAS PARA OFFERS
-- =============================================

-- Los usuarios pueden ver ofertas para sus deudas
CREATE POLICY "offers_select_own" ON public.offers
  FOR SELECT USING (auth.uid() = user_id);

-- Las empresas pueden gestionar ofertas de su empresa
CREATE POLICY "offers_company_manage" ON public.offers
  FOR ALL USING (company_id = auth.get_company_id());

-- Los administradores pueden ver todas las ofertas
CREATE POLICY "offers_admin" ON public.offers
  FOR ALL USING (auth.is_admin());

-- =============================================
-- POLÍTICAS PARA AGREEMENTS
-- =============================================

-- Los usuarios pueden ver sus propios acuerdos
CREATE POLICY "agreements_select_own" ON public.agreements
  FOR SELECT USING (auth.uid() = user_id);

-- Las empresas pueden ver acuerdos de su empresa
CREATE POLICY "agreements_select_company" ON public.agreements
  FOR SELECT USING (company_id = auth.get_company_id());

-- Los administradores pueden ver todos los acuerdos
CREATE POLICY "agreements_admin" ON public.agreements
  FOR ALL USING (auth.is_admin());

-- =============================================
-- POLÍTICAS PARA PAYMENTS
-- =============================================

-- Los usuarios pueden ver sus propios pagos
CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

-- Las empresas pueden ver pagos de su empresa
CREATE POLICY "payments_select_company" ON public.payments
  FOR SELECT USING (company_id = auth.get_company_id());

-- Los administradores pueden ver todos los pagos
CREATE POLICY "payments_admin" ON public.payments
  FOR ALL USING (auth.is_admin());

-- =============================================
-- POLÍTICAS PARA WALLETS
-- =============================================

-- Los usuarios pueden ver su propia wallet
CREATE POLICY "wallets_select_own" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

-- Los usuarios pueden actualizar su propia wallet
CREATE POLICY "wallets_update_own" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id);

-- Los administradores pueden gestionar todas las wallets
CREATE POLICY "wallets_admin" ON public.wallets
  FOR ALL USING (auth.is_admin());

-- =============================================
-- POLÍTICAS PARA WALLET_TRANSACTIONS
-- =============================================

-- Los usuarios pueden ver sus propias transacciones
CREATE POLICY "wallet_transactions_select_own" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Los administradores pueden ver todas las transacciones
CREATE POLICY "wallet_transactions_admin" ON public.wallet_transactions
  FOR ALL USING (auth.is_admin());

-- =============================================
-- POLÍTICAS PARA NOTIFICATIONS
-- =============================================

-- Los usuarios pueden ver sus propias notificaciones
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus propias notificaciones
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Los administradores pueden gestionar todas las notificaciones
CREATE POLICY "notifications_admin" ON public.notifications
  FOR ALL USING (auth.is_admin());

-- =============================================
-- POLÍTICAS PARA CONVERSATIONS
-- =============================================

-- Los usuarios pueden ver sus propias conversaciones
CREATE POLICY "conversations_select_own" ON public.conversations
  FOR SELECT USING (auth.uid() = user_id);

-- Las empresas pueden ver conversaciones de su empresa
CREATE POLICY "conversations_select_company" ON public.conversations
  FOR SELECT USING (company_id = auth.get_company_id());

-- Los administradores pueden ver todas las conversaciones
CREATE POLICY "conversations_admin" ON public.conversations
  FOR ALL USING (auth.is_admin());

-- =============================================
-- POLÍTICAS PARA MESSAGES
-- =============================================

-- Los usuarios pueden ver mensajes en sus conversaciones
CREATE POLICY "messages_select_own" ON public.messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
  );

-- Las empresas pueden ver mensajes en conversaciones de su empresa
CREATE POLICY "messages_select_company" ON public.messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE company_id = auth.get_company_id()
    )
  );

-- Los usuarios pueden enviar mensajes en sus conversaciones
CREATE POLICY "messages_insert_own" ON public.messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
    AND sender_type = 'user'
  );

-- Las empresas pueden enviar mensajes en conversaciones de su empresa
CREATE POLICY "messages_insert_company" ON public.messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE company_id = auth.get_company_id()
    )
    AND sender_type = 'company'
  );

-- Los administradores pueden gestionar todos los mensajes
CREATE POLICY "messages_admin" ON public.messages
  FOR ALL USING (auth.is_admin());

-- =============================================
-- POLÍTICAS PARA TABLAS ADICIONALES
-- =============================================

-- Payment preferences
CREATE POLICY "payment_preferences_select_own" ON public.payment_preferences
  FOR SELECT USING (auth.uid() = debtor_id);

CREATE POLICY "payment_preferences_admin" ON public.payment_preferences
  FOR ALL USING (auth.is_admin());

-- Transactions
CREATE POLICY "transactions_select_own" ON public.transactions
  FOR SELECT USING (
    metadata->>'debtor_id' = auth.uid()::text
  );

CREATE POLICY "transactions_admin" ON public.transactions
  FOR ALL USING (auth.is_admin());

-- Payment history
CREATE POLICY "payment_history_select_own" ON public.payment_history
  FOR SELECT USING (auth.uid() = debtor_id);

CREATE POLICY "payment_history_admin" ON public.payment_history
  FOR ALL USING (auth.is_admin());

-- =============================================
-- VERIFICACIÓN FINAL
-- =============================================

-- Verificar que todas las tablas tienen RLS habilitado
DO $$
DECLARE
  table_record RECORD;
  tables_without_rls TEXT[] := ARRAY[]::TEXT[];
BEGIN
  FOR table_record IN
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename NOT IN ('schema_migrations', 'spatial_ref_sys')
  LOOP
    -- Verificar si RLS está habilitado
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = table_record.tablename
      AND n.nspname = table_record.schemaname
      AND c.relrowsecurity = true
    ) THEN
      tables_without_rls := array_append(tables_without_rls, table_record.tablename);
    END IF;
  END LOOP;

  IF array_length(tables_without_rls, 1) > 0 THEN
    RAISE WARNING 'Las siguientes tablas no tienen RLS habilitado: %', tables_without_rls;
  ELSE
    RAISE NOTICE '✅ Todas las tablas tienen RLS habilitado correctamente';
  END IF;
END $$;

-- =============================================
-- FIN DE LA MIGRACIÓN DE SEGURIDAD RLS
-- =============================================