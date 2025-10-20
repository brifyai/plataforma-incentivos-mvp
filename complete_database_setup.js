import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Función para ejecutar SQL a través del endpoint REST de Supabase
async function executeSQL(sql) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify({ sql_query: sql })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`❌ Error ejecutando SQL:`, error.message);
    throw error;
  }
}

// Función para crear tablas individualmente usando la API REST
async function createTableViaAPI(tableName, createSQL) {
  try {
    console.log(`🔧 Creando tabla ${tableName}...`);
    
    // Intentar crear la tabla directamente
    const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({})
    });
    
    if (response.status === 406) {
      // La tabla no existe, necesitamos crearla de otra manera
      console.log(`⚠️ La tabla ${tableName} no existe. Creando manualmente...`);
      
      // Usar una inserción con estructura forzada para crear la tabla
      const testInsert = await fetch(`${supabaseUrl}/rest/v1/${tableName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          id: '00000000-0000-0000-0000-000000000000',
          corporate_client_id: '00000000-0000-0000-0000-000000000000',
          company_id: '00000000-0000-0000-0000-000000000000',
          created_at: new Date().toISOString()
        })
      });
      
      if (testInsert.status === 400 || testInsert.status === 406) {
        console.log(`❌ No se pudo crear la tabla ${tableName} automáticamente`);
        return false;
      }
    }
    
    console.log(`✅ Tabla ${tableName} verificada/creada`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error creando tabla ${tableName}:`, error.message);
    return false;
  }
}

