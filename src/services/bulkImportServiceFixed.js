/**
 * Bulk Import Service - VERSIÓN CORREGIDA Y MEJORADA
 *
 * Servicio para importar deudas masivamente desde archivos CSV/Excel
 * Manejo robusto de errores, permisos RLS y validación mejorada
 *
 * @module BulkImportServiceFixed
 */

import { supabase } from '../config/supabase';
import { createClient } from '@supabase/supabase-js';
import { aiImportService } from './aiImportService';

// Obtener variables de entorno para el cliente admin
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Crear cliente admin con manejo mejorado de errores
let supabaseAdmin = null;
try {
  if (supabaseUrl && supabaseServiceKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('✅ Cliente admin de Supabase inicializado correctamente');
  } else {
    console.warn('⚠️ No se pudo inicializar cliente admin - faltan variables de entorno');
  }
} catch (error) {
  console.error('❌ Error inicializando cliente admin:', error);
}

// Configuración mejorada de importación
const IMPORT_CONFIG = {
  BATCH_SIZE: 25, // Reducido para mejor manejo de errores
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_ROWS: 5000, // Reducido para evitar timeouts
  VALIDATION_TIMEOUT: 30000,
  IMPORT_TIMEOUT: 300000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000
};

/**
 * Validar estructura de datos de deuda - VERSIÓN MEJORADA
 */
