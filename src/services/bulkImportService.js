/**
 * Bulk Import Service
 *
 * Servicio para importar deudas masivamente desde archivos CSV/Excel
 * Maneja validación, procesamiento por lotes y logging de importaciones
 *
 * @module BulkImportService
 */

import { supabase } from '../config/supabase';
import { createClient } from '@supabase/supabase-js';
import { aiImportService } from './aiImportService';

// Obtener variables de entorno para el cliente admin
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Crear cliente admin para operaciones con permisos elevados
let supabaseAdmin = null;
if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

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
  const validationDetails = {};

  // Validar campos requeridos
  console.log('🔍 Validando RUT:', {
    value: debtData.rut,
    type: typeof debtData.rut,
    isEmpty: !debtData.rut,
    trimResult: debtData.rut?.trim?.(),
    regexTest: debtData.rut ? /^\d{1,2}\.\d{3}\.\d{3}-[\dKk]$/.test(debtData.rut) : 'N/A'
  });
  
  validationDetails.rut = {
    value: debtData.rut,
    isEmpty: !debtData.rut,
    trimResult: debtData.rut?.trim?.(),
    regexTest: debtData.rut ? /^\d{1,2}\.\d{3}\.\d{3}-[\dKk]$/.test(debtData.rut) : false
  };
  
  if (!debtData.rut || !debtData.rut.trim()) {
    errors.push('RUT es requerido');
  } else if (!/^\d{1,2}\.\d{3}\.\d{3}-[\dKk]$/.test(debtData.rut)) {
    errors.push(`RUT "${debtData.rut}" debe tener formato XX.XXX.XXX-X`);
  }

  validationDetails.fullName = {
    value: debtData.full_name,
    isEmpty: !debtData.full_name || !debtData.full_name.trim()
  };
  
  if (!debtData.full_name || !debtData.full_name.trim()) {
    errors.push('Nombre completo es requerido');
  }

  validationDetails.debtAmount = {
    value: debtData.debt_amount,
    isNumber: !isNaN(parseFloat(debtData.debt_amount)),
    isPositive: parseFloat(debtData.debt_amount) > 0,
    parsedValue: parseFloat(debtData.debt_amount)
  };
  
  if (!debtData.debt_amount || isNaN(parseFloat(debtData.debt_amount))) {
    errors.push('Monto de deuda debe ser un número válido');
  } else if (parseFloat(debtData.debt_amount) <= 0) {
    errors.push('Monto de deuda debe ser mayor a 0');
  }

  validationDetails.dueDate = {
    value: debtData.due_date,
    isEmpty: !debtData.due_date,
    isValidDate: debtData.due_date ? !isNaN(new Date(debtData.due_date).getTime()) : false,
    parsedDate: debtData.due_date ? new Date(debtData.due_date) : null
  };
  
  if (!debtData.due_date) {
    errors.push('Fecha de vencimiento es requerida');
  } else {
    const dueDate = new Date(debtData.due_date);
    if (isNaN(dueDate.getTime())) {
      errors.push('Fecha de vencimiento inválida');
    }
  }

  validationDetails.creditorName = {
    value: debtData.creditor_name,
    isEmpty: !debtData.creditor_name || !debtData.creditor_name.trim()
  };
  
  if (!debtData.creditor_name || !debtData.creditor_name.trim()) {
    errors.push('Nombre del acreedor es requerido');
  }

  // Validar email si está presente
  if (debtData.email && typeof debtData.email === 'string' && debtData.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    validationDetails.email = {
      value: debtData.email,
      isValid: emailRegex.test(debtData.email)
    };
    if (!emailRegex.test(debtData.email)) {
      errors.push('Email tiene formato inválido');
    }
  }

  // Validar teléfono si está presente
  if (debtData.phone && typeof debtData.phone === 'string' && debtData.phone.trim()) {
    const phoneRegex = /^\+\d{10,15}$/;
    validationDetails.phone = {
      value: debtData.phone,
      isValid: phoneRegex.test(debtData.phone)
    };
    if (!phoneRegex.test(debtData.phone)) {
      errors.push('Teléfono debe tener formato internacional (+569XXXXXXXX)');
    }
  }

  console.log('📋 Detalles completos de validación:', validationDetails);

  return {
    isValid: errors.length === 0,
    errors,
    validationDetails
  };
};

/**
 * Crear o actualizar usuario deudor
 * @param {Object} userData - Datos del usuario
 * @returns {Promise<Object>} Usuario creado/actualizado
 */
