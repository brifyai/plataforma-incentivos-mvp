/**
 * Servicio de Pagos con Mercado Pago
 * 
 * Maneja toda la lógica de procesamiento de pagos:
 * - Inicialización de pagos
 * - Procesamiento con Mercado Pago
 * - Confirmación de pagos
 * - Cálculo de incentivos
 */

import { supabase } from '../config/supabase';
import { createPayment, updatePayment, createWalletTransaction, getWalletBalance } from './databaseService';
import { createNotification } from './databaseService';
import { COMMISSION_CONFIG, PAYMENT_METHODS, NOTIFICATION_TYPES } from '../config/constants';
import { createBankTransfer } from './bankTransferService';

/**
 * Calcula la comisión e incentivo para un pago (MODELO ECONÓMICO ACTUALIZADO)
 *
 * Nuevo modelo:
 * - Comisión fija: $60.000 por negocio cerrado (pagada mensualmente por empresa)
 * - Incentivo usuario: $30.000 fijo por cierre de negocio
 * - Comisiones de MP: Asumidas completamente por la empresa
 *
 * @param {number} amount - Monto del pago (ya no afecta cálculo)
 * @returns {Object} Objeto con valores fijos según nuevo modelo
 */
export const calculateCommissionAndIncentive = (amount) => {
  // Valores fijos según nuevo modelo económico
  const businessClosureFee = 60000; // $60.000 comisión fija por negocio cerrado
  const userIncentive = 30000; // $30.000 incentivo fijo al usuario
  const platformCommission = 0; // Comisiones de MP asumidas por empresa

  return {
    businessClosureFee, // Comisión que empresa paga mensualmente
    userIncentive, // Incentivo que usuario recibe
    platformCommission, // Comisión de pasarela (0 - asumida por empresa)
    totalPlatformRevenue: businessClosureFee, // Ingreso total plataforma por este negocio
  };
};

/**
 * Inicializa un pago en Mercado Pago
 * @param {Object} paymentData - Datos del pago
 * @returns {Promise<{preferenceId, initPoint, error}>}
 */
export const initializeMercadoPagoPayment = async (paymentData) => {
  try {
    const { amount, description, userId, agreementId, debtId, companyId } = paymentData;

    // En producción, aquí harías la llamada real al API de Mercado Pago
    // Por ahora, simulamos la creación de una preferencia
    
    const preference = {
      items: [
        {
          title: description || 'Pago de deuda',
          quantity: 1,
          unit_price: parseFloat(amount),
          currency_id: 'CLP',
        },
      ],
      back_urls: {
        success: `${window.location.origin}/payment-success`,
        failure: `${window.location.origin}/payment-failure`,
        pending: `${window.location.origin}/payment-pending`,
      },
      auto_return: 'approved',
      external_reference: `${userId}_${agreementId}_${Date.now()}`,
      notification_url: `${window.location.origin}/api/payment-notifications`, // Webhook
      metadata: {
        user_id: userId,
        agreement_id: agreementId,
        debt_id: debtId,
        company_id: companyId,
      },
    };

    // Aquí llamarías al SDK o API de Mercado Pago
    // const mp = new MercadoPago(MERCADOPAGO_PUBLIC_KEY);
    // const response = await mp.preferences.create(preference);
    
    // Simulación para desarrollo
    const mockResponse = {
      id: `pref_${Date.now()}`,
      init_point: `https://www.mercadopago.cl/checkout/v1/redirect?pref_id=mock_${Date.now()}`,
      sandbox_init_point: `https://sandbox.mercadopago.cl/checkout/v1/redirect?pref_id=mock_${Date.now()}`,
    };

    return {
      preferenceId: mockResponse.id,
      initPoint: mockResponse.init_point,
      error: null,
    };
  } catch (error) {
    console.error('Error initializing Mercado Pago payment:', error);
    return {
      preferenceId: null,
      initPoint: null,
      error: 'Error al inicializar el pago. Por favor, intenta de nuevo.',
    };
  }
};

/**
 * Procesa un pago y crea el registro en la base de datos (MODELO ECONÓMICO ACTUALIZADO)
 * @param {Object} paymentInfo - Información del pago
 * @returns {Promise<{payment, error}>}
 */
