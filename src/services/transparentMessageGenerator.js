/**
 * Transparent Message Generator - Generador de Mensajes Transparentes
 *
 * Genera mensajes seguros que garantizan:
 * - Transparencia total: Deudores ven nombres reales de empresas
 * - Protección absoluta: Nunca se comparten datos de contacto
 * - Comunicación controlada: Todo fluye por NexuPay
 * - Tokens JWT para acceso seguro
 */

import { supabase } from '../config/supabase';
import { securityService } from './securityService';
import { aiService } from './aiService';
import { logError, logInfo, logEvent } from './loggerService';

export class TransparentMessageGenerator {
  constructor() {
    this.messageTemplates = this.loadMessageTemplates();
    this.securityService = securityService;
    this.aiService = aiService;
  }

  /**
   * GENERAR MENSAJE TRANSPARENTE
   * Crea mensaje seguro con token JWT y contenido personalizado
   */
  async generateTransparentMessage(campaignId, debtorId, offerData) {
    try {
      logInfo('Generando mensaje transparente', { campaignId, debtorId });

      // Obtener datos de campaña y deudor
      const [campaignData, debtorData] = await Promise.all([
        this.getCampaignData(campaignId),
        this.getDebtorData(debtorId)
      ]);

      // Generar contenido persuasivo con IA
      const persuasiveContent = await this.generatePersuasiveContent(debtorData, offerData, campaignData);

      // Generar token JWT seguro
      const secureToken = this.securityService.generateSecureMessageToken(
        `msg_${campaignId}_${debtorId}`,
        debtorId,
        campaignData.company_id
      );

      // Crear URL segura
      const secureUrl = this.generateSecureUrl(secureToken);

      // Crear mensaje seguro en base de datos
      const secureMessage = await this.createSecureMessage({
        campaign_id: campaignId,
        debtor_id: debtorId,
        offer_data: offerData,
        content: persuasiveContent,
        access_token: secureToken,
        secure_url: secureUrl,
        company_name_visible: campaignData.company_name_visible,
        debt_reference_visible: campaignData.debt_reference_visible,
        trust_badges: this.generateTrustBadges(campaignData)
      });

      // Registrar evento de auditoría
      await this.securityService.auditLog('transparent_message_generated', {
        campaignId,
        debtorId,
        messageId: secureMessage.id,
        hasToken: true,
        contentLength: persuasiveContent.length
      }, debtorId);

      return {
        message: secureMessage,
        secureUrl,
        token: secureToken,
        content: persuasiveContent,
        trustBadges: this.generateTrustBadges(campaignData)
      };
    } catch (error) {
      logError('Error generando mensaje transparente', error, { campaignId, debtorId });
      throw new Error('Error al generar mensaje transparente');
    }
  }

  /**
   * GENERAR CONTENIDO PERSUASIVO
   * Usa IA para crear contenido engaging y personalizado
   */
  async generatePersuasiveContent(debtor, offer, campaign) {
    try {
      const template = this.selectMessageTemplate(debtor, offer, campaign);

      // Usar IA para personalizar contenido
      const personalizedContent = await this.aiService.executeTask('message_generation', {
        prompt: this.buildPersuasivePrompt(debtor, offer, campaign, template),
        debtor,
        offer,
        campaign
      });

      return personalizedContent.response || this.fallbackContent(debtor, offer, campaign);
    } catch (error) {
      logError('Error generando contenido persuasivo', error, { debtorId: debtor.id });
      return this.fallbackContent(debtor, offer, campaign);
    }
  }

