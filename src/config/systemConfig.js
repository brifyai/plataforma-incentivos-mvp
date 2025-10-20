/**
 * Configuración Centralizada del Sistema
 *
 * Archivo único para toda la configuración del sistema.
 * Elimina la configuración esparcida en múltiples archivos.
 */

import { supabase } from './supabase';

// =============================================
// CONFIGURACIÓN DE SEGURIDAD
// =============================================

export const SECURITY_CONFIG = {
  // JWT
  JWT_SECRET: 'super-secret-jwt-key-change-in-production-2024',
  JWT_EXPIRES_IN: '24h',
  REFRESH_TOKEN_EXPIRES_IN: '7d',

  // Bcrypt
  SALT_ROUNDS: 12,

  // Rate limiting
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,

  // Session
  SESSION_TIMEOUT_HOURS: 24,
};

// =============================================
// CONFIGURACIÓN DE BASE DE DATOS
// =============================================

export const DATABASE_CONFIG = {
  // Límites de queries
  QUERY_LIMIT_PER_MINUTE: 1000,
  MAX_CONNECTIONS: 100,

  // Backups
  BACKUP_FREQUENCY: 'daily', // 'hourly', 'daily', 'weekly'
  LOG_RETENTION_DAYS: 30,

  // Timeouts
  QUERY_TIMEOUT_MS: 30000,
  CONNECTION_TIMEOUT_MS: 10000,
};

// =============================================
// CONFIGURACIÓN DE AUTENTICACIÓN
// =============================================

export const AUTH_CONFIG = {
  // Credenciales especiales (desde variables de entorno)
  GOD_MODE_CREDENTIALS: {
    email: import.meta.env.VITE_GOD_MODE_EMAIL || 'admin@example.com',
    password: import.meta.env.VITE_GOD_MODE_PASSWORD || 'default_password_change_in_production'
  },

  // OAuth
  OAUTH_ENABLED: true,
  GOOGLE_OAUTH_ENABLED: true,

  // Validación
  USER_VALIDATION_ENABLED: true,
  EMAIL_VERIFICATION_REQUIRED: true,
  PHONE_VERIFICATION_REQUIRED: false,

  // Roles
  ALLOWED_ROLES: ['debtor', 'company', 'god_mode'],
  DEFAULT_ROLE: 'debtor',
};

// =============================================
// CONFIGURACIÓN DE INTEGRACIONES
// =============================================

export const INTEGRATION_CONFIG = {
  // Mercado Pago
  MERCADO_PAGO_ENABLED: true,
  MERCADO_PAGO_SANDBOX: true,

  // WhatsApp
  WHATSAPP_ENABLED: true,
  WHATSAPP_SANDBOX: true,

  // Email (SendGrid)
  EMAIL_ENABLED: true,
  EMAIL_PROVIDER: 'sendgrid',

  // CRM
  CRM_ENABLED: false,
  SUPPORTED_CRMS: ['hubspot', 'salesforce', 'zoho'],
};

// =============================================
// CONFIGURACIÓN DE NOTIFICACIONES
// =============================================

export const NOTIFICATION_CONFIG = {
  // Emails
  EMAIL_NOTIFICATIONS_ENABLED: true,

  // Push notifications
  PUSH_NOTIFICATIONS_ENABLED: false,

  // WhatsApp notifications
  WHATSAPP_NOTIFICATIONS_ENABLED: true,

  // In-app notifications
  IN_APP_NOTIFICATIONS_ENABLED: true,
};

// =============================================
// CONFIGURACIÓN DE INCENTIVOS
// =============================================

export const INCENTIVE_CONFIG = {
  // Porcentajes de incentivo
  DEFAULT_INCENTIVE_PERCENTAGE: 5, // 5%
  MAX_INCENTIVE_PERCENTAGE: 10, // 10%

  // Límites de wallet
  MAX_WALLET_BALANCE: 1000000, // 1 millón de pesos
  MIN_WITHDRAWAL_AMOUNT: 1000, // 1000 pesos

  // Tiempos de expiración
  INCENTIVE_EXPIRATION_DAYS: 365, // 1 año
  AGREEMENT_VALIDITY_DAYS: 30, // 30 días
};

// =============================================
// CONFIGURACIÓN DE DASHBOARD
// =============================================

export const DASHBOARD_CONFIG = {
  // Objetivos
  MONTHLY_PAYMENT_GOAL: 50000000, // 50 millones

  // Límites de visualización
  MAX_RECENT_PAYMENTS: 10,
  MAX_RECENT_ACTIVITIES: 5,
  MAX_PENDING_PAYMENTS: 20,

  // Refresh intervals (ms)
  DASHBOARD_REFRESH_INTERVAL: 30000, // 30 segundos
  NOTIFICATIONS_REFRESH_INTERVAL: 60000, // 1 minuto
};

// =============================================
// CONFIGURACIÓN DE VALIDACIÓN
// =============================================

