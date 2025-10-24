/**
 * Servicios de Campañas y Marketing
 * 
 * Este archivo re-exporta todos los servicios relacionados con campañas,
 * importación masiva y herramientas de marketing.
 */

// Servicios principales
export * from '../campaignService.js';
export * from '../bulkImportServiceConsolidated.js';

// Exportaciones por defecto
export { default as campaignService } from '../campaignService.js';
export { default as bulkImportService } from '../bulkImportServiceConsolidated.js';

// Exportaciones de compatibilidad para versiones anteriores
export {
  bulkImportServiceFixed as bulkImportServiceFixed,
  validateImportFileFixed,
  validateDebtDataFixed
} from '../bulkImportServiceConsolidated.js';