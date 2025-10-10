/**
 * Servicio de Base de Datos
 * 
 * Maneja todas las operaciones CRUD con Supabase para:
 * - Usuarios y perfiles
 * - Deudas
 * - Ofertas
 * - Acuerdos
 * - Pagos
 * - Notificaciones
 * - Wallet/Billetera
 */

import { supabase, handleSupabaseError } from '../config/supabase';
import { registerCompanyBeneficiary } from './bankTransferService';

// ==================== USUARIOS ====================

/**
 * Obtiene el perfil completo de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<{profile, error}>}
 */
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return { profile: null, error: handleSupabaseError(error) };
    }

    return { profile: data, error: null };
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return { profile: null, error: 'Error al obtener perfil del usuario.' };
  }
};

/**
 * Actualiza el perfil de un usuario
 * @param {string} userId - ID del usuario
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<{error}>}
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (error) {
      return { error: handleSupabaseError(error) };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return { error: 'Error al actualizar perfil.' };
  }
};

/**
 * Obtiene los datos de una empresa
 * @param {string} userId - ID del usuario empresa
 * @returns {Promise<{company, error}>}
 */
export const getCompanyProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // Cambiado de .single() a .maybeSingle() para manejar 0 resultados

    if (error) {
      return { company: null, error: handleSupabaseError(error) };
    }

    return { company: data, error: null };
  } catch (error) {
    console.error('Error in getCompanyProfile:', error);
    return { company: null, error: 'Error al obtener datos de empresa.' };
  }
};

/**
 * Actualiza el perfil de una empresa
 * @param {string} companyId - ID de la empresa
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<{error}>}
 */
export const updateCompanyProfile = async (companyId, updates) => {
  try {
    const { error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', companyId);

    if (error) {
      return { error: handleSupabaseError(error) };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in updateCompanyProfile:', error);
    return { error: 'Error al actualizar perfil de empresa.' };
  }
};

// ==================== DEUDAS ====================

/**
 * Obtiene todas las deudas de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<{debts, error}>}
 */
export const getUserDebts = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('debts')
      .select(`
        *,
        company:companies(id, contact_email)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { debts: [], error: handleSupabaseError(error) };
    }

    return { debts: data || [], error: null };
  } catch (error) {
    console.error('Error in getUserDebts:', error);
    return { debts: [], error: 'Error al obtener deudas.' };
  }
};

/**
 * Obtiene una deuda específica
 * @param {string} debtId - ID de la deuda
 * @returns {Promise<{debt, error}>}
 */
export const getDebtById = async (debtId) => {
  try {
    const { data, error } = await supabase
      .from('debts')
      .select(`
        *,
        company:companies(id, business_name, contact_email, contact_phone),
        user:users(id, full_name, email)
      `)
      .eq('id', debtId)
      .single();

    if (error) {
      return { debt: null, error: handleSupabaseError(error) };
    }

    return { debt: data, error: null };
  } catch (error) {
    console.error('Error in getDebtById:', error);
    return { debt: null, error: 'Error al obtener deuda.' };
  }
};

/**
 * Obtiene todas las deudas de una empresa (opcionalmente filtradas por cliente)
 * @param {string} companyId - ID de la empresa
 * @param {string} [clientId] - ID del cliente (opcional)
 * @returns {Promise<{debts, error}>}
 */
export const getCompanyDebts = async (companyId, clientId = null) => {
  try {
    let query = supabase
      .from('debts')
      .select(`
        *,
        client:clients(id, business_name, rut),
        user:users(id, full_name, email, rut)
      `);

    if (clientId) {
      // Si hay clientId específico, filtrar por ese cliente
      query = query.eq('client_id', clientId);
    } else {
      // Si no hay clientId específico, obtener deudas de todos los clientes de la empresa
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id')
        .eq('company_id', companyId);

      if (clientsError) {
        return { debts: [], error: handleSupabaseError(clientsError) };
      }

      const clientIds = clients?.map(c => c.id) || [];
      if (clientIds.length === 0) {
        return { debts: [], error: null };
      }

      query = query.in('client_id', clientIds);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return { debts: [], error: handleSupabaseError(error) };
    }

    return { debts: data || [], error: null };
  } catch (error) {
    console.error('Error in getCompanyDebts:', error);
    return { debts: [], error: 'Error al obtener deudas de la empresa.' };
  }
};

/**
 * Crea una nueva deuda
 * @param {Object} debtData - Datos de la deuda
 * @returns {Promise<{debt, error}>}
 */
export const createDebt = async (debtData) => {
  try {
    const { data, error } = await supabase
      .from('debts')
      .insert(debtData)
      .select()
      .single();

    if (error) {
      return { debt: null, error: handleSupabaseError(error) };
    }

    return { debt: data, error: null };
  } catch (error) {
    console.error('Error in createDebt:', error);
    return { debt: null, error: 'Error al crear deuda.' };
  }
};

/**
 * Actualiza una deuda
 * @param {string} debtId - ID de la deuda
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<{error}>}
 */
export const updateDebt = async (debtId, updates) => {
  try {
    const { error } = await supabase
      .from('debts')
      .update(updates)
      .eq('id', debtId);

    if (error) {
      return { error: handleSupabaseError(error) };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in updateDebt:', error);
    return { error: 'Error al actualizar deuda.' };
  }
};

// ==================== OFERTAS ====================

/**
 * Obtiene todas las ofertas disponibles para un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<{offers, error}>}
 */
export const getUserOffers = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('offers')
      .select(`
        *,
        debt:debts(id, original_amount, current_amount)
      `)
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error in getUserOffers:', error);
      return { offers: [], error: handleSupabaseError(error) };
    }

    return { offers: data || [], error: null };
  } catch (error) {
    console.error('Error in getUserOffers:', error);
    return { offers: [], error: 'Error al obtener ofertas.' };
  }
};

/**
 * Obtiene ofertas de una empresa
 * @param {string} companyId - ID de la empresa
 * @returns {Promise<{offers, error}>}
 */
export const getCompanyOffers = async (companyId) => {
  try {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      return { offers: [], error: handleSupabaseError(error) };
    }

    return { offers: data || [], error: null };
  } catch (error) {
    console.error('Error in getCompanyOffers:', error);
    return { offers: [], error: 'Error al obtener ofertas de la empresa.' };
  }
};

/**
 * Obtiene las propuestas de una empresa
 * @param {string} companyId - ID de la empresa
 * @returns {Promise<{proposals: Array, error: string|null}>}
 */
export const getCompanyProposals = async (companyId) => {
  try {
    const { data, error } = await supabase
      .from('proposals')
      .select(`
        *,
        debts (
          id,
          amount,
          description,
          debtor:users!debts_debtor_id_fkey (
            id,
            user_metadata
          )
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      return { proposals: [], error: handleSupabaseError(error) };
    }

    // Transformar los datos para que coincidan con el formato esperado por la UI
    const transformedProposals = (data || []).map(proposal => ({
      id: proposal.id,
      debtorName: proposal.debts?.debtor?.user_metadata?.full_name || 'Usuario desconocido',
      debtorRut: proposal.debts?.debtor?.user_metadata?.rut || 'Sin RUT',
      amount: proposal.proposed_amount,
      paymentPlan: proposal.payment_plan,
      description: proposal.description,
      submittedAt: proposal.created_at,
      status: proposal.status,
      debtReference: proposal.debts?.id || proposal.debt_id,
      companyResponse: proposal.company_response,
      counterAmount: proposal.counter_amount,
      accepted: proposal.accepted,
      respondedAt: proposal.responded_at
    }));

    return { proposals: transformedProposals, error: null };
  } catch (error) {
    console.error('Error in getCompanyProposals:', error);
    return { proposals: [], error: 'Error al obtener propuestas de la empresa.' };
  }
};

/**
 * Crea una nueva propuesta (desde el lado del deudor)
 * @param {Object} proposalData - Datos de la propuesta
 * @returns {Promise<{proposal, error}>}
 */
export const createProposal = async (proposalData) => {
  try {
    const { data, error } = await supabase
      .from('proposals')
      .insert([proposalData])
      .select()
      .single();

    if (error) {
      return { proposal: null, error: handleSupabaseError(error) };
    }

    return { proposal: data, error: null };
  } catch (error) {
    console.error('Error in createProposal:', error);
    return { proposal: null, error: 'Error al crear la propuesta.' };
  }
};

/**
 * Actualiza una propuesta (respuesta de la empresa)
 * @param {string} proposalId - ID de la propuesta
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const updateProposal = async (proposalId, updates) => {
  try {
    const { error } = await supabase
      .from('proposals')
      .update({
        ...updates,
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', proposalId);

    if (error) {
      return { success: false, error: handleSupabaseError(error) };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error in updateProposal:', error);
    return { success: false, error: 'Error al actualizar la propuesta.' };
  }
};

/**
 * Crea una nueva oferta
 * @param {Object} offerData - Datos de la oferta
 * @returns {Promise<{offer, error}>}
 */
export const createOffer = async (offerData) => {
  try {
    const { data, error } = await supabase
      .from('offers')
      .insert(offerData)
      .select()
      .single();

    if (error) {
      return { offer: null, error: handleSupabaseError(error) };
    }

    return { offer: data, error: null };
  } catch (error) {
    console.error('Error in createOffer:', error);
    return { offer: null, error: 'Error al crear oferta.' };
  }
};

/**
 * Actualiza una oferta
 * @param {string} offerId - ID de la oferta
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<{error}>}
 */
export const updateOffer = async (offerId, updates) => {
  try {
    const { error } = await supabase
      .from('offers')
      .update(updates)
      .eq('id', offerId);

    if (error) {
      return { error: handleSupabaseError(error) };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in updateOffer:', error);
    return { error: 'Error al actualizar oferta.' };
  }
};

/**
 * Elimina una oferta
 * @param {string} offerId - ID de la oferta
 * @returns {Promise<{error}>}
 */
export const deleteOffer = async (offerId) => {
  try {
    const { error } = await supabase
      .from('offers')
      .delete()
      .eq('id', offerId);

    if (error) {
      return { error: handleSupabaseError(error) };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in deleteOffer:', error);
    return { error: 'Error al eliminar oferta.' };
  }
};

// ==================== ACUERDOS ====================

/**
 * Obtiene todos los acuerdos de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<{agreements, error}>}
 */
export const getUserAgreements = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('agreements')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error in getUserAgreements:', error);
      return { agreements: [], error: handleSupabaseError(error) };
    }

    return { agreements: data || [], error: null };
  } catch (error) {
    console.error('Error in getUserAgreements:', error);
    return { agreements: [], error: 'Error al obtener acuerdos.' };
  }
};

/**
 * Obtiene acuerdos de una empresa
 * @param {string} companyId - ID de la empresa
 * @returns {Promise<{agreements, error}>}
 */
export const getCompanyAgreements = async (companyId) => {
  try {
    const { data, error } = await supabase
      .from('agreements')
      .select(`
        *,
        user:users(id, full_name, email, rut)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error in getCompanyAgreements:', error);
      return { agreements: [], error: handleSupabaseError(error) };
    }

    return { agreements: data || [], error: null };
  } catch (error) {
    console.error('Error in getCompanyAgreements:', error);
    return { agreements: [], error: 'Error al obtener acuerdos de la empresa.' };
  }
};

/**
 * Crea un nuevo acuerdo (usuario acepta oferta)
 * @param {Object} agreementData - Datos del acuerdo
 * @returns {Promise<{agreement, error}>}
 */
export const createAgreement = async (agreementData) => {
  try {
    const { data, error } = await supabase
      .from('agreements')
      .insert(agreementData)
      .select()
      .single();

    if (error) {
      return { agreement: null, error: handleSupabaseError(error) };
    }

    // Actualizar estado de la oferta a 'used'
    if (agreementData.offer_id) {
      await updateOffer(agreementData.offer_id, { status: 'used' });
    }

    // Actualizar estado de la deuda a 'in_negotiation'
    if (agreementData.debt_id) {
      await updateDebt(agreementData.debt_id, { status: 'in_negotiation' });
    }

    return { agreement: data, error: null };
  } catch (error) {
    console.error('Error in createAgreement:', error);
    return { agreement: null, error: 'Error al crear acuerdo.' };
  }
};

/**
 * Actualiza un acuerdo
 * @param {string} agreementId - ID del acuerdo
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<{error}>}
 */
export const updateAgreement = async (agreementId, updates) => {
  try {
    const { error } = await supabase
      .from('agreements')
      .update(updates)
      .eq('id', agreementId);

    if (error) {
      return { error: handleSupabaseError(error) };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in updateAgreement:', error);
    return { error: 'Error al actualizar acuerdo.' };
  }
};

/**
 * Actualiza el estado de un acuerdo
 * @param {string} agreementId - ID del acuerdo
 * @param {Object} statusData - Datos del estado
 * @returns {Promise<{error}>}
 */
export const updateAgreementStatus = async (agreementId, statusData) => {
  try {
    const updates = {
      status: statusData.status,
      updated_at: new Date().toISOString()
    };

    // Agregar notas si existen
    if (statusData.notes) {
      updates.notes = statusData.notes;
    }

    // Agregar quien actualizó si existe
    if (statusData.updated_by) {
      updates.updated_by = statusData.updated_by;
    }

    const { error } = await supabase
      .from('agreements')
      .update(updates)
      .eq('id', agreementId);

    if (error) {
      return { error: handleSupabaseError(error) };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in updateAgreementStatus:', error);
    return { error: 'Error al actualizar estado del acuerdo.' };
  }
};

// ==================== PAGOS ====================

/**
 * Obtiene todos los pagos de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<{payments, error}>}
 */
export const getUserPayments = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false });

    if (error) {
      console.error('Error in getUserPayments:', error);
      return { payments: [], error: handleSupabaseError(error) };
    }

    return { payments: data || [], error: null };
  } catch (error) {
    console.error('Error in getUserPayments:', error);
    return { payments: [], error: 'Error al obtener pagos.' };
  }
};

/**
 * Obtiene pagos de una empresa
 * @param {string} companyId - ID de la empresa
 * @returns {Promise<{payments, error}>}
 */
export const getCompanyPayments = async (companyId) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        user:users(id, full_name, email)
      `)
      .eq('company_id', companyId)
      .order('transaction_date', { ascending: false });

    if (error) {
      console.error('Error in getCompanyPayments:', error);
      return { payments: [], error: handleSupabaseError(error) };
    }

    return { payments: data || [], error: null };
  } catch (error) {
    console.error('Error in getCompanyPayments:', error);
    return { payments: [], error: 'Error al obtener pagos de la empresa.' };
  }
};

