/**
 * Utilidades de Formateo
 * 
 * Funciones para formatear datos de manera consistente en toda la aplicación:
 * - Moneda
 * - Fechas
 * - RUT
 * - Números
 */

import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea un número como moneda chilena (CLP)
 * @param {number|string} amount - Monto a formatear
 * @param {boolean} includeSymbol - Si incluir el símbolo $
 * @returns {string} Monto formateado
 */
export const formatCurrency = (amount, includeSymbol = true) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return includeSymbol ? '$0' : '0';
  
  const formatted = new Intl.NumberFormat('es-CL', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
  
  return includeSymbol ? `$${formatted}` : formatted;
};

/**
 * Formatea una fecha en formato legible
 * @param {string|Date} date - Fecha a formatear
 * @param {string} formatStr - Formato deseado (por defecto: 'dd/MM/yyyy')
 * @returns {string} Fecha formateada
 */
export const formatDate = (date, formatStr = 'dd/MM/yyyy') => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr, { locale: es });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Formatea una fecha con hora
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} Fecha y hora formateada
 */
export const formatDateTime = (date) => {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
};

/**
 * Formatea una fecha como tiempo relativo (ej: "hace 2 horas")
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} Tiempo relativo
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: es });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '';
  }
};

/**
 * Formatea un RUT chileno
 * @param {string} rut - RUT sin formato
 * @returns {string} RUT formateado (ej: 12.345.678-9)
 */
export const formatRut = (rut) => {
  if (!rut) return '';
  
  // Limpiar el RUT de cualquier formato previo
  const cleanRut = rut.replace(/[^\dkK]/g, '');
  
  if (cleanRut.length < 2) return cleanRut;
  
  // Separar cuerpo y dígito verificador
  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toUpperCase();
  
  // Formatear el cuerpo con puntos
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return `${formattedBody}-${dv}`;
};

/**
 * Limpia el formato de un RUT (remueve puntos y guión)
 * @param {string} rut - RUT formateado
 * @returns {string} RUT sin formato
 */
export const cleanRut = (rut) => {
  if (!rut) return '';
  return rut.replace(/[^\dkK]/g, '');
};

/**
 * Valida un RUT chileno
 * @param {string} rut - RUT a validar
 * @returns {boolean} true si el RUT es válido
 */
export const validateRut = (rut) => {
  if (!rut) return false;
  
  const cleanedRut = cleanRut(rut);
  
  if (cleanedRut.length < 8 || cleanedRut.length > 9) return false;
  
  const body = cleanedRut.slice(0, -1);
  const dv = cleanedRut.slice(-1).toUpperCase();
  
  // Calcular dígito verificador
  let sum = 0;
  let multiplier = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const expectedDv = 11 - (sum % 11);
  const calculatedDv = expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : expectedDv.toString();
  
  return dv === calculatedDv;
};

/**
 * Formatea un número de teléfono chileno
 * @param {string} phone - Número de teléfono
 * @returns {string} Teléfono formateado
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  
  // Limpiar el teléfono
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Formato: +56 9 1234 5678
  if (cleanPhone.length === 11 && cleanPhone.startsWith('56')) {
    return `+56 ${cleanPhone[2]} ${cleanPhone.slice(3, 7)} ${cleanPhone.slice(7)}`;
  }
  
  // Formato: 9 1234 5678
  if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) {
    return `${cleanPhone[0]} ${cleanPhone.slice(1, 5)} ${cleanPhone.slice(5)}`;
  }
  
  return phone;
};

/**
 * Formatea un porcentaje
 * @param {number} value - Valor a formatear
 * @param {number} decimals - Cantidad de decimales
 * @returns {string} Porcentaje formateado
 */
export const formatPercentage = (value, decimals = 1) => {
  if (isNaN(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
};

/**
 * Trunca un texto largo
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} Texto truncado
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Capitaliza la primera letra de un texto
 * @param {string} text - Texto a capitalizar
 * @returns {string} Texto capitalizado
 */
export const capitalize = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Capitaliza todas las palabras de un texto
 * @param {string} text - Texto a capitalizar
 * @returns {string} Texto con todas las palabras capitalizadas
 */
export const capitalizeWords = (text) => {
  if (!text) return '';
  return text
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
};

/**
 * Formatea un número de cuenta bancaria
 * @param {string} accountNumber - Número de cuenta
 * @returns {string} Cuenta formateada
 */
export const formatBankAccount = (accountNumber) => {
  if (!accountNumber) return '';
  
  // Mostrar solo los últimos 4 dígitos
  if (accountNumber.length > 4) {
    return `****${accountNumber.slice(-4)}`;
  }
  
  return accountNumber;
};

/**
 * Obtiene las iniciales de un nombre
 * @param {string} name - Nombre completo
 * @returns {string} Iniciales
 */
export const getInitials = (name) => {
  if (!name) return '';
  
  const words = name.trim().split(' ');
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

export default {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatRut,
  cleanRut,
  validateRut,
  formatPhone,
  formatPercentage,
  truncateText,
  capitalize,
  capitalizeWords,
  formatBankAccount,
  getInitials,
};
