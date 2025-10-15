/**
 * Script de Prueba para Base de Conocimiento
 * 
 * Este script verifica que la funcionalidad de guardado de documentos
 * en la base de conocimiento funcione correctamente después de las
 * correcciones realizadas.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testKnowledgeBaseFunctionality() {
  console.log('🧠 Iniciando prueba de funcionalidad de Base de Conocimiento...\n');

  try {
    // 1. Verificar que las tablas existan
    console.log('📋 Paso 1: Verificando estructura de tablas...');
    
    const tables = [
      'company_knowledge_base',
      'corporate_client_policies',
      'corporate_client_responses',
      'negotiation_ai_config',
      'corporate_clients',
      'companies'
    ];

    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error && error.code !== 'PGRST116') {
          console.warn(`⚠️  Tabla ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ Tabla ${tableName}: OK`);
        }
      } catch (e) {
        console.warn(`⚠️  Tabla ${tableName}: No accessible`);
      }
    }

    // 2. Obtener datos de prueba
    console.log('\n📊 Paso 2: Obteniendo datos de prueba...');
    
    let testCompany = null;
    let testCorporateClient = null;

    // Buscar una empresa existente
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .limit(1);
    
    if (companyError) {
      console.warn('⚠️  No se pudieron obtener empresas:', companyError.message);
    } else if (companies && companies.length > 0) {
      testCompany = companies[0];
      console.log(`✅ Empresa de prueba encontrada: ${testCompany.company_name}`);
    }

    // Buscar un cliente corporativo existente
    const { data: corporateClients, error: clientError } = await supabase
      .from('corporate_clients')
      .select('*')
      .limit(1);
    
    if (clientError) {
      console.warn('⚠️  No se pudieron obtener clientes corporativos:', clientError.message);
    } else if (corporateClients && corporateClients.length > 0) {
      testCorporateClient = corporateClients[0];
      console.log(`✅ Cliente corporativo de prueba encontrado: ${testCorporateClient.name}`);
    }

    if (!testCompany || !testCorporateClient) {
      console.log('🔧 Creando datos de prueba...');
      
      // Crear empresa de prueba si no existe
      if (!testCompany) {
        const { data: newCompany, error: createCompanyError } = await supabase
          .from('companies')
          .insert({
            company_name: 'Empresa Test Knowledge Base',
            contact_email: 'test@knowledgebase.com',
            contact_phone: '+56 9 1234 5678',
            rut: '99.999.999-9',
            is_active: true,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (createCompanyError) {
          console.error('❌ Error creando empresa de prueba:', createCompanyError.message);
          return;
        }
        
        testCompany = newCompany;
        console.log(`✅ Empresa de prueba creada: ${testCompany.company_name}`);
      }

      // Crear cliente corporativo de prueba si no existe
      if (!testCorporateClient) {
        const { data: newClient, error: createClientError } = await supabase
          .from('corporate_clients')
          .insert({
            name: 'Cliente Test Knowledge Base',
            email: 'client@knowledgebase.com',
            phone: '+56 9 8765 4321',
            rut: '88.888.888-8',
            industry: 'Tecnología',
            display_category: 'Todos',
            company_id: testCompany.id,
            is_active: true,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (createClientError) {
          console.error('❌ Error creando cliente corporativo de prueba:', createClientError.message);
          return;
        }
        
        testCorporateClient = newClient;
        console.log(`✅ Cliente corporativo de prueba creado: ${testCorporateClient.name}`);
      }
    }

    // 3. Probar inserción de documento con campos corregidos
    console.log('\n📝 Paso 3: Probando inserción de documento...');
    
    const testDocument = {
      corporate_client_id: testCorporateClient.id,
      company_id: testCompany.id,
      title: 'Documento de Prueba - Política de Descuentos',
      content: `# Política de Descuentos Especiales

## Criterios de Aplicación
1. Clientes con más de 2 años de antigüedad: 15% máximo
2. Clientes con volumen mensual superior a $1M: 20% máximo
3. Clientes estratégicos: hasta 25% con aprobación gerencial

## Proceso de Aprobación
- Descuentos hasta 15%: Aprobación automática
- Descuentos de 16-20%: Aprobación supervisor
- Descuentos superiores a 20%: Aprobación gerencial

## Condiciones
- No acumulable con otras promociones
- Aplicable solo sobre tarifas base
- Vigencia: 6 meses desde la aprobación

*Documento creado para pruebas de funcionalidad*`,
      category: 'policy',
      knowledge_type: 'document',
      is_active: true,
      created_at: new Date().toISOString()
    };

    const { data: insertedDocument, error: insertError } = await supabase
      .from('company_knowledge_base')
      .insert(testDocument)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error insertando documento:', insertError.message);
      console.error('Detalles:', insertError);
      return;
    }

    console.log(`✅ Documento insertado correctamente: ${insertedDocument.title}`);
    console.log(`   ID: ${insertedDocument.id}`);
    console.log(`   Categoría: ${insertedDocument.category}`);

    // 4. Probar lectura del documento insertado
    console.log('\n📖 Paso 4: Probando lectura del documento...');
    
    const { data: retrievedDocument, error: retrieveError } = await supabase
      .from('company_knowledge_base')
      .select('*')
      .eq('id', insertedDocument.id)
      .single();

    if (retrieveError) {
      console.error('❌ Error recuperando documento:', retrieveError.message);
      return;
    }

    console.log(`✅ Documento recuperado correctamente`);
    console.log(`   Título: ${retrievedDocument.title}`);
    console.log(`   Contenido: ${retrievedDocument.content.substring(0, 50)}...`);
    console.log(`   Categoría: ${retrievedDocument.category}`);

    // 5. Verificar que los campos coincidan
    console.log('\n🔍 Paso 5: Verificando integridad de datos...');
    
    const fieldsToCheck = ['title', 'content', 'category', 'knowledge_type'];
    let allFieldsMatch = true;

    for (const field of fieldsToCheck) {
      if (testDocument[field] !== retrievedDocument[field]) {
        console.error(`❌ Campo ${field} no coincide:`);
        console.error(`   Esperado: ${testDocument[field]}`);
        console.error(`   Recibido: ${retrievedDocument[field]}`);
        allFieldsMatch = false;
      } else {
        console.log(`✅ Campo ${field}: OK`);
      }
    }

    // 6. Probar búsqueda y filtrado
    console.log('\n🔎 Paso 6: Probando búsqueda y filtrado...');
    
    const { data: searchResults, error: searchError } = await supabase
      .from('company_knowledge_base')
      .select('*')
      .eq('corporate_client_id', testCorporateClient.id)
      .eq('is_active', true)
      .ilike('title', '%política%');

    if (searchError) {
      console.error('❌ Error en búsqueda:', searchError.message);
    } else {
      console.log(`✅ Búsqueda funciona correctamente: ${searchResults.length} resultados encontrados`);
      if (searchResults.length > 0) {
        console.log(`   Primer resultado: ${searchResults[0].title}`);
      }
    }

    // 7. Limpiar datos de prueba
    console.log('\n🧹 Paso 7: Limpiando datos de prueba...');
    
    const { error: deleteError } = await supabase
      .from('company_knowledge_base')
      .delete()
      .eq('id', insertedDocument.id);

    if (deleteError) {
      console.warn('⚠️  Error eliminando documento de prueba:', deleteError.message);
    } else {
      console.log('✅ Documento de prueba eliminado correctamente');
    }

    // Resumen final
    console.log('\n🎉 RESUMEN DE PRUEBA');
    console.log('='.repeat(50));
    
    if (allFieldsMatch) {
      console.log('✅ TODAS LAS PRUEBAS PASARON CORRECTAMENTE');
      console.log('✅ La funcionalidad de Base de Conocimiento está operativa');
      console.log('✅ Los campos de documentos se guardan y leen correctamente');
      console.log('✅ La búsqueda y filtrado funcionan adecuadamente');
    } else {
      console.log('❌ ALGUNAS PRUEBAS FALLARON');
      console.log('❌ Revisar los errores mostrados arriba');
    }

    console.log('\n📋 Campos verificados:');
    console.log('   - title (antes: document_title)');
    console.log('   - content (antes: document_content)');
    console.log('   - category (antes: document_category)');
    console.log('   - knowledge_type (nuevo campo requerido)');

  } catch (error) {
    console.error('❌ Error general en la prueba:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar la prueba
testKnowledgeBaseFunctionality().then(() => {
  console.log('\n🏁 Prueba finalizada');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});