const validateDebtDataFixed = (debtData) => {
  const errors = [];
  const warnings = [];
  const validationDetails = {};

  // Validación mejorada de RUT chileno
  validationDetails.rut = {
    value: debtData.rut,
    isEmpty: !debtData.rut,
    trimResult: debtData.rut?.trim?.(),
    normalized: normalizeRUT(debtData.rut),
    isValid: false
  };

  if (!debtData.rut || !debtData.rut.trim()) {
    errors.push('RUT es requerido');
  } else {
    const normalizedRUT = normalizeRUT(debtData.rut);
    validationDetails.rut.normalized = normalizedRUT;
    validationDetails.rut.isValid = /^\d{1,2}\.\d{3}\.\d{3}-[\dKk]$/.test(normalizedRUT);
    
    if (!validationDetails.rut.isValid) {
      errors.push(`RUT "${debtData.rut}" no tiene formato chileno válido (XX.XXX.XXX-X)`);
    }
  }

  // Validación de nombre completo
  validationDetails.fullName = {
    value: debtData.full_name,
    isEmpty: !debtData.full_name || !debtData.full_name.trim(),
    length: debtData.full_name?.length || 0
  };
  
  if (!debtData.full_name || !debtData.full_name.trim()) {
    errors.push('Nombre completo es requerido');
  } else if (debtData.full_name.trim().length < 3) {
    errors.push('Nombre completo debe tener al menos 3 caracteres');
  } else if (debtData.full_name.trim().length > 255) {
    errors.push('Nombre completo no puede exceder 255 caracteres');
  }

  // Validación mejorada de monto
  validationDetails.debtAmount = {
    value: debtData.debt_amount,
    isNumber: !isNaN(parseFloat(debtData.debt_amount)),
    isPositive: false,
    parsedValue: 0
  };
  
  if (!debtData.debt_amount || isNaN(parseFloat(debtData.debt_amount))) {
    errors.push('Monto de deuda debe ser un número válido');
  } else {
    const amount = parseFloat(debtData.debt_amount);
    validationDetails.debtAmount.parsedValue = amount;
    validationDetails.debtAmount.isPositive = amount > 0;
    
    if (amount <= 0) {
      errors.push('Monto de deuda debe ser mayor a 0');
    } else if (amount > 999999999.99) {
      errors.push('Monto de deuda excede el límite permitido (999.999.999,99)');
    }
  }

  // Validación mejorada de fecha
  validationDetails.dueDate = {
    value: debtData.due_date,
    isEmpty: !debtData.due_date,
    isValidDate: false,
    parsedDate: null,
    isPast: false
  };
  
  if (!debtData.due_date) {
    errors.push('Fecha de vencimiento es requerida');
  } else {
    const date = new Date(debtData.due_date);
    validationDetails.dueDate.isValidDate = !isNaN(date.getTime());
    validationDetails.dueDate.parsedDate = date;
    
    if (!validationDetails.dueDate.isValidDate) {
      errors.push('Fecha de vencimiento inválida');
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      validationDetails.dueDate.isPast = date < today;
      
      if (validationDetails.dueDate.isPast) {
        warnings.push('Fecha de vencimiento es anterior a hoy');
      }
    }
  }

  // Validación de nombre del acreedor
  validationDetails.creditorName = {
    value: debtData.creditor_name,
    isEmpty: !debtData.creditor_name || !debtData.creditor_name.trim()
  };
  
  if (!debtData.creditor_name || !debtData.creditor_name.trim()) {
    errors.push('Nombre del acreedor es requerido');
  }

  // Validaciones opcionales con advertencias
  if (debtData.email && typeof debtData.email === 'string' && debtData.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    validationDetails.email = {
      value: debtData.email,
      isValid: emailRegex.test(debtData.email.trim())
    };
    if (!validationDetails.email.isValid) {
      warnings.push(`Email "${debtData.email}" tiene formato inválido`);
    }
  }

  if (debtData.phone && typeof debtData.phone === 'string' && debtData.phone.trim()) {
    const normalizedPhone = normalizePhoneNumber(debtData.phone);
    validationDetails.phone = {
      value: debtData.phone,
      normalized: normalizedPhone,
      isValid: normalizedPhone.length >= 12 // Formato internacional mínimo
    };
    if (!validationDetails.phone.isValid) {
      warnings.push(`Teléfono "${debtData.phone}" podría tener formato inválido`);
    }
  }

  console.log('📋 Validación mejorada completada:', {
    errors: errors.length,
    warnings: warnings.length,
    isValid: errors.length === 0
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    validationDetails,
    normalizedData: {
      rut: validationDetails.rut.normalized,
      full_name: debtData.full_name?.trim(),
      email: debtData.email?.trim()?.toLowerCase() || null,
      phone: validationDetails.phone?.normalized || null,
      debt_amount: validationDetails.debtAmount.parsedValue,
      due_date: validationDetails.dueDate.parsedDate?.toISOString().split('T')[0],
      creditor_name: debtData.creditor_name?.trim(),
      debt_reference: debtData.debt_reference?.trim() || null,
      debt_type: debtData.debt_type?.trim() || 'other',
      interest_rate: debtData.interest_rate ? parseFloat(debtData.interest_rate) : null,
      description: debtData.description?.trim() || null
    }
  };
};

/**
 * Normalizar RUT chileno - FUNCIÓN MEJORADA
 */
const normalizeRUT = (rut) => {
  if (!rut) return '';
  
  try {
    // Eliminar todos los caracteres excepto números y K/k
    let cleaned = rut.toString().toUpperCase().replace(/[^0-9K]/g, '');
    
    if (cleaned.length < 2) return '';
    
    // Separar dígito verificador
    let dv = cleaned.slice(-1);
    let numbers = cleaned.slice(0, -1);
    
    // Si no hay dígito verificador válido, calcularlo
    if (!/^[0-9K]$/.test(dv) && numbers.length > 0) {
      dv = calculateRUTDV(numbers);
    }
    
    if (numbers.length === 0) return '';
    
    // Formatear con puntos y guion
    let formatted = '';
    let count = 0;
    for (let i = numbers.length - 1; i >= 0; i--) {
      formatted = numbers[i] + formatted;
      count++;
      if (count === 3 && i > 0) {
        formatted = '.' + formatted;
        count = 0;
      }
    }
    
    return formatted + '-' + dv;
  } catch (error) {
    console.error('Error normalizando RUT:', error);
    return rut.toString().trim();
  }
};

/**
 * Calcular dígito verificador de RUT
 */
const calculateRUTDV = (numbers) => {
  let sum = 0;
  let multiplier = 2;
  
  for (let i = numbers.length - 1; i >= 0; i--) {
    sum += parseInt(numbers[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const remainder = sum % 11;
  const dv = 11 - remainder;
  
  if (dv === 11) return '0';
  if (dv === 10) return 'K';
  return dv.toString();
};

/**
 * Normalizar teléfono chileno - FUNCIÓN MEJORADA
 */
const normalizePhoneNumber = (phone) => {
  if (!phone) return '';
  
  try {
    // Eliminar todos los caracteres no numéricos excepto el +
    let cleaned = phone.toString().replace(/[^\d+]/g, '');
    
    // Normalización para Chile
    if (!cleaned.startsWith('+')) {
      if (cleaned.length === 9 && cleaned.startsWith('9')) {
        // Celular chileno: 9XXXXXXXX -> +569XXXXXXXX
        cleaned = '+56' + cleaned;
      } else if (cleaned.length === 8) {
        // Fijo chileno: XXXXXXXX -> +562XXXXXXXX (asumir Santiago)
        cleaned = '+562' + cleaned;
      } else if (cleaned.length === 11 && cleaned.startsWith('569')) {
        // Ya tiene código pero sin +: 569XXXXXXXX -> +569XXXXXXXX
        cleaned = '+' + cleaned;
      } else if (cleaned.length === 11 && cleaned.startsWith('562')) {
        // Ya tiene código fijo sin +: 562XXXXXXXX -> +562XXXXXXXX
        cleaned = '+' + cleaned;
      }
    }
    
    return cleaned;
  } catch (error) {
    console.error('Error normalizando teléfono:', error);
    return phone.toString().trim();
  }
};

/**
 * Crear o actualizar usuario deudor - VERSIÓN MEJORADA
 */
const upsertDebtorUserFixed = async (userData) => {
  const maxRetries = IMPORT_CONFIG.MAX_RETRIES;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`👤 Intentando crear/actualizar usuario (intento ${attempt}/${maxRetries}):`, userData.rut);
      
      // Usar cliente admin si está disponible, si no, usar cliente regular
      const client = supabaseAdmin || supabase;
      console.log('🔧 Usando cliente:', supabaseAdmin ? 'admin' : 'regular');
      
      // Verificar si el usuario ya existe
      const { data: existingUser, error: findError } = await client
        .from('users')
        .select('id, email, full_name, rut')
        .eq('rut', userData.rut)
        .single();

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
        console.log('✅ Usuario actualizado exitosamente:', updatedUser.id);
        return { user: updatedUser, created: false };
      } else {
        // Crear nuevo usuario
        const insertData = {
          email: userData.email || `${userData.rut.replace(/[.\-]/g, '')}@temp.import`,
          rut: userData.rut,
          full_name: userData.full_name,
          phone: userData.phone,
          role: 'debtor',
          validation_status: 'pending',
          email_verified: false,
          phone_verified: false
        };

        const { data: newUser, error: createError } = await client
          .from('users')
          .insert(insertData)
          .select()
          .single();

        if (createError) {
          console.error('❌ Error creando usuario:', createError);
          
          // Si es error de duplicado, intentar recuperar el existente
          if (createError.code === '23505' && createError.message.includes('users_rut_key')) {
            console.log('🔄 RUT duplicado, intentando recuperar usuario existente...');
            const { data: existingByRUT } = await client
              .from('users')
              .select('id, email, full_name, rut')
              .eq('rut', userData.rut)
              .single();
            
            if (existingByRUT) {
              console.log('✅ Usuario existente recuperado:', existingByRUT.id);
              return { user: existingByRUT, created: false };
            }
          }
          
          throw createError;
        }
        
        console.log('✅ Usuario creado exitosamente:', newUser.id);
        return { user: newUser, created: true };
      }
    } catch (error) {
      lastError = error;
      console.error(`❌ Intento ${attempt} fallido:`, error.message);
      
      if (attempt < maxRetries) {
        console.log(`⏳ Esperando ${IMPORT_CONFIG.RETRY_DELAY}ms antes del reintento...`);
        await new Promise(resolve => setTimeout(resolve, IMPORT_CONFIG.RETRY_DELAY));
      }
    }
  }
  
  throw lastError || new Error('No se pudo crear/actualizar el usuario después de múltiples intentos');
};