export const processPayment = async (paymentInfo) => {
  try {
    const {
      agreementId,
      userId,
      debtId,
      companyId,
      amount,
      paymentMethod,
      installmentNumber,
      paymentGatewayId = null,
    } = paymentInfo;

    // Calcular valores fijos según nuevo modelo económico
    const { businessClosureFee, userIncentive, platformCommission } = calculateCommissionAndIncentive(amount);

    // Crear registro de pago
    const paymentData = {
      agreement_id: agreementId,
      user_id: userId,
      debt_id: debtId,
      company_id: companyId,
      amount: parseFloat(amount),
      payment_method: paymentMethod,
      status: 'pending',
      platform_commission: platformCommission, // 0 - asumido por empresa
      user_incentive: userIncentive, // $30.000 fijo
      business_closure_fee: businessClosureFee, // $60.000 fijo
      installment_number: installmentNumber || null,
      payment_gateway_id: paymentGatewayId,
      metadata: {
        economic_model: 'fixed_commission_v2',
        business_closure_fee: businessClosureFee,
        user_incentive: userIncentive,
        monthly_billing: true, // Empresa paga mensualmente
      },
    };

    const { payment, error } = await createPayment(paymentData);

    if (error) {
      return { payment: null, error };
    }

    return { payment, error: null };
  } catch (error) {
    console.error('Error processing payment:', error);
    return { payment: null, error: 'Error al procesar el pago.' };
  }
};

/**
 * Confirma un pago exitoso y acredita el incentivo
 * @param {string} paymentId - ID del pago
 * @param {Object} confirmationData - Datos de confirmación del pago
 * @returns {Promise<{success, error}>}
 */
export const confirmPayment = async (paymentId, confirmationData = {}) => {
  try {
    // Actualizar estado del pago a 'completed'
    const { error: updateError } = await updatePayment(paymentId, {
      status: 'completed',
      metadata: {
        ...confirmationData,
        confirmed_at: new Date().toISOString(),
      },
    });

    if (updateError) {
      return { success: false, error: updateError };
    }

    // Obtener detalles del pago para acreditar incentivo
    const { data: paymentData, error: fetchError } = await supabase
      .from('payments')
      .select('*, user:users(id, wallet_balance)')
      .eq('id', paymentId)
      .single();

    if (fetchError || !paymentData) {
      return { success: false, error: 'Error al obtener detalles del pago.' };
    }

    // Acreditar incentivo al usuario (MODELO ECONÓMICO ACTUALIZADO)
    // Incentivo fijo de $30.000 por negocio cerrado
    const userIncentiveAmount = 30000; // $30.000 fijo
    if (userIncentiveAmount > 0) {
      const currentBalance = parseFloat(paymentData.user.wallet_balance) || 0;
      const newBalance = currentBalance + userIncentiveAmount;

      // Crear transacción de wallet
      await createWalletTransaction({
        user_id: paymentData.user_id,
        transaction_type: 'credit',
        concept: 'payment_incentive',
        amount: userIncentiveAmount,
        balance_before: currentBalance,
        balance_after: newBalance,
        related_payment_id: paymentId,
        metadata: {
          payment_amount: paymentData.amount,
          agreement_id: paymentData.agreement_id,
          economic_model: 'fixed_commission_v2',
          fixed_incentive: true,
        },
      });

      // Crear notificación de incentivo acreditado
      await createNotification({
        user_id: paymentData.user_id,
        type: NOTIFICATION_TYPES.INCENTIVE_CREDITED,
        title: '¡Incentivo Acreditado! 🎉',
        message: `Se han acreditado $30.000 a tu billetera por cerrar este negocio exitosamente.`,
        related_entity_id: paymentId,
        related_entity_type: 'payment',
        action_url: '/debtor/wallet',
      });
    }

    // AUTOMATIZACIÓN: Crear transferencia bancaria pendiente para la empresa
    try {
      // Verificar si la empresa tiene datos bancarios completos
      const { data: company } = await supabase
        .from('companies')
        .select('bank_account_info, mercadopago_beneficiary_id')
        .eq('id', paymentData.company_id)
        .single();

      if (company && company.bank_account_info && company.mercadopago_beneficiary_id) {
        // Calcular monto a transferir (monto del pago - comisión de MP si aplica)
        const transferAmount = parseFloat(paymentData.amount);

        // Crear transferencia bancaria automática
        await createBankTransfer({
          companyId: paymentData.company_id,
          amount: transferAmount,
          description: `Pago deuda - ${paymentData.user.full_name} - ${paymentData.debt?.debt_reference || 'N/A'}`,
        });

        console.log(`✅ Transferencia bancaria automática creada para empresa ${paymentData.company_id}`);
      } else {
        console.warn(`⚠️ Empresa ${paymentData.company_id} no tiene datos bancarios completos para transferencia automática`);
      }
    } catch (transferError) {
      console.error('Error creando transferencia automática:', transferError);
      // No fallar el proceso de pago por esto
    }

    // Crear notificación de pago confirmado
    await createNotification({
      user_id: paymentData.user_id,
      type: NOTIFICATION_TYPES.PAYMENT_CONFIRMED,
      title: 'Pago Confirmado',
      message: `Tu pago de $${paymentData.amount.toLocaleString('es-CL')} ha sido confirmado exitosamente.`,
      related_entity_id: paymentId,
      related_entity_type: 'payment',
      action_url: '/debtor/payments',
    });

    return { success: true, error: null };
  } catch (error) {
    console.error('Error confirming payment:', error);
    return { success: false, error: 'Error al confirmar el pago.' };
  }
};

