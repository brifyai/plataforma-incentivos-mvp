/**
 * Offers Page
 *
 * Página para mostrar las ofertas disponibles para el deudor
 */

import { useState } from 'react';
import { Card, Badge, LoadingSpinner, EmptyState, Button, Modal, Input } from '../../components/common';
import { useOffers } from '../../hooks';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Swal from 'sweetalert2';
import {
  CreditCard,
  Percent,
  Calendar,
  Building,
  CheckCircle,
  Clock,
  DollarSign,
  ArrowRight,
  Gift,
  TrendingUp,
  Bell,
  Check,
  Send,
  MessageSquare,
  Plus,
} from 'lucide-react';

const OffersPage = () => {
  const { offers, loading } = useOffers();
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [offerToAccept, setOfferToAccept] = useState(null);
  const [acceptedOffers, setAcceptedOffers] = useState(new Set());

  // Payment Proposal states
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalData, setProposalData] = useState({
    companyId: '',
    amount: '',
    description: '',
    paymentPlan: 'single_payment',
    proposedDate: '',
  });
  const [submittedProposals, setSubmittedProposals] = useState([]);

  if (loading) {
    return <LoadingSpinner fullScreen text="Cargando ofertas..." />;
  }

  const getOfferTypeIcon = (type) => {
    switch (type) {
      case 'discount':
        return <Percent className="w-6 h-6 text-green-600" />;
      case 'installment_plan':
        return <Calendar className="w-6 h-6 text-blue-600" />;
      case 'renegotiation':
        return <TrendingUp className="w-6 h-6 text-orange-600" />;
      case 'partial_condonation':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      default:
        return <Gift className="w-6 h-6 text-purple-600" />;
    }
  };

  const getOfferTypeLabel = (type) => {
    switch (type) {
      case 'discount':
        return 'Descuento Especial';
      case 'installment_plan':
        return 'Plan de Cuotas';
      case 'renegotiation':
        return 'Renegociación';
      case 'partial_condonation':
        return 'Condonación Parcial';
      default:
        return 'Oferta Especial';
    }
  };

  const getOfferTypeBadge = (type) => {
    const colors = {
      discount: 'success',
      installment_plan: 'primary',
      renegotiation: 'warning',
      partial_condonation: 'success',
    };
    return <Badge variant={colors[type] || 'info'}>{getOfferTypeLabel(type)}</Badge>;
  };

  const isOfferExpired = (offer) => {
    return new Date(offer.validity_end) < new Date();
  };

  const getSavingsAmount = (offer) => {
    if (offer.parameters?.discount_percentage) {
      return `Ahorra ${offer.parameters.discount_percentage}%`;
    }
    return 'Ahorra dinero';
  };

  const handleAcceptOffer = (offer) => {
    setOfferToAccept(offer);
    setShowAcceptModal(true);
  };

  const confirmAcceptOffer = () => {
    if (offerToAccept) {
      setAcceptedOffers(prev => new Set([...prev, offerToAccept.id]));
      setShowAcceptModal(false);
      setOfferToAccept(null);
      Swal.fire('¡Oferta Aceptada!', `¡Oferta "${offerToAccept.title}" aceptada exitosamente!`, 'success');
    }
  };

  const handleSubscribeNotifications = () => {
    Swal.fire('¡Suscrito!', '¡Te has suscrito a las notificaciones de nuevas ofertas!', 'success');
  };

  const handleViewDetails = (offer) => {
    setSelectedOffer(selectedOffer?.id === offer.id ? null : offer);
    Swal.fire('Detalles', `Detalles de "${offer.title}" ${selectedOffer?.id === offer.id ? 'ocultados' : 'mostrados'}`, 'info');
  };

  // Payment Proposal handlers
  const handleCreateProposal = () => {
    setShowProposalModal(true);
  };

  const handleProposalChange = (field, value) => {
    setProposalData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitProposal = () => {
    if (!proposalData.companyId || !proposalData.amount || !proposalData.description) {
      Swal.fire('Error', 'Por favor completa todos los campos requeridos', 'error');
      return;
    }

    // Create proposal object
    const newProposal = {
      id: Date.now(),
      ...proposalData,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      companyName: 'Empresa Demo', // In real app, get from selected company
    };

    setSubmittedProposals(prev => [...prev, newProposal]);
    setShowProposalModal(false);
    setProposalData({
      companyId: '',
      amount: '',
      description: '',
      paymentPlan: 'single_payment',
      proposedDate: '',
    });

    Swal.fire('¡Propuesta Enviada!', 'Tu propuesta de pago ha sido enviada a la empresa. Recibirás una respuesta pronto.', 'success');
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
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold tracking-tight">
                  Ofertas Disponibles
                </h1>
                <p className="text-primary-100 text-sm">
                  Explora las mejores ofertas para reducir tus deudas y ganar incentivos
                </p>
              </div>
            </div>
          </div>

          {/* Quick stats in header */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-success-300" />
                <div>
                  <p className="text-xs text-primary-100">Total Ofertas</p>
                  <p className="text-lg font-bold">{offers.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-warning-300" />
                <div>
                  <p className="text-xs text-primary-100">Incentivo Promedio</p>
                  <p className="text-lg font-bold">{offers.length > 0 ? Math.round(offers.reduce((sum, offer) => sum + (offer.user_incentive_percentage || 0), 0) / offers.length) : 0}%</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-info-300" />
                <div>
                  <p className="text-xs text-primary-100">Vigentes</p>
                  <p className="text-lg font-bold">{offers.filter(offer => !isOfferExpired(offer)).length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success-300" />
                <div>
                  <p className="text-xs text-primary-100">Aceptadas</p>
                  <p className="text-lg font-bold">{acceptedOffers.size}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Proposals Section - Moved to top for better UX */}
      <Card
        variant="elevated"
        className="relative overflow-hidden bg-gradient-to-br from-info-50 via-info-100 to-info-50 border-info-200/50 animate-slide-up"
        style={{ animationDelay: '200ms' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-info-100/20 to-info-200/20" />
        <div className="relative p-8">
          <div className="text-center">
            {/* Hero Section */}
            <div className="mb-8">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-info-500 to-info-600 rounded-3xl shadow-lg">
                  <Plus className="w-10 h-10 text-info-200" />
                </div>
                <div className="text-left">
                  <h2 className="text-3xl font-display font-bold text-secondary-900 mb-2">
                    ¿No encuentras la oferta ideal?
                  </h2>
                  <p className="text-secondary-600 text-lg">
                    Crea tu propia propuesta de pago personalizada
                  </p>
                </div>
              </div>

              <Button
                variant="gradient"
                size="xl"
                onClick={handleCreateProposal}
                className="shadow-soft hover:shadow-glow-info mb-8"
                leftIcon={<Plus className="w-6 h-6" />}
              >
                Crear Propuesta de Pago
              </Button>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-info-200/30 hover:bg-white/80 transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-gradient-to-br from-info-100 to-info-200 rounded-xl">
                    <MessageSquare className="w-6 h-6 text-info-600" />
                  </div>
                  <h3 className="font-bold text-secondary-900">Negocia tus términos</h3>
                </div>
                <p className="text-sm text-secondary-600 leading-relaxed">
                  Propón montos y plazos que se ajusten perfectamente a tu capacidad de pago actual
                </p>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-info-200/30 hover:bg-white/80 transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-gradient-to-br from-success-100 to-success-200 rounded-xl">
                    <Send className="w-6 h-6 text-success-600" />
                  </div>
                  <h3 className="font-bold text-secondary-900">Envío directo</h3>
                </div>
                <p className="text-sm text-secondary-600 leading-relaxed">
                  Tu propuesta llega directamente al equipo de la empresa para una respuesta rápida
                </p>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-info-200/30 hover:bg-white/80 transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-gradient-to-br from-warning-100 to-warning-200 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-warning-600" />
                  </div>
                  <h3 className="font-bold text-secondary-900">Respuesta rápida</h3>
                </div>
                <p className="text-sm text-secondary-600 leading-relaxed">
                  Recibe respuesta en 24-48 horas con contrapropuestas personalizadas
                </p>
              </div>
            </div>
          </div>

          {/* Recent Proposals */}
          {submittedProposals.length > 0 && (
            <div className="mt-8 pt-8 border-t border-info-200/50">
              <h3 className="text-xl font-bold text-secondary-900 mb-6 font-display">Tus Propuestas Recientes</h3>
              <div className="space-y-4">
                {submittedProposals.slice(0, 3).map((proposal) => (
                  <div key={proposal.id} className="bg-white/60 rounded-2xl p-4 border border-info-200/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-info-100 rounded-xl">
                          <Send className="w-4 h-4 text-info-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-secondary-900">
                            Propuesta a {proposal.companyName}
                          </p>
                          <p className="text-sm text-secondary-600">
                            {formatCurrency(proposal.amount)} - {proposal.paymentPlan === 'single_payment' ? 'Pago único' : 'Plan de pagos'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={proposal.status === 'pending' ? 'warning' : 'success'} className="font-medium">
                        {proposal.status === 'pending' ? 'Pendiente' : 'Aceptada'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      <>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card
            variant="elevated"
            className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up"
            style={{ animationDelay: '200ms' }}
          >
            <div className="p-6">
              <div className="flex items-center justify-center mb-6">
                <div className="p-4 bg-gradient-to-br from-success-100 to-success-200 rounded-2xl group-hover:shadow-glow-success transition-all duration-300">
                  <Gift className="w-8 h-8 text-success-600" />
                </div>
              </div>
              <h3 className="text-3xl font-display font-bold text-secondary-900 mb-2">{offers.length}</h3>
              <p className="text-secondary-600 font-medium uppercase tracking-wide text-sm">Ofertas Activas</p>
            </div>
          </Card>

          <Card
            variant="elevated"
            className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up"
            style={{ animationDelay: '300ms' }}
          >
            <div className="p-6">
              <div className="flex items-center justify-center mb-6">
                <div className="p-4 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl group-hover:shadow-glow transition-all duration-300">
                  <TrendingUp className="w-8 h-8 text-primary-600" />
                </div>
              </div>
              <h3 className="text-3xl font-display font-bold text-secondary-900 mb-2">
                {offers.length > 0 ? Math.round(offers.reduce((sum, offer) => sum + (offer.user_incentive_percentage || 0), 0) / offers.length) : 0}%
              </h3>
              <p className="text-secondary-600 font-medium uppercase tracking-wide text-sm">Incentivo Promedio</p>
            </div>
          </Card>

          <Card
            variant="elevated"
            className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up"
            style={{ animationDelay: '400ms' }}
          >
            <div className="p-6">
              <div className="flex items-center justify-center mb-6">
                <div className="p-4 bg-gradient-to-br from-warning-100 to-warning-200 rounded-2xl group-hover:shadow-glow-warning transition-all duration-300">
                  <Clock className="w-8 h-8 text-warning-600" />
                </div>
              </div>
              <h3 className="text-3xl font-display font-bold text-secondary-900 mb-2">
                {offers.filter(offer => !isOfferExpired(offer)).length}
              </h3>
              <p className="text-secondary-600 font-medium uppercase tracking-wide text-sm">Ofertas Vigentes</p>
            </div>
          </Card>
        </div>

        {/* Offers List */}
        {offers.length === 0 ? (
          <Card
            variant="elevated"
            className="text-center py-16 animate-fade-in"
          >
            <div className="p-8 bg-gradient-to-br from-primary-100 to-accent-100 rounded-3xl inline-block mb-8">
              <CreditCard className="w-20 h-20 text-primary-600" />
            </div>
            <h3 className="text-3xl font-display font-bold text-secondary-900 mb-4">
              No hay ofertas disponibles
            </h3>
            <p className="text-lg text-secondary-600 mb-6 max-w-md mx-auto">
              Estamos trabajando para conseguir las mejores ofertas para ti. Vuelve pronto para nuevas oportunidades.
            </p>
            <Button
              variant="outline"
              onClick={handleSubscribeNotifications}
              className="hover:scale-105 transition-all"
              leftIcon={<Bell className="w-4 h-4" />}
            >
              Notificarme cuando haya ofertas
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6">
            {offers.map((offer, index) => (
              <Card
                key={offer.id}
                variant="elevated"
                className={`group hover:scale-[1.01] transition-all duration-300 animate-slide-up ${isOfferExpired(offer) ? 'opacity-75' : ''}`}
                style={{ animationDelay: `${500 + index * 100}ms` }}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                  <div className="flex items-start gap-6 flex-1">
                    <div className="p-4 bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl group-hover:shadow-soft transition-all duration-300">
                      {getOfferTypeIcon(offer.offer_type)}
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <h3 className="text-2xl font-bold text-secondary-900 font-display">
                          {offer.title}
                        </h3>
                        {getOfferTypeBadge(offer.offer_type)}
                        {isOfferExpired(offer) && (
                          <Badge variant="danger" className="font-semibold">Expirada</Badge>
                        )}
                        <Badge variant="success" className="bg-success-100 text-success-800 font-semibold">
                          {getSavingsAmount(offer)}
                        </Badge>
                      </div>

                      <p className="text-secondary-600 mb-6 text-lg leading-relaxed">
                        {offer.description}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="flex items-center gap-3 p-3 bg-secondary-50/80 rounded-xl">
                          <Building className="w-5 h-5 text-secondary-500" />
                          <div>
                            <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide mb-1">Empresa</p>
                            <p className="text-sm font-semibold text-secondary-900">
                              {offer.company?.business_name || 'Empresa Asociada'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-secondary-50/80 rounded-xl">
                          <Clock className="w-5 h-5 text-secondary-500" />
                          <div>
                            <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide mb-1">Válida hasta</p>
                            <p className="text-sm font-semibold text-secondary-900">
                              {formatDate(offer.validity_end)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-success-50/80 rounded-xl">
                          <Percent className="w-5 h-5 text-success-500" />
                          <div>
                            <p className="text-xs font-medium text-success-600 uppercase tracking-wide mb-1">Incentivo</p>
                            <p className="text-lg font-bold text-success-600">
                              {offer.user_incentive_percentage}% adicional
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Offer Parameters */}
                      {offer.parameters && (
                        <div className="bg-gradient-to-r from-secondary-50 to-secondary-100/50 rounded-2xl p-5 border border-secondary-200/50">
                          <h4 className="font-bold text-secondary-900 mb-4 font-display">Detalles de la Oferta</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(offer.parameters).map(([key, value]) => (
                              <div key={key} className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                                <span className="text-secondary-600 capitalize text-sm font-medium">
                                  {key.replace(/_/g, ' ')}:
                                </span>
                                <span className="font-bold text-secondary-900">
                                  {typeof value === 'number' && key.includes('amount')
                                    ? formatCurrency(value)
                                    : typeof value === 'number' && key.includes('percentage')
                                    ? `${value}%`
                                    : value
                                  }
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 mt-6 lg:mt-0 lg:ml-6">
                    {acceptedOffers.has(offer.id) ? (
                      <Button
                        variant="success"
                        size="lg"
                        disabled
                        className="w-full lg:w-auto shadow-soft"
                        leftIcon={<Check className="w-5 h-5" />}
                      >
                        Oferta Aceptada
                      </Button>
                    ) : (
                      <Button
                        variant="gradient"
                        size="lg"
                        disabled={isOfferExpired(offer)}
                        className="w-full lg:w-auto shadow-soft hover:shadow-glow"
                        onClick={() => handleAcceptOffer(offer)}
                        rightIcon={<ArrowRight className="w-5 h-5" />}
                      >
                        Aceptar Oferta
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full lg:w-auto hover:scale-105 transition-all"
                      onClick={() => handleViewDetails(offer)}
                    >
                      {selectedOffer?.id === offer.id ? 'Ocultar' : 'Ver'} Detalles
                    </Button>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedOffer?.id === offer.id && (
                  <div className="mt-8 pt-8 border-t border-secondary-200/50">
                    <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-6 border border-primary-200/30">
                      <h4 className="text-xl font-bold text-secondary-900 mb-6 font-display">
                        Información Adicional
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-success-100 rounded-xl">
                              <TrendingUp className="w-5 h-5 text-success-600" />
                            </div>
                            <h5 className="font-bold text-secondary-900">Beneficios</h5>
                          </div>
                          <ul className="text-sm text-secondary-600 space-y-2 ml-11">
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-success-500 rounded-full"></div>
                              Reduce tu deuda actual
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-success-500 rounded-full"></div>
                              Mejora tu historial crediticio
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-success-500 rounded-full"></div>
                              Gana incentivos adicionales
                            </li>
                          </ul>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-warning-100 rounded-xl">
                              <CheckCircle className="w-5 h-5 text-warning-600" />
                            </div>
                            <h5 className="font-bold text-secondary-900">Requisitos</h5>
                          </div>
                          <ul className="text-sm text-secondary-600 space-y-2 ml-11">
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-warning-500 rounded-full"></div>
                              Mantener pagos al día
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-warning-500 rounded-full"></div>
                              Aceptar términos de la oferta
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-warning-500 rounded-full"></div>
                              Confirmar identidad
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}


        {/* Call to Action */}
        {offers.length > 0 && (
          <Card
            variant="gradient"
            className="relative overflow-hidden animate-slide-up mt-12"
            style={{ animationDelay: '800ms' }}
          >
            {/* Animated background elements */}
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl animate-float" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative text-center p-8">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                  <Gift className="w-12 h-12" />
                </div>
                <div>
                  <h3 className="text-3xl font-display font-bold text-white mb-2">
                    ¿Necesitas más opciones?
                  </h3>
                  <p className="text-white/90 text-lg leading-relaxed max-w-2xl mx-auto">
                    Estamos constantemente agregando nuevas ofertas. Mantente al tanto de las actualizaciones
                    y oportunidades exclusivas para ti.
                  </p>
                </div>
              </div>
              <Button
                variant="glass"
                size="lg"
                onClick={handleSubscribeNotifications}
                className="shadow-glow hover:scale-105 transition-all"
                leftIcon={<Bell className="w-5 h-5" />}
              >
                Recibir Notificaciones
              </Button>
            </div>
          </Card>
        )}

        {/* Modal de Confirmación para Aceptar Oferta */}
        <Modal
          isOpen={showAcceptModal}
          onClose={() => setShowAcceptModal(false)}
          title="Confirmar Aceptación de Oferta"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-blue-50">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  ¿Estás seguro de aceptar esta oferta?
                </h3>
                <p className="text-gray-600 mt-1">
                  Al aceptar "{offerToAccept?.title}", te comprometes a cumplir con los términos de la oferta.
                  Esto incluye mantener tus pagos al día y seguir las condiciones específicas.
                </p>
              </div>
            </div>

            {offerToAccept && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Resumen de la Oferta</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Empresa:</span>
                    <span className="font-medium">{offerToAccept.company?.business_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Incentivo:</span>
                    <span className="font-medium text-green-600">{offerToAccept.user_incentive_percentage}% adicional</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Válida hasta:</span>
                    <span className="font-medium">{formatDate(offerToAccept.validity_end)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setShowAcceptModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={confirmAcceptOffer}
                className="flex-1"
              >
                Sí, Aceptar Oferta
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal Crear Propuesta de Pago - Rediseñado */}
        <Modal
          isOpen={showProposalModal}
          onClose={() => setShowProposalModal(false)}
          title=""
          size="xl"
          className="max-h-[90vh] overflow-y-auto"
        >
          <div className="space-y-8">
            {/* Header con gradiente - Colores de la página */}
            <div className="relative overflow-hidden bg-gradient-to-br from-accent-600 via-primary-600 to-accent-700 rounded-3xl p-8 text-white shadow-strong">
              <div className="absolute inset-0 bg-gradient-to-br from-accent-500/20 to-primary-600/20" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl" />

              <div className="relative text-center">
                <div className="flex items-center justify-center gap-6 mb-6">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-3xl shadow-lg">
                    <Plus className="w-12 h-12 text-accent-600" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-display font-bold mb-2 text-white drop-shadow-lg">
                      Crea tu Propuesta Personalizada
                    </h2>
                    <p className="text-primary-100 text-lg font-medium drop-shadow">
                      Propón términos que se ajusten a tu realidad financiera
                    </p>
                  </div>
                </div>

                {/* Progress indicator - Colores de la página */}
                <div className="flex items-center justify-center gap-3 mb-4 bg-white/10 rounded-full py-3 px-6 backdrop-blur-sm border border-white/20">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                    <span className="text-sm font-semibold text-white">Empresa</span>
                  </div>
                  <div className="w-10 h-0.5 bg-white/60"></div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white/80 rounded-full shadow-sm"></div>
                    <span className="text-sm font-semibold text-white">Términos</span>
                  </div>
                  <div className="w-10 h-0.5 bg-white/40"></div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white/60 rounded-full shadow-sm"></div>
                    <span className="text-sm font-semibold text-white/90">Enviar</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulario principal */}
            <div className="space-y-8">
              {/* Paso 1: Seleccionar Empresa */}
              <div className="bg-gradient-to-r from-secondary-50 to-secondary-100/50 rounded-2xl p-6 border border-secondary-200/50">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-soft">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-secondary-900">Paso 1: Seleccionar Empresa</h3>
                    <p className="text-secondary-600">Elige la empresa a la que quieres enviar tu propuesta</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'empresa1', name: 'Banco Ejemplo S.A.', type: 'Bancaria' },
                    { id: 'empresa2', name: 'Financiera ABC', type: 'Financiera' },
                    { id: 'empresa3', name: 'Créditos Rápidos Ltda.', type: 'Créditos' }
                  ].map((company) => (
                    <div
                      key={company.id}
                      onClick={() => handleProposalChange('companyId', company.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                        proposalData.companyId === company.id
                          ? 'border-primary-500 bg-primary-50 shadow-soft'
                          : 'border-secondary-200 bg-white hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${
                          proposalData.companyId === company.id
                            ? 'bg-primary-100'
                            : 'bg-secondary-100'
                        }`}>
                          <Building className={`w-4 h-4 ${
                            proposalData.companyId === company.id
                              ? 'text-primary-600'
                              : 'text-secondary-500'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-secondary-900 text-sm">{company.name}</p>
                          <p className="text-xs text-secondary-500">{company.type}</p>
                        </div>
                        {proposalData.companyId === company.id && (
                          <CheckCircle className="w-5 h-5 text-primary-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Paso 2: Definir Términos */}
              <div className="bg-gradient-to-r from-success-50 to-success-100/50 rounded-2xl p-6 border border-success-200/50">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-gradient-to-br from-success-500 to-success-600 rounded-xl shadow-soft">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-secondary-900">Paso 2: Definir tus Términos</h3>
                    <p className="text-secondary-600">Establece el monto y plan de pago que propones</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Monto Propuesto */}
                  <div className="space-y-3">
                    <label className="block text-lg font-bold text-secondary-900 font-display">
                      Monto que propones pagar
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-success-500" />
                        <span className="text-success-600 font-semibold">CLP</span>
                      </div>
                      <input
                        type="number"
                        className="w-full pl-20 pr-4 py-4 border-2 border-success-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-success-500 focus:border-success-500 bg-white text-xl font-semibold text-center"
                        placeholder="0"
                        value={proposalData.amount}
                        onChange={(e) => handleProposalChange('amount', e.target.value)}
                      />
                    </div>
                    <p className="text-sm text-secondary-600">Ingresa el monto total que propones</p>
                  </div>

                  {/* Plan de Pago */}
                  <div className="space-y-3">
                    <label className="block text-lg font-bold text-secondary-900 font-display">
                      Plan de pago sugerido
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'single_payment', label: 'Pago único', icon: DollarSign, desc: 'Todo de una vez' },
                        { value: 'monthly_installments', label: 'Cuotas mensuales', icon: Calendar, desc: 'Varios meses' },
                        { value: 'quarterly_payments', label: 'Pagos trimestrales', icon: Clock, desc: 'Cada 3 meses' },
                        { value: 'custom_plan', label: 'Plan personalizado', icon: Plus, desc: 'A convenir' }
                      ].map((plan) => (
                        <div
                          key={plan.value}
                          onClick={() => handleProposalChange('paymentPlan', plan.value)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                            proposalData.paymentPlan === plan.value
                              ? 'border-success-500 bg-success-50 shadow-soft'
                              : 'border-secondary-200 bg-white hover:border-success-300'
                          }`}
                        >
                          <div className="text-center">
                            <plan.icon className={`w-6 h-6 mx-auto mb-2 ${
                              proposalData.paymentPlan === plan.value
                                ? 'text-success-600'
                                : 'text-secondary-500'
                            }`} />
                            <p className="font-semibold text-secondary-900 text-sm mb-1">{plan.label}</p>
                            <p className="text-xs text-secondary-500">{plan.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Paso 3: Explicación */}
              <div className="bg-gradient-to-r from-warning-50 to-warning-100/50 rounded-2xl p-6 border border-warning-200/50">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-gradient-to-br from-warning-500 to-warning-600 rounded-xl shadow-soft">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-secondary-900">Paso 3: Explica tu situación</h3>
                    <p className="text-secondary-600">Ayuda a la empresa a entender tu propuesta</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <textarea
                    className="w-full px-6 py-4 border-2 border-warning-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-warning-500 focus:border-warning-500 resize-none bg-white text-lg leading-relaxed"
                    rows={6}
                    placeholder="Cuéntales sobre tu situación financiera actual, por qué propones estos términos específicos, y cómo este acuerdo beneficiaría a ambas partes..."
                    value={proposalData.description}
                    onChange={(e) => handleProposalChange('description', e.target.value)}
                  />

                  {/* Consejos para escribir */}
                  <div className="bg-white/60 rounded-xl p-4 border border-warning-200/30">
                    <h4 className="font-semibold text-warning-900 mb-3 flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Consejos para una buena propuesta
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-warning-500 rounded-full mt-2"></div>
                        <span className="text-warning-800">Sé honesto sobre tu situación financiera</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-warning-500 rounded-full mt-2"></div>
                        <span className="text-warning-800">Explica por qué este plan te conviene</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-warning-500 rounded-full mt-2"></div>
                        <span className="text-warning-800">Muestra disposición para negociar</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-warning-500 rounded-full mt-2"></div>
                        <span className="text-warning-800">Mantén un tono respetuoso y profesional</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información importante */}
              <div className="bg-gradient-to-r from-info-50 to-info-100/50 border-2 border-info-200 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-gradient-to-br from-info-500 to-info-600 rounded-xl shadow-soft">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-xl font-display font-bold text-info-900">¿Qué sucede después?</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-white/60 rounded-xl">
                    <div className="p-3 bg-info-100 rounded-full inline-block mb-3">
                      <Clock className="w-5 h-5 text-info-600" />
                    </div>
                    <h5 className="font-semibold text-info-900 mb-2">Revisión (24-48h)</h5>
                    <p className="text-sm text-info-800">La empresa revisa tu propuesta</p>
                  </div>

                  <div className="text-center p-4 bg-white/60 rounded-xl">
                    <div className="p-3 bg-success-100 rounded-full inline-block mb-3">
                      <MessageSquare className="w-5 h-5 text-success-600" />
                    </div>
                    <h5 className="font-semibold text-info-900 mb-2">Respuesta</h5>
                    <p className="text-sm text-info-800">Recibes una contrapropuesta o aceptación</p>
                  </div>

                  <div className="text-center p-4 bg-white/60 rounded-xl">
                    <div className="p-3 bg-warning-100 rounded-full inline-block mb-3">
                      <Plus className="w-5 h-5 text-warning-600" />
                    </div>
                    <h5 className="font-semibold text-info-900 mb-2">Negociación</h5>
                    <p className="text-sm text-info-800">Puedes negociar términos adicionales</p>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-4 pt-6 border-t border-secondary-200">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setShowProposalModal(false);
                    setProposalData({
                      companyId: '',
                      amount: '',
                      description: '',
                      paymentPlan: 'single_payment',
                      proposedDate: '',
                    });
                  }}
                  className="flex-1 hover:scale-105 transition-all"
                >
                  Cancelar
                </Button>
                <Button
                  variant="gradient"
                  size="lg"
                  onClick={handleSubmitProposal}
                  className="flex-1 shadow-soft hover:shadow-glow-info"
                  leftIcon={<Send className="w-5 h-5" />}
                  disabled={!proposalData.companyId || !proposalData.amount || !proposalData.description}
                >
                  Enviar Propuesta
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      </>
    </div>
  );
};

// Updated: Rediseño completo de la sección "Crea tu Propuesta de Pago" - Eliminado título duplicado y mejorada UX
export default OffersPage;