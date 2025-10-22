require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  console.log('🔍 Verificando estructura de la tabla companies');
  console.log('===============================================');

  try {
    // Obtener todas las empresas para ver la estructura
    const { data: companies, error } = await supabase
      .from('companies')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Error obteniendo empresas:', error);
      return;
    }

    if (companies.length === 0) {
      console.log('ℹ️ No hay empresas en la tabla');
      return;
    }

    console.log('📊 Estructura de la tabla companies:');
    console.log('=====================================');
    
    // Mostrar las columnas disponibles
    const firstCompany = companies[0];
    console.log('Columnas disponibles:');
    Object.keys(firstCompany).forEach(key => {
      console.log(`   - ${key}: ${firstCompany[key]}`);
    });

    console.log('\n📋 Empresas existentes:');
    companies.forEach(company => {
      console.log(`   ID: ${company.id}`);
      if (company.name) console.log(`   Nombre: ${company.name}`);
      if (company.business_name) console.log(`   Business Name: ${company.business_name}`);
      if (company.contact_email) console.log(`   Email: ${company.contact_email}`);
      console.log('   ---');
    });

  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
}

checkTableStructure();