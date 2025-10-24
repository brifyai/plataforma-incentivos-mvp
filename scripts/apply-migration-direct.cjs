const { createClient } = require('@supabase/supabase-js');

// Usar las credenciales del archivo .env que están funcionando en la app
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigrationDirect() {
    console.log('🚀 Aplicando migración directa de tablas faltantes...');
    
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
        
        // Verificar qué tablas ya existen
        console.log('\n🔍 Verificando tablas existentes...');
        const tables = ['clients', 'debts', 'campaigns', 'proposals', 'agreements', 'payments'];
        
        for (const table of tables) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('id')
                    .limit(1);
                
                if (error) {
                    console.log(`❌ Tabla ${table} no existe o no es accesible:`, error.message);
                } else {
                    console.log(`✅ Tabla ${table} existe y es accesible`);
                }
            } catch (e) {
                console.log(`❌ Error crítico en tabla ${table}:`, e.message);
            }
        }
        
        console.log('\n📋 ANALISIS COMPLETADO');
        console.log('🔧 Para crear las tablas faltantes, necesitas:');
        console.log('   1. Acceder al panel de Supabase');
        console.log('   2. Ir a SQL Editor');
        console.log('   3. Ejecutar el archivo: scripts/migrations/037_create_missing_tables_definitiva.sql');
        console.log('   4. O usar la CLI de Supabase con: supabase db push');
        
        console.log('\n📄 Contenido del SQL a ejecutar:');
        console.log('=====================================');
        
        // Mostrar el contenido del SQL
        const fs = require('fs');
        const path = require('path');
        
        const migrationPath = path.join(__dirname, 'migrations', '037_create_missing_tables_definitiva.sql');
        const sqlContent = fs.readFileSync(migrationPath, 'utf8');
        
        console.log(sqlContent);
        console.log('=====================================');
        
    } catch (error) {
        console.error('❌ Error aplicando migración:', error);
    }
}

// Ejecutar la función
applyMigrationDirect();