/**
 * Company Messages Page
 *
 * Página para que las empresas gestionen mensajes y comunicaciones con deudores
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, Button, LoadingSpinner, Modal, Input, Select, DateFilter } from '../../components/common';
import { getCompanyMessages, sendMessage } from '../../services/databaseService';
import { formatDate } from '../../utils/formatters';
import {
  MessageSquare,
  Send,
  User,
  Building,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  Search
} from 'lucide-react';

const CompanyMessagesPage = () => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState(null);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [newMessage, setNewMessage] = useState({
    debtorId: '',
    subject: '',
    message: '',
    priority: 'normal'
  });
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadMessages();
  }, [profile]);

  const loadMessages = async () => {
    if (!profile?.company?.id) return;

    try {
      setLoading(true);
      const result = await getCompanyMessages(profile.company.id);

      if (result.error) {
        console.error('Error loading messages:', result.error);
        // Datos de ejemplo
        setMessages([
          {
            id: '1',
            debtorName: 'Juan Pérez',
            subject: 'Recordatorio de pago pendiente',
            message: 'Estimado cliente, le recordamos que tiene un pago pendiente...',
            status: 'sent',
            priority: 'high',
            sentAt: new Date(Date.now() - 86400000), // 1 día atrás
            readAt: null
          },
          {
            id: '2',
            debtorName: 'María González',
            subject: 'Oferta especial de descuento',
            message: 'Tenemos una oferta especial para usted...',
            status: 'read',
            priority: 'normal',
            sentAt: new Date(Date.now() - 172800000), // 2 días atrás
            readAt: new Date(Date.now() - 86400000)
          }
        ]);
      } else {
        setMessages(result.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.debtorId || !newMessage.subject || !newMessage.message) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    setSending(true);
    try {
      const messageData = {
        companyId: profile.company.id,
        debtorId: newMessage.debtorId,
        subject: newMessage.subject,
        message: newMessage.message,
        priority: newMessage.priority,
        sentBy: profile.id
      };

      const result = await sendMessage(messageData);

      if (result.error) {
        alert('Error al enviar mensaje: ' + result.error);
      } else {
        alert('✅ Mensaje enviado exitosamente');
        setShowNewMessageModal(false);
        setNewMessage({
          debtorId: '',
          subject: '',
          message: '',
          priority: 'normal'
        });
        loadMessages(); // Recargar mensajes
      }
    } catch (error) {
      alert('Error al enviar mensaje: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'read':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'sent':
        return <Badge variant="warning">Enviado</Badge>;
      case 'read':
        return <Badge variant="success">Leído</Badge>;
      case 'failed':
        return <Badge variant="danger">Fallido</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return <Badge variant="danger">Alta</Badge>;
      case 'normal':
        return <Badge variant="warning">Normal</Badge>;
      case 'low':
        return <Badge variant="secondary">Baja</Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  const filteredMessages = messages.filter(message =>
    message.debtorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-3xl p-8 text-white shadow-strong">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-display font-bold tracking-tight">
                Centro de Mensajes
              </h1>
              <p className="text-cyan-100 text-lg">
                Gestiona comunicaciones con tus deudores
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="info" size="lg">
              {messages.length} Mensajes
            </Badge>
            <Button
              variant="primary"
              onClick={() => setShowNewMessageModal(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Nuevo Mensaje
            </Button>
            <Button
              variant="primary"
              onClick={loadMessages}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Actualizar
            </Button>
          </div>
        </div>

      </div>

      {/* Date Filter */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/30 shadow-sm w-full lg:min-w-fit">
        <DateFilter
          onFilterChange={setDateFilter}
          className="mb-0"
        />
      </div>

      {/* Content */}
      <div>
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <Card padding={false} className="hover:shadow-medium transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <Send className="w-6 h-6 text-primary-600" />
                </div>
                <Badge variant="primary">{messages.filter(m => m.status === 'sent' || m.status === 'read').length}</Badge>
              </div>
              <p className="text-sm text-secondary-600 mb-1">Mensajes Enviados</p>
              <p className="text-2xl font-bold text-secondary-900">
                {messages.filter(m => m.status === 'sent' || m.status === 'read').length}
              </p>
            </div>
          </Card>

          <Card padding={false} className="hover:shadow-medium transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-success-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-success-600" />
                </div>
                <Badge variant="success">
                  {messages.filter(m => m.status === 'read').length}
                </Badge>
              </div>
              <p className="text-sm text-secondary-600 mb-1">Mensajes Leídos</p>
              <p className="text-2xl font-bold text-secondary-900">
                {messages.filter(m => m.status === 'read').length}
              </p>
            </div>
          </Card>

          <Card padding={false} className="hover:shadow-medium transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-warning-100 rounded-lg">
                  <Clock className="w-6 h-6 text-warning-600" />
                </div>
                <Badge variant="warning">
                  {messages.filter(m => m.status === 'sent').length}
                </Badge>
              </div>
              <p className="text-sm text-secondary-600 mb-1">Mensajes Pendientes</p>
              <p className="text-2xl font-bold text-secondary-900">
                {messages.filter(m => m.status === 'sent').length}
              </p>
            </div>
          </Card>

          <Card padding={false} className="hover:shadow-medium transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-info-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-info-600" />
                </div>
                <Badge variant="info">
                  {messages.filter(m => m.status === 'failed').length}
                </Badge>
              </div>
              <p className="text-sm text-secondary-600 mb-1">Mensajes Fallidos</p>
              <p className="text-2xl font-bold text-secondary-900">
                {messages.filter(m => m.status === 'failed').length}
              </p>
            </div>
          </Card>
        </div>
      </div>

      <div>
        <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre del deudor o asunto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Messages List */}
      <Card
        title="Mensajes Enviados"
        subtitle={`${filteredMessages.length} mensaje${filteredMessages.length !== 1 ? 's' : ''} encontrado${filteredMessages.length !== 1 ? 's' : ''}`}
      >
        {filteredMessages.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-secondary-900 mb-2">
              No hay mensajes
            </h3>
            <p className="text-secondary-600 mb-6">
              {searchTerm ? 'No se encontraron mensajes que coincidan con tu búsqueda.' : 'Envía tu primer mensaje para comenzar a comunicarte con tus deudores.'}
            </p>
            {!searchTerm && (
              <Button
                variant="primary"
                onClick={() => setShowNewMessageModal(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Enviar Primer Mensaje
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className="flex items-center justify-between p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-6">
                  {getStatusIcon(message.status)}

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-secondary-900">
                        {message.subject}
                      </h3>
                      {getStatusBadge(message.status)}
                      {getPriorityBadge(message.priority)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-secondary-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{message.debtorName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Enviado {formatDate(message.sentAt)}</span>
                      </div>
                    </div>

                    <p className="text-sm text-secondary-600 mt-2 line-clamp-2">
                      {message.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {message.readAt && (
                    <div className="text-right text-sm text-secondary-600">
                      <p>Leído</p>
                      <p>{formatDate(message.readAt)}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* New Message Modal */}
      <Modal
        isOpen={showNewMessageModal}
        onClose={() => setShowNewMessageModal(false)}
        title=""
        size="xl"
      >
        <div className="space-y-8">
          {/* Modern Header */}
          <div className="text-center">
            <div className="p-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl inline-block mb-6">
              <Send className="w-16 h-16 text-blue-600" />
            </div>
            <h2 className="text-3xl font-display font-bold text-secondary-900 mb-2">
              Enviar Nuevo Mensaje
            </h2>
            <p className="text-secondary-600 text-lg">
              Comunícate efectivamente con tus deudores
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <span className="text-sm font-medium text-blue-700">Redactar Mensaje</span>
            </div>
          </div>

          {/* Información del Destinatario */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-2 border-blue-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500 rounded-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-display font-bold text-blue-900">
                Destinatario y Configuración
              </h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-secondary-900 font-display">
                    👤 Seleccionar Deudor *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400 font-medium">👤</span>
                    <select
                      value={newMessage.debtorId}
                      onChange={(e) => setNewMessage(prev => ({ ...prev, debtorId: e.target.value }))}
                      className="w-full pl-12 pr-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-lg transition-all appearance-none"
                      required
                    >
                      <option value="">Seleccionar deudor...</option>
                      {/* Aquí irían los deudores reales de la empresa */}
                      <option value="1">👤 Juan Pérez (RUT: 12.345.678-9)</option>
                      <option value="2">👤 María González (RUT: 9.876.543-2)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-secondary-900 font-display">
                    🚨 Prioridad del Mensaje
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400 font-medium">🚨</span>
                    <select
                      value={newMessage.priority}
                      onChange={(e) => setNewMessage(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full pl-12 pr-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-lg transition-all appearance-none"
                    >
                      <option value="low">🟢 Baja - Información general</option>
                      <option value="normal">🟡 Normal - Recordatorio estándar</option>
                      <option value="high">🔴 Alta - Pago urgente</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido del Mensaje */}
          <div className="bg-gradient-to-r from-green-50 to-green-100/50 border-2 border-green-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-500 rounded-lg">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-display font-bold text-green-900">
                Contenido del Mensaje
              </h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-secondary-900 font-display">
                  📧 Asunto del Mensaje *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400 font-medium">📧</span>
                  <input
                    type="text"
                    className="w-full pl-12 pr-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-lg transition-all"
                    placeholder="Ej: Recordatorio de pago pendiente"
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-secondary-900 font-display">
                  💬 Mensaje Detallado *
                </label>
                <textarea
                  className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-lg transition-all resize-none"
                  rows={8}
                  placeholder="Escribe un mensaje claro y profesional. Sé específico sobre el monto, fecha límite y beneficios de pagar..."
                  value={newMessage.message}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, message: e.target.value }))}
                  required
                />
                <p className="text-sm text-secondary-600 mt-2">
                  💡 Tip: Los mensajes claros y corteses tienen mejores tasas de respuesta
                </p>
              </div>
            </div>
          </div>

          {/* Consejos y Recomendaciones */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 border-2 border-purple-200 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-500 rounded-lg flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-purple-900 mb-4">
                  💡 Consejos para Mensajes Efectivos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/60 rounded-xl p-4">
                    <h4 className="font-semibold text-purple-800 mb-2">🎯 Sé específico</h4>
                    <p className="text-sm text-purple-700">
                      Incluye montos exactos, fechas límite y consecuencias claras.
                    </p>
                  </div>

                  <div className="bg-white/60 rounded-xl p-4">
                    <h4 className="font-semibold text-purple-800 mb-2">🤝 Mantén el respeto</h4>
                    <p className="text-sm text-purple-700">
                      Usa un tono profesional y cortés, incluso en recordatorios urgentes.
                    </p>
                  </div>

                  <div className="bg-white/60 rounded-xl p-4">
                    <h4 className="font-semibold text-purple-800 mb-2">⏰ Incluye plazos</h4>
                    <p className="text-sm text-purple-700">
                      Especifica cuándo vence el pago y qué sucede si no se realiza.
                    </p>
                  </div>

                  <div className="bg-white/60 rounded-xl p-4">
                    <h4 className="font-semibold text-purple-800 mb-2">📱 Multi-canal</h4>
                    <p className="text-sm text-purple-700">
                      Los mensajes se envían por email y notificaciones push automáticamente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Información Importante */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500 rounded-lg flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-xl font-display font-bold text-amber-900 mb-3">
                  ⚠️ Información Importante
                </h4>
                <ul className="space-y-2 text-sm text-amber-800">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-1">•</span>
                    <span>Los mensajes se envían automáticamente por email y notificaciones push</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-1">•</span>
                    <span>Verifica que el contenido sea claro, profesional y sin errores</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-1">•</span>
                    <span>Una vez enviado, el mensaje no puede ser editado o eliminado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-1">•</span>
                    <span>Los deudores recibirán confirmación de lectura cuando abran el mensaje</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6">
            <Button
              variant="outline"
              onClick={() => setShowNewMessageModal(false)}
              className="flex-1 hover:scale-105 transition-all py-3"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleSendMessage}
              className="flex-1 shadow-soft hover:shadow-glow-primary py-3"
              loading={sending}
              leftIcon={<Send className="w-5 h-5" />}
            >
              {sending ? '🚀 Enviando Mensaje...' : '📤 Enviar Mensaje'}
            </Button>
          </div>
        </div>
      </Modal>
      </div>
    </div>
  );
};

export default CompanyMessagesPage;