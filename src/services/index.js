/**
 * Punto de Entrada Principal de Servicios
 * 
 * Este archivo proporciona acceso centralizado a todos los servicios de NexuPay
 * organizados por categorías funcionales. Mantienes compatibilidad hacia atrás
 * mientras permites imports organizados.
 */

// 🔐 Servicios de Autenticación y Seguridad
export * from './auth/index.js';

// 💾 Servicios de Base de Datos
export * from './database/index.js';

// 💳 Servicios de Pagos y Transacciones
export * from './payments/index.js';

// 🤖 Servicios de Inteligencia Artificial
export * from './ai/index.js';

// 📊 Servicios de Analítica y Reportes
export * from './analytics/index.js';

// 📧 Servicios de Comunicación
export * from './communication/index.js';

// 🎯 Servicios de Campañas y Marketing
export * from './campaigns/index.js';

// 👥 Servicios de CRM y Gestión de Clientes
export * from './crm/index.js';

// 👤 Servicios para Usuarios y Deudores
export * from './user/index.js';

// 🏢 Servicios para Empresas
export * from './company/index.js';

// ⚙️ Servicios del Sistema
export * from './system/index.js';

// 🔧 Servicios Core y Utilidades
export * from './core/index.js';

// 📋 Exportaciones Agrupadas para Conveniencia
export {
  // Auth
  authService,
  securityService,
} from './auth/index.js';

export {
  // Database
  databaseService,
  supabaseInstances,
} from './database/index.js';

export {
  // Payments
  paymentService,
  bankTransferService,
  transferService,
} from './payments/index.js';

export {
  // AI
  aiService,
  aiProvidersService,
  aiImportService,
  advancedAIService,
  ragService,
} from './ai/index.js';

export {
  // Analytics
  analyticsService,
  predictiveAnalyticsService,
  realTimeAnalyticsService,
  streamingAnalyticsService,
  reportExportService,
} from './analytics/index.js';

export {
  // Communication
  emailService,
  emailTemplates,
  messageService,
} from './communication/index.js';

export {
  // Campaigns
  campaignService,
  bulkImportService,
  bulkImportServiceFixed,
} from './campaigns/index.js';

export {
  // CRM
  companyCRMService,
  crmMatchingService,
  debtorMatchingService,
  debtorCorporateMatchingService,
} from './crm/index.js';

export {
  // User
  debtorAIAssistantService,
  debtorAnalyticsService,
  debtorGamificationService,
  adaptiveProfileService,
} from './user/index.js';

export {
  // Company
  knowledgeBaseService,
} from './company/index.js';

export {
  // System
  loggerService,
  verificationService,
  transparentMessageGenerator,
} from './system/index.js';

export {
  // Core
  contextualExperienceService,
  continuousLearningService,
  ecosystemSyncService,
  gamificationService,
  hierarchicalFilterEngine,
  realtimeService,
} from './core/index.js';