/**
 * Crea un nuevo pago
 * @param {Object} paymentData - Datos del pago
 * @returns {Promise<{payment, error}>}
 */
export const createPayment = async (paymentData) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (error) {
      return { payment: null, error: handleSupabaseError(error) };
    }

    return { payment: data, error: null };
  } catch (error) {
    console.error('Error in createPayment:', error);
    return { payment: null, error: 'Error al crear pago.' };
  }
};

/**
 * Actualiza un pago
 * @param {string} paymentId - ID del pago
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<{error}>}
 */
export const updatePayment = async (paymentId, updates) => {
  try {
    const { error } = await supabase
      .from('payments')
      .update(updates)
      .eq('id', paymentId);

    if (error) {
      return { error: handleSupabaseError(error) };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in updatePayment:', error);
    return { error: 'Error al actualizar pago.' };
  }
};

// ==================== WALLET/BILLETERA ====================

/**
 * Obtiene el balance actual de la wallet del usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<{balance, error}>}
 */
export const getWalletBalance = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', userId)
      .single();

    if (error) {
      return { balance: 0, error: handleSupabaseError(error) };
    }

    return { balance: parseFloat(data.wallet_balance) || 0, error: null };
  } catch (error) {
    console.error('Error in getWalletBalance:', error);
    return { balance: 0, error: 'Error al obtener balance de billetera.' };
  }
};

/**
 * Obtiene las transacciones de la wallet de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<{transactions, error}>}
 */
export const getWalletTransactions = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { transactions: [], error: handleSupabaseError(error) };
    }

    return { transactions: data || [], error: null };
  } catch (error) {
    console.error('Error in getWalletTransactions:', error);
    return { transactions: [], error: 'Error al obtener transacciones de billetera.' };
  }
};

/**
 * Crea una transacción de wallet
 * @param {Object} transactionData - Datos de la transacción
 * @returns {Promise<{transaction, error}>}
 */
export const createWalletTransaction = async (transactionData) => {
  try {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .insert(transactionData)
      .select()
      .single();

    if (error) {
      return { transaction: null, error: handleSupabaseError(error) };
    }

    return { transaction: data, error: null };
  } catch (error) {
    console.error('Error in createWalletTransaction:', error);
    return { transaction: null, error: 'Error al crear transacción de billetera.' };
  }
};

// ==================== NOTIFICACIONES ====================

/**
 * Obtiene las notificaciones de un usuario
 * @param {string} userId - ID del usuario
 * @param {boolean} unreadOnly - Si solo obtener no leídas
 * @returns {Promise<{notifications, error}>}
 */
export const getUserNotifications = async (userId, unreadOnly = false) => {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId);

    if (unreadOnly) {
      query = query.eq('status', 'unread');
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return { notifications: [], error: handleSupabaseError(error) };
    }

    return { notifications: data || [], error: null };
  } catch (error) {
    console.error('Error in getUserNotifications:', error);
    return { notifications: [], error: 'Error al obtener notificaciones.' };
  }
};

/**
 * Crea una nueva notificación
 * @param {Object} notificationData - Datos de la notificación
 * @returns {Promise<{notification, error}>}
 */
export const createNotification = async (notificationData) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (error) {
      return { notification: null, error: handleSupabaseError(error) };
    }

    return { notification: data, error: null };
  } catch (error) {
    console.error('Error in createNotification:', error);
    return { notification: null, error: 'Error al crear notificación.' };
  }
};

/**
 * Marca una notificación como leída
 * @param {string} notificationId - ID de la notificación
 * @returns {Promise<{error}>}
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        status: 'read',
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    if (error) {
      return { error: handleSupabaseError(error) };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error);
    return { error: 'Error al marcar notificación como leída.' };
  }
};

/**
 * Marca todas las notificaciones de un usuario como leídas
 * @param {string} userId - ID del usuario
 * @returns {Promise<{error}>}
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        status: 'read',
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'unread');

    if (error) {
      return { error: handleSupabaseError(error) };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in markAllNotificationsAsRead:', error);
    return { error: 'Error al marcar todas las notificaciones como leídas.' };
  }
};

// ==================== ESTADÍSTICAS ====================

/**
 * Obtiene estadísticas de comisiones del usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<{commissionStats, error}>}
 */
export const getUserCommissionStats = async (userId) => {
  try {
    // Obtener pagos completados con información de empresa
    const { data: completedPayments, error: paymentsError } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        user_incentive,
        company_id,
        companies!inner(
          nexupay_commission,
          nexupay_commission_type,
          user_incentive_percentage,
          user_incentive_type
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (paymentsError) {
      return { commissionStats: null, error: handleSupabaseError(paymentsError) };
    }

    // Calcular comisiones ganadas basadas en configuración real de empresas
    let earnedCommissions = 0;
    let totalPayments = 0;

    if (completedPayments && completedPayments.length > 0) {
      for (const payment of completedPayments) {
        const company = payment.companies;
        const paymentAmount = parseFloat(payment.amount) || 0;

        // Calcular incentivo al usuario según configuración de la empresa
        let userIncentive = 0;
        if (company.user_incentive_type === 'percentage') {
          userIncentive = paymentAmount * (parseFloat(company.user_incentive_percentage) || 5) / 100;
        } else {
          userIncentive = parseFloat(company.user_incentive_percentage) || 0;
        }

        // Si hay incentivo específico en el pago, usarlo
        if (payment.user_incentive) {
          userIncentive = parseFloat(payment.user_incentive);
        }

        earnedCommissions += userIncentive;
        totalPayments++;
      }
    }

    // Calcular próxima comisión (estimación basada en pagos recientes)
    let nextCommission = 0;
    if (totalPayments > 0) {
      nextCommission = earnedCommissions / totalPayments;
    }

    // Calcular potencial mensual (estimación basada en pagos completados)
    const monthlyPotential = earnedCommissions * 1.2; // 20% más como potencial

    const commissionStats = {
      earnedCommissions,
      nextCommission,
      monthlyPotential,
    };

    return { commissionStats, error: null };
  } catch (error) {
    console.error('Error in getUserCommissionStats:', error);
    return { commissionStats: null, error: 'Error al obtener estadísticas de comisiones.' };
  }
};

/**
 * Obtiene estadísticas del dashboard de deudor
 * @param {string} userId - ID del usuario
 * @returns {Promise<{stats, error}>}
 */
export const getDebtorDashboardStats = async (userId) => {
  try {
    // Obtener totales en paralelo
    const [debtsResult, agreementsResult, paymentsResult, walletResult] = await Promise.all([
      getUserDebts(userId),
      getUserAgreements(userId),
      getUserPayments(userId),
      getWalletBalance(userId),
    ]);

    if (debtsResult.error || agreementsResult.error || paymentsResult.error || walletResult.error) {
      return { 
        stats: null, 
        error: 'Error al obtener estadísticas del dashboard.' 
      };
    }

    const stats = {
      totalDebts: debtsResult.debts.length,
      totalDebtAmount: debtsResult.debts.reduce((sum, debt) => sum + parseFloat(debt.current_amount), 0),
      activeAgreements: agreementsResult.agreements.filter(a => a.status === 'active').length,
      completedPayments: paymentsResult.payments.filter(p => p.status === 'completed').length,
      totalPaid: paymentsResult.payments
        .filter(p => p.status === 'completed')
        .reduce((sum, payment) => sum + parseFloat(payment.amount), 0),
      walletBalance: walletResult.balance,
    };

    return { stats, error: null };
  } catch (error) {
    console.error('Error in getDebtorDashboardStats:', error);
    return { stats: null, error: 'Error al obtener estadísticas.' };
  }
};

/**
 * Obtiene estadísticas del dashboard de empresa
 * @param {string} companyId - ID de la empresa
 * @returns {Promise<{stats, error}>}
 */
export const getCompanyDashboardStats = async (companyId) => {
  try {
    const [debtsResult, agreementsResult, paymentsResult, clientsResult] = await Promise.all([
      getCompanyDebts(companyId),
      getCompanyAgreements(companyId),
      getCompanyPayments(companyId),
      getCompanyClients(companyId),
    ]);

    if (debtsResult.error || agreementsResult.error || paymentsResult.error || clientsResult.error) {
      return {
        stats: null,
        error: 'Error al obtener estadísticas del dashboard.'
      };
    }

    const totalDebtAmount = debtsResult.debts.reduce((sum, debt) => sum + parseFloat(debt.current_amount), 0);
    const totalRecovered = paymentsResult.payments
      .filter(p => p.status === 'completed')
      .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

    const stats = {
      totalClients: clientsResult.clients.length,
      totalDebtors: new Set(debtsResult.debts.map(d => d.user_id)).size,
      totalDebts: debtsResult.debts.length,
      totalDebtAmount,
      activeAgreements: agreementsResult.agreements.filter(a => a.status === 'active').length,
      totalRecovered,
      recoveryRate: totalDebtAmount > 0 ? (totalRecovered / totalDebtAmount) * 100 : 0,
    };

    return { stats, error: null };
  } catch (error) {
    console.error('Error in getCompanyDashboardStats:', error);
    return { stats: null, error: 'Error al obtener estadísticas.' };
  }
};

// ==================== COMPROBANTES DE PAGO ====================

/**
 * Obtiene comprobantes pendientes de validación para una empresa
 * @param {string} companyId - ID de la empresa
 * @returns {Promise<{receipts, error}>}
 */
export const getPendingReceiptsForCompany = async (companyId) => {
  try {
    const { data, error } = await supabase
      .from('payment_receipts')
      .select(`
        *,
        payment:payments(
          id,
          amount,
          user:users(full_name, email, rut)
        )
      `)
      .eq('company_id', companyId)
      .eq('validation_status', 'pending')
      .order('uploaded_at', { ascending: true });

    if (error) {
      console.error('Error in getPendingReceiptsForCompany:', error);
      // Si hay error de relación, intentar consulta sin relaciones
      if (error.code === 'PGRST200') {
        const { data: altData, error: altError } = await supabase
          .from('payment_receipts')
          .select('*')
          .eq('company_id', companyId)
          .eq('validation_status', 'pending')
          .order('uploaded_at', { ascending: true });

        if (altError) {
          return { receipts: [], error: handleSupabaseError(altError) };
        }

        return { receipts: altData || [], error: null };
      }
      return { receipts: [], error: handleSupabaseError(error) };
    }

    return { receipts: data || [], error: null };
  } catch (error) {
    console.error('Error in getPendingReceiptsForCompany:', error);
    return { receipts: [], error: 'Error al obtener comprobantes pendientes.' };
  }
};

/**
 * Obtiene comprobantes de pago para un pago específico
 * @param {string} paymentId - ID del pago
 * @returns {Promise<{receipts, error}>}
 */
export const getPaymentReceipts = async (paymentId) => {
  try {
    const { data, error } = await supabase
      .from('payment_receipts')
      .select('*')
      .eq('payment_id', paymentId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      return { receipts: [], error: handleSupabaseError(error) };
    }

    return { receipts: data || [], error: null };
  } catch (error) {
    console.error('Error in getPaymentReceipts:', error);
    return { receipts: [], error: 'Error al obtener comprobantes de pago.' };
  }
};

/**
 * Crea un comprobante de pago
 * @param {Object} receiptData - Datos del comprobante
 * @returns {Promise<{receipt, error}>}
 */
export const createPaymentReceipt = async (receiptData) => {
  try {
    const { data, error } = await supabase
      .from('payment_receipts')
      .insert(receiptData)
      .select()
      .single();

    if (error) {
      return { receipt: null, error: handleSupabaseError(error) };
    }

    return { receipt: data, error: null };
  } catch (error) {
    console.error('Error in createPaymentReceipt:', error);
    return { receipt: null, error: 'Error al crear comprobante de pago.' };
  }
};

/**
 * Actualiza el estado de validación de un comprobante
 * @param {string} receiptId - ID del comprobante
 * @param {Object} validationData - Datos de validación
 * @returns {Promise<{error}>}
 */
export const updatePaymentReceiptValidation = async (receiptId, validationData) => {
  try {
    const { error } = await supabase
      .from('payment_receipts')
      .update({
        validation_status: validationData.status,
        validated_at: new Date().toISOString(),
        validated_by: validationData.validatedBy,
        validation_notes: validationData.notes,
      })
      .eq('id', receiptId);

    if (error) {
      return { error: handleSupabaseError(error) };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in updatePaymentReceiptValidation:', error);
    return { error: 'Error al actualizar validación del comprobante.' };
  }
};

/**
 * Crea una nueva empresa
 * @param {Object} companyData - Datos de la empresa
 * @returns {Promise<{company, error}>}
 */
export const createCompany = async (companyData) => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .insert(companyData)
      .select()
      .single();

    if (error) {
      return { company: null, error: handleSupabaseError(error) };
    }

    // AUTOMATIZACIÓN: Registrar como beneficiario en MP si tiene datos bancarios
    if (data && data.bank_account_info) {
      try {
        const registerResult = await registerCompanyBeneficiary({
          companyId: data.id,
          businessName: data.business_name,
          bankAccountInfo: data.bank_account_info,
        });

        if (registerResult.success) {
          console.log(`✅ Empresa ${data.business_name} registrada como beneficiario en MP`);
        } else {
          console.warn(`⚠️ No se pudo registrar beneficiario para ${data.business_name}: ${registerResult.error}`);
        }
      } catch (registerError) {
        console.error('Error registering company beneficiary:', registerError);
        // No fallar la creación de empresa por esto
      }
    }

    return { company: data, error: null };
  } catch (error) {
    console.error('Error in createCompany:', error);
    return { company: null, error: 'Error al crear empresa.' };
  }
};

// ==================== CLIENTES ====================

/**
 * Obtiene todos los clientes de una empresa de cobranza
 * @param {string} companyId - ID de la empresa de cobranza
 * @returns {Promise<{clients, error}>}
 */
export const getCompanyClients = async (companyId) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      return { clients: [], error: handleSupabaseError(error) };
    }

    return { clients: data || [], error: null };
  } catch (error) {
    console.error('Error in getCompanyClients:', error);
    return { clients: [], error: 'Error al obtener clientes de la empresa.' };
  }
};

/**
 * Obtiene un cliente específico
 * @param {string} clientId - ID del cliente
 * @returns {Promise<{client, error}>}
 */
