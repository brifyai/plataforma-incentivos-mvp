/**
 * Export Utilities
 *
 * Utilidades para exportar datos en diferentes formatos
 */

/**
 * Exporta datos a CSV
 * @param {Array} data - Array de objetos a exportar
 * @param {string} filename - Nombre del archivo (sin extensión)
 * @param {Array} headers - Headers personalizados (opcional)
 */
export const exportToCSV = (data, filename, headers = null) => {
  if (!data || data.length === 0) {
    throw new Error('No hay datos para exportar');
  }

  // Obtener headers del primer objeto si no se proporcionan
  const csvHeaders = headers || Object.keys(data[0]);

  // Crear contenido CSV
  const csvContent = [
    // Headers
    csvHeaders.join(','),

    // Filas de datos
    ...data.map(row =>
      csvHeaders.map(header => {
        const value = row[header];

        // Manejar valores null/undefined
        if (value == null) return '';

        // Escapar comillas y envolver en comillas si contiene comas o comillas
        const stringValue = value.toString();
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Crear blob y descargar
  downloadFile(csvContent, `${filename}.csv`, 'text/csv');
};

/**
 * Exporta datos a JSON
 * @param {Array|Object} data - Datos a exportar
 * @param {string} filename - Nombre del archivo (sin extensión)
 */
export const exportToJSON = (data, filename) => {
  if (!data) {
    throw new Error('No hay datos para exportar');
  }

  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, `${filename}.json`, 'application/json');
};

/**
 * Exporta datos a Excel (CSV con formato especial)
 * @param {Array} data - Array de objetos a exportar
 * @param {string} filename - Nombre del archivo (sin extensión)
 */
export const exportToExcel = (data, filename) => {
  // Para Excel, usamos CSV con BOM para encoding UTF-8
  const BOM = '\uFEFF';

  if (!data || data.length === 0) {
    throw new Error('No hay datos para exportar');
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join('\t'), // Usar tabuladores para Excel
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        return value == null ? '' : value.toString();
      }).join('\t')
    )
  ].join('\n');

  downloadFile(BOM + csvContent, `${filename}.xls`, 'application/vnd.ms-excel');
};

/**
 * Función auxiliar para descargar archivos
 * @param {string} content - Contenido del archivo
 * @param {string} filename - Nombre del archivo
 * @param {string} mimeType - Tipo MIME
 */
const downloadFile = (content, filename, mimeType) => {
  // Crear blob
  const blob = new Blob([content], { type: mimeType + ';charset=utf-8;' });

  // Crear URL del blob
  const url = URL.createObjectURL(blob);

  // Crear elemento de enlace y simular click
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  // Agregar al DOM, hacer click y remover
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Liberar URL del blob
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

/**
 * Formatea datos para exportación
 * @param {Array} data - Datos originales
 * @param {Object} formatConfig - Configuración de formato
 * @returns {Array} Datos formateados
 */
export const formatDataForExport = (data, formatConfig = {}) => {
  const {
    dateFields = [],
    currencyFields = [],
    booleanFields = [],
    customFormatters = {}
  } = formatConfig;

  return data.map(item => {
    const formattedItem = { ...item };

    // Formatear fechas
    dateFields.forEach(field => {
      if (formattedItem[field]) {
        formattedItem[field] = new Date(formattedItem[field]).toLocaleDateString();
      }
    });

    // Formatear monedas
    currencyFields.forEach(field => {
      if (formattedItem[field] != null) {
        formattedItem[field] = `$${parseFloat(formattedItem[field]).toLocaleString()}`;
      }
    });

    // Formatear booleanos
    booleanFields.forEach(field => {
      if (formattedItem[field] != null) {
        formattedItem[field] = formattedItem[field] ? 'Sí' : 'No';
      }
    });

    // Aplicar formateadores personalizados
    Object.entries(customFormatters).forEach(([field, formatter]) => {
      if (formattedItem[field] != null && typeof formatter === 'function') {
        formattedItem[field] = formatter(formattedItem[field]);
      }
    });

    return formattedItem;
  });
};

/**
 * Exporta datos con formato automático
 * @param {Array} data - Datos a exportar
 * @param {string} filename - Nombre base del archivo
 * @param {string} format - Formato ('csv', 'json', 'excel')
 * @param {Object} formatConfig - Configuración de formato
 */
export const exportData = (data, filename, format = 'csv', formatConfig = {}) => {
  const formattedData = formatDataForExport(data, formatConfig);

  switch (format.toLowerCase()) {
    case 'csv':
      return exportToCSV(formattedData, filename);
    case 'json':
      return exportToJSON(formattedData, filename);
    case 'excel':
    case 'xls':
      return exportToExcel(formattedData, filename);
    default:
      throw new Error(`Formato no soportado: ${format}`);
  }
};

export default {
  exportToCSV,
  exportToJSON,
  exportToExcel,
  exportData,
  formatDataForExport,
};