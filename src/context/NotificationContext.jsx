/**
 * Notification Context
 * 
 * Maneja las notificaciones de la aplicación:
 * - Notificaciones en tiempo real
 * - Contador de notificaciones sin leer
 * - Marcado de notificaciones como leídas
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/databaseService';
import { supabase } from '../config/supabase';

const NotificationContext = createContext({});

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Cargar notificaciones cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated && user) {
      loadNotifications();
      subscribeToNotifications();
    }

    return () => {
      // Cleanup subscription
    };
  }, [isAuthenticated, user]);

  // Actualizar contador de no leídas cuando cambien las notificaciones
  useEffect(() => {
    const unread = notifications.filter(n => n.status === 'unread').length;
    setUnreadCount(unread);
  }, [notifications]);

  /**
   * Carga las notificaciones del usuario
   */
  const loadNotifications = async () => {
    if (!user) return;

    // Skip loading notifications for god mode user (mock user not in database)
    if (user.id === 'god-mode-user') {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { notifications: userNotifications, error } = await getUserNotifications(user.id);

      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }

      setNotifications(userNotifications || []);
    } catch (error) {
      console.error('Error in loadNotifications:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Suscribe a cambios en tiempo real de notificaciones
   */
  const subscribeToNotifications = () => {
    if (!user || user.id === 'god-mode-user') return;

    // Suscribirse a inserciones de nuevas notificaciones
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('New notification received:', payload);
          setNotifications(prev => [payload.new, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Notification updated:', payload);
          setNotifications(prev =>
            prev.map(n => (n.id === payload.new.id ? payload.new : n))
          );
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  /**
   * Marca una notificación como leída
   */
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const { error } = await markNotificationAsRead(notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      // Actualizar localmente
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, status: 'read', read_at: new Date().toISOString() } : n
        )
      );
    } catch (error) {
      console.error('Error in markAsRead:', error);
    }
  }, []);

  /**
   * Marca todas las notificaciones como leídas
   */
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    // Skip database operation for god mode user
    if (user.id !== 'god-mode-user') {
      try {
        const { error } = await markAllNotificationsAsRead(user.id);

        if (error) {
          console.error('Error marking all notifications as read:', error);
          return;
        }
      } catch (error) {
        console.error('Error in markAllAsRead:', error);
      }
    }

    // Actualizar localmente
    setNotifications(prev =>
      prev.map(n => ({ ...n, status: 'read', read_at: new Date().toISOString() }))
    );
  }, [user]);

  /**
   * Obtiene las notificaciones no leídas
   */
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(n => n.status === 'unread');
  }, [notifications]);

  /**
   * Refresca las notificaciones
   */
  const refresh = useCallback(() => {
    loadNotifications();
  }, [user]);

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    getUnreadNotifications,
    refresh,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
