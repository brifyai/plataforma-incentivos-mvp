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
    console.log('📧 Intentando enviar email:', {
      to: emailData.to,
      subject: emailData.subject,
      hasHtml: !!emailData.html,
      htmlLength: emailData.html?.length || 0
    });

    // Llamar a la función edge de Supabase
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text
      }
    });

    console.log('📡 Respuesta de Supabase function:', { data, error });

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

      // Proporcionar mensaje más específico si es error de función no desplegada
      let errorMessage = data.error || 'Error en envío de email';
      if (data.error?.includes('404') || data.error?.includes('Not Found')) {
        errorMessage = 'Función de email no desplegada. Contacta al administrador para desplegar la función en Supabase.';
      }

      return {
        success: false,
        error: errorMessage,
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
 * Envía email de confirmación de cambio de email usando plantillas
 */
export const sendEmailChangeConfirmation = async (to, fullName, changeToken, currentEmail) => {
  try {
    // URL encode the token to handle special characters in JWT
    const encodedToken = encodeURIComponent(changeToken);

    // Usar plantilla de confirmación de cambio de email
    const html = generateEmailTemplate({
      title: 'Confirma tu cambio de email - NexuPay',
      greeting: `Hola ${fullName},`,
      content: `
        <p>Has solicitado cambiar tu email de <strong>${currentEmail}</strong> a <strong>${to}</strong>.</p>
        <p>Para completar este cambio, por favor haz clic en el botón de abajo:</p>
        <p>Este enlace expirará en 24 horas por tu seguridad.</p>
        <p>Si no solicitaste este cambio, por favor ignora este email.</p>
      `,
      buttonText: 'Confirmar Cambio de Email',
      buttonUrl: `${window.location.origin}/confirm-email-change?token=${encodedToken}`
    });

    const result = await sendEmail({
      to,
      subject: 'Confirma tu cambio de email - NexuPay',
      html: html
    });
    return result;
  } catch (error) {
    console.error('Error sending email change confirmation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Envía email de confirmación de registro usando plantillas
 */
export const sendConfirmationEmail = async (email, fullName, confirmationToken, userRole) => {
  try {
    // URL encode the token to handle special characters in JWT
    const encodedToken = encodeURIComponent(confirmationToken);

    // Usar plantilla de confirmación de cuenta
    const html = generateEmailTemplate({
      title: 'Activa tu cuenta - NexuPay',
      greeting: `¡Bienvenido a NexuPay, ${fullName}!`,
      content: `
        <p>Gracias por registrarte en nuestra plataforma.</p>
        <p>Para activar tu cuenta y comenzar a usar NexuPay, por favor confirma tu email haciendo clic en el botón de abajo:</p>
        <p>Este enlace expirará en 24 horas por tu seguridad.</p>
        <p>Si no te registraste en NexuPay, por favor ignora este email.</p>
      `,
      buttonText: 'Activar Mi Cuenta',
      buttonUrl: `${window.location.origin}/auth/confirm-email?token=${encodedToken}`
    });

    const result = await sendEmail({
      to: email,
      subject: 'Activa tu cuenta - NexuPay',
      html: html
    });
    return result;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Envía email de recuperación de contraseña usando plantillas
 */
export const sendPasswordResetEmail = async (to, fullName, resetToken) => {
  try {
    // URL encode the token to handle special characters in JWT
    const encodedToken = encodeURIComponent(resetToken);

    // Usar plantilla de recuperación de contraseña
    const html = generateEmailTemplate({
      title: 'Recupera tu contraseña - NexuPay',
      greeting: `Hola ${fullName},`,
      content: `
        <p>Has solicitado restablecer tu contraseña.</p>
        <p>Para continuar con el proceso de recuperación, por favor haz clic en el botón de abajo:</p>
        <p>Este enlace expirará en 24 horas por tu seguridad.</p>
        <p>Si no solicitaste restablecer tu contraseña, por favor ignora este email.</p>
      `,
      buttonText: 'Restablecer Contraseña',
      buttonUrl: `${window.location.origin}/reset-password?token=${encodedToken}`
    });

    const result = await sendEmail({
      to,
      subject: 'Recupera tu contraseña - NexuPay',
      html: html
    });
    return result;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Envía email de bienvenida para deudores
 */
export const sendWelcomeEmailDebtor = async (userData) => {
  try {
    const html = generateEmailTemplate({
      title: '¡Bienvenido a NexuPay!',
      greeting: `¡Hola ${userData.fullName}!`,
      content: `
        <p>¡Bienvenido a NexuPay! Tu cuenta ha sido creada exitosamente.</p>
        <p>Ya puedes comenzar a gestionar tus deudas y acceder a todas las funcionalidades de nuestra plataforma.</p>
        <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
      `,
      buttonText: 'Ir a Mi Dashboard',
      buttonUrl: `${window.location.origin}/personas/dashboard`
    });
    const result = await sendEmail({
      to: userData.email,
      subject: `¡Bienvenido a NexuPay, ${userData.fullName}!`,
      html: html
    });
    return result;
  } catch (error) {
    console.error('Error sending welcome email to debtor:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Envía email de bienvenida para empresas
 */
export const sendWelcomeEmailCompany = async (userData) => {
  try {
    const html = generateEmailTemplate({
      title: '¡Bienvenido a NexuPay!',
      greeting: `¡Hola ${userData.companyName}!`,
      content: `
        <p>¡Bienvenido a NexuPay! Tu cuenta empresarial ha sido creada exitosamente.</p>
        <p>Ya puedes comenzar a gestionar tus deudas y acceder a todas las funcionalidades de nuestra plataforma.</p>
        <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
      `,
      buttonText: 'Ir a Mi Dashboard',
      buttonUrl: `${window.location.origin}/empresa/dashboard`
    });
    const result = await sendEmail({
      to: userData.email,
      subject: `¡Bienvenido a NexuPay, ${userData.companyName}!`,
      html: html
    });
    return result;
  } catch (error) {
    console.error('Error sending welcome email to company:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Envía email de bienvenida para administradores
 */
export const sendWelcomeEmailAdmin = async (userData) => {
  try {
    const html = generateEmailTemplate({
      title: 'Acceso Administrativo - NexuPay',
      greeting: `¡Hola ${userData.fullName}!`,
      content: `
        <p>Tu cuenta administrativa ha sido creada exitosamente en NexuPay.</p>
        <p>Ya tienes acceso a todas las herramientas administrativas de la plataforma.</p>
        <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
      `,
      buttonText: 'Ir al Panel Administrativo',
      buttonUrl: `${window.location.origin}/admin/dashboard`
    });
    const result = await sendEmail({
      to: userData.email,
      subject: `Acceso Administrativo - NexuPay`,
      html: html
    });
    return result;
  } catch (error) {
    console.error('Error sending welcome email to admin:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Envía email de notificación de pago recibido (para empresas)
 */
export const sendPaymentReceivedNotification = async (paymentData) => {
  try {
    if (import.meta.env.DEV) {
      console.log('📧 [SIMULADO] Notificación de pago enviado a:', paymentData.companyEmail);
      return { success: true, simulated: true, messageId: 'simulated_' + Date.now() };
    }

    const html = generateEmailTemplate({
      title: 'Pago Recibido',
      greeting: `¡Hola!`,
      content: `
        <p>Hemos recibido un pago de <strong>$${paymentData.amount.toLocaleString('es-CL')}</strong>.</p>
        <p>Detalles del pago:</p>
        <ul>
          <li>Deudor: ${paymentData.debtorName}</li>
          <li>Fecha: ${new Date(paymentData.date).toLocaleDateString('es-CL')}</li>
          <li>Monto: $${paymentData.amount.toLocaleString('es-CL')}</li>
        </ul>
        <p>El pago ha sido procesado exitosamente.</p>
      `,
      buttonText: 'Ver Detalles',
      buttonUrl: `${window.location.origin}/empresa/pagos`
    });
    const result = await sendEmail({
      to: paymentData.companyEmail,
      subject: `Pago Recibido - $${paymentData.amount.toLocaleString('es-CL')}`,
      html: html
    });
    return result;
  } catch (error) {
    console.error('Error sending payment notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Envía email de incentivo ganado (para deudores)
 */
export const sendIncentiveEarnedNotification = async (incentiveData) => {
  try {
    if (import.meta.env.DEV) {
      console.log('📧 [SIMULADO] Notificación de incentivo enviado a:', incentiveData.debtorEmail);
      return { success: true, simulated: true, messageId: 'simulated_' + Date.now() };
    }

    const html = generateEmailTemplate({
      title: '¡Has ganado incentivos!',
      greeting: `¡Hola ${incentiveData.debtorName}!`,
      content: `
        <p>¡Felicidades! Has ganado <strong>$${incentiveData.amount.toLocaleString('es-CL')}</strong> en incentivos.</p>
        <p>Este incentivo ha sido añadido a tu billetera y puedes usarlo para futuros pagos.</p>
        <p>Gracias por tu compromiso con el pago de tus deudas.</p>
      `,
      buttonText: 'Ver Mi Billetera',
      buttonUrl: `${window.location.origin}/personas/billetera`
    });
    const result = await sendEmail({
      to: incentiveData.debtorEmail,
      subject: `¡Has ganado $${incentiveData.amount.toLocaleString('es-CL')} en incentivos!`,
      html: html
    });
    return result;
  } catch (error) {
    console.error('Error sending incentive notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Envía email de invitación para completar registro (desde admin)
 */
export const sendAdminInvitationEmail = async (invitationData) => {
  try {
    const { fullName, email, invitationToken, adminName, completeUrl } = invitationData;

    // Si no hay token o URL de completado, enviar email informativo básico
    if (!invitationToken || !completeUrl) {
      console.log('⚠️ Campos de invitación no disponibles, enviando email informativo básico');

      if (import.meta.env.DEV) {
        console.log('📧 [SIMULADO] Email informativo enviado a:', email);
        return { success: true, simulated: true, messageId: 'simulated_' + Date.now() };
      }

      const basicEmailData = {
        to: email,
        subject: `Bienvenido a NexuPay - ${fullName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">¡Bienvenido a NexuPay!</h2>
            <p>Hola <strong>${fullName}</strong>,</p>
            <p>Has sido registrado en la plataforma NexuPay por el administrador <strong>${adminName}</strong>.</p>
            <p>Tu cuenta ha sido creada exitosamente. Pronto recibirás instrucciones adicionales para acceder al sistema.</p>
            <br>
            <p>Si tienes alguna pregunta, no dudes en contactar al soporte.</p>
            <p>Saludos,<br>El equipo de NexuPay</p>
          </div>
        `
      };

      const result = await sendEmail(basicEmailData);

      if (result.success) {
        console.log(`✅ Email informativo enviado a ${email}`);
        return result;
      } else {
        console.error('❌ Error enviando email informativo:', result.error);
        return result;
      }
    }

    // Email completo de invitación con token
    if (import.meta.env.DEV) {
      console.log('📧 [SIMULADO] Email de invitación enviado a:', email);
      return { success: true, simulated: true, messageId: 'simulated_' + Date.now() };
    }

    const html = generateEmailTemplate({
      title: 'Invitación a NexuPay',
      greeting: `¡Hola ${invitationData.fullName}!`,
      content: `
        <p>Has sido invitado a unirte a NexuPay por el administrador <strong>${invitationData.adminName}</strong>.</p>
        <p>Para completar tu registro y acceder a la plataforma, por favor haz clic en el botón de abajo:</p>
        <p>Este enlace expirará en 24 horas por tu seguridad.</p>
      `,
      buttonText: 'Completar Registro',
      buttonUrl: invitationData.completeUrl
    });
    const result = await sendEmail({
      to: email,
      subject: 'Invitación a NexuPay - Completa tu registro',
      html: html
    });
    return result;
  } catch (error) {
    console.error('Error sending admin invitation email:', error);
    return { success: false, error: error.message };
  }
};

export default {
  isEmailConfigured,
  sendEmail,
  sendEmailChangeConfirmation,
  sendConfirmationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmailDebtor,
  sendWelcomeEmailCompany,
  sendWelcomeEmailAdmin,
  sendPaymentReceivedNotification,
  sendIncentiveEarnedNotification,
  sendAdminInvitationEmail,
};