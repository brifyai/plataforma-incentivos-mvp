/**
 * Script to check the structure of the companies table
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkCompaniesTable() {
  try {
    console.log('🔍 Verificando estructura de la tabla companies...');
    
    // Intentar obtener todas las empresas para ver la estructura
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Error consultando companies:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Estructura de la tabla companies:');
      console.log('   Columnas:', Object.keys(data[0]));
      console.log('\n📋 Datos de ejemplo:');
      data.forEach((company, index) => {
        console.log(`   ${index + 1}. ID: ${company.id}`);
        console.log(`      Name: ${company.name || company.business_name || 'N/A'}`);
        console.log(`      Email: ${company.email || company.contact_email || 'N/A'}`);
        console.log(`      RUT: ${company.rut || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('📋 La tabla companies está vacía');
    }
    
    // Ahora buscar por email para encontrar la empresa empresa@nexupay.cl
    console.log('🔍 Buscando empresa empresa@nexupay.cl...');
    
    // Probar diferentes columnas de email
    const emailColumns = ['email', 'contact_email', 'business_email', 'admin_email'];
    
    for (const col of emailColumns) {
      console.log(`   Probando columna: ${col}`);
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq(col, 'empresa@nexupay.cl')
        .single();
      
      if (!companyError && companyData) {
        console.log('✅ Empresa encontrada:');
        console.log('   ID:', companyData.id);
        console.log('   Name:', companyData.name || companyData.business_name || 'N/A');
        console.log('   Email:', companyData[col]);
        console.log('   Todas las columnas:', Object.keys(companyData));
        return companyData;
      } else {
        console.log(`   ❌ No encontrada con columna ${col}: ${companyError?.message || 'No results'}`);
      }
    }
    
    console.log('❌ No se encontró la empresa empresa@nexupay.cl en ninguna columna de email');
    
  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

checkCompaniesTable();