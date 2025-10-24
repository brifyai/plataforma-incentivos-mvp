/**
 * Script para verificar y aplicar tablas faltantes en la base de datos
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - VITE_SUPABASE_SERVICE_ROLE_KEY o VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Tablas que deberían existir según el esquema inicial
const expectedTables = [
  'users',
  'companies', 
  'consents',
  'debts',
  'offers',
  'agreements',
  'payments',
  'wallet_transactions',
  'notifications',
  'proposals',
  'conversations',
  'messages'
];

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('count')
      .limit(1);

    if (error && error.code === 'PGRST116') {
      return { exists: false, error: error.message };
    }
    
    return { exists: !error, error: error?.message };
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

async function createOffersTable() {
  console.log('🔧 Creando tabla offers...');
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS public.offers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
        company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        offered_amount DECIMAL(15, 2) NOT NULL,
        interest_rate DECIMAL(5, 2),
        payment_plan JSONB,
        validity_days INTEGER DEFAULT 30,
        status VARCHAR(20) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_offers_debt_id ON public.offers(debt_id);
    CREATE INDEX IF NOT EXISTS idx_offers_company_id ON public.offers(company_id);
    CREATE INDEX IF NOT EXISTS idx_offers_user_id ON public.offers(user_id);
    CREATE INDEX IF NOT EXISTS idx_offers_status ON public.offers(status);
    CREATE INDEX IF NOT EXISTS idx_offers_validity ON public.offers(validity_days);

    ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

    CREATE POLICY IF NOT EXISTS "Users can view offers for their debts" ON public.offers
        FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY IF NOT EXISTS "Companies can manage offers from their company" ON public.offers
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.companies
                WHERE companies.id = offers.company_id
                AND companies.user_id = auth.uid()
            )
        );

    CREATE TRIGGER IF NOT EXISTS update_offers_updated_at 
        BEFORE UPDATE ON public.offers
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `;

  try {
    // Intentar ejecutar el SQL directamente (esto puede no funcionar con ANON key)
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      console.warn('⚠️ No se pudo ejecutar SQL directamente:', error.message);
      console.log('📝 La tabla offers necesita ser creada manualmente en el panel de Supabase');
      return false;
    }
    
    console.log('✅ Tabla offers creada exitosamente');
    return true;
  } catch (err) {
    console.warn('⚠️ Error creando tabla offers:', err.message);
    return false;
  }
}

async function main() {
  console.log('🔍 Verificando tablas faltantes en la base de datos...');
  console.log('🔑 Usando key tipo:', supabaseKey === process.env.VITE_SUPABASE_ANON_KEY ? 'ANON_KEY' : 'SERVICE_ROLE_KEY');

  const missingTables = [];
  
  for (const tableName of expectedTables) {
    console.log(`📋 Verificando tabla: ${tableName}`);
    const result = await checkTableExists(tableName);
    
    if (result.exists) {
      console.log(`✅ Tabla ${tableName} existe`);
    } else {
      console.log(`❌ Tabla ${tableName} NO existe - Error: ${result.error}`);
      missingTables.push(tableName);
    }
  }

  if (missingTables.length === 0) {
    console.log('🎉 Todas las tablas esperadas existen en la base de datos');
  } else {
    console.log(`\n⚠️ Tablas faltantes: ${missingTables.join(', ')}`);
    
    if (missingTables.includes('offers')) {
      console.log('\n🔧 Intentando crear tabla offers...');
      const created = await createOffersTable();
      
      if (!created) {
        console.log('\n📝 Instrucciones manuales para crear la tabla offers:');
        console.log('1. Ve al panel de Supabase: https://app.supabase.com');
        console.log('2. Selecciona tu proyecto');
        console.log('3. Ve a SQL Editor');
        console.log('4. Ejecuta el siguiente SQL:');
        console.log(`
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    offered_amount DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(5, 2),
    payment_plan JSONB,
    validity_days INTEGER DEFAULT 30,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offers_debt_id ON public.offers(debt_id);
CREATE INDEX IF NOT EXISTS idx_offers_company_id ON public.offers(company_id);
CREATE INDEX IF NOT EXISTS idx_offers_user_id ON public.offers(user_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON public.offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_validity ON public.offers(validity_days);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view offers for their debts" ON public.offers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Companies can manage offers from their company" ON public.offers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = offers.company_id
            AND companies.user_id = auth.uid()
        )
    );
        `);
      }
    }
  }

  console.log('\n✅ Verificación completada');
}

main().catch(console.error);