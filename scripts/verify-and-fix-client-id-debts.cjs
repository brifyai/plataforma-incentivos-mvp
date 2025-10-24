/**
 * Script para verificar y reparar el problema con client_id en la tabla debts
 * Este script diagnostica y soluciona el problema crítico identificado en el análisis
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY no está definido en las variables de entorno');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumnExists() {
    console.log('🔍 Verificando si existe la columna client_id en la tabla debts...');
    
    try {
        const { data, error } = await supabase
            .rpc('check_column_exists', {
                table_name: 'debts',
                column_name: 'client_id'
            });
        
        if (error) {
            console.log('⚠️ RPC check_column_exists no disponible, usando consulta directa...');
            
            // Consulta directa a information_schema
            const { data: schemaData, error: schemaError } = await supabase
                .from('information_schema.columns')
                .select('column_name, data_type')
                .eq('table_name', 'debts')
                .eq('column_name', 'client_id')
                .eq('table_schema', 'public');
            
            if (schemaError) {
                console.error('❌ Error verificando columna:', schemaError);
                return false;
            }
            
            return schemaData && schemaData.length > 0;
        }
        
        return data;
    } catch (error) {
        console.error('❌ Error verificando columna:', error);
        return false;
    }
}

async function executeMigration() {
    console.log('🔧 Ejecutando migración para agregar client_id a debts...');
    
    try {
        // Ejecutar el SQL de la migración
        const migrationSQL = `
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name = 'debts' 
                    AND column_name = 'client_id'
                    AND table_schema = 'public'
                ) THEN
                    -- Add the client_id column as a foreign key to clients table
                    ALTER TABLE public.debts 
                    ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
                    
                    -- Add index for better query performance
                    CREATE INDEX IF NOT EXISTS idx_debts_client_id ON public.debts(client_id);
                    
                    -- Add comment for documentation
                    COMMENT ON COLUMN public.debts.client_id IS 'Reference to the client this debt belongs to (nullable for backwards compatibility)';
                    
                    RAISE NOTICE 'client_id column added to debts table successfully';
                ELSE
                    RAISE NOTICE 'client_id column already exists in debts table';
                END IF;
            END $$;
            
            -- Optional: Create a composite index for company_id + client_id queries
            CREATE INDEX IF NOT EXISTS idx_debts_company_client ON public.debts(company_id, client_id) WHERE client_id IS NOT NULL;
        `;
        
        const { data, error } = await supabase.rpc('execute_sql', { sql: migrationSQL });
        
        if (error) {
            console.log('⚠️ RPC execute_sql no disponible, intentando método alternativo...');
            
            // Intentar ejecutar directamente como consulta
            const { data: altData, error: altError } = await supabase
                .from('debts')
                .select('client_id')
                .limit(1);
            
            if (altError && altError.message.includes('column "client_id" does not exist')) {
                console.error('❌ La columna client_id no existe y no se puede agregar automáticamente');
                console.error('💡 Por favor, ejecuta manualmente la migración 024_add_client_id_to_debts.sql');
                return false;
            } else if (!altError) {
                console.log('✅ La columna client_id ya existe');
                return true;
            }
            
            return false;
        }
        
        console.log('✅ Migración ejecutada exitosamente');
        return true;
    } catch (error) {
        console.error('❌ Error ejecutando migración:', error);
        return false;
    }
}

async function checkRLSPolicies() {
    console.log('🔍 Verificando políticas RLS para la tabla debts...');
    
    try {
        const { data, error } = await supabase
            .from('pg_policies')
            .select('policyname, permissive, roles, cmd, qual')
            .eq('tablename', 'debts');
        
        if (error) {
            console.log('⚠️ No se puede verificar políticas RLS automáticamente');
            return;
        }
        
        if (!data || data.length === 0) {
            console.log('⚠️ No hay políticas RLS definidas para debts');
        } else {
            console.log('✅ Políticas RLS encontradas:');
            data.forEach(policy => {
                console.log(`  - ${policy.policyname}: ${policy.cmd}`);
            });
        }
    } catch (error) {
        console.log('⚠️ Error verificando políticas RLS:', error.message);
    }
}

async function testDebtsQuery() {
    console.log('🧪 Probando consulta a debts con client_id...');
    
    try {
        // Simular la consulta que hace getCompanyDebts
        const { data, error } = await supabase
            .from('debts')
            .select(`
                *,
                user:users(id, full_name, email, rut),
                client:clients(id, business_name, contact_email, rut, contact_phone)
            `)
            .limit(1);
        
        if (error) {
            console.error('❌ Error en consulta de prueba:', error);
            console.error('💡 Esto indica un problema con la relación client_id');
            return false;
        }
        
        console.log('✅ Consulta de prueba exitosa');
        console.log('📊 Estructura de datos devueltos:');
        if (data && data.length > 0) {
            const sample = data[0];
            console.log(`  - ID: ${sample.id}`);
            console.log(`  - Usuario: ${sample.user?.full_name || 'N/A'}`);
            console.log(`  - Cliente: ${sample.client?.business_name || 'N/A'}`);
            console.log(`  - client_id: ${sample.client_id || 'NULL'}`);
        } else {
            console.log('  - No hay datos en la tabla debts');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error en consulta de prueba:', error);
        return false;
    }
}

async function checkClientsTable() {
    console.log('🔍 Verificando tabla clients...');
    
    try {
        const { data, error } = await supabase
            .from('clients')
            .select('id, business_name, company_id')
            .limit(5);
        
        if (error) {
            console.error('❌ Error accediendo a tabla clients:', error);
            return false;
        }
        
        console.log('✅ Tabla clients accesible');
        console.log(`📊 Encontrados ${data.length} clientes de muestra`);
        
        if (data.length > 0) {
            console.log('  Ejemplos:');
            data.forEach(client => {
                console.log(`    - ${client.business_name} (ID: ${client.id})`);
            });
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error verificando tabla clients:', error);
        return false;
    }
}

async function generateReport() {
    console.log('\n📋 === REPORTE DE DIAGNÓSTICO ===');
    
    const columnExists = await checkColumnExists();
    const clientsOk = await checkClientsTable();
    const queryWorks = await testDebtsQuery();
    
    console.log('\n🎯 === ESTADO ACTUAL ===');
    console.log(`Columna client_id en debts: ${columnExists ? '✅ EXISTE' : '❌ AUSENTE'}`);
    console.log(`Tabla clients accesible: ${clientsOk ? '✅ OK' : '❌ ERROR'}`);
    console.log(`Consulta debts-clientes: ${queryWorks ? '✅ FUNCIONA' : '❌ ERROR'}`);
    
    if (columnExists && clientsOk && queryWorks) {
        console.log('\n🎉 === TODO CORRECTO ===');
        console.log('✅ El problema client_id está resuelto');
        console.log('✅ Ambos paneles deberían mostrar datos consistentes');
        return true;
    } else {
        console.log('\n🚨 === PROBLEMAS DETECTADOS ===');
        
        if (!columnExists) {
            console.log('❌ La columna client_id no existe en la tabla debts');
            console.log('💡 Solución: Ejecutar migración 024_add_client_id_to_debts.sql');
        }
        
        if (!clientsOk) {
            console.log('❌ Problemas accediendo a la tabla clients');
            console.log('💡 Solución: Verificar permisos RLS');
        }
        
        if (!queryWorks) {
            console.log('❌ La consulta debts-clientes falla');
            console.log('💡 Solución: Reparar relación foreign key');
        }
        
        return false;
    }
}

async function main() {
    console.log('🔍 === DIAGNÓSTICO Y REPARACIÓN DE client_id EN debts ===\n');
    
    // Paso 1: Verificar estado actual
    const columnExists = await checkColumnExists();
    
    if (!columnExists) {
        console.log('\n🔧 === INTENTANDO REPARAR AUTOMÁTICAMENTE ===');
        const migrationSuccess = await executeMigration();
        
        if (!migrationSuccess) {
            console.log('\n❌ === NO SE PUDO REPARAR AUTOMÁTICAMENTE ===');
            console.log('💡 Por favor, ejecuta manualmente:');
            console.log('   1. Conéctate a la base de datos Supabase');
            console.log('   2. Ejecuta el archivo: supabase-migrations/024_add_client_id_to_debts.sql');
            console.log('   3. Vuelve a ejecutar este script para verificar');
        }
    }
    
    // Paso 2: Verificar políticas RLS
    await checkRLSPolicies();
    
    // Paso 3: Generar reporte final
    const success = await generateReport();
    
    console.log('\n🏁 === FIN DEL DIAGNÓSTICO ===');
    
    if (success) {
        console.log('✅ Sistema listo para consistencia entre paneles');
        process.exit(0);
    } else {
        console.log('❌ Se requiere intervención manual');
        process.exit(1);
    }
}

// Ejecutar script
if (require.main === module) {
    main().catch(error => {
        console.error('💥 Error fatal en el script:', error);
        process.exit(1);
    });
}

module.exports = {
    checkColumnExists,
    executeMigration,
    testDebtsQuery,
    generateReport
};