export const getClientById = async (clientId) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .maybeSingle();

    if (error) {
      return { client: null, error: handleSupabaseError(error) };
    }

    return { client: data, error: null };
  } catch (error) {
    console.error('Error in getClientById:', error);
    return { client: null, error: 'Error al obtener cliente.' };
  }
};

/**
 * Crea un nuevo cliente para una empresa de cobranza
 * @param {Object} clientData - Datos del cliente
 * @returns {Promise<{client, error}>}
 */
export const createClient = async (clientData) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .insert(clientData)
      .select()
      .single();

    if (error) {
      return { client: null, error: handleSupabaseError(error) };
    }

    return { client: data, error: null };
  } catch (error) {
    console.error('Error in createClient:', error);
    return { client: null, error: 'Error al crear cliente.' };
  }
};

/**
 * Actualiza un cliente
 * @param {string} clientId - ID del cliente
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<{error}>}
 */
export const updateClient = async (clientId, updates) => {
  try {
    const { error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', clientId);

    if (error) {
      return { error: handleSupabaseError(error) };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in updateClient:', error);
    return { error: 'Error al actualizar cliente.' };
  }
};

/**
 * Obtiene todas las deudas de un cliente específico
 * @param {string} clientId - ID del cliente
 * @returns {Promise<{debts, error}>}
 */
export const getClientDebts = async (clientId) => {
  try {
    const { data, error } = await supabase
      .from('debts')
      .select(`
        *,
        user:users(id, full_name, email, rut),
        client:clients(id, business_name, rut)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      return { debts: [], error: handleSupabaseError(error) };
    }

    return { debts: data || [], error: null };
  } catch (error) {
    console.error('Error in getClientDebts:', error);
    return { debts: [], error: 'Error al obtener deudas del cliente.' };
  }
};

/**
 * Obtiene estadísticas de un cliente específico
 * @param {string} clientId - ID del cliente
 * @returns {Promise<{stats, error}>}
 */
export const getClientStats = async (clientId) => {
  try {
    const [debtsResult, agreementsResult, paymentsResult] = await Promise.all([
      getClientDebts(clientId),
      // TODO: Agregar funciones para acuerdos y pagos por cliente
      { agreements: [], error: null },
      { payments: [], error: null },
    ]);

    if (debtsResult.error) {
      return { stats: null, error: debtsResult.error };
    }

    const totalDebtAmount = debtsResult.debts.reduce((sum, debt) => sum + parseFloat(debt.current_amount), 0);
    const totalRecovered = 0; // TODO: Calcular desde pagos

    const stats = {
      totalDebtors: new Set(debtsResult.debts.map(d => d.user_id)).size,
      totalDebts: debtsResult.debts.length,
      totalDebtAmount,
      totalRecovered,
      recoveryRate: totalDebtAmount > 0 ? (totalRecovered / totalDebtAmount) * 100 : 0,
    };

    return { stats, error: null };
  } catch (error) {
    console.error('Error in getClientStats:', error);
    return { stats: null, error: 'Error al obtener estadísticas del cliente.' };
  }
};

// ==================== ESTADÍSTICAS DE PAGOS PARA ADMIN ====================

/**
 * Obtiene estadísticas generales de pagos para el dashboard administrativo
 * @returns {Promise<{stats, error}>}
 */
export const getPaymentStats = async () => {
  try {
    console.log('🔍 getPaymentStats: Starting payment stats calculation');

    // PRIMERO: Verificar directamente si hay pagos completados
    const { data: completedPayments, error: checkError } = await supabase
      .from('payments')
      .select('id, status, amount')
      .eq('status', 'completed');

    if (checkError) {
      console.error('❌ Error checking completed payments:', checkError);
    } else {
      console.log('📊 Found completed payments:', completedPayments?.length || 0);
      if (completedPayments && completedPayments.length > 0) {
        console.log('📋 Completed payments details:', completedPayments);
      }
    }

    // Obtener estadísticas de pagos en paralelo
    const [
      { count: totalPayments, error: totalError },
      { data: amountData, error: amountError },
      { data: statusData, error: statusError },
      { data: avgData, error: avgError }
    ] = await Promise.all([
      // Total de pagos completados
      supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      // Monto total de pagos completados
      supabase.from('payments').select('amount').eq('status', 'completed'),
      // Conteo por estado (solo para otros cálculos)
      supabase.from('payments').select('status'),
      // Promedio de pagos completados
      supabase.from('payments').select('amount').eq('status', 'completed')
    ]);

    console.log('🔢 Query results:', {
      totalPaymentsCount: totalPayments,
      amountDataLength: amountData?.length || 0,
      statusDataLength: statusData?.length || 0,
      avgDataLength: avgData?.length || 0
    });

    if (totalError || amountError || statusError || avgError) {
      console.error('❌ Payment stats errors:', { totalError, amountError, statusError, avgError });
      return { stats: null, error: 'Error al obtener estadísticas de pagos.' };
    }

    // Calcular estadísticas
    const totalAmount = amountData?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
    const statusCounts = statusData?.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {}) || {};

    console.log('📈 Status counts:', statusCounts);

    const avgAmount = avgData?.length > 0
      ? avgData.reduce((sum, p) => sum + parseFloat(p.amount), 0) / avgData.length
      : 0;

    const stats = {
      totalPayments: totalPayments || 0, // Ahora cuenta solo pagos completados
      totalAmount,
      pendingPayments: statusCounts['awaiting_validation'] || 0,
      completedPayments: totalPayments || 0, // Mismo valor que totalPayments
      failedPayments: statusCounts['failed'] || 0,
      averagePayment: avgAmount,
    };

    console.log('✅ Payment stats calculated:', stats);
    return { stats, error: null };
  } catch (error) {
    console.error('💥 Error in getPaymentStats:', error);
    return { stats: null, error: 'Error al obtener estadísticas de pagos.' };
  }
};

/**
 * Obtiene los pagos recientes para el dashboard administrativo
 * @param {number} limit - Número máximo de pagos a obtener
 * @returns {Promise<{payments, error}>}
 */
export const getRecentPayments = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        status,
        payment_method,
        transaction_date,
        user:users(id, full_name)
      `)
      .order('transaction_date', { ascending: false })
      .limit(limit);

    if (error) {
      return { payments: [], error: handleSupabaseError(error) };
    }

    // Formatear los datos para el frontend
    const payments = data?.map(payment => ({
      id: payment.id,
      user: payment.user?.full_name || 'Usuario desconocido',
      company: 'Empresa', // Simplificado ya que no tenemos business_name
      amount: parseFloat(payment.amount),
      status: payment.status,
      date: new Date(payment.transaction_date),
      method: payment.payment_method,
    })) || [];

    return { payments, error: null };
  } catch (error) {
    console.error('Error in getRecentPayments:', error);
    return { payments: [], error: 'Error al obtener pagos recientes.' };
  }
};

/**
 * Obtiene los pagos pendientes de aprobación para el dashboard administrativo
 * @returns {Promise<{payments, error}>}
 */
export const getPendingPayments = async () => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        payment_method,
        transaction_date,
        user:users(id, full_name)
      `)
      .eq('status', 'awaiting_validation')
      .order('transaction_date', { ascending: true });

    if (error) {
      return { payments: [], error: handleSupabaseError(error) };
    }

    // Formatear los datos para el frontend
    const payments = data?.map(payment => ({
      id: payment.id,
      debtor: payment.user?.full_name || 'Usuario desconocido',
      company: 'Empresa', // Simplificado ya que no tenemos business_name
      amount: parseFloat(payment.amount),
      debt_reference: 'N/A', // Sin referencia de deuda por ahora
      payment_method: payment.payment_method,
      submitted_date: new Date(payment.transaction_date),
      status: 'pending_approval'
    })) || [];

    return { payments, error: null };
  } catch (error) {
    console.error('Error in getPendingPayments:', error);
    return { payments: [], error: 'Error al obtener pagos pendientes.' };
  }
};

/**
 * Obtiene todos los usuarios del sistema (solo para administradores)
 * @returns {Promise<{users, error}>}
 */
export const getAllUsers = async () => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, rut, role, validation_status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return { users: null, error: handleSupabaseError(error) };
    }

    return { users, error: null };
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return { users: null, error: 'Error al obtener usuarios.' };
  }
};

/**
 * Obtiene métricas de analytics para administradores
 * @returns {Promise<{analytics, error}>}
 */
export const getAdminAnalytics = async () => {
  try {
    // PRIMERO: Verificar datos básicos en las tablas
    const [
      { count: totalUsers },
      { count: totalCompanies },
      { count: totalPayments },
      { count: totalDebts },
      { count: totalOffers },
      { count: totalAgreements }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('companies').select('*', { count: 'exact', head: true }),
      supabase.from('payments').select('*', { count: 'exact', head: true }),
      supabase.from('debts').select('*', { count: 'exact', head: true }),
      supabase.from('offers').select('*', { count: 'exact', head: true }),
      supabase.from('agreements').select('*', { count: 'exact', head: true })
    ]);

    // Fechas para filtros
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Obtener métricas en paralelo - CONSULTAS ULTRA SIMPLIFICADAS
    const [
      usersResult,
      companiesResult,
      paymentsResult,
      debtsResult,
      offersResult,
      agreementsResult
    ] = await Promise.all([
      // Usuarios - consulta básica
      supabase
        .from('users')
        .select('*')
        .limit(10),

      // Empresas - consulta básica
      supabase
        .from('companies')
        .select('*')
        .limit(10),

      // Pagos - consulta básica
      supabase
        .from('payments')
        .select('*')
        .limit(10),

      // Deudas - consulta básica
      supabase
        .from('debts')
        .select('*')
        .limit(10),

      // Ofertas - consulta básica
      supabase
        .from('offers')
        .select('*')
        .limit(10),

      // Acuerdos - consulta básica
      supabase
        .from('agreements')
        .select('*')
        .limit(10)
    ]);

    if (usersResult.error || companiesResult.error || paymentsResult.error ||
        debtsResult.error || offersResult.error || agreementsResult.error) {
      console.error('Error al obtener métricas de analytics:', {
        users: usersResult.error,
        companies: companiesResult.error,
        payments: paymentsResult.error,
        debts: debtsResult.error,
        offers: offersResult.error,
        agreements: agreementsResult.error
      });
      return {
        analytics: null,
        error: 'Error al obtener métricas de analytics.'
      };
    }

    // Calcular métricas
    const activeUsers = usersResult.data?.length || 0;
    const activeCompanies = companiesResult.data?.length || 0;

    // Calcular total transferido
    const totalTransferred = paymentsResult.data
      ?.filter(p => p.status === 'completed')
      ?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

    // Calcular crecimiento mensual (basado en datos reales)
    const totalUsersAllTime = await supabase.from('users').select('*', { count: 'exact', head: true });
    const totalCompaniesAllTime = await supabase.from('companies').select('*', { count: 'exact', head: true });

    const userGrowth = totalUsersAllTime.count > 0 ? Math.round((activeUsers / totalUsersAllTime.count) * 100) : 0;
    const companyGrowth = totalCompaniesAllTime.count > 0 ? Math.round((activeCompanies / totalCompaniesAllTime.count) * 100) : 0;
    
    // Calcular crecimiento real de pagos comparando período anterior
    const lastMonthPayments = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('transaction_date', last30Days.toISOString())
      .lt('transaction_date', last7Days.toISOString());
    
    const currentMonthPayments = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('transaction_date', last7Days.toISOString());
    
    const paymentGrowth = lastMonthPayments.count > 0
      ? Math.round(((currentMonthPayments.count - lastMonthPayments.count) / lastMonthPayments.count) * 100)
      : (currentMonthPayments.count > 0 ? 100 : 0);

    // Distribución por rol
    const roleDistribution = await supabase
      .from('users')
      .select('role');

    const roleCounts = roleDistribution.data?.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {}) || {};

    // Verificar si hay datos REALMENTE RECIENTES (últimas 2 horas) - evitar datos demo antiguos
    const last2Hours = new Date(now.getTime() - 2 * 60 * 60 * 1000); // Solo últimas 2 horas para transacciones
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 horas para usuarios/empresas

    const hasRecentData = (
      (paymentsResult.data?.filter(p => new Date(p.created_at) >= last2Hours).length || 0) > 0 ||
      (debtsResult.data?.filter(d => new Date(d.created_at) >= last2Hours).length || 0) > 0 ||
      (offersResult.data?.filter(o => new Date(o.created_at) >= last2Hours).length || 0) > 0 ||
      (agreementsResult.data?.filter(a => new Date(a.created_at) >= last2Hours).length || 0) > 0 ||
      (usersResult.data?.filter(u => new Date(u.created_at) >= last24Hours).length || 0) > 0 ||
      (companiesResult.data?.filter(c => new Date(c.created_at) >= last24Hours).length || 0) > 0
    );

    let sortedActivities = [];

    // Si no hay datos recientes, mostrar mensaje informativo
    if (!hasRecentData) {
      sortedActivities = [{
        id: 'no-data',
        type: 'system_info',
        title: 'Sistema inicializado',
        description: 'No hay actividades recientes. El sistema está listo para recibir datos reales.',
        timestamp: new Date(),
        icon: 'Info',
        color: 'gray'
      }];
    } else {
      // Construir actividades recientes reales
      const recentActivities = [];

      // 1. Pagos completados recientes
      const completedPayments = paymentsResult.data
        ?.filter(p => p.status === 'completed')
        ?.slice(0, 3)
        ?.map(payment => ({
          id: `payment-${payment.id}`,
          type: 'payment_completed',
          title: 'Pago completado',
          description: `Pago de $${parseFloat(payment.amount || 0).toLocaleString('es-CL')} procesado exitosamente`,
          timestamp: new Date(payment.transaction_date || payment.created_at || Date.now()),
          icon: 'DollarSign',
          color: 'green'
        })) || [];

      // 2. Pagos pendientes de aprobación
      const pendingPayments = paymentsResult.data
        ?.filter(p => p.status === 'awaiting_validation')
        ?.slice(0, 2)
        ?.map(payment => ({
          id: `pending-${payment.id}`,
          type: 'payment_pending',
          title: 'Pago pendiente de aprobación',
          description: `Pago de $${parseFloat(payment.amount || 0).toLocaleString('es-CL')} esperando validación`,
          timestamp: new Date(payment.transaction_date || payment.created_at || Date.now()),
          icon: 'Clock',
          color: 'yellow'
        })) || [];

      // 3. Deudas creadas recientemente
      const recentDebts = debtsResult.data
        ?.slice(0, 2)
        ?.map(debt => ({
          id: `debt-${debt.id}`,
          type: 'debt_created',
          title: 'Nueva deuda registrada',
          description: `Nueva deuda de $${parseFloat(debt.original_amount || 0).toLocaleString('es-CL')} registrada en el sistema`,
          timestamp: new Date(debt.created_at),
          icon: 'FileText',
          color: 'red'
        })) || [];

      // 4. Ofertas creadas recientemente
      const recentOffers = offersResult.data
        ?.slice(0, 2)
        ?.map(offer => ({
          id: `offer-${offer.id}`,
          type: 'offer_created',
          title: 'Nueva oferta creada',
          description: `"${offer.title || 'Nueva oferta'}" publicada en la plataforma`,
          timestamp: new Date(offer.created_at),
          icon: 'TrendingUp',
          color: 'purple'
        })) || [];

      // 5. Acuerdos firmados recientemente
      const recentAgreements = agreementsResult.data
        ?.slice(0, 2)
        ?.map(agreement => ({
          id: `agreement-${agreement.id}`,
          type: 'agreement_signed',
          title: 'Acuerdo firmado',
          description: `Nuevo acuerdo de $${parseFloat(agreement.total_agreed_amount || 0).toLocaleString('es-CL')} formalizado`,
          timestamp: new Date(agreement.created_at),
          icon: 'CheckCircle',
          color: 'blue'
        })) || [];

      // 6. Usuarios nuevos (últimos 7 días) - usar datos ya obtenidos
      const newUserActivities = usersResult.data
        ?.filter(user => new Date(user.created_at) >= last7Days)
        ?.slice(0, 3)
        ?.map(user => ({
          id: `user-${user.id}`,
          type: 'user_registration',
          title: 'Nuevo usuario registrado',
          description: `${user.full_name || 'Usuario'} se unió a la plataforma`,
          timestamp: new Date(user.created_at),
          icon: 'Users',
          color: 'blue'
        })) || [];

      // 7. Empresas nuevas (últimos 7 días) - usar datos ya obtenidos
      const newCompanyActivities = companiesResult.data
        ?.filter(company => new Date(company.created_at) >= last7Days)
        ?.slice(0, 2)
        ?.map(company => ({
          id: `company-${company.id}`,
          type: 'company_validated',
          title: 'Nueva empresa registrada',
          description: `${company.business_name || 'Empresa'} se registró en la plataforma`,
          timestamp: new Date(company.created_at),
          icon: 'Building',
          color: 'green'
        })) || [];

      // Combinar todas las actividades y ordenar por fecha
      recentActivities.push(
        ...completedPayments,
        ...pendingPayments,
        ...recentDebts,
        ...recentOffers,
        ...recentAgreements,
        ...newUserActivities,
        ...newCompanyActivities
      );

      // Ordenar por timestamp descendente y limitar a 10
      sortedActivities = recentActivities
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);
    }

    const analytics = {
      keyMetrics: {
        activeUsers,
        totalTransferred,
        systemUptime: 99.9, // Se actualizará con datos reales del sistema
        activeCompanies
      },
      growth: {
        userGrowth,
        paymentGrowth,
        companyGrowth
      },
      roleDistribution: roleCounts,
      recentActivity: sortedActivities
    };

    return { analytics, error: null };
  } catch (error) {
    console.error('Error in getAdminAnalytics:', error);
    return { analytics: null, error: 'Error al obtener métricas de analytics.' };
  }
};

/**
 * Obtiene todos los deudores del sistema (solo para administradores)
 * @returns {Promise<{debtors, error}>}
 */
export const getAllDebtors = async () => {
  try {
    const { data: debtors, error } = await supabase
      .from('users')
      .select('id, email, full_name, rut, validation_status, created_at')
      .eq('role', 'debtor')
      .order('created_at', { ascending: false });

    if (error) {
      return { debtors: null, error: handleSupabaseError(error) };
    }

    return { debtors, error: null };
  } catch (error) {
    console.error('Error in getAllDebtors:', error);
    return { debtors: null, error: 'Error al obtener deudores.' };
  }
};

/**
 * Obtiene todas las empresas del sistema (solo para administradores)
 * @returns {Promise<{companies, error}>}
 */
export const getAllCompanies = async () => {
  try {
    const { data: companies, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { companies: null, error: handleSupabaseError(error) };
    }

    return { companies, error: null };
  } catch (error) {
    console.error('Error in getAllCompanies:', error);
    return { companies: null, error: 'Error al obtener empresas.' };
  }
};

/**
 * Obtiene estadísticas reales de comisiones desde la base de datos
 * @returns {Promise<{commissionStats, error}>}
 */
export const getCommissionStats = async () => {
  try {
    console.log('🔍 getCommissionStats: Obteniendo estadísticas reales de comisiones');

    // Obtener todos los pagos completados con información de empresa
    const { data: completedPayments, error: paymentsError } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        user_incentive,
        company_id,
        companies!inner(
          id,
          business_name,
          nexupay_commission,
          nexupay_commission_type,
          user_incentive_percentage,
          user_incentive_type
        )
      `)
      .eq('status', 'completed');

    if (paymentsError) {
      console.error('❌ Error obteniendo pagos completados:', paymentsError);
      return { commissionStats: null, error: handleSupabaseError(paymentsError) };
    }

    console.log('📊 Pagos completados encontrados:', completedPayments?.length || 0);

    // Calcular estadísticas reales
    let totalPaidToNexuPay = 0;
    let totalPaidToUsers = 0;
    let totalCommissions = 0;
    let percentageCompanies = 0;

    if (completedPayments && completedPayments.length > 0) {
      for (const payment of completedPayments) {
        const company = payment.companies;
        const paymentAmount = parseFloat(payment.amount) || 0;

        // Calcular comisión a NexuPay
        let nexupayCommission = 0;
        if (company.nexupay_commission_type === 'percentage') {
          nexupayCommission = paymentAmount * (parseFloat(company.nexupay_commission) || 15) / 100;
          percentageCompanies++;
        } else {
          // Monto fijo por negocio cerrado
          nexupayCommission = parseFloat(company.nexupay_commission) || 0;
        }

        // Calcular incentivo al usuario
        let userIncentive = 0;
        if (company.user_incentive_type === 'percentage') {
          userIncentive = paymentAmount * (parseFloat(company.user_incentive_percentage) || 5) / 100;
        } else {
          // Monto fijo por negocio cerrado
          userIncentive = parseFloat(company.user_incentive_percentage) || 0;
        }

        // Si hay incentivo específico en el pago, usarlo
        if (payment.user_incentive) {
          userIncentive = parseFloat(payment.user_incentive);
        }

        totalPaidToNexuPay += nexupayCommission;
        totalPaidToUsers += userIncentive;
        totalCommissions += nexupayCommission + userIncentive;
      }
    }

    // Calcular comisión promedio (solo para empresas con porcentaje)
    const averageCommissionRate = percentageCompanies > 0
      ? completedPayments.reduce((sum, payment) => {
          const company = payment.companies;
          if (company.nexupay_commission_type === 'percentage') {
            return sum + parseFloat(company.nexupay_commission || 15);
          }
          return sum;
        }, 0) / percentageCompanies
      : 0;

    const commissionStats = {
      totalPaidToNexuPay,
      totalPaidToUsers,
      totalCommissions,
      averageCommissionRate,
      totalClosedBusinesses: completedPayments?.length || 0
    };

    console.log('✅ Estadísticas de comisiones calculadas:', commissionStats);
    return { commissionStats, error: null };
  } catch (error) {
    console.error('💥 Error en getCommissionStats:', error);
    return { commissionStats: null, error: 'Error al obtener estadísticas de comisiones.' };
  }
};

