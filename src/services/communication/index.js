/**
 * Servicios de Comunicación
 * 
 * Este archivo re-exporta todos los servicios relacionados con comunicación,
 * envío de emails, plantillas y mensajería.
 */

// Servicios principales
export * from '../emailService.js';
export * from '../emailTemplates.js';
export * from '../messageService.js';

// Exportaciones por defecto
export { default as emailService } from '../emailService.js';
export { default as emailTemplates } from '../emailTemplates.js';
export { default as messageService } from '../messageService.js';