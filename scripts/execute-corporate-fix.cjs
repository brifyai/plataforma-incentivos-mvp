const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Faltan variables de entorno:');
    console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
    console.error('   VITE_SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
    process.exit(1);
}

// Crear cliente con SERVICE ROLE KEY para tener permisos de administrador
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function executeCorporateFix() {
    console.log('🔧 Ejecutando fix para clientes corporativos con SERVICE ROLE KEY...');
    
    try {
        // SQL para agregar las columnas faltantes
        const sqlCommands = [
            // Agregar client_id a debts
            `ALTER TABLE debts ADD COLUMN client_id UUID REFERENCES clients(id);`,
            
            // Agregar corporate_client_id a clients  
            `ALTER TABLE clients ADD COLUMN corporate_client_id UUID REFERENCES corporate_clients(id);`
        ];
        
        for (let i = 0; i < sqlCommands.length; i++) {
            const sql = sqlCommands[i];
            console.log(`🔄 Ejecutando SQL ${i + 1}/${sqlCommands.length}: ${sql.substring(0, 50)}...`);
            
            try {
                // Intentar ejecutar el SQL directamente
                const { data, error } = await supabase
                    .rpc('exec_sql', { sql_query: sql });
                
                if (error) {
                    console.log(`⚠️ Error con exec_sql: ${error.message}`);
                    
                    // Si exec_sql no funciona, intentar con el método directo
                    console.log('🔄 Intentando método alternativo...');
                    
                    // Para ALTER TABLE, necesitamos usar una función diferente o manejarlo de otra forma
                    console.log('📋 El SQL necesita ser ejecutado manualmente en Supabase');
                    console.log('🔗 URL: https://app.supabase.com/project/wvluqdldygmgncqqjkow/sql');
                    console.log('📝 SQL a ejecutar:');
                    console.log(sql);
                    
                } else {
                    console.log('✅ SQL ejecutado correctamente');
                    if (data) {
                        console.log('📊 Resultado:', data);
                    }
                }
            } catch (err) {
                console.log(`❌ Error ejecutando SQL: ${err.message}`);
            }
        }
        
        // Verificar el estado final
        console.log('\n🔍 Verificando estado final...');
        
        // Intentar verificar si las columnas existen ahora
        try {
            const { data: verificationData, error: verificationError } = await supabase
                .from('information_schema.columns')
                .select('table_name, column_name')
                .eq('table_schema', 'public')
                .in('table_name', ['debts', 'clients'])
                .in('column_name', ['client_id', 'corporate_client_id']);
            
            if (verificationError) {
                console.log('⚠️ No se puede verificar automáticamente:', verificationError.message);
            } else {
                console.log('📋 Columnas encontradas:', verificationData);
                
                const hasClientId = verificationData.some(c => c.table_name === 'debts' && c.column_name === 'client_id');
                const hasCorporateClientId = verificationData.some(c => c.table_name === 'clients' && c.column_name === 'corporate_client_id');
                
                console.log('\n📊 ESTADO FINAL:');
                console.log(`   client_id en debts: ${hasClientId ? '✅ EXISTE' : '❌ FALTA'}`);
                console.log(`   corporate_client_id en clients: ${hasCorporateClientId ? '✅ EXISTE' : '❌ FALTA'}`);
                
                if (hasClientId && hasCorporateClientId) {
                    console.log('\n🎉 ¡SOLUCIÓN COMPLETA! Ambas columnas ahora existen');
                    console.log('🔄 Los clientes corporativos deberían funcionar ahora');
                    console.log('💡 Reinicia el servidor para asegurar que los cambios se apliquen:');
                    console.log('   taskkill /F /IM node.exe 2>nul & timeout /t 2 >nul & npm run dev -- --port 3002');
                } else {
                    console.log('\n⚠️ Aún faltan columnas. Ejecuta el SQL manualmente:');
                    console.log('https://app.supabase.com/project/wvluqdldygmgncqqjkow/sql');
                }
            }
        } catch (verifyErr) {
            console.log('⚠️ Error en verificación:', verifyErr.message);
        }
        
    } catch (error) {
        console.error('❌ Error general:', error.message);
    }
}

executeCorporateFix();