/**
 * Obtiene detalles de comisiones por empresa
 * @param {string} companyId - ID de la empresa
 * @returns {Promise<{companyCommissions, error}>}
 */
export const getCompanyCommissionDetails = async (companyId) => {
  try {
    // Obtener información de la empresa
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError) {
      return { companyCommissions: null, error: handleSupabaseError(companyError) };
    }

    // Obtener pagos completados de la empresa
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('id, amount, user_incentive, transaction_date')
      .eq('company_id', companyId)
      .eq('status', 'completed')
      .order('transaction_date', { ascending: false });

    if (paymentsError) {
      return { companyCommissions: null, error: handleSupabaseError(paymentsError) };
    }

    // Calcular comisiones por cada pago
    const commissionDetails = (payments || []).map(payment => {
      const paymentAmount = parseFloat(payment.amount) || 0;

      // Comisión a NexuPay
      let nexupayCommission = 0;
      if (company.nexupay_commission_type === 'percentage') {
        nexupayCommission = paymentAmount * (parseFloat(company.nexupay_commission) || 15) / 100;
      } else {
        nexupayCommission = parseFloat(company.nexupay_commission) || 0;
      }

      // Incentivo al usuario
      let userIncentive = 0;
      if (company.user_incentive_type === 'percentage') {
        userIncentive = paymentAmount * (parseFloat(company.user_incentive_percentage) || 5) / 100;
      } else {
        userIncentive = parseFloat(company.user_incentive_percentage) || 0;
      }

      // Si hay incentivo específico en el pago, usarlo
      if (payment.user_incentive) {
        userIncentive = parseFloat(payment.user_incentive);
      }

      return {
        paymentId: payment.id,
        paymentAmount,
        nexupayCommission,
        userIncentive,
        totalCommission: nexupayCommission + userIncentive,
        transactionDate: payment.transaction_date
      };
    });

    // Calcular totales
    const totals = commissionDetails.reduce((acc, detail) => ({
      totalPayments: acc.totalPayments + detail.paymentAmount,
      totalNexuPayCommissions: acc.totalNexuPayCommissions + detail.nexupayCommission,
      totalUserIncentives: acc.totalUserIncentives + detail.userIncentive,
      totalCommissions: acc.totalCommissions + detail.totalCommission
    }), {
      totalPayments: 0,
      totalNexuPayCommissions: 0,
      totalUserIncentives: 0,
      totalCommissions: 0
    });

    const companyCommissions = {
      company: {
        id: company.id,
        businessName: company.business_name,
        nexupayCommissionType: company.nexupay_commission_type || 'percentage',
        nexupayCommission: parseFloat(company.nexupay_commission) || 15,
        userIncentiveType: company.user_incentive_type || 'percentage',
        userIncentivePercentage: parseFloat(company.user_incentive_percentage) || 5
      },
      commissionDetails,
      totals,
      closedBusinessesCount: commissionDetails.length
    };

    return { companyCommissions, error: null };
  } catch (error) {
    console.error('Error in getCompanyCommissionDetails:', error);
    return { companyCommissions: null, error: 'Error al obtener detalles de comisiones de la empresa.' };
  }
};

// ==================== GESTIÓN DE CAMPAÑAS ====================

/**
 * Obtiene todas las campañas de una empresa
 * @param {string} companyId - ID de la empresa
 * @returns {Promise<{campaigns, error}>}
 */
export const getCompanyCampaigns = async (companyId) => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      return { campaigns: [], error: handleSupabaseError(error) };
    }

    return { campaigns: data || [], error: null };
  } catch (error) {
    console.error('Error in getCompanyCampaigns:', error);
    return { campaigns: [], error: 'Error al obtener campañas de la empresa.' };
  }
};

/**
 * Crea una nueva campaña
 * @param {Object} campaignData - Datos de la campaña
 * @returns {Promise<{campaign, error}>}
 */
export const createCampaign = async (campaignData) => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .insert(campaignData)
      .select()
      .single();

    if (error) {
      return { campaign: null, error: handleSupabaseError(error) };
    }

    return { campaign: data, error: null };
  } catch (error) {
    console.error('Error in createCampaign:', error);
    return { campaign: null, error: 'Error al crear campaña.' };
  }
};

/**
 * Actualiza una campaña
 * @param {string} campaignId - ID de la campaña
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<{error}>}
 */
export const updateCampaign = async (campaignId, updates) => {
  try {
    const { error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', campaignId);

    if (error) {
      return { error: handleSupabaseError(error) };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in updateCampaign:', error);
    return { error: 'Error al actualizar campaña.' };
  }
};

/**
 * Obtiene reportes de campañas de una empresa
 * @param {string} companyId - ID de la empresa
 * @returns {Promise<{campaignReports, error}>}
 */
export const getCompanyCampaignReports = async (companyId) => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        id,
        title,
        description,
        campaign_type,
        status,
        sent_at,
        total_recipients,
        sent_count,
        delivered_count,
        opened_count,
        clicked_count,
        responded_count,
        converted_count,
        created_at
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      return { campaignReports: [], error: handleSupabaseError(error) };
    }

    // Transformar datos para el formato esperado por el frontend
    const campaignReports = (data || []).map(campaign => ({
      id: campaign.id,
      title: campaign.title,
      clientId: 'general', // Para campañas generales
      clientName: 'Campaña General',
      sentDate: campaign.sent_at,
      status: campaign.status,
      recipients: campaign.total_recipients,
      sent: campaign.sent_count,
      delivered: campaign.delivered_count,
      opened: campaign.opened_count,
      responses: campaign.responded_count,
      conversions: campaign.converted_count
    }));

    return { campaignReports, error: null };
  } catch (error) {
    console.error('Error in getCompanyCampaignReports:', error);
    return { campaignReports: [], error: 'Error al obtener reportes de campañas.' };
  }
};

/**
 * Obtiene estadísticas de campañas de una empresa
 * @param {string} companyId - ID de la empresa
 * @returns {Promise<{campaignStats, error}>}
 */
export const getCompanyCampaignStats = async (companyId) => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('status, sent_count, opened_count, responded_count, converted_count')
      .eq('company_id', companyId);

    if (error) {
      return { campaignStats: null, error: handleSupabaseError(error) };
    }

    const stats = data || [];
    const campaignStats = {
      totalCampaigns: stats.length,
      sentCampaigns: stats.filter(c => c.status === 'sent' || c.status === 'completed').length,
      totalRecipients: stats.reduce((sum, c) => sum + (c.sent_count || 0), 0),
      totalOpened: stats.reduce((sum, c) => sum + (c.opened_count || 0), 0),
      totalResponses: stats.reduce((sum, c) => sum + (c.responded_count || 0), 0),
      totalConversions: stats.reduce((sum, c) => sum + (c.converted_count || 0), 0)
    };

    return { campaignStats, error: null };
  } catch (error) {
    console.error('Error in getCompanyCampaignStats:', error);
    return { campaignStats: null, error: 'Error al obtener estadísticas de campañas.' };
  }
};

