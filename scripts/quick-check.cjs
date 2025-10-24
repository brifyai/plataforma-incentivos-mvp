const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

console.log('🔍 VERIFICACIÓN RÁPIDA');
console.log('========================');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl ? '✅' : '❌');
console.log('KEY:', supabaseKey ? '✅' : '❌');

if (!supabaseUrl || !supabaseKey) {
    console.log('❌ FALTAN VARIABLES DE ENTORNO');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function quickCheck() {
    try {
        console.log('\n📊 Verificando debts...');
        const { data: debts, error: debtError } = await supabase
            .from('debts')
            .select('id')
            .limit(1);
        
        if (debtError) {
            console.log('❌ Error debts:', debtError.message);
        } else {
            console.log('✅ debts accesible');
        }
        
        console.log('\n📊 Verificando clients...');
        const { data: clients, error: clientError } = await supabase
            .from('clients')
            .select('id')
            .limit(1);
        
        if (clientError) {
            console.log('❌ Error clients:', clientError.message);
        } else {
            console.log('✅ clients accesible');
        }
        
        console.log('\n🔍 Probando client_id en debts...');
        const { data: testClientId, error: clientIdError } = await supabase
            .from('debts')
            .select('id, client_id')
            .limit(1);
        
        if (clientIdError) {
            console.log('❌ client_id NO existe:', clientIdError.message);
        } else {
            console.log('✅ client_id SÍ existe');
        }
        
        console.log('\n🔍 Probando corporate_client_id en clients...');
        const { data: testCorporateId, error: corporateIdError } = await supabase
            .from('clients')
            .select('id, corporate_client_id')
            .limit(1);
        
        if (corporateIdError) {
            console.log('❌ corporate_client_id NO existe:', corporateIdError.message);
        } else {
            console.log('✅ corporate_client_id SÍ existe');
        }
        
    } catch (error) {
        console.log('❌ Error general:', error.message);
    }
}

quickCheck();