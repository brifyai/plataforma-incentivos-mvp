import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Cargar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env') });

// Configuración de Supabase desde las variables de entorno
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔑 Usando Supabase URL:', supabaseUrl);
console.log('🔑 API Key disponible:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

async function createClientsTable() {
  try {
    console.log('🔄 Creando tabla clients...');
    
    // Primero verificar si la tabla ya existe
    const { data: existingTable, error: checkError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ La tabla clients ya existe');
      return;
    }
    
    // Si la tabla no existe, intentar crearla usando el endpoint SQL
    const createTableSQL = `
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
      
      CREATE INDEX idx_clients_company_id ON public.clients(company_id);
      CREATE INDEX idx_clients_business_name ON public.clients(business_name);
      CREATE INDEX idx_clients_rut ON public.clients(rut);
      CREATE INDEX idx_clients_status ON public.clients(status);
      CREATE INDEX idx_clients_corporate_client_id ON public.clients(corporate_client_id);
      
      ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
      
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
      
      CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;
    
    console.log('⚠️  Nota: La migración debe ejecutarse manualmente en el panel de Supabase');
    console.log('📋 SQL para ejecutar manualmente:');
    console.log(createTableSQL);
    
    // Intentar crear un registro de prueba para verificar si la tabla existe
    const testData = {
      company_id: '30511718-f4dc-4cbe-ba7f-4a2f563d38c5', // ID de empresa de ejemplo
      business_name: 'Cliente Test',
      contact_email: 'test@example.com'
    };
    
    const { data, error } = await supabase
      .from('clients')
      .insert(testData)
      .select()
      .single();
    
    if (error) {
      console.log('❌ La tabla clients no existe o hay un error de permisos:', error.message);
      console.log('🔧 Solución: Ejecuta el SQL anterior en el panel de Supabase > SQL Editor');
    } else {
      console.log('✅ Tabla clients funciona correctamente');
      console.log('📋 Datos de prueba creados:', data);
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

createClientsTable();