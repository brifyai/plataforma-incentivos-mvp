import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Variables de entorno faltantes');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDashboardData() {
    try {
        console.log('🔍 Probando obtención de datos reales del dashboard...\n');

        // Simular un companyId (necesitarías obtener uno real de tu base de datos)
        // Para este test, vamos a obtener todas las empresas y usar la primera
        console.log('🔍 Buscando empresas en la base de datos...');
        const { data: companies, error: companiesError } = await supabase
            .from('companies')
            .select('id, company_name')
            .limit(5);

        console.log('📋 Empresas encontradas:', companies?.length || 0);
        if (companies && companies.length > 0) {
            console.log('🏢 Primera empresa:', companies[0]);
        }

        if (companiesError || !companies || companies.length === 0) {
            console.error('❌ No se encontraron empresas en la base de datos');
            return;
        }

        const companyId = companies[0].id;
        console.log(`📊 Probando con empresa: ${companies[0].business_name} (ID: ${companyId})\n`);

        // 1. Probar getCompanyDashboardStats
        console.log('1️⃣ Probando getCompanyDashboardStats...');
        const { data: debtsResult, error: debtsError } = await supabase
            .from('debts')
            .select('current_amount, created_at, status')
            .eq('company_id', companyId);

        const { data: paymentsResult, error: paymentsError } = await supabase
            .from('payments')
            .select('amount, transaction_date, status')
            .eq('company_id', companyId)
            .eq('status', 'completed');

        const { data: agreementsResult, error: agreementsError } = await supabase
            .from('agreements')
            .select('id, created_at, status')
            .eq('company_id', companyId);

        const { data: clientsResult, error: clientsError } = await supabase
            .from('clients')
            .select('id')
            .eq('company_id', companyId);

        if (debtsError || paymentsError || agreementsError || clientsError) {
            console.error('❌ Error obteniendo datos básicos:', {
                debts: debtsError?.message,
                payments: paymentsError?.message,
                agreements: agreementsError?.message,
                clients: clientsError?.message
            });
        } else {
            // Calcular estadísticas como en el código real
            const totalDebtAmount = debtsResult?.reduce((sum, debt) => sum + parseFloat(debt.current_amount), 0) || 0;
            const totalRecovered = paymentsResult?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0;
            const recoveryRate = totalDebtAmount > 0 ? (totalRecovered / totalDebtAmount) * 100 : 0;

            console.log('✅ Estadísticas calculadas:');
            console.log(`   - Total de clientes: ${clientsResult?.length || 0}`);
            console.log(`   - Total de deudas: ${debtsResult?.length || 0}`);
            console.log(`   - Monto total de deudas: $${totalDebtAmount.toLocaleString()}`);
            console.log(`   - Monto recuperado: $${totalRecovered.toLocaleString()}`);
            console.log(`   - Tasa de recuperación: ${recoveryRate.toFixed(1)}%`);
            console.log(`   - Acuerdos activos: ${agreementsResult?.filter(a => a.status === 'active').length || 0}`);
        }

        console.log('\n2️⃣ Probando getCompanyAnalytics...');
        // 2. Probar getCompanyAnalytics (versión simplificada)
        const { data: analyticsResult, error: analyticsError } = await supabase
            .from('analytics_metrics')
            .select('*')
            .eq('company_id', companyId)
            .order('period_end', { ascending: false })
            .limit(5);

        if (analyticsError) {
            console.log('⚠️ Tabla analytics_metrics no disponible o vacía');
        } else {
            console.log('✅ Datos de analytics encontrados:', analyticsResult?.length || 0, 'registros');
            if (analyticsResult && analyticsResult.length > 0) {
                console.log('📈 Último registro:', analyticsResult[0]);
            }
        }

        console.log('\n3️⃣ Probando getCompanyClients...');
        // 3. Probar getCompanyClients
        const { data: clientsData, error: clientsDataError } = await supabase
            .from('clients')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })
            .limit(5);

        if (clientsDataError) {
            console.error('❌ Error obteniendo clientes:', clientsDataError.message);
        } else {
            console.log(`✅ Clientes encontrados: ${clientsData?.length || 0}`);
            if (clientsData && clientsData.length > 0) {
                console.log('👥 Primeros clientes:', clientsData.slice(0, 3).map(c => c.business_name));
            }
        }

        console.log('\n🎉 Test completado exitosamente!');
        console.log('\n💡 El dashboard debería mostrar datos reales de la base de datos.');

    } catch (error) {
        console.error('❌ Error en el test:', error.message);
    }
}

testDashboardData();