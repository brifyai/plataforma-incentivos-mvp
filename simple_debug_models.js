/**
 * Script Simple de Diagnóstico para APIs de Modelos de IA
 * No depende de módulos del proyecto
 */

console.log('🔍 === INVESTIGACIÓN DIRECTA DE APIs DE MODELOS ===');
console.log('Fecha:', new Date().toISOString());

// Función para probar API de Groq
async function testGroqAPI() {
  console.log('\n📡 Testeando API de Groq directamente...');
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer gsk_test_key_placeholder',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ Groq API responde con ÉXITO');
        console.log('Total modelos:', data.data?.length || 0);
        console.log('Estructura de respuesta:', Object.keys(data));
        
        if (data.data && data.data.length > 0) {
          console.log('\nPrimeros 10 modelos de Groq:');
          data.data.slice(0, 10).forEach((model, index) => {
            console.log(`  ${index + 1}. ${model.id} (${model.owned_by})`);
          });
          
          console.log('\nModelos de chat (contienen "llama" o "mixtral"):');
          const chatModels = data.data.filter(m => 
            m.id.includes('llama') || 
            m.id.includes('mixtral') || 
            m.id.includes('gemma')
          );
          console.log(`Total modelos de chat: ${chatModels.length}`);
          chatModels.slice(0, 5).forEach((model, index) => {
            console.log(`  - ${model.id}`);
          });
        }
      } catch (parseError) {
        console.log('Respuesta (no JSON):', responseText.substring(0, 200));
      }
    } else {
      console.error('❌ Error en API Groq:', responseText);
      
      // Analizar diferentes tipos de error
      if (response.status === 401) {
        console.log('🔑 Error 401: Problema con API key (necesitamos una key real)');
      } else if (response.status === 403) {
        console.log('🚫 Error 403: Acceso prohibido');
      } else if (response.status === 429) {
        console.log('⏱️ Error 429: Demasiadas solicitudes');
      }
    }
  } catch (error) {
    console.error('❌ Error al conectar con API Groq:', error.message);
  }
}

// Función para probar API de Chutes
async function testChutesAPI() {
  console.log('\n📡 Testeando API de Chutes directamente...');
  
  try {
    const response = await fetch('https://api.chutes.ai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer chutes_test_key_placeholder',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ Chutes API responde con ÉXITO');
        console.log('Total modelos:', data.data?.length || 0);
        console.log('Estructura de respuesta:', Object.keys(data));
        
        if (data.data && data.data.length > 0) {
          console.log('\nPrimeros 10 modelos de Chutes:');
          data.data.slice(0, 10).forEach((model, index) => {
            console.log(`  ${index + 1}. ${model.id} (${model.owned_by})`);
          });
          
          console.log('\nModelos de embedding (contienen "embed"):');
          const embeddingModels = data.data.filter(m => 
            m.id.toLowerCase().includes('embed')
          );
          console.log(`Total modelos de embedding: ${embeddingModels.length}`);
          embeddingModels.slice(0, 5).forEach((model, index) => {
            console.log(`  - ${model.id}`);
          });
        }
      } catch (parseError) {
        console.log('Respuesta (no JSON):', responseText.substring(0, 200));
      }
    } else {
      console.error('❌ Error en API Chutes:', responseText);
      
      // Analizar diferentes tipos de error
      if (response.status === 401) {
        console.log('🔑 Error 401: Problema con API key (necesitamos una key real)');
      } else if (response.status === 403) {
        console.log('🚫 Error 403: Acceso prohibido');
      } else if (response.status === 404) {
        console.log('🔍 Error 404: Endpoint no encontrado (¿URL correcta?)');
      } else if (response.status === 429) {
        console.log('⏱️ Error 429: Demasiadas solicitudes');
      }
    }
  } catch (error) {
    console.error('❌ Error al conectar con API Chutes:', error.message);
  }
}

// Función para verificar endpoints alternativos
async function testAlternativeEndpoints() {
  console.log('\n🔄 Probando endpoints alternativos...');
  
  const endpoints = [
    { name: 'Groq OpenAI Compatible', url: 'https://api.groq.com/openai/v1/models' },
    { name: 'Groq Direct', url: 'https://api.groq.com/v1/models' },
    { name: 'Chutes OpenAI Compatible', url: 'https://api.chutes.ai/v1/models' },
    { name: 'Chutes Alternative', url: 'https://api.chutes.ai/openai/v1/models' }
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n📍 Probando ${endpoint.name}: ${endpoint.url}`);
    try {
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test_key',
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`  Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          console.log(`  ✅ Funciona - Modelos: ${data.data?.length || 0}`);
        } catch {
          console.log(`  ⚠️ Responde pero no es JSON válido`);
        }
      } else {
        const text = await response.text();
        console.log(`  ❌ Error: ${text.substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`  ❌ Error de conexión: ${error.message}`);
    }
  }
}

// Función para analizar variables de entorno
function analyzeEnvironment() {
  console.log('\n🌍 === ANÁLISIS DE ENTORNO ===');
  
  // Verificar si estamos en navegador o Node.js
  if (typeof window !== 'undefined') {
    console.log('🌐 Ejecutando en navegador');
    console.log('VITE_GROQ_API_KEY:', import.meta.env?.VITE_GROQ_API_KEY ? 'CONFIGURADA' : 'NO CONFIGURADA');
    console.log('VITE_CHUTES_API_KEY:', import.meta.env?.VITE_CHUTES_API_KEY ? 'CONFIGURADA' : 'NO CONFIGURADA');
  } else {
    console.log('💻 Ejecutando en Node.js');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'NO DEFINIDO');
  }
}

// Función principal
async function runDiagnosis() {
  console.log('🚀 Iniciando diagnóstico de APIs de modelos de IA...\n');
  
  analyzeEnvironment();
  await testGroqAPI();
  await testChutesAPI();
  await testAlternativeEndpoints();
  
  console.log('\n🏁 === CONCLUSIONES ===');
  console.log('1. Revisa los logs arriba para ver si las APIs responden');
  console.log('2. Si responden con 401, necesitas API keys reales');
  console.log('3. Si responden con otros errores, puede haber problema con los endpoints');
  console.log('4. Si no responden, puede haber problema de red o las APIs están caídas');
}

// Ejecutar diagnóstico
runDiagnosis().catch(error => {
  console.error('❌ Error fatal en el diagnóstico:', error);
});