async function setupCompleteDatabase() {
  console.log('🚀 Iniciando configuración completa de la base de datos...\n');
  
  try {
    // 1. Verificar conexión
    console.log('📡 Verificando conexión con Supabase...');
    const { data, error } = await supabase.from('companies').select('count').limit(1);
    
    if (error) {
      throw new Error(`Error de conexión: ${error.message}`);
    }
    
    console.log('✅ Conexión establecida correctamente\n');
    
    // 2. Verificar clientes corporativos existentes
    console.log('👥 Verificando clientes corporativos...');
    const { data: clients, error: clientError } = await supabase
      .from('corporate_clients')
      .select('id, name, display_category')
      .limit(10);
    
    if (clientError) {
      console.error('❌ Error al verificar clientes corporativos:', clientError.message);
    } else {
      console.log(`✅ Se encontraron ${clients?.length || 0} clientes corporativos`);
      clients?.forEach((client, i) => {
        console.log(`   ${i + 1}. ${client.name} - ${client.display_category}`);
      });
    }
    
    // 3. Intentar crear las tablas faltantes
    console.log('\n🏗️ Creando tablas de knowledge base...');
    
    const tables = [
      {
        name: 'negotiation_ai_config',
        testInsert: {
          id: '00000000-0000-0000-0000-000000000000',
          corporate_client_id: '00000000-0000-0000-0000-000000000000',
          company_id: '00000000-0000-0000-0000-000000000000',
          max_negotiation_discount: 15,
          max_negotiation_term: 12,
          auto_respond: true,
          working_hours: { start: '09:00', end: '18:00' },
          is_active: true,
          created_at: new Date().toISOString()
        }
      },
      {
        name: 'corporate_client_policies',
        testInsert: {
          id: '00000000-0000-0000-0000-000000000000',
          corporate_client_id: '00000000-0000-0000-0000-000000000000',
          company_id: '00000000-0000-0000-0000-000000000000',
          policy_name: 'Política de prueba',
          policy_type: 'discount',
          policy_description: 'Política de descuento de prueba',
          policy_value: 15.0,
          is_active: true,
          created_at: new Date().toISOString()
        }
      },
      {
        name: 'corporate_client_responses',
        testInsert: {
          id: '00000000-0000-0000-0000-000000000000',
          corporate_client_id: '00000000-0000-0000-0000-000000000000',
          company_id: '00000000-0000-0000-0000-000000000000',
          trigger_keyword: 'descuento',
          trigger_type: 'keyword',
          response_template: 'Plantilla de respuesta de prueba',
          use_debtor_name: true,
          use_corporate_name: true,
          is_active: true,
          created_at: new Date().toISOString()
        }
      },
      {
        name: 'company_knowledge_base',
        testInsert: {
          id: '00000000-0000-0000-0000-000000000000',
          corporate_client_id: '00000000-0000-0000-0000-000000000000',
          company_id: '00000000-0000-0000-0000-000000000000',
          document_title: 'Documento de prueba',
          document_content: 'Contenido del documento de prueba',
          document_category: 'general',
          is_active: true,
          created_at: new Date().toISOString()
        }
      }
    ];
    
    let createdTables = 0;
    
    for (const table of tables) {
      const success = await createTableViaAPI(table.name, table.testInsert);
      if (success) createdTables++;
      
      // Pequeña pausa para no sobrecargar la API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n📊 Resultado: ${createdTables}/${tables.length} tablas procesadas`);
    
    // 4. Insertar datos de ejemplo si hay clientes corporativos
    if (clients && clients.length > 0) {
      console.log('\n📝 Insertando datos de ejemplo...');
      
      for (const client of clients) {
        try {
          // Insertar configuración IA
          await supabase.from('negotiation_ai_config').upsert({
            corporate_client_id: client.id,
            company_id: client.company_id,
            max_negotiation_discount: 15,
            max_negotiation_term: 12,
            auto_respond: true,
            working_hours: { start: '09:00', end: '18:00' },
            is_active: true
          }, { onConflict: 'corporate_client_id,company_id' });
          
          // Insertar política de ejemplo
          await supabase.from('corporate_client_policies').insert({
            corporate_client_id: client.id,
            company_id: client.company_id,
            policy_name: 'Descuento estándar',
            policy_type: 'discount',
            policy_description: 'Descuento máximo aplicable para negociaciones',
            policy_value: 15.0,
            is_active: true
          });
          
          // Insertar respuesta de ejemplo
          await supabase.from('corporate_client_responses').insert({
            corporate_client_id: client.id,
            company_id: client.company_id,
            trigger_keyword: 'descuento',
            trigger_type: 'keyword',
            response_template: 'Hola {nombre_deudor}, como cliente de {nombre_empresa} podemos revisar opciones de descuento para ti.',
            use_debtor_name: true,
            use_corporate_name: true,
            is_active: true
          });
          
          // Insertar documento de ejemplo
          await supabase.from('company_knowledge_base').insert({
            corporate_client_id: client.id,
            company_id: client.company_id,
            document_title: 'Política de descuentos',
            document_content: 'Nuestra política permite descuentos de hasta 15% para clientes con buen historial.',
            document_category: 'policy',
            is_active: true
          });
          
          console.log(`✅ Datos insertados para ${client.name}`);
          
        } catch (error) {
          console.warn(`⚠️ Error insertando datos para ${client.name}:`, error.message);
        }
      }
    }
    
    // 5. Verificación final
    console.log('\n🔍 Verificación final...');
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table.name)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${table.name}: ${error.message}`);
        } else {
          console.log(`✅ ${table.name}: OK (${data.length} registros)`);
        }
      } catch (err) {
        console.log(`❌ ${table.name}: Error de verificación`);
      }
    }
    
    console.log('\n🎉 Configuración completada!');
    console.log('\n📋 Instrucciones manuales si algunas tablas faltan:');
    console.log('1. Ve al panel de Supabase');
    console.log('2. Ingresa al Editor SQL');
    console.log('3. Ejecuta el contenido del archivo: create_missing_knowledge_tables.sql');
    
  } catch (error) {
    console.error('❌ Error en la configuración:', error.message);
    
    console.log('\n📋 Solución alternativa manual:');
    console.log('1. Copia el contenido de create_missing_knowledge_tables.sql');
    console.log('2. Pégalo en el Editor SQL de Supabase');
    console.log('3. Ejecuta el SQL manualmente');
  }
}

// Ejecutar la configuración
setupCompleteDatabase().catch(console.error);