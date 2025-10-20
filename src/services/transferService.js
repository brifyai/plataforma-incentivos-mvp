/**
 * Servicio de Transferencias Bancarias
 *
 * Maneja todas las operaciones relacionadas con transferencias automáticas
 */

import { supabase, handleSupabaseError } from '../config/supabase';

/**
 * Obtiene todas las transferencias de una empresa
 * @param {string} companyId - ID de la empresa
 * @returns {Promise<{transfers, error}>}
 */
export const getCompanyTransfers = async (companyId) => {
  try {
    // First, get batches created by the company
    const { data: createdBatches, error: createdError } = await supabase
      .from('transfer_batches')
      .select(`
        *,
        transfer_batch_items (
          id,
          payment_id,
          amount,
          transfer_status,
          mercadopago_beneficiary_id,
          bank_account_info,
          transfer_reference,
          processed_at,
          completed_at,
          error_message
        )
      `)
      .eq('created_by', companyId)
      .order('created_at', { ascending: false });

    if (createdError) {
      return { transfers: [], error: handleSupabaseError(createdError) };
    }

    // Then, get batches where the company has items
    const { data: itemBatches, error: itemError } = await supabase
      .from('transfer_batch_items')
      .select(`
        batch_id,
        transfer_batches!inner (
          *,
          transfer_batch_items (
            id,
            payment_id,
            amount,
            transfer_status,
            mercadopago_beneficiary_id,
            bank_account_info,
            transfer_reference,
            processed_at,
            completed_at,
            error_message
          )
        )
      `)
      .eq('company_id', companyId);

    if (itemError) {
      return { transfers: [], error: handleSupabaseError(itemError) };
    }

    // Combine and deduplicate results
    const allTransfers = [...(createdBatches || [])];

    // Add batches from items that aren't already in the list
    const existingBatchIds = new Set(allTransfers.map(t => t.id));
    itemBatches?.forEach(item => {
      if (!existingBatchIds.has(item.transfer_batches.id)) {
        allTransfers.push(item.transfer_batches);
      }
    });

    // Sort by creation date
    allTransfers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return { transfers: allTransfers, error: null };
  } catch (error) {
    console.error('Error in getCompanyTransfers:', error);
    return { transfers: [], error: 'Error al obtener transferencias.' };
  }
};

/**
 * Obtiene una transferencia específica por ID
 * @param {string} transferId - ID de la transferencia
 * @returns {Promise<{transfer, error}>}
 */
export const getTransferById = async (transferId) => {
  try {
    const { data, error } = await supabase
      .from('transfer_batches')
      .select(`
        *,
        transfer_batch_items (
          id,
          payment_id,
          amount,
          transfer_status,
          mercadopago_beneficiary_id,
          bank_account_info,
          transfer_reference,
          processed_at,
          completed_at,
          error_message
        )
      `)
      .eq('id', transferId)
      .single();

    if (error) {
      return { transfer: null, error: handleSupabaseError(error) };
    }

    return { transfer: data, error: null };
  } catch (error) {
    console.error('Error in getTransferById:', error);
    return { transfer: null, error: 'Error al obtener transferencia.' };
  }
};

/**
 * Procesa un lote de transferencias
 * @param {string} batchId - ID del lote
 * @returns {Promise<{success, error}>}
 */
export const processTransferBatch = async (batchId) => {
  try {
    // Actualizar estado del lote
    const { error: batchError } = await supabase
      .from('transfer_batches')
      .update({
        status: 'processing',
        processed_at: new Date().toISOString()
      })
      .eq('id', batchId);

    if (batchError) {
      return { success: false, error: handleSupabaseError(batchError) };
    }

    // Obtener items del lote
    const { data: items, error: itemsError } = await supabase
      .from('transfer_batch_items')
      .select('*')
      .eq('batch_id', batchId);

    if (itemsError) {
      return { success: false, error: handleSupabaseError(itemsError) };
    }

    // Procesar cada item (simulación - en producción llamaría a APIs bancarias)
    for (const item of items) {
      try {
        // Aquí iría la lógica real de transferencia bancaria
        // Por ahora simulamos el procesamiento

        await supabase
          .from('transfer_batch_items')
          .update({
            transfer_status: 'completed',
            processed_at: new Date().toISOString(),
            completed_at: new Date().toISOString()
          })
          .eq('id', item.id);

      } catch (itemError) {
        // Marcar item como fallido
        await supabase
          .from('transfer_batch_items')
          .update({
            transfer_status: 'failed',
            error_message: itemError.message,
            processed_at: new Date().toISOString()
          })
          .eq('id', item.id);
      }
    }

    // Verificar si todos los items están completos
    const { data: updatedItems } = await supabase
      .from('transfer_batch_items')
      .select('transfer_status')
      .eq('batch_id', batchId);

    const allCompleted = updatedItems.every(item => item.transfer_status === 'completed');

    // Actualizar estado final del lote
    await supabase
      .from('transfer_batches')
      .update({
        status: allCompleted ? 'completed' : 'failed',
        completed_at: new Date().toISOString()
      })
      .eq('id', batchId);

    return { success: true, error: null };
  } catch (error) {
    console.error('Error in processTransferBatch:', error);
    return { success: false, error: 'Error al procesar lote de transferencias.' };
  }
};

