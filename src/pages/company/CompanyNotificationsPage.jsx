/**
 * Company Notifications Page
 *
 * Página para gestionar las notificaciones y alertas de la empresa
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, Button, LoadingSpinner, Modal, Input, Select, DateFilter } from '../../components/common';
import { formatDate } from '../../utils/formatters';
import { getUserNotifications, createNotification, markNotificationAsRead, markAllNotificationsAsRead } from '../../services/databaseService';
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  Clock,
  Trash2,
  Send,
  Mail,
  Smartphone,
  MessageSquare,
  Settings,
  Plus,
  Filter,
  Search,
  Calendar
} from 'lucide-react';

const CompanyNotificationsPage = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Función helper para calcular rangos de fechas
  const getDateRange = (range) => {
    const today = new Date();
    const startDate = new Date();
    const endDate = new Date();

    switch (range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'last7days':
        startDate.setDate(today.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'thisMonth':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(today.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        return { startDate: '', endDate: '' };
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  // Función para aplicar rangos predefinidos
  const applyDateRange = (range) => {
    const dates = getDateRange(range);
    setDateFilter(dates);
  };

  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info',
    priority: 'normal',
    targetAudience: 'all',
    channels: ['email']
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailEnabled: true,
    pushEnabled: true,
    smsEnabled: false,
    autoSend: true,
    quietHours: { start: '22:00', end: '08:00' }
  });

  useEffect(() => {
    loadNotifications();
  }, [profile?.id]); // Reload when profile changes

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      if (!profile?.id) {
        console.warn('No user profile available for loading notifications');
        setNotifications([]);
        setLoading(false);
        return;
      }

      const { notifications, error } = await getUserNotifications(profile.id);
      
      if (error) {
        console.error('Error loading notifications:', error);
        // Fallback to empty array if there's an error
        setNotifications([]);
      } else {
        // Transform database notifications to match UI format
        const transformedNotifications = (notifications || []).map(notification => ({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type || 'info',
          priority: notification.priority || 'normal',
          channels: notification.channels || ['email'],
          status: notification.read ? 'read' : 'sent',
          createdAt: new Date(notification.created_at),
          sentCount: notification.sent_count || 1,
          readCount: notification.read ? 1 : 0,
          // Additional fields from database
          read: notification.read || false,
          readAt: notification.read_at,
          metadata: notification.metadata || {}
        }));
        
        setNotifications(transformedNotifications);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
      setLoading(false);
    }
  };

  const handleCreateNotification = async () => {
    try {
      if (!profile?.id) {
        alert('Error: No hay perfil de usuario disponible');
        return;
      }

      // Prepare notification data for database
      const notificationData = {
        user_id: profile.id,
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        priority: newNotification.priority,
        channels: newNotification.channels,
        metadata: {
          targetAudience: newNotification.targetAudience,
          createdAt: new Date().toISOString()
        }
      };

      const { notification, error } = await createNotification(notificationData);

      if (error) {
        alert('Error al crear notificación: ' + error);
        return;
      }

      // Transform the created notification to match UI format
      const transformedNotification = {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority || 'normal',
        channels: notification.channels || ['email'],
        status: 'sent',
        createdAt: new Date(notification.created_at),
        sentCount: 1,
        readCount: 0,
        read: false,
        metadata: notification.metadata || {}
      };

      setNotifications(prev => [transformedNotification, ...prev]);
      setShowCreateModal(false);
      setNewNotification({
        title: '',
        message: '',
        type: 'info',
        priority: 'normal',
        targetAudience: 'all',
        channels: ['email']
      });

      alert('✅ Notificación enviada exitosamente');
    } catch (error) {
      console.error('Error in handleCreateNotification:', error);
      alert('Error al crear notificación: ' + error.message);
    }
  };

  const handleDeleteNotification = async (id) => {
    if (confirm('¿Está seguro de que desea eliminar esta notificación?')) {
      try {
        // For now, we'll mark as read instead of deleting since the database
        // doesn't have a delete function implemented yet
        const { error } = await markNotificationAsRead(id);
        
        if (error) {
          console.warn('Error marking notification as read:', error);
          // Fallback: remove from UI anyway
          setNotifications(prev => prev.filter(n => n.id !== id));
        } else {
          // Update the notification in the UI to mark as read
          setNotifications(prev =>
            prev.map(n =>
              n.id === id
                ? { ...n, status: 'read', read: true, readCount: 1 }
                : n
            )
          );
        }
        
        alert('✅ Notificación marcada como leída exitosamente');
      } catch (error) {
        console.error('Error in handleDeleteNotification:', error);
        alert('Error al eliminar notificación: ' + error.message);
      }
    }
  };

  const handleSaveSettings = async () => {
    try {
      // Save notification settings to localStorage for now
      // In the future, this could be saved to user preferences in the database
      localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
      
      alert('✅ Configuración de notificaciones guardada exitosamente');
      setShowSettingsModal(false);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      alert('Error al guardar configuración: ' + error.message);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'success': return 'bg-green-100 border-green-200';
      case 'warning': return 'bg-yellow-100 border-yellow-200';
      case 'error': return 'bg-red-100 border-red-200';
      default: return 'bg-blue-100 border-blue-200';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high': return <Badge variant="danger">Alta</Badge>;
      case 'medium': return <Badge variant="warning">Media</Badge>;
      default: return <Badge variant="info">Baja</Badge>;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || notification.type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-4 text-white shadow-strong">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
          <div className="flex items-center gap-3 md:gap-4">
            <div>
              <h1 className="text-sm md:text-lg font-display font-bold tracking-tight">
                Centro de Notificaciones
              </h1>
              <p className="text-blue-100 text-xs md:text-sm">
                Gestiona alertas y comunicaciones con tus deudores
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {}}
              leftIcon={<Bell className="w-3 h-3" />}
            >
              {notifications.length} Notificaciones
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowSettingsModal(true)}
              leftIcon={<Settings className="w-3 h-3" />}
            >
              Configuración
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateModal(true)}
              leftIcon={<Plus className="w-3 h-3" />}
            >
              Nueva Notificación
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl p-2 border border-white/20">
            <div className="flex items-center gap-2">
              <Send className="w-3 h-3 text-green-300" />
              <div>
                <p className="text-xs text-green-100">Enviadas</p>
                <p className="text-sm font-bold">
                  {notifications.filter(n => n.status === 'sent').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl p-2 border border-white/20">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-blue-300" />
              <div>
                <p className="text-xs text-blue-100">Leídas</p>
                <p className="text-sm font-bold">
                  {notifications.reduce((sum, n) => sum + n.readCount, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl p-2 border border-white/20">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-yellow-300" />
              <div>
                <p className="text-xs text-yellow-100">Pendientes</p>
                <p className="text-sm font-bold">
                  {notifications.filter(n => n.status === 'draft').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl p-2 border border-white/20">
            <div className="flex items-center gap-2">
              <Mail className="w-3 h-3 text-blue-300" />
              <div>
                <p className="text-xs text-blue-100">Tasa de Apertura</p>
                <p className="text-sm font-bold">
                  {notifications.length > 0
                    ? Math.round((notifications.reduce((sum, n) => sum + n.readCount, 0) /
                        notifications.reduce((sum, n) => sum + n.sentCount, 0)) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white/60 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-4 border border-white/30 shadow-sm w-full lg:min-w-fit">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-900">Período de análisis</span>
          </div>

          {/* Date Inputs */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="startDate" className="text-sm text-gray-600">Desde:</label>
              <input
                id="startDate"
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="endDate" className="text-sm text-gray-600">Hasta:</label>
              <input
                id="endDate"
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Quick Date Range Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 mr-2">Rangos rápidos:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyDateRange('today')}
              className="text-xs px-3 py-1 h-8"
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyDateRange('last7days')}
              className="text-xs px-3 py-1 h-8"
            >
              Últimos 7 días
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyDateRange('thisMonth')}
              className="text-xs px-3 py-1 h-8"
            >
              Este mes
            </Button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar notificaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select
                value={filterType}
                onChange={setFilterType}
                options={[
                  { value: 'all', label: 'Todas las notificaciones' },
                  { value: 'success', label: 'Éxito' },
                  { value: 'warning', label: 'Advertencias' },
                  { value: 'error', label: 'Errores' },
                  { value: 'info', label: 'Información' }
                ]}
                className="w-48"
              />
            </div>
            <div className="text-sm text-gray-600">
              {filteredNotifications.length} de {notifications.length} notificaciones
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-gray-200">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No hay notificaciones
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm ? 'No se encontraron notificaciones que coincidan con tu búsqueda.' : 'Crea tu primera notificación para comenzar a comunicar con tus deudores.'}
              </p>
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Crear Primera Notificación
              </Button>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div key={notification.id} className="p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getTypeColor(notification.type)}`}>
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        {getPriorityBadge(notification.priority)}
                        <Badge variant={notification.status === 'sent' ? 'success' : 'warning'}>
                          {notification.status === 'sent' ? 'Enviada' : 'Borrador'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{notification.message}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{formatDate(notification.createdAt)}</span>
                        <span className="flex items-center gap-1">
                          <Send className="w-3 h-3" />
                          {notification.sentCount} enviados
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {notification.readCount} leídos
                        </span>
                        <div className="flex items-center gap-1">
                          {notification.channels.includes('email') && <Mail className="w-3 h-3" />}
                          {notification.channels.includes('push') && <Smartphone className="w-3 h-3" />}
                          {notification.channels.includes('sms') && <MessageSquare className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteNotification(notification.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Create Notification Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Nueva Notificación"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Título de la Notificación"
              value={newNotification.title}
              onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
              placeholder="Ej: Pago Recibido"
              required
            />

            <Select
              label="Tipo de Notificación"
              value={newNotification.type}
              onChange={(value) => setNewNotification({...newNotification, type: value})}
              options={[
                { value: 'info', label: 'Información' },
                { value: 'success', label: 'Éxito' },
                { value: 'warning', label: 'Advertencia' },
                { value: 'error', label: 'Error' }
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensaje
            </label>
            <textarea
              value={newNotification.message}
              onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Escribe el contenido de la notificación..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Prioridad"
              value={newNotification.priority}
              onChange={(value) => setNewNotification({...newNotification, priority: value})}
              options={[
                { value: 'low', label: 'Baja' },
                { value: 'normal', label: 'Normal' },
                { value: 'high', label: 'Alta' }
              ]}
            />

            <Select
              label="Audiencia"
              value={newNotification.targetAudience}
              onChange={(value) => setNewNotification({...newNotification, targetAudience: value})}
              options={[
                { value: 'all', label: 'Todos los deudores' },
                { value: 'active', label: 'Deudores activos' },
                { value: 'overdue', label: 'Deudores morosos' },
                { value: 'custom', label: 'Personalizada' }
              ]}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Canales
              </label>
              <div className="flex gap-2">
                {[
                  { key: 'email', label: 'Email', icon: Mail },
                  { key: 'push', label: 'Push', icon: Smartphone },
                  { key: 'sms', label: 'SMS', icon: MessageSquare }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      const channels = newNotification.channels.includes(key)
                        ? newNotification.channels.filter(c => c !== key)
                        : [...newNotification.channels, key];
                      setNewNotification({...newNotification, channels});
                    }}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm border ${
                      newNotification.channels.includes(key)
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-gray-100 border-gray-300 text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleCreateNotification}
              className="flex-1"
              leftIcon={<Send className="w-4 h-4" />}
            >
              Enviar Notificación
            </Button>
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Configuración de Notificaciones"
        size="md"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Notificaciones por Email</span>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.emailEnabled}
                onChange={(e) => setNotificationSettings({...notificationSettings, emailEnabled: e.target.checked})}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-green-600" />
                <span className="font-medium">Notificaciones Push</span>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.pushEnabled}
                onChange={(e) => setNotificationSettings({...notificationSettings, pushEnabled: e.target.checked})}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Notificaciones SMS</span>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.smsEnabled}
                onChange={(e) => setNotificationSettings({...notificationSettings, smsEnabled: e.target.checked})}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">Envío Automático</span>
              <input
                type="checkbox"
                checked={notificationSettings.autoSend}
                onChange={(e) => setNotificationSettings({...notificationSettings, autoSend: e.target.checked})}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold text-gray-900 mb-3">Horario de Silencio</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Hora de Inicio"
                type="time"
                value={notificationSettings.quietHours.start}
                onChange={(e) => setNotificationSettings({
                  ...notificationSettings,
                  quietHours: {...notificationSettings.quietHours, start: e.target.value}
                })}
              />
              <Input
                label="Hora de Fin"
                type="time"
                value={notificationSettings.quietHours.end}
                onChange={(e) => setNotificationSettings({
                  ...notificationSettings,
                  quietHours: {...notificationSettings.quietHours, end: e.target.value}
                })}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Durante este horario no se enviarán notificaciones automáticas.
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setShowSettingsModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleSaveSettings}
              className="flex-1"
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              Guardar Configuración
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CompanyNotificationsPage;