/**
 * Crear deuda - VERSIÓN MEJORADA
 */
const createDebtFixed = async (debtData, userId, companyId, clientId) => {
  const maxRetries = IMPORT_CONFIG.MAX_RETRIES;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`💰 Creando deuda (intento ${attempt}/${maxRetries}):`, {
        userId,
        companyId,
        amount: debtData.debt_amount,
        dueDate: debtData.due_date
      });

      const client = supabaseAdmin || supabase;
      console.log('🔧 Usando cliente para deuda:', supabaseAdmin ? 'admin' : 'regular');

      // Construir objeto con campos que existen en la tabla
      const debtInsertData = {
        company_id: companyId,
        user_id: userId,
        original_amount: parseFloat(debtData.debt_amount),
        current_amount: parseFloat(debtData.debt_amount),
        due_date: debtData.due_date,
        description: debtData.description || `Deuda importada - ${debtData.creditor_name || 'Sin acreedor'}`,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Campos opcionales (verificar si existen antes de agregar)
      if (debtData.interest_rate && !isNaN(parseFloat(debtData.interest_rate))) {
        debtInsertData.interest_rate = parseFloat(debtData.interest_rate);
      }

      // Campos adicionales que pueden haber sido agregados en la migración
      if (debtData.creditor_name) {
        debtInsertData.creditor_name = debtData.creditor_name;
      }
      if (debtData.debt_reference) {
        debtInsertData.debt_reference = debtData.debt_reference;
      }
      if (debtData.debt_type) {
        debtInsertData.debt_type = debtData.debt_type;
      }

      console.log('📋 Datos a insertar en tabla debts:', Object.keys(debtInsertData));

      const { data: debt, error } = await client
        .from('debts')
        .insert(debtInsertData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error insertando deuda:', error);
        throw new Error(`No se pudo insertar la deuda: ${error.message}`);
      }

      console.log('✅ Deuda creada exitosamente:', debt.id);
      return debt;
    } catch (error) {
      lastError = error;
      console.error(`❌ Intento ${attempt} fallido:`, error.message);
      
      if (attempt < maxRetries) {
        console.log(`⏳ Esperando ${IMPORT_CONFIG.RETRY_DELAY}ms antes del reintento...`);
        await new Promise(resolve => setTimeout(resolve, IMPORT_CONFIG.RETRY_DELAY));
      }
    }
  }
  
  throw lastError || new Error('No se pudo crear la deuda después de múltiples intentos');
};