  /**
   * VALIDAR ACCESO A MENSAJE
   * Verifica token JWT y permisos de acceso
   */
  async validateMessageAccess(token, debtorId) {
    try {
      // Validar token JWT
      const tokenValidation = this.securityService.validateSecureMessageToken(token);

      if (!tokenValidation.valid) {
        await this.logAccessAttempt(token, debtorId, false, tokenValidation.error);
        return {
          valid: false,
          error: tokenValidation.error,
          message: null
        };
      }

      // Verificar que el deudor coincide
      if (tokenValidation.payload.debtorId !== debtorId) {
        await this.logAccessAttempt(token, debtorId, false, 'Debtor ID mismatch');
        return {
          valid: false,
          error: 'Acceso no autorizado',
          message: null
        };
      }

      // Obtener mensaje seguro
      const message = await this.getSecureMessage(tokenValidation.payload.messageId);

      if (!message) {
        return {
          valid: false,
          error: 'Mensaje no encontrado',
          message: null
        };
      }

      // Registrar acceso exitoso
      await this.logAccessAttempt(token, debtorId, true);
      await this.updateMessageAccess(message.id);

      return {
        valid: true,
        message,
        tokenInfo: tokenValidation
      };
    } catch (error) {
      logError('Error validando acceso a mensaje', error, { token, debtorId });
      return {
        valid: false,
        error: 'Error de validación',
        message: null
      };
    }
  }

  /**
   * PROCESAR ACCIÓN DEL DEUDOR
   * Maneja aceptación, rechazo o interacción con la oferta
   */
  async processDebtorAction(messageId, action, debtorId, additionalData = {}) {
    try {
      const actions = {
        accept: 'converted',
        reject: 'expired',
        view: 'opened'
      };

      const newStatus = actions[action];
      if (!newStatus) {
        throw new Error(`Acción no válida: ${action}`);
      }

      // Actualizar mensaje
      await supabase
        .from('secure_messages')
        .update({
          status: newStatus,
          [`${action}_at`]: new Date().toISOString(),
          [`${action}_data`]: additionalData
        })
        .eq('id', messageId)
        .eq('debtor_id', debtorId);

      // Registrar en auditoría
      await this.securityService.auditLog('debtor_action_processed', {
        messageId,
        action,
        debtorId,
        additionalData
      }, debtorId);

      // Si es aceptación, crear acuerdo
      if (action === 'accept') {
        await this.createAgreementFromMessage(messageId, debtorId);
      }

      return { success: true, action, status: newStatus };
    } catch (error) {
      logError('Error procesando acción del deudor', error, { messageId, action, debtorId });
      throw new Error('Error al procesar acción');
    }
  }

  /**
   * OBTENER ESTADÍSTICAS DE MENSAJES
   * Métricas de engagement y conversión
   */
  async getMessageStatistics(campaignId = null, companyId = null) {
    try {
      let query = supabase
        .from('secure_messages')
        .select(`
          status,
          created_at,
          opened_at,
          converted_at,
          expired_at,
          campaign_id,
          unified_campaigns (
            name,
            company_id
          )
        `);

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }

      if (companyId) {
        query = query.eq('unified_campaigns.company_id', companyId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        sent: data?.filter(m => m.status === 'sent').length || 0,
        opened: data?.filter(m => m.status === 'opened').length || 0,
        converted: data?.filter(m => m.status === 'converted').length || 0,
        expired: data?.filter(m => m.status === 'expired').length || 0,
        openRate: 0,
        conversionRate: 0,
        avgTimeToOpen: 0,
        avgTimeToConvert: 0
      };

      // Calcular tasas
      if (stats.total > 0) {
        stats.openRate = (stats.opened / stats.total) * 100;
        stats.conversionRate = (stats.converted / stats.total) * 100;
      }

      // Calcular tiempos promedio
      const openedMessages = data?.filter(m => m.opened_at) || [];
      const convertedMessages = data?.filter(m => m.converted_at) || [];

      if (openedMessages.length > 0) {
        const totalOpenTime = openedMessages.reduce((sum, m) => {
          return sum + (new Date(m.opened_at) - new Date(m.created_at));
        }, 0);
        stats.avgTimeToOpen = totalOpenTime / openedMessages.length;
      }

      if (convertedMessages.length > 0) {
        const totalConvertTime = convertedMessages.reduce((sum, m) => {
          return sum + (new Date(m.converted_at) - new Date(m.created_at));
        }, 0);
        stats.avgTimeToConvert = totalConvertTime / convertedMessages.length;
      }

      return stats;
    } catch (error) {
      logError('Error obteniendo estadísticas de mensajes', error, { campaignId, companyId });
      return {
        total: 0,
        sent: 0,
        opened: 0,
        converted: 0,
        expired: 0,
        openRate: 0,
        conversionRate: 0
      };
    }
  }