/**
 * Procesa un pago desde la billetera virtual
 * @param {Object} walletPaymentData - Datos del pago con wallet
 * @returns {Promise<{success, error}>}
 */
export const processWalletPayment = async (walletPaymentData) => {
  try {
    const { userId, amount, agreementId, debtId, companyId, installmentNumber } = walletPaymentData;

    // Verificar saldo suficiente
    const { balance, error: balanceError } = await getWalletBalance(userId);

    if (balanceError) {
      return { success: false, error: balanceError };
    }

    if (balance < amount) {
      return { 
        success: false, 
        error: 'Saldo insuficiente en tu billetera. Por favor, elige otro método de pago.' 
      };
    }

    // Crear el pago
    const { payment, error: paymentError } = await processPayment({
      agreementId,
      userId,
      debtId,
      companyId,
      amount,
      paymentMethod: PAYMENT_METHODS.WALLET,
      installmentNumber,
      commissionPercentage: 0, // No hay comisión en pagos con wallet
      userIncentivePercentage: 0, // No hay incentivo adicional
      paymentGatewayId: null,
    });

    if (paymentError) {
      return { success: false, error: paymentError };
    }

    // Crear transacción de débito en wallet
    const newBalance = balance - amount;
    await createWalletTransaction({
      user_id: userId,
      transaction_type: 'debit',
      concept: 'cross_payment',
      amount: parseFloat(amount),
      balance_before: balance,
      balance_after: newBalance,
      related_payment_id: payment.id,
      metadata: {
        agreement_id: agreementId,
        debt_id: debtId,
      },
    });

    // Confirmar el pago inmediatamente (wallet es instantáneo)
    await confirmPayment(payment.id, {
      payment_method: 'wallet',
      instant: true,
    });

    return { success: true, payment, error: null };
  } catch (error) {
    console.error('Error processing wallet payment:', error);
    return { success: false, error: 'Error al procesar pago con billetera.' };
  }
};

/**
 * Procesa un retiro de fondos de la wallet
 * @param {Object} withdrawalData - Datos del retiro
 * @returns {Promise<{success, error}>}
 */
export const processWalletWithdrawal = async (withdrawalData) => {
  try {
    const { userId, amount, bankAccount } = withdrawalData;

    // Verificar saldo suficiente
    const { balance, error: balanceError } = await getWalletBalance(userId);

    if (balanceError) {
      return { success: false, error: balanceError };
    }

    if (balance < amount) {
      return { 
        success: false, 
        error: 'Saldo insuficiente para realizar el retiro.' 
      };
    }

    // Crear transacción de débito
    const newBalance = balance - amount;
    const { transaction, error: transactionError } = await createWalletTransaction({
      user_id: userId,
      transaction_type: 'debit',
      concept: 'withdrawal',
      amount: parseFloat(amount),
      balance_before: balance,
      balance_after: newBalance,
      metadata: {
        bank_account: bankAccount,
        withdrawal_status: 'pending',
        requested_at: new Date().toISOString(),
      },
    });

    if (transactionError) {
      return { success: false, error: transactionError };
    }

    // En producción, aquí se procesaría la transferencia bancaria real

    // Crear notificación
    await createNotification({
      user_id: userId,
      type: NOTIFICATION_TYPES.INCENTIVE_CREDITED, // O crear un tipo específico para retiros
      title: 'Retiro en Proceso',
      message: `Tu solicitud de retiro de $${amount.toLocaleString('es-CL')} está siendo procesada. Recibirás el dinero en 24-48 horas.`,
      related_entity_id: transaction.id,
      related_entity_type: 'wallet_transaction',
      action_url: '/debtor/wallet',
    });

    return { success: true, transaction, error: null };
  } catch (error) {
    console.error('Error processing wallet withdrawal:', error);
    return { success: false, error: 'Error al procesar retiro.' };
  }
};

