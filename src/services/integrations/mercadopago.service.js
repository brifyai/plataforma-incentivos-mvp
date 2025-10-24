/**
 * Servicio de integración con Mercado Pago
 * 
 * Este servicio maneja el procesamiento de pagos usando Mercado Pago.
 * Incluye creación de preferencias, procesamiento de pagos y manejo de webhooks.
 * 
 * @module MercadoPagoService
 */

import axios from 'axios';
import { supabase } from '@/config/supabase';
import { MERCADO_PAGO_ACCESS_TOKEN, MERCADO_PAGO_PUBLIC_KEY } from '../../config/systemConfig';

class MercadoPagoService {
  constructor() {
    // Prioridad: Variables de entorno > Configuración del sistema > Valores por defecto
    this.accessToken = import.meta.env.VITE_MERCADOPAGO_ACCESS_TOKEN ||
                      MERCADO_PAGO_ACCESS_TOKEN ||
                      'TEST-6067386116315126-100316-c4c8792007b0416b3669ebe53f17d2c5-2485402971';
    this.publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY ||
                    MERCADO_PAGO_PUBLIC_KEY ||
                    'TEST-3a7fe3e8-44a8-475e-b203-aa815c2cbeb1';
    this.baseURL = 'https://api.mercadopago.com';
    this.sandboxMode = import.meta.env.VITE_MERCADOPAGO_SANDBOX === 'true';
  }

  /**
   * Verifica si el servicio está configurado correctamente
   */
  isConfigured() {
    const configured = !!(this.accessToken && this.publicKey);
    return {
      configured,
      message: configured 
        ? `Mercado Pago configurado correctamente (${this.sandboxMode ? 'SANDBOX' : 'PRODUCCIÓN'})`
        : 'Faltan credenciales de Mercado Pago (ACCESS_TOKEN o PUBLIC_KEY)'
    };
  }

  /**
   * Realiza una petición a la API de Mercado Pago
   */
  async makeRequest(method, endpoint, data = null, params = null) {
    try {
      if (!this.isConfigured().configured) {
        throw new Error('Mercado Pago no está configurado');
      }

      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': this.generateIdempotencyKey()
        }
      };

      if (data) {
        config.data = data;
      }

      if (params) {
        config.params = params;
      }

