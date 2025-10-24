const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

console.log('🔍 DIAGNÓSTICO DIRECTO DE COLUMNAS');
console.log('=====================================');

// Obtener variables de entorno
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('📍 URL:', supabaseUrl);
console.log('🔑 Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NO DEFINIDA');

if (!supabaseUrl || !supabaseKey) {
    console.log('❌ ERROR: Variables de entorno no encontradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseColumns() {
    try {
        console.log('\n📊 VERIFICACIÓN DIRECTA DE COLUMNAS');
        
        // Verificar columna client_id en debts usando SQL directo
        console.log('\n🔍 Verificando debts.client_id...');
        const { data: debtColumns, error: debtError } = await supabase
            .rpc('get_table_columns', { table_name: 'debts' })
            .select('column_name')
            .eq('column_name', 'client_id');
            
        if (debtError) {
            console.log('❌ Error verificando debts:', debtError.message);
            
            // Alternativa: consultar information_schema directamente
            const { data: infoData, error: infoError } = await supabase
                .from('information_schema.columns')
                .select('column_name, table_name')
                .eq('table_name', 'debts')
                .eq('column_name', 'client_id')
                .eq('table_schema', 'public');
                
            if (infoError) {
                console.log('❌ Error en information_schema:', infoError.message);
            } else {
                console.log('📋 Resultado information_schema:', infoData);
                console.log('🔍 ¿Existe client_id?:', infoData && infoData.length > 0 ? '✅ SÍ' : '❌ NO');
            }
        } else {
            console.log('📋 Columnas encontradas:', debtColumns);
            console.log('🔍 ¿Existe client_id?:', debtColumns && debtColumns.length > 0 ? '✅ SÍ' : '❌ NO');
        }
        
        // Verificar corporate_client_id en clients
        console.log('\n🔍 Verificando clients.corporate_client_id...');
        const { data: clientColumns, error: clientError } = await supabase
            .from('information_schema.columns')
            .select('column_name, table_name')
            .eq('table_name', 'clients')
            .eq('column_name', 'corporate_client_id')
            .eq('table_schema', 'public');
            
        if (clientError) {
            console.log('❌ Error verificando clients:', clientError.message);
        } else {
            console.log('📋 Columnas encontradas:', clientColumns);
            console.log('🔍 ¿Existe corporate_client_id?:', clientColumns && clientColumns.length > 0 ? '✅ SÍ' : '❌ NO');
        }
        
        // Listar todas las columnas de debts
        console.log('\n📋 Todas las columnas de debts:');
        const { data: allDebtColumns, error: allDebtError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type')
            .eq('table_name', 'debts')
            .eq('table_schema', 'public')
            .order('ordinal_position');
            
        if (allDebtError) {
            console.log('❌ Error obteniendo todas las columnas de debts:', allDebtError.message);
        } else {
            console.log('📋 Columnas de debts:');
            allDebtColumns.forEach(col => {
                console.log(`  - ${col.column_name} (${col.data_type})`);
            });
        }
        
        // Listar todas las columnas de clients
        console.log('\n📋 Todas las columnas de clients:');
        const { data: allClientColumns, error: allClientError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type')
            .eq('table_name', 'clients')
            .eq('table_schema', 'public')
            .order('ordinal_position');
            
        if (allClientError) {
            console.log('❌ Error obteniendo todas las columnas de clients:', allClientError.message);
        } else {
            console.log('📋 Columnas de clients:');
            allClientColumns.forEach(col => {
                console.log(`  - ${col.column_name} (${col.data_type})`);
            });
        }
        
    } catch (error) {
        console.log('❌ Error general:', error.message);
    }
}

diagnoseColumns();