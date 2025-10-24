/**
 * Servicios Core y Utilidades
 * 
 * Este archivo re-exporta todos los servicios core del sistema,
 * incluyendo experiencia contextual, aprendizaje y servicios utilitarios.
 */

// Servicios principales
export * from '../contextualExperienceService.js';
export * from '../continuousLearningService.js';
export * from '../ecosystemSyncService.js';
export * from '../gamificationService.js';
export * from '../hierarchicalFilterEngine.js';
export * from '../realtimeService.js';

// Exportaciones por defecto
export { default as contextualExperienceService } from '../contextualExperienceService.js';
export { default as continuousLearningService } from '../continuousLearningService.js';
export { default as ecosystemSyncService } from '../ecosystemSyncService.js';
export { default as gamificationService } from '../gamificationService.js';
export { default as hierarchicalFilterEngine } from '../hierarchicalFilterEngine.js';
export { default as realtimeService } from '../realtimeService.js';