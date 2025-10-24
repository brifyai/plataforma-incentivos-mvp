const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Faltan variables de entorno:');
    console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
    console.error('   VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyAndInstruct() {
    console.log('🔍 Verificando estado actual de las columnas...');
    
    try {
        // Verificar si las columnas existen usando information_schema
        const { data: columns, error: columnsError } = await supabase
            .from('information_schema.columns')
            .select('table_name, column_name')
            .eq('table_schema', 'public')
            .in('table_name', ['debts', 'clients'])
            .in('column_name', ['client_id', 'corporate_client_id']);
        
        if (columnsError) {
            console.error('❌ Error verificando columnas:', columnsError.message);
            console.log('\n📋 INSTRUCCIONES MANUALES:');
            console.log('1. Ve a: https://app.supabase.com/project/wvluqdldygmgncqqjkow/sql');
            console.log('2. Ejecuta este SQL para agregar las columnas faltantes:');
            console.log('\n-- Agregar client_id a debts');
            console.log('ALTER TABLE debts ADD COLUMN client_id UUID REFERENCES clients(id);');
            console.log('\n-- Agregar corporate_client_id a clients');
            console.log('ALTER TABLE clients ADD COLUMN corporate_client_id UUID REFERENCES corporate_clients(id);');
            return;
        }
        
        console.log('📋 Columnas encontradas:', columns);
        
        const hasClientId = columns.some(c => c.table_name === 'debts' && c.column_name === 'client_id');
        const hasCorporateClientId = columns.some(c => c.table_name === 'clients' && c.column_name === 'corporate_client_id');
        
        console.log(`\n📊 ESTADO ACTUAL:`);
        console.log(`   client_id en debts: ${hasClientId ? '✅ EXISTE' : '❌ FALTA'}`);
        console.log(`   corporate_client_id en clients: ${hasCorporateClientId ? '✅ EXISTE' : '❌ FALTA'}`);
        
        if (!hasClientId || !hasCorporateClientId) {
            console.log('\n🔧 ACCIONES REQUERIDAS:');
            console.log('1. Ve a: https://app.supabase.com/project/wvluqdldygmgncqqjkow/sql');
            console.log('2. Copia y ejecuta el SQL necesario:\n');
            
            if (!hasClientId) {
                console.log('-- Agregar client_id a debts');
                console.log('ALTER TABLE debts ADD COLUMN client_id UUID REFERENCES clients(id);\n');
            }
            
            if (!hasCorporateClientId) {
                console.log('-- Agregar corporate_client_id a clients');
                console.log('ALTER TABLE clients ADD COLUMN corporate_client_id UUID REFERENCES corporate_clients(id);\n');
            }
            
            console.log('3. Después de ejecutar el SQL, verifica con:');
            console.log('   node scripts/check-client-debt-structure.cjs');
            
        } else {
            console.log('\n✅ AMBAS COLUMNAS EXISTEN - El problema debería estar resuelto');
            console.log('🔄 Si los clientes corporativos aún no funcionan, reinicia el servidor:');
            console.log('   taskkill /F /IM node.exe 2>nul & timeout /t 2 >nul & npm run dev -- --port 3002');
        }
        
        // Verificar también las tablas base
        console.log('\n🔍 Verificando tablas base...');
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .in('table_name', ['debts', 'clients', 'corporate_clients']);
        
        if (tablesError) {
            console.error('❌ Error verificando tablas:', tablesError.message);
        } else {
            const tableNames = tables.map(t => t.table_name);
            console.log('📋 Tablas encontradas:', tableNames);
            
            const hasDebts = tableNames.includes('debts');
            const hasClients = tableNames.includes('clients');
            const hasCorporateClients = tableNames.includes('corporate_clients');
            
            console.log('\n📊 ESTADO TABLAS:');
            console.log(`   debts: ${hasDebts ? '✅' : '❌'}`);
            console.log(`   clients: ${hasClients ? '✅' : '❌'}`);
            console.log(`   corporate_clients: ${hasCorporateClients ? '✅' : '❌'}`);
            
            if (!hasDebts || !hasClients || !hasCorporateClients) {
                console.log('\n⚠️ Faltan tablas base - Esto es más grave y requiere atención inmediata');
            }
        }
        
    } catch (error) {
        console.error('❌ Error general:', error.message);
        console.log('\n📋 INSTRUCCIONES MANUALES DE EMERGENCIA:');
        console.log('1. Ve a: https://app.supabase.com/project/wvluqdldygmgncqqjkow/sql');
        console.log('2. Ejecuta este SQL completo:');
        console.log(`
-- Verificar y agregar columnas faltantes
DO $$
BEGIN
    -- Agregar client_id a debts si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'debts' 
        AND column_name = 'client_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE debts ADD COLUMN client_id UUID REFERENCES clients(id);
        RAISE NOTICE '✅ Columna client_id agregada a debts';
    END IF;
    
    -- Agregar corporate_client_id a clients si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'corporate_client_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE clients ADD COLUMN corporate_client_id UUID REFERENCES corporate_clients(id);
        RAISE NOTICE '✅ Columna corporate_client_id agregada a clients';
    END IF;
END $$;
        `);
    }
}

verifyAndInstruct();