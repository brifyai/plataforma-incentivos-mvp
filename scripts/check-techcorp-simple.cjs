/**
 * Script simple para buscar TechCorp en la base de datos
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTechCorp() {
  try {
    console.log('🔍 Buscando TechCorp en todas las tablas...');

    // 1. Revisar estructura de corporate_clients
    console.log('\n📋 Estructura de corporate_clients:');
    const { data: corporateColumns, error: corporateColumnsError } = await supabase
      .from('corporate_clients')
      .select('*')
      .limit(1);

    if (corporateColumnsError) {
      console.error('❌ Error en corporate_clients:', corporateColumnsError);
    } else if (corporateColumns && corporateColumns.length > 0) {
      console.log('Columnas disponibles:', Object.keys(corporateColumns[0]));
      
      // Buscar TechCorp con las columnas correctas
      const { data: corporateData, error: corporateError } = await supabase
        .from('corporate_clients')
        .select('*')
        .or('contact_name.ilike.%TechCorp%,contact_email.ilike.%techcorp%');

      if (corporateError) {
        console.error('❌ Error buscando en corporate_clients:', corporateError);
      } else {
        console.log(`📊 Encontrados ${corporateData.length} registros en corporate_clients:`);
        console.table(corporateData);
      }
    }

    // 2. Revisar estructura de clients
    console.log('\n📋 Estructura de clients:');
    const { data: clientColumns, error: clientColumnsError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);

    if (clientColumnsError) {
      console.error('❌ Error en clients:', clientColumnsError);
    } else if (clientColumns && clientColumns.length > 0) {
      console.log('Columnas disponibles:', Object.keys(clientColumns[0]));
      
      // Buscar TechCorp con las columnas correctas
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .or('name.ilike.%TechCorp%,email.ilike.%techcorp%');

      if (clientError) {
        console.error('❌ Error buscando en clients:', clientError);
      } else {
        console.log(`📊 Encontrados ${clientData.length} registros en clients:`);
        console.table(clientData);
      }
    }

    // 3. Revisar estructura de debts
    console.log('\n📋 Estructura de debts:');
    const { data: debtColumns, error: debtColumnsError } = await supabase
      .from('debts')
      .select('*')
      .limit(1);

    if (debtColumnsError) {
      console.error('❌ Error en debts:', debtColumnsError);
    } else if (debtColumns && debtColumns.length > 0) {
      console.log('Columnas disponibles:', Object.keys(debtColumns[0]));
      
      // Buscar TechCorp en descripciones u otros campos de texto
      const textFields = Object.keys(debtColumns[0]).filter(key => 
        typeof debtColumns[0][key] === 'string' && 
        ['description', 'notes', 'comments'].includes(key.toLowerCase())
      );

      if (textFields.length > 0) {
        let orConditions = textFields.map(field => `${field}.ilike.%TechCorp%`).join(',');
        const { data: debtData, error: debtError } = await supabase
          .from('debts')
          .select('*')
          .or(orConditions);

        if (debtError) {
          console.error('❌ Error buscando en debts:', debtError);
        } else {
          console.log(`📊 Encontrados ${debtData.length} registros en debts:`);
          console.table(debtData);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
}

// Ejecutar el script
checkTechCorp();