const upsertDebtorUser = async (userData) => {
  try {
    console.log('👤 Intentando crear/actualizar usuario:', userData.rut);
    
    // Usar cliente admin para operaciones de importación
    const client = supabaseAdmin || supabase;
    console.log('🔧 Usando cliente:', supabaseAdmin ? 'admin' : 'regular');
    
    // Verificar si el usuario ya existe
    const { data: existingUser, error: findError } = await client
      .from('users')
      .select('id, email, full_name, rut')
      .eq('rut', userData.rut)
      .single();

    console.log('🔍 Resultado búsqueda usuario:', { existingUser, findError });

    if (findError && findError.code !== 'PGRST116') {
      console.error('❌ Error buscando usuario:', findError);
      throw findError;
    }

    if (existingUser) {
      // Actualizar usuario existente
      const { data: updatedUser, error: updateError } = await client
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
      // Crear nuevo usuario - SOLO campos que existen en la tabla real según 001_initial_setup.sql
      const { data: newUser, error: createError } = await client
        .from('users')
        .insert({
          email: userData.email || `${userData.rut.replace(/[.\-]/g, '')}@temp.import`,
          rut: userData.rut,
          full_name: userData.full_name,
          phone: userData.phone,
          role: 'debtor',
          validation_status: 'pending',
          email_verified: false,
          phone_verified: false
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creando usuario:', createError);
        throw createError;
      }
      
      console.log('✅ Usuario creado exitosamente:', newUser);
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
const createDebt = async (debtData, userId, companyId, clientId) => {
  try {
    console.log('💰 Creando deuda:', {
      userId,
      companyId,
      clientId,
      amount: debtData.debt_amount,
      dueDate: debtData.due_date
    });

    // Usar cliente admin para operaciones de importación
    const client = supabaseAdmin || supabase;
    console.log('🔧 Usando cliente para deuda:', supabaseAdmin ? 'admin' : 'regular');

    // NOTA: La tabla debts real no tiene campo client_id
    // Los deudores se asocian directamente a la empresa (company_id) y al usuario (user_id)

    // Construir objeto con los campos REALES que existen en la tabla debts según 001_initial_setup.sql
    const debtInsertData = {
      company_id: companyId,
      user_id: userId,
      original_amount: parseFloat(debtData.debt_amount),
      current_amount: parseFloat(debtData.debt_amount),
      due_date: debtData.due_date ? new Date(debtData.due_date).toISOString().split('T')[0] : null,
      description: debtData.description || `Deuda importada - ${debtData.creditor_name || 'Sin acreedor'}`,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Campos opcionales que existen en la tabla
    if (debtData.interest_rate && !isNaN(parseFloat(debtData.interest_rate))) {
      debtInsertData.interest_rate = parseFloat(debtData.interest_rate);
    }

    console.log('🔍 Estructura de datos para inserción:', Object.keys(debtInsertData));
    console.log('📋 Datos a insertar en tabla debts:', debtInsertData);

    const { data: debt, error } = await client
      .from('debts')
      .insert(debtInsertData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error insertando deuda:', error);
      throw new Error(`No se pudo insertar la deuda. Error: ${error.message}`);
    }

    console.log('✅ Deuda creada exitosamente:', debt);
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
  // NOTA: clientId ya no se usa en createDebt pero lo mantenemos para compatibilidad
  const results = {
    processed: 0,
    successful: 0,
    failed: 0,
    errors: [],
    createdUsers: 0,
    createdDebts: 0
  };

  console.log('🔄 Iniciando processImportBatch con:', {
    batchSize: batch.length,
    companyId,
    clientId,
    hasAdminClient: !!supabaseAdmin
  });

  for (let i = 0; i < batch.length; i++) {
    const rowData = batch[i];
    const rowNumber = options.startRow + i + 1;

    try {
      results.processed++;

      console.log(`\n📋 Procesando fila ${rowNumber}:`, {
        rut: rowData.rut,
        full_name: rowData.full_name,
        debt_amount: rowData.debt_amount,
        due_date: rowData.due_date
      });

      // 1. Validar datos
      console.log(`🔍 Validando fila ${rowNumber}...`);
      const validation = validateDebtData(rowData);
      console.log(`✅ Resultado validación fila ${rowNumber}:`, {
        isValid: validation.isValid,
        errors: validation.errors,
        errorsCount: validation.errors?.length || 0
      });
      
      if (!validation.isValid) {
        console.error(`❌ Errores de validación en fila ${rowNumber}:`, validation.errors);
        console.error(`📋 Datos que causaron el error:`, rowData);
        results.failed++;
        results.errors.push({
          row: rowNumber,
          errors: validation.errors,
          data: rowData,
          validationDetails: {
            rutValidation: {
              value: rowData.rut,
              isEmpty: !rowData.rut,
              trimResult: rowData.rut?.trim?.(),
              regexTest: rowData.rut ? /^\d{1,2}\.\d{3}\.\d{3}-[\dKk]$/.test(rowData.rut) : 'N/A'
            },
            amountValidation: {
              value: rowData.debt_amount,
              isNumber: !isNaN(parseFloat(rowData.debt_amount)),
              isPositive: parseFloat(rowData.debt_amount) > 0
            },
            dateValidation: {
              value: rowData.due_date,
              isValid: rowData.due_date ? !isNaN(new Date(rowData.due_date).getTime()) : false
            }
          }
        });
        continue;
      }

      // 2. Crear/actualizar usuario deudor
      console.log(`👤 Creando/actualizando usuario para fila ${rowNumber}...`);
      const { user, created: userCreated } = await upsertDebtorUser({
        rut: rowData.rut,
        full_name: rowData.full_name,
        email: rowData.email,
        phone: rowData.phone
      });

      console.log(`✅ Usuario ${userCreated ? 'creado' : 'actualizado'}:`, user.id);

      if (userCreated) {
        results.createdUsers++;
      }

      // 3. Crear deuda
      console.log(`💰 Creando deuda para usuario ${user.id}...`);
      const debt = await createDebt(rowData, user.id, companyId, clientId);
      console.log(`✅ Deuda creada:`, debt.id);
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
      console.error(`❌ Error procesando fila ${rowNumber}:`, {
        message: error.message,
        stack: error.stack,
        details: error.details || 'No details available',
        hint: error.hint || 'No hint available',
        code: error.code || 'No code available'
      });
      
      results.failed++;
      results.errors.push({
        row: rowNumber,
        errors: [
          error.message || 'Error interno del servidor',
          error.details || '',
          error.hint || ''
        ].filter(Boolean),
        data: rowData
      });
    }
  }

  console.log('\n📊 Resultados del lote:', {
    processed: results.processed,
    successful: results.successful,
    failed: results.failed,
    createdUsers: results.createdUsers,
    createdDebts: results.createdDebts,
    errors: results.errors.length
  });

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
      clientId = null, // Ahora es opcional ya que la tabla debts no tiene client_id
      batchSize = IMPORT_CONFIG.BATCH_SIZE,
      onProgress = null,
      onBatchComplete = null,
      useAI = true // Nueva opción para usar IA autónoma
    } = options;

    console.log('🔍 Parámetros recibidos en bulkImportDebts:', {
      companyId,
      clientId,
      batchSize,
      dataLength: debtData?.length,
      useAI
    });

    if (!companyId) {
      console.error('❌ companyId es requerido');
      throw new Error('companyId es requerido');
    }

    if (!Array.isArray(debtData) || debtData.length === 0) {
      console.error('❌ No hay datos para importar');
      throw new Error('No hay datos para importar');
    }

    if (debtData.length > IMPORT_CONFIG.MAX_ROWS) {
      console.error('❌ Demasiados registros:', debtData.length);
      throw new Error(`No se pueden importar más de ${IMPORT_CONFIG.MAX_ROWS} registros por archivo`);
    }

    console.log(`🚀 Iniciando importación masiva: ${debtData.length} registros para empresa ${companyId}`);

    // 🤖 PROCESAMIENTO CON IA AUTÓNOMA
    let processedData = debtData;
    let aiProcessingResults = null;

    if (useAI) {
      console.log('🤖 Iniciando procesamiento autónomo con IA...');
      
      try {
        aiProcessingResults = await aiImportService.processImportAutonomously(
          debtData,
          companyId,
          clientId
        );

        if (aiProcessingResults.success) {
          processedData = aiProcessingResults.data;
          console.log('✅ IA procesó los datos exitosamente:', aiProcessingResults.message);
          
          // Notificar sobre campos creados si hubo
          if (aiProcessingResults.fieldsCreated && aiProcessingResults.fieldsCreated.length > 0) {
            console.log('🏗️ Campos creados por IA:', aiProcessingResults.fieldsCreated);
          }
        } else {
          console.warn('⚠️ IA no pudo procesar los datos, usando datos originales:', aiProcessingResults.error);
        }
      } catch (aiError) {
        console.error('❌ Error en procesamiento con IA, usando datos originales:', aiError);
        // Continuar con datos originales si falla la IA
      }
    }

    const startTime = Date.now();
    const totalResults = {
      totalRows: processedData.length,
      processed: 0,
      successful: 0,
      failed: 0,
      createdUsers: 0,
      createdDebts: 0,
      errors: [],
      batches: [],
      aiProcessing: aiProcessingResults
    };

    // Procesar en lotes
    const batches = [];
    for (let i = 0; i < processedData.length; i += batchSize) {
      batches.push(processedData.slice(i, i + batchSize));
    }

    console.log(`📦 Procesando ${batches.length} lotes de ${batchSize} registros cada uno`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchStartRow = i * batchSize;

      console.log(`🔄 Procesando lote ${i + 1}/${batches.length} (${batch.length} registros)`);

      const batchResults = await processImportBatch(batch, {
        companyId,
        clientId, // Pasamos clientId aunque no se use en createDebt para mantener compatibilidad
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

    // Si todos fallaron y la IA procesó los datos, intentar una vez más con datos corregidos
    if (totalResults.successful === 0 && useAI && aiProcessingResults && aiProcessingResults.success) {
      console.log('🔄 Todos los registros fallaron, intentando con datos corregidos por IA...');
      
      // Reintentar con datos corregidos pero sin IA para evitar bucle infinito
      const retryResults = await bulkImportDebts(processedData, {
        ...options,
        useAI: false // Evitar bucle infinito
      });
      
      if (retryResults.success) {
        return {
          ...retryResults,
          aiProcessing: aiProcessingResults,
          retryWithAIData: true,
          message: 'Importación exitosa después de corrección con IA'
        };
      }
    }

    return {
      success: totalResults.successful > 0,
      ...totalResults,
      duration,
      successRate: (totalResults.successful / totalResults.totalRows) * 100,
      aiProcessing: aiProcessingResults
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