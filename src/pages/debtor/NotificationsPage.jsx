/**
 * Notifications Page
 *
 * Página para mostrar las notificaciones del deudor
 */

import { Card, Badge, Button, EmptyState } from '../../components/common';
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  Clock,
  Trash2,
} from 'lucide-react';

const NotificationsPage = () => {
  // Mock data
  const notifications = [
    {
      id: '1',
      type: 'new_offer',
      title: 'Nueva oferta disponible',
      message: 'Tienes una nueva oferta de descuento para tu deuda activa',
      status: 'unread',
      created_at: '2024-01-15T10:30:00Z',
    },
    {
      id: '2',
      type: 'payment_confirmed',
      title: 'Pago confirmado',
      message: 'Tu pago de $125.000 ha sido procesado correctamente',
      status: 'read',
      created_at: '2024-01-14T15:20:00Z',
    },
    {
      id: '3',
      type: 'agreement_accepted',
      title: 'Acuerdo aceptado',
      message: 'Tu acuerdo de pago ha sido aceptado por la empresa',
      status: 'read',
      created_at: '2024-01-13T09:15:00Z',
    }
  ];

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_offer':
        return <AlertCircle className="w-5 h-5 text-success-600" />;
      case 'payment_confirmed':
        return <CheckCircle className="w-5 h-5 text-success-600" />;
      case 'agreement_accepted':
        return <CheckCircle className="w-5 h-5 text-primary-600" />;
      default:
        return <Info className="w-5 h-5 text-secondary-600" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'new_offer':
        return 'success';
      case 'payment_confirmed':
        return 'success';
      case 'agreement_accepted':
        return 'primary';
      default:
        return 'secondary';
    }
  };

  const markAsRead = (id) => {
    // Mock function
    console.log('Marcar como leída:', id);
  };

  const markAllAsRead = () => {
    // Mock function
    console.log('Marcar todas como leídas');
  };

  const deleteNotification = (id) => {
    // Mock function
    console.log('Eliminar notificación:', id);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 rounded-3xl p-4 text-white shadow-strong animate-fade-in">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
        </div>

        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold tracking-tight">
                  Notificaciones
                </h1>
                <p className="text-primary-100 text-sm">
                  Mantente al día con tus actividades
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="glass" onClick={markAllAsRead}>
                Marcar todas como leídas
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-12 h-12" />}
          title="No hay notificaciones"
          description="No tienes notificaciones pendientes."
        />
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`hover:shadow-md transition-shadow ${
                notification.status === 'unread' ? 'border-l-4 border-l-primary-500' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-${getNotificationColor(notification.type)}-100`}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-secondary-900">
                        {notification.title}
                      </h3>
                      {notification.status === 'unread' && (
                        <Badge variant="primary">Nuevo</Badge>
                      )}
                    </div>

                    <p className="text-secondary-600 mb-3">
                      {notification.message}
                    </p>

                    <div className="flex items-center gap-2 text-sm text-secondary-500">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(notification.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {notification.status === 'unread' && (
                    <Button variant="secondary" size="sm" onClick={() => markAsRead(notification.id)}>
                      Marcar como leída
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => deleteNotification(notification.id)}
                    className="text-danger-600 hover:text-danger-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      <Card>
        <h3 className="font-semibold text-secondary-900 mb-4">Resumen</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-secondary-50 rounded-lg">
            <div className="text-2xl font-bold text-secondary-900">
              {notifications.filter(n => n.status === 'unread').length}
            </div>
            <div className="text-sm text-secondary-600">No leídas</div>
          </div>
          <div className="text-center p-4 bg-secondary-50 rounded-lg">
            <div className="text-2xl font-bold text-secondary-900">
              {notifications.filter(n => n.status === 'read').length}
            </div>
            <div className="text-sm text-secondary-600">Leídas</div>
          </div>
          <div className="text-center p-4 bg-secondary-50 rounded-lg">
            <div className="text-2xl font-bold text-secondary-900">
              {notifications.length}
            </div>
            <div className="text-sm text-secondary-600">Total</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default NotificationsPage;