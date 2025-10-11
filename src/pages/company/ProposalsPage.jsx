/**
 * Company Proposals Page
 *
 * Página para que las empresas revisen las propuestas de pago enviadas por los deudores
 */

import { useState } from 'react';
import { Card, Badge, LoadingSpinner, EmptyState, Button, Modal, DateFilter } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useProposals } from '../../hooks';
import Swal from 'sweetalert2';
import {
  Users,
  DollarSign,
  Calendar,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  HeartHandshake,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

const ProposalsPage = () => {
  const {
    proposals,
    loading,
    error,
    updateProposal
  } = useProposals();

  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [responseData, setResponseData] = useState({
    accepted: false,
    counterAmount: '',
    message: '',
  });
  const [submittingResponse, setSubmittingResponse] = useState(false);

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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-warning-600" />;
      case 'responded':
        return <MessageSquare className="w-5 h-5 text-info-600" />;
      case 'accepted':
        return <CheckCircle className="w-5 h-5 text-success-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-danger-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-secondary-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      responded: 'info',
      accepted: 'success',
      rejected: 'danger',
    };

    const labels = {
      pending: 'Pendiente',
      responded: 'Respondido',
      accepted: 'Aceptado',
      rejected: 'Rechazado',
    };

    return <Badge variant={variants[status] || 'info'}>{labels[status] || status}</Badge>;
  };

  const getPaymentPlanLabel = (plan) => {
    const labels = {
      single_payment: 'Pago único',
      monthly_installments: 'Cuotas mensuales',
      quarterly_payments: 'Pagos trimestrales',
      custom_plan: 'Plan personalizado',
    };
    return labels[plan] || plan;
  };

  const handleRespondToProposal = (proposal) => {
    setSelectedProposal(proposal);
    setShowResponseModal(true);
    setResponseData({
      accepted: false,
      counterAmount: proposal.amount.toString(),
      message: '',
    });
  };

  const handleViewDetails = (proposal) => {
    setSelectedProposal(proposal);
    setShowDetailsModal(true);
  };

  const handleSubmitResponse = async () => {
    if (!responseData.message.trim()) {
      Swal.fire('Error', 'Por favor incluye un mensaje en tu respuesta', 'error');
      return;
    }

    if (!selectedProposal) {
      Swal.fire('Error', 'No se ha seleccionado una propuesta', 'error');
      return;
    }

    setSubmittingResponse(true);

    try {
      // Preparar los datos para actualizar la propuesta
      const updateData = {
        company_response: responseData.message,
        accepted: responseData.accepted,
        status: 'responded'
      };

      // Si es una contrapropuesta, incluir el monto
      if (!responseData.accepted && responseData.counterAmount) {
        updateData.counter_amount = parseFloat(responseData.counterAmount);
      }

      // Actualizar la propuesta en Supabase
      const result = await updateProposal(selectedProposal.id, updateData);

      if (result.success) {
        Swal.fire('¡Respuesta Enviada!', 'Tu respuesta ha sido enviada al deudor', 'success');
        setShowResponseModal(false);
        setSelectedProposal(null);
        setResponseData({
          accepted: false,
          counterAmount: '',
          message: '',
        });
      } else {
        Swal.fire('Error', result.error || 'No se pudo enviar la respuesta', 'error');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      Swal.fire('Error', 'Ocurrió un error al enviar la respuesta', 'error');
    } finally {
      setSubmittingResponse(false);
    }
  };

  const pendingProposals = proposals.filter(p => p.status === 'pending');
  const respondedProposals = proposals.filter(p => p.status === 'responded');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-700 to-blue-800 rounded-2xl p-3 md:p-6 shadow-strong border border-slate-200">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-white rounded-full -translate-y-16 md:-translate-y-32 translate-x-16 md:translate-x-32" />
          <div className="absolute bottom-0 left-0 w-24 h-24 md:w-48 md:h-48 bg-white rounded-full translate-y-12 md:translate-y-24 -translate-x-12 md:-translate-x-24" />
        </div>

        <div className="relative">
          {/* Mobile: Stack vertically, Desktop: Side by side */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-6 mb-3 lg:mb-4">
            {/* Left side - Title and description */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-5">
              <div className="text-center sm:text-left">
                <h1 className="text-lg md:text-2xl font-display font-bold tracking-tight text-white mb-1">
                  Propuestas de Pago
                </h1>
                <p className="text-white text-sm md:text-base font-medium max-w-lg">
                  Revisa y responde a las propuestas enviadas por tus deudores
                </p>
              </div>
            </div>

          </div>

          {/* Quick stats in header */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mt-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl p-2 md:p-3 border border-white/20">
              <div className="flex items-center gap-2 md:gap-3">
                <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-white flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white truncate">Pendientes</p>
                  <p className="text-sm md:text-lg font-bold text-white">{pendingProposals.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl p-2 md:p-3 border border-white/20">
              <div className="flex items-center gap-2 md:gap-3">
                <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4 text-white flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white truncate">Respondidas</p>
                  <p className="text-sm md:text-lg font-bold text-white">{respondedProposals.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl p-2 md:p-3 border border-white/20">
              <div className="flex items-center gap-2 md:gap-3">
                <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-white flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white truncate">Aceptadas</p>
                  <p className="text-sm md:text-lg font-bold text-white">{proposals.filter(p => p.status === 'accepted').length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl p-2 md:p-3 border border-white/20">
              <div className="flex items-center gap-2 md:gap-3">
                <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-white flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white truncate">Monto Total</p>
                  <p className="text-sm md:text-lg font-bold text-white">{formatCurrency(proposals.reduce((sum, p) => sum + p.amount, 0))}</p>
                </div>
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

      {/* Proposals List */}
      {proposals.length === 0 ? (
        <Card
          variant="elevated"
          className="text-center py-16 animate-fade-in"
        >
          <div className="p-8 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-3xl inline-block mb-8">
            <Users className="w-20 h-20 text-secondary-600" />
          </div>
          <h3 className="text-3xl font-display font-bold text-secondary-900 mb-4">
            No hay propuestas aún
          </h3>
          <p className="text-lg text-secondary-600 mb-6 max-w-md mx-auto">
            Las propuestas de pago aparecerán aquí cuando los deudores las envíen.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {proposals.map((proposal, index) => (
            <Card
              key={proposal.id}
              variant="elevated"
              className={`group hover:shadow-md transition-all duration-200 ${proposal.status === 'pending' ? 'ring-2 ring-warning-200' : ''}`}
              style={{ animationDelay: `${300 + index * 50}ms` }}
            >
              <div className="p-4">
                {/* Header con ícono, título y badges */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-br from-info-100 to-info-200 rounded-lg flex-shrink-0">
                    {getStatusIcon(proposal.status)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-secondary-900 font-display truncate">
                        Propuesta de {proposal.debtorName}
                      </h3>
                      {getStatusBadge(proposal.status)}
                      <Badge variant="info" size="sm" className="font-medium">
                        {getPaymentPlanLabel(proposal.paymentPlan)}
                      </Badge>
                    </div>

                    {/* Descripción truncada */}
                    <p className="text-secondary-600 text-sm leading-relaxed line-clamp-2 mb-3">
                      {proposal.description}
                    </p>
                  </div>
                </div>

                {/* Información responsiva */}
                <div className="space-y-3">
                  {/* Primera fila: Monto y Deudor */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-success-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-secondary-500 uppercase tracking-wide">Monto</p>
                        <p className="text-sm font-bold text-success-600">
                          {formatCurrency(proposal.amount)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-secondary-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-secondary-500 uppercase tracking-wide">Deudor</p>
                        <p className="text-sm font-semibold text-secondary-900">
                          {proposal.debtorRut}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Segunda fila: Fecha y acciones */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-info-500 flex-shrink-0" />
                      <p className="text-sm font-semibold text-info-900">
                        Enviada {formatDate(proposal.submittedAt)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:scale-105 transition-all text-xs px-3 py-1.5"
                        onClick={() => handleViewDetails(proposal)}
                      >
                        Ver Detalles
                      </Button>
                      {proposal.status === 'pending' && (
                        <Button
                          variant="gradient"
                          size="sm"
                          className="hover:scale-105 transition-all text-xs px-3 py-1.5"
                          leftIcon={<ArrowRight className="w-3 h-3" />}
                          onClick={() => handleRespond(proposal)}
                        >
                          Responder
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Ver Detalles */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title=""
        size="xl"
      >
        <div className="space-y-8">
          {/* Modern Header */}
          <div className="text-center">
            <div className="p-6 bg-gradient-to-br from-info-100 to-info-200 rounded-3xl inline-block mb-6">
              <HeartHandshake className="w-16 h-16 text-info-600" />
            </div>
            <h2 className="text-3xl font-display font-bold text-secondary-900 mb-2">
              Detalles de la Propuesta
            </h2>
            <p className="text-secondary-600 text-lg">
              Información completa de la propuesta de pago enviada por el deudor
            </p>
          </div>

          {/* Status Banner */}
          {selectedProposal && (
            <div className="bg-gradient-to-r from-info-50 to-info-100/50 border-2 border-info-200 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-info-500 rounded-xl">
                    {getStatusIcon(selectedProposal.status)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-info-900 font-display">
                      Propuesta #{selectedProposal.id}
                    </h3>
                    <p className="text-info-700">
                      Enviada por {selectedProposal.debtorName} ({selectedProposal.debtorRut})
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(selectedProposal.status)}
                  <p className="text-sm text-info-600 mt-2">
                    {formatDate(selectedProposal.submittedAt)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedProposal && (
            <div className="space-y-6">
              {/* Información Principal */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Detalles Financieros */}
                <div className="bg-gradient-to-r from-success-50 to-success-100/50 border-2 border-success-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-success-500 rounded-lg">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-display font-bold text-success-900">
                      Detalles Financieros
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white/60 rounded-xl p-4">
                      <p className="text-sm font-medium text-success-700 mb-2">💰 Monto Propuesto</p>
                      <p className="text-4xl font-bold text-success-600">
                        {formatCurrency(selectedProposal.amount)}
                      </p>
                    </div>

                    <div className="bg-white/60 rounded-xl p-4">
                      <p className="text-sm font-medium text-success-700 mb-2">📋 Plan de Pago</p>
                      <p className="text-lg font-semibold text-success-800">
                        {getPaymentPlanLabel(selectedProposal.paymentPlan)}
                      </p>
                      <p className="text-sm text-success-600 mt-1">
                        Referencia: {selectedProposal.debtReference}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Información del Deudor */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-2 border-blue-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-display font-bold text-blue-900">
                      Información del Deudor
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white/60 rounded-xl p-4">
                      <p className="text-sm font-medium text-blue-700 mb-2">👤 Nombre Completo</p>
                      <p className="text-lg font-semibold text-blue-900">
                        {selectedProposal.debtorName}
                      </p>
                    </div>

                    <div className="bg-white/60 rounded-xl p-4">
                      <p className="text-sm font-medium text-blue-700 mb-2">📄 RUT</p>
                      <p className="text-lg font-semibold text-blue-900">
                        {selectedProposal.debtorRut}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mensaje Completo del Deudor */}
              <div className="bg-gradient-to-r from-warning-50 to-warning-100/50 border-2 border-warning-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-warning-500 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-warning-900">
                    Mensaje del Deudor
                  </h3>
                </div>

                <div className="bg-white/60 rounded-xl p-6">
                  <p className="text-warning-900 text-lg leading-relaxed italic">
                    "{selectedProposal.description}"
                  </p>
                </div>
              </div>

              {/* Información Temporal Detallada */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-2 border-blue-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-blue-900">
                    Información Temporal
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/60 rounded-xl p-4">
                    <p className="text-sm font-medium text-blue-700 mb-2">📅 Fecha de Envío</p>
                    <p className="text-xl font-bold text-blue-900">
                      {formatDate(selectedProposal.submittedAt)}
                    </p>
                  </div>

                  <div className="bg-white/60 rounded-xl p-4">
                    <p className="text-sm font-medium text-blue-700 mb-2">⏰ Hora Exacta</p>
                    <p className="text-lg font-semibold text-blue-900">
                      {new Date(selectedProposal.submittedAt).toLocaleString('es-CL', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </p>
                  </div>

                  <div className="bg-white/60 rounded-xl p-4 md:col-span-2">
                    <p className="text-sm font-medium text-blue-700 mb-2">📆 Fecha Completa</p>
                    <p className="text-lg font-semibold text-blue-900">
                      {new Date(selectedProposal.submittedAt).toLocaleString('es-CL', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Consejos y Recomendaciones */}
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-2 border-emerald-200 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-500 rounded-lg flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-emerald-900 mb-4">
                      ¿Qué puedes hacer ahora?
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/60 rounded-xl p-4">
                        <h4 className="font-semibold text-emerald-800 mb-2">✅ Aceptar Propuesta</h4>
                        <p className="text-sm text-emerald-700">
                          Si el monto y condiciones te parecen adecuadas, puedes aceptar la propuesta y generar un acuerdo automáticamente.
                        </p>
                      </div>

                      <div className="bg-white/60 rounded-xl p-4">
                        <h4 className="font-semibold text-emerald-800 mb-2">💬 Hacer Contrapropuesta</h4>
                        <p className="text-sm text-emerald-700">
                          Si necesitas ajustar el monto o condiciones, puedes enviar una contrapropuesta para continuar negociando.
                        </p>
                      </div>

                      <div className="bg-white/60 rounded-xl p-4">
                        <h4 className="font-semibold text-emerald-800 mb-2">📊 Revisar Historial</h4>
                        <p className="text-sm text-emerald-700">
                          Consulta el historial de pagos y comportamiento del deudor antes de tomar una decisión.
                        </p>
                      </div>

                      <div className="bg-white/60 rounded-xl p-4">
                        <h4 className="font-semibold text-emerald-800 mb-2">📞 Contactar Deudor</h4>
                        <p className="text-sm text-emerald-700">
                          Si necesitas más información, puedes contactar directamente al deudor a través de la plataforma.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedProposal(null);
                  }}
                  className="flex-1 hover:scale-105 transition-all py-3"
                >
                  Cerrar Detalles
                </Button>
                {selectedProposal.status === 'pending' && (
                  <Button
                    variant="gradient"
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleRespondToProposal(selectedProposal);
                    }}
                    className="flex-1 shadow-soft hover:shadow-glow-info py-3"
                  >
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Responder Propuesta
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Responder Propuesta */}
      <Modal
        isOpen={showResponseModal}
        onClose={() => setShowResponseModal(false)}
        title=""
        size="xl"
        className="max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-8">
          {/* Modern Header */}
          <div className="text-center">
            <div className="p-6 bg-gradient-to-br from-info-100 to-info-200 rounded-3xl inline-block mb-6">
              <MessageSquare className="w-16 h-16 text-info-600" />
            </div>
            <h2 className="text-3xl font-display font-bold text-secondary-900 mb-2">
              Responder Propuesta de Pago
            </h2>
            <p className="text-secondary-600 text-lg">
              Revisa la propuesta y envía tu respuesta al deudor
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-info-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <span className="text-sm font-medium text-info-700">Revisar Propuesta</span>
            </div>
            <div className="w-12 h-0.5 bg-info-200"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-info-200 rounded-full flex items-center justify-center">
                <span className="text-info-600 font-bold text-sm">2</span>
              </div>
              <span className="text-sm font-medium text-secondary-500">Elegir Respuesta</span>
            </div>
            <div className="w-12 h-0.5 bg-info-200"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-info-200 rounded-full flex items-center justify-center">
                <span className="text-info-600 font-bold text-sm">3</span>
              </div>
              <span className="text-sm font-medium text-secondary-500">Enviar</span>
            </div>
          </div>

          {selectedProposal && (
            <div className="space-y-6">
              {/* Propuesta Recibida - Diseño Mejorado */}
              <div className="bg-gradient-to-r from-info-50 to-info-100/50 border-2 border-info-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-info-500 rounded-lg">
                    <HeartHandshake className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-info-900">
                    Propuesta Recibida
                  </h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white/60 rounded-xl p-4">
                    <p className="text-sm font-medium text-info-700 mb-2">👤 Deudor</p>
                    <p className="text-lg font-bold text-info-900">{selectedProposal.debtorName}</p>
                    <p className="text-sm text-info-700">{selectedProposal.debtorRut}</p>
                  </div>
                  <div className="bg-white/60 rounded-xl p-4">
                    <p className="text-sm font-medium text-info-700 mb-2">💰 Monto Propuesto</p>
                    <p className="text-3xl font-bold text-info-900">{formatCurrency(selectedProposal.amount)}</p>
                    <p className="text-sm text-info-700">{getPaymentPlanLabel(selectedProposal.paymentPlan)}</p>
                  </div>
                </div>

                <div className="bg-white/60 rounded-xl p-6">
                  <p className="text-sm font-medium text-info-700 mb-3">💬 Mensaje del deudor</p>
                  <p className="text-info-900 text-lg leading-relaxed italic">
                    "{selectedProposal.description}"
                  </p>
                </div>
              </div>

              {/* Tu Respuesta - Diseño Interactivo */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-2 border-blue-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-blue-900">
                    Tu Respuesta
                  </h3>
                </div>

                {/* Opciones de Respuesta - Cards Interactivas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div
                    className={`cursor-pointer transition-all duration-200 border-2 rounded-xl p-6 ${
                      responseData.accepted === true
                        ? 'border-success-300 bg-success-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-success-200 hover:shadow-md'
                    }`}
                    onClick={() => setResponseData(prev => ({ ...prev, accepted: true }))}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        responseData.accepted === true ? 'border-success-500 bg-success-500' : 'border-gray-300'
                      }`}>
                        {responseData.accepted === true && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <CheckCircle className={`w-6 h-6 ${responseData.accepted === true ? 'text-success-600' : 'text-gray-400'}`} />
                      <span className={`font-bold text-lg ${responseData.accepted === true ? 'text-success-800' : 'text-gray-700'}`}>
                        Aceptar Propuesta
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 ml-8">
                      El monto y condiciones propuestas te parecen adecuadas. Se generará un acuerdo automáticamente.
                    </p>
                  </div>

                  <div
                    className={`cursor-pointer transition-all duration-200 border-2 rounded-xl p-6 ${
                      responseData.accepted === false
                        ? 'border-warning-300 bg-warning-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-warning-200 hover:shadow-md'
                    }`}
                    onClick={() => setResponseData(prev => ({ ...prev, accepted: false }))}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        responseData.accepted === false ? 'border-warning-500 bg-warning-500' : 'border-gray-300'
                      }`}>
                        {responseData.accepted === false && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <TrendingUp className={`w-6 h-6 ${responseData.accepted === false ? 'text-warning-600' : 'text-gray-400'}`} />
                      <span className={`font-bold text-lg ${responseData.accepted === false ? 'text-warning-800' : 'text-gray-700'}`}>
                        Hacer Contrapropuesta
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 ml-8">
                      Necesitas ajustar el monto o condiciones. Continuarás negociando con el deudor.
                    </p>
                  </div>
                </div>

                {/* Monto Contrapropuesto - Solo si no acepta */}
                {responseData.accepted === false && (
                  <div className="bg-white/60 rounded-xl p-6 mb-6">
                    <label className="block text-lg font-bold text-secondary-900 mb-4 font-display">
                      💰 Monto Contrapropuesto
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-secondary-400" />
                      <input
                        type="number"
                        className="w-full pl-14 pr-4 py-4 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-warning-500 focus:border-warning-500 bg-white text-xl font-semibold"
                        placeholder="Ej: 180000"
                        value={responseData.counterAmount}
                        onChange={(e) => setResponseData(prev => ({ ...prev, counterAmount: e.target.value }))}
                      />
                    </div>
                    <p className="text-sm text-secondary-600 mt-2">
                      Ingresa el monto que consideras adecuado para continuar la negociación
                    </p>
                  </div>
                )}

                {/* Mensaje de Respuesta */}
                <div className="bg-white/60 rounded-xl p-6">
                  <label className="block text-lg font-bold text-secondary-900 mb-4 font-display">
                    📝 Mensaje de Respuesta
                  </label>
                  <textarea
                    className="w-full px-4 py-4 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white text-lg"
                    rows={5}
                    placeholder="Explica tu decisión y agrega cualquier comentario adicional que consideres importante..."
                    value={responseData.message}
                    onChange={(e) => setResponseData(prev => ({ ...prev, message: e.target.value }))}
                  />
                  <p className="text-sm text-secondary-600 mt-2">
                    Este mensaje será enviado al deudor junto con tu decisión
                  </p>
                </div>
              </div>

              {/* Información Importante - Diseño Mejorado */}
              <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 border-2 border-amber-200 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-500 rounded-lg flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-amber-900 mb-4">
                      Información Importante
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-start gap-3 bg-white/60 rounded-lg p-4">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="font-semibold text-amber-800">Notificación Automática</p>
                          <p className="text-sm text-amber-700">El deudor recibirá una notificación inmediata con tu respuesta</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 bg-white/60 rounded-lg p-4">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="font-semibold text-amber-800">Acuerdo Automático</p>
                          <p className="text-sm text-amber-700">Si aceptas la propuesta, se generará automáticamente un acuerdo de pago vinculante</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 bg-white/60 rounded-lg p-4">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="font-semibold text-amber-800">Negociación Continua</p>
                          <p className="text-sm text-amber-700">Las contrapropuestas permiten continuar la negociación hasta llegar a un acuerdo mutuo</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowResponseModal(false);
                    setSelectedProposal(null);
                    setResponseData({
                      accepted: false,
                      counterAmount: '',
                      message: '',
                    });
                  }}
                  className="flex-1 hover:scale-105 transition-all py-3"
                >
                  Cancelar
                </Button>
                <Button
                  variant="gradient"
                  onClick={handleSubmitResponse}
                  loading={submittingResponse}
                  disabled={submittingResponse}
                  className="flex-1 shadow-soft hover:shadow-glow-info py-3"
                  leftIcon={<MessageSquare className="w-5 h-5" />}
                >
                  {responseData.accepted === true ? '✅ Aceptar y Enviar' : '💬 Enviar Contrapropuesta'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ProposalsPage;