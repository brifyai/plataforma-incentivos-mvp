/**
 * Script para probar la lógica corregida de getCompanyDebts
 * Replica la función modificada directamente para evitar problemas de importación
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Usar las mismas credenciales que el script de depuración
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Versión corregida de getCompanyDebts para probar
 */
async function getCompanyDebtsFixed(companyId, clientId = null) {
  try {
    console.log('🔍 getCompanyDebtsFixed called with:', { companyId, clientId });
    
    // Consulta corregida que incluye información del cliente
    let query = supabase
      .from('debts')
      .select(`
        *,
        user:users(id, full_name, email, rut),
        client:clients(id, business_name, contact_email, rut, contact_phone)
      `);

    // Filtrar siempre por company_id
    query = query.eq('company_id', companyId);

    // Si hay clientId específico, filtrar también por client_id
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error in getCompanyDebtsFixed query:', error);
      return { debts: [], error };
    }

    console.log(`📊 Found ${data?.length || 0} debts for company ${companyId}`);
    
    // Log detallado de las deudas encontradas para depuración
    if (data && data.length > 0) {
      console.log('📋 Debts found:', data.map(d => ({
        id: d.id,
        user_id: d.user_id,
        company_id: d.company_id,
        client_id: d.client_id || 'N/A',
        user_name: d.user?.full_name,
        client_name: d.client?.business_name,
        client_rut: d.client?.rut,
        amount: d.current_amount || d.original_amount
      })));
    }

    // Enriquecer los datos con información del deudor desde clients
    const enrichedDebts = (data || []).map(debt => {
      // Priorizar información del cliente (clients) sobre el usuario (users)
      const debtorName = debt.client?.business_name || debt.user?.full_name || 'Deudor desconocido';
      const debtorRut = debt.client?.rut || debt.user?.rut || null;
      const debtorEmail = debt.client?.contact_email || debt.user?.email || null;
      const debtorPhone = debt.client?.contact_phone || null;

      return {
        ...debt,
        // Campos para compatibilidad con UI que espera debtor_name, debtor_rut, etc.
        debtor_name: debtorName,
        debtor_rut: debtorRut,
        debtor_email: debtorEmail,
        debtor_phone: debtorPhone,
        // Mantener campos originales por si se usan en otros lugares
        client_info: debt.client,
        user_info: debt.user
      };
    });

    console.log(`✅ Enriched ${enrichedDebts.length} debts with debtor information`);
    
    return { debts: enrichedDebts, error: null };
  } catch (error) {
    console.error('💥 Error in getCompanyDebtsFixed:', error);
    return { debts: [], error: 'Error al obtener deudas de la empresa.' };
  }
}

/**
 * Función de prueba principal
 */
async function testGetCompanyDebtsFixed() {
  try {
    console.log('🔍 Probando función getCompanyDebts corregida...\n');

    // Usar la empresa que sabemos que existe (empresa@nexupay.cl)
    const testCompanyId = 'e27b3162-e7db-4b00-bc60-32abea7e171b';
    console.log(`📋 Usando empresa de prueba: empresa@nexupay.cl (${testCompanyId})\n`);

    // Probar la función getCompanyDebts corregida
    console.log('🚀 Llamando a getCompanyDebtsFixed...');
    const { debts, error } = await getCompanyDebtsFixed(testCompanyId);

    if (error) {
      console.error('❌ Error en getCompanyDebtsFixed:', error);
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
testGetCompanyDebtsFixed().then(() => {
  console.log('\n✅ Prueba completada');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});