/**
 * Obtiene estadísticas de transferencias de una empresa
 * @param {string} companyId - ID de la empresa
 * @returns {Promise<{stats, error}>}
 */
export const getTransferStats = async (companyId) => {
  try {
    // Get stats for batches created by the company
    const { data: createdStats, error: createdError } = await supabase
      .from('transfer_batches')
      .select('status, total_amount')
      .eq('created_by', companyId);

    if (createdError) {
      return { stats: null, error: handleSupabaseError(createdError) };
    }

    // Get stats for batches where company has items
    const { data: itemStats, error: itemError } = await supabase
      .from('transfer_batch_items')
      .select(`
        transfer_batches!inner (
          status,
          total_amount
        )
      `)
      .eq('company_id', companyId);

    if (itemError) {
      return { stats: null, error: handleSupabaseError(itemError) };
    }

    const stats = {
      totalTransferred: 0,
      pendingTransfers: 0,
      processingTransfers: 0,
      completedTransfers: 0,
      failedTransfers: 0
    };

    // Process created batches
    createdStats?.forEach(batch => {
      if (batch.status === 'completed') {
        stats.completedTransfers++;
        stats.totalTransferred += parseFloat(batch.total_amount || 0);
      } else if (batch.status === 'processing') {
        stats.processingTransfers++;
      } else if (batch.status === 'pending') {
        stats.pendingTransfers++;
      } else if (batch.status === 'failed') {
        stats.failedTransfers++;
      }
    });

    // Process item batches (avoid duplicates)
    const processedBatchIds = new Set(createdStats?.map(b => b.id) || []);
    itemStats?.forEach(item => {
      const batch = item.transfer_batches;
      if (!processedBatchIds.has(batch.id)) {
        processedBatchIds.add(batch.id);
        if (batch.status === 'completed') {
          stats.completedTransfers++;
          stats.totalTransferred += parseFloat(batch.total_amount || 0);
        } else if (batch.status === 'processing') {
          stats.processingTransfers++;
        } else if (batch.status === 'pending') {
          stats.pendingTransfers++;
        } else if (batch.status === 'failed') {
          stats.failedTransfers++;
        }
      }
    });

    return { stats, error: null };
  } catch (error) {
    console.error('Error in getTransferStats:', error);
    return { stats: null, error: 'Error al obtener estadísticas.' };
  }
};

/**
 * Crea un lote de transferencias manual
 * @param {Object} batchData - Datos del lote
 * @returns {Promise<{batch, error}>}
 */
export const createTransferBatch = async (batchData) => {
  try {
    const { data, error } = await supabase
      .from('transfer_batches')
      .insert(batchData)
      .select()
      .single();

    if (error) {
      return { batch: null, error: handleSupabaseError(error) };
    }

    return { batch: data, error: null };
  } catch (error) {
    console.error('Error in createTransferBatch:', error);
    return { batch: null, error: 'Error al crear lote de transferencias.' };
  }
};

/**
 * Actualiza el estado de una transferencia individual
 * @param {string} itemId - ID del item
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<{error}>}
 */
export const updateTransferItem = async (itemId, updates) => {
  try {
    const { error } = await supabase
      .from('transfer_batch_items')
      .update(updates)
      .eq('id', itemId);

    if (error) {
      return { error: handleSupabaseError(error) };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in updateTransferItem:', error);
    return { error: 'Error al actualizar item de transferencia.' };
  }
};

export default {
  getCompanyTransfers,
  getTransferById,
  processTransferBatch,
  getTransferStats,
  createTransferBatch,
  updateTransferItem,
};