      const response = await axios(config);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Error en Mercado Pago API:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Genera una clave de idempotencia para evitar pagos duplicados
   */
  generateIdempotencyKey() {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  // ==================== PREFERENCIAS DE PAGO ====================

  /**
   * Crea una preferencia de pago
   * @param {Object} paymentData - Datos del pago
   * @returns {Promise<Object>} Preferencia creada con init_point (URL de pago)
   */
  async createPaymentPreference(paymentData) {
    try {
      const {
        debtId,
        debtorId,
        debtorEmail,
        debtorName,
        amount,
        description,
        externalReference,
        backUrls,
        metadata
      } = paymentData;

      const preference = {
        items: [
          {
            title: description || 'Pago de deuda',
            quantity: 1,
            unit_price: parseFloat(amount),
            currency_id: 'CLP'
          }
        ],
        payer: {
          email: debtorEmail,
          name: debtorName
        },
        external_reference: externalReference || `debt-${debtId}-${Date.now()}`,
        back_urls: {
          success: backUrls?.success || `${window.location.origin}/payment/success`,
          failure: backUrls?.failure || `${window.location.origin}/payment/failure`,
          pending: backUrls?.pending || `${window.location.origin}/payment/pending`
        },
        auto_return: 'approved',
        notification_url: backUrls?.notification || `${window.location.origin}/api/webhooks/mercadopago`,
        metadata: {
          debt_id: debtId,
          debtor_id: debtorId,
          ...metadata
        },
        statement_descriptor: 'PLATAFORMA INCENTIVOS',
        payment_methods: {
          excluded_payment_types: [],
          installments: 1
        }
      };

      const result = await this.makeRequest('POST', '/checkout/preferences', preference);

      if (result.success) {
        // Guardar la preferencia en la base de datos
        await this.savePaymentPreference({
          preferenceId: result.data.id,
          debtId,
          debtorId,
          amount,
          externalReference: preference.external_reference,
          status: 'pending',
          createdAt: new Date().toISOString()
        });

        return {
          success: true,
          preferenceId: result.data.id,
          initPoint: result.data.init_point,
          sandboxInitPoint: result.data.sandbox_init_point,
          message: 'Preferencia de pago creada exitosamente'
        };
      }

      return result;
    } catch (error) {
      console.error('❌ Error al crear preferencia:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Guarda la preferencia de pago en la base de datos
   */
  async savePaymentPreference(preferenceData) {
    try {
      const { error } = await supabase
        .from('payment_preferences')
        .insert([preferenceData]);

      if (error) throw error;

      console.log('✅ Preferencia guardada en BD');
      return { success: true };
    } catch (error) {
      console.error('❌ Error al guardar preferencia:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Crea una preferencia de pago con cuotas
   */
  async createInstallmentPaymentPreference(paymentData) {
    const preference = await this.createPaymentPreference({
      ...paymentData,
      description: `${paymentData.description} - Cuota ${paymentData.installmentNumber} de ${paymentData.totalInstallments}`
    });

    return preference;
  }

  // ==================== PROCESAMIENTO DE PAGOS ====================

  /**
   * Obtiene información de un pago
   */
  async getPayment(paymentId) {
    try {
      const result = await this.makeRequest('GET', `/v1/payments/${paymentId}`);

      if (result.success) {
        return {
          success: true,
          payment: this.mapPaymentData(result.data)
        };
      }

      return result;
    } catch (error) {
      console.error('❌ Error al obtener pago:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Mapea los datos del pago de Mercado Pago a nuestro formato
   */
  mapPaymentData(mpPayment) {
    return {
      id: mpPayment.id,
      status: mpPayment.status,
      statusDetail: mpPayment.status_detail,
      amount: mpPayment.transaction_amount,
      amountRefunded: mpPayment.transaction_amount_refunded,
      currency: mpPayment.currency_id,
      description: mpPayment.description,
      paymentMethod: {
        id: mpPayment.payment_method_id,
        type: mpPayment.payment_type_id
      },
      payer: {
        email: mpPayment.payer?.email,
        identification: mpPayment.payer?.identification
      },
      externalReference: mpPayment.external_reference,
      metadata: mpPayment.metadata,
      dateCreated: mpPayment.date_created,
      dateApproved: mpPayment.date_approved,
      dateLastUpdated: mpPayment.date_last_updated
    };
  }

  /**
   * Procesa el webhook de Mercado Pago
   */
  async processWebhook(webhookData) {
    try {
      console.log('📥 Procesando webhook de Mercado Pago:', webhookData);

      const { type, data } = webhookData;

      // Verificar que sea una notificación de pago
      if (type !== 'payment') {
        console.log('⚠️ Webhook no es de tipo payment, ignorando');
        return { success: true, message: 'Webhook ignorado' };
      }

      // Obtener información del pago
      const paymentId = data.id;
      const paymentResult = await this.getPayment(paymentId);

      if (!paymentResult.success) {
        throw new Error('No se pudo obtener información del pago');
      }

      const payment = paymentResult.payment;

      // Guardar la transacción en la base de datos
      await this.saveTransaction(payment);

      // Si el pago fue aprobado, actualizar la deuda
      if (payment.status === 'approved') {
        await this.processApprovedPayment(payment);
      }

      return {
        success: true,
        message: 'Webhook procesado exitosamente',
        payment
      };
    } catch (error) {
      console.error('❌ Error al procesar webhook:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Guarda la transacción en la base de datos
   */
  async saveTransaction(payment) {
    try {
      const transaction = {
        payment_id: payment.id,
        external_reference: payment.externalReference,
        status: payment.status,
        status_detail: payment.statusDetail,
        amount: payment.amount,
        currency: payment.currency,
        payment_method: payment.paymentMethod.id,
        payment_type: payment.paymentMethod.type,
        payer_email: payment.payer.email,
        metadata: payment.metadata,
        date_created: payment.dateCreated,
        date_approved: payment.dateApproved,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('transactions')
        .upsert([transaction], { onConflict: 'payment_id' });

      if (error) throw error;

      console.log('✅ Transacción guardada en BD');
      return { success: true };
    } catch (error) {
      console.error('❌ Error al guardar transacción:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Procesa un pago aprobado
   */
  async processApprovedPayment(payment) {
    try {
      const debtId = payment.metadata?.debt_id;
      const debtorId = payment.metadata?.debtor_id;

      if (!debtId || !debtorId) {
        console.warn('⚠️ No se encontró debt_id o debtor_id en metadata');
        return;
      }

      // Actualizar el estado de la deuda
      const { error: debtError } = await supabase
        .from('debts')
        .update({
          status: 'paid',
          paid_amount: payment.amount,
          paid_at: payment.dateApproved,
          updated_at: new Date().toISOString()
        })
        .eq('id', debtId);

      if (debtError) throw debtError;

      // Calcular y otorgar incentivo
      await this.grantPaymentIncentive(debtorId, debtId, payment.amount);

      // Registrar en historial
      await this.logPaymentHistory(debtorId, debtId, payment);

      console.log('✅ Pago aprobado procesado exitosamente');
    } catch (error) {
      console.error('❌ Error al procesar pago aprobado:', error);
    }
  }

  /**
   * Otorga incentivo por el pago
   */
  async grantPaymentIncentive(debtorId, debtId, paymentAmount) {
    try {
      // Obtener la configuración del incentivo (puede ser un porcentaje)
      const incentivePercentage = 0.05; // 5% de incentivo por defecto
      const incentiveAmount = paymentAmount * incentivePercentage;

      // Actualizar wallet del deudor
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', debtorId)
        .single();

      if (walletError && walletError.code !== 'PGRST116') throw walletError;

      const currentBalance = wallet?.balance || 0;
      const newBalance = currentBalance + incentiveAmount;

      const { error: updateError } = await supabase
        .from('wallets')
        .upsert([{
          user_id: debtorId,
          balance: newBalance,
          updated_at: new Date().toISOString()
        }], { onConflict: 'user_id' });

      if (updateError) throw updateError;

      // Registrar la transacción de incentivo
      const { error: txError } = await supabase
        .from('wallet_transactions')
        .insert([{
          user_id: debtorId,
          type: 'incentive',
          amount: incentiveAmount,
          description: `Incentivo por pago de deuda`,
          related_debt_id: debtId,
          created_at: new Date().toISOString()
        }]);

      if (txError) throw txError;

      console.log(`✅ Incentivo otorgado: $${incentiveAmount} a usuario ${debtorId}`);
    } catch (error) {
      console.error('❌ Error al otorgar incentivo:', error);
    }
  }

  /**
   * Registra el pago en el historial
   */
  async logPaymentHistory(debtorId, debtId, payment) {
    try {
      const { error } = await supabase
        .from('payment_history')
        .insert([{
          debtor_id: debtorId,
          debt_id: debtId,
          payment_id: payment.id,
          amount: payment.amount,
          payment_method: payment.paymentMethod.id,
          status: payment.status,
          paid_at: payment.dateApproved,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      console.log('✅ Pago registrado en historial');
    } catch (error) {
      console.error('❌ Error al registrar pago en historial:', error);
    }
  }

  // ==================== REEMBOLSOS ====================

  /**
   * Crea un reembolso total o parcial
   */
  async createRefund(paymentId, amount = null) {
    try {
      const refundData = amount ? { amount } : {};

      const result = await this.makeRequest('POST', `/v1/payments/${paymentId}/refunds`, refundData);

      if (result.success) {
        console.log('✅ Reembolso creado exitosamente');
        return {
          success: true,
          refundId: result.data.id,
          amount: result.data.amount,
          status: result.data.status,
          message: 'Reembolso procesado exitosamente'
        };
      }

      return result;
    } catch (error) {
      console.error('❌ Error al crear reembolso:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== PAGOS AUTOMÁTICOS (PAYOUTS) ====================

  /**
   * Crea un pago automático a una cuenta bancaria
   * @param {Object} payoutData - Datos del pago automático
   * @returns {Promise<Object>} Resultado del pago automático
   */
  async createPayout(payoutData) {
    try {
      const {
        amount,
        currency = 'CLP',
        beneficiary,
        description,
        externalReference
      } = payoutData;

      const payout = {
        amount: parseFloat(amount),
        currency_id: currency,
        beneficiary: {
          first_name: beneficiary.firstName,
          last_name: beneficiary.lastName,
          email: beneficiary.email,
          phone: beneficiary.phone,
          identification: {
            type: beneficiary.identificationType || 'RUT',
            number: beneficiary.identificationNumber
          },
          bank_account: {
            bank_id: beneficiary.bankId,
            account_type: beneficiary.accountType || 'checking_account',
            account_number: beneficiary.accountNumber
          }
        },
        description: description || 'Pago automático desde plataforma',
        external_reference: externalReference || `payout-${Date.now()}`,
        statement_descriptor: 'PLATAFORMA INCENTIVOS'
      };

      const result = await this.makeRequest('POST', '/v1/payments/payouts', payout);

      if (result.success) {
        console.log('✅ Pago automático creado exitosamente');
        return {
          success: true,
          payoutId: result.data.id,
          status: result.data.status,
          amount: result.data.amount,
          currency: result.data.currency_id,
          externalReference: result.data.external_reference,
          message: 'Pago automático procesado exitosamente'
        };
      }

      return result;
    } catch (error) {
      console.error('❌ Error al crear pago automático:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtiene el estado de un pago automático
   * @param {string} payoutId - ID del pago automático
   * @returns {Promise<Object>} Estado del pago automático
   */
  async getPayoutStatus(payoutId) {
    try {
      const result = await this.makeRequest('GET', `/v1/payments/payouts/${payoutId}`);

      if (result.success) {
        return {
          success: true,
          payout: {
            id: result.data.id,
            status: result.data.status,
            statusDetail: result.data.status_detail,
            amount: result.data.amount,
            currency: result.data.currency_id,
            beneficiary: result.data.beneficiary,
            description: result.data.description,
            externalReference: result.data.external_reference,
            dateCreated: result.data.date_created,
            dateApproved: result.data.date_approved,
            dateLastUpdated: result.data.date_last_updated
          }
        };
      }

      return result;
    } catch (error) {
      console.error('❌ Error al obtener estado del pago automático:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Procesa pagos automáticos pendientes para una empresa
   * @param {string} companyId - ID de la empresa
   * @returns {Promise<Object>} Resultado del procesamiento
   */
  async processPendingPayouts(companyId) {
    try {
      console.log(`🔄 Procesando pagos automáticos pendientes para empresa ${companyId}`);

      // Obtener información de la empresa
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (companyError || !company) {
        return { success: false, error: 'Empresa no encontrada' };
      }

      // Verificar que la empresa tenga configuración bancaria
      if (!company.bank_account_info || !company.mercadopago_beneficiary_id) {
        return { success: false, error: 'Empresa no tiene configuración bancaria completa' };
      }

      // Obtener pagos aprobados que no han sido transferidos
      const { data: approvedPayments, error: paymentsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('status', 'approved')
        .eq('metadata->>company_id', companyId)
        .is('transfer_status', null); // Solo pagos no transferidos

      if (paymentsError) {
        return { success: false, error: paymentsError.message };
      }

      if (!approvedPayments || approvedPayments.length === 0) {
        return { success: true, message: 'No hay pagos pendientes de transferir', processed: 0 };
      }

      console.log(`📋 Encontrados ${approvedPayments.length} pagos para transferir`);

      let processed = 0;
      let failed = 0;
      const results = [];

      // Procesar cada pago
      for (const payment of approvedPayments) {
        try {
          // Calcular monto a transferir (después de comisiones)
          const commissionAmount = payment.amount * (company.nexupay_commission || 0.15);
          const transferAmount = payment.amount - commissionAmount;

          if (transferAmount <= 0) {
            console.warn(`⚠️ Monto insuficiente para transferir: ${transferAmount}`);
            continue;
          }

          // Crear pago automático
          const beneficiary = JSON.parse(company.bank_account_info);
          const payoutResult = await this.createPayout({
            amount: transferAmount,
            beneficiary: {
              firstName: beneficiary.firstName || company.company_name.split(' ')[0],
              lastName: beneficiary.lastName || company.company_name.split(' ').slice(1).join(' ') || 'Empresa',
              email: company.contact_email,
              phone: company.contact_phone,
              identificationNumber: company.rut,
              bankId: beneficiary.bankId,
              accountType: beneficiary.accountType,
              accountNumber: beneficiary.accountNumber
            },
            description: `Transferencia por pago aprobado - ${payment.external_reference}`,
            externalReference: `transfer-${payment.payment_id}-${Date.now()}`
          });

          if (payoutResult.success) {
            // Actualizar estado del pago como transferido
            await supabase
              .from('transactions')
              .update({
                transfer_status: 'processing',
                transfer_id: payoutResult.payoutId,
                transfer_amount: transferAmount,
                commission_amount: commissionAmount,
                transfer_initiated_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('payment_id', payment.payment_id);

            processed++;
            results.push({
              paymentId: payment.payment_id,
              status: 'success',
              payoutId: payoutResult.payoutId,
              amount: transferAmount
            });
          } else {
            // Marcar como fallido
            await supabase
              .from('transactions')
              .update({
                transfer_status: 'failed',
                transfer_error: payoutResult.error,
                updated_at: new Date().toISOString()
              })
              .eq('payment_id', payment.payment_id);

            failed++;
            results.push({
              paymentId: payment.payment_id,
              status: 'failed',
              error: payoutResult.error
            });
          }
        } catch (error) {
          console.error(`❌ Error procesando pago ${payment.payment_id}:`, error);
          failed++;
          results.push({
            paymentId: payment.payment_id,
            status: 'error',
            error: error.message
          });
        }
      }

      return {
        success: true,
        message: `Procesamiento completado: ${processed} exitosos, ${failed} fallidos`,
        processed,
        failed,
        results
      };
    } catch (error) {
      console.error('❌ Error en processPendingPayouts:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== REPORTES Y CONSULTAS ====================

  /**
   * Busca pagos por filtros
   */
  async searchPayments(filters = {}) {
    try {
      const params = {
        sort: 'date_created',
        criteria: 'desc',
        range: 'date_created',
        begin_date: filters.beginDate || 'NOW-30DAYS',
        end_date: filters.endDate || 'NOW',
        limit: filters.limit || 50,
        offset: filters.offset || 0
      };

      if (filters.externalReference) {
        params.external_reference = filters.externalReference;
      }

      const result = await this.makeRequest('GET', '/v1/payments/search', null, params);

      if (result.success) {
        return {
          success: true,
          payments: result.data.results.map(p => this.mapPaymentData(p)),
          paging: result.data.paging
        };
      }

      return result;
    } catch (error) {
      console.error('❌ Error al buscar pagos:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtiene estadísticas de pagos
   */
  async getPaymentStats(debtorId = null, period = 'month') {
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('status', 'approved');

      if (debtorId) {
        query = query.eq('metadata->>debtor_id', debtorId);
      }

      // Filtrar por período
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      query = query.gte('date_created', startDate.toISOString());

      const { data, error } = await query;

      if (error) throw error;

      // Calcular estadísticas
      const totalAmount = data.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
      const totalTransactions = data.length;
      const averageAmount = totalTransactions > 0 ? totalAmount / totalTransactions : 0;

      return {
        success: true,
        stats: {
          totalAmount,
          totalTransactions,
          averageAmount,
          period,
          startDate: startDate.toISOString(),
          endDate: now.toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Exportar instancia única (singleton)
const mercadoPagoService = new MercadoPagoService();
export default mercadoPagoService;