/**
 * Canjea un gift card desde la wallet
 * @param {Object} redemptionData - Datos del canje
 * @returns {Promise<{success, giftCard, error}>}
 */
export const redeemGiftCard = async (redemptionData) => {
  try {
    const { userId, amount, merchant, denomination } = redemptionData;

    // Verificar saldo suficiente
    const { balance, error: balanceError } = await getWalletBalance(userId);

    if (balanceError) {
      return { success: false, giftCard: null, error: balanceError };
    }

    if (balance < amount) {
      return { 
        success: false, 
        giftCard: null,
        error: 'Saldo insuficiente para canjear gift card.' 
      };
    }

    // Crear transacción de débito
    const newBalance = balance - amount;
    const { transaction, error: transactionError } = await createWalletTransaction({
      user_id: userId,
      transaction_type: 'debit',
      concept: 'gift_card_redemption',
      amount: parseFloat(amount),
      balance_before: balance,
      balance_after: newBalance,
      metadata: {
        merchant,
        denomination,
        redeemed_at: new Date().toISOString(),
      },
    });

    if (transactionError) {
      return { success: false, giftCard: null, error: transactionError };
    }

    // En producción, aquí se generaría el código real del gift card
    const mockGiftCard = {
      code: `GC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      merchant,
      amount: denomination,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 año
    };

    // Crear notificación
    await createNotification({
      user_id: userId,
      type: NOTIFICATION_TYPES.INCENTIVE_CREDITED,
      title: 'Gift Card Canjeada',
      message: `Tu gift card de ${merchant} por $${denomination.toLocaleString('es-CL')} ha sido generada. Revisa tu email.`,
      related_entity_id: transaction.id,
      related_entity_type: 'wallet_transaction',
      action_url: '/debtor/wallet',
    });

    return { success: true, giftCard: mockGiftCard, error: null };
  } catch (error) {
    console.error('Error redeeming gift card:', error);
    return { success: false, giftCard: null, error: 'Error al canjear gift card.' };
  }
};

/**
 * Procesa un pago con transferencia bancaria (MODELO ECONÓMICO ACTUALIZADO)
 * @param {Object} bankTransferData - Datos del pago con transferencia
 * @returns {Promise<{payment, error}>}
 */
export const processBankTransferPayment = async (bankTransferData) => {
  try {
    const {
      agreementId,
      userId,
      debtId,
      companyId,
      amount,
      installmentNumber,
    } = bankTransferData;

    // Usar valores fijos del nuevo modelo económico
    const { businessClosureFee, userIncentive, platformCommission } = calculateCommissionAndIncentive(amount);

    // Crear registro de pago con estado awaiting_validation
    const paymentData = {
      agreement_id: agreementId,
      user_id: userId,
      debt_id: debtId,
      company_id: companyId,
      amount: parseFloat(amount),
      payment_method: 'bank_transfer',
      status: 'awaiting_validation',
      requires_validation: true,
      platform_commission: platformCommission, // 0
      user_incentive: userIncentive, // $30.000 fijo
      business_closure_fee: businessClosureFee, // $60.000 fijo
      installment_number: installmentNumber || null,
      metadata: {
        economic_model: 'fixed_commission_v2',
        transfer_instructions: 'Usuario debe subir comprobante de pago',
        monthly_billing: true,
      },
    };

    const { payment, error } = await createPayment(paymentData);

    if (error) {
      return { payment: null, error };
    }

    // Crear notificación para el usuario
    await createNotification({
      user_id: userId,
      type: NOTIFICATION_TYPES.PAYMENT_CONFIRMED,
      title: 'Pago por Transferencia Registrado',
      message: `Tu pago de $${amount.toLocaleString('es-CL')} por transferencia ha sido registrado. Sube el comprobante para validación.`,
      related_entity_id: payment.id,
      related_entity_type: 'payment',
      action_url: '/debtor/payments',
    });

    return { payment, error: null };
  } catch (error) {
    console.error('Error processing bank transfer payment:', error);
    return { payment: null, error: 'Error al procesar pago por transferencia.' };
  }
};

/**
 * Sube un comprobante de pago
 * @param {string} paymentId - ID del pago
 * @param {File} file - Archivo del comprobante
 * @param {string} userId - ID del usuario que sube el comprobante
 * @returns {Promise<{receipt, error}>}
 */
export const uploadPaymentReceipt = async (paymentId, file, userId) => {
  try {
    // Subir archivo a Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${paymentId}_${Date.now()}.${fileExt}`;
    const filePath = `payment-receipts/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('payment-receipts')
      .upload(filePath, file);

    if (uploadError) {
      return { receipt: null, error: uploadError.message };
    }

    // Obtener URL pública del archivo
    const { data: urlData } = supabase.storage
      .from('payment-receipts')
      .getPublicUrl(filePath);

    // Crear registro en payment_receipts
    const { data: receipt, error: dbError } = await supabase
      .from('payment_receipts')
      .insert({
        payment_id: paymentId,
        user_id: userId,
        file_name: fileName,
        file_url: urlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
      })
      .select()
      .single();

    if (dbError) {
      return { receipt: null, error: dbError.message };
    }

    return { receipt, error: null };
  } catch (error) {
    console.error('Error uploading payment receipt:', error);
    return { receipt: null, error: 'Error al subir comprobante de pago.' };
  }
};

/**
 * Valida un comprobante de pago (solo para empresas)
 * @param {string} paymentId - ID del pago
 * @param {string} receiptId - ID del comprobante
 * @param {string} validationStatus - 'approved' o 'rejected'
 * @param {string} validatedBy - ID del usuario que valida
 * @param {string} notes - Notas de validación
 * @returns {Promise<{success, error}>}
 */
export const validatePaymentReceipt = async (paymentId, receiptId, validationStatus, validatedBy, notes = '') => {
  try {
    // Actualizar comprobante
    const { error: receiptError } = await supabase
      .from('payment_receipts')
      .update({
        validation_status: validationStatus,
        validated_at: new Date().toISOString(),
        validated_by: validatedBy,
        validation_notes: notes,
      })
      .eq('id', receiptId);

    if (receiptError) {
      return { success: false, error: receiptError.message };
    }

    // Actualizar estado del pago
    const newPaymentStatus = validationStatus === 'approved' ? 'completed' : 'failed';

    const { error: paymentError } = await updatePayment(paymentId, {
      status: newPaymentStatus,
      validation_status: validationStatus,
      validated_at: new Date().toISOString(),
      validated_by: validatedBy,
      validation_notes: notes,
    });

    if (paymentError) {
      return { success: false, error: paymentError.message };
    }

    // Si el pago fue aprobado, confirmar el pago (acreditar incentivo)
    if (validationStatus === 'approved') {
      await confirmPayment(paymentId, {
        validated_by_receipt: true,
        receipt_id: receiptId,
      });
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error validating payment receipt:', error);
    return { success: false, error: 'Error al validar comprobante de pago.' };
  }
};

/**
 * Obtiene información bancaria de una empresa
 * @param {string} companyId - ID de la empresa
 * @returns {Promise<{bankInfo, error}>}
 */
export const getCompanyBankInfo = async (companyId) => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('bank_account_info')
      .eq('id', companyId)
      .single();

    if (error) {
      return { bankInfo: null, error: error.message };
    }

    return { bankInfo: data.bank_account_info, error: null };
  } catch (error) {
    console.error('Error getting company bank info:', error);
    return { bankInfo: null, error: 'Error al obtener información bancaria.' };
  }
};

/**
 * Inicializa un pago con Mercado Pago con split de pagos
 * @param {Object} paymentData - Datos del pago
 * @returns {Promise<{preferenceId, initPoint, error}>}
 */
export const initializeMercadoPagoSplitPayment = async (paymentData) => {
  try {
    const { amount, description, userId, agreementId, debtId, companyId } = paymentData;

    // Obtener información de la empresa para split
    const { bankInfo, error: bankError } = await getCompanyBankInfo(companyId);

    if (bankError || !bankInfo) {
      return {
        preferenceId: null,
        initPoint: null,
        error: 'La empresa no tiene configurada información de Mercado Pago.',
      };
    }

    // Calcular montos para split
    const platformCommission = amount * 0.15; // 15% para la plataforma
    const companyAmount = amount - platformCommission;

    // Crear preferencia con split
    const preference = {
      items: [
        {
          title: description || 'Pago de deuda',
          quantity: 1,
          unit_price: parseFloat(amount),
          currency_id: 'CLP',
        },
      ],
      back_urls: {
        success: `${window.location.origin}/payment-success`,
        failure: `${window.location.origin}/payment-failure`,
        pending: `${window.location.origin}/payment-pending`,
      },
      auto_return: 'approved',
      external_reference: `${userId}_${agreementId}_${Date.now()}`,
      notification_url: `${window.location.origin}/api/payment-notifications`,
      metadata: {
        user_id: userId,
        agreement_id: agreementId,
        debt_id: debtId,
        company_id: companyId,
        split_payment: true,
        platform_commission: platformCommission,
        company_amount: companyAmount,
      },
      // Configuración de split (en producción con API real)
      // disbursements: [
      //   {
      //     amount: companyAmount,
      //     external_reference: `company_${companyId}`,
      //     collector_id: bankInfo.mercadopago_account_id,
      //   }
      // ],
    };

    // Simulación para desarrollo
    const mockResponse = {
      id: `split_pref_${Date.now()}`,
      init_point: `https://www.mercadopago.cl/checkout/v1/redirect?pref_id=split_mock_${Date.now()}`,
      sandbox_init_point: `https://sandbox.mercadopago.cl/checkout/v1/redirect?pref_id=split_mock_${Date.now()}`,
    };

    return {
      preferenceId: mockResponse.id,
      initPoint: mockResponse.init_point,
      error: null,
    };
  } catch (error) {
    console.error('Error initializing Mercado Pago split payment:', error);
    return {
      preferenceId: null,
      initPoint: null,
      error: 'Error al inicializar pago con split.',
    };
  }
};