/**
 * Crea una nueva campaña unificada
 * @param {Object} campaignData - Datos de la campaña
 * @returns {Promise<{campaign, error}>}
 */
export const createUnifiedCampaign = async (campaignData) => {
  try {
    const { data, error } = await supabase
      .from('unified_campaigns')
      .insert(campaignData)
      .select()
      .single();

    if (error) {
      return { campaign: null, error: handleSupabaseError(error) };
    }

    return { campaign: data, error: null };
  } catch (error) {
    console.error('Error in createUnifiedCampaign:', error);
    return { campaign: null, error: 'Error al crear campaña.' };
  }
};

/**
 * Actualiza una campaña unificada
 * @param {string} campaignId - ID de la campaña
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<{error}>}
 */
export const updateUnifiedCampaign = async (campaignId, updates) => {
  try {
    const { error } = await supabase
      .from('unified_campaigns')
      .update(updates)
      .eq('id', campaignId);

    if (error) {
      return { error: handleSupabaseError(error) };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in updateUnifiedCampaign:', error);
    return { error: 'Error al actualizar campaña.' };
  }
};

/**
 * Obtiene clientes corporativos de una empresa
 * @param {string} companyId - ID de la empresa
 * @returns {Promise<{corporateClients, error}>}
 */
export const getCorporateClients = async (companyId) => {
  try {
    console.log('getCorporateClients called for company:', companyId);

    // Obtener clientes de la tabla 'clients' (todos son corporativos)
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', companyId)
      .order('business_name');

    if (error) {
      console.error('Error fetching corporate clients:', error);
      return { corporateClients: [], error: handleSupabaseError(error) };
    }

    // Transformar los datos para mantener compatibilidad con el formato esperado
    const transformedClients = (data || []).map(client => ({
      id: client.id,
      name: client.business_name || client.name,
      display_category: 'Corporativo',
      contact_email: client.contact_email,
      contact_phone: client.contact_phone,
      is_active: true,
      created_at: client.created_at,
      updated_at: client.updated_at
    }));

    console.log('Corporate clients found:', transformedClients.length);
    return { corporateClients: transformedClients, error: null };
  } catch (error) {
    console.error('Error in getCorporateClients:', error);
    return { corporateClients: [], error: 'Error al obtener clientes corporativos.' };
  }
};

/**
 * Crea un cliente corporativo
 * @param {Object} corporateData - Datos del cliente corporativo
 * @returns {Promise<{corporateClient, error}>}
 */
export const createCorporateClient = async (corporateData) => {
  try {
    const { data, error } = await supabase
      .from('corporate_clients')
      .insert(corporateData)
      .select()
      .single();

    if (error) {
      return { corporateClient: null, error: handleSupabaseError(error) };
    }

    return { corporateClient: data, error: null };
  } catch (error) {
    console.error('Error in createCorporateClient:', error);
    return { corporateClient: null, error: 'Error al crear cliente corporativo.' };
  }
};

/**
 * Obtiene segmentos de un cliente corporativo
 * @param {string} corporateId - ID del cliente corporativo
 * @returns {Promise<{segments, error}>}
 */
export const getCorporateSegments = async (corporateId) => {
  try {
    const { data, error } = await supabase
      .from('corporate_segments')
      .select('*')
      .eq('corporate_id', corporateId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      return { segments: [], error: handleSupabaseError(error) };
    }

    return { segments: data || [], error: null };
  } catch (error) {
    console.error('Error in getCorporateSegments:', error);
    return { segments: [], error: 'Error al obtener segmentos corporativos.' };
  }
};

/**
 * Crea un segmento corporativo
 * @param {Object} segmentData - Datos del segmento
 * @returns {Promise<{segment, error}>}
 */
export const createCorporateSegment = async (segmentData) => {
  try {
    const { data, error } = await supabase
      .from('corporate_segments')
      .insert(segmentData)
      .select()
      .single();

    if (error) {
      return { segment: null, error: handleSupabaseError(error) };
    }

    return { segment: data, error: null };
  } catch (error) {
    console.error('Error in createCorporateSegment:', error);
    return { segment: null, error: 'Error al crear segmento corporativo.' };
  }
};

/**
 * Obtiene resultados de una campaña
 * @param {string} campaignId - ID de la campaña
 * @returns {Promise<{results, error}>}
 */
export const getCampaignResults = async (campaignId) => {
  try {
    const { data, error } = await supabase
      .from('campaign_results')
      .select(`
        *,
        corporate_clients (
          name,
          display_category
        ),
        corporate_segments (
          name
        )
      `)
      .eq('campaign_id', campaignId)
      .order('sent_at', { ascending: false });

    if (error) {
      return { results: [], error: handleSupabaseError(error) };
    }

    return { results: data || [], error: null };
  } catch (error) {
    console.error('Error in getCampaignResults:', error);
    return { results: [], error: 'Error al obtener resultados de campaña.' };
  }
};

/**
 * Obtiene mensajes seguros de una campaña
 * @param {string} campaignId - ID de la campaña
 * @returns {Promise<{messages, error}>}
 */
export const getCampaignSecureMessages = async (campaignId) => {
  try {
    const { data, error } = await supabase
      .from('secure_messages')
      .select(`
        *,
        corporate_clients (
          name
        )
      `)
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (error) {
      return { messages: [], error: handleSupabaseError(error) };
    }

    return { messages: data || [], error: null };
  } catch (error) {
    console.error('Error in getCampaignSecureMessages:', error);
    return { messages: [], error: 'Error al obtener mensajes seguros de campaña.' };
  }
};

/**
 * Obtiene mensajes seguros de un deudor
 * @param {string} debtorId - ID del deudor
 * @returns {Promise<{messages, error}>}
 */
export const getDebtorSecureMessages = async (debtorId) => {
  try {
    const { data, error } = await supabase
      .from('secure_messages')
      .select(`
        *,
        unified_campaigns (
          name,
          company_id
        ),
        companies (
          business_name
        )
      `)
      .eq('debtor_id', debtorId)
      .order('created_at', { ascending: false });

    if (error) {
      return { messages: [], error: handleSupabaseError(error) };
    }

    return { messages: data || [], error: null };
  } catch (error) {
    console.error('Error in getDebtorSecureMessages:', error);
    return { messages: [], error: 'Error al obtener mensajes seguros del deudor.' };
  }
};

/**
 * Crea un mensaje seguro
 * @param {Object} messageData - Datos del mensaje
 * @returns {Promise<{message, error}>}
 */
export const createSecureMessage = async (messageData) => {
  try {
    const { data, error } = await supabase
      .from('secure_messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      return { message: null, error: handleSupabaseError(error) };
    }

    return { message: data, error: null };
  } catch (error) {
    console.error('Error in createSecureMessage:', error);
    return { message: null, error: 'Error al crear mensaje seguro.' };
  }
};

/**
 * Valida y obtiene un mensaje seguro por token
 * @param {string} token - Token de acceso
 * @param {string} debtorId - ID del deudor
 * @returns {Promise<{message, error}>}
 */
export const validateSecureMessageToken = async (token, debtorId) => {
  try {
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
      .eq('access_token', token)
      .eq('debtor_id', debtorId)
      .eq('status', 'sent')
      .gt('token_expires_at', new Date().toISOString())
      .single();

    if (error) {
      return { message: null, error: handleSupabaseError(error) };
    }

    return { message: data, error: null };
  } catch (error) {
    console.error('Error in validateSecureMessageToken:', error);
    return { message: null, error: 'Error al validar token de mensaje seguro.' };
  }
};

/**
 * Actualiza el estado de un mensaje seguro
 * @param {string} messageId - ID del mensaje
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<{error}>}
 */
export const updateSecureMessage = async (messageId, updates) => {
  try {
    const { error } = await supabase
      .from('secure_messages')
      .update(updates)
      .eq('id', messageId);

    if (error) {
      return { error: handleSupabaseError(error) };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in updateSecureMessage:', error);
    return { error: 'Error al actualizar mensaje seguro.' };
  }
};

// ==================== GESTIÓN DE MENSAJES ====================

/**
 * Obtiene los mensajes enviados por una empresa
 * @param {string} companyId - ID de la empresa
 * @returns {Promise<{messages, error}>}
 */
export const getCompanyMessages = async (companyId) => {
  try {
    console.log('getCompanyMessages called for company:', companyId);

    // First get conversations for this company (simple query without nested joins)
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, user_id, company_id')
      .eq('company_id', companyId);

    if (convError) {
      console.error('Error fetching conversations:', convError);
      return { messages: [], error: handleSupabaseError(convError) };
    }

    if (!conversations || conversations.length === 0) {
      return { messages: [], error: null };
    }

    const conversationIds = conversations.map(c => c.id);
    const userIds = [...new Set(conversations.map(c => c.user_id))];

    // Get user data separately
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return { messages: [], error: handleSupabaseError(usersError) };
    }

    // Get company data
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, business_name')
      .eq('id', companyId)
      .single();

    if (companyError) {
      console.error('Error fetching company:', companyError);
      return { messages: [], error: handleSupabaseError(companyError) };
    }

    // Then get messages for these conversations
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .in('conversation_id', conversationIds)
      .order('sent_at', { ascending: false });

    if (msgError) {
      console.error('Error fetching messages:', msgError);
      return { messages: [], error: handleSupabaseError(msgError) };
    }

    // Create maps for quick lookup
    const userMap = users?.reduce((map, user) => {
      map[user.id] = user;
      return map;
    }, {}) || {};

    const conversationMap = conversations.reduce((map, conv) => {
      map[conv.id] = {
        ...conv,
        user: userMap[conv.user_id],
        company: company
      };
      return map;
    }, {});

    // Transform the data to match the expected format for the frontend
    const transformedMessages = (messages || []).map(message => {
      const conversation = conversationMap[message.conversation_id];
      return {
        id: message.id,
        conversationId: message.conversation_id,
        debtorId: conversation?.user?.id,
        debtorName: conversation?.user?.full_name || 'Usuario desconocido',
        companyName: conversation?.company?.business_name || 'Empresa',
        senderType: message.sender_type,
        content: message.content,
        attachments: message.attachments || [],
        sentAt: message.sent_at,
        readAt: message.read_at,
        status: message.status,
        // Legacy fields for backward compatibility
        subject: message.content?.substring(0, 50) + (message.content?.length > 50 ? '...' : ''),
        message: message.content,
        priority: 'normal' // Default priority
      };
    });

    return { messages: transformedMessages, error: null };
  } catch (error) {
    console.error('Error in getCompanyMessages:', error);
    return { messages: [], error: 'Error al obtener mensajes de la empresa.' };
  }
};

/**
 * Envía un mensaje a un deudor
 * @param {Object} messageData - Datos del mensaje
 * @returns {Promise<{message, error}>}
 */
export const sendMessage = async (messageData) => {
  try {
    // First, find or create a conversation between the company and debtor
    let conversationId;

    // Try to find existing conversation
    const { data: existingConversation, error: findError } = await supabase
      .from('conversations')
      .select('id')
      .eq('company_id', messageData.companyId)
      .eq('user_id', messageData.debtorId)
      .maybeSingle();

    if (findError && findError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error finding conversation:', findError);
      return { message: null, error: handleSupabaseError(findError) };
    }

    if (existingConversation) {
      conversationId = existingConversation.id;
    } else {
      // Create new conversation
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          company_id: messageData.companyId,
          user_id: messageData.debtorId,
          status: 'active'
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating conversation:', createError);
        return { message: null, error: handleSupabaseError(createError) };
      }

      conversationId = newConversation.id;
    }

    // Now insert the message
    const messagePayload = {
      conversation_id: conversationId,
      sender_type: 'company',
      sender_id: messageData.sentBy,
      content: messageData.message,
      attachments: [],
      status: 'sent'
    };

    const { data, error } = await supabase
      .from('messages')
      .insert(messagePayload)
      .select(`
        *,
        conversation:conversations(
          user:users(id, full_name, email),
          company:companies(id, business_name)
        )
      `)
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return { message: null, error: handleSupabaseError(error) };
    }

    // Transform the response to match expected format
    const transformedMessage = {
      id: data.id,
      conversationId: data.conversation_id,
      debtorId: data.conversation?.user?.id,
      debtorName: data.conversation?.user?.full_name || 'Usuario desconocido',
      companyName: data.conversation?.company?.business_name || 'Empresa',
      senderType: data.sender_type,
      content: data.content,
      attachments: data.attachments || [],
      sentAt: data.sent_at,
      readAt: data.read_at,
      status: data.status,
      // Legacy fields for backward compatibility
      subject: messageData.subject || data.content?.substring(0, 50) + (data.content?.length > 50 ? '...' : ''),
      message: data.content,
      priority: messageData.priority || 'normal'
    };

    // Crear notificación para el deudor
    try {
      await createNotification({
        user_id: messageData.debtorId,
        type: 'message',
        title: messageData.subject || 'Nuevo mensaje',
        message: `Has recibido un mensaje de tu empresa de cobranza`,
        data: { messageId: data.id, conversationId: conversationId }
      });
    } catch (notificationError) {
      console.warn('Error creating notification for message:', notificationError);
      // No fallar el envío del mensaje por esto
    }

    return { message: transformedMessage, error: null };
  } catch (error) {
    console.error('Error in sendMessage:', error);
    return { message: null, error: 'Error al enviar mensaje.' };
  }
};

// ==================== GESTIÓN DE ANALYTICS AVANZADOS ====================

/**
 * Obtiene métricas de analytics avanzadas para una empresa
 * @param {string} companyId - ID de la empresa
 * @returns {Promise<{analytics, error}>}
 */
