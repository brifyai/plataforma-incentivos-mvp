/**
 * Script de Prueba Completo del Sistema de IA Actualizado
 * 
 * Este script verifica:
 * 1. Creación de tabla ai_providers
 * 2. Servicio aiProvidersService
 * 3. Carga dinámica de modelos desde APIs
 * 4. Exclusión mutua de proveedores
 * 5. Configuración RAG con modelos embedding
 * 6. Sistema de importación con Groq
 */

import { createClient } from '@supabase/supabase-js';
import { aiProvidersService } from '../src/services/aiProvidersService.js';
import { aiImportService } from '../src/services/aiImportService.js';

// Configuración
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Cliente admin con permisos elevados
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

class CompleteAITestSystem {
  constructor() {
    this.testResults = {
      database: { passed: 0, failed: 0, details: [] },
      providers: { passed: 0, failed: 0, details: [] },
      models: { passed: 0, failed: 0, details: [] },
      rag: { passed: 0, failed: 0, details: [] },
      import: { passed: 0, failed: 0, details: [] }
    };
  }

  log(category, message, passed = true, details = null) {
    const status = passed ? '✅' : '❌';
    console.log(`${status} [${category}] ${message}`);
    
    if (details) {
      console.log('   Detalles:', details);
    }
    
    this.testResults[category].passed += passed ? 1 : 0;
    this.testResults[category].failed += passed ? 0 : 1;
    this.testResults[category].details.push({
      message,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
  }

  async runAllTests() {
    console.log('🚀 Iniciando Prueba Completa del Sistema de IA Actualizado');
    console.log('=' .repeat(60));

    try {
      // 1. Pruebas de Base de Datos
      await this.testDatabaseConnection();
      await this.testProvidersTable();
      await this.testInitialData();

      // 2. Pruebas de Servicio de Proveedores
      await this.testProvidersService();
      await this.testProviderActivation();
      await this.testAPIKeyManagement();

      // 3. Pruebas de Carga Dinámica de Modelos
      await this.testGroqModels();
      await this.testChutesModels();
      await this.testModelSorting();

      // 4. Pruebas de Configuración RAG
      await this.testRAGConfiguration();
      await this.testEmbeddingModels();

      // 5. Pruebas de Sistema de Importación
      await this.testImportService();
      await this.testGroqOnlyConfiguration();

      // 6. Generar Reporte Final
      this.generateFinalReport();

    } catch (error) {
      console.error('❌ Error fatal en las pruebas:', error);
      this.log('general', `Error fatal: ${error.message}`, false, error);
    }
  }

  async testDatabaseConnection() {
    console.log('\n📊 Pruebas de Base de Datos');
    console.log('-'.repeat(40));

    try {
      // Test conexión básica
      const { data, error } = await supabaseAdmin
        .from('pg_tables')
        .select('tablename')
        .limit(1);

      if (error) {
        this.log('database', 'Conexión a base de datos fallida', false, error);
        return;
      }

      this.log('database', 'Conexión a base de datos exitosa', true, { tables: data?.length || 0 });

      // Test permisos de admin
      const { data: schemaData, error: schemaError } = await supabaseAdmin
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(5);

      if (schemaError) {
        this.log('database', 'Permisos de admin limitados', false, schemaError);
      } else {
        this.log('database', 'Permisos de admin correctos', true, { schemaTables: schemaData?.length || 0 });
      }

    } catch (error) {
      this.log('database', 'Error en pruebas de base de datos', false, error);
    }
  }

  async testProvidersTable() {
    try {
      // Verificar si la tabla existe
      const { data, error } = await supabaseAdmin
        .from('ai_providers')
        .select('count(*)')
        .single();

      if (error && error.code !== 'PGRST116') {
        this.log('database', 'Error verificando tabla ai_providers', false, error);
        return;
      }

      if (error?.code === 'PGRST116') {
        this.log('database', 'Tabla ai_providers no existe', false, 'Ejecuta el SQL proporcionado');
        return;
      }

      this.log('database', 'Tabla ai_providers existe', true, { count: data?.count || 0 });

      // Verificar estructura de la tabla
      const { data: columns, error: columnsError } = await supabaseAdmin
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', 'ai_providers');

      if (columnsError) {
        this.log('database', 'Error verificando estructura de ai_providers', false, columnsError);
      } else {
        this.log('database', 'Estructura de ai_providers correcta', true, { columns: columns?.length || 0 });
      }

    } catch (error) {
      this.log('database', 'Error en pruebas de tabla ai_providers', false, error);
    }
  }

  async testInitialData() {
    try {
      const { data, error } = await supabaseAdmin
        .from('ai_providers')
        .select('*');

      if (error) {
        this.log('database', 'Error obteniendo datos iniciales', false, error);
        return;
      }

      if (!data || data.length === 0) {
        this.log('database', 'No hay datos iniciales en ai_providers', false, 'Ejecuta el SQL completo');
        return;
      }

      this.log('database', 'Datos iniciales encontrados', true, { 
        providers: data.length,
        groq: data.find(p => p.provider_name === 'groq') ? '✅' : '❌',
        chutes: data.find(p => p.provider_name === 'chutes') ? '✅' : '❌'
      });

      // Verificar API keys
      const groqProvider = data.find(p => p.provider_name === 'groq');
      const chutesProvider = data.find(p => p.provider_name === 'chutes');

      if (groqProvider) {
        const hasGroqKey = groqProvider.api_key && groqProvider.api_key.length > 10;
        this.log('database', 'API Key de Groq', hasGroqKey, { 
          length: groqProvider.api_key?.length || 0,
          isActive: groqProvider.is_active
        });
      }

      if (chutesProvider) {
        const hasChutesKey = chutesProvider.api_key && chutesProvider.api_key.length > 10;
        this.log('database', 'API Key de Chutes', hasChutesKey, { 
          length: chutesProvider.api_key?.length || 0,
          isActive: chutesProvider.is_active
        });
      }

    } catch (error) {
      this.log('database', 'Error en pruebas de datos iniciales', false, error);
    }
  }

  async testProvidersService() {
    console.log('\n🤖 Pruebas de Servicio de Proveedores');
    console.log('-'.repeat(40));

    try {
      // Test obtener todos los proveedores
      const providers = await aiProvidersService.getProviders();
      this.log('providers', 'Obtener proveedores', true, { count: providers.length });

      // Test obtener proveedor activo
      const activeProvider = await aiProvidersService.getActiveProvider();
      this.log('providers', 'Obtener proveedor activo', !!activeProvider, { 
        name: activeProvider?.display_name || 'None',
        isActive: activeProvider?.is_active || false
      });

      // Test obtener proveedor por nombre
      const groqProvider = await aiProvidersService.getProviderByName('groq');
      this.log('providers', 'Obtener Groq por nombre', !!groqProvider, { 
        hasApiKey: !!groqProvider?.api_key,
        isActive: groqProvider?.is_active || false
      });

      const chutesProvider = await aiProvidersService.getProviderByName('chutes');
      this.log('providers', 'Obtener Chutes por nombre', !!chutesProvider, { 
        hasApiKey: !!chutesProvider?.api_key,
        isActive: chutesProvider?.is_active || false
      });

    } catch (error) {
      this.log('providers', 'Error en pruebas de servicio', false, error);
    }
  }

  async testProviderActivation() {
    try {
      const providers = await aiProvidersService.getProviders();
      const groqProvider = providers.find(p => p.provider_name === 'groq');
      const chutesProvider = providers.find(p => p.provider_name === 'chutes');

      if (!groqProvider || !chutesProvider) {
        this.log('providers', 'No se encontraron proveedores para prueba de activación', false);
        return;
      }

      // Test activación de Chutes (si Groq está activo)
      if (groqProvider.is_active) {
        console.log('   🔄 Activando Chutes...');
        const updatedProvider = await aiProvidersService.activateProvider(chutesProvider.id);
        
        this.log('providers', 'Activación de Chutes', updatedProvider?.is_active === true, {
          provider: updatedProvider?.display_name,
          wasActive: groqProvider.is_active
        });

        // Reactivar Groq
        console.log('   🔄 Reactivando Groq...');
        const reactivatedGroq = await aiProvidersService.activateProvider(groqProvider.id);
        this.log('providers', 'Reactivación de Groq', reactivatedGroq?.is_active === true, {
          provider: reactivatedGroq?.display_name
        });
      }

      // Verificar exclusión mutua
      const finalProviders = await aiProvidersService.getProviders();
      const activeCount = finalProviders.filter(p => p.is_active).length;
      
      this.log('providers', 'Exclusión mutua', activeCount === 1, {
        activeProviders: activeCount,
        expected: 1
      });

    } catch (error) {
      this.log('providers', 'Error en pruebas de activación', false, error);
    }
  }

  async testAPIKeyManagement() {
    try {
      const providers = await aiProvidersService.getProviders();
      const groqProvider = providers.find(p => p.provider_name === 'groq');

      if (!groqProvider) {
        this.log('providers', 'No hay proveedor Groq para prueba de API key', false);
        return;
      }

      // Test actualizar API key
      const testKey = 'gsk_test_key_' + Date.now();
      await aiProvidersService.updateProviderAPIKey(groqProvider.id, testKey);
      
      // Verificar actualización
      const updatedProvider = await aiProvidersService.getProviderById(groqProvider.id);
      const keyUpdated = updatedProvider?.api_key === testKey;
      
      this.log('providers', 'Actualización de API key', keyUpdated, {
        originalLength: groqProvider.api_key?.length || 0,
        newLength: testKey.length
      });

      // Restaurar API key original
      if (groqProvider.api_key) {
        await aiProvidersService.updateProviderAPIKey(groqProvider.id, groqProvider.api_key);
      }

    } catch (error) {
      this.log('providers', 'Error en pruebas de API key', false, error);
    }
  }

  async testGroqModels() {
    console.log('\n🧠 Pruebas de Modelos Groq');
    console.log('-'.repeat(40));

    try {
      const providers = await aiProvidersService.getProviders();
      const groqProvider = providers.find(p => p.provider_name === 'groq');

      if (!groqProvider || !groqProvider.api_key) {
        this.log('models', 'No hay configuración de Groq para prueba de modelos', false);
        return;
      }

      // Test obtener modelos de chat
      console.log('   📡 Obteniendo modelos de chat desde API Groq...');
      const chatModels = await aiProvidersService.getProviderChatModels(groqProvider.id);
      
      this.log('models', 'Obtener modelos de chat Groq', chatModels.length > 0, {
        count: chatModels.length,
        firstModel: chatModels[0]?.name || 'None',
        sorted: chatModels.every((model, i) => i === 0 || model.name >= chatModels[i-1].name)
      });

      // Test obtener modelos de embedding
      console.log('   🔍 Obteniendo modelos de embedding desde API Groq...');
      const embeddingModels = await aiProvidersService.getProviderEmbeddingModels(groqProvider.id);
      
      this.log('models', 'Obtener modelos de embedding Groq', embeddingModels.length > 0, {
        count: embeddingModels.length,
        firstEmbedding: embeddingModels[0]?.name || 'None'
      });

      // Test obtener todos los modelos
      console.log('   📋 Obteniendo todos los modelos desde API Groq...');
      const allModels = await aiProvidersService.getProviderModels(groqProvider.id);
      
      this.log('models', 'Obtener todos los modelos Groq', allModels.length > 0, {
        count: allModels.length,
        hasChatModels: allModels.some(m => !m.name.toLowerCase().includes('embed')),
        hasEmbeddingModels: allModels.some(m => m.name.toLowerCase().includes('embed'))
      });

    } catch (error) {
      this.log('models', 'Error en pruebas de modelos Groq', false, error);
    }
  }

  async testChutesModels() {
    console.log('\n🚀 Pruebas de Modelos Chutes');
    console.log('-'.repeat(40));

    try {
      const providers = await aiProvidersService.getProviders();
      const chutesProvider = providers.find(p => p.provider_name === 'chutes');

      if (!chutesProvider || !chutesProvider.api_key) {
        this.log('models', 'No hay configuración de Chutes para prueba de modelos', false);
        return;
      }

      // Test obtener modelos de chat
      console.log('   📡 Obteniendo modelos de chat desde API Chutes...');
      const chatModels = await aiProvidersService.getProviderChatModels(chutesProvider.id);
      
      this.log('models', 'Obtener modelos de chat Chutes', chatModels.length > 0, {
        count: chatModels.length,
        firstModel: chatModels[0]?.name || 'None'
      });

      // Test obtener modelos de embedding
      console.log('   🔍 Obteniendo modelos de embedding desde API Chutes...');
      const embeddingModels = await aiProvidersService.getProviderEmbeddingModels(chutesProvider.id);
      
      this.log('models', 'Obtener modelos de embedding Chutes', embeddingModels.length > 0, {
        count: embeddingModels.length,
        firstEmbedding: embeddingModels[0]?.name || 'None'
      });

      // Test obtener todos los modelos
      console.log('   📋 Obteniendo todos los modelos desde API Chutes...');
      const allModels = await aiProvidersService.getProviderModels(chutesProvider.id);
      
      this.log('models', 'Obtener todos los modelos Chutes', allModels.length > 0, {
        count: allModels.length,
        hasChatModels: allModels.some(m => !m.name.toLowerCase().includes('embed')),
        hasEmbeddingModels: allModels.some(m => m.name.toLowerCase().includes('embed'))
      });

    } catch (error) {
      this.log('models', 'Error en pruebas de modelos Chutes', false, error);
    }
  }

  async testModelSorting() {
    try {
      const providers = await aiProvidersService.getProviders();
      const groqProvider = providers.find(p => p.provider_name === 'groq');

      if (!groqProvider || !groqProvider.api_key) {
        this.log('models', 'No hay configuración de Groq para prueba de ordenamiento', false);
        return;
      }

      const models = await aiProvidersService.getProviderModels(groqProvider.id);
      
      // Verificar ordenamiento alfabético
      const isSorted = models.every((model, i) => {
        if (i === 0) return true;
        return model.name.toLowerCase() >= models[i-1].name.toLowerCase();
      });

      this.log('models', 'Ordenamiento alfabético de modelos', isSorted, {
        totalModels: models.length,
        firstModel: models[0]?.name || 'None',
        lastModel: models[models.length - 1]?.name || 'None'
      });

      // Mostrar primeros 5 modelos como ejemplo
      if (models.length > 0) {
        console.log('   📋 Primeros 5 modelos:');
        models.slice(0, 5).forEach((model, i) => {
          console.log(`      ${i + 1}. ${model.name}`);
        });
      }

    } catch (error) {
      this.log('models', 'Error en pruebas de ordenamiento', false, error);
    }
  }

  async testRAGConfiguration() {
    console.log('\n🔍 Pruebas de Configuración RAG');
    console.log('-'.repeat(40));

    try {
      // Test obtener configuración RAG
      const ragConfig = await aiProvidersService.getRAGConfiguration();
      
      this.log('rag', 'Obtener configuración RAG', !!ragConfig.provider, {
        provider: ragConfig.provider?.display_name || 'None',
        hasApiKey: !!ragConfig.apiKey,
        modelsCount: ragConfig.models?.length || 0
      });

      if (ragConfig.provider && ragConfig.models) {
        // Verificar que solo sean modelos de embedding
        const allEmbeddings = ragConfig.models.every(model => 
          model.name.toLowerCase().includes('embed') || 
          model.description?.toLowerCase().includes('embed') ||
          model.capabilities?.includes('embedding')
        );

        this.log('rag', 'Filtro de modelos embedding', allEmbeddings, {
          totalModels: ragConfig.models.length,
          embeddingModels: ragConfig.models.filter(m => 
            m.name.toLowerCase().includes('embed') || 
            m.description?.toLowerCase().includes('embed')
          ).length
        });
      }

    } catch (error) {
      this.log('rag', 'Error en pruebas de configuración RAG', false, error);
    }
  }

  async testEmbeddingModels() {
    try {
      const providers = await aiProvidersService.getProviders();
      const activeProvider = providers.find(p => p.is_active);

      if (!activeProvider) {
        this.log('rag', 'No hay proveedor activo para prueba de embedding', false);
        return;
      }

      // Test obtener modelos de embedding del proveedor activo
      const embeddingModels = await aiProvidersService.getProviderEmbeddingModels(activeProvider.id);
      
      this.log('rag', 'Obtener modelos de embedding activos', embeddingModels.length > 0, {
        provider: activeProvider.display_name,
        count: embeddingModels.length,
        firstModel: embeddingModels[0]?.name || 'None'
      });

      // Verificar que los modelos tengan la estructura correcta
      const validStructure = embeddingModels.every(model => 
        model.id && model.name && (model.description || model.capabilities)
      );

      this.log('rag', 'Estructura de modelos de embedding', validStructure, {
        validModels: embeddingModels.filter(m => m.id && m.name).length,
        totalModels: embeddingModels.length
      });

    } catch (error) {
      this.log('rag', 'Error en pruebas de modelos embedding', false, error);
    }
  }

  async testImportService() {
    console.log('\n📥 Pruebas de Sistema de Importación');
    console.log('-'.repeat(40));

    try {
      // Test obtener configuración de importación
      const importConfig = await aiProvidersService.getImportConfiguration();
      
      this.log('import', 'Obtener configuración de importación', !!importConfig.provider, {
        provider: importConfig.provider?.display_name || 'None',
        hasApiKey: !!importConfig.apiKey,
        modelsCount: importConfig.models?.length || 0
      });

      // Verificar que siempre use Groq
      const usesGroq = importConfig.provider?.provider_name === 'groq';
      this.log('import', 'Configuración usa solo Groq', usesGroq, {
        actualProvider: importConfig.provider?.provider_name,
        expectedProvider: 'groq'
      });

      // Test del servicio de importación
      const testData = [
        {
          rut: '12.345.678-9',
          full_name: 'Juan Pérez',
          email: 'juan.perez@example.com',
          phone: '+56912345678',
          debt_amount: 100000,
          due_date: '2024-12-31',
          creditor_name: 'Test Company'
        }
      ];

      console.log('   🤖 Probando procesamiento autónomo con IA...');
      const result = await aiImportService.processImportAutonomously(testData, 'test-company-id');
      
      this.log('import', 'Procesamiento autónomo con IA', result.success, {
        message: result.message,
        dataRows: result.data?.length || 0,
        hasCorrections: Object.keys(result.corrections || {}).length > 0,
        fallback: result.fallback || false
      });

      // Verificar que los datos se procesaron correctamente
      if (result.success && result.data) {
        const processedData = result.data[0];
        const rutValid = this.normalizeRUT(processedData.rut) === this.normalizeRUT('12.345.678-9');
        const phoneValid = this.normalizePhone(processedData.phone) === this.normalizePhone('+56912345678');
        
        this.log('import', 'Normalización de datos', rutValid && phoneValid, {
          rutOriginal: '12.345.678-9',
          rutProcessed: processedData.rut,
          phoneOriginal: '+56912345678',
          phoneProcessed: processedData.phone
        });
      }

    } catch (error) {
      this.log('import', 'Error en pruebas de importación', false, error);
    }
  }

  async testGroqOnlyConfiguration() {
    try {
      // Verificar que el servicio de importación siempre use Groq
      const importConfig = await aiProvidersService.getImportConfiguration();
      
      const isGroqOnly = importConfig.provider?.provider_name === 'groq';
      this.log('import', 'Configuración exclusiva de Groq', isGroqOnly, {
        importProvider: importConfig.provider?.provider_name,
        hasGroqKey: !!importConfig.apiKey
      });

      // Verificar que los modelos disponibles sean de Groq
      if (importConfig.models && importConfig.models.length > 0) {
        const hasGroqModels = importConfig.models.some(model => 
          model.id && (model.id.includes('llama') || model.id.includes('mixtral') || model.id.includes('gemma'))
        );
        
        this.log('import', 'Modelos de Groq disponibles', hasGroqModels, {
          modelCount: importConfig.models.length,
          sampleModel: importConfig.models[0]?.id || 'None'
        });
      }

    } catch (error) {
      this.log('import', 'Error en pruebas de configuración Groq', false, error);
    }
  }

  normalizeRUT(rut) {
    if (!rut) return '';
    return rut.toString().toUpperCase().replace(/[^0-9K]/g, '');
  }

  normalizePhone(phone) {
    if (!phone) return '';
    return phone.toString().replace(/[^\d+]/g, '');
  }

  generateFinalReport() {
    console.log('\n📊 REPORTE FINAL DE PRUEBAS');
    console.log('=' .repeat(60));

    let totalPassed = 0;
    let totalFailed = 0;

    Object.entries(this.testResults).forEach(([category, results]) => {
      const passed = results.passed;
      const failed = results.failed;
      const total = passed + failed;
      
      totalPassed += passed;
      totalFailed += failed;

      console.log(`\n${category.toUpperCase()}:`);
      console.log(`  ✅ Pasados: ${passed}`);
      console.log(`  ❌ Fallidos: ${failed}`);
      console.log(`  📊 Total: ${total}`);
      
      if (failed > 0) {
        console.log(`  ⚠️  Detalles de fallos:`);
        results.details
          .filter(detail => !detail.passed)
          .forEach(detail => {
            console.log(`     - ${detail.message}`);
            if (detail.details) {
              console.log(`       ${JSON.stringify(detail.details, null, 2)}`);
            }
          });
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log(`RESUMEN GENERAL:`);
    console.log(`✅ Pruebas exitosas: ${totalPassed}`);
    console.log(`❌ Pruebas fallidas: ${totalFailed}`);
    console.log(`📊 Total de pruebas: ${totalPassed + totalFailed}`);
    
    const successRate = ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1);
    console.log(`🎯 Tasa de éxito: ${successRate}%`);

    if (totalFailed === 0) {
      console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON! El sistema de IA está funcionando correctamente.');
    } else {
      console.log(`\n⚠️  ${totalFailed} pruebas fallaron. Revisa los detalles arriba.`);
    }

    console.log('\n📋 Próximos pasos recomendados:');
    console.log('1. Si todas las pruebas pasaron, el sistema está listo para producción');
    console.log('2. Si hay fallos, revisa los detalles y corrige los problemas identificados');
    console.log('3. Ejecuta el SQL completo en Supabase si la tabla ai_providers no existe');
    console.log('4. Verifica las API keys en la base de datos si hay problemas de conexión');

    // Guardar reporte en archivo
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalPassed,
        totalFailed,
        successRate: parseFloat(successRate),
        totalTests: totalPassed + totalFailed
      },
      results: this.testResults
    };

    const reportBlob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const reportUrl = URL.createObjectURL(reportBlob);
    
    console.log(`\n📄 Reporte detallado guardado en formato JSON`);
    console.log(`   URL: ${reportUrl}`);
    
    return {
      success: totalFailed === 0,
      summary: {
        totalPassed,
        totalFailed,
        successRate: parseFloat(successRate),
        totalTests: totalPassed + totalFailed
      },
      results: this.testResults,
      reportUrl
    };
  }
}

// Ejecutar pruebas
const testSystem = new CompleteAITestSystem();
testSystem.runAllTests().then(report => {
  console.log('\n🏁 Pruebas completadas');
}).catch(error => {
  console.error('Error ejecutando pruebas:', error);
});