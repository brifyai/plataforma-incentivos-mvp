/**
 * Servicio de Transferencias Bancarias Automáticas
 *
 * Maneja transferencias bancarias automáticas desde Mercado Pago
 * a cuentas bancarias de empresas de cobranza.
 */

import { supabase } from '../config/supabase';
import { handleSupabaseError } from '../config/supabase';

// ==================== CONFIGURACIÓN ====================

// Configuración de Mercado Pago para transferencias
const MP_CONFIG = {
  baseURL: 'https://api.mercadopago.com',
  transferEndpoint: '/v1/payments',
  accessToken: import.meta.env.VITE_MERCADO_PAGO_ACCESS_TOKEN,
};

// ==================== FUNCIONES PRINCIPALES ====================

/**
 * Registra automáticamente una empresa como beneficiario en Mercado Pago
 * @param {Object} companyData - Datos de la empresa
 * @returns {Promise<{success, beneficiaryId, error}>}
 */
export const registerCompanyBeneficiary = async (companyData) => {
  try {
    const { companyId, bankAccountInfo } = companyData;

    // Verificar que la empresa tenga datos bancarios completos
    if (!bankAccountInfo || !bankAccountInfo.accountNumber || !bankAccountInfo.accountHolderName) {
      return {
        success: false,
        error: 'Datos bancarios incompletos para registrar beneficiario'
      };
    }

    // Crear beneficiario en Mercado Pago
    const beneficiaryData = {
      external_id: `company_${companyId}`,
      description: `Empresa de cobranza: ${companyData.businessName}`,
      bank_account: {
        account_holder_name: bankAccountInfo.accountHolderName,
        account_holder_rut: bankAccountInfo.accountHolderRut,
        bank_name: bankAccountInfo.bankName,
        account_type: bankAccountInfo.accountType || 'checking',
        account_number: bankAccountInfo.accountNumber,
        email: bankAccountInfo.email,
      }
    };

    // En producción, aquí iría la llamada real a MP
    // const response = await fetch(`${MP_CONFIG.baseURL}/v1/beneficiaries`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${MP_CONFIG.accessToken}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(beneficiaryData),
    // });

    // Simulación para desarrollo
    const mockBeneficiaryId = `benef_${companyId}_${Date.now()}`;

    // Actualizar empresa con ID de beneficiario
    const { error: updateError } = await supabase
      .from('companies')
      .update({
        mercadopago_beneficiary_id: mockBeneficiaryId,
        beneficiary_registered_at: new Date().toISOString(),
      })
      .eq('id', companyId);

    if (updateError) {
      return { success: false, error: handleSupabaseError(updateError) };
    }

    return {
      success: true,
      beneficiaryId: mockBeneficiaryId,
      error: null
    };

  } catch (error) {
    console.error('Error registering company beneficiary:', error);
    return {
      success: false,
      error: 'Error al registrar beneficiario en Mercado Pago'
    };
  }
};

/**
 * Crea una transferencia bancaria automática
 * @param {Object} transferData - Datos de la transferencia
 * @returns {Promise<{success, transfer, error}>}
 */
export const createBankTransfer = async (transferData) => {
  try {
    const {
      companyId,
      amount,
      description = 'Pago por servicios de cobranza',
    } = transferData;

    // Obtener datos de la empresa
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('business_name, bank_account_info, mercadopago_beneficiary_id')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return { success: false, error: 'Empresa no encontrada' };
    }

    if (!company.mercadopago_beneficiary_id) {
      return { success: false, error: 'Empresa no registrada como beneficiario' };
    }

    // Crear registro de transferencia en BD
    const transferRecord = {
      company_id: companyId,
      amount: parseFloat(amount),
      bank_account_type: company.bank_account_info.accountType || 'checking',
      bank_name: company.bank_account_info.bankName,
      account_holder_name: company.bank_account_info.accountHolderName,
      account_holder_rut: company.bank_account_info.accountHolderRut,
      account_number: company.bank_account_info.accountNumber,
      email: company.bank_account_info.email,
      description,
      status: 'pending',
    };

    const { data: transfer, error: dbError } = await supabase
      .from('bank_transfers')
      .insert(transferRecord)
      .select()
      .single();

    if (dbError) {
      return { success: false, error: handleSupabaseError(dbError) };
    }

    return { success: true, transfer, error: null };

  } catch (error) {
    console.error('Error creating bank transfer:', error);
    return { success: false, error: 'Error al crear transferencia bancaria' };
  }
};