export const getCompanyAdvancedAnalytics = async (companyId) => {
  try {
    console.log('getCompanyAdvancedAnalytics called for company:', companyId);

    // Obtener métricas calculadas de la tabla analytics_metrics (si existe)
    let metricsData = null;
    try {
      const { data, error } = await supabase
        .from('analytics_metrics')
        .select('*')
        .eq('company_id', companyId)
        .order('period_end', { ascending: false })
        .limit(50);

      if (!error) {
        metricsData = data;
      }
    } catch (error) {
      // Tabla no existe, continuar sin métricas calculadas
      console.warn('Tabla analytics_metrics no disponible, usando métricas calculadas en tiempo real');
    }

    // Obtener datos básicos para cálculos en tiempo real
    const [debtsResult, paymentsResult, agreementsResult, clientsResult, campaignsResult] = await Promise.all([
      supabase
        .from('debts')
        .select('current_amount, created_at, status')
        .eq('company_id', companyId),

      supabase
        .from('payments')
        .select('amount, transaction_date, status')
        .eq('company_id', companyId)
        .eq('status', 'completed'),

      supabase
        .from('agreements')
        .select('id, created_at, status')
        .eq('company_id', companyId),

      supabase
        .from('clients')
        .select('id')
        .eq('company_id', companyId),

      supabase
        .from('campaigns')
        .select('id, sent_count, opened_count, responded_count, converted_count, status')
        .eq('company_id', companyId)
    ]);

    if (debtsResult.error || paymentsResult.error || agreementsResult.error || clientsResult.error) {
      return { analytics: null, error: 'Error al obtener datos de analytics avanzados.' };
    }

    // Calcular métricas básicas
    const totalRevenue = paymentsResult.data?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0;
    const totalClients = clientsResult.data?.length || 0;
    const totalDebtors = new Set(debtsResult.data?.map(d => d.user_id)).size;
    const totalDebts = debtsResult.data?.length || 0;
    const totalDebtAmount = debtsResult.data?.reduce((sum, debt) => sum + parseFloat(debt.current_amount), 0) || 0;
    const totalAgreements = agreementsResult.data?.length || 0;

    // Calcular métricas de campañas (si la tabla existe)
    let campaignStats = { totalCampaigns: 0, totalSent: 0, totalOpened: 0, totalResponses: 0, totalConversions: 0 };
    try {
      if (campaignsResult.data) {
        campaignStats = campaignsResult.data.reduce((acc, campaign) => ({
          totalCampaigns: acc.totalCampaigns + 1,
          totalSent: acc.totalSent + (campaign.sent_count || 0),
          totalOpened: acc.totalOpened + (campaign.opened_count || 0),
          totalResponses: acc.totalResponses + (campaign.responded_count || 0),
          totalConversions: acc.totalConversions + (campaign.converted_count || 0)
        }), { totalCampaigns: 0, totalSent: 0, totalOpened: 0, totalResponses: 0, totalConversions: 0 });
      }
    } catch (error) {
      console.warn('Error calculando estadísticas de campañas:', error);
    }

    // Calcular métricas de IA (de la tabla ai_interventions si existe)
    let aiStats = { totalInterventions: 0, effectiveInterventions: 0, conversionsFromAI: 0 };
    try {
      const { data: aiData, error: aiError } = await supabase
        .from('ai_interventions')
        .select('intervention_type, effectiveness_score, conversion_result')
        .eq('company_id', companyId);

      if (!aiError && aiData) {
        aiStats = aiData.reduce((acc, intervention) => ({
          totalInterventions: acc.totalInterventions + 1,
          effectiveInterventions: acc.effectiveInterventions + (intervention.effectiveness_score >= 7 ? 1 : 0),
          conversionsFromAI: acc.conversionsFromAI + (intervention.conversion_result !== 'none' ? 1 : 0)
        }), { totalInterventions: 0, effectiveInterventions: 0, conversionsFromAI: 0 });
      }
    } catch (error) {
      console.warn('Tabla ai_interventions no disponible, usando métricas de IA simuladas');
    }

    // Calcular tendencias mensuales (últimos 6 meses)
    const monthlyTrend = [];
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push({
        name: date.toLocaleDateString('es-ES', { month: 'short' }),
        month: date.getMonth(),
        year: date.getFullYear()
      });
    }

    months.forEach(({ name, month, year }) => {
      const monthPayments = paymentsResult.data?.filter(payment => {
        const paymentDate = new Date(payment.transaction_date);
        return paymentDate.getMonth() === month && paymentDate.getFullYear() === year;
      }) || [];

      const monthRevenue = monthPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
      const monthRecovery = totalDebtAmount > 0
        ? (monthRevenue / totalDebtAmount) * 100
        : 0;

      monthlyTrend.push({
        month: name,
        revenue: monthRevenue,
        recovery: Math.min(monthRecovery, 100),
        payments: monthPayments.length
      });
    });

    // Calcular crecimiento mensual
    const currentMonthRevenue = monthlyTrend[5]?.revenue || 0;
    const lastMonthRevenue = monthlyTrend[4]?.revenue || 0;
    const monthlyGrowth = lastMonthRevenue > 0
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : (currentMonthRevenue > 0 ? 100 : 0);

    const analytics = {
      // Métricas básicas
      totalRevenue,
      totalClients,
      totalDebtors,
      totalDebts,
      totalDebtAmount,
      recoveryRate: totalDebtAmount > 0 ? (totalRevenue / totalDebtAmount) * 100 : 0,
      averagePayment: paymentsResult.data?.length > 0 ? totalRevenue / paymentsResult.data.length : 0,

      // Métricas de campañas
      campaignStats,

      // Métricas de IA
      aiStats,

      // Tendencias
      monthlyTrend,
      monthlyGrowth,

      // Eficiencia y tiempos
      efficiencyRate: paymentsResult.data?.length > 0 ? 100 : 0, // Todos los pagos mostrados son completados
      avgProcessingTime: 7, // Días promedio (estimado)

      // Métricas calculadas desde tabla
      calculatedMetrics: metricsData || []
    };

    return { analytics, error: null };
  } catch (error) {
    console.error('Error in getCompanyAdvancedAnalytics:', error);
    return { analytics: null, error: 'Error al obtener métricas de analytics avanzados.' };
  }
};

/**
 * Obtiene métricas adicionales de empresa basadas en datos históricos
 * @param {string} companyId - ID de la empresa
 * @returns {Promise<{additionalMetrics, error}>}
 */
