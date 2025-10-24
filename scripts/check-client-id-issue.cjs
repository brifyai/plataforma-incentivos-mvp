/**
 * Script simplificado para verificar el problema client_id en debts
 * Usa las credenciales existentes del proyecto
 */

const { createClient } = require('@supabase/supabase-js');

// Usar las credenciales del .env
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkClientIdColumn() {
    console.log('🔍 Verificando el problema client_id en la tabla debts...\n');
    
    try {
        // 1. Verificar si podemos acceder a la tabla debts
        console.log('📋 Paso 1: Verificando acceso a tabla debts...');
        const { data: debtsData, error: debtsError } = await supabase
            .from('debts')
            .select('id, company_id, user_id')
            .limit(1);
        
        if (debtsError) {
            console.error('❌ Error accediendo a debts:', debtsError.message);
            return false;
        }
        console.log('✅ Tabla debts accesible');
        
        // 2. Intentar consultar con client_id
        console.log('\n📋 Paso 2: Verificando columna client_id...');
        const { data: clientIdData, error: clientIdError } = await supabase
            .from('debts')
            .select('client_id')
            .limit(1);
        
        if (clientIdError) {
            if (clientIdError.message.includes('column "client_id" does not exist')) {
                console.error('❌ PROBLEMA CONFIRMADO: La columna client_id NO existe en la tabla debts');
                console.error('📊 Error exacto:', clientIdError.message);
                return false;
            } else {
                console.error('❌ Error verificando client_id:', clientIdError.message);
                return false;
            }
        }
        
        console.log('✅ Columna client_id existe');
        
        // 3. Intentar la consulta completa que usa getCompanyDebts
        console.log('\n📋 Paso 3: Verificando consulta completa (getCompanyDebts)...');
        const { data: fullData, error: fullError } = await supabase
            .from('debts')
            .select(`
                *,
                user:users(id, full_name, email, rut),
                client:clients(id, business_name, contact_email, rut, contact_phone)
            `)
            .limit(1);
        
        if (fullError) {
            console.error('❌ Error en consulta completa:', fullError.message);
            console.error('🔍 Esto indica un problema con las relaciones o permisos');
            return false;
        }
        
        console.log('✅ Consulta completa exitosa');
        
        // 4. Verificar tabla clients
        console.log('\n📋 Paso 4: Verificando tabla clients...');
        const { data: clientsData, error: clientsError } = await supabase
            .from('clients')
            .select('id, business_name, company_id')
            .limit(1);
        
        if (clientsError) {
            console.error('❌ Error accediendo a clients:', clientsError.message);
            return false;
        }
        
        console.log('✅ Tabla clients accesible');
        
        // 5. Resumen
        console.log('\n🎯 === RESUMEN DE VERIFICACIÓN ===');
        console.log('✅ Tabla debts: Accesible');
        console.log('✅ Columna client_id: Existe');
        console.log('✅ Consulta completa: Funciona');
        console.log('✅ Tabla clients: Accesible');
        console.log('\n🎉 CONCLUSIÓN: El problema client_id está RESUELTO');
        console.log('📝 Los paneles Admin y Empresas deberían mostrar datos consistentes');
        
        return true;
        
    } catch (error) {
        console.error('💥 Error inesperado:', error.message);
        return false;
    }
}

async function checkCompanyDebtsLogic() {
    console.log('\n🔍 Verificando lógica específica de getCompanyDebts...\n');
    
    try {
        // Simular la lógica exacta de getCompanyDebts en databaseService.js
        const companyId = '7c834069-d92e-44b1-b0c0-474310fad1ff'; // ID del log
        
        console.log(`📋 Buscando deudas para empresa: ${companyId}`);
        
        let query = supabase
            .from('debts')
            .select(`
                *,
                user:users(id, full_name, email, rut),
                client:clients(id, business_name, contact_email, rut, contact_phone)
            `)
            .eq('company_id', companyId);
        
        const { data, error } = await query.limit(5);
        
        if (error) {
            console.error('❌ Error en getCompanyDebts:', error.message);
            
            if (error.message.includes('client_id')) {
                console.error('🚨 PROBLEMA: La relación con client_id está fallando');
                console.error('💡 Solución: Verificar la migración 024_add_client_id_to_debts.sql');
            }
            
            return false;
        }
        
        console.log(`✅ getCompanyDebts funciona correctamente`);
        console.log(`📊 Encontradas ${data.length} deudas`);
        
        if (data.length > 0) {
            console.log('\n📋 Ejemplo de deuda:');
            const debt = data[0];
            console.log(`  - ID: ${debt.id}`);
            console.log(`  - Usuario: ${debt.user?.full_name || 'N/A'}`);
            console.log(`  - Cliente: ${debt.client?.business_name || 'N/A'}`);
            console.log(`  - client_id: ${debt.client_id || 'NULL'}`);
            console.log(`  - Monto: ${debt.current_amount || 'N/A'}`);
        }
        
        return true;
        
    } catch (error) {
        console.error('💥 Error verificando getCompanyDebts:', error.message);
        return false;
    }
}

async function main() {
    console.log('🔍 === DIAGNÓSTICO DEL PROBLEMA client_id ===\n');
    
    const basicCheck = await checkClientIdColumn();
    const companyDebtsCheck = await checkCompanyDebtsLogic();
    
    console.log('\n🏁 === RESULTADO FINAL ===');
    
    if (basicCheck && companyDebtsCheck) {
        console.log('🎉 ✅ TODO CORRECTO');
        console.log('✅ No hay problemas con client_id');
        console.log('✅ Ambos paneles deberían funcionar consistentemente');
        process.exit(0);
    } else {
        console.log('🚨 ❌ PROBLEMAS DETECTADOS');
        console.log('\n💡 SOLUCIONES RECOMENDADAS:');
        console.log('1. Ejecutar la migración: supabase-migrations/024_add_client_id_to_debts.sql');
        console.log('2. Verificar permisos RLS en las tablas debts y clients');
        console.log('3. Revisar las políticas de acceso en Supabase');
        process.exit(1);
    }
}

// Ejecutar diagnóstico
main().catch(error => {
    console.error('💥 Error fatal:', error.message);
    process.exit(1);
});