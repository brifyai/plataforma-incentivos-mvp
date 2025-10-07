/**
 * Servicio de envío de emails
 *
 * Maneja el envío de emails transaccionales usando función edge de Supabase
 */

import { supabase } from '../config/supabase';

/**
 * Verifica si el servicio de email está configurado
 * @returns {Object} Estado de configuración
 */
export const isEmailConfigured = () => {
  return {
    configured: true,
    message: 'Servicio de email configurado con función edge de Supabase'
  };
};

/**
 * Envía un email usando función edge de Supabase
 * @param {Object} emailData - Datos del email
 * @param {string} emailData.to - Email del destinatario
 * @param {string} emailData.subject - Asunto del email
 * @param {string} emailData.html - Contenido HTML del email
 * @param {string} [emailData.text] - Contenido texto plano (opcional)
 * @returns {Promise<{success, error, messageId}>}
 */
export const sendEmail = async (emailData) => {
  try {
    if (!isEmailConfigured().configured) {
      console.warn('⚠️ Servicio de email no está configurado, simulando envío de email');
      console.log('📧 Email simulado:', {
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html?.substring(0, 100) + '...'
      });
      return { success: true, error: null, messageId: 'simulated_' + Date.now() };
    }

    // Llamar a la función edge de Supabase
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text
      }
    });

    if (error) {
      console.error('❌ Error enviando email:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido',
        messageId: null
      };
    }

    if (!data.success) {
      console.error('❌ Error en respuesta de email:', data.error);
      return {
        success: false,
        error: data.error || 'Error en envío de email',
        messageId: null
      };
    }

    console.log('✅ Email enviado exitosamente:', {
      to: emailData.to,
      subject: emailData.subject,
      messageId: data.messageId
    });

    return {
      success: true,
      error: null,
      messageId: data.messageId
    };

  } catch (error) {
    console.error('❌ Error enviando email:', error);

    return {
      success: false,
      error: error.message || 'Error desconocido',
      messageId: null
    };
  }
};

/**
 * Genera plantilla HTML moderna para emails
 * @param {Object} options - Opciones de la plantilla
 * @returns {string} HTML de la plantilla
 */
