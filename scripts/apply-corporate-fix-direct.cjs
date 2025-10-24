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

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQL(sql) {
    try {
        console.log(`🔄 Ejecutando: ${sql.substring(0, 100)}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
        
        if (error) {
            console.error('❌ Error en SQL:', error);
            return false;
        }
        
        console.log('✅ SQL ejecutado correctamente');
        return true;
    } catch (err) {
        console.error('❌ Error ejecutando SQL:', err.message);
        return false;
    }
}

async function applyFixDirectly() {
    console.log('🔧 Aplicando fix para clientes corporativos (método directo)...');
    
    // SQL para agregar client_id a debts
    const addClientIdToDebts = `
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
    `;
    
    // SQL para agregar corporate_client_id a clients
    const addCorporateClientIdToClients = `
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
    `;
    
    try {
        // Intentar ejecutar directamente con SQL
        console.log('📊 Intentando ejecutar SQL directamente...');
        
        // Primero verificar si podemos ejecutar SQL
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.columns')
            .select('table_name, column_name')
            .eq('table_schema', 'public')
            .in('table_name', ['debts', 'clients'])
            .in('column_name', ['client_id', 'corporate_client_id']);
        
        if (tablesError) {
            console.error('❌ Error verificando columnas:', tablesError);
        } else {
            console.log('📋 Columnas encontradas:', tables);
        }
        
        // Ejecutar SQL para agregar columnas usando el método directo
        console.log('🔄 Ejecutando SQL para agregar client_id a debts...');
        const { error: error1 } = await supabase
            .rpc('exec', { sql: addClientIdToDebts });
        
        if (error1) {
            console.log('⚠️ Método exec no disponible, intentando alternativa...');
            
            // Intentar con el método SQL directo
            try {
                const { data: result1, error: directError1 } = await supabase
                    .from('debts')
                    .select('id')
                    .limit(1);
                
                if (directError1 && directError1.message.includes('column "client_id" does not exist')) {
                    console.log('❌ Columna client_id no existe en debts');
                    
                    // Crear la columna usando ALTER TABLE directo
                    const { error: alterError1 } = await supabase
                        .rpc('exec_sql', { 
                            sql_query: 'ALTER TABLE debts ADD COLUMN client_id UUID REFERENCES clients(id);' 
                        });
                    
                    if (alterError1) {
                        console.error('❌ No se pudo agregar client_id a debts:', alterError1);
                    } else {
                        console.log('✅ Columna client_id agregada a debts');
                    }
                } else {
                    console.log('✅ Columna client_id ya existe en debts');
                }
            } catch (err) {
                console.error('❌ Error verificando client_id:', err.message);
            }
        } else {
            console.log('✅ SQL para client_id ejecutado');
        }
        
        console.log('🔄 Ejecutando SQL para agregar corporate_client_id a clients...');
        const { error: error2 } = await supabase
            .rpc('exec', { sql: addCorporateClientIdToClients });
        
        if (error2) {
            console.log('⚠️ Método exec no disponible, intentando alternativa...');
            
            try {
                const { data: result2, error: directError2 } = await supabase
                    .from('clients')
                    .select('id')
                    .limit(1);
                
                if (directError2 && directError2.message.includes('column "corporate_client_id" does not exist')) {
                    console.log('❌ Columna corporate_client_id no existe en clients');
                    
                    // Crear la columna usando ALTER TABLE directo
                    const { error: alterError2 } = await supabase
                        .rpc('exec_sql', { 
                            sql_query: 'ALTER TABLE clients ADD COLUMN corporate_client_id UUID REFERENCES corporate_clients(id);' 
                        });
                    
                    if (alterError2) {
                        console.error('❌ No se pudo agregar corporate_client_id a clients:', alterError2);
                    } else {
                        console.log('✅ Columna corporate_client_id agregada a clients');
                    }
                } else {
                    console.log('✅ Columna corporate_client_id ya existe en clients');
                }
            } catch (err) {
                console.error('❌ Error verificando corporate_client_id:', err.message);
            }
        } else {
            console.log('✅ SQL para corporate_client_id ejecutado');
        }
        
        console.log('\n📋 INSTRUCCIONES MANUALES (si lo anterior no funcionó):');
        console.log('1. Ve a: https://app.supabase.com/project/wvluqdldygmgncqqjkow/sql');
        console.log('2. Copia y ejecuta este SQL:');
        console.log(addClientIdToDebts);
        console.log(addCorporateClientIdToClients);
        
    } catch (error) {
        console.error('❌ Error aplicando fix:', error);
    }
}

applyFixDirectly();