/**
 * Procesa una transferencia bancaria (llama a API de MP)
 * @param {string} transferId - ID de la transferencia
 * @returns {Promise<{success, transferId, error}>}
 */
export const processBankTransfer = async (transferId) => {
  try {
    // Obtener datos de la transferencia
    const { data: transfer, error: fetchError } = await supabase
      .from('bank_transfers')
      .select(`
        *,
        company:companies(business_name, mercadopago_beneficiary_id)
      `)
      .eq('id', transferId)
      .single();

    if (fetchError || !transfer) {
      return { success: false, error: 'Transferencia no encontrada' };
    }

    if (transfer.status !== 'pending') {
      return { success: false, error: 'Transferencia ya procesada' };
    }

    // Actualizar estado a processing
    await supabase
      .from('bank_transfers')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', transferId);

    // Preparar datos para Mercado Pago
    const transferPayload = {
      amount: transfer.amount,
      currency: 'CLP',
      description: transfer.description,
      beneficiary_id: transfer.company.mercadopago_beneficiary_id,
      external_reference: `transfer_${transferId}`,
      metadata: {
        company_id: transfer.company_id,
        transfer_id: transferId,
        company_name: transfer.company.business_name,
      }
    };

    // En producción, aquí iría la llamada real a MP
    // const response = await fetch(`${MP_CONFIG.baseURL}/v1/transfers`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${MP_CONFIG.accessToken}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(transferPayload),
    // });

    // Simulación para desarrollo
    const mockTransferId = `mp_transfer_${Date.now()}`;

    // Actualizar transferencia como completada
    const { error: updateError } = await supabase
      .from('bank_transfers')
      .update({
        status: 'completed',
        transfer_date: new Date().toISOString(),
        completion_date: new Date().toISOString(),
        mercado_pago_transfer_id: mockTransferId,
        updated_at: new Date().toISOString()
      })
      .eq('id', transferId);

    if (updateError) {
      return { success: false, error: handleSupabaseError(updateError) };
    }

    return { success: true, transferId: mockTransferId, error: null };

  } catch (error) {
    console.error('Error processing bank transfer:', error);

    // Marcar como fallida
    await supabase
      .from('bank_transfers')
      .update({
        status: 'failed',
        failure_reason: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', transferId);

    return { success: false, error: 'Error al procesar transferencia' };
  }
};

/**
 * Crea un lote de transferencias masivas
 * @param {Array} transfers - Array de transferencias a procesar
 * @param {string} batchName - Nombre del lote
 * @returns {Promise<{success, batch, error}>}
 */
export const createTransferBatch = async (transfers, batchName = null) => {
  try {
    const batchData = {
      name: batchName || `Lote ${new Date().toLocaleDateString()}`,
      description: `Transferencias masivas - ${transfers.length} empresas`,
      total_transfers: transfers.length,
      total_amount: transfers.reduce((sum, t) => sum + parseFloat(t.amount), 0),
      status: 'pending',
    };

    // Crear lote
    const { data: batch, error: batchError } = await supabase
      .from('transfer_batches')
      .insert(batchData)
      .select()
      .single();

    if (batchError) {
      return { success: false, error: handleSupabaseError(batchError) };
    }

    // Crear transferencias individuales y relacionar con el lote
    const transferInserts = [];
    const batchTransferInserts = [];

    for (let i = 0; i < transfers.length; i++) {
      const transfer = transfers[i];

      // Crear transferencia
      const transferRecord = {
        company_id: transfer.companyId,
        amount: parseFloat(transfer.amount),
        bank_account_type: transfer.bankAccountType || 'checking',
        bank_name: transfer.bankName,
        account_holder_name: transfer.accountHolderName,
        account_holder_rut: transfer.accountHolderRut,
        account_number: transfer.accountNumber,
        email: transfer.email,
        description: transfer.description || 'Pago por servicios de cobranza',
        status: 'pending',
      };

      transferInserts.push(transferRecord);
    }

    // Insertar todas las transferencias
    const { data: createdTransfers, error: transfersError } = await supabase
      .from('bank_transfers')
      .insert(transferInserts)
      .select();

    if (transfersError) {
      return { success: false, error: handleSupabaseError(transfersError) };
    }

    // Crear relaciones batch-transfer
    for (let i = 0; i < createdTransfers.length; i++) {
      batchTransferInserts.push({
        batch_id: batch.id,
        transfer_id: createdTransfers[i].id,
        sequence_order: i + 1,
      });
    }

    const { error: relationsError } = await supabase
      .from('batch_transfers')
      .insert(batchTransferInserts);

    if (relationsError) {
      return { success: false, error: handleSupabaseError(relationsError) };
    }

    return { success: true, batch, error: null };

  } catch (error) {
    console.error('Error creating transfer batch:', error);
    return { success: false, error: 'Error al crear lote de transferencias' };
  }
};

/**
 * Procesa un lote completo de transferencias
 * @param {string} batchId - ID del lote
 * @returns {Promise<{success, results, error}>}
 */
export const processTransferBatch = async (batchId) => {
  try {
    // Obtener lote y transferencias
    const { data: batch, error: batchError } = await supabase
      .from('transfer_batches')
      .select(`
        *,
        batch_transfers(
          transfer:bank_transfers(*)
        )
      `)
      .eq('id', batchId)
      .single();

    if (batchError || !batch) {
      return { success: false, error: 'Lote no encontrado' };
    }

    // Actualizar lote a processing
    await supabase
      .from('transfer_batches')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', batchId);

    const results = {
      successful: 0,
      failed: 0,
      total: batch.batch_transfers.length,
      transfers: []
    };

    // Procesar cada transferencia
    for (const batchTransfer of batch.batch_transfers) {
      const transfer = batchTransfer.transfer;

      try {
        const result = await processBankTransfer(transfer.id);

        if (result.success) {
          results.successful++;
        } else {
          results.failed++;
        }

        results.transfers.push({
          transferId: transfer.id,
          companyId: transfer.company_id,
          amount: transfer.amount,
          success: result.success,
          error: result.error
        });

      } catch (error) {
        results.failed++;
        results.transfers.push({
          transferId: transfer.id,
          companyId: transfer.company_id,
          amount: transfer.amount,
          success: false,
          error: error.message
        });
      }
    }

    // Actualizar lote final
    const finalStatus = results.failed === 0 ? 'completed' :
                       results.successful === 0 ? 'failed' : 'partial';

    await supabase
      .from('transfer_batches')
      .update({
        status: finalStatus,
        processed_transfers: results.total,
        successful_transfers: results.successful,
        failed_transfers: results.failed,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', batchId);

    return { success: true, results, error: null };

  } catch (error) {
    console.error('Error processing transfer batch:', error);
    return { success: false, error: 'Error al procesar lote de transferencias' };
  }
};

// ==================== FUNCIONES DE CONSULTA ====================

/**
 * Obtiene transferencias pendientes por empresa
 * @param {string} companyId - ID de la empresa
 * @returns {Promise<{transfers, error}>}
 */
export const getPendingTransfersByCompany = async (companyId) => {
  try {
    const { data, error } = await supabase
      .from('bank_transfers')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      return { transfers: [], error: handleSupabaseError(error) };
    }

    return { transfers: data || [], error: null };
  } catch (error) {
    console.error('Error getting pending transfers:', error);
    return { transfers: [], error: 'Error al obtener transferencias pendientes' };
  }
};

/**
 * Obtiene todos los lotes de transferencias
 * @param {Object} filters - Filtros opcionales
 * @returns {Promise<{batches, error}>}
 */
export const getTransferBatches = async (filters = {}) => {
  try {
    let query = supabase
      .from('transfer_batches')
      .select(`
        *,
        batch_transfers(
          transfer:bank_transfers(
            company:companies(business_name)
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      return { batches: [], error: handleSupabaseError(error) };
    }

    return { batches: data || [], error: null };
  } catch (error) {
    console.error('Error getting transfer batches:', error);
    return { batches: [], error: 'Error al obtener lotes de transferencias' };
  }
};

export default {
  registerCompanyBeneficiary,
  createBankTransfer,
  processBankTransfer,
  createTransferBatch,
  processTransferBatch,
  getPendingTransfersByCompany,
  getTransferBatches,
};