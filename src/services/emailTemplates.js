/**
 * Email Templates Service
 *
 * Plantillas de email profesionales para diferentes tipos de usuarios y escenarios
 */

const COMPANY_INFO = {
  name: 'AIntelligence',
  email: 'hola@aintelligence.cl',
  website: 'https://aintelligence.cl',
  supportEmail: 'soporte@aintelligence.cl',
  phone: '+56 9 1234 5678'
};

const BRAND_COLORS = {
  primary: '#10B981',    // emerald-500
  secondary: '#059669',  // emerald-600
  accent: '#34D399',     // emerald-400
  neutral: '#6B7280',    // gray-500
  background: '#F9FAFB'  // gray-50
};

/**
 * Plantilla base para todos los emails
 */
const createBaseTemplate = (content, options = {}) => {
  const {
    title = 'NexuPay',
    preheader = '',
    showFooter = true
  } = options;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #374151;
      background-color: #f9fafb;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.secondary} 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .header p {
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.secondary} 100%);
      color: white;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      margin: 20px 0;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      transition: all 0.3s ease;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
    }
    .card {
      background: ${BRAND_COLORS.background};
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 24px;
      margin: 20px 0;
    }
    .highlight {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 16px;
      margin: 20px 0;
    }
    .footer {
      background: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      color: #6b7280;
      font-size: 14px;
      margin: 5px 0;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 10px;
      color: ${BRAND_COLORS.primary};
      text-decoration: none;
      font-weight: 500;
    }
    @media (max-width: 600px) {
      .container {
        margin: 10px;
        border-radius: 8px;
      }
      .header, .content, .footer {
        padding: 20px;
      }
      .header h1 {
        font-size: 24px;
      }
    }
  </style>
</head>
<body>
  <div style="background: #f9fafb; padding: 20px;">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <h1>${COMPANY_INFO.name}</h1>
        <p>NexuPay - Plataforma de Incentivos</p>
      </div>

      <!-- Content -->
      <div class="content">
        ${content}
      </div>

      <!-- Footer -->
      ${showFooter ? `
      <div class="footer">
        <p><strong>${COMPANY_INFO.name}</strong></p>
        <p>¿Necesitas ayuda? Contáctanos en <a href="mailto:${COMPANY_INFO.supportEmail}" style="color: ${BRAND_COLORS.primary};">${COMPANY_INFO.supportEmail}</a></p>
        <p>Teléfono: ${COMPANY_INFO.phone}</p>
        <div class="social-links">
          <a href="${COMPANY_INFO.website}">Sitio Web</a> |
          <a href="mailto:${COMPANY_INFO.supportEmail}">Soporte</a>
        </div>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
          Este email fue enviado automáticamente. Por favor no respondas directamente a este mensaje.
        </p>
      </div>
      ` : ''}
    </div>
  </div>
