/**
 * Script para probar la función getCompanyDebts corregida
 * Verifica que ahora incluya información del deudor desde la tabla clients
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Usar las mismas variables que los otros scripts
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGx5Z21nbmNxamtvdyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzI5NTM0ODk5LCJleHAiOjIwNDUxMTA4OTl9.qh5LcRJ3gTqYqjV3pL1aG6oXhIhX3k9f8Q4w4N8L4x4';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Importar la función getCompanyDebts desde databaseService.js
 * Nota: Como es un módulo ES, necesitamos usar una importación dinámica
 */
async function testGetCompanyDebts() {
  try {
    console.log('🔍 Probando función getCompanyDebts corregida...\n');

    // Importar dinámicamente la función
    const { getCompanyDebts } = await import('../src/services/databaseService.js');

    // Obtener ID de empresa de prueba (empresa@nexupay.cl)
    const { data: companies } = await supabase
      .from('companies')
      .select('id, business_name, contact_email')
      .eq('contact_email', 'empresa@nexupay.cl')
      .limit(1);

    if (!companies || companies.length === 0) {
      console.error('❌ No se encontró empresa de prueba');
      return;
    }

    const testCompany = companies[0];
    console.log(`📋 Usando empresa de prueba: ${testCompany.business_name} (${testCompany.id})\n`);

    // Probar la función getCompanyDebts
    console.log('🚀 Llamando a getCompanyDebts...');
    const { debts, error } = await getCompanyDebts(testCompany.id);

    if (error) {
      console.error('❌ Error en getCompanyDebts:', error);
      return;
    }

    console.log(`📊 Se encontraron ${debts.length} deudas\n`);

    if (debts.length === 0) {
      console.log('⚠️ No hay deudas para probar');
      return;
    }

    // Analizar cada deuda encontrada
    debts.forEach((debt, index) => {
      console.log(`📋 Deuda ${index + 1}:`);
      console.log(`   ID: ${debt.id}`);
      console.log(`   Monto: $${debt.current_amount || debt.original_amount}`);
      console.log(`   Descripción: ${debt.description}`);
      console.log(`   Estado: ${debt.status}`);
      console.log(`   Client ID: ${debt.client_id || 'N/A'}`);
      console.log(`   User ID: ${debt.user_id || 'N/A'}`);
      
      // Verificar campos nuevos agregados por la corrección
      console.log(`   🎯 Debtor Name: ${debt.debtor_name || 'NO ENCONTRADO'}`);
      console.log(`   🎯 Debtor RUT: ${debt.debtor_rut || 'NO ENCONTRADO'}`);
      console.log(`   🎯 Debtor Email: ${debt.debtor_email || 'NO ENCONTRADO'}`);
      console.log(`   🎯 Debtor Phone: ${debt.debtor_phone || 'NO ENCONTRADO'}`);
      
      // Verificar información del cliente
      if (debt.client_info) {
        console.log(`   📄 Client Info: ${debt.client_info.business_name} (${debt.client_info.rut})`);
      }
      
      // Verificar información del usuario
      if (debt.user_info) {
        console.log(`   👤 User Info: ${debt.user_info.full_name} (${debt.user_info.rut})`);
      }
      
      console.log('');
    });

    // Verificar si la corrección funcionó
    const debtsWithDebtorInfo = debts.filter(debt => 
      debt.debtor_name && debt.debtor_name !== 'Deudor desconocido'
    );

    console.log(`✅ Deudas con información de deudor: ${debtsWithDebtorInfo.length}/${debts.length}`);

    if (debtsWithDebtorInfo.length > 0) {
      console.log('🎉 ¡CORRECCIÓN EXITOSA! Las deudas ahora incluyen información del deudor');
      
      // Mostrar ejemplo de deuda con información completa
      const exampleDebt = debtsWithDebtorInfo[0];
      console.log('\n📄 Ejemplo de deuda completa:');
      console.log(`   Deudor: ${exampleDebt.debtor_name} (${exampleDebt.debtor_rut})`);
      console.log(`   Contacto: ${exampleDebt.debtor_email} | ${exampleDebt.debtor_phone}`);
      console.log(`   Deuda: $${exampleDebt.current_amount || exampleDebt.original_amount}`);
      console.log(`   Estado: ${exampleDebt.status}`);
    } else {
      console.log('❌ La corrección no funcionó. Las deudas aún no tienen información del deudor.');
    }

  } catch (error) {
    console.error('💥 Error en la prueba:', error);
  }
}

// Ejecutar la prueba
testGetCompanyDebts().then(() => {
  console.log('\n✅ Prueba completada');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});