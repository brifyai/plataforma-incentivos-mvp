/**
 * Validaciones Preventivas para NexuPay
 * 
 * Este módulo contiene validaciones para prevenir inconsistencias
 * en el mapeo UI-BD durante el desarrollo.
 */

/**
 * Valida la estructura de datos del representante legal
 * @param {Object} data - Datos a validar
 * @returns {Object} Resultado de validación
 */
export const validateLegalRepresentative = (data) => {
  const errors = [];
  const warnings = [];

  // Validaciones críticas
  if (!data.legal_representative_name) {
    errors.push('El nombre del representante legal es requerido');
  }

  if (!data.legal_representative_rut) {
    errors.push('El RUT del representante legal es requerido');
  }

  // Validaciones de formato
  if (data.legal_representative_rut && !isValidRUT(data.legal_representative_rut)) {
    errors.push('El RUT del representante legal no tiene formato válido');
  }

  // Advertencias de campos obsoletos
  if (data.full_name && !data.legal_representative_name) {
    warnings.push('Se detectó full_name. Considerar usar legal_representative_name para empresas');
  }

  if (data.representative_rut && !data.legal_representative_rut) {
    warnings.push('Se detectó representative_rut. Considerar usar legal_representative_rut');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    recommendations: generateRecommendations(errors, warnings)
  };
};

/**
 * Valida la estructura de datos bancarios
 * @param {Object} bankData - Datos bancarios a validar
 * @returns {Object} Resultado de validación
 */
export const validateBankAccountInfo = (bankData) => {
  const errors = [];
  const warnings = [];

  // Validaciones críticas
  if (!bankData.bankName) {
    errors.push('El nombre del banco es requerido');
  }

  if (!bankData.accountType) {
    errors.push('El tipo de cuenta es requerido');
  }

  if (!bankData.accountNumber) {
    errors.push('El número de cuenta es requerido');
  }

  // Validaciones de estructura
  if (typeof bankData !== 'object' || Array.isArray(bankData)) {
    errors.push('Los datos bancarios deben ser un objeto JSON válido');
  }

  // Advertencias de campos faltantes
  if (!bankData.accountHolderName) {
    warnings.push('Se recomienda incluir el nombre del titular de la cuenta');
  }

  if (!bankData.accountHolderRut) {
    warnings.push('Se recomienda incluir el RUT del titular de la cuenta');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    recommendations: generateRecommendations(errors, warnings)
  };
};

/**
 * Valida la estructura completa del formulario de empresa
 * @param {Object} formData - Datos del formulario
 * @returns {Object} Resultado de validación completa
 */
export const validateCompanyFormData = (formData) => {
  const results = {
    legalRepresentative: validateLegalRepresentative(formData),
    bankAccount: validateBankAccountInfo(formData.bank_account_info || {}),
    general: validateGeneralCompanyData(formData)
  };

  const allErrors = [
    ...results.legalRepresentative.errors,
    ...results.bankAccount.errors,
    ...results.general.errors
  ];

  const allWarnings = [
    ...results.legalRepresentative.warnings,
    ...results.bankAccount.warnings,
    ...results.general.warnings
  ];

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    details: results,
    summary: generateValidationSummary(results)
  };
};

/**
 * Valida datos generales de la empresa
 * @param {Object} data - Datos a validar
 * @returns {Object} Resultado de validación
 */
const validateGeneralCompanyData = (data) => {
  const errors = [];
  const warnings = [];

  // Validaciones críticas
  if (!data.company_name) {
    errors.push('El nombre de la empresa es requerido');
  }

  if (!data.company_rut) {
    errors.push('El RUT de la empresa es requerido');
  }

  if (!data.contact_email) {
    errors.push('El email de contacto es requerido');
  }

  // Validaciones de formato
  if (data.company_rut && !isValidRUT(data.company_rut)) {
    errors.push('El RUT de la empresa no tiene formato válido');
  }

  if (data.contact_email && !isValidEmail(data.contact_email)) {
    errors.push('El email de contacto no tiene formato válido');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    recommendations: generateRecommendations(errors, warnings)
  };
};

/**
 * Genera recomendaciones basadas en errores y advertencias
 * @param {Array} errors - Errores encontrados
 * @param {Array} warnings - Advertencias encontradas
 * @returns {Array} Lista de recomendaciones
 */
