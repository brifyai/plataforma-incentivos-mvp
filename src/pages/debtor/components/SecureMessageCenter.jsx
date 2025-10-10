/**
 * Secure Message Center - Centro de Mensajes Seguro para Deudores
 *
 * Centro unificado que muestra:
 * - Mensajes seguros de campañas con nombres reales de empresas
 * - Ofertas personalizadas por IA
 * - Historial de comunicaciones transparentes
 * - Interfaz de negociación directa
 */

import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, EmptyState, Modal, Input } from '../../../components/common';
import { useAuth } from '../../../context/AuthContext';
import { transparentMessageGenerator, getMessageStatistics } from '../../../services/transparentMessageGenerator';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import {
  MessageSquare,
  Shield,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Building,
  DollarSign,
  Send,
  FileText,
  AlertTriangle,
  Lock,
  Star,
  TrendingUp,
  BarChart3
} from 'lucide-react';

const SecureMessageCenter = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [negotiationOffer, setNegotiationOffer] = useState('');
  const [statistics, setStatistics] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unread, offers, expired

  useEffect(() => {
    if (user?.id) {
      loadMessages();
      loadStatistics();
    }
  }, [user]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      // This would typically come from an API call to get user's secure messages
      // For now, we'll simulate with mock data
      const mockMessages = [
        {
          id: 'msg_1',
          campaign_id: 'camp_1',
          company_name_visible: 'Banco Estado',
          debt_reference_visible: 'REF-CAMP001',
          content: 'Tenemos una oferta especial para resolver tu deuda pendiente...',
          offer_data: {
            discountPercentage: 25,
            paymentPlan: 'monthly_6',
            validityDays: 15,
            specialConditions: 'Descuento adicional por pronto pago'
          },
          status: 'opened',
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          opened_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          trust_badges: ['verified', 'secure', 'personalized']
        },
        {
          id: 'msg_2',
          campaign_id: 'camp_2',
          company_name_visible: 'Falabella',
          debt_reference_visible: 'REF-CAMP002',
          content: 'Oferta personalizada basada en tu historial de pagos...',
          offer_data: {
            discountPercentage: 15,
            paymentPlan: 'monthly_3',
            validityDays: 30
          },
          status: 'sent',
          created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          trust_badges: ['verified', 'encrypted']
        }
      ];

      setMessages(mockMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      // This would load real statistics from the API
      const stats = await getMessageStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
      setStatistics({
        total: 2,
        sent: 1,
        opened: 1,
        converted: 0,
        expired: 0,
        openRate: 50,
        conversionRate: 0
      });
    }
  };

  const handleViewMessage = async (message) => {
    try {
      // Validate access to the secure message
      const accessResult = await transparentMessageGenerator.validateMessageAccess(
        `token_${message.id}`, // This would be the real JWT token
        user.id
      );

      if (accessResult.valid) {
        setSelectedMessage(accessResult.message);
        setShowMessageModal(true);

        // Mark as read if it wasn't already
        if (message.status === 'sent') {
          await transparentMessageGenerator.processDebtorAction(
            message.id,
            'view',
            user.id
          );
          // Update local state
          setMessages(prev => prev.map(m =>
            m.id === message.id ? { ...m, status: 'opened', opened_at: new Date().toISOString() } : m
          ));
        }
      } else {
        alert('No tienes acceso a este mensaje o ha expirado.');
      }
    } catch (error) {
      console.error('Error viewing message:', error);
      alert('Error al cargar el mensaje.');
    }
  };

  const handleAcceptOffer = async () => {
    try {
      await transparentMessageGenerator.processDebtorAction(
        selectedMessage.id,
        'accept',
        user.id,
        { acceptedOffer: selectedMessage.offer_data }
      );

      alert('¡Felicitaciones! Has aceptado la oferta exitosamente.');
      setShowMessageModal(false);
      setSelectedMessage(null);
      loadMessages(); // Refresh messages
    } catch (error) {
      console.error('Error accepting offer:', error);
      alert('Error al aceptar la oferta.');
    }
  };

  const handleRejectOffer = async () => {
    try {
      await transparentMessageGenerator.processDebtorAction(
        selectedMessage.id,
        'reject',
        user.id
      );

      alert('Has rechazado la oferta.');
      setShowMessageModal(false);
      setSelectedMessage(null);
      loadMessages();
    } catch (error) {
      console.error('Error rejecting offer:', error);
      alert('Error al rechazar la oferta.');
    }
  };

  const handleStartNegotiation = () => {
    setShowNegotiationModal(true);
  };

  const handleSubmitNegotiation = async () => {
    if (!negotiationOffer.trim()) {
      alert('Por favor describe tu contraoferta.');
      return;
    }

    try {
      // This would send the negotiation offer through the secure channel
      await transparentMessageGenerator.processDebtorAction(
        selectedMessage.id,
        'negotiate',
        user.id,
        { negotiationOffer: negotiationOffer.trim() }
      );

      alert('Tu contraoferta ha sido enviada. La empresa responderá pronto.');
      setShowNegotiationModal(false);
      setNegotiationOffer('');
    } catch (error) {
      console.error('Error submitting negotiation:', error);
      alert('Error al enviar la contraoferta.');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      sent: { label: 'Nuevo', color: 'info', icon: MessageSquare },
      opened: { label: 'Leído', color: 'success', icon: Eye },
      converted: { label: 'Aceptado', color: 'success', icon: CheckCircle },
      expired: { label: 'Expirado', color: 'danger', icon: Clock }
    };

    const config = statusConfig[status] || statusConfig.sent;
    const Icon = config.icon;

    return (
      <Badge variant={config.color} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getTrustBadge = (badge) => {
    const badgeConfig = {
      verified: { label: 'Empresa Verificada', color: 'success', icon: Shield },
      secure: { label: 'Comunicación Segura', color: 'info', icon: Lock },
      encrypted: { label: 'Encriptado', color: 'warning', icon: Lock },
      personalized: { label: 'Personalizado por IA', color: 'primary', icon: Star }
    };

    const config = badgeConfig[badge];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge variant={config.color} className="text-xs flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredMessages = messages.filter(message => {
    switch (filter) {
      case 'unread':
        return message.status === 'sent';
      case 'offers':
        return message.offer_data && message.status !== 'converted';
      case 'expired':
        return message.status === 'expired';
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mr-3"></div>
          <span className="text-lg text-secondary-600">Cargando mensajes seguros...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Centro de Mensajes Seguros</h1>
              <p className="text-primary-100">
                Ofertas personalizadas • Comunicación transparente • Sin compartir datos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-xl">
            <Lock className="w-4 h-4" />
            <span className="text-sm font-medium">Protegido por NexuPay</span>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card padding={false} className="text-center">
            <div className="p-4">
              <MessageSquare className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-primary-600">{statistics.total}</div>
              <div className="text-sm text-secondary-600">Total Mensajes</div>
            </div>
          </Card>
          <Card padding={false} className="text-center">
            <div className="p-4">
              <Eye className="w-8 h-8 text-info-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-info-600">{statistics.opened}</div>
              <div className="text-sm text-secondary-600">Abiertos</div>
            </div>
          </Card>
          <Card padding={false} className="text-center">
            <div className="p-4">
              <CheckCircle className="w-8 h-8 text-success-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-success-600">{statistics.converted}</div>
              <div className="text-sm text-secondary-600">Aceptados</div>
            </div>
          </Card>
          <Card padding={false} className="text-center">
            <div className="p-4">
              <TrendingUp className="w-8 h-8 text-warning-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-warning-600">{statistics.openRate}%</div>
              <div className="text-sm text-secondary-600">Tasa de Apertura</div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === 'all' ? 'gradient' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Todos ({messages.length})
          </Button>
          <Button
            variant={filter === 'unread' ? 'gradient' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            No Leídos ({messages.filter(m => m.status === 'sent').length})
          </Button>
          <Button
            variant={filter === 'offers' ? 'gradient' : 'outline'}
            size="sm"
            onClick={() => setFilter('offers')}
          >
            Ofertas Activas ({messages.filter(m => m.offer_data && m.status !== 'converted').length})
          </Button>
          <Button
            variant={filter === 'expired' ? 'gradient' : 'outline'}
            size="sm"
            onClick={() => setFilter('expired')}
          >
            Expirados ({messages.filter(m => m.status === 'expired').length})
          </Button>
        </div>
      </Card>

      {/* Messages List */}
      <Card title={`Mensajes ${filter !== 'all' ? `(${filter})` : ''}`} className="shadow-soft">
        {filteredMessages.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="w-16 h-16 text-secondary-400" />}
            title="No hay mensajes"
            description={
              filter === 'unread' ? "¡Excelente! Has leído todos tus mensajes." :
              filter === 'offers' ? "No tienes ofertas activas en este momento." :
              filter === 'expired' ? "No hay mensajes expirados." :
              "No tienes mensajes en tu centro seguro."
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className="border border-secondary-200 rounded-xl p-6 hover:shadow-medium transition-all hover:border-primary-300 cursor-pointer"
                onClick={() => handleViewMessage(message)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl">
                      <Building className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-secondary-900">
                          {message.company_name_visible}
                        </h3>
                        {getStatusBadge(message.status)}
                      </div>
                      <p className="text-secondary-600 mb-2">
                        Referencia: {message.debt_reference_visible}
                      </p>
                      <p className="text-secondary-700 line-clamp-2 mb-3">
                        {message.content}
                      </p>

                      {/* Trust Badges */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {message.trust_badges?.map((badge, index) => (
                          <div key={index}>{getTrustBadge(badge)}</div>
                        ))}
                      </div>

                      {/* Offer Preview */}
                      {message.offer_data && (
                        <div className="bg-gradient-to-r from-success-50 to-success-100 p-4 rounded-lg border border-success-200">
                          <div className="flex items-center gap-3 mb-2">
                            <DollarSign className="w-5 h-5 text-success-600" />
                            <span className="font-bold text-success-900">Oferta Especial</span>
                            <Badge variant="success" className="font-bold">
                              {message.offer_data.discountPercentage}% Descuento
                            </Badge>
                          </div>
                          <div className="text-sm text-success-700">
                            Plan: {message.offer_data.paymentPlan === 'monthly_3' ? '3 cuotas' :
                                   message.offer_data.paymentPlan === 'monthly_6' ? '6 cuotas' :
                                   message.offer_data.paymentPlan === 'monthly_12' ? '12 cuotas' : 'Pago único'}
                            • Válido por {message.offer_data.validityDays} días
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-secondary-500">
                        <span>Recibido: {formatDate(message.created_at)}</span>
                        {message.opened_at && (
                          <span>Abierto: {formatDate(message.opened_at)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="gradient"
                      size="sm"
                      leftIcon={<Eye className="w-4 h-4" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewMessage(message);
                      }}
                    >
                      Ver Mensaje
                    </Button>
                    {message.offer_data && message.status !== 'converted' && (
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<FileText className="w-4 h-4" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartNegotiation();
                          setSelectedMessage(message);
                        }}
                      >
                        Negociar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Message Detail Modal */}
      <Modal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        title={`Mensaje de ${selectedMessage?.company_name_visible}`}
        size="lg"
      >
        {selectedMessage && (
          <div className="space-y-6">
            {/* Security Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-4 text-white">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6" />
                <div>
                  <h3 className="font-bold">Mensaje Seguro Verificado</h3>
                  <p className="text-sm text-green-100">
                    Comunicación transparente • Sin compartir datos personales
                  </p>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-2">
              {selectedMessage.trust_badges?.map((badge, index) => (
                <div key={index}>{getTrustBadge(badge)}</div>
              ))}
            </div>

            {/* Message Content */}
            <Card>
              <div className="prose prose-lg max-w-none">
                <div dangerouslySetInnerHTML={{
                  __html: selectedMessage.content.replace(/\n/g, '<br>')
                }} />
              </div>
            </Card>

            {/* Offer Details */}
            {selectedMessage.offer_data && (
              <Card className="border-2 border-success-200 bg-gradient-to-r from-success-50 to-success-100">
                <div className="flex items-center gap-3 mb-4">
                  <DollarSign className="w-6 h-6 text-success-600" />
                  <h3 className="text-xl font-bold text-success-900">Oferta Personalizada</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-white rounded-lg border border-success-200">
                    <div className="text-3xl font-bold text-success-600 mb-1">
                      {selectedMessage.offer_data.discountPercentage}%
                    </div>
                    <div className="text-sm text-success-700">Descuento</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border border-success-200">
                    <div className="text-xl font-bold text-success-600 mb-1">
                      {selectedMessage.offer_data.paymentPlan === 'monthly_3' ? '3' :
                       selectedMessage.offer_data.paymentPlan === 'monthly_6' ? '6' :
                       selectedMessage.offer_data.paymentPlan === 'monthly_12' ? '12' : '1'}
                    </div>
                    <div className="text-sm text-success-700">Cuotas</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border border-success-200">
                    <div className="text-2xl font-bold text-success-600 mb-1">
                      {selectedMessage.offer_data.validityDays}
                    </div>
                    <div className="text-sm text-success-700">Días válidos</div>
                  </div>
                </div>

                {selectedMessage.offer_data.specialConditions && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-yellow-900">Condiciones Especiales</h4>
                        <p className="text-yellow-800 mt-1">
                          {selectedMessage.offer_data.specialConditions}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <Button
                variant="outline"
                onClick={() => setShowMessageModal(false)}
                className="flex-1"
              >
                Cerrar
              </Button>

              {selectedMessage.offer_data && selectedMessage.status !== 'converted' && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleStartNegotiation}
                    className="flex-1"
                    leftIcon={<FileText className="w-4 h-4" />}
                  >
                    Negociar
                  </Button>
                  <Button
                    variant="gradient"
                    onClick={handleAcceptOffer}
                    className="flex-1"
                    leftIcon={<CheckCircle className="w-4 h-4" />}
                  >
                    Aceptar Oferta
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRejectOffer}
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                    leftIcon={<XCircle className="w-4 h-4" />}
                  >
                    Rechazar
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Negotiation Modal */}
      <Modal
        isOpen={showNegotiationModal}
        onClose={() => setShowNegotiationModal(false)}
        title="Negociar Oferta"
        size="md"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="p-6 bg-gradient-to-br from-warning-100 to-warning-200 rounded-3xl inline-block mb-6">
              <FileText className="w-12 h-12 text-warning-600" />
            </div>
            <h3 className="text-2xl font-display font-bold text-secondary-900 mb-2">
              Negociación Directa
            </h3>
            <p className="text-secondary-600">
              Envía tu contraoferta de manera segura y transparente
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-secondary-900 mb-2">
                Tu Contraoferta
              </label>
              <textarea
                className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-warning-500 focus:border-warning-500 bg-white resize-none"
                rows={4}
                placeholder="Describe tu contraoferta (descuento solicitado, plan de pagos alternativo, etc.)..."
                value={negotiationOffer}
                onChange={(e) => setNegotiationOffer(e.target.value)}
              />
            </div>

            <div className="bg-gradient-to-r from-info-50 to-info-100 p-4 rounded-xl border border-info-200">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-info-600 mt-0.5" />
                <div>
                  <h4 className="font-bold text-info-900 mb-1">Comunicación Segura</h4>
                  <p className="text-sm text-info-700">
                    Tu negociación será enviada de forma segura a {selectedMessage?.company_name_visible}.
                    Toda la comunicación fluye por NexuPay sin compartir tus datos personales.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button
              variant="outline"
              onClick={() => setShowNegotiationModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleSubmitNegotiation}
              className="flex-1"
              leftIcon={<Send className="w-4 h-4" />}
              disabled={!negotiationOffer.trim()}
            >
              Enviar Negociación
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SecureMessageCenter;