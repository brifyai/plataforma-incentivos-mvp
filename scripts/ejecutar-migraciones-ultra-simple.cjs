const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Usar las credenciales del archivo .env que están funcionando en la app
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function ejecutarMigracionesUltraSimple() {
    console.log('🚀 EJECUTANDO MIGRACIONES ULTRA-SIMPLE FINALES');
    console.log('================================================');
    
    try {
        // Verificar conexión primero
        console.log('📡 Verificando conexión a Supabase...');
        const { data: testData, error: testError } = await supabase
            .from('companies')
            .select('id')
            .limit(1);
        
        if (testError) {
            console.error('❌ Error de conexión:', testError);
            console.log('⚠️ Las migraciones deben ejecutarse manualmente en Supabase Dashboard');
            console.log('📋 Instrucciones:');
            console.log('1. Ir a Supabase Dashboard > SQL Editor');
            console.log('2. Copiar y ejecutar scripts/migrations/036_complete_companies_fix_fixed.sql');
            console.log('3. Copiar y ejecutar scripts/migrations/037_create_missing_tables_minimal.sql');
            console.log('4. Copiar y ejecutar scripts/migrations/038_verification_ultra_simple.sql');
            return;
        }
        
        console.log('✅ Conexión establecida correctamente');
        
        // PASO 1: Verificar estado actual de companies
        console.log('\n🔍 PASO 1: Verificando estado actual de tabla companies...');
        
        try {
            const { data: companiesData, error: companiesError } = await supabase
                .from('companies')
                .select('company_name, rut, legal_representative_name, legal_representative_email, verification_status')
                .eq('contact_email', 'empresa@nexupay.cl')
                .single();
            
            if (companiesError) {
                console.log('❌ Error verificando companies:', companiesError.message);
            } else {
                console.log('✅ Datos actuales de NexuPay Cobranzas:');
                console.log(`   • Nombre: ${companiesData.company_name}`);
                console.log(`   • RUT: ${companiesData.rut}`);
                console.log(`   • Representante: ${companiesData.legal_representative_name}`);
                console.log(`   • Email Rep: ${companiesData.legal_representative_email || 'NO DEFINIDO'}`);
                console.log(`   • Verificación: ${companiesData.verification_status || 'NO DEFINIDO'}`);
            }
        } catch (e) {
            console.error('❌ Error crítico verificando companies:', e.message);
        }
        
        // PASO 2: Verificar tablas core
        console.log('\n🔍 PASO 2: Verificando tablas core del sistema...');
        
        const coreTables = ['clients', 'debts', 'campaigns', 'proposals', 'agreements', 'payments'];
        let tablesStatus = {};
        
        for (const tableName of coreTables) {
            try {
                const { data, error } = await supabase
                    .from(tableName)
                    .select('id')
                    .limit(1);
                
                if (error) {
                    tablesStatus[tableName] = `❌ ERROR: ${error.message}`;
                } else {
                    tablesStatus[tableName] = '✅ FUNCIONANDO';
                }
            } catch (e) {
                tablesStatus[tableName] = `❌ CRÍTICO: ${e.message}`;
            }
        }
        
        console.log('📊 Estado de tablas core:');
        Object.entries(tablesStatus).forEach(([table, status]) => {
            console.log(`   • ${table}: ${status}`);
        });
        
        // PASO 3: Análisis de campos faltantes
        console.log('\n🔍 PASO 3: Analizando campos críticos faltantes...');
        
        const criticalFields = [
            'legal_representative_email',
            'legal_representative_phone',
            'company_address',
            'company_region',
            'business_type',
            'verification_status',
            'is_verified'
        ];
        
        try {
            const { data: fieldsData, error: fieldsError } = await supabase
                .from('companies')
                .select(criticalFields.join(', '))
                .eq('contact_email', 'empresa@nexupay.cl')
                .single();
            
            if (fieldsError) {
                console.log('❌ Error verificando campos críticos:', fieldsError.message);
                
                if (fieldsError.message.includes('column') && fieldsError.message.includes('does not exist')) {
                    console.log('🚨 CAMPOS CRÍTICOS FALTANTES DETECTADOS');
                    console.log('🔧 SOLUCIÓN: Ejecutar migración 036_complete_companies_fix_fixed.sql');
                }
            } else {
                console.log('✅ Campos críticos verificados:');
                criticalFields.forEach(field => {
                    const value = fieldsData[field];
                    const status = value ? '✅' : '❌';
                    console.log(`   ${status} ${field}: ${value || 'FALTANTE'}`);
                });
            }
        } catch (e) {
            console.error('❌ Error crítico verificando campos:', e.message);
        }
        
        // RESUMEN Y RECOMENDACIONES
        console.log('\n🎯 RESUMEN Y RECOMENDACIONES');
        console.log('=============================');
        
        const workingTables = Object.values(tablesStatus).filter(status => status.includes('FUNCIONANDO')).length;
        const totalTables = coreTables.length;
        
        console.log(`📊 Tablas funcionando: ${workingTables}/${totalTables}`);
        
        if (workingTables === totalTables) {
            console.log('✅ Todas las tablas core están funcionando');
        } else {
            console.log('⚠️ Hay tablas con problemas que requieren atención');
        }
        
        console.log('\n🚀 ACCIONES RECOMENDADAS:');
        console.log('1. Si hay campos faltantes en companies:');
        console.log('   → Ejecutar: scripts/migrations/036_complete_companies_fix_fixed.sql');
        console.log('2. Si hay tablas con errores:');
        console.log('   → Ejecutar: scripts/migrations/037_create_missing_tables_minimal.sql');
        console.log('3. Para verificación completa:');
        console.log('   → Ejecutar: scripts/migrations/038_verification_ultra_simple.sql');
        
        console.log('\n📋 INSTRUCCIONES PARA EJECUTAR EN SUPABASE DASHBOARD:');
        console.log('1. Ir a https://app.supabase.com');
        console.log('2. Seleccionar proyecto NexuPay');
        console.log('3. Ir a SQL Editor');
        console.log('4. Copiar y pegar el contenido del archivo SQL');
        console.log('5. Hacer clic en "Run"');
        console.log('6. Esperar a que termine antes de ejecutar el siguiente');
        
        console.log('\n🎉 ORDEN DE EJECUCIÓN:');
        console.log('PASO 1: 036_complete_companies_fix_fixed.sql');
        console.log('PASO 2: 037_create_missing_tables_minimal.sql');
        console.log('PASO 3: 038_verification_ultra_simple.sql');
        
    } catch (error) {
        console.error('❌ Error ejecutando migraciones ultra-simple:', error);
    }
}

// Ejecutar la función
ejecutarMigracionesUltraSimple();