export const VALIDATION_CONFIG = {
  // Contraseñas
  MIN_PASSWORD_LENGTH: 8,
  REQUIRE_SPECIAL_CHARS: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_UPPERCASE: true,

  // RUT
  RUT_VALIDATION_ENABLED: true,
  RUT_FORMAT_REGEX: /^(\d{1,3}(?:\.\d{1,3}){2}-[\dkK])$/,

  // Emails
  EMAIL_VALIDATION_ENABLED: true,
  EMAIL_FORMAT_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Teléfonos
  PHONE_VALIDATION_ENABLED: true,
  PHONE_FORMAT_REGEX: /^(\+?56)?(\s?)(0?9)(\s?)[98765432]\d{7}$/,
};

// =============================================
// FUNCIONES HELPER PARA CONFIGURACIÓN
// =============================================

/**
 * Obtiene la configuración del sistema desde la base de datos
 * @returns {Promise<Object>} Configuración del sistema
 */
export const getSystemConfig = async () => {
  try {
    const { data, error } = await supabase
      .from('system_config')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading system config:', error);
      return { config: getDefaultConfig(), error: null };
    }

    return { config: data || getDefaultConfig(), error: null };
  } catch (error) {
    console.error('Error in getSystemConfig:', error);
    return { config: getDefaultConfig(), error: error.message };
  }
};

/**
 * Actualiza la configuración del sistema
 * @param {Object} updates - Nuevos valores de configuración
 * @returns {Promise<{error}>}
 */
export const updateSystemConfig = async (updates) => {
  try {
    const { error } = await supabase
      .from('system_config')
      .upsert({
        id: 1, // Siempre usar ID 1 para configuración global
        ...updates,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in updateSystemConfig:', error);
    return { error: error.message };
  }
};

/**
 * Obtiene la configuración por defecto
 * @returns {Object} Configuración por defecto
 */
export const getDefaultConfig = () => ({
  // Seguridad
  oauth_enabled: AUTH_CONFIG.OAUTH_ENABLED,
  user_validation_enabled: AUTH_CONFIG.USER_VALIDATION_ENABLED,
  email_notifications_enabled: NOTIFICATION_CONFIG.EMAIL_NOTIFICATIONS_ENABLED,
  push_notifications_enabled: NOTIFICATION_CONFIG.PUSH_NOTIFICATIONS_ENABLED,

  // Integraciones
  mercado_pago_enabled: INTEGRATION_CONFIG.MERCADO_PAGO_ENABLED,
  whatsapp_enabled: INTEGRATION_CONFIG.WHATSAPP_ENABLED,

  // Base de datos
  query_limit_per_minute: DATABASE_CONFIG.QUERY_LIMIT_PER_MINUTE,
  backup_frequency: DATABASE_CONFIG.BACKUP_FREQUENCY,
  log_retention_days: DATABASE_CONFIG.LOG_RETENTION_DAYS,

  // Objetivos
  monthly_payment_goal: DASHBOARD_CONFIG.MONTHLY_PAYMENT_GOAL,

  // Sistema
  maintenance_mode: false,
  debug_mode: false,
});

/**
 * Verifica si una característica está habilitada
 * @param {string} feature - Nombre de la característica
 * @param {Object} systemConfig - Configuración del sistema
 * @returns {boolean} True si está habilitada
 */
export const isFeatureEnabled = (feature, systemConfig = null) => {
  const config = systemConfig || getDefaultConfig();

  switch (feature) {
    case 'oauth':
      return config.oauth_enabled ?? AUTH_CONFIG.OAUTH_ENABLED;
    case 'user_validation':
      return config.user_validation_enabled ?? AUTH_CONFIG.USER_VALIDATION_ENABLED;
    case 'email_notifications':
      return config.email_notifications_enabled ?? NOTIFICATION_CONFIG.EMAIL_NOTIFICATIONS_ENABLED;
    case 'push_notifications':
      return config.push_notifications_enabled ?? NOTIFICATION_CONFIG.PUSH_NOTIFICATIONS_ENABLED;
    case 'mercado_pago':
      return config.mercado_pago_enabled ?? INTEGRATION_CONFIG.MERCADO_PAGO_ENABLED;
    case 'whatsapp':
      return config.whatsapp_enabled ?? INTEGRATION_CONFIG.WHATSAPP_ENABLED;
    case 'maintenance_mode':
      return config.maintenance_mode ?? false;
    default:
      return false;
  }
};

// =============================================
// EXPORTS
// =============================================

export default {
  SECURITY_CONFIG,
  DATABASE_CONFIG,
  AUTH_CONFIG,
  INTEGRATION_CONFIG,
  NOTIFICATION_CONFIG,
  INCENTIVE_CONFIG,
  DASHBOARD_CONFIG,
  VALIDATION_CONFIG,
  getSystemConfig,
  updateSystemConfig,
  getDefaultConfig,
  isFeatureEnabled,
};