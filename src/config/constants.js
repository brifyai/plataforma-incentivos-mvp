/**
 * Constantes de la aplicación
 * 
 * Centraliza todas las constantes y configuraciones utilizadas en la aplicación
 */

// Roles de usuario (solo 3 tipos principales)
export const USER_ROLES = {
  DEBTOR: 'debtor',      // Solo personas (deudores)
  COMPANY: 'company',    // Solo empresas (cobranzas)
  GOD_MODE: 'god_mode',  // Modo dios (administradores)
};

// Estados de validación
export const VALIDATION_STATUS = {
  PENDING: 'pending',
  VALIDATED: 'validated',
  REJECTED: 'rejected',
};

// Estados de deuda
export const DEBT_STATUS = {
  ACTIVE: 'active',
  IN_NEGOTIATION: 'in_negotiation',
  PAID: 'paid',
  CONDONED: 'condoned',
  DEFAULTED: 'defaulted',
};

// Tipos de deuda
export const DEBT_TYPES = {
  CREDIT_CARD: 'credit_card',
  LOAN: 'loan',
  SERVICE: 'service',
  MORTGAGE: 'mortgage',
  OTHER: 'other',
};

// Etiquetas legibles para tipos de deuda
export const DEBT_TYPE_LABELS = {
  [DEBT_TYPES.CREDIT_CARD]: 'Tarjeta de Crédito',
  [DEBT_TYPES.LOAN]: 'Préstamo',
  [DEBT_TYPES.SERVICE]: 'Servicio',
  [DEBT_TYPES.MORTGAGE]: 'Hipoteca',
  [DEBT_TYPES.OTHER]: 'Otro',
};

// Estados de oferta
export const OFFER_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  USED: 'used',
};

// Tipos de oferta
export const OFFER_TYPES = {
  DISCOUNT: 'discount',
  INSTALLMENT_PLAN: 'installment_plan',
  RENEGOTIATION: 'renegotiation',
  PARTIAL_CONDONATION: 'partial_condonation',
};

// Etiquetas legibles para tipos de oferta
export const OFFER_TYPE_LABELS = {
  [OFFER_TYPES.DISCOUNT]: 'Descuento por Pago Total',
  [OFFER_TYPES.INSTALLMENT_PLAN]: 'Plan de Cuotas',
  [OFFER_TYPES.RENEGOTIATION]: 'Renegociación',
  [OFFER_TYPES.PARTIAL_CONDONATION]: 'Condonación Parcial',
};

// Estados de acuerdo
export const AGREEMENT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  DEFAULTED: 'defaulted',
  CANCELLED: 'cancelled',
};

// Estados de pago
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

// Métodos de pago
export const PAYMENT_METHODS = {
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  BANK_TRANSFER: 'bank_transfer',
  MERCADOPAGO: 'mercadopago',
  WALLET: 'wallet',
};

// Etiquetas legibles para métodos de pago
export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.CREDIT_CARD]: 'Tarjeta de Crédito',
  [PAYMENT_METHODS.DEBIT_CARD]: 'Tarjeta de Débito',
  [PAYMENT_METHODS.BANK_TRANSFER]: 'Transferencia Bancaria',
  [PAYMENT_METHODS.MERCADOPAGO]: 'Mercado Pago',
  [PAYMENT_METHODS.WALLET]: 'Billetera Virtual',
};

// Tipos de transacción de wallet
export const WALLET_TRANSACTION_TYPES = {
  CREDIT: 'credit',
  DEBIT: 'debit',
};

// Conceptos de transacción
export const TRANSACTION_CONCEPTS = {
  PAYMENT_INCENTIVE: 'payment_incentive',
  WITHDRAWAL: 'withdrawal',
  CROSS_PAYMENT: 'cross_payment',
  GIFT_CARD_REDEMPTION: 'gift_card_redemption',
};

// Tipos de notificación
export const NOTIFICATION_TYPES = {
  NEW_OFFER: 'new_offer',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  AGREEMENT_ACCEPTED: 'agreement_accepted',
  INCENTIVE_CREDITED: 'incentive_credited',
  PAYMENT_REMINDER: 'payment_reminder',
  AGREEMENT_COMPLETED: 'agreement_completed',
  MESSAGE_RECEIVED: 'message_received',
};

// Estados de notificación
export const NOTIFICATION_STATUS = {
  UNREAD: 'unread',
  READ: 'read',
  ARCHIVED: 'archived',
};

// Configuración de paginación
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};

// Configuración de comisiones e incentivos (valores por defecto)
export const COMMISSION_CONFIG = {
  DEFAULT_COMMISSION_PERCENTAGE: 15, // 15% de comisión a la plataforma
  DEFAULT_USER_INCENTIVE_PERCENTAGE: 5, // 5% de incentivo al usuario
  PLATFORM_SHARE: 40, // 40% de la comisión es para la plataforma
  USER_INCENTIVE_SHARE: 40, // 40% de la comisión va al usuario
  OPERATIONAL_COSTS_SHARE: 20, // 20% de la comisión son costos operativos
};

