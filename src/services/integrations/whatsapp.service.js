/**
 * Servicio de integración con WhatsApp Business API
 * 
 * Este servicio maneja el envío de notificaciones vía WhatsApp usando la API de Meta.
 * Requiere configuración de credenciales en variables de entorno.
 * 
 * @module WhatsAppService
 */

import axios from 'axios';

class WhatsAppService {
  constructor() {
    this.accessToken = import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID;
    this.businessAccountId = import.meta.env.VITE_WHATSAPP_BUSINESS_ACCOUNT_ID;
    this.apiVersion = 'v18.0';
    this.baseURL = `https://graph.facebook.com/${this.apiVersion}`;
  }

  /**
   * Verifica si el servicio está configurado correctamente
   * @returns {Object} Estado de configuración
   */
  isConfigured() {
    const configured = !!(this.accessToken && this.phoneNumberId);
    return {
      configured,
      message: configured 
        ? 'WhatsApp Business API configurado correctamente'
        : 'Faltan credenciales de WhatsApp Business API'
    };
  }

  /**
   * Envía un mensaje de texto simple
   * @param {string} to - Número de teléfono del destinatario (formato: 56912345678)
   * @param {string} message - Mensaje a enviar
   * @returns {Promise<Object>} Respuesta de la API
   */
  async sendMessage(to, message) {
    try {
      if (!this.isConfigured().configured) {
        throw new Error('WhatsApp Business API no está configurado');
      }

      const response = await axios.post(
        `${this.baseURL}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'text',
          text: {
            preview_url: false,
            body: message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ WhatsApp enviado a ${to}:`, response.data);
      return {
        success: true,
        messageId: response.data.messages[0].id,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Error al enviar WhatsApp:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Envía un mensaje usando un template aprobado
   * @param {string} to - Número de teléfono del destinatario
   * @param {string} templateName - Nombre del template aprobado
   * @param {string} languageCode - Código de idioma (ej: es_MX, en_US)
   * @param {Array} components - Componentes del template (parámetros)
   * @returns {Promise<Object>} Respuesta de la API
   */
  async sendTemplate(to, templateName, languageCode = 'es_MX', components = []) {
    try {
      if (!this.isConfigured().configured) {
        throw new Error('WhatsApp Business API no está configurado');
      }

      const response = await axios.post(
        `${this.baseURL}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: to,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: languageCode
            },
            components: components
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ Template WhatsApp enviado a ${to}:`, response.data);
      return {
        success: true,
        messageId: response.data.messages[0].id,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Error al enviar template WhatsApp:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Templates de mensajes predefinidos
   */
  templates = {
    /**
     * Notificación de bienvenida
     */
    welcome: (userName) => ({
      message: `¡Hola ${userName}! 👋\n\nBienvenido a NexuPay.\n\n✨ Aquí podrás:\n• Ver todas tus deudas en un solo lugar\n• Recibir ofertas especiales de negociación\n• Ganar incentivos por cumplir tus pagos\n\n¡Comienza ahora y toma el control de tus finanzas!`
    }),

    /**
     * Recordatorio de pago próximo
     */
    paymentReminder: (userName, debtDetails, daysUntilDue) => ({
      message: `Hola ${userName} 📅\n\nTe recordamos que tienes un pago próximo:\n\n💰 Monto: $${debtDetails.amount.toLocaleString('es-CL')}\n📌 Empresa: ${debtDetails.companyName}\n⏰ Vence en: ${daysUntilDue} día${daysUntilDue > 1 ? 's' : ''}\n\n¡Paga a tiempo y gana tus incentivos! 🎁`
    }),

    /**
     * Confirmación de acuerdo aceptado
     */
    agreementAccepted: (userName, agreementDetails) => ({
      message: `¡Felicitaciones ${userName}! 🎉\n\nHas aceptado un nuevo acuerdo de pago:\n\n💰 Monto total: $${agreementDetails.totalAmount.toLocaleString('es-CL')}\n📊 Cuotas: ${agreementDetails.installments}\n🎁 Incentivo: $${agreementDetails.incentive.toLocaleString('es-CL')}\n\n¡Gracias por dar este paso hacia tu libertad financiera!`
    }),

    /**
     * Notificación de pago recibido
     */
    paymentReceived: (userName, paymentDetails) => ({
      message: `¡Excelente ${userName}! ✅\n\nHemos recibido tu pago:\n\n💰 Monto: $${paymentDetails.amount.toLocaleString('es-CL')}\n📌 Deuda: ${paymentDetails.debtName}\n🎁 Incentivo ganado: $${paymentDetails.incentiveEarned.toLocaleString('es-CL')}\n\n¡Sigue así y alcanza tus metas financieras! 🚀`
    }),

    /**
     * Alerta de incentivo disponible
     */
    incentiveAvailable: (userName, incentiveAmount) => ({
      message: `¡Buenas noticias ${userName}! 🎁\n\nTienes $${incentiveAmount.toLocaleString('es-CL')} en incentivos disponibles.\n\nPuedes:\n• Transferirlos a tu cuenta bancaria\n• Usarlos para pagar otras deudas\n• Canjearlos por gift cards\n\n¡Ingresa a la plataforma para canjear! 💸`
    }),

    /**
     * Nueva oferta disponible
     */
    newOffer: (userName, offerDetails) => ({
      message: `¡Hola ${userName}! 🔔\n\nTienes una nueva oferta especial:\n\n💰 ${offerDetails.type}\n📉 Descuento: ${offerDetails.discount}%\n🎁 Incentivo: $${offerDetails.incentive.toLocaleString('es-CL')}\n⏰ Válida hasta: ${offerDetails.expiryDate}\n\n¡No dejes pasar esta oportunidad!`
    }),

    /**
     * Recordatorio de oferta por vencer
     */
    offerExpiring: (userName, offerDetails, hoursLeft) => ({
      message: `⚠️ ${userName}, tu oferta está por vencer\n\n⏰ Tiempo restante: ${hoursLeft} horas\n💰 Descuento: ${offerDetails.discount}%\n🎁 Incentivo: $${offerDetails.incentive.toLocaleString('es-CL')}\n\n¡Aprovecha esta oportunidad antes de que expire!`
    }),

    /**
     * Logro desbloqueado
     */
    achievementUnlocked: (userName, achievement) => ({
      message: `🏆 ¡${userName}, has desbloqueado un logro!\n\n✨ "${achievement.name}"\n${achievement.description}\n\n🎁 Recompensa: ${achievement.reward} puntos\n\n¡Sigue así y continúa acumulando logros! 💪`
    }),

    /**
     * Subida de nivel
     */
    levelUp: (userName, newLevel, benefits) => ({
      message: `🎊 ¡Felicitaciones ${userName}!\n\nHas subido al Nivel ${newLevel}\n\n✨ Nuevos beneficios:\n${benefits}\n\n¡Sigue progresando en tu camino hacia la libertad financiera! 🚀`
    })
  };

  /**
   * Métodos de alto nivel para enviar notificaciones específicas
   */

  async sendWelcomeMessage(phoneNumber, userName) {
    const template = this.templates.welcome(userName);
    return await this.sendMessage(phoneNumber, template.message);
  }

  async sendPaymentReminder(phoneNumber, userName, debtDetails, daysUntilDue) {
    const template = this.templates.paymentReminder(userName, debtDetails, daysUntilDue);
    return await this.sendMessage(phoneNumber, template.message);
  }

  async sendAgreementConfirmation(phoneNumber, userName, agreementDetails) {
    const template = this.templates.agreementAccepted(userName, agreementDetails);
    return await this.sendMessage(phoneNumber, template.message);
  }

  async sendPaymentConfirmation(phoneNumber, userName, paymentDetails) {
    const template = this.templates.paymentReceived(userName, paymentDetails);
    return await this.sendMessage(phoneNumber, template.message);
  }

  async sendIncentiveAlert(phoneNumber, userName, incentiveAmount) {
    const template = this.templates.incentiveAvailable(userName, incentiveAmount);
    return await this.sendMessage(phoneNumber, template.message);
  }

  async sendNewOfferNotification(phoneNumber, userName, offerDetails) {
    const template = this.templates.newOffer(userName, offerDetails);
    return await this.sendMessage(phoneNumber, template.message);
  }

  async sendOfferExpiringAlert(phoneNumber, userName, offerDetails, hoursLeft) {
    const template = this.templates.offerExpiring(userName, offerDetails, hoursLeft);
    return await this.sendMessage(phoneNumber, template.message);
  }

  async sendAchievementNotification(phoneNumber, userName, achievement) {
    const template = this.templates.achievementUnlocked(userName, achievement);
    return await this.sendMessage(phoneNumber, template.message);
  }

  async sendLevelUpNotification(phoneNumber, userName, newLevel, benefits) {
    const template = this.templates.levelUp(userName, newLevel, benefits);
    return await this.sendMessage(phoneNumber, template.message);
  }

  /**
   * Envía un mensaje a múltiples destinatarios
   * @param {Array<string>} phoneNumbers - Array de números de teléfono
   * @param {string} message - Mensaje a enviar
   * @returns {Promise<Object>} Resultado del envío masivo
   */
  async sendBulkMessage(phoneNumbers, message) {
    const results = await Promise.allSettled(
      phoneNumbers.map(phone => this.sendMessage(phone, message))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    return {
      total: results.length,
      successful,
      failed,
      results: results
    };
  }
}

// Exportar instancia única (singleton)
const whatsappService = new WhatsAppService();
export default whatsappService;