  // =====================================================
  // MÉTODOS AUXILIARES
  // =====================================================

  async getCampaignData(campaignId) {
    const { data, error } = await supabase
      .from('unified_campaigns')
      .select(`
        *,
        companies (
          business_name
        )
      `)
      .eq('id', campaignId)
      .single();

    if (error) throw error;

    return {
      ...data,
      company_name_visible: data.companies?.business_name || 'Empresa',
      debt_reference_visible: `REF-${campaignId.slice(-6).toUpperCase()}`
    };
  }

  async getDebtorData(debtorId) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        debtors (
          current_amount,
          risk_level,
          debt_age_days
        )
      `)
      .eq('id', debtorId)
      .single();

    if (error) throw error;
    return data;
  }

  selectMessageTemplate(debtor, offer, campaign) {
    // Seleccionar template basado en perfil del deudor y tipo de oferta
    const riskLevel = debtor.debtors?.risk_level || 'medium';
    const discountPercent = offer.discountPercentage || 0;

    if (riskLevel === 'high' && discountPercent > 20) {
      return this.messageTemplates.highRiskHighDiscount;
    } else if (riskLevel === 'low') {
      return this.messageTemplates.lowRisk;
    } else {
      return this.messageTemplates.mediumRisk;
    }
  }

  buildPersuasivePrompt(debtor, offer, campaign, template) {
    return `
Eres un experto en comunicación persuasiva para cobranza.

Genera un mensaje personalizado y persuasivo para este deudor específico, siguiendo estas reglas:

1. TRANSPARENCIA TOTAL: Siempre mencionar el nombre real de la empresa (${campaign.company_name_visible})
2. PROTECCIÓN ABSOLUTA: NUNCA incluir datos de contacto (email, teléfono, dirección)
3. COMUNICACIÓN CONTROLADA: Todo debe fluir por NexuPay
4. ENFOQUE PERSUASIVO: Usar psicología positiva y beneficios claros

Perfil del deudor:
- Nombre: ${debtor.full_name || 'Estimado cliente'}
- Nivel de riesgo: ${debtor.debtors?.risk_level || 'medio'}
- Monto de deuda: $${debtor.debtors?.current_amount || 0}
- Antigüedad: ${debtor.debtors?.debt_age_days || 0} días

Oferta especial:
- Descuento: ${offer.discountPercentage || 0}%
- Plan de pago: ${offer.paymentPlan || 'único'}
- Validez: ${offer.validityDays || 30} días

Template base:
${template}

Genera un mensaje persuasivo que:
- Sea empático y respetuoso
- Destaque beneficios claros
- Cree urgencia positiva (no presión)
- Termine con llamado a acción claro
- Mantenga total transparencia
- Use lenguaje inclusivo y motivador

Longitud: 200-400 palabras
`;
  }

  fallbackContent(debtor, offer, campaign) {
    return `Hola ${debtor.full_name || 'estimado cliente'},

Somos ${campaign.company_name_visible} y queremos ayudarte a resolver tu situación de manera transparente y beneficiosa.

**Tu Oferta Personalizada:**
- Descuento especial: ${offer.discountPercentage || 0}% sobre tu deuda
- Plan de pagos flexible: ${offer.paymentPlan || 'único pago'}
- Validez: ${offer.validityDays || 30} días para aceptar

**¿Por qué elegir esta opción?**
- Reduce significativamente tu deuda pendiente
- Evitas intereses adicionales y cargos extras
- Mantienes una relación positiva con ${campaign.company_name_visible}
- Todo el proceso es seguro y confidencial

Para acceder a tu oferta personalizada y resolver esta situación, haz clic en el enlace seguro que te hemos enviado. Recuerda que toda la comunicación fluye de manera segura a través de NexuPay.

Estamos aquí para ayudarte de manera transparente y efectiva.

Atentamente,
Equipo de ${campaign.company_name_visible}
Procesado de forma segura por NexuPay`;
  }

  generateSecureUrl(token) {
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    return `${baseUrl}/debtor/oferta-segura/${token}`;
  }

  generateTrustBadges(campaign) {
    const badges = ['verified', 'secure'];

    if (campaign.ai_config?.enabled) {
      badges.push('personalized');
    }

    if (campaign.communication_config?.encrypted) {
      badges.push('encrypted');
    }

    return badges;
  }

  async createSecureMessage(messageData) {
    const { data, error } = await supabase
      .from('secure_messages')
      .insert({
        ...messageData,
        status: 'sent',
        sent_at: new Date().toISOString(),
        token_expires_at: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString() // 24 horas
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getSecureMessage(messageId) {
    const { data, error } = await supabase
      .from('secure_messages')
      .select(`
        *,
        unified_campaigns (
          name,
          offer_config,
          communication_config
        ),
        companies (
          business_name,
          logo_url
        )
      `)
      .eq('id', messageId)
      .single();

    if (error) throw error;
    return data;
  }

  async logAccessAttempt(token, debtorId, success, reason = null) {
    await this.securityService.auditLog('message_access_attempt', {
      token: token.substring(0, 10) + '...',
      debtorId,
      success,
      reason,
      timestamp: new Date().toISOString()
    }, debtorId);
  }

  async updateMessageAccess(messageId) {
    await supabase
      .from('secure_messages')
      .update({
        access_count: supabase.raw('access_count + 1'),
        last_accessed_at: new Date().toISOString()
      })
      .eq('id', messageId);
  }

  async createAgreementFromMessage(messageId, debtorId) {
    // Lógica para crear acuerdo desde mensaje aceptado
    // Implementar según necesidades específicas
    logInfo('Creando acuerdo desde mensaje aceptado', { messageId, debtorId });
  }

  loadMessageTemplates() {
    return {
      lowRisk: `
Estimado cliente,

Nos complace ofrecerte una solución beneficiosa para tu situación financiera...

[Contenido personalizado para deudores de bajo riesgo]
      `,

      mediumRisk: `
Hola,

Entendemos que las situaciones financieras pueden ser desafiantes...

[Contenido equilibrado para deudores de riesgo medio]
      `,

      highRiskHighDiscount: `
Apreciado cliente,

Reconocemos la importancia de resolver situaciones pendientes de manera efectiva...

[Contenido persuasivo con descuento significativo para deudores de alto riesgo]
      `
    };
  }
}

// =====================================================
// INSTANCIA GLOBAL
// =====================================================

export const transparentMessageGenerator = new TransparentMessageGenerator();

// Funciones de conveniencia
export const generateTransparentMessage = (campaignId, debtorId, offerData) =>
  transparentMessageGenerator.generateTransparentMessage(campaignId, debtorId, offerData);

export const validateMessageAccess = (token, debtorId) =>
  transparentMessageGenerator.validateMessageAccess(token, debtorId);

export const processDebtorAction = (messageId, action, debtorId, additionalData) =>
  transparentMessageGenerator.processDebtorAction(messageId, action, debtorId, additionalData);

export const getMessageStatistics = (campaignId, companyId) =>
  transparentMessageGenerator.getMessageStatistics(campaignId, companyId);

export default transparentMessageGenerator;