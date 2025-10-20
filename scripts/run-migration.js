const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// SQL de la migración
const migrationSQL = `
-- =============================================
-- TABLA: clients
-- Clientes de las empresas de cobranza
-- =============================================

CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    rut VARCHAR(12),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    contact_name VARCHAR(255),
    industry VARCHAR(100),
    address TEXT,
    status VARCHAR(20) DEFAULT 'active',
    corporate_client_id UUID REFERENCES public.corporate_clients(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para clients
CREATE INDEX idx_clients_company_id ON public.clients(company_id);
CREATE INDEX idx_clients_business_name ON public.clients(business_name);
CREATE INDEX idx_clients_rut ON public.clients(rut);
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_corporate_client_id ON public.clients(corporate_client_id);

-- Habilitar RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Políticas para clients
CREATE POLICY "Companies can view their own clients" ON public.clients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = clients.company_id
            AND companies.user_id = auth.uid()
        )
    );

CREATE POLICY "Companies can manage their own clients" ON public.clients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = clients.company_id
            AND companies.user_id = auth.uid()
        )
    );

-- Trigger para updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

async function runMigration() {
  try {
    console.log('🔄 Ejecutando migración de tabla clients...');
    
    // Ejecutar la migración usando RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Error ejecutando migración:', error);
      
      // Si el RPC no funciona, intentar con SQL directo
      console.log('🔄 Intentando ejecutar SQL directamente...');
      
      // Dividir el SQL en sentencias individuales
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        console.log('🔄 Ejecutando:', statement.substring(0, 100) + '...');
        
        const { error: stmtError } = await supabase
          .from('clients')
          .select('*')
          .limit(1); // Esto fallará si la tabla no existe
        
        if (stmtError && stmtError.code === 'PGRST116') {
          // La tabla no existe, intentar crearla
          const { error: createError } = await supabase
            .rpc('exec_sql', { sql: statement });
          
          if (createError) {
            console.error('❌ Error en sentencia:', createError);
          } else {
            console.log('✅ Sentencia ejecutada correctamente');
          }
        }
      }
    } else {
      console.log('✅ Migración ejecutada exitosamente');
    }
    
    // Verificar que la tabla existe
    const { data: testData, error: testError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error verificando tabla:', testError);
    } else {
      console.log('✅ Tabla clients verificada y funcionando');
    }
    
  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

runMigration();