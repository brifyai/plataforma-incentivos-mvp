const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase (desde .env)
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCorporateClient() {
  console.log('🔧 CORRIGIENDO CLIENTE CORPORATIVO');
  console.log('='.repeat(40));

  try {
    // 1. Obtener el cliente corporativo que tiene undefined
    console.log('\n1️⃣ Obteniendo cliente corporativo con undefined...');
    const { data: corporateClient, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*')
      .eq('company_id', 'e27b3162-e7db-4b00-bc60-32abea7e171b')
      .single();

    if (corporateError) {
      console.log('❌ Error obteniendo cliente corporativo:', corporateError.message);
      return;
    }

    console.log('Cliente corporativo encontrado:', corporateClient);

    // 2. Actualizar el cliente corporativo con el nombre correcto
    console.log('\n2️⃣ Actualizando cliente corporativo...');
    const { data: updatedClient, error: updateError } = await supabase
      .from('corporate_clients')
      .update({
        business_name: 'NexuPay Cobranzas'
      })
      .eq('id', corporateClient.id)
      .select();

    if (updateError) {
      console.log('❌ Error actualizando cliente corporativo:', updateError.message);
      return;
    }

    console.log('✅ Cliente corporativo actualizado:', updatedClient[0]);

    // 3. Verificar clientes individuales
    console.log('\n3️⃣ Verificando clientes individuales...');
    const { data: individualClients, error: individualError } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', 'e27b3162-e7db-4b00-bc60-32abea7e171b');

    if (individualError) {
      console.log('❌ Error obteniendo clientes individuales:', individualError.message);
    } else {
      console.log(`✅ Encontrados ${individualClients.length} clientes individuales:`);
      individualClients.forEach(client => {
        console.log(`   - ${client.business_name} (RUT: ${client.rut})`);
      });
    }

    // 4. Verificar deudores
    console.log('\n4️⃣ Verificando deudores...');
    const { data: debtors, error: debtorsError } = await supabase
      .from('debtors')
      .select('*')
      .eq('company_id', 'e27b3162-e7db-4b00-bc60-32abea7e171b');

    if (debtorsError) {
      console.log('❌ Error obteniendo deudores:', debtorsError.message);
    } else {
      console.log(`✅ Encontrados ${debtors.length} deudores:`);
      debtors.forEach(debtor => {
        console.log(`   - ${debtor.name} (RUT: ${debtor.rut})`);
      });
    }

    // 5. Verificar deudas
    console.log('\n5️⃣ Verificando deudas...');
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .eq('company_id', 'e27b3162-e7db-4b00-bc60-32abea7e171b');

    if (debtsError) {
      console.log('❌ Error obteniendo deudas:', debtsError.message);
    } else {
      console.log(`✅ Encontradas ${debts.length} deudas:`);
      debts.forEach(debt => {
        console.log(`   - $${debt.amount} (Cliente: ${debt.client_id || 'No asignado'})`);
      });
    }

    console.log('\n📋 RESUMEN FINAL:');
    console.log(`   - Cliente corporativo: 1 (NexuPay Cobranzas)`);
    console.log(`   - Clientes individuales: ${individualClients.length}`);
    console.log(`   - Deudores: ${debtors.length}`);
    console.log(`   - Deudas: ${debts.length}`);
    console.log(`   - Total potenciales: ${1 + individualClients.length + debtors.length}`);

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

fixCorporateClient();