export const getCompanyAdditionalMetrics = async (companyId) => {
  try {
    console.log('getCompanyAdditionalMetrics called for company:', companyId);

    // Obtener pagos completados para calcular tiempo promedio de recuperación
    // Primero obtener pagos de la empresa
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        transaction_date,
        created_at
      `)
      .eq('company_id', companyId)
      .eq('status', 'completed')
      .order('transaction_date', { ascending: false });

    // Para el cálculo de tiempo de recuperación, usaremos datos simulados ya que
    // la relación payments->debts no está disponible en el esquema actual
    let paymentsWithDebts = payments;
    if (payments && payments.length > 0) {
      // Simular datos de deuda para cálculos (sin consultas reales)
      paymentsWithDebts = payments.map(payment => ({
        ...payment,
        debts: {
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días atrás
          original_amount: parseFloat(payment.amount) * 1.5 // Simular monto original mayor
        }
      }));
    }

    if (paymentsError) {
      console.error('Error fetching payments for additional metrics:', paymentsError);
    }

    // Calcular tiempo promedio de recuperación
    let avgRecoveryTime = 45; // valor por defecto
    if (paymentsWithDebts && paymentsWithDebts.length > 0) {
      const recoveryTimes = paymentsWithDebts
        .filter(payment => payment.debts?.created_at && payment.transaction_date)
        .map(payment => {
          const debtCreated = new Date(payment.debts.created_at);
          const paymentDate = new Date(payment.transaction_date);
          const diffTime = Math.abs(paymentDate - debtCreated);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays;
        })
        .filter(days => days > 0 && days < 365); // Filtrar valores razonables

      if (recoveryTimes.length > 0) {
        avgRecoveryTime = recoveryTimes.reduce((sum, time) => sum + time, 0) / recoveryTimes.length;
      }
    }

    // Calcular mejor mes basado en ingresos por mes
    const monthlyRevenue = {};
    if (paymentsWithDebts && paymentsWithDebts.length > 0) {
      paymentsWithDebts.forEach(payment => {
        if (payment.transaction_date) {
          const date = new Date(payment.transaction_date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + parseFloat(payment.amount || 0);
        }
      });
    }

    // Encontrar el mes con mayor ingresos
    let bestMonth = null;
    let bestMonthRevenue = 0;
    Object.entries(monthlyRevenue).forEach(([month, revenue]) => {
      if (revenue > bestMonthRevenue) {
        bestMonthRevenue = revenue;
        bestMonth = month;
      }
    });

    // Formatear mejor mes para display
    let formattedBestMonth = 'Sin datos';
    if (bestMonth) {
      const [year, month] = bestMonth.split('-');
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      formattedBestMonth = `${monthNames[parseInt(month) - 1]} ${year}`;
    }

    const additionalMetrics = {
      avgRecoveryTime: Math.round(avgRecoveryTime),
      bestMonth: formattedBestMonth,
      monthlyRevenue: monthlyRevenue
    };

    console.log('Additional metrics calculated:', additionalMetrics);
    return { additionalMetrics, error: null };
  } catch (error) {
    console.error('Error in getCompanyAdditionalMetrics:', error);
    return {
      additionalMetrics: {
        avgRecoveryTime: 45,
        bestMonth: 'Sin datos',
        monthlyRevenue: {}
      },
      error: 'Error al obtener métricas adicionales.'
    };
  }
};

/**
 * Obtiene métricas de analytics para una empresa (versión simplificada para compatibilidad)
 * @param {string} companyId - ID de la empresa
 * @returns {Promise<{analytics, error}>}
 */
export const getCompanyAnalytics = async (companyId) => {
  try {
    const { analytics, error } = await getCompanyAdvancedAnalytics(companyId);

    if (error) return { analytics: null, error };

    // Obtener métricas adicionales
    const { additionalMetrics } = await getCompanyAdditionalMetrics(companyId);

    // Transformar para mantener compatibilidad con la versión anterior
    const simplifiedAnalytics = {
      totalRevenue: analytics.totalRevenue,
      totalClients: analytics.totalClients,
      totalDebtors: analytics.totalDebtors,
      recoveryRate: analytics.recoveryRate,
      averagePayment: analytics.averagePayment,
      monthlyGrowth: analytics.monthlyGrowth,
      efficiencyRate: analytics.efficiencyRate,
      avgProcessingTime: analytics.avgProcessingTime,
      avgRecoveryTime: additionalMetrics.avgRecoveryTime,
      bestMonth: additionalMetrics.bestMonth,
      topPerformingClients: [], // Se puede calcular si es necesario
      monthlyTrend: analytics.monthlyTrend
    };

    return { analytics: simplifiedAnalytics, error: null };
  } catch (error) {
    console.error('Error in getCompanyAnalytics:', error);
    return { analytics: null, error: 'Error al obtener métricas de analytics.' };
  }
};

// ==================== FUNCIONES PARA GESTIÓN DE BASE DE DATOS ====================

/**
 * Obtiene estadísticas de tablas de la base de datos
 * @returns {Promise<{tableStats, error}>}
 */
export const getDatabaseTableStats = async () => {
  try {
    const tables = [
      'users',
      'companies',
      'debts',
      'offers',
      'agreements',
      'payments',
      'notifications',
      'payment_receipts',
      'wallet_transactions',
      'conversations',
      'messages',
      'consents',
      'wallets',
      'payment_preferences',
      'transactions',
      'payment_history'
    ];

    const tableStats = [];

    for (const tableName of tables) {
      try {
        // Obtener conteo de registros
        const { count, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (countError) {
          console.warn(`Error getting count for table ${tableName}:`, countError);
          continue;
        }

        // Determinar estado basado en el conteo (lógica simple)
        let status = 'healthy';
        if (count > 10000) status = 'warning'; // Tabla muy grande
        if (count > 50000) status = 'danger'; // Tabla extremadamente grande

        tableStats.push({
          name: tableName,
          records: count || 0,
          size: 'N/A', // Supabase no proporciona tamaño de tabla fácilmente
          status: status
        });
      } catch (tableError) {
        console.warn(`Error processing table ${tableName}:`, tableError);
        // Continuar con la siguiente tabla
      }
    }

    return { tableStats, error: null };
  } catch (error) {
    console.error('Error in getDatabaseTableStats:', error);
    return { tableStats: [], error: 'Error al obtener estadísticas de tablas.' };
  }
};

/**
 * Obtiene estadísticas generales de la base de datos
 * @returns {Promise<{dbStats, error}>}
 */
export const getDatabaseStats = async () => {
  try {
    // Obtener estadísticas básicas usando consultas SQL
    const [
      { count: totalUsers, error: usersError },
      { count: totalCompanies, error: companiesError },
      { count: totalDebts, error: debtsError },
      { count: totalPayments, error: paymentsError }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('companies').select('*', { count: 'exact', head: true }),
      supabase.from('debts').select('*', { count: 'exact', head: true }),
      supabase.from('payments').select('*', { count: 'exact', head: true })
    ]);

    if (usersError || companiesError || debtsError || paymentsError) {
      return { dbStats: null, error: 'Error al obtener estadísticas de la base de datos.' };
    }

    // Calcular estadísticas simuladas para métricas que no podemos obtener directamente
    const dbStats = {
      availability: 99.9, // Simulado - en producción usar health checks
      storageUsed: Math.round((totalUsers * 0.5 + totalDebts * 2.5 + totalPayments * 1.8) / 1024 * 100) / 100, // GB aproximado
      avgLatency: 1.2, // ms simulado
      activeTables: 15, // Conteo fijo basado en esquema conocido
      totalUsers: totalUsers || 0,
      totalCompanies: totalCompanies || 0,
      totalDebts: totalDebts || 0,
      totalPayments: totalPayments || 0
    };

    return { dbStats, error: null };
  } catch (error) {
    console.error('Error in getDatabaseStats:', error);
    return { dbStats: null, error: 'Error al obtener estadísticas de la base de datos.' };
  }
};

/**
 * Obtiene información de migraciones y estado del sistema
 * @returns {Promise<{systemInfo, error}>}
 */
export const getDatabaseSystemInfo = async () => {
  try {
    // Obtener información real de conexiones activas desde pg_stat_activity
    let activeConnections = Math.floor(Math.random() * 30) + 5; // Fallback por defecto

    try {
      const { data: connectionData, error: connectionError } = await supabase
        .rpc('get_active_connections');

      if (!connectionError && connectionData) {
        activeConnections = connectionData;
      }
    } catch (rpcError) {
      // RPC no existe, usar valor por defecto
      console.warn('RPC get_active_connections not available, using fallback');
    }

    // Información de migraciones por defecto (ya que la tabla no existe)
    let lastMigration = {
      name: 'Sistema inicializado',
      status: 'success',
      executedAt: new Date().toISOString()
    };

    try {
      const { data: migrationData, error: migrationError } = await supabase
        .from('schema_migrations')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(1)
        .single();

      if (!migrationError && migrationData) {
        lastMigration = {
          name: migrationData.migration_name || migrationData.name,
          status: migrationData.status || 'success',
          executedAt: migrationData.executed_at
        };
      }
    } catch (tableError) {
      // Tabla no existe, usar valor por defecto
      console.warn('Table schema_migrations not available, using fallback');
    }

    // Estado de RLS por defecto
    let rlsStatus = 'enabled';

    try {
      const { data: rlsData, error: rlsError } = await supabase
        .rpc('check_rls_status');

      if (!rlsError && rlsData) {
        rlsStatus = 'enabled';
      }
    } catch (rpcError) {
      // RPC no existe, usar valor por defecto
      console.warn('RPC check_rls_status not available, using fallback');
    }

    // Información del sistema
    const systemInfo = {
      lastMigration,
      rlsStatus,
      activeConnections,
      serverStatus: 'healthy'
    };

    return { systemInfo, error: null };
  } catch (error) {
    console.error('Error in getDatabaseSystemInfo:', error);
    return { systemInfo: null, error: 'Error al obtener información del sistema.' };
  }
};

/**
 * Obtiene configuración del sistema desde la base de datos
 * @returns {Promise<{config, error}>}
 */
export const getSystemConfig = async () => {
  try {
    // Obtener configuración desde tabla system_config si existe
    const { data: configData, error: configError } = await supabase
      .from('system_config')
      .select('*')
      .order('updated_at', { ascending: false });

    let config = {};

    if (!configError && configData && configData.length > 0) {
      // Convertir array de configuraciones en objeto
      configData.forEach(item => {
        config[item.config_key] = item.config_value;
      });
    } else {
      // Configuración por defecto si no existe tabla
      config = {
        oauth_enabled: true,
        user_validation_enabled: true,
        email_notifications_enabled: true,
        push_notifications_enabled: false,
        mercado_pago_enabled: true,
        query_limit_per_minute: 1000,
        backup_frequency: 'daily',
        log_retention_days: 30,
        system_maintenance_mode: false
      };
    }

    // Convertir valores string a booleanos donde corresponda
    const processedConfig = {
      oauthEnabled: config.oauth_enabled !== undefined ? config.oauth_enabled === 'true' : true,
      userValidation: config.user_validation_enabled !== undefined ? config.user_validation_enabled === 'true' : true,
      emailNotifications: config.email_notifications_enabled !== undefined ? config.email_notifications_enabled === 'true' : true,
      pushNotifications: config.push_notifications_enabled !== undefined ? config.push_notifications_enabled === 'true' : false,
      mercadoPagoEnabled: config.mercado_pago_enabled !== undefined ? config.mercado_pago_enabled === 'true' : true,
      queryLimit: parseInt(config.query_limit_per_minute) || 1000,
      backupFrequency: config.backup_frequency || 'daily',
      logRetention: parseInt(config.log_retention_days) || 30,
      maintenanceMode: config.system_maintenance_mode !== undefined ? config.system_maintenance_mode === 'true' : false,
      monthlyPaymentGoal: parseInt(config.monthly_payment_goal) || 50000000,
      // Configuración de IA
      chutesApiKey: config.chutes_api_key || '',
      chutesApiActive: config.chutes_api_active !== undefined ? config.chutes_api_active === 'true' : false,
      groqApiKey: config.groq_api_key || '',
      groqApiActive: config.groq_api_active !== undefined ? config.groq_api_active === 'true' : false,
      aiSelectedProvider: config.ai_selected_provider || 'chutes',
      aiSelectedModel: config.ai_selected_model || '',
    };

    return { config: processedConfig, error: null };
  } catch (error) {
    console.error('Error in getSystemConfig:', error);
    return {
      config: {
        oauthEnabled: true,
        userValidation: true,
        emailNotifications: true,
        pushNotifications: false,
        mercadoPagoEnabled: true,
        queryLimit: 1000,
        backupFrequency: 'daily',
        logRetention: 30,
        maintenanceMode: false
      },
      error: 'Error al obtener configuración del sistema.'
    };
  }
};

/**
 * Actualiza configuración del sistema en la base de datos
 * @param {Object} config - Configuración a actualizar
 * @returns {Promise<{error}>}
 */
export const updateSystemConfig = async (config) => {
  console.log('🔄 updateSystemConfig called with:', config);

  try {
    // Procesar cada configuración individualmente para asegurar que se guarde
    for (const [key, value] of Object.entries(config)) {
      console.log(`📝 Processing config: ${key} = ${value} (type: ${typeof value})`);

      const configEntry = {
        config_key: key,
        config_value: value,
        updated_at: new Date().toISOString()
      };

      console.log('📤 Attempting insert for:', configEntry);

      // Intentar insertar primero
      const { data: insertData, error: insertError } = await supabase
        .from('system_config')
        .insert(configEntry)
        .select();

      console.log('📥 Insert result:', { data: insertData, error: insertError });

      if (insertError) {
        console.log('❌ Insert failed, checking error code:', insertError.code);

        // Si falla por conflicto (ya existe), intentar actualizar
        if (insertError.code === '23505') { // unique_violation
          console.log('🔄 Attempting update for existing record');

          const { data: updateData, error: updateError } = await supabase
            .from('system_config')
            .update({
              config_value: value,
              updated_at: new Date().toISOString()
            })
            .eq('config_key', key)
            .select();

          console.log('📥 Update result:', { data: updateData, error: updateError });

          if (updateError) {
            console.error(`❌ Error updating config ${key}:`, updateError);
            throw updateError;
          } else {
            console.log(`✅ Successfully updated config ${key}`);
          }
        } else if (insertError.code === '42P01') { // relation does not exist
          console.warn('⚠️ Tabla system_config no existe, configuración no persistente');
          return { error: null }; // No error, solo no se guarda
        } else {
          console.error(`❌ Error inserting config ${key}:`, insertError);
          throw insertError;
        }
      } else {
        console.log(`✅ Successfully inserted config ${key}`);
      }
    }

    console.log('🎉 All configurations processed successfully');
    return { error: null };
  } catch (error) {
    console.error('💥 Error in updateSystemConfig:', error);
    return { error: 'Error al actualizar configuración del sistema.' };
  }
};

/**
 * Obtiene objetivos de pago desde la base de datos
 * @returns {Promise<{goals, error}>}
 */
export const getPaymentGoals = async () => {
  try {
    const { data, error } = await supabase
      .from('payment_goals')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      // Si la tabla no existe (42P01) o no hay filas (PGRST116), devolver valores por defecto
      if (error.code === '42P01' || error.code === 'PGRST116') {
        console.warn('Tabla payment_goals no existe o está vacía, usando valores por defecto');
        return {
          goals: {
            monthlyCommissionGoal: 2500000,
            monthlyNexusPayGoal: 2500000,
          },
          error: null
        };
      }
      return { goals: null, error: handleSupabaseError(error) };
    }

    // Si no hay datos, devolver valores por defecto
    const goals = data ? {
      monthlyCommissionGoal: parseInt(data.monthly_commission_goal) || 2500000,
      monthlyNexusPayGoal: parseInt(data.monthly_nexupay_goal) || 2500000,
    } : {
      monthlyCommissionGoal: 2500000,
      monthlyNexusPayGoal: 2500000,
    };

    return { goals, error: null };
  } catch (error) {
    console.error('Error in getPaymentGoals:', error);
    return {
      goals: {
        monthlyCommissionGoal: 2500000,
        monthlyNexusPayGoal: 2500000,
      },
      error: 'Error al obtener objetivos de pago.'
    };
  }
};

/**
 * Guarda objetivos de pago en la base de datos
 * @param {Object} goals - Objetivos a guardar
 * @returns {Promise<{error}>}
 */
export const savePaymentGoals = async (goals) => {
  try {
    const goalData = {
      monthly_commission_goal: goals.monthlyCommissionGoal,
      monthly_nexupay_goal: goals.monthlyNexusPayGoal,
      updated_at: new Date().toISOString()
    };

    // Intentar insertar primero
    const { data: insertData, error: insertError } = await supabase
      .from('payment_goals')
      .insert(goalData)
      .select();

    if (insertError) {
      // Si falla por conflicto (ya existe), intentar actualizar
      if (insertError.code === '23505') { // unique_violation
        const { data: updateData, error: updateError } = await supabase
          .from('payment_goals')
          .update(goalData)
          .eq('id', 1) // Asumiendo que hay un registro único
          .select();

        if (updateError) {
          return { error: handleSupabaseError(updateError) };
        }
      } else if (insertError.code === '42P01') { // relation does not exist
        console.warn('⚠️ Tabla payment_goals no existe, objetivos no persistentes');
        return { error: null }; // No error, solo no se guarda
      } else {
        return { error: handleSupabaseError(insertError) };
      }
    }

    return { error: null };
  } catch (error) {
    console.error('Error in savePaymentGoals:', error);
    return { error: 'Error al guardar objetivos de pago.' };
  }
};

/**
 * Obtiene estadísticas de integraciones externas
 * @returns {Promise<{integrations, error}>}
 */
export const getIntegrationStats = async () => {
  try {
    // Obtener fecha de hoy (inicio del día)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISOString = today.toISOString();

    // Contar transacciones de Mercado Pago del día actual
    const { count: mercadoPagoTransactions, error: mpError } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('payment_method', 'mercadopago')
      .gte('transaction_date', todayISOString);

    if (mpError) {
      console.warn('Error getting Mercado Pago stats:', mpError);
    }

    // Verificar estado de Mercado Pago
    const mercadoPagoStatus = {
      connected: true,
      lastSync: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
      transactionsToday: mercadoPagoTransactions || 0
    };

    // Email (SendGrid): No se está trackeando el envío de emails actualmente
    const emailStatus = {
      connected: true,
      emailsSentToday: 0, // No implementado aún
      deliveryRate: 0 // No implementado aún
    };

    const integrations = {
      mercadoPago: mercadoPagoStatus,
      email: emailStatus
    };

    return { integrations, error: null };
  } catch (error) {
    console.error('Error in getIntegrationStats:', error);
    return { integrations: null, error: 'Error al obtener estadísticas de integraciones.' };
  }
};

/**
 * Crea un nuevo usuario (solo para administradores)
 * @param {Object} userData - Datos del usuario
 * @returns {Promise<{user, error}>}
 */
export const createUser = async (userData) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) {
      return { user: null, error: handleSupabaseError(error) };
    }

    return { user: data, error: null };
  } catch (error) {
    console.error('Error in createUser:', error);
    return { user: null, error: 'Error al crear usuario.' };
  }
};

/**
 * Actualiza un usuario (solo para administradores)
 * @param {string} userId - ID del usuario
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<{error}>}
 */
export const updateUser = async (userId, updates) => {
  try {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (error) {
      return { error: handleSupabaseError(error) };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in updateUser:', error);
    return { error: 'Error al actualizar usuario.' };
  }
};

/**
 * Elimina un usuario (solo para administradores)
 * @param {string} userId - ID del usuario
 * @returns {Promise<{error}>}
 */
export const deleteUser = async (userId) => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      return { error: handleSupabaseError(error) };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in deleteUser:', error);
    return { error: 'Error al eliminar usuario.' };
  }
};

/**
 * Compatibilidad con campaignService
 * Estas funciones son referenciadas desde src/services/campaignService.js
 * y pueden no existir aún en la base de datos. Implementamos versiones
 * tolerantes a errores con fallbacks seguros para ambiente de desarrollo.
 */

/**
 * Devuelve la lista de deudores objetivo para una campaña.
 * Intenta:
 *  1) campaign_debtors (join a tabla debtors)
 *  2) unified_campaigns.ai_config.segmentation (si existiera estructura con IDs)
 * En caso de no existir tablas/relaciones, retorna [] para no bloquear el build.
 * @param {string} campaignId
 * @returns {Promise<Array>}
 */
export const getCampaignDebtors = async (campaignId) => {
  try {
    // 1) campaign_debtors -> debtors (si existe)
    const { data, error } = await supabase
      .from('campaign_debtors')
      .select(`
        debtor:debtors(*)
      `)
      .eq('campaign_id', campaignId);

    if (!error && Array.isArray(data)) {
      // Mapear a arreglo plano de deudores
      return data
        .map((row) => row.debtor || row)
        .filter(Boolean);
    }
  } catch (err) {
    // Tabla puede no existir en entornos locales
    console.warn('getCampaignDebtors: fallback por ausencia de tabla campaign_debtors', err?.message || err);
  }

  try {
    // 2) Fallback a configuración de campaña
    const { data: campaign, error: campError } = await supabase
      .from('unified_campaigns')
      .select('ai_config')
      .eq('id', campaignId)
      .maybeSingle();

    if (!campError && campaign?.ai_config?.segmentation) {
      // Si existiera una estructura con IDs de deudores dentro de la segmentación, podríamos resolverlos aquí.
      // Por ahora devolvemos un arreglo vacío para no romper ejecución.
      return [];
    }
  } catch (err) {
    console.warn('getCampaignDebtors: fallback por ausencia de unified_campaigns.ai_config', err?.message || err);
  }

  // Fallback final: sin deudores asignados
  return [];
};

/**
 * Actualiza/guarda un resumen de resultados de campaña.
 * Para desarrollo, intenta upsert en campaign_results_summary si existe,
 * y si no, hace no-op exitoso.
 * @param {string} campaignId
 * @param {object|array} results
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateCampaignResults = async (campaignId, results) => {
  try {
    const payload = {
      campaign_id: campaignId,
      last_results: results,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('campaign_results_summary')
      .upsert(payload, { onConflict: 'campaign_id' });

    if (error) {
      // Si la tabla no existe o hay restricción no crítica, registrar y continuar
      console.warn('updateCampaignResults: no se pudo persistir en campaign_results_summary:', error);
      return { success: true };
    }

    return { success: true };
  } catch (err) {
    console.warn('updateCampaignResults: fallback no-op por error inesperado:', err?.message || err);
    // No bloquear el flujo de la app
    return { success: true };
  }
};
export default {
  // Usuarios
  getUserProfile,
  updateUserProfile,
  getCompanyProfile,
  updateCompanyProfile,

  // Deudas
  getUserDebts,
  getDebtById,
  getCompanyDebts,
  createDebt,
  updateDebt,

  // Ofertas
  getUserOffers,
  getCompanyOffers,
  createOffer,
  updateOffer,
  deleteOffer,

  // Propuestas
  getCompanyProposals,
  createProposal,
  updateProposal,

  // Acuerdos
  getUserAgreements,
  getCompanyAgreements,
  createAgreement,
  updateAgreement,

  // Pagos
  getUserPayments,
  getCompanyPayments,
  createPayment,
  updatePayment,

  // Wallet
  getWalletBalance,
  getWalletTransactions,
  createWalletTransaction,

  // Notificaciones
  getUserNotifications,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,

  // Estadísticas
  getUserCommissionStats,
  getDebtorDashboardStats,
  getCompanyDashboardStats,

  // Empresas
  createCompany,

  // Clientes
  getCompanyClients,
  getClientById,
  createClient,
  updateClient,
  getClientDebts,
  getClientStats,

  // Comprobantes de pago
  getPaymentReceipts,
  getPendingReceiptsForCompany,
  createPaymentReceipt,
  updatePaymentReceiptValidation,

  // Estadísticas de pagos para admin
  getPaymentStats,
  getRecentPayments,
  getPendingPayments,

  // Funciones para admin
  getAllCompanies,

  // Sistema y configuración
  getDatabaseSystemInfo,
  getSystemConfig,
  updateSystemConfig,
  getIntegrationStats,

  // Gestión de usuarios para admin
  createUser,
  updateUser,
  deleteUser,

  // Gestión de acuerdos
  updateAgreementStatus,

  // Gestión de mensajes
  getCompanyMessages,
  sendMessage,

  // Gestión de analytics
  getCompanyAnalytics,
  getCompanyAdditionalMetrics,

  // Gestión de comisiones
    getCommissionStats,
    getCompanyCommissionDetails,

    // Gestión de objetivos de pago
    savePaymentGoals,
    getPaymentGoals,

  // Gestión de campañas unificadas
  getCompanyCampaigns,
  createUnifiedCampaign,
  updateUnifiedCampaign,
  getCorporateClients,
  createCorporateClient,
  getCorporateSegments,
  createCorporateSegment,
  getCampaignResults,
  getCampaignSecureMessages,
  getDebtorSecureMessages,
  createSecureMessage,
  validateSecureMessageToken,
  updateSecureMessage,
  // ==================== SEGURIDAD Y PRIVACIDAD ====================

  /**
   * Registra consentimiento GDPR
   */
  recordGDPRConsent: async (userId, consentType, consented = true) => {
    try {
      const consentData = {
        user_id: userId,
        consent_type: consentType,
        consented,
        consent_date: new Date().toISOString(),
        ip_address: null, // Se obtiene del cliente
        user_agent: navigator.userAgent
      };

      const { error } = await supabase
        .from('gdpr_consents')
        .insert(consentData);

      if (error) {
        return { error: handleSupabaseError(error) };
      }

      return { error: null };
    } catch (error) {
      console.error('Error in recordGDPRConsent:', error);
      return { error: 'Error al registrar consentimiento GDPR.' };
    }
  },

  /**
   * Verifica consentimiento GDPR
   */
  checkGDPRConsent: async (userId, consentType) => {
    try {
      const { data, error } = await supabase
        .from('gdpr_consents')
        .select('*')
        .eq('user_id', userId)
        .eq('consent_type', consentType)
        .eq('consented', true)
        .order('consent_date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        return { hasConsent: false, error: handleSupabaseError(error) };
      }

      return { hasConsent: !!data, error: null };
    } catch (error) {
      console.error('Error in checkGDPRConsent:', error);
      return { hasConsent: false, error: 'Error al verificar consentimiento GDPR.' };
    }
  },

  /**
   * Implementa "Derecho al Olvido" (GDPR)
   */
  rightToBeForgotten: async (userId) => {
    try {
      // Anonimizar datos personales
      const anonymizedData = {
        full_name: '[GDPR_DELETED]',
        email: `[deleted_${userId}@nexupay.com]`,
        rut: '[DELETED]',
        phone: '[DELETED]',
        address: '[DELETED]',
        gdpr_deleted: true,
        gdpr_deletion_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('users')
        .update(anonymizedData)
        .eq('id', userId);

      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in rightToBeForgotten:', error);
      return { success: false, error: 'Error al implementar derecho al olvido.' };
    }
  },

  /**
   * Obtiene resumen de datos del usuario para GDPR
   */
  getGDPRDataSummary: async (userId) => {
    try {
      // Obtener datos personales
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, full_name, email, rut, phone, address, created_at')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Obtener deudas
      const { data: debts } = await supabase
        .from('debts')
        .select('id, original_amount, current_amount, status, created_at')
        .eq('user_id', userId);

      // Obtener pagos
      const { data: payments } = await supabase
        .from('payments')
        .select('id, amount, status, transaction_date')
        .eq('user_id', userId);

      // Obtener consentimientos GDPR
      const { data: consents } = await supabase
        .from('gdpr_consents')
        .select('*')
        .eq('user_id', userId);

      return {
        personalData: userData,
        debts: debts || [],
        payments: payments || [],
        consents: consents || [],
        dataRetentionDays: 2555 // 7 años según GDPR
      };
    } catch (error) {
      console.error('Error obteniendo resumen GDPR:', error);
      throw error;
    }
  },

  /**
   * Registra evento de auditoría
   */
  auditLog: async (eventType, details, userId = null) => {
    try {
      const auditEntry = {
        event_type: eventType,
        details: JSON.stringify(details),
        user_id: userId,
        ip_address: null, // Se obtiene del cliente
        user_agent: navigator.userAgent,
        session_id: sessionStorage.getItem('sessionId') || 'unknown',
        timestamp: new Date().toISOString()
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert(auditEntry);

      if (error) {
        console.error('Error registrando audit log:', error);
      }
    } catch (error) {
      console.error('Error in auditLog:', error);
    }
  },

  /**
   * Obtiene logs de auditoría (solo administradores)
   */
  getAuditLogs: async (filters = {}) => {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (filters.eventType) {
        query = query.eq('event_type', filters.eventType);
      }

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate);
      }

      const { data, error } = await query;

      if (error) {
        return { logs: [], error: handleSupabaseError(error) };
      }

      return { logs: data || [], error: null };
    } catch (error) {
      console.error('Error in getAuditLogs:', error);
      return { logs: [], error: 'Error al obtener logs de auditoría.' };
    }
  },

  /**
   * Registra evento de seguridad
   */
  logSecurityEvent: async (eventType, severity, description, details = null, affectedUserId = null, affectedCompanyId = null) => {
    try {
      const eventData = {
        event_type: eventType,
        severity,
        description,
        details: JSON.stringify(details),
        affected_user_id: affectedUserId,
        affected_company_id: affectedCompanyId,
        ip_address: null, // Se obtiene del cliente
        user_agent: navigator.userAgent,
        resolved: false
      };

      const { error } = await supabase
        .from('security_events')
        .insert(eventData);

      if (error) {
        console.error('Error registrando evento de seguridad:', error);
      }
    } catch (error) {
      console.error('Error in logSecurityEvent:', error);
    }
  },

  /**
   * Obtiene eventos de seguridad (solo administradores)
   */
  getSecurityEvents: async (filters = {}) => {
    try {
      let query = supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }

      if (filters.resolved !== undefined) {
        query = query.eq('resolved', filters.resolved);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data, error } = await query;

      if (error) {
        return { events: [], error: handleSupabaseError(error) };
      }

      return { events: data || [], error: null };
    } catch (error) {
      console.error('Error in getSecurityEvents:', error);
      return { events: [], error: 'Error al obtener eventos de seguridad.' };
    }
  },

  /**
   * Almacena datos encriptados
   */
  storeEncryptedData: async (dataType, referenceId, referenceTable, encryptedData) => {
    try {
      const dataEntry = {
        data_type: dataType,
        reference_id: referenceId,
        reference_table: referenceTable,
        encrypted_data: encryptedData,
        encryption_key_version: 1,
        access_log: JSON.stringify([{
          action: 'created',
          timestamp: new Date().toISOString(),
          ip_address: null
        }])
      };

      const { error } = await supabase
        .from('encrypted_data')
        .insert(dataEntry);

      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in storeEncryptedData:', error);
      return { success: false, error: 'Error al almacenar datos encriptados.' };
    }
  },

  /**
   * Recupera datos encriptados
   */
  getEncryptedData: async (referenceId, referenceTable, dataType = null) => {
    try {
      let query = supabase
        .from('encrypted_data')
        .select('*')
        .eq('reference_id', referenceId)
        .eq('reference_table', referenceTable);

      if (dataType) {
        query = query.eq('data_type', dataType);
      }

      const { data, error } = await query.single();

      if (error) {
        return { data: null, error: handleSupabaseError(error) };
      }

      // Registrar acceso
      const accessLog = JSON.parse(data.access_log || '[]');
      accessLog.push({
        action: 'accessed',
        timestamp: new Date().toISOString(),
        ip_address: null
      });

      await supabase
        .from('encrypted_data')
        .update({ access_log: JSON.stringify(accessLog) })
        .eq('id', data.id);

      return { data, error: null };
    } catch (error) {
      console.error('Error in getEncryptedData:', error);
      return { data: null, error: 'Error al recuperar datos encriptados.' };
    }
  },

};


/**
 * Obtiene estadísticas de comisiones en tiempo real (fallback)
 * @returns {Promise<{commissionStats, error}>}
 */
export const getCommissionStatsRealtime = async () => {
  try {
    // Obtener todos los pagos completados con información de empresa
    const { data: completedPayments, error: paymentsError } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        user_incentive,
        company_id,
        transaction_date,
        companies!inner(
          id,
          business_name,
          nexupay_commission,
          nexupay_commission_type,
          user_incentive_percentage,
          user_incentive_type
        )
      `)
      .eq('status', 'completed');

    if (paymentsError) {
      console.error('❌ Error obteniendo pagos completados:', paymentsError);
      return { commissionStats: null, error: handleSupabaseError(paymentsError) };
    }

    console.log('📊 Pagos completados encontrados:', completedPayments?.length || 0);

    // Calcular estadísticas y guardar en historial
    let totalPaidToNexuPay = 0;
    let totalPaidToUsers = 0;
    let totalCommissions = 0;
    let percentageCompanies = 0;

    if (completedPayments && completedPayments.length > 0) {
      for (const payment of completedPayments) {
        const company = payment.companies;
        const paymentAmount = parseFloat(payment.amount) || 0;

        // Calcular comisión a NexuPay
        let nexupayCommission = 0;
        let nexupayRate = 0;
        if (company.nexupay_commission_type === 'percentage') {
          nexupayRate = parseFloat(company.nexupay_commission) || 15;
          nexupayCommission = paymentAmount * nexupayRate / 100;
          percentageCompanies++;
        } else {
          nexupayCommission = parseFloat(company.nexupay_commission) || 0;
        }

        // Calcular incentivo al usuario
        let userIncentive = 0;
        let userIncentiveRate = 0;
        if (company.user_incentive_type === 'percentage') {
          userIncentiveRate = parseFloat(company.user_incentive_percentage) || 5;
          userIncentive = paymentAmount * userIncentiveRate / 100;
        } else {
          userIncentive = parseFloat(company.user_incentive_percentage) || 0;
        }

        // Si hay incentivo específico en el pago, usarlo
        if (payment.user_incentive) {
          userIncentive = parseFloat(payment.user_incentive);
        }

        totalPaidToNexuPay += nexupayCommission;
        totalPaidToUsers += userIncentive;
        totalCommissions += nexupayCommission + userIncentive;

        // Guardar en historial si no existe
        const { error: historyError } = await supabase
          .from('commission_history')
          .upsert([{
            company_id: company.id,
            payment_id: payment.id,
            payment_amount: paymentAmount,
            payment_date: payment.transaction_date,
            nexupay_commission_rate: nexupayRate,
            nexupay_commission_type: company.nexupay_commission_type,
            nexupay_commission_amount: nexupayCommission,
            user_incentive_rate: userIncentiveRate,
            user_incentive_type: company.user_incentive_type,
            user_incentive_amount: userIncentive,
            total_commission: nexupayCommission + userIncentive,
            operational_costs: 0, // Por ahora 0
            status: 'calculated'
          }], { onConflict: 'payment_id' });

        if (historyError) {
          console.warn('⚠️ Error guardando en historial de comisiones:', historyError);
        }
      }
    }

    // Calcular comisión promedio (solo para empresas con porcentaje)
    const averageCommissionRate = percentageCompanies > 0
      ? completedPayments.reduce((sum, payment) => {
          const company = payment.companies;
          if (company.nexupay_commission_type === 'percentage') {
            return sum + parseFloat(company.nexupay_commission || 15);
          }
          return sum;
        }, 0) / percentageCompanies
      : 0;

    const commissionStats = {
      totalPaidToNexuPay,
      totalPaidToUsers,
      totalCommissions,
      averageCommissionRate,
      totalClosedBusinesses: completedPayments?.length || 0
    };

    console.log('✅ Estadísticas de comisiones calculadas en tiempo real:', commissionStats);
    return { commissionStats, error: null };
  } catch (error) {
    console.error('💥 Error en getCommissionStatsRealtime:', error);
    return { commissionStats: null, error: 'Error al obtener estadísticas de comisiones.' };
  }
};

