/**
 * Utilidades de Validación
 * 
 * Funciones para validar datos de entrada de usuarios
 */

import { VALIDATION_RULES } from '../config/constants';
import { cleanRut } from './formatters';

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {boolean} true si es válido
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  return VALIDATION_RULES.EMAIL_REGEX.test(email);
};

/**
 * Valida una contraseña
 * @param {string} password - Contraseña a validar
 * @returns {Object} { isValid, errors }
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (!password) {
    errors.push('La contraseña es requerida');
    return { isValid: false, errors };
  }
  
  if (password.length < VALIDATION_RULES.MIN_PASSWORD_LENGTH) {
    errors.push(`La contraseña debe tener al menos ${VALIDATION_RULES.MIN_PASSWORD_LENGTH} caracteres`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Valida un RUT chileno
 * @param {string} rut - RUT a validar
 * @returns {Object} { isValid, error }
 */
export const validateRutInput = (rut) => {
  if (!rut) {
    return { isValid: false, error: 'El RUT es requerido' };
  }
  
  const cleanedRut = cleanRut(rut);
  
  if (cleanedRut.length < VALIDATION_RULES.MIN_RUT_LENGTH || 
      cleanedRut.length > VALIDATION_RULES.MAX_RUT_LENGTH) {
    return { isValid: false, error: 'El RUT debe tener entre 8 y 12 caracteres' };
  }
  
  // Validar formato y dígito verificador
  const body = cleanedRut.slice(0, -1);
  const dv = cleanedRut.slice(-1).toUpperCase();
  
  let sum = 0;
  let multiplier = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const expectedDv = 11 - (sum % 11);
  const calculatedDv = expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : expectedDv.toString();
  
  if (dv !== calculatedDv) {
    return { isValid: false, error: 'El RUT ingresado no es válido' };
  }
  
  return { isValid: true, error: null };
};

/**
 * Valida un número de teléfono chileno
 * @param {string} phone - Teléfono a validar
 * @returns {Object} { isValid, error }
 */
export const validatePhone = (phone) => {
  if (!phone) {
    return { isValid: false, error: 'El teléfono es requerido' };
  }
  
  if (!VALIDATION_RULES.PHONE_REGEX.test(phone)) {
    return { isValid: false, error: 'El formato del teléfono no es válido (ej: 912345678)' };
  }
  
  return { isValid: true, error: null };
};

/**
 * Valida un monto
 * @param {number|string} amount - Monto a validar
 * @param {number} minAmount - Monto mínimo permitido
 * @returns {Object} { isValid, error }
 */
export const validateAmount = (amount, minAmount = 0) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return { isValid: false, error: 'El monto debe ser un número válido' };
  }
  
  if (numAmount <= 0) {
    return { isValid: false, error: 'El monto debe ser mayor a cero' };
  }
  
  if (numAmount < minAmount) {
    return { 
      isValid: false, 
      error: `El monto mínimo es $${minAmount.toLocaleString('es-CL')}` 
    };
  }
  
  return { isValid: true, error: null };
};

/**
 * Valida que un campo no esté vacío
 * @param {any} value - Valor a validar
 * @param {string} fieldName - Nombre del campo
 * @returns {Object} { isValid, error }
 */
export const validateRequired = (value, fieldName = 'Este campo') => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return { isValid: false, error: `${fieldName} es requerido` };
  }
  
  return { isValid: true, error: null };
};

/**
 * Valida una fecha
 * @param {string|Date} date - Fecha a validar
 * @param {Object} options - Opciones de validación
 * @returns {Object} { isValid, error }
 */
export const validateDate = (date, options = {}) => {
  const { minDate, maxDate, futureOnly = false, pastOnly = false } = options;
  
  if (!date) {
    return { isValid: false, error: 'La fecha es requerida' };
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: 'La fecha no es válida' };
  }
  
  const now = new Date();
  
  if (futureOnly && dateObj <= now) {
    return { isValid: false, error: 'La fecha debe ser futura' };
  }
  
  if (pastOnly && dateObj >= now) {
    return { isValid: false, error: 'La fecha debe ser pasada' };
  }
  
  if (minDate && dateObj < minDate) {
    return { isValid: false, error: 'La fecha es anterior a la mínima permitida' };
  }
  
  if (maxDate && dateObj > maxDate) {
    return { isValid: false, error: 'La fecha es posterior a la máxima permitida' };
  }
  
  return { isValid: true, error: null };
};

/**
 * Valida un formulario completo
 * @param {Object} data - Datos del formulario
 * @param {Object} rules - Reglas de validación
 * @returns {Object} { isValid, errors }
 */
export const validateForm = (data, rules) => {
  const errors = {};
  let isValid = true;
  
  Object.keys(rules).forEach((field) => {
    const rule = rules[field];
    const value = data[field];
    
    // Validación requerida
    if (rule.required) {
      const result = validateRequired(value, rule.label || field);
      if (!result.isValid) {
        errors[field] = result.error;
        isValid = false;
        return;
      }
    }
    
    // Validación de email
    if (rule.type === 'email' && value) {
      if (!isValidEmail(value)) {
        errors[field] = 'El email no es válido';
        isValid = false;
        return;
      }
    }
    
    // Validación de RUT
    if (rule.type === 'rut' && value) {
      const result = validateRutInput(value);
      if (!result.isValid) {
        errors[field] = result.error;
        isValid = false;
        return;
      }
    }
    
    // Validación de teléfono
    if (rule.type === 'phone' && value) {
      const result = validatePhone(value);
      if (!result.isValid) {
        errors[field] = result.error;
        isValid = false;
        return;
      }
    }
    
    // Validación de monto
    if (rule.type === 'amount' && value) {
      const result = validateAmount(value, rule.min);
      if (!result.isValid) {
        errors[field] = result.error;
        isValid = false;
        return;
      }
    }
    
    // Validación personalizada
    if (rule.validate && typeof rule.validate === 'function') {
      const customResult = rule.validate(value);
      if (customResult !== true) {
        errors[field] = customResult;
        isValid = false;
        return;
      }
    }
  });
  
  return { isValid, errors };
};

/**
 * Valida que dos campos coincidan (ej: contraseña y confirmar contraseña)
 * @param {string} value1 - Primera valor
 * @param {string} value2 - Segundo valor
 * @param {string} fieldName - Nombre del campo
 * @returns {Object} { isValid, error }
 */
export const validateMatch = (value1, value2, fieldName = 'Los campos') => {
  if (value1 !== value2) {
    return { isValid: false, error: `${fieldName} no coinciden` };
  }
  
  return { isValid: true, error: null };
};

/**
 * Valida un rango de valores
 * @param {number} value - Valor a validar
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo
 * @returns {Object} { isValid, error }
 */
export const validateRange = (value, min, max) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return { isValid: false, error: 'El valor debe ser un número válido' };
  }
  
  if (numValue < min || numValue > max) {
    return { 
      isValid: false, 
      error: `El valor debe estar entre ${min} y ${max}` 
    };
  }
  
  return { isValid: true, error: null };
};

export default {
  isValidEmail,
  validatePassword,
  validateRutInput,
  validatePhone,
  validateAmount,
  validateRequired,
  validateDate,
  validateForm,
  validateMatch,
  validateRange,
};