</body>
</html>`;
};

/**
 * Plantillas de bienvenida para diferentes tipos de usuarios
 */
export const welcomeTemplates = {
  /**
   * Bienvenida para Deudores (Personas)
   */
  debtor: (userData) => {
    const { fullName, email } = userData;

    const content = `
      <h2 style="color: ${BRAND_COLORS.primary}; margin-bottom: 20px;">¡Bienvenido a NexuPay, ${fullName}! 👋</h2>

      <p style="font-size: 16px; margin-bottom: 20px;">
        Gracias por registrarte en nuestra plataforma. Ahora puedes acceder a beneficios exclusivos
        para el pago de tus deudas.
      </p>

      <div class="highlight">
        <h3 style="color: #92400e; margin-bottom: 10px;">🎁 ¿Qué puedes hacer ahora?</h3>
        <ul style="color: #92400e; margin: 0; padding-left: 20px;">
          <li><strong>Gestionar tus deudas:</strong> Visualiza y administra todas tus obligaciones</li>
          <li><strong>Pagos seguros:</strong> Realiza pagos en línea de forma segura</li>
          <li><strong>Incentivos por pago:</strong> Gana recompensas por pagar tus deudas</li>
          <li><strong>Historial completo:</strong> Mantén un registro de todos tus pagos</li>
        </ul>
      </div>

      <div class="card">
        <h3 style="color: ${BRAND_COLORS.primary}; margin-bottom: 15px;">🚀 Próximos pasos:</h3>
        <ol style="margin: 0; padding-left: 20px;">
          <li>Completa tu perfil con información adicional</li>
          <li>Explora las ofertas disponibles para tus deudas</li>
          <li>Configura notificaciones para recordatorios de pago</li>
          <li>Invita a amigos para ganar bonos adicionales</li>
        </ol>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${COMPANY_INFO.website}/login" class="button">Acceder a mi cuenta</a>
      </div>

      <p style="color: ${BRAND_COLORS.neutral}; font-size: 14px;">
        Si tienes alguna pregunta, nuestro equipo de soporte está aquí para ayudarte.
      </p>
    `;

    return createBaseTemplate(content, {
      title: `Bienvenido a NexuPay - ${fullName}`,
      preheader: 'Tu cuenta ha sido creada exitosamente'
    });
  },

  /**
   * Bienvenida para Empresas
   */
  company: (userData) => {
    const { fullName, email, companyName } = userData;

    const content = `
      <h2 style="color: ${BRAND_COLORS.primary}; margin-bottom: 20px;">¡Bienvenido a NexuPay, ${companyName}! 🏢</h2>

      <p style="font-size: 16px; margin-bottom: 20px;">
        Gracias por confiar en nosotros para gestionar tus cobros de manera más eficiente e incentivada.
        Tu empresa ahora forma parte de la revolución en el cobro de deudas.
      </p>

      <div class="highlight">
        <h3 style="color: #92400e; margin-bottom: 10px;">💼 Beneficios para tu empresa:</h3>
        <ul style="color: #92400e; margin: 0; padding-left: 20px;">
          <li><strong>Cobros automatizados:</strong> Sistema inteligente de recordatorios y pagos</li>
          <li><strong>Incentivos para deudores:</strong> Mayor tasa de recuperación de deudas</li>
          <li><strong>Dashboard completo:</strong> Métricas y análisis en tiempo real</li>
          <li><strong>Integraciones:</strong> Conecta con tus sistemas existentes</li>
        </ul>
      </div>

      <div class="card">
        <h3 style="color: ${BRAND_COLORS.primary}; margin-bottom: 15px;">⚡ Configuración inicial:</h3>
        <ol style="margin: 0; padding-left: 20px;">
          <li>Configura tu información bancaria para recibir pagos</li>
          <li>Carga tu cartera de deudores</li>
          <li>Personaliza los incentivos para tus clientes</li>
          <li>Configura notificaciones automáticas</li>
          <li>Explora las integraciones disponibles</li>
        </ol>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${COMPANY_INFO.website}/empresa/dashboard" class="button">Ir al Dashboard</a>
      </div>

      <p style="color: ${BRAND_COLORS.neutral}; font-size: 14px;">
        Nuestro equipo de soporte empresarial está disponible para guiarte en la configuración inicial.
      </p>
    `;

    return createBaseTemplate(content, {
      title: `Bienvenido a NexuPay - ${companyName}`,
      preheader: 'Tu empresa ha sido registrada exitosamente'
    });
  },

  /**
   * Bienvenida para Administradores
   */
  admin: (userData) => {
    const { fullName, email } = userData;

    const content = `
      <h2 style="color: ${BRAND_COLORS.primary}; margin-bottom: 20px;">¡Bienvenido al Panel Administrativo, ${fullName}! 🔧</h2>

      <p style="font-size: 16px; margin-bottom: 20px;">
        Has sido configurado como administrador del sistema NexuPay.
        Tienes acceso completo a todas las funcionalidades de gestión.
      </p>

      <div class="highlight">
        <h3 style="color: #92400e; margin-bottom: 10px;">🔑 Permisos de administrador:</h3>
        <ul style="color: #92400e; margin: 0; padding-left: 20px;">
          <li><strong>Gestión de usuarios:</strong> Crear, editar y gestionar todas las cuentas</li>
          <li><strong>Configuración del sistema:</strong> Personalizar parámetros globales</li>
          <li><strong>Métricas avanzadas:</strong> Acceso a analytics completos</li>
          <li><strong>Soporte técnico:</strong> Resolver incidencias de usuarios</li>
        </ul>
      </div>

      <div class="card">
        <h3 style="color: ${BRAND_COLORS.primary}; margin-bottom: 15px;">🚀 Primeros pasos como admin:</h3>
        <ol style="margin: 0; padding-left: 20px;">
          <li>Revisa el dashboard administrativo</li>
          <li>Configura los parámetros del sistema</li>
          <li>Verifica las métricas iniciales</li>
          <li>Revisa la documentación técnica</li>
        </ol>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${COMPANY_INFO.website}/admin/dashboard" class="button">Panel Administrativo</a>
      </div>

      <p style="color: ${BRAND_COLORS.neutral}; font-size: 14px;">
        Como administrador, tienes responsabilidad sobre la integridad y funcionamiento del sistema.
        Utiliza tus permisos con responsabilidad.
      </p>
    `;

    return createBaseTemplate(content, {
      title: `Acceso Administrativo - ${fullName}`,
      preheader: 'Has sido configurado como administrador'
    });
  }
};

/**
 * Plantillas de recuperación de contraseña
 */
export const passwordRecoveryTemplates = {
  /**
   * Solicitud de recuperación de contraseña
   */
  passwordReset: (userData) => {
    const { fullName, email, resetToken, resetUrl } = userData;

    const content = `
      <h2 style="color: ${BRAND_COLORS.primary}; margin-bottom: 20px;">Recuperación de Contraseña 🔐</h2>

      <p style="font-size: 16px; margin-bottom: 20px;">
        Hola ${fullName}, hemos recibido una solicitud para restablecer tu contraseña en NexuPay.
      </p>

      <div class="highlight">
        <h3 style="color: #92400e; margin-bottom: 10px;">⚠️ Importante:</h3>
        <p style="color: #92400e; margin: 0;">
          Si no solicitaste este cambio, puedes ignorar este email.
          Tu contraseña actual seguirá siendo válida.
        </p>
      </div>

      <div class="card">
        <h3 style="color: ${BRAND_COLORS.primary}; margin-bottom: 15px;">🔑 Para restablecer tu contraseña:</h3>
        <p style="margin-bottom: 20px;">
          Haz clic en el botón de abajo para crear una nueva contraseña.
          Este enlace expirará en 1 hora por seguridad.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl || `${COMPANY_INFO.website}/reset-password?token=${resetToken}`}" class="button">
            Restablecer Contraseña
          </a>
        </div>

        <p style="font-size: 14px; color: ${BRAND_COLORS.neutral}; margin-top: 20px;">
          Si el botón no funciona, copia y pega esta URL en tu navegador:
          <br>
          <span style="word-break: break-all; color: ${BRAND_COLORS.primary};">
            ${resetUrl || `${COMPANY_INFO.website}/reset-password?token=${resetToken}`}
          </span>
        </p>
      </div>

      <p style="color: ${BRAND_COLORS.neutral}; font-size: 14px;">
        Si tienes problemas para restablecer tu contraseña, contacta a nuestro soporte técnico.
      </p>
    `;

    return createBaseTemplate(content, {
      title: 'Recuperación de Contraseña - NexuPay',
      preheader: 'Solicitud para restablecer tu contraseña'
    });
  }
};

/**
 * Plantillas de invitación de usuarios
 */
export const userInvitationTemplates = {
  /**
   * Invitación para completar registro (desde admin)
   */
  adminInvitation: (userData) => {
    const { fullName, email, invitationToken, completeUrl, adminName } = userData;

    const content = `
      <h2 style="color: ${BRAND_COLORS.primary}; margin-bottom: 20px;">¡Has sido invitado a NexuPay! 🎉</h2>

      <p style="font-size: 16px; margin-bottom: 20px;">
        Hola ${fullName}, ${adminName || 'un administrador'} te ha invitado a unirte a la plataforma NexuPay.
      </p>

      <div class="card">
        <h3 style="color: ${BRAND_COLORS.primary}; margin-bottom: 15px;">🚀 Completa tu registro:</h3>
        <p style="margin-bottom: 20px;">
          Para acceder a tu cuenta, necesitas crear una contraseña segura.
          Haz clic en el botón de abajo para completar tu registro.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${completeUrl || `${COMPANY_INFO.website}/complete-registration?token=${invitationToken}`}" class="button">
            Completar Registro
          </a>
        </div>

        <p style="font-size: 14px; color: ${BRAND_COLORS.neutral}; margin-top: 20px;">
          Si el botón no funciona, copia y pega esta URL en tu navegador:
          <br>
          <span style="word-break: break-all; color: ${BRAND_COLORS.primary};">
            ${completeUrl || `${COMPANY_INFO.website}/complete-registration?token=${invitationToken}`}
          </span>
        </p>
      </div>

      <div class="highlight">
        <h3 style="color: #92400e; margin-bottom: 10px;">⚠️ Información importante:</h3>
        <ul style="color: #92400e; margin: 0; padding-left: 20px;">
          <li>Este enlace expirará en 7 días por seguridad</li>
          <li>Si no completas el registro, tu cuenta será eliminada automáticamente</li>
          <li>Asegúrate de crear una contraseña segura y memorable</li>
        </ul>
      </div>

      <div class="card">
        <h3 style="color: ${BRAND_COLORS.primary}; margin-bottom: 15px;">💡 ¿Qué puedes hacer en NexuPay?</h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li><strong>Gestionar deudas:</strong> Administra tus obligaciones de forma organizada</li>
          <li><strong>Pagos seguros:</strong> Realiza transacciones en línea protegidas</li>
          <li><strong>Incentivos:</strong> Gana recompensas por mantenerte al día</li>
          <li><strong>Historial completo:</strong> Mantén registro de todos tus movimientos</li>
        </ul>
      </div>
    `;

    return createBaseTemplate(content, {
      title: 'Invitación a NexuPay - Completa tu registro',
      preheader: 'Has sido invitado a unirte a NexuPay'
    });
  }
};

/**
 * Plantillas de confirmación de email
 */
export const emailConfirmationTemplates = {
  /**
   * Confirmación de cambio de email
   */
  emailChange: (userData) => {
    const { fullName, newEmail, currentEmail, confirmationToken, confirmUrl } = userData;

    const content = `
      <h2 style="color: ${BRAND_COLORS.primary}; margin-bottom: 20px;">Confirmación de Cambio de Email 📧</h2>

      <p style="font-size: 16px; margin-bottom: 20px;">
        Hola ${fullName}, has solicitado cambiar tu email en NexuPay.
      </p>

      <div class="card">
        <h3 style="color: ${BRAND_COLORS.primary}; margin-bottom: 15px;">📝 Detalles del cambio:</h3>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
          <p style="margin: 5px 0;"><strong>Email actual:</strong> ${currentEmail}</p>
          <p style="margin: 5px 0;"><strong>Nuevo email:</strong> ${newEmail}</p>
        </div>

        <p style="margin-bottom: 20px;">
          Para completar el cambio, confirma que tienes acceso al nuevo email haciendo clic en el botón de abajo.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmUrl || `${COMPANY_INFO.website}/confirm-email-change?token=${confirmationToken}`}" class="button">
            Confirmar Cambio de Email
          </a>
        </div>

        <p style="font-size: 14px; color: ${BRAND_COLORS.neutral}; margin-top: 20px;">
          Si no solicitaste este cambio, ignora este email.
          Tu email actual permanecerá sin cambios.
        </p>
      </div>

      <div class="highlight">
        <h3 style="color: #92400e; margin-bottom: 10px;">⚠️ Importante:</h3>
        <p style="color: #92400e; margin: 0;">
          Una vez confirmado el cambio, usarás <strong>${newEmail}</strong> para acceder a tu cuenta.
          Asegúrate de tener acceso a este email antes de confirmar.
        </p>
      </div>
    `;

    return createBaseTemplate(content, {
      title: 'Confirmación de Cambio de Email - NexuPay',
      preheader: 'Confirma tu nuevo email'
    });
  },

  /**
   * Confirmación de registro inicial
   */
  accountConfirmation: (userData) => {
    const { fullName, email, confirmationToken, confirmUrl } = userData;

    const content = `
      <h2 style="color: ${BRAND_COLORS.primary}; margin-bottom: 20px;">¡Activa tu cuenta en NexuPay! ✅</h2>

      <p style="font-size: 16px; margin-bottom: 20px;">
        Gracias por registrarte, ${fullName}. Solo falta un paso para activar tu cuenta.
      </p>

      <div class="card">
        <h3 style="color: ${BRAND_COLORS.primary}; margin-bottom: 15px;">🎯 Activar cuenta:</h3>
        <p style="margin-bottom: 20px;">
          Haz clic en el botón de abajo para verificar tu email y activar tu cuenta.
          Este proceso es necesario para garantizar la seguridad de tu información.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmUrl || `${COMPANY_INFO.website}/confirm-email?token=${confirmationToken}`}" class="button">
            Activar mi cuenta
          </a>
        </div>

        <p style="font-size: 14px; color: ${BRAND_COLORS.neutral}; margin-top: 20px;">
          Si el botón no funciona, copia y pega esta URL:
          <br>
          <span style="word-break: break-all; color: ${BRAND_COLORS.primary};">
            ${confirmUrl || `${COMPANY_INFO.website}/confirm-email?token=${confirmationToken}`}
          </span>
        </p>
      </div>

      <div class="highlight">
        <h3 style="color: #92400e; margin-bottom: 10px;">🚀 ¿Qué sucede después?</h3>
        <ul style="color: #92400e; margin: 0; padding-left: 20px;">
          <li>Tu cuenta será activada inmediatamente</li>
          <li>Podrás acceder al sistema completo</li>
          <li>Recibirás un email de bienvenida personalizado</li>
        </ul>
      </div>
    `;

    return createBaseTemplate(content, {
      title: 'Activa tu cuenta - NexuPay',
      preheader: 'Confirma tu email para activar tu cuenta'
    });
  }
};

/**
 * Plantillas de notificaciones
 */
export const notificationTemplates = {
  /**
   * Notificación de pago recibido (para empresas)
   */
  paymentReceived: (paymentData) => {
    const { companyName, debtorName, amount, debtId, paymentDate } = paymentData;

    const content = `
      <h2 style="color: ${BRAND_COLORS.primary}; margin-bottom: 20px;">¡Pago Recibido! 💰</h2>

      <p style="font-size: 16px; margin-bottom: 20px;">
        ${companyName}, hemos recibido un pago correspondiente a una de tus deudas.
      </p>

      <div class="card">
        <h3 style="color: ${BRAND_COLORS.primary}; margin-bottom: 15px;">📊 Detalles del pago:</h3>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 6px;">
          <p style="margin: 5px 0;"><strong>Deudor:</strong> ${debtorName}</p>
          <p style="margin: 5px 0;"><strong>Monto:</strong> $${amount.toLocaleString('es-CL')}</p>
          <p style="margin: 5px 0;"><strong>ID Deuda:</strong> ${debtId}</p>
          <p style="margin: 5px 0;"><strong>Fecha:</strong> ${new Date(paymentDate).toLocaleDateString('es-CL')}</p>
        </div>
      </div>

      <div class="highlight">
        <h3 style="color: #92400e; margin-bottom: 10px;">💡 Próximos pasos:</h3>
        <ul style="color: #92400e; margin: 0; padding-left: 20px;">
          <li>El monto será transferido a tu cuenta bancaria en las próximas 24-48 horas</li>
          <li>Revisa tu dashboard para ver el estado de la transferencia</li>
          <li>Considera ofrecer incentivos adicionales al deudor por pagos puntuales</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${COMPANY_INFO.website}/empresa/dashboard" class="button">Ver Dashboard</a>
      </div>
    `;

    return createBaseTemplate(content, {
      title: 'Pago Recibido - NexuPay',
      preheader: `Pago de $${amount.toLocaleString('es-CL')} recibido`
    });
  },

  /**
   * Notificación de incentivo ganado (para deudores)
   */
  incentiveEarned: (incentiveData) => {
    const { debtorName, amount, reason, balance } = incentiveData;

    const content = `
      <h2 style="color: ${BRAND_COLORS.primary}; margin-bottom: 20px;">¡Has ganado un incentivo! 🎉</h2>

      <p style="font-size: 16px; margin-bottom: 20px;">
        ¡Felicitaciones ${debtorName}! Has recibido un incentivo por tu buen comportamiento de pago.
      </p>

      <div class="card">
        <h3 style="color: ${BRAND_COLORS.primary}; margin-bottom: 15px;">🎁 Detalles del incentivo:</h3>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 6px;">
          <p style="margin: 5px 0;"><strong>Monto ganado:</strong> $${amount.toLocaleString('es-CL')}</p>
          <p style="margin: 5px 0;"><strong>Motivo:</strong> ${reason}</p>
          <p style="margin: 5px 0;"><strong>Saldo actual:</strong> $${balance.toLocaleString('es-CL')}</p>
        </div>
      </div>

      <div class="highlight">
        <h3 style="color: #92400e; margin-bottom: 10px;">💰 ¿Qué puedes hacer con tus incentivos?</h3>
        <ul style="color: #92400e; margin: 0; padding-left: 20px;">
          <li>Acumular para descuentos en futuras deudas</li>
          <li>Canjear por productos o servicios</li>
          <li>Transferir a tu cuenta bancaria (próximamente)</li>
          <li>Invitar amigos y ganar más incentivos</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${COMPANY_INFO.website}/debtor/wallet" class="button">Ver mi Wallet</a>
      </div>

      <p style="color: ${BRAND_COLORS.neutral}; font-size: 14px;">
        ¡Sigue pagando tus deudas para ganar más incentivos!
      </p>
    `;

    return createBaseTemplate(content, {
      title: '¡Incentivo Ganado! - NexuPay',
      preheader: `Has recibido $${amount.toLocaleString('es-CL')} en incentivos`
    });
  }
};

/**
 * Función helper para obtener la plantilla correcta
 */
export const getEmailTemplate = (type, subtype, userData) => {
  switch (type) {
    case 'welcome':
      return welcomeTemplates[subtype]?.(userData);
    case 'password':
      return passwordRecoveryTemplates[subtype]?.(userData);
    case 'email':
      return emailConfirmationTemplates[subtype]?.(userData);
    case 'notification':
      return notificationTemplates[subtype]?.(userData);
    case 'invitation':
      return userInvitationTemplates[subtype]?.(userData);
    default:
      return null;
  }
};

export default {
  welcomeTemplates,
  passwordRecoveryTemplates,
  emailConfirmationTemplates,
  notificationTemplates,
  getEmailTemplate,
  COMPANY_INFO,
  BRAND_COLORS
};