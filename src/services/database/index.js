/**
 * Servicios de Base de Datos
 * 
 * Este archivo re-exporta todos los servicios relacionados con acceso a datos
 * y gestión de la base de datos para mantener una organización limpia.
 */

// Servicios principales
export * from '../databaseService.js';
export * from '../supabaseInstances.js';

// Exportaciones por defecto
export { default as databaseService } from '../databaseService.js';
export { default as supabaseInstances } from '../supabaseInstances.js';