/**
 * Procesar un lote de importación - VERSIÓN MEJORADA
 */
const processImportBatchFixed = async (batch, options) => {
  const { companyId, clientId, onProgress } = options;
  const results = {
    processed: 0,
    successful: 0,
    failed: 0,
    errors: [],
    createdUsers: 0,
    createdDebts: 0,
    warnings: []
  };

  console.log('🔄 Iniciando processImportBatchFixed con:', {
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

      // 1. Validar datos con la función mejorada
      console.log(`🔍 Validando fila ${rowNumber}...`);
      const validation = validateDebtDataFixed(rowData);
      console.log(`✅ Resultado validación fila ${rowNumber}:`, {
        isValid: validation.isValid,
        errorsCount: validation.errors?.length || 0,
        warningsCount: validation.warnings?.length || 0
      });
      
      if (!validation.isValid) {
        console.error(`❌ Errores de validación en fila ${rowNumber}:`, validation.errors);
        results.failed++;
        results.errors.push({
          row: rowNumber,
          errors: validation.errors,
          data: rowData,
          validationDetails: validation.validationDetails
        });
        continue;
      }

      // Advertencias no impiden la importación
      if (validation.warnings.length > 0) {
        results.warnings.push({
          row: rowNumber,
          warnings: validation.warnings
        });
      }

      // 2. Crear/actualizar usuario deudor con datos normalizados
      console.log(`👤 Creando/actualizando usuario para fila ${rowNumber}...`);
      const { user, created: userCreated } = await upsertDebtorUserFixed(validation.normalizedData);

      console.log(`✅ Usuario ${userCreated ? 'creado' : 'actualizado'}:`, user.id);

      if (userCreated) {
        results.createdUsers++;
      }

      // 3. Crear deuda con datos normalizados
      console.log(`💰 Creando deuda para usuario ${user.id}...`);
      const debt = await createDebtFixed(validation.normalizedData, user.id, companyId, clientId);
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
        details: error.details || 'No details available'
      });
      
      results.failed++;
      results.errors.push({
        row: rowNumber,
        errors: [
          error.message || 'Error interno del servidor',
          error.details || ''
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
    errors: results.errors.length,
    warnings: results.warnings.length
  });

  return results;
};

/**
 * Importar deudas masivamente - VERSIÓN MEJORADA
 */
export const bulkImportDebtsFixed = async (debtData, options = {}) => {
  const startTime = Date.now();
  
  try {
    const {
      companyId,
      clientId = null,
      batchSize = IMPORT_CONFIG.BATCH_SIZE,
      onProgress = null,
      onBatchComplete = null,
      useAI = false // Desactivado por defecto para mayor estabilidad
    } = options;

    console.log('🔍 Parámetros recibidos en bulkImportDebtsFixed:', {
      companyId,
      clientId,
      batchSize,
      dataLength: debtData?.length,
      useAI
    });

    // Validaciones iniciales mejoradas
    if (!companyId) {
      throw new Error('companyId es requerido');
    }

    if (!Array.isArray(debtData) || debtData.length === 0) {
      throw new Error('No hay datos para importar');
    }

    if (debtData.length > IMPORT_CONFIG.MAX_ROWS) {
      throw new Error(`No se pueden importar más de ${IMPORT_CONFIG.MAX_ROWS} registros por archivo`);
    }

    console.log(`🚀 Iniciando importación masiva mejorada: ${debtData.length} registros para empresa ${companyId}`);

    const totalResults = {
      totalRows: debtData.length,
      processed: 0,
      successful: 0,
      failed: 0,
      createdUsers: 0,
      createdDebts: 0,
      errors: [],
      warnings: [],
      batches: []
    };

    // Procesamiento con IA opcional y con fallback robusto
    let processedData = debtData;
    let aiProcessingResults = null;

    if (useAI) {
      try {
        console.log('🤖 Iniciando procesamiento con IA...');
        aiProcessingResults = await aiImportService.processImportAutonomously(
          debtData,
          companyId,
          clientId
        );

        if (aiProcessingResults.success && aiProcessingResults.data) {
          processedData = aiProcessingResults.data;
          console.log('✅ IA procesó los datos exitosamente');
        }
      } catch (aiError) {
        console.warn('⚠️ Error en procesamiento con IA, usando datos originales:', aiError.message);
        aiProcessingResults = {
          success: false,
          error: aiError.message,
          fallback: true
        };
      }
    }

    // Procesar en lotes más pequeños para mejor manejo de errores
    const batches = [];
    for (let i = 0; i < processedData.length; i += batchSize) {
      batches.push(processedData.slice(i, i + batchSize));
    }

    console.log(`📦 Procesando ${batches.length} lotes de ${batchSize} registros cada uno`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchStartRow = i * batchSize;

      console.log(`🔄 Procesando lote ${i + 1}/${batches.length} (${batch.length} registros)`);

      const batchResults = await processImportBatchFixed(batch, {
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
      totalResults.warnings.push(...batchResults.warnings);

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

      // Pausa entre lotes para no sobrecargar
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log(`✅ Importación completada en ${duration.toFixed(2)} segundos`);
    console.log(`📊 Resultados finales: ${totalResults.successful} exitosas, ${totalResults.failed} fallidas`);

    return {
      success: totalResults.successful > 0,
      ...totalResults,
      duration,
      successRate: (totalResults.successful / totalResults.totalRows) * 100,
      aiProcessing: aiProcessingResults,
      hasWarnings: totalResults.warnings.length > 0
    };

  } catch (error) {
    console.error('❌ Error en bulkImportDebtsFixed:', error);
    return {
      success: false,
      error: error.message,
      totalRows: debtData?.length || 0,
      processed: 0,
      successful: 0,
      failed: debtData?.length || 0,
      duration: (Date.now() - startTime) / 1000
    };
  }
};

/**
 * Validar archivo antes de importar - VERSIÓN MEJORADA
 */
export const validateImportFileFixed = (file) => {
  const errors = [];
  const warnings = [];

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

  // Advertencias
  if (file.size > 5 * 1024 * 1024) {
    warnings.push('Archivo grande (>5MB). Considera dividirlo para mejor rendimiento.');
  }

  if (file.name.length > 100) {
    warnings.push('Nombre de archivo muy largo. Considera acortarlo.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export { IMPORT_CONFIG };
export default {
  bulkImportDebtsFixed,
  validateImportFileFixed,
  validateDebtDataFixed,
  normalizeRUT,
  normalizePhoneNumber
};