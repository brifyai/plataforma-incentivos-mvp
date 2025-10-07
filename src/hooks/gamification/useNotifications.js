/**
 * Hook personalizado para gestionar notificaciones
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import notificationService from '../../services/gamification/notificationService';

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar notificaciones
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const [notificationsData, count] = await Promise.all([
        notificationService.getUserNotifications(user.id, { limit: 50 }),
        notificationService.getUnreadCount(user.id)
      ]);

      setNotifications(notificationsData);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error al cargar notificaciones:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Cargar notificaciones al montar
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Suscribirse a nuevas notificaciones en tiempo real
  useEffect(() => {
    if (!user?.id) return;

    const subscription = notificationService.subscribeToNotifications(
      user.id,
      (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  // Marcar como leída
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, status: 'read', read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error al marcar como leída:', err);
      throw err;
    }
  }, []);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications(prev =>
        prev.map(n => ({ ...n, status: 'read', read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error al marcar todas como leídas:', err);
      throw err;
    }
  }, [user?.id]);

  // Archivar notificación
  const archiveNotification = useCallback(async (notificationId) => {
    try {
      await notificationService.archiveNotification(notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, status: 'archived' } : n
        )
      );
    } catch (err) {
      console.error('Error al archivar notificación:', err);
      throw err;
    }
  }, []);

  // Eliminar notificación
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Actualizar contador si era no leída
      const notification = notifications.find(n => n.id === notificationId);
      if (notification?.status === 'unread') {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error al eliminar notificación:', err);
      throw err;
    }
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    refresh: loadNotifications
  };
};

export default useNotifications;
