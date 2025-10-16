/**
 * Netlify Function para Envío de Emails
 * 
 * Esta función maneja el envío de emails transaccionales
 * usando SendGrid o el servicio de email configurado
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async (event, context) => {
  // Configurar CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Manejar preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Solo permitir POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { to, subject, template, data, from } = JSON.parse(event.body);

    // Validar datos requeridos
    if (!to || !subject || !template) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields: to, subject, template' 
        })
      };
    }

    console.log('📧 Enviando email:', {
      to,
      subject,
      template,
      timestamp: new Date().toISOString()
    });

    // Obtener la plantilla de email desde Supabase
    const emailTemplate = await getEmailTemplate(template);
    
    if (!emailTemplate) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Email template not found' })
      };
    }

    // Procesar la plantilla con los datos
    const htmlContent = processTemplate(emailTemplate.html_content, data);
    const textContent = processTemplate(emailTemplate.text_content, data);

    // Enviar el email
    const result = await sendEmail({
      to,
      from: from || 'noreply@nexupay.cl',
      subject,
      html: htmlContent,
      text: textContent
    });

    // Registrar el envío en la base de datos
    await logEmailSent({
      to,
      subject,
      template,
      status: result.success ? 'sent' : 'failed',
      error: result.error || null
    });

    if (result.success) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Email sent successfully',
          messageId: result.messageId
        })
      };
    } else {
      throw new Error(result.error);
    }

  } catch (error) {
    console.error('❌ Error enviando email:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};

/**
 * Obtener plantilla de email desde Supabase
 */
async function getEmailTemplate(templateName) {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', templateName)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error obteniendo plantilla:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error en getEmailTemplate:', error);
    return null;
  }
}

/**
 * Procesar plantilla reemplazando variables
 */
function processTemplate(template, data) {
  if (!template || !data) return template;

  let processed = template;
  
  // Reemplazar variables {{variable}}
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processed = processed.replace(regex, data[key]);
  });

  return processed;
}

/**
 * Enviar email usando el servicio configurado
 */
async function sendEmail({ to, from, subject, html, text }) {
  try {
    // Aquí puedes implementar diferentes servicios de email
    // SendGrid, AWS SES, Nodemailer, etc.
    
    // Ejemplo con SendGrid (necesitarías agregar el paquete)
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
      to,
      from,
      subject,
      html,
      text
    };
    
    await sgMail.send(msg);
    
    return {
      success: true,
      messageId: 'sendgrid-message-id'
    };
    */

    // Ejemplo con Nodemailer (necesitarías configurar SMTP)
    /*
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    const result = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text
    });
    
    return {
      success: true,
      messageId: result.messageId
    };
    */

    // Por ahora, simulamos el envío
    console.log('📧 Email simulado:', {
      to,
      from,
      subject,
      htmlLength: html?.length || 0,
      textLength: text?.length || 0
    });

    return {
      success: true,
      messageId: `simulated-${Date.now()}`
    };

  } catch (error) {
    console.error('Error en sendEmail:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Registrar el envío de email en la base de datos
 */
async function logEmailSent({ to, subject, template, status, error }) {
  try {
    const { data, err } = await supabase
      .from('email_logs')
      .insert({
        to,
        subject,
        template,
        status,
        error,
        sent_at: new Date().toISOString()
      });

    if (err) {
      console.error('Error registrando email log:', err);
    }

    return data;
  } catch (error) {
    console.error('Error en logEmailSent:', error);
  }
}