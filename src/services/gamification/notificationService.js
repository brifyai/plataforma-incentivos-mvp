/**
 * Servicio de Notificaciones
 * 
 * Maneja notificaciones in-app y por email
 */

import { supabase } from '../../config/supabase';

/**
 * Obtiene las notificaciones del usuario
 * @param {string} userId - ID del usuario
 * @param {Object} options - Opciones de filtrado
 * @returns {Promise<Array>} Lista de notificaciones
 */
export const getUserNotifications = async (userId, options = {}) => {
  try {
    const {
      status = null,
      limit = 50,
      offset = 0
    } = options;

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    throw error;
  }
};

/**
 * Obtiene el conteo de notificaciones no leídas
 * @param {string} userId - ID del usuario
 * @returns {Promise<number>} Número de notificaciones no leídas
 */
export const getUnreadCount = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'unread');

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error al obtener conteo de no leídas:', error);
    throw error;
  }
};

/**
 * Marca una notificación como leída
 * @param {string} notificationId - ID de la notificación
 * @returns {Promise<Object>} Notificación actualizada
 */
export const markAsRead = async (notificationId) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({
        status: 'read',
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al marcar como leída:', error);
    throw error;
  }
};

/**
 * Marca todas las notificaciones como leídas
 * @param {string} userId - ID del usuario
 * @returns {Promise<void>}
 */
export const markAllAsRead = async (userId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        status: 'read',
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'unread');

    if (error) throw error;
  } catch (error) {
    console.error('Error al marcar todas como leídas:', error);
    throw error;
  }
};

/**
 * Archiva una notificación
 * @param {string} notificationId - ID de la notificación
 * @returns {Promise<Object>} Notificación actualizada
 */
export const archiveNotification = async (notificationId) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ status: 'archived' })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al archivar notificación:', error);
    throw error;
  }
};

/**
 * Elimina una notificación
 * @param {string} notificationId - ID de la notificación
 * @returns {Promise<void>}
 */
export const deleteNotification = async (notificationId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    throw error;
  }
};

/**
 * Crea una nueva notificación
 * @param {Object} notification - Datos de la notificación
 * @returns {Promise<Object>} Notificación creada
 */
export const createNotification = async (notification) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        related_entity_id: notification.relatedEntityId || null,
        related_entity_type: notification.relatedEntityType || null,
        action_url: notification.actionUrl || null,
        metadata: notification.metadata || {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al crear notificación:', error);
    throw error;
  }
};

/**
 * Suscribirse a notificaciones en tiempo real
 * @param {string} userId - ID del usuario
 * @param {Function} callback - Función a ejecutar cuando llega una notificación
 * @returns {Object} Suscripción
 */
export const subscribeToNotifications = (userId, callback) => {
  const subscription = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return subscription;
};

/**
 * Obtiene las preferencias de email del usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Preferencias de email
 */
export const getEmailPreferences = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Si no existen preferencias, crear con valores por defecto
      if (error.code === 'PGRST116') {
        return await createDefaultEmailPreferences(userId);
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error al obtener preferencias de email:', error);
    throw error;
  }
};

/**
 * Actualiza las preferencias de email del usuario
 * @param {string} userId - ID del usuario
 * @param {Object} preferences - Nuevas preferencias
 * @returns {Promise<Object>} Preferencias actualizadas
 */
export const updateEmailPreferences = async (userId, preferences) => {
  try {
    const { data, error } = await supabase
      .from('email_preferences')
      .update(preferences)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al actualizar preferencias de email:', error);
    throw error;
  }
};

/**
 * Crea preferencias de email por defecto
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Preferencias creadas
 */
const createDefaultEmailPreferences = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('email_preferences')
      .insert({
        user_id: userId,
        payment_reminders: true,
        payment_confirmations: true,
        achievement_notifications: true,
        weekly_reports: true,
        monthly_reports: true,
        promotional_emails: true,
        frequency: 'realtime'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al crear preferencias por defecto:', error);
    throw error;
  }
};

/**
 * Programa un email para envío
 * @param {Object} emailData - Datos del email
 * @returns {Promise<Object>} Email programado
 */
