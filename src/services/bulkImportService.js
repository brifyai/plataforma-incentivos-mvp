/**
 * Bulk Import Service
 *
 * Servicio para importar deudas masivamente desde archivos CSV/Excel
 * Maneja validación, procesamiento por lotes y logging de importaciones
 *
 * @module BulkImportService
 */

import { supabase } from '../config/supabase';

// Configuración de importación
const IMPORT_CONFIG = {
  BATCH_SIZE: 50, // Registros por lote
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_ROWS: 10000, // Máximo 10,000 registros por archivo
  VALIDATION_TIMEOUT: 30000, // 30 segundos para validación
  IMPORT_TIMEOUT: 300000 // 5 minutos para importación completa
};

/**
 * Validar estructura de datos de deuda
 * @param {Object} debtData - Datos de la deuda
 * @returns {Object} Resultado de validación
 */
const validateDebtData = (debtData) => {
  const errors = [];

  // Validar campos requeridos
  if (!debtData.rut || !debtData.rut.trim()) {
    errors.push('RUT es requerido');
  } else if (!/^\d{1,2}\.\d{3}\.\d{3}-[\dKk]$/.test(debtData.rut)) {
    errors.push('RUT debe tener formato XX.XXX.XXX-X');
  }

  if (!debtData.full_name || !debtData.full_name.trim()) {
    errors.push('Nombre completo es requerido');
  }

  if (!debtData.debt_amount || isNaN(parseFloat(debtData.debt_amount))) {
    errors.push('Monto de deuda debe ser un número válido');
  } else if (parseFloat(debtData.debt_amount) <= 0) {
    errors.push('Monto de deuda debe ser mayor a 0');
  }

  if (!debtData.due_date) {
    errors.push('Fecha de vencimiento es requerida');
  } else {
    const dueDate = new Date(debtData.due_date);
    if (isNaN(dueDate.getTime())) {
      errors.push('Fecha de vencimiento inválida');
    }
  }

  if (!debtData.creditor_name || !debtData.creditor_name.trim()) {
    errors.push('Nombre del acreedor es requerido');
  }

  // Validar email si está presente
  if (debtData.email && debtData.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(debtData.email)) {
      errors.push('Email tiene formato inválido');
    }
  }

  // Validar teléfono si está presente
  if (debtData.phone && debtData.phone.trim()) {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(debtData.phone)) {
      errors.push('Teléfono tiene formato inválido');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Crear o actualizar usuario deudor
 * @param {Object} userData - Datos del usuario
 * @returns {Promise<Object>} Usuario creado/actualizado
 */
const upsertDebtorUser = async (userData) => {
  try {
    // Verificar si el usuario ya existe
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id, email, full_name, rut')
      .eq('rut', userData.rut)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      throw findError;
    }

    if (existingUser) {
      // Actualizar usuario existente
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          full_name: userData.full_name,
          email: userData.email || existingUser.email,
          phone: userData.phone || existingUser.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return { user: updatedUser, created: false };
    } else {
      // Crear nuevo usuario
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: userData.email || `${userData.rut.replace(/[.\-]/g, '')}@temp.import`,
          password: Math.random().toString(36).slice(-12), // Contraseña temporal
          rut: userData.rut,
          full_name: userData.full_name,
          phone: userData.phone,
          role: 'debtor',
          validation_status: 'pending',
          wallet_balance: 0
        })
        .select()
        .single();

      if (createError) throw createError;
      return { user: newUser, created: true };
    }
  } catch (error) {
    console.error('Error upserting debtor user:', error);
    throw error;
  }
};

/**
 * Crear deuda para un usuario
 * @param {Object} debtData - Datos de la deuda
 * @param {string} userId - ID del usuario
 * @param {string} companyId - ID de la empresa
 * @param {string} clientId - ID del cliente (opcional)
 * @returns {Promise<Object>} Deuda creada
 */
const createDebt = async (debtData, userId, companyId, clientId = null) => {
  try {
    const { data: debt, error } = await supabase
      .from('debts')
      .insert({
        client_id: clientId,
        company_id: companyId,
        user_id: userId,
        debt_reference: debtData.debt_reference,
        original_amount: parseFloat(debtData.debt_amount),
        current_amount: parseFloat(debtData.debt_amount),
        interest_rate: parseFloat(debtData.interest_rate) || 0,
        origin_date: new Date().toISOString().split('T')[0], // Fecha de hoy
        debt_type: debtData.debt_type || 'other',
        status: 'active',
        payment_history: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return debt;
  } catch (error) {
    console.error('Error creating debt:', error);
    throw error;
  }
};

/**
 * Procesar un lote de importación
 * @param {Array} batch - Lote de datos a procesar
 * @param {Object} options - Opciones de importación
 * @returns {Promise<Object>} Resultados del lote
 */
const processImportBatch = async (batch, options) => {
  const { companyId, clientId, onProgress } = options;
  const results = {
    processed: 0,
    successful: 0,
    failed: 0,
    errors: [],
    createdUsers: 0,
    createdDebts: 0
  };

  for (let i = 0; i < batch.length; i++) {
    const rowData = batch[i];
    const rowNumber = options.startRow + i + 1;

    try {
      results.processed++;

      // 1. Validar datos
      const validation = validateDebtData(rowData);
      if (!validation.isValid) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          errors: validation.errors
        });
        continue;
      }

      // 2. Crear/actualizar usuario deudor
      const { user, created: userCreated } = await upsertDebtorUser({
        rut: rowData.rut,
        full_name: rowData.full_name,
        email: rowData.email,
        phone: rowData.phone
      });

      if (userCreated) {
        results.createdUsers++;
      }

      // 3. Crear deuda
      const debt = await createDebt(rowData, user.id, companyId, clientId);
      results.createdDebts++;
      results.successful++;

      // 4. Reportar progreso
      if (onProgress) {
        onProgress({
          processed: results.processed,
          successful: results.successful,
          failed: results.failed,
          currentRow: rowNumber
        });
      }

    } catch (error) {
      console.error(`Error processing row ${rowNumber}:`, error);
      results.failed++;
      results.errors.push({
        row: rowNumber,
        errors: [error.message || 'Error interno del servidor']
      });
    }
  }

  return results;
};

