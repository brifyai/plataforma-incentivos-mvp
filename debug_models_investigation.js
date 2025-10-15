/**
 * Script de Diagnóstico Completo para Problemas de Modelos de IA
 * 
 * Este script investigará por qué se muestran tan pocos modelos
 * en los proveedores de IA (Groq y Chutes)
 */

import { aiProvidersService } from './src/services/aiProvidersService.js';

// Función para probar directamente las APIs
async function testDirectAPIs() {
  console.log('🔍 === INVESTIGACIÓN DIRECTA DE APIs ===');
  
  // Test Groq API directa
  console.log('\n📡 Testeando API de Groq directamente...');
  try {
    const groqResponse = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': 'Bearer test-key',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', groqResponse.status);
    console.log('Headers:', Object.fromEntries(groqResponse.headers.entries()));
    
    if (groqResponse.ok) {
      const data = await groqResponse.json();
      console.log('✅ Groq API responde con', data.data?.length || 0, 'modelos');
      console.log('Primeros 5 modelos:', data.data?.slice(0, 5).map(m => ({
        id: m.id,
        object: m.object,
        created: m.created,
        owned_by: m.owned_by
      })));
    } else {
      const errorText = await groqResponse.text();
      console.error('❌ Error en API Groq:', errorText);
    }
  } catch (error) {
    console.error('❌ Error al conectar con API Groq:', error.message);
  }
  
  // Test Chutes API directa
  console.log('\n📡 Testeando API de Chutes directamente...');
  try {
    const chutesResponse = await fetch('https://api.chutes.ai/v1/models', {
      headers: {
        'Authorization': 'Bearer test-key',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', chutesResponse.status);
    console.log('Headers:', Object.fromEntries(chutesResponse.headers.entries()));
    
    if (chutesResponse.ok) {
      const data = await chutesResponse.json();
      console.log('✅ Chutes API responde con', data.data?.length || 0, 'modelos');
      console.log('Primeros 5 modelos:', data.data?.slice(0, 5).map(m => ({
        id: m.id,
        object: m.object,
        created: m.created,
        owned_by: m.owned_by
      })));
    } else {
      const errorText = await chutesResponse.text();
      console.error('❌ Error en API Chutes:', errorText);
    }
  } catch (error) {
    console.error('❌ Error al conectar con API Chutes:', error.message);
  }
}

// Función para verificar configuración actual
async function checkCurrentConfiguration() {
  console.log('\n🔧 === VERIFICANDO CONFIGURACIÓN ACTUAL ===');
  
  try {
    const providers = await aiProvidersService.getProviders();
    console.log('Proveedores encontrados:', providers.length);
    
    for (const provider of providers) {
      console.log(`\n📋 Proveedor: ${provider.provider_name}`);
      console.log('  - Display Name:', provider.display_name);
      console.log('  - Is Active:', provider.is_active);
      console.log('  - API Key:', provider.api_key ? `${provider.api_key.substring(0, 10)}...` : 'NO CONFIGURADA');
      console.log('  - Last Models Fetch:', provider.last_models_fetch);
      console.log('  - Models Available:', provider.models_available?.length || 0);
      console.log('  - Chat Models:', provider.chat_models?.length || 0);
      console.log('  - Embedding Models:', provider.embedding_models?.length || 0);
      
      if (provider.models_available && provider.models_available.length > 0) {
        console.log('  - Primeros 3 modelos cacheados:', provider.models_available.slice(0, 3).map(m => m.name));
      }
    }
  } catch (error) {
    console.error('❌ Error al verificar configuración:', error);
  }
}

// Función para probar con diferentes API keys
async function testWithDifferentKeys() {
  console.log('\n🔑 === PROBANDO CON DIFERENTES API KEYS ===');
  
  // Verificar variables de entorno
  console.log('Variables de entorno disponibles:');
  console.log('  - VITE_GROQ_API_KEY:', import.meta.env?.VITE_GROQ_API_KEY ? 'CONFIGURADA' : 'NO CONFIGURADA');
  console.log('  - VITE_CHUTES_API_KEY:', import.meta.env?.VITE_CHUTES_API_KEY ? 'CONFIGURADA' : 'NO CONFIGURADA');
  console.log('  - VITE_OPENAI_API_KEY:', import.meta.env?.VITE_OPENAI_API_KEY ? 'CONFIGURADA' : 'NO CONFIGURADA');
  
  // Si hay API keys configuradas, probar con ellas
  const groqKey = import.meta.env?.VITE_GROQ_API_KEY;
  const chutesKey = import.meta.env?.VITE_CHUTES_API_KEY;
  
  if (groqKey) {
    console.log('\n🧪 Probando fetchGroqModels con API key del entorno...');
    try {
      const models = await aiProvidersService.fetchGroqModels(groqKey);
      console.log('✅ Éxito: Se obtuvieron', models.length, 'modelos de Groq');
      console.log('Primeros 5 modelos:', models.slice(0, 5).map(m => m.name));
    } catch (error) {
      console.error('❌ Error con fetchGroqModels:', error.message);
    }
  }
  
  if (chutesKey) {
    console.log('\n🧪 Probando fetchChutesModels con API key del entorno...');
    try {
      const models = await aiProvidersService.fetchChutesModels(chutesKey);
      console.log('✅ Éxito: Se obtuvieron', models.length, 'modelos de Chutes');
      console.log('Primeros 5 modelos:', models.slice(0, 5).map(m => m.name));
    } catch (error) {
      console.error('❌ Error con fetchChutesModels:', error.message);
    }
  }
}

// Función para analizar la base de datos
async function analyzeDatabase() {
  console.log('\n💾 === ANÁLISIS DE BASE DE DATOS ===');
  
  try {
    const { supabase } = await import('./src/config/supabase.js');
    
    // Verificar tabla ai_providers
    console.log('📊 Verificando tabla ai_providers...');
    const { data: providers, error: providersError } = await supabase
      .from('ai_providers')
      .select('*');
    
    if (providersError) {
      console.error('❌ Error al consultar ai_providers:', providersError);
    } else {
      console.log('✅ Tabla ai_providers tiene', providers.length, 'registros');
      
      for (const provider of providers) {
        console.log(`\n📋 Registro BD - ${provider.provider_name}:`);
        console.log('  - ID:', provider.id);
        console.log('  - API Key length:', provider.api_key?.length || 0);
        console.log('  - Models Available:', provider.models_available?.length || 0);
        console.log('  - Last Fetch:', provider.last_models_fetch);
        console.log('  - Created:', provider.created_at);
        console.log('  - Updated:', provider.updated_at);
      }
    }
    
    // Verificar si hay logs o errores
    console.log('\n📝 Buscando logs o tablas relacionadas...');
    const tables = ['ai_providers', 'company_ai_config', 'model_fetch_logs'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (!error && data) {
          console.log(`✅ Tabla "${table}" existe y es accesible`);
        } else if (error) {
          console.log(`❌ Tabla "${table}" no existe o no es accesible:`, error.message);
        }
      } catch (e) {
        console.log(`❌ Error al verificar tabla "${table}":`, e.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error al analizar base de datos:', error);
  }
}

// Función principal de diagnóstico
async function runFullDiagnosis() {
  console.log('🚀 === INICIO DE DIAGNÓSTICO COMPLETO DE MODELOS DE IA ===');
  console.log('Fecha:', new Date().toISOString());
  console.log('Investigando por qué se muestran tan pocos modelos...\n');
  
  await testDirectAPIs();
  await checkCurrentConfiguration();
  await testWithDifferentKeys();
  await analyzeDatabase();
  
  console.log('\n🏁 === FIN DEL DIAGNÓSTICO ===');
  console.log('Revisa los logs arriba para identificar el problema específico.');
}

// Ejecutar diagnóstico
runFullDiagnosis().catch(error => {
  console.error('❌ Error fatal en el diagnóstico:', error);
});