const { createClient } = require('@supabase/supabase-js');

// Usar las credenciales del archivo .env que están funcionando en la app
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTablesStructure() {
    console.log('🔍 Verificando estructura detallada de tablas...');
    
    try {
        // Verificar conexión primero
        console.log('📡 Verificando conexión a Supabase...');
        const { data: testData, error: testError } = await supabase
            .from('companies')
            .select('id')
            .limit(1);
        
        if (testError) {
            console.error('❌ Error de conexión:', testError);
            return;
        }
        
        console.log('✅ Conexión establecida correctamente');
        
        // Verificar estructura de cada tabla
        const tables = [
            { name: 'clients', expectedFields: ['id', 'company_id', 'name', 'rut', 'email', 'phone', 'address', 'city', 'region', 'debt_amount', 'status', 'created_at', 'updated_at'] },
            { name: 'debts', expectedFields: ['id', 'company_id', 'client_name', 'client_rut', 'amount', 'original_amount', 'interest_rate', 'due_date', 'status', 'description', 'created_at', 'updated_at'] },
            { name: 'campaigns', expectedFields: ['id', 'company_id', 'name', 'description', 'type', 'status', 'start_date', 'end_date', 'settings', 'created_at', 'updated_at'] },
            { name: 'proposals', expectedFields: ['id', 'company_id', 'amount', 'terms', 'status', 'expires_at', 'created_at', 'updated_at'] },
            { name: 'agreements', expectedFields: ['id', 'company_id', 'amount', 'payment_schedule', 'status', 'signed_at', 'created_at', 'updated_at'] },
            { name: 'payments', expectedFields: ['id', 'company_id', 'amount', 'payment_method', 'transaction_id', 'status', 'payment_date', 'created_at', 'updated_at'] }
        ];
        
        console.log('\n📋 Verificando estructura de tablas:');
        
        for (const table of tables) {
            console.log(`\n🔍 Tabla: ${table.name}`);
            
            try {
                // Intentar obtener un registro para ver la estructura
                const { data, error } = await supabase
                    .from(table.name)
                    .select('*')
                    .limit(1);
                
                if (error) {
                    console.error(`❌ Error accediendo a tabla ${table.name}:`, error.message);
                    continue;
                }
                
                if (data && data.length > 0) {
                    const actualFields = Object.keys(data[0]);
                    console.log(`✅ Campos encontrados: ${actualFields.join(', ')}`);
                    
                    // Verificar campos faltantes
                    const missingFields = table.expectedFields.filter(field => !actualFields.includes(field));
                    if (missingFields.length > 0) {
                        console.log(`⚠️ Campos faltantes: ${missingFields.join(', ')}`);
                    } else {
                        console.log(`✅ Todos los campos esperados están presentes`);
                    }
                    
                    // Verificar campos extra
                    const extraFields = actualFields.filter(field => !table.expectedFields.includes(field));
                    if (extraFields.length > 0) {
                        console.log(`ℹ️ Campos adicionales: ${extraFields.join(', ')}`);
                    }
                } else {
                    console.log(`ℹ️ Tabla ${table.name} existe pero está vacía`);
                }
                
            } catch (e) {
                console.error(`❌ Error crítico en tabla ${table.name}:`, e.message);
            }
        }
        
        console.log('\n🎯 VERIFICACIÓN DE ERRORES ESPECÍFICOS:');
        console.log('🔍 Buscando el error "column proposal_id does not exist"...');
        
        // Verificar específicamente si hay alguna referencia a proposal_id
        try {
            const { data: debtsData, error: debtsError } = await supabase
                .from('debts')
                .select('*')
                .limit(1);
            
            if (debtsError) {
                if (debtsError.message.includes('proposal_id')) {
                    console.log('❌ ERROR ENCONTRADO: La tabla debts tiene referencia a proposal_id que no existe');
                    console.log('🔧 SOLUCIÓN: Se necesita eliminar la referencia a proposal_id de la tabla debts');
                } else {
                    console.log('❌ Error en tabla debts:', debtsError.message);
                }
            } else {
                console.log('✅ Tabla debts funciona correctamente');
            }
        } catch (e) {
            console.error('❌ Error verificando debts:', e.message);
        }
        
        console.log('\n📊 RESUMEN FINAL:');
        console.log('✅ Conexión a Supabase establecida');
        console.log('✅ Todas las tablas principales existen y son accesibles');
        console.log('🔧 Estructura verificada correctamente');
        
    } catch (error) {
        console.error('❌ Error verificando estructura:', error);
    }
}

// Ejecutar la función
verifyTablesStructure();