// Límites y validaciones
export const VALIDATION_RULES = {
  MIN_PASSWORD_LENGTH: 6,
  MIN_WITHDRAWAL_AMOUNT: 10000, // $10.000 CLP mínimo para retiro
  MAX_DAILY_WITHDRAWAL: 500000, // $500.000 CLP máximo por día
  MIN_RUT_LENGTH: 8,
  MAX_RUT_LENGTH: 12,
  PHONE_REGEX: /^(\+?56)?[9]\d{8}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  RUT_REGEX: /^(\d{1,2}\.)?\d{3}\.\d{3}-[\dkK]$/,
};

// Formatos
export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm',
  API: 'yyyy-MM-dd',
  API_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss'Z'",
};

// URLs y rutas
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/registro',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  // Rutas de Deudor
  DEBTOR_DASHBOARD: '/debtor/dashboard',
  DEBTOR_DEBTS: '/debtor/debts',
  DEBTOR_OFFERS: '/debtor/offers',
  DEBTOR_AGREEMENTS: '/debtor/agreements',
  DEBTOR_PAYMENTS: '/debtor/payments',
  DEBTOR_WALLET: '/debtor/wallet',
  DEBTOR_NOTIFICATIONS: '/debtor/notifications',
  DEBTOR_MESSAGES: '/debtor/messages',
  DEBTOR_PROFILE: '/debtor/profile',
  
  // Rutas de Empresa
  COMPANY_DASHBOARD: '/company/dashboard',
  COMPANY_DEBTORS: '/company/debtors',
  COMPANY_DEBTS: '/company/debts',
  COMPANY_OFFERS: '/company/offers',
  COMPANY_AGREEMENTS: '/company/agreements',
  COMPANY_PAYMENTS: '/company/payments',
  COMPANY_ANALYTICS: '/company/analytics',
  COMPANY_MESSAGES: '/company/messages',
  COMPANY_PROFILE: '/company/profile',
};

// Configuración de Mercado Pago
export const MERCADOPAGO_CONFIG = {
  PUBLIC_KEY: import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY,
  LOCALE: 'es-CL',
  CURRENCY: 'CLP',
};

// Configuración de WhatsApp
export const WHATSAPP_CONFIG = {
  PHONE_NUMBER: import.meta.env.VITE_WHATSAPP_PHONE_NUMBER || '56912345678',
  DEFAULT_MESSAGE: import.meta.env.VITE_WHATSAPP_DEFAULT_MESSAGE || 'Hola, necesito ayuda con la plataforma de incentivos',
};

// Mensajes de error comunes
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión. Por favor, verifica tu conexión a internet.',
  UNAUTHORIZED: 'No tienes autorización para realizar esta acción.',
  NOT_FOUND: 'El recurso solicitado no fue encontrado.',
  SERVER_ERROR: 'Error del servidor. Por favor, intenta de nuevo más tarde.',
  VALIDATION_ERROR: 'Por favor, verifica los datos ingresados.',
  SESSION_EXPIRED: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
};

// Mensajes de éxito comunes
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Perfil actualizado correctamente.',
  PAYMENT_SUCCESSFUL: 'Pago realizado exitosamente.',
  OFFER_ACCEPTED: 'Oferta aceptada correctamente.',
  AGREEMENT_CREATED: 'Acuerdo creado exitosamente.',
  NOTIFICATION_MARKED_READ: 'Notificación marcada como leída.',
};

// Colores para estados (usados en badges y indicadores)
export const STATUS_COLORS = {
  // Estados de deuda
  [DEBT_STATUS.ACTIVE]: 'info',
  [DEBT_STATUS.IN_NEGOTIATION]: 'warning',
  [DEBT_STATUS.PAID]: 'success',
  [DEBT_STATUS.CONDONED]: 'success',
  [DEBT_STATUS.DEFAULTED]: 'danger',
  
  // Estados de oferta
  [OFFER_STATUS.ACTIVE]: 'success',
  [OFFER_STATUS.EXPIRED]: 'danger',
  [OFFER_STATUS.CANCELLED]: 'danger',
  [OFFER_STATUS.USED]: 'info',
  
  // Estados de acuerdo
  [AGREEMENT_STATUS.ACTIVE]: 'info',
  [AGREEMENT_STATUS.COMPLETED]: 'success',
  [AGREEMENT_STATUS.DEFAULTED]: 'danger',
  [AGREEMENT_STATUS.CANCELLED]: 'danger',
  
  // Estados de pago
  [PAYMENT_STATUS.PENDING]: 'warning',
  [PAYMENT_STATUS.COMPLETED]: 'success',
  [PAYMENT_STATUS.FAILED]: 'danger',
  [PAYMENT_STATUS.REFUNDED]: 'info',
};

export default {
  USER_ROLES,
  VALIDATION_STATUS,
  DEBT_STATUS,
  DEBT_TYPES,
  DEBT_TYPE_LABELS,
  OFFER_STATUS,
  OFFER_TYPES,
  OFFER_TYPE_LABELS,
  AGREEMENT_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  WALLET_TRANSACTION_TYPES,
  TRANSACTION_CONCEPTS,
  NOTIFICATION_TYPES,
  NOTIFICATION_STATUS,
  PAGINATION,
  COMMISSION_CONFIG,
  VALIDATION_RULES,
  DATE_FORMATS,
  ROUTES,
  MERCADOPAGO_CONFIG,
  WHATSAPP_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  STATUS_COLORS,
};