/**
 * Obtiene historial detallado de comisiones para una empresa
 * @param {string} companyId - ID de la empresa
 * @returns {Promise<{commissionHistory, error}>}
 */
export const getCompanyCommissionHistory = async (companyId) => {
  try {
    const { data, error } = await supabase
      .from('commission_history')
      .select(`
        *,
        payments (
          id,
          amount,
          transaction_date
        )
      `)
      .eq('company_id', companyId)
      .order('payment_date', { ascending: false });

    if (error) {
      return { commissionHistory: [], error: handleSupabaseError(error) };
    }

    return { commissionHistory: data || [], error: null };
  } catch (error) {
    console.error('Error in getCompanyCommissionHistory:', error);
    return { commissionHistory: [], error: 'Error al obtener historial de comisiones.' };
  }
};

// Named export for createIntelligentCampaign
export const createIntelligentCampaign = async (campaignData, companyId) => {
  try {
    // Importar dinámicamente para evitar dependencias circulares
    const { campaignService } = await import('./campaignService.js');
    return await campaignService.createIntelligentCampaign(campaignData, companyId);
  } catch (error) {
    console.error('Error in createIntelligentCampaign:', error);
    return { campaign: null, segmentation: null, error: 'Error al crear campaña inteligente.' };
  }
};
