// Script final para verificar y confirmar los datos de NexuPay Cobranzas
const { createClient } = require('@supabase/supabase-js');

// Usar las credenciales correctas del .env
const SUPABASE_URL = 'https://wvluqdldygmgncqqjkow.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

console.log('🔍 VERIFICACIÓN FINAL DE DATOS - NEXUPAY COBRANZAS');
console.log('='.repeat(60));

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyFinalData() {
  try {
    // Paso 1: Buscar la empresa
    console.log('📋 Buscando empresa NexuPay Cobranzas...');
    
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('contact_email', 'empresa@nexupay.cl')
      .single();
    
    if (companyError) {
      console.error('❌ Error buscando empresa:', companyError.message);
      
      // Intentar buscar por nombre
      console.log('🔄 Intentando búsqueda por nombre...');
      const { data: nameData, error: nameError } = await supabase
        .from('companies')
        .select('*')
        .ilike('company_name', '%NexuPay%')
        .limit(5);
      
      if (nameError) {
        console.error('❌ Error en búsqueda por nombre:', nameError.message);
        return;
      }
      
      if (nameData && nameData.length > 0) {
        console.log(`📋 Encontradas ${nameData.length} empresas con "NexuPay":`);
        nameData.forEach((company, index) => {
          console.log(`   ${index + 1}. ${company.company_name} (${company.contact_email})`);
        });
        return;
      } else {
        console.log('❌ No se encontró ninguna empresa con "NexuPay"');
        return;
      }
    }
    
    // Paso 2: Mostrar datos actuales
    console.log('\n📊 DATOS ACTUALES DE LA EMPRESA:');
    console.log('='.repeat(40));
    console.log(`🆔 ID: ${companyData.id}`);
    console.log(`🏢 Nombre: ${companyData.company_name}`);
    console.log(`📋 RUT: ${companyData.rut}`);
    console.log(`📧 Email: ${companyData.contact_email}`);
    console.log(`📞 Teléfono: ${companyData.contact_phone}`);
    console.log(`👤 Usuario ID: ${companyData.user_id}`);
    console.log(`📅 Creado: ${companyData.created_at}`);
    console.log(`🔄 Actualizado: ${companyData.updated_at}`);
    
    // Paso 3: Verificar columnas adicionales
    console.log('\n📋 COLUMNAS DISPONIBLES:');
    console.log('='.repeat(30));
    const columns = Object.keys(companyData);
    columns.forEach((column, index) => {
      const value = companyData[column];
      const displayValue = value ? (typeof value === 'object' ? '[Object]' : value) : 'null';
      console.log(`${(index + 1).toString().padStart(2)}. ${column.padEnd(25)}: ${displayValue}`);
    });
    
    // Paso 4: Verificar si los datos son correctos
    console.log('\n✅ VERIFICACIÓN DE DATOS REQUERIDOS:');
    console.log('='.repeat(45));
    
    const expectedData = {
      company_name: 'NexuPay Cobranzas',
      rut: '78179864-9',
      contact_phone: '+56966685967',
      legal_representative_name: 'Camilo Alegria',
      legal_representative_rut: '16323735-0'
    };
    
    let allCorrect = true;
    
    Object.entries(expectedData).forEach(([field, expectedValue]) => {
      const actualValue = companyData[field];
      const isCorrect = actualValue === expectedValue;
      const status = isCorrect ? '✅' : '❌';
      const actualDisplay = actualValue || '[No disponible]';
      
      console.log(`${status} ${field}: ${actualDisplay} ${!isCorrect ? `(esperado: ${expectedValue})` : ''}`);
      
      if (!isCorrect) {
        allCorrect = false;
      }
    });
    
    // Paso 5: Resumen final
    console.log('\n📋 RESUMEN FINAL:');
    console.log('='.repeat(20));
    
    if (allCorrect) {
      console.log('🎉 ¡TODOS LOS DATOS SON CORRECTOS!');
      console.log('✅ La información de NexuPay Cobranzas está actualizada');
    } else {
      console.log('⚠️ HAY DATOS QUE NECESITAN CORRECCIÓN');
      console.log('📝 Se recomienda ejecutar el script de actualización');
    }
    
    // Paso 6: Sugerencias
    console.log('\n💡 SUGERENCIAS:');
    console.log('='.repeat(15));
    
    if (!companyData.legal_representative_name) {
      console.log('• Considerar agregar columna legal_representative_name');
    }
    
    if (!companyData.legal_representative_rut) {
      console.log('• Considerar agregar columna legal_representative_rut');
    }
    
    if (companyData.rut !== '78179864-9') {
      console.log('• El RUT necesita ser actualizado');
    }
    
    if (companyData.contact_phone !== '+56966685967') {
      console.log('• El teléfono necesita ser actualizado');
    }
    
    console.log('\n🏁 Verificación completada');
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

verifyFinalData().then(() => {
  console.log('\n🎯 Proceso finalizado');
}).catch(error => {
  console.error('❌ Error en promesa:', error.message);
});