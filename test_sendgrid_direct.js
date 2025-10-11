/**
 * Script para probar SendGrid directamente
 * Verifica si la API key y configuración son correctas
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Función para cargar variables de entorno desde .env
function loadEnv() {
  try {
    const envPath = resolve('.env');
    const envContent = readFileSync(envPath, 'utf8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key] = valueParts.join('=');
        }
      }
    });

    return envVars;
  } catch (error) {
    console.warn('No se pudo cargar .env, usando valores por defecto');
    return {};
  }
}

// Cargar variables de entorno
const envVars = loadEnv();

// Configuración de Supabase
const supabaseUrl = envVars.VITE_SUPABASE_URL || 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSendGridDirect() {
  try {
    console.log('🔍 Probando SendGrid directamente...\n');

    // 1. Verificar que la función existe y está activa
    console.log('📡 Verificando función send-email...');
    
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: 'test@example.com',
          subject: 'Test Directo - SendGrid',
          html: '<h1>Test</h1><p>Este es un test directo de SendGrid</p>',
          text: 'Test directo de SendGrid'
        }
      });

      console.log('📊 Respuesta completa:', JSON.stringify({ data, error }, null, 2));

      if (error) {
        console.error('❌ Error en la función:', error.message);
        
        // Analizar el error específico
        if (error.message?.includes('500')) {
          console.log('\n🔍 Análisis del Error 500:');
          console.log('Las variables están configuradas pero hay un problema interno.');
          console.log('');
          console.log('Posibles causas:');
          console.log('1. SENDGRID_API_KEY es inválida o expiró');
          console.log('2. SENDGRID_FROM_EMAIL no está verificado en SendGrid');
          console.log('3. Problema con la cuenta de SendGrid');
          console.log('4. La función necesita ser redesplegada');
          
          console.log('\n🔧 Pasos para diagnosticar:');
          console.log('1. Verifica que la API key sea válida en SendGrid');
          console.log('2. Confirma que hola@aintelligence.cl esté verificado');
          console.log('3. Revisa los logs de la función en Supabase Dashboard');
          console.log('4. Intenta redesplegar la función');
        }

        return;
      }

      if (data?.success) {
        console.log('✅ SendGrid funciona correctamente!');
        console.log('📧 Message ID:', data.messageId);
        console.log('📬 El email fue enviado a test@example.com');
      } else {
        console.error('❌ Respuesta inesperada:', data);
      }

    } catch (invokeError) {
      console.error('❌ Error al invocar función:', invokeError.message);
      
      if (invokeError.message?.includes('Failed to fetch')) {
        console.log('\n🔧 La función no está desplegada o hay problema de red');
      }
    }

  } catch (error) {
    console.error('💥 Error en la prueba:', error);
  }
}

// Ejecutar la prueba
testSendGridDirect();