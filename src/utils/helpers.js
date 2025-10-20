/**
 * Utilidades Helper
 * 
 * Funciones auxiliares diversas para la aplicación
 */

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina clases de Tailwind CSS de manera inteligente
 * @param {...any} inputs - Clases a combinar
 * @returns {string} Clases combinadas
 */
export const cn = (...inputs) => {
  return twMerge(clsx(inputs));
};

/**
 * Genera un color aleatorio para avatares
 * @param {string} seed - Semilla para generar color consistente
 * @returns {string} Color en formato hex
 */
export const generateAvatarColor = (seed) => {
  if (!seed) return '#3B82F6'; // Azul por defecto
  
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#14B8A6', // teal
    '#F97316', // orange
  ];
  
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Espera un tiempo determinado (útil para simulaciones)
 * @param {number} ms - Milisegundos a esperar
 * @returns {Promise}
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Debounce de una función
 * @param {Function} func - Función a hacer debounce
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} Función con debounce
 */
export const debounce = (func, wait) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle de una función
 * @param {Function} func - Función a hacer throttle
 * @param {number} limit - Límite de tiempo en ms
 * @returns {Function} Función con throttle
 */
export const throttle = (func, limit) => {
  let inThrottle;
  
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Copia texto al portapapeles
 * @param {string} text - Texto a copiar
 * @returns {Promise<boolean>} true si se copió exitosamente
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
};

/**
 * Descarga un archivo
 * @param {string} data - Datos del archivo
 * @param {string} filename - Nombre del archivo
 * @param {string} type - Tipo MIME
 */
export const downloadFile = (data, filename, type = 'text/plain') => {
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Obtiene parámetros de la URL
 * @param {string} param - Nombre del parámetro
 * @returns {string|null} Valor del parámetro
 */
export const getUrlParam = (param) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
};

/**
 * Actualiza parámetros de la URL sin recargar
 * @param {Object} params - Parámetros a actualizar
 */
export const updateUrlParams = (params) => {
  const url = new URL(window.location.href);
  
  Object.keys(params).forEach(key => {
    if (params[key] === null || params[key] === undefined) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, params[key]);
    }
  });
  
  window.history.pushState({}, '', url);
};

/**
 * Agrupa un array por una propiedad
 * @param {Array} array - Array a agrupar
 * @param {string} key - Propiedad por la cual agrupar
 * @returns {Object} Objeto con elementos agrupados
 */
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    result[group] = result[group] || [];
    result[group].push(item);
    return result;
  }, {});
};

/**
 * Ordena un array por una propiedad
 * @param {Array} array - Array a ordenar
 * @param {string} key - Propiedad por la cual ordenar
 * @param {string} order - 'asc' o 'desc'
 * @returns {Array} Array ordenado
 */
export const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Filtra un array por múltiples criterios
 * @param {Array} array - Array a filtrar
 * @param {Object} filters - Objeto con filtros
 * @returns {Array} Array filtrado
 */
export const filterBy = (array, filters) => {
  return array.filter(item => {
    return Object.keys(filters).every(key => {
      const filterValue = filters[key];
      const itemValue = item[key];
      
      if (filterValue === null || filterValue === undefined || filterValue === '') {
        return true;
      }
      
      if (Array.isArray(filterValue)) {
        return filterValue.includes(itemValue);
      }
      
      return itemValue === filterValue;
    });
  });
};

/**
 * Calcula el promedio de un array de números
 * @param {Array<number>} numbers - Array de números
 * @returns {number} Promedio
 */
export const average = (numbers) => {
  if (!numbers || numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return sum / numbers.length;
};

/**
 * Calcula la suma de un array de números
 * @param {Array<number>} numbers - Array de números
 * @returns {number} Suma
 */
export const sum = (numbers) => {
  if (!numbers || numbers.length === 0) return 0;
  return numbers.reduce((acc, num) => acc + num, 0);
};

/**
 * Genera un ID único simple
 * @returns {string} ID único
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Verifica si un objeto está vacío
 * @param {Object} obj - Objeto a verificar
 * @returns {boolean} true si está vacío
 */
export const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

/**
 * Deep clone de un objeto
 * @param {any} obj - Objeto a clonar
 * @returns {any} Clon del objeto
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Compara dos objetos de manera superficial
 * @param {Object} obj1 - Primer objeto
 * @param {Object} obj2 - Segundo objeto
 * @returns {boolean} true si son iguales
 */
export const shallowEqual = (obj1, obj2) => {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  return keys1.every(key => obj1[key] === obj2[key]);
};

/**
 * Obtiene un valor anidado de un objeto de manera segura
 * @param {Object} obj - Objeto
 * @param {string} path - Ruta al valor (ej: 'user.profile.name')
 * @param {any} defaultValue - Valor por defecto
 * @returns {any} Valor encontrado o valor por defecto
 */
export const getNestedValue = (obj, path, defaultValue = undefined) => {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result !== undefined ? result : defaultValue;
};

/**
 * Capitaliza la primera letra de cada palabra
 * @param {string} str - String a capitalizar
 * @returns {string} String capitalizado
 */
export const capitalizeWords = (str) => {
  if (!str) return '';
  return str.replace(/\b\w/g, char => char.toUpperCase());
};

/**
 * Limpia y normaliza un string
 * @param {string} str - String a limpiar
 * @returns {string} String limpio
 */
export const cleanString = (str) => {
  if (!str) return '';
  return str.trim().replace(/\s+/g, ' ');
};

/**
 * Verifica si el usuario está en un dispositivo móvil
 * @returns {boolean} true si es móvil
 */
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Detecta el navegador del usuario
 * @returns {string} Nombre del navegador
 */
export const detectBrowser = () => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  
  return 'Unknown';
};

/**
 * Formatea un error para mostrar al usuario
 * @param {Error|string} error - Error a formatear
 * @returns {string} Mensaje de error formateado
 */
export const formatError = (error) => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  return 'Ha ocurrido un error inesperado';
};

/**
 * Calcula un porcentaje
 * @param {number} value - Valor
 * @param {number} total - Total
 * @returns {number} Porcentaje
 */
export const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

/**
 * Limita un valor entre un mínimo y máximo
 * @param {number} value - Valor a limitar
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo
 * @returns {number} Valor limitado
 */
export const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

export default {
  cn,
  generateAvatarColor,
  sleep,
  debounce,
  throttle,
  copyToClipboard,
  downloadFile,
  getUrlParam,
  updateUrlParams,
  groupBy,
  sortBy,
  filterBy,
  average,
  sum,
  generateId,
  isEmpty,
  deepClone,
  shallowEqual,
  getNestedValue,
  capitalizeWords,
  cleanString,
  isMobile,
  detectBrowser,
  formatError,
  calculatePercentage,
  clamp,
};
