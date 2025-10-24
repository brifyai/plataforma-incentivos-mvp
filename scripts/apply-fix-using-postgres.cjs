const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Faltan variables de entorno:');
    console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
    console.error('   VITE_SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌');
    process.exit(1);
}

// Crear cliente con opciones adicionales
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function executePostgresDirect() {
    console.log('🔧 Ejecutando fix usando PostgreSQL directo...');
    
    try {
        // Método 1: Usar el cliente Postgres directamente
        const { data: postgresData, error: postgresError } = await supabase
            .rpc('exec_sql', {
                sql: `
                    -- Agregar client_id a debts si no existe
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name = 'debts' 
                            AND column_name = 'client_id'
                            AND table_schema = 'public'
                        ) THEN
                            ALTER TABLE debts ADD COLUMN client_id UUID REFERENCES clients(id);
                            RAISE NOTICE '✅ Columna client_id agregada a debts';
                        ELSE
                            RAISE NOTICE '⚠️ Columna client_id ya existe en debts';
                        END IF;
                    END $$;

                    -- Agregar corporate_client_id a clients si no existe
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name = 'clients' 
                            AND column_name = 'corporate_client_id'
                            AND table_schema = 'public'
                        ) THEN
                            ALTER TABLE clients ADD COLUMN corporate_client_id UUID REFERENCES corporate_clients(id);
                            RAISE NOTICE '✅ Columna corporate_client_id agregada a clients';
                        ELSE
                            RAISE NOTICE '⚠️ Columna corporate_client_id ya existe en clients';
                        END IF;
                    END $$;
                `
            });
        
        if (postgresError) {
            console.error('❌ Error con exec_sql:', postgresError);
            
            // Método 2: Intentar con SQL individual
            console.log('🔄 Intentando con SQL individual...');
            
            // Verificar si las columnas existen primero
            const { data: columns, error: columnsError } = await supabase
                .from('information_schema.columns')
                .select('table_name, column_name')
                .eq('table_schema', 'public')
                .in('table_name', ['debts', 'clients'])
                .in('column_name', ['client_id', 'corporate_client_id']);
            
            if (columnsError) {
                console.error('❌ Error verificando columnas:', columnsError);
            } else {
                console.log('📋 Columnas actuales:', columns);
                
                const hasClientId = columns.some(c => c.table_name === 'debts' && c.column_name === 'client_id');
                const hasCorporateClientId = columns.some(c => c.table_name === 'clients' && c.column_name === 'corporate_client_id');
                
                console.log(`📊 client_id en debts: ${hasClientId ? '✅' : '❌'}`);
                console.log(`📊 corporate_client_id en clients: ${hasCorporateClientId ? '✅' : '❌'}`);
                
                if (!hasClientId || !hasCorporateClientId) {
                    console.log('\n🔧 Necesitamos agregar las columnas faltantes...');
                    console.log('📋 Por favor ejecuta manualmente en Supabase:');
                    console.log('https://app.supabase.com/project/wvluqdldygmgncqqjkow/sql');
                    console.log('\nSQL a ejecutar:');
                    
                    if (!hasClientId) {
                        console.log(`
-- Agregar client_id a debts
ALTER TABLE debts ADD COLUMN client_id UUID REFERENCES clients(id);
                        `);
                    }
                    
                    if (!hasCorporateClientId) {
                        console.log(`
-- Agregar corporate_client_id a clients  
ALTER TABLE clients ADD COLUMN corporate_client_id UUID REFERENCES corporate_clients(id);
                        `);
                    }
                } else {
                    console.log('✅ Ambas columnas ya existen');
                }
            }
        } else {
            console.log('✅ SQL ejecutado correctamente');
            console.log('📊 Resultado:', postgresData);
        }
        
    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

executePostgresDirect();