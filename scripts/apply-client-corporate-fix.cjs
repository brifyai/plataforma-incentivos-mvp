const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function applyClientCorporateFix() {
  console.log('🔧 Aplicando fix para columnas de clientes corporativos...');
  
  // Configuración de Supabase
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Faltan variables de entorno de Supabase');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    console.log('📊 Ejecutando SQL para agregar columnas faltantes...');
    
    // SQL para agregar las columnas
    const sqlStatements = [
      // Agregar client_id a debts si no existe
      `DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'debts' 
        AND column_name = 'client_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE debts ADD COLUMN client_id UUID REFERENCES clients(id);
        RAISE NOTICE 'Columna client_id agregada a debts';
    ELSE
        RAISE NOTICE 'Columna client_id ya existe en debts';
    END IF;
END $$;`,
      
      // Agregar corporate_client_id a clients si no existe
      `DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'corporate_client_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE clients ADD COLUMN corporate_client_id UUID REFERENCES corporate_clients(id);
        RAISE NOTICE 'Columna corporate_client_id agregada a clients';
    ELSE
        RAISE NOTICE 'Columna corporate_client_id ya existe en clients';
    END IF;
END $$;`,
      
      // Crear índices
      `CREATE INDEX IF NOT EXISTS idx_debts_client_id ON debts(client_id);`,
      `CREATE INDEX IF NOT EXISTS idx_clients_corporate_client_id ON clients(corporate_client_id);`
    ];
    
    // Ejecutar cada statement
    for (const sql of sqlStatements) {
      console.log('🔄 Ejecutando:', sql.substring(0, 50) + '...');
      
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        console.error('❌ Error en SQL:', error);
        
        // Si el RPC no existe, intentar con SQL directo
        console.log('🔄 Intentando ejecución directa...');
        const { data: data2, error: error2 } = await supabase
          .from('_temp_execution')
          .select('*')
          .limit(1);
          
        if (error2 && error2.message.includes('does not exist')) {
          console.log('⚠️ El RPC exec_sql no está disponible. Por favor ejecute el SQL manualmente:');
          console.log('\n' + '='.repeat(60));
          console.log('SQL PARA EJECUTAR MANUALMENTE EN SUPABASE:');
          console.log('='.repeat(60));
          console.log('-- Add client_id column to debts table');
          console.log('ALTER TABLE debts ADD COLUMN client_id UUID REFERENCES clients(id);');
          console.log('');
          console.log('-- Add corporate_client_id column to clients table');
          console.log('ALTER TABLE clients ADD COLUMN corporate_client_id UUID REFERENCES corporate_clients(id);');
          console.log('');
          console.log('-- Create indexes');
          console.log('CREATE INDEX IF NOT EXISTS idx_debts_client_id ON debts(client_id);');
          console.log('CREATE INDEX IF NOT EXISTS idx_clients_corporate_client_id ON clients(corporate_client_id);');
          console.log('='.repeat(60));
          return;
        }
        
        throw error2;
      }
      
      console.log('✅ SQL ejecutado correctamente');
    }
    
    console.log('\n🎉 Fix aplicado exitosamente!');
    console.log('📋 Columnas agregadas:');
    console.log('   ✅ debts.client_id');
    console.log('   ✅ clients.corporate_client_id');
    console.log('   ✅ Índices creados');
    
  } catch (error) {
    console.error('❌ Error aplicando el fix:', error.message);
    console.log('\n📋 Por favor ejecute el SQL manualmente en Supabase:');
    console.log('https://app.supabase.com/project/wvluqdldygmgncqqjkow/sql');
    
    process.exit(1);
  }
}

applyClientCorporateFix();