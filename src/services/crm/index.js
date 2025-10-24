/**
 * Servicios de CRM y Gestión de Clientes
 * 
 * Este archivo re-exporta todos los servicios relacionados con CRM,
 * matching de clientes y gestión de relaciones.
 */

// Servicios principales
export * from '../companyCRMService.js';
export * from '../crmMatchingService.js';
export * from '../debtorMatchingService.js';
export * from '../debtorCorporateMatchingService.js';

// Exportaciones por defecto
export { default as companyCRMService } from '../companyCRMService.js';
export { default as crmMatchingService } from '../crmMatchingService.js';
export { default as debtorMatchingService } from '../debtorMatchingService.js';
export { default as debtorCorporateMatchingService } from '../debtorCorporateMatchingService.js';