const generateEmailTemplate = (options) => {
  const {
    title,
    greeting,
    content,
    buttonText,
    buttonUrl,
    footerText = 'Este es un email automático, por favor no respondas a esta dirección.',
    brandColor = '#667eea',
    secondaryColor = '#764ba2'
  } = options;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          background: #f8fafc;
          padding: 20px;
        }
        .email-container {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .header {
          background: linear-gradient(135deg, ${brandColor} 0%, ${secondaryColor} 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
          position: relative;
        }
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
          opacity: 0.3;
        }
        .header-content { position: relative; z-index: 1; }
        .logo { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
        .subtitle { font-size: 16px; opacity: 0.9; }
        .content {
          padding: 40px 30px;
          background: #ffffff;
        }
        .greeting {
          font-size: 24px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 20px;
        }
        .message {
          font-size: 16px;
          line-height: 1.7;
          color: #4b5563;
          margin-bottom: 30px;
        }
        .button-container { text-align: center; margin: 30px 0; }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, ${brandColor} 0%, ${secondaryColor} 100%);
          color: white;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.3);
          transition: all 0.2s ease;
        }
        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px 0 rgba(99, 102, 241, 0.4);
        }
        .link-container {
          background: #f3f4f6;
          border-radius: 8px;
          padding: 16px;
          margin: 20px 0;
          border-left: 4px solid ${brandColor};
        }
        .link-text {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 14px;
          color: #374151;
          word-break: break-all;
          background: white;
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
        }
        .warning {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 16px;
          margin: 20px 0;
        }
        .warning-text { color: #92400e; font-size: 14px; }
        .footer {
          background: #f9fafb;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer-text {
          color: #6b7280;
          font-size: 14px;
          line-height: 1.5;
        }
        .brand {
          color: ${brandColor};
          font-weight: 700;
          font-size: 18px;
        }
        .social-links {
          margin-top: 20px;
        }
        .social-links a {
          display: inline-block;
          margin: 0 8px;
          color: ${brandColor};
          text-decoration: none;
          font-size: 24px;
        }
        @media (max-width: 600px) {
          body { padding: 10px; }
          .header { padding: 30px 20px; }
          .content { padding: 30px 20px; }
          .button { padding: 14px 28px; font-size: 15px; }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="header-content">
            <div class="logo">NexuPay</div>
            <div class="subtitle">${title}</div>
          </div>
        </div>

        <div class="content">
          <div class="greeting">${greeting}</div>
          <div class="message">${content}</div>

          ${buttonText && buttonUrl ? `
            <div class="button-container">
              <a href="${buttonUrl}" class="button">${buttonText}</a>
            </div>

            <div class="link-container">
              <p style="margin-bottom: 8px; color: #6b7280; font-size: 14px;">
                <strong>¿No funciona el botón?</strong><br>
                Copia y pega esta URL en tu navegador:
              </p>
              <div class="link-text">${buttonUrl}</div>
            </div>
          ` : ''}

          <div class="warning">
            <div class="warning-text">
              <strong>Información de seguridad:</strong> Este enlace expirará en 24 horas por tu seguridad.
              Si no solicitaste este email, puedes ignorarlo.
            </div>
          </div>
        </div>

        <div class="footer">
          <div class="footer-text">
            <p><span class="brand">NexuPay</span> - Soluciones de Cobranza Digital</p>
            <p>${footerText}</p>
            <div class="social-links">
              <a href="#">🌐</a>
              <a href="#">📧</a>
              <a href="#">📱</a>
            </div>
            <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
              © 2024 NexuPay - Todos los derechos reservados
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Envía un email de confirmación de cuenta
 * @param {string} to - Email del destinatario
 * @param {string} fullName - Nombre completo del usuario
 * @param {string} confirmationToken - Token de confirmación
 * @param {string} userType - Tipo de usuario (debtor, company, god_mode)
 * @returns {Promise<{success, error, messageId}>}
 */
export const sendConfirmationEmail = async (to, fullName, confirmationToken, userType = 'debtor') => {
  const confirmationUrl = `${window.location.origin}/confirm-email?token=${confirmationToken}`;

  // Personalizar mensaje según tipo de usuario
  const userTypeMessages = {
    debtor: {
      greeting: `¡Hola ${fullName}!`,
      content: `
        <p>Gracias por registrarte como <strong>Deudor</strong> en <strong>NexuPay</strong>.</p>
        <p>Para completar tu registro y comenzar a acceder a ofertas de negociación de deudas, necesitas confirmar tu dirección de email.</p>
        <p>Haz clic en el botón de abajo para activar tu cuenta:</p>
      `
    },
    company: {
      greeting: `¡Hola ${fullName}!`,
      content: `
        <p>Gracias por registrarte como <strong>Empresa</strong> en <strong>NexuPay</strong>.</p>
        <p>Para completar tu registro y comenzar a gestionar tus cobranzas de manera eficiente, necesitas confirmar tu dirección de email.</p>
        <p>Haz clic en el botón de abajo para activar tu cuenta:</p>
      `
    },
    god_mode: {
      greeting: `¡Hola Administrador ${fullName}!`,
      content: `
        <p>Tu cuenta de <strong>Administrador GOD MODE</strong> ha sido configurada en <strong>NexuPay</strong>.</p>
        <p>Para acceder al panel de administración completo, necesitas confirmar tu dirección de email.</p>
        <p>Haz clic en el botón de abajo para activar tu cuenta administrativa:</p>
      `
    }
  };

  const messageConfig = userTypeMessages[userType] || userTypeMessages.debtor;

  const subject = 'Confirma tu cuenta en NexuPay';
  const htmlContent = generateEmailTemplate({
    title: 'Confirma tu cuenta',
    greeting: messageConfig.greeting,
    content: messageConfig.content,
    buttonText: 'Confirmar mi cuenta',
    buttonUrl: confirmationUrl,
    footerText: 'Este es un email automático generado por NexuPay. Por favor no respondas a esta dirección.'
  });

  return await sendEmail({
    to,
    subject,
    html: htmlContent
  });
};

/**
 * Envía un email de recuperación de contraseña
 * @param {string} to - Email del destinatario
 * @param {string} fullName - Nombre completo del usuario
 * @param {string} resetToken - Token de recuperación
 * @returns {Promise<{success, error, messageId}>}
 */
export const sendPasswordResetEmail = async (to, fullName, resetToken) => {
  const resetUrl = `${window.location.origin}/reset-password?token=${resetToken}`;

  const subject = 'Recupera tu contraseña - NexuPay';
  const htmlContent = generateEmailTemplate({
    title: 'Recupera tu contraseña',
    greeting: `¡Hola ${fullName}!`,
    content: `
      <p>Recibimos una solicitud para restablecer tu contraseña en <strong>NexuPay</strong>.</p>
      <p>Haz clic en el botón de abajo para crear una nueva contraseña segura:</p>
    `,
    buttonText: 'Restablecer contraseña',
    buttonUrl: resetUrl,
    footerText: 'Este es un email automático generado por NexuPay. Por favor no respondas a esta dirección.',
    brandColor: '#f59e0b',
    secondaryColor: '#d97706'
  });

  return await sendEmail({
    to,
    subject,
    html: htmlContent
  });
};

export default {
  isEmailConfigured,
  sendEmail,
  sendConfirmationEmail,
  sendPasswordResetEmail,
};