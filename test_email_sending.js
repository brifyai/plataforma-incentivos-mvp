/**
 * Script para probar el envío de emails directamente
 * Simula el envío de un email de invitación
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

if (!supabaseKey) {
  console.error('❌ Error: VITE_SUPABASE_ANON_KEY no está configurada');
  console.log('Configura la variable de entorno VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmailSending() {
  try {
    console.log('📧 Probando envío de email de invitación...\n');

    // Simular datos de invitación
    const invitationData = {
      fullName: 'Usuario de Prueba',
      email: 'test@example.com',
      invitationToken: 'test-invitation-token-12345',
      adminName: 'Administrador',
      completeUrl: 'http://localhost:3002/complete-registration?token=test-invitation-token-12345'
    };

    console.log('📝 Datos de invitación:', invitationData);

    // Simular envío de email usando la función edge
    console.log('🚀 Intentando enviar email via Supabase Functions...');

    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: invitationData.email,
          subject: 'Invitación a NexuPay - Completa tu registro',
          html: generateInvitationEmailHTML(invitationData),
          text: generateInvitationEmailText(invitationData)
        }
      });

      console.log('📡 Respuesta de Supabase Functions:', { data, error });

      if (error) {
        console.error('❌ Error al enviar email:', error.message);

        if (error.message?.includes('404') || error.message?.includes('Not Found')) {
          console.log('\n🔧 SOLUCIÓN: La función edge no está desplegada');
          console.log('Pasos para solucionarlo:');
          console.log('1. Ve a https://supabase.com/dashboard/project/[tu-project]/functions');
          console.log('2. Despliega la función "send-email"');
          console.log('3. Configura las variables de entorno:');
          console.log('   - SENDGRID_API_KEY');
          console.log('   - SENDGRID_FROM_EMAIL');
          console.log('   - SENDGRID_FROM_NAME');
        }

        if (error.message?.includes('500') || error.message?.includes('Internal Server Error')) {
          console.log('\n🔧 SOLUCIÓN: Error interno del servidor (500)');
          console.log('Causas probables:');
          console.log('1. SENDGRID_API_KEY no está configurada en Supabase Functions');
          console.log('2. SENDGRID_API_KEY es inválida o expiró');
          console.log('3. SENDGRID_FROM_EMAIL no está configurado');
          console.log('');
          console.log('Pasos para solucionar:');
          console.log('1. Ve a https://supabase.com/dashboard/project/wvluqdldygmgncqqjkow/functions');
          console.log('2. Selecciona la función "send-email"');
          console.log('3. Ve a "Settings" > "Secrets"');
          console.log('4. Agrega estas variables:');
          console.log('   - SENDGRID_API_KEY: SG.xxxxxxxxxxxx...');
          console.log('   - SENDGRID_FROM_EMAIL: hola@aintelligence.cl');
          console.log('   - SENDGRID_FROM_NAME: AIntelligence');
          console.log('5. Redespliega la función');
        }

        if (error.message?.includes('SENDGRID_API_KEY')) {
          console.log('\n🔧 SOLUCIÓN: SendGrid no está configurado');
          console.log('Configura estas variables en Supabase:');
          console.log('- SENDGRID_API_KEY: Tu API key de SendGrid');
          console.log('- SENDGRID_FROM_EMAIL: Email remitente (ej: hola@aintelligence.cl)');
          console.log('- SENDGRID_FROM_NAME: Nombre remitente (ej: AIntelligence)');
        }

        return;
      }

      if (data?.success) {
        console.log('✅ Email enviado exitosamente!');
        console.log('📧 Message ID:', data.messageId);
        console.log('📬 Revisa la bandeja de entrada de:', invitationData.email);
      } else {
        console.error('❌ Error en respuesta:', data?.error);
      }

    } catch (invokeError) {
      console.error('❌ Error al invocar función:', invokeError.message);

      if (invokeError.message?.includes('Failed to fetch') || invokeError.message?.includes('NetworkError')) {
        console.log('\n🔧 SOLUCIÓN: Función no desplegada o problema de red');
        console.log('1. Verifica que la función esté desplegada en Supabase');
        console.log('2. Revisa la conexión a internet');
        console.log('3. Verifica que el proyecto de Supabase esté activo');
      }
    }

  } catch (error) {
    console.error('💥 Error en la prueba:', error);
    process.exit(1);
  }
}

function generateInvitationEmailHTML(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invitación a NexuPay</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">¡Bienvenido a NexuPay!</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Has sido invitado por ${data.adminName}</p>
      </div>

      <div style="padding: 40px 30px; background: #ffffff;">
        <h2 style="color: #333; margin-top: 0;">Completa tu registro</h2>
        <p>Hola <strong>${data.fullName}</strong>,</p>
        <p>Has sido invitado a unirte a la plataforma NexuPay. Para completar tu registro y establecer tu contraseña, haz clic en el botón siguiente:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.completeUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Completar Registro
          </a>
        </div>

        <p style="color: #666; font-size: 14px;">
          Si el botón no funciona, copia y pega esta URL en tu navegador:<br>
          <span style="word-break: break-all; color: #0066cc;">${data.completeUrl}</span>
        </p>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #667eea;">
          <h3 style="margin-top: 0; color: #333;">Información de seguridad:</h3>
          <ul style="color: #666; margin: 10px 0;">
            <li>Este enlace es único y personal</li>
            <li>Expira en 7 días por tu seguridad</li>
            <li>No compartas este enlace con nadie</li>
          </ul>
        </div>
      </div>

      <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; color: #666; font-size: 14px;">
        <p>Este es un email automático de NexuPay.<br>
        Si tienes preguntas, contacta a soporte.</p>
      </div>
    </body>
    </html>
  `;
}

function generateInvitationEmailText(data) {
  return `
¡Bienvenido a NexuPay!

Hola ${data.fullName},

Has sido invitado a unirte a la plataforma NexuPay por ${data.adminName}.

Para completar tu registro, visita el siguiente enlace:
${data.completeUrl}

Información de seguridad:
- Este enlace es único y personal
- Expira en 7 días por tu seguridad
- No compartas este enlace con nadie

Si tienes preguntas, contacta a soporte.

Saludos,
El equipo de NexuPay
  `.trim();
}

// Ejecutar la prueba
testEmailSending();