const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCorporateClientsStructure() {
  console.log('🔍 Verificando estructura detallada de corporate_clients\n');

  try {
    // 1. Obtener todos los clientes corporativos para ver la estructura
    console.log('1. 📋 ESTRUCTURA DE LA TABLA corporate_clients:');
    const { data: corporateClients, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*');

    if (corporateError) {
      console.error('❌ Error al obtener clientes corporativos:', corporateError);
      return;
    }

    if (corporateClients.length > 0) {
      // Mostrar columnas disponibles
      const columns = Object.keys(corporateClients[0]);
      console.log('   Columnas disponibles:', columns.join(', '));
      console.log('');
      
      console.log(`   Datos actuales (${corporateClients.length} registros):`);
      corporateClients.forEach(client => {
        console.log(`   - ID: ${client.id}`);
        console.log(`     Company ID: ${client.company_id || 'NULL'}`);
        console.log(`     Company Name: ${client.company_name || 'NULL'}`);
        console.log(`     Contact Email: ${client.contact_email || 'NULL'}`);
        console.log(`     Contact Phone: ${client.contact_phone || 'NULL'}`);
        console.log(`     Created At: ${client.created_at || 'NULL'}`);
        console.log(`     Updated At: ${client.updated_at || 'NULL'}`);
        console.log('');
      });
    } else {
      console.log('❌ No se encontraron clientes corporativos');
      return;
    }

    // 2. Verificar la función getCorporateClients en databaseService.js
    console.log('2. 🔍 REVISANDO FUNCIÓN getCorporateClients:');
    const fs = require('fs');
    const path = require('path');
    
    const databaseServicePath = path.join(__dirname, '..', 'src', 'services', 'databaseService.js');
    
    if (fs.existsSync(databaseServicePath)) {
      const databaseServiceContent = fs.readFileSync(databaseServicePath, 'utf8');
      
      // Buscar la función getCorporateClients
      const getCorporateClientsMatch = databaseServiceContent.match(/export const getCorporateClients = \([\s\S]*?\n\}/);
      
      if (getCorporateClientsMatch) {
        console.log('   ✅ Función getCorporateClients encontrada:');
        console.log(getCorporateClientsMatch[0]);
      } else {
        console.log('   ❌ Función getCorporateClients no encontrada');
      }
    } else {
      console.log('   ❌ Archivo databaseService.js no encontrado');
    }

    // 3. Verificar si hay alguna columna que pueda indicar estado
    console.log('3. 🏢 VERIFICANDO ESTADO DE CLIENTES CORPORATIVOS:');
    
    // Buscar cualquier columna que pueda ser de estado
    const possibleStatusColumns = ['active', 'is_active', 'status', 'enabled', 'is_enabled'];
    const availableColumns = Object.keys(corporateClients[0]);
    const statusColumns = availableColumns.filter(col => possibleStatusColumns.includes(col.toLowerCase()));
    
    if (statusColumns.length > 0) {
      console.log('   Columnas de estado encontradas:', statusColumns);
      
      statusColumns.forEach(col => {
        console.log(`   Valores en ${col}:`);
        corporateClients.forEach(client => {
          console.log(`     - ${client.contact_email}: ${client[col]}`);
        });
      });
    } else {
      console.log('   ❌ No se encontraron columnas de estado');
      console.log('   📝 Todos los clientes corporativos deberían ser visibles si no hay filtro de estado');
    }

    // 4. Verificar clientes individuales asociados
    console.log('4. 👥 CLIENTES INDIVIDUALES ASOCIADOS:');
    const { data: individualClients } = await supabase
      .from('clients')
      .select('*')
      .in('corporate_client_id', corporateClients.map(c => c.id));

    if (individualClients && individualClients.length > 0) {
      console.log(`   ✅ Se encontraron ${individualClients.length} clientes individuales:`);
      individualClients.forEach(client => {
        const corporate = corporateClients.find(c => c.id === client.corporate_client_id);
        console.log(`     - 👤 ${client.business_name || 'Sin nombre'} (${client.rut})`);
        console.log(`       🏢 Asociado a: ${corporate?.company_name || corporate?.contact_email}`);
        console.log(`       📧 Email: ${client.contact_email || 'Sin email'}`);
      });
    } else {
      console.log('   ❌ No se encontraron clientes individuales asociados');
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkCorporateClientsStructure();