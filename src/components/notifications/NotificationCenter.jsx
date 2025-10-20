/**
 * Componente: Centro de Notificaciones
 * 
 * Panel desplegable con todas las notificaciones del usuario
 */

import React, { useState } from 'react';
import { Bell, Check, CheckCheck, Archive, Trash2, X } from 'lucide-react';
import { useNotifications } from '../../hooks/gamification/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const NotificationCenter = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification
  } = useNotifications();

  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return n.status === 'unread';
    if (filter === 'read') return n.status === 'read';
    return n.status !== 'archived';
  });

  const getNotificationIcon = (type) => {
    const icons = {
      new_offer: '🎁',
      payment_confirmed: '✅',
      agreement_accepted: '🤝',
      incentive_credited: '💰',
      payment_reminder: '⏰',
      agreement_completed: '🎉',
      message_received: '💬',
      achievement_unlocked: '🏆'
    };
    return icons[type] || '📢';
  };

  const getNotificationColor = (type) => {
    const colors = {
      new_offer: 'bg-blue-50 border-blue-200',
      payment_confirmed: 'bg-green-50 border-green-200',
      agreement_accepted: 'bg-blue-50 border-blue-200',
      incentive_credited: 'bg-yellow-50 border-yellow-200',
      payment_reminder: 'bg-orange-50 border-orange-200',
      agreement_completed: 'bg-green-50 border-green-200',
      message_received: 'bg-blue-50 border-blue-200',
      achievement_unlocked: 'bg-blue-50 border-blue-200'
    };
    return colors[type] || 'bg-gray-50 border-gray-200';
  };

  const handleNotificationClick = async (notification) => {
    if (notification.status === 'unread') {
      await markAsRead(notification.id);
    }
    
    // Redirigir si hay URL de acción
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        onClick={onClose}
      />

      {/* Panel de notificaciones */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-6 h-6 text-gray-700" />
              <h2 className="text-xl font-bold text-gray-900">Notificaciones</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Filtros */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`
                flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${filter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`
                flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${filter === 'unread'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              No leídas
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`
                flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${filter === 'read'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              Leídas
            </button>
          </div>

          {/* Marcar todas como leídas */}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="w-full mt-3 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              Marcar todas como leídas
            </button>
          )}
        </div>

        {/* Lista de notificaciones */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Bell className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay notificaciones</p>
              <p className="text-sm">Cuando tengas notificaciones aparecerán aquí</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    p-4 cursor-pointer transition-colors hover:bg-gray-50
                    ${notification.status === 'unread' ? 'bg-blue-50/50' : ''}
                  `}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    {/* Icono */}
                    <div className="flex-shrink-0">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-xl
                        ${getNotificationColor(notification.type)}
                        border
                      `}>
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`
                          text-sm font-semibold
                          ${notification.status === 'unread' ? 'text-gray-900' : 'text-gray-700'}
                        `}>
                          {notification.title}
                        </h4>
                        {notification.status === 'unread' && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: es
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 mt-3 ml-13">
                    {notification.status === 'unread' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        Marcar leída
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        archiveNotification(notification.id);
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    >
                      <Archive className="w-3 h-3" />
                      Archivar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-100 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationCenter;