/**
 * Procesa un pago con Mercado Pago (MODELO ECONÓMICO ACTUALIZADO - Sin comisiones por transacción)
 * @param {Object} mercadopagoPaymentData - Datos del pago con MP
 * @returns {Promise<{payment, error}>}
 */
export const processMercadoPagoSplitPayment = async (mercadopagoPaymentData) => {
  try {
    const {
      agreementId,
      userId,
      debtId,
      companyId,
      amount,
      installmentNumber,
      paymentGatewayId,
    } = mercadopagoPaymentData;

    // Usar valores fijos - sin comisiones por transacción
    const { businessClosureFee, userIncentive, platformCommission } = calculateCommissionAndIncentive(amount);

    // Crear registro de pago
    const paymentData = {
      agreement_id: agreementId,
      user_id: userId,
      debt_id: debtId,
      company_id: companyId,
      amount: parseFloat(amount),
      payment_method: 'mercadopago',
      status: 'pending', // Se confirmará vía webhook
      platform_commission: platformCommission, // 0 - asumido por empresa
      user_incentive: userIncentive, // $30.000 fijo
      business_closure_fee: businessClosureFee, // $60.000 fijo
      installment_number: installmentNumber || null,
      payment_gateway_id: paymentGatewayId,
      requires_validation: false, // MP es automático
      metadata: {
        economic_model: 'fixed_commission_v2',
        monthly_billing: true,
        no_transaction_fees: true, // Empresa asume todas las comisiones de MP
        platform_revenue: businessClosureFee, // $60.000 pagados mensualmente
      },
    };

    const { payment, error } = await createPayment(paymentData);

    if (error) {
      return { payment: null, error };
    }

    return { payment, error: null };
  } catch (error) {
    console.error('Error processing Mercado Pago split payment:', error);
    return { payment: null, error: 'Error al procesar pago con Mercado Pago.' };
  }
};

export default {
  calculateCommissionAndIncentive,
  initializeMercadoPagoPayment,
  initializeMercadoPagoSplitPayment,
  processPayment,
  processBankTransferPayment,
  processMercadoPagoSplitPayment,
  uploadPaymentReceipt,
  validatePaymentReceipt,
  getCompanyBankInfo,
  confirmPayment,
  processWalletPayment,
  processWalletWithdrawal,
  redeemGiftCard,
};
