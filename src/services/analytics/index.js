/**
 * Servicios de Analítica y Reportes
 * 
 * Este archivo re-exporta todos los servicios relacionados con analítica,
 * reportes, predicciones y métricas del sistema.
 */

// Servicios principales
export * from '../analyticsService.js';
export * from '../predictiveAnalyticsService.js';
export * from '../realTimeAnalyticsService.js';
export * from '../streamingAnalyticsService.js';
export * from '../reportExportService.js';

// Exportaciones por defecto
export { default as analyticsService } from '../analyticsService.js';
export { default as predictiveAnalyticsService } from '../predictiveAnalyticsService.js';
export { default as realTimeAnalyticsService } from '../realTimeAnalyticsService.js';
export { default as streamingAnalyticsService } from '../streamingAnalyticsService.js';
export { default as reportExportService } from '../reportExportService.js';