/**
 * Importar deudas masivamente
 * @param {Array} debtData - Array de datos de deudas
 * @param {Object} options - Opciones de importación
 * @returns {Promise<Object>} Resultados de la importación
 */
export const bulkImportDebts = async (debtData, options = {}) => {
  try {
    const {
      companyId,
      clientId = null,
      batchSize = IMPORT_CONFIG.BATCH_SIZE,
      onProgress = null,
      onBatchComplete = null
    } = options;

    if (!companyId) {
      throw new Error('companyId es requerido');
    }

    if (!Array.isArray(debtData) || debtData.length === 0) {
      throw new Error('No hay datos para importar');
    }

    if (debtData.length > IMPORT_CONFIG.MAX_ROWS) {
      throw new Error(`No se pueden importar más de ${IMPORT_CONFIG.MAX_ROWS} registros por archivo`);
    }

    console.log(`🚀 Iniciando importación masiva: ${debtData.length} registros`);

    const startTime = Date.now();
    const totalResults = {
      totalRows: debtData.length,
      processed: 0,
      successful: 0,
      failed: 0,
      createdUsers: 0,
      createdDebts: 0,
      errors: [],
      batches: []
    };

    // Procesar en lotes
    const batches = [];
    for (let i = 0; i < debtData.length; i += batchSize) {
      batches.push(debtData.slice(i, i + batchSize));
    }

    console.log(`📦 Procesando ${batches.length} lotes de ${batchSize} registros cada uno`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchStartRow = i * batchSize;

      console.log(`🔄 Procesando lote ${i + 1}/${batches.length} (${batch.length} registros)`);

      const batchResults = await processImportBatch(batch, {
        companyId,
        clientId,
        startRow: batchStartRow,
        onProgress
      });

      // Acumular resultados
      totalResults.processed += batchResults.processed;
      totalResults.successful += batchResults.successful;
      totalResults.failed += batchResults.failed;
      totalResults.createdUsers += batchResults.createdUsers;
      totalResults.createdDebts += batchResults.createdDebts;
      totalResults.errors.push(...batchResults.errors);

      totalResults.batches.push({
        batchNumber: i + 1,
        ...batchResults
      });

      // Callback de lote completado
      if (onBatchComplete) {
        onBatchComplete({
          batchNumber: i + 1,
          totalBatches: batches.length,
          ...batchResults
        });
      }

      // Pequeña pausa entre lotes para no sobrecargar
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log(`✅ Importación completada en ${duration.toFixed(2)} segundos`);
    console.log(`📊 Resultados: ${totalResults.successful} exitosas, ${totalResults.failed} fallidas`);

    return {
      success: true,
      ...totalResults,
      duration,
      successRate: (totalResults.successful / totalResults.totalRows) * 100
    };

  } catch (error) {
    console.error('❌ Error en bulkImportDebts:', error);
    return {
      success: false,
      error: error.message,
      totalRows: debtData?.length || 0,
      processed: 0,
      successful: 0,
      failed: debtData?.length || 0
    };
  }
};

/**
 * Obtener historial de importaciones de una empresa
 * @param {string} companyId - ID de la empresa
 * @param {Object} options - Opciones de consulta
 * @returns {Promise<Object>} Historial de importaciones
 */
export const getImportHistory = async (companyId, options = {}) => {
  try {
    const { limit = 50, offset = 0 } = options;

    // Nota: Esta función requeriría una tabla de historial de importaciones
    // Por ahora retornamos datos simulados
    return {
      success: true,
      imports: [],
      total: 0
    };
  } catch (error) {
    console.error('Error getting import history:', error);
    return {
      success: false,
      error: error.message,
      imports: [],
      total: 0
    };
  }
};

/**
 * Validar archivo antes de importar
 * @param {File} file - Archivo a validar
 * @returns {Promise<Object>} Resultado de validación
 */
export const validateImportFile = (file) => {
  const errors = [];

  // Validar tipo de archivo
  const allowedTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (!allowedTypes.includes(file.type)) {
    errors.push('Tipo de archivo no válido. Use CSV o Excel (.csv, .xls, .xlsx)');
  }

  // Validar tamaño
  if (file.size > IMPORT_CONFIG.MAX_FILE_SIZE) {
    errors.push(`Archivo demasiado grande. Máximo ${IMPORT_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export { IMPORT_CONFIG };
export default {
  bulkImportDebts,
  getImportHistory,
  validateImportFile,
  validateDebtData
};