export const scheduleEmail = async (emailData) => {
  try {
    const { data, error } = await supabase
      .from('email_queue')
      .insert({
        user_id: emailData.userId,
        email_type: emailData.emailType,
        recipient_email: emailData.recipientEmail,
        subject: emailData.subject,
        body_html: emailData.bodyHtml,
        body_text: emailData.bodyText || null,
        scheduled_for: emailData.scheduledFor || new Date().toISOString(),
        metadata: emailData.metadata || {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al programar email:', error);
    throw error;
  }
};

/**
 * Obtiene el historial de emails enviados
 * @param {string} userId - ID del usuario
 * @param {number} limit - Límite de registros
 * @returns {Promise<Array>} Historial de emails
 */
export const getEmailHistory = async (userId, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al obtener historial de emails:', error);
    throw error;
  }
};

/**
 * Genera el contenido HTML para diferentes tipos de emails
 * @param {string} type - Tipo de email
 * @param {Object} data - Datos para el template
 * @returns {string} HTML del email
 */
export const generateEmailTemplate = (type, data) => {
  const templates = {
    payment_reminder_3days: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1F2937;">Recordatorio de Pago</h2>
        <p>Hola ${data.userName},</p>
        <p>Te recordamos que tienes un pago pendiente en <strong>3 días</strong>.</p>
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Monto:</strong> ${data.amount}</p>
          <p><strong>Fecha de vencimiento:</strong> ${data.dueDate}</p>
          <p><strong>Deuda:</strong> ${data.debtDescription}</p>
        </div>
        <a href="${data.paymentUrl}" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
          Realizar Pago
        </a>
        <p style="color: #6B7280; font-size: 14px; margin-top: 20px;">
          Recuerda que al pagar a tiempo acumulas puntos y desbloqueas beneficios.
        </p>
      </div>
    `,
    
    payment_confirmation: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10B981;">¡Pago Confirmado!</h2>
        <p>Hola ${data.userName},</p>
        <p>Tu pago ha sido procesado exitosamente.</p>
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Monto pagado:</strong> ${data.amount}</p>
          <p><strong>Fecha:</strong> ${data.paymentDate}</p>
          <p><strong>Método:</strong> ${data.paymentMethod}</p>
          <p><strong>Incentivo ganado:</strong> ${data.incentive}</p>
        </div>
        <p style="color: #10B981; font-weight: bold;">
          ¡Has ganado ${data.pointsEarned} puntos!
        </p>
        <a href="${data.dashboardUrl}" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
          Ver Mi Dashboard
        </a>
      </div>
    `,
    
    achievement_unlocked: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B5CF6;">🏆 ¡Nuevo Logro Desbloqueado!</h2>
        <p>Hola ${data.userName},</p>
        <p>¡Felicitaciones! Has desbloqueado una nueva insignia:</p>
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; margin: 20px 0; text-align: center; color: white;">
          <div style="font-size: 48px; margin-bottom: 10px;">${data.badgeIcon || '🏆'}</div>
          <h3 style="margin: 10px 0;">${data.badgeName}</h3>
          <p style="margin: 10px 0;">${data.badgeDescription}</p>
          <p style="font-size: 24px; font-weight: bold; margin-top: 20px;">+${data.pointsReward} puntos</p>
        </div>
        <a href="${data.badgesUrl}" style="display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
          Ver Mis Logros
        </a>
      </div>
    `,
    
    weekly_report: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1F2937;">Tu Resumen Semanal</h2>
        <p>Hola ${data.userName},</p>
        <p>Aquí está tu resumen de actividad de esta semana:</p>
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Estadísticas</h3>
          <p>✅ Pagos realizados: <strong>${data.paymentsCount}</strong></p>
          <p>💰 Total pagado: <strong>${data.totalPaid}</strong></p>
          <p>⭐ Puntos ganados: <strong>${data.pointsEarned}</strong></p>
          <p>🏆 Nuevas insignias: <strong>${data.newBadges}</strong></p>
        </div>
        <div style="background: #EFF6FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #3B82F6;">Próximos Pagos</h3>
          ${data.upcomingPayments.map(p => `
            <p style="margin: 5px 0;">• ${p.description} - ${p.amount} (${p.dueDate})</p>
          `).join('')}
        </div>
        <a href="${data.dashboardUrl}" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
          Ver Dashboard Completo
        </a>
      </div>
    `
  };

  const template = templates[type];
  return template ? template(data) : '';
};

export default {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  archiveNotification,
  deleteNotification,
  createNotification,
  subscribeToNotifications,
  getEmailPreferences,
  updateEmailPreferences,
  scheduleEmail,
  getEmailHistory,
  generateEmailTemplate
};