const generateRecommendations = (errors, warnings) => {
  const recommendations = [];

  if (errors.length > 0) {
    recommendations.push('Corregir los errores críticos antes de continuar');
  }

  if (warnings.length > 0) {
    recommendations.push('Revisar las advertencias para mejorar la calidad de datos');
  }

  // Recomendaciones específicas
  if (warnings.some(w => w.includes('full_name'))) {
    recommendations.push('Usar legal_representative_name en lugar de full_name para empresas');
  }

  if (warnings.some(w => w.includes('representative_rut'))) {
    recommendations.push('Usar legal_representative_rut en lugar de representative_rut');
  }

  return recommendations;
};

/**
 * Genera un resumen de validación
 * @param {Object} results - Resultados de validación
 * @returns {Object} Resumen
 */
const generateValidationSummary = (results) => {
  const totalErrors = Object.values(results).reduce((sum, result) => sum + result.errors.length, 0);
  const totalWarnings = Object.values(results).reduce((sum, result) => sum + result.warnings.length, 0);

  return {
    totalErrors,
    totalWarnings,
    status: totalErrors === 0 ? (totalWarnings === 0 ? 'PERFECTO' : 'ACEPTABLE') : 'CRÍTICO',
    score: Math.max(0, 100 - (totalErrors * 10) - (totalWarnings * 2))
  };
};

/**
 * Valida formato de RUT chileno
 * @param {string} rut - RUT a validar
 * @returns {boolean} True si es válido
 */
const isValidRUT = (rut) => {
  if (!rut) return false;
  
  // Limpiar RUT
  const cleanRut = rut.replace(/[.-]/g, '');
  
  // Validar formato básico
  if (!/^\d{7,8}[0-9K]$/i.test(cleanRut)) return false;
  
  // Validar dígito verificador
  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toUpperCase();
  
  let sum = 0;
  let multiplier = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const expectedDv = 11 - (sum % 11);
  const calculatedDv = expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : expectedDv.toString();
  
  return calculatedDv === dv;
};

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {boolean} True si es válido
 */
const isValidEmail = (email) => {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Función de logging para validaciones
 * @param {string} level - Nivel de log (info, warning, error)
 * @param {string} message - Mensaje
 * @param {Object} data - Datos adicionales
 */
export const logValidation = (level, message, data = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data
  };

  // En desarrollo, mostrar en consola
  if (process.env.NODE_ENV === 'development') {
    console[level](`[VALIDACIÓN] ${message}`, data);
  }

  // En producción, podría enviarse a un servicio de logging
  // Por ahora, guardar en localStorage para debugging
  const logs = JSON.parse(localStorage.getItem('validation_logs') || '[]');
  logs.push(logEntry);
  
  // Mantener solo los últimos 100 logs
  if (logs.length > 100) {
    logs.splice(0, logs.length - 100);
  }
  
  localStorage.setItem('validation_logs', JSON.stringify(logs));
};

/**
 * Validación automática en tiempo de desarrollo
 * @param {Object} formData - Datos a validar
 * @returns {Object} Resultado con logging automático
 */
export const autoValidate = (formData) => {
  const result = validateCompanyFormData(formData);
  
  // Logging automático
  if (!result.isValid) {
    logValidation('error', 'Validación fallida', {
      errors: result.errors,
      formData: sanitizeFormData(formData)
    });
  }
  
  if (result.warnings.length > 0) {
    logValidation('warning', 'Advertencias de validación', {
      warnings: result.warnings,
      formData: sanitizeFormData(formData)
    });
  }
  
  return result;
};

/**
 * Sanitiza datos para logging (remueve información sensible)
 * @param {Object} formData - Datos a sanitizar
 * @returns {Object} Datos sanitizados
 */
const sanitizeFormData = (formData) => {
  const sanitized = { ...formData };
  
  // Remover información sensible
  if (sanitized.password) delete sanitized.password;
  if (sanitized.accountNumber) sanitized.accountNumber = '***' + sanitized.accountNumber.slice(-4);
  
  return sanitized;
};

export default {
  validateLegalRepresentative,
  validateBankAccountInfo,
  validateCompanyFormData,
  autoValidate,
  logValidation
};