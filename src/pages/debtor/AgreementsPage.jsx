/**
 * Agreements Page
 *
 * Página para mostrar los acuerdos activos del deudor
 */

import { useState } from 'react';
import { Card, Badge, LoadingSpinner, EmptyState, Button, Modal } from '../../components/common';
import { useAgreements } from '../../hooks';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Swal from 'sweetalert2';
import {
  FileText,
  CheckCircle,
  Clock,
  Building,
  DollarSign,
  Calendar,
  Eye,
  CreditCard,
  AlertCircle,
} from 'lucide-react';

const AgreementsPage = () => {
  const { agreements, loading } = useAgreements();
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentToProcess, setPaymentToProcess] = useState(null);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Activo</Badge>;
      case 'completed':
        return <Badge variant="success">Completado</Badge>;
      case 'defaulted':
        return <Badge variant="danger">Incumplido</Badge>;
      default:
        return <Badge variant="info">{status}</Badge>;
    }
  };

  const handleViewDetails = (agreement) => {
    setSelectedAgreement(selectedAgreement?.id === agreement.id ? null : agreement);
    Swal.fire('Detalles', `Detalles del acuerdo ${selectedAgreement?.id === agreement.id ? 'ocultados' : 'mostrados'}`, 'info');
  };

  const handlePayInstallment = (agreement) => {
    // Encontrar la próxima cuota pendiente
    const nextPayment = agreement.payment_plan.find(payment => payment.status === 'pending');
    if (nextPayment) {
      setPaymentToProcess({ agreement, payment: nextPayment });
      setShowPaymentModal(true);
    } else {
      Swal.fire('Error', 'No hay cuotas pendientes para pagar', 'error');
    }
  };

  const confirmPayment = () => {
    if (paymentToProcess) {
      // Simular procesamiento de pago
      Swal.fire('¡Pago Procesado!', `Pago de ${formatCurrency(paymentToProcess.payment.amount)} procesado exitosamente!`, 'success');
      setShowPaymentModal(false);
      setPaymentToProcess(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-success-600 via-primary-600 to-success-700 rounded-3xl p-8 text-white shadow-strong animate-fade-in">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight">
                Mis Acuerdos
              </h1>
              <p className="text-primary-100 text-lg">
                Gestiona tus acuerdos de pago activos
              </p>
            </div>
          </div>

          {/* Quick stats in header */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-success-300" />
                <div>
                  <p className="text-sm text-primary-100">Acuerdos Activos</p>
                  <p className="text-2xl font-bold">{agreements.filter(a => a.status === 'active').length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-warning-300" />
                <div>
                  <p className="text-sm text-primary-100">Total Acordado</p>
                  <p className="text-2xl font-bold">{formatCurrency(agreements.reduce((sum, a) => sum + a.total_agreed_amount, 0))}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-info-300" />
                <div>
                  <p className="text-sm text-primary-100">Próxima Cuota</p>
                  <p className="text-2xl font-bold">{agreements.length > 0 ? formatDate(agreements.find(a => a.payment_plan && a.payment_plan.some(p => p.status === 'pending'))?.payment_plan.find(p => p.status === 'pending')?.due_date || 'N/A') : 'N/A'}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-accent-300" />
                <div>
                  <p className="text-sm text-primary-100">Cuotas Pagadas</p>
                  <p className="text-2xl font-bold">{agreements.reduce((sum, a) => sum + (a.payment_plan ? a.payment_plan.filter(p => p.status === 'paid').length : 0), 0)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agreements List */}
      {agreements.length === 0 ? (
        <Card
          variant="elevated"
          className="text-center py-16 animate-fade-in"
        >
          <div className="p-8 bg-gradient-to-br from-success-100 to-primary-100 rounded-3xl inline-block mb-8">
            <CheckCircle className="w-20 h-20 text-success-600" />
          </div>
          <h3 className="text-3xl font-display font-bold text-secondary-900 mb-4">
            No hay acuerdos activos
          </h3>
          <p className="text-lg text-secondary-600 mb-6 max-w-md mx-auto">
            Actualmente no tienes acuerdos de pago activos. Cuando aceptes una oferta, aparecerá aquí.
          </p>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/debtor/offers'}
            className="hover:scale-105 transition-all"
          >
            Ver Ofertas Disponibles
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6">
          {agreements.map((agreement, index) => (
            <Card
              key={agreement.id}
              variant="elevated"
              className="group hover:scale-[1.01] transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${300 + index * 100}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-6">
                  <div className="p-4 bg-gradient-to-br from-success-100 to-success-200 rounded-2xl group-hover:shadow-soft transition-all duration-300">
                    <CheckCircle className="w-6 h-6 text-success-600" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-2xl font-bold text-secondary-900 font-display">
                        {agreement.offer_title}
                      </h3>
                      {getStatusBadge(agreement.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center gap-3 p-3 bg-secondary-50/80 rounded-xl">
                        <Building className="w-5 h-5 text-secondary-500" />
                        <div>
                          <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide mb-1">Empresa</p>
                          <p className="text-sm font-semibold text-secondary-900">
                            {agreement.company_name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-secondary-50/80 rounded-xl">
                        <FileText className="w-5 h-5 text-secondary-500" />
                        <div>
                          <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide mb-1">Deuda</p>
                          <p className="text-sm font-semibold text-secondary-900">
                            #{agreement.debt_reference}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-secondary-50/80 rounded-xl">
                        <Calendar className="w-5 h-5 text-secondary-500" />
                        <div>
                          <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide mb-1">Aceptado</p>
                          <p className="text-sm font-semibold text-secondary-900">
                            {formatDate(agreement.acceptance_date)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="p-4 bg-gradient-to-r from-secondary-50 to-secondary-100/50 rounded-2xl border border-secondary-200/50">
                        <p className="text-sm font-medium text-secondary-500 uppercase tracking-wide mb-2">Monto Total Acordado</p>
                        <p className="text-2xl font-bold text-secondary-900 font-display">
                          {formatCurrency(agreement.total_agreed_amount)}
                        </p>
                      </div>

                      <div className="p-4 bg-gradient-to-r from-success-50 to-success-100/50 rounded-2xl border border-success-200/50">
                        <p className="text-sm font-medium text-success-600 uppercase tracking-wide mb-2">Monto Pagado</p>
                        <p className="text-2xl font-bold text-success-600 font-display">
                          {formatCurrency(agreement.amount_paid)}
                        </p>
                      </div>

                      <div className="p-4 bg-gradient-to-r from-warning-50 to-warning-100/50 rounded-2xl border border-warning-200/50">
                        <p className="text-sm font-medium text-warning-600 uppercase tracking-wide mb-2">Saldo Pendiente</p>
                        <p className="text-2xl font-bold text-warning-600 font-display">
                          {formatCurrency(agreement.total_agreed_amount - agreement.amount_paid)}
                        </p>
                      </div>
                    </div>

                    {/* Payment Plan */}
                    <div className="bg-gradient-to-r from-secondary-50 to-secondary-100/50 rounded-2xl p-5 border border-secondary-200/50">
                      <h4 className="font-bold text-secondary-900 mb-4 font-display">Plan de Pagos</h4>
                      <div className="space-y-3">
                        {agreement.payment_plan.map((payment, index) => (
                          <div key={index} className={`flex items-center justify-between py-3 px-4 rounded-xl border transition-all ${
                            payment.status === 'paid'
                              ? 'bg-success-50/80 border-success-200'
                              : payment.status === 'pending'
                              ? 'bg-warning-50/80 border-warning-200'
                              : 'bg-danger-50/80 border-danger-200'
                          }`}>
                            <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-lg ${
                                payment.status === 'paid'
                                  ? 'bg-success-100'
                                  : payment.status === 'pending'
                                  ? 'bg-warning-100'
                                  : 'bg-danger-100'
                              }`}>
                                <span className={`text-sm font-bold ${
                                  payment.status === 'paid'
                                    ? 'text-success-700'
                                    : payment.status === 'pending'
                                    ? 'text-warning-700'
                                    : 'text-danger-700'
                                }`}>
                                  {index + 1}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-secondary-900">
                                  {formatDate(payment.due_date)}
                                </p>
                                <p className="text-xs text-secondary-500 uppercase tracking-wide">
                                  Cuota {index + 1}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-lg font-bold text-secondary-900 font-display">
                                {formatCurrency(payment.amount)}
                              </span>
                              <Badge variant={
                                payment.status === 'paid' ? 'success' :
                                payment.status === 'pending' ? 'warning' : 'danger'
                              } className="font-semibold">
                                {payment.status === 'paid' ? 'Pagada' :
                                 payment.status === 'pending' ? 'Pendiente' : 'Vencida'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 ml-6">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => handleViewDetails(agreement)}
                    className="hover:scale-105 transition-all"
                    leftIcon={<Eye className="w-4 h-4" />}
                  >
                    {selectedAgreement?.id === agreement.id ? 'Ocultar' : 'Ver'} Detalles
                  </Button>
                  <Button
                    variant="gradient"
                    size="md"
                    onClick={() => handlePayInstallment(agreement)}
                    className="shadow-soft hover:shadow-glow"
                    leftIcon={<CreditCard className="w-4 h-4" />}
                  >
                    Pagar Cuota
                  </Button>
                </div>

                {/* Expanded Details */}
                {selectedAgreement?.id === agreement.id && (
                  <div className="mt-8 pt-8 border-t border-secondary-200/50">
                    <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-6 border border-primary-200/30">
                      <h4 className="text-xl font-bold text-secondary-900 mb-6 font-display">
                        Información Detallada del Acuerdo
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-success-100 rounded-xl">
                              <CheckCircle className="w-5 h-5 text-success-600" />
                            </div>
                            <h5 className="font-bold text-secondary-900">Términos del Acuerdo</h5>
                          </div>
                          <ul className="text-sm text-secondary-600 space-y-2 ml-11">
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-success-500 rounded-full"></div>
                              Mantener pagos puntuales
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-success-500 rounded-full"></div>
                              Notificar cambios de situación
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-success-500 rounded-full"></div>
                              Cumplir con todas las cuotas
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-success-500 rounded-full"></div>
                              Beneficio de incentivo del 5%
                            </li>
                          </ul>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-warning-100 rounded-xl">
                              <Clock className="w-5 h-5 text-warning-600" />
                            </div>
                            <h5 className="font-bold text-secondary-900">Próximos Pasos</h5>
                          </div>
                          <ul className="text-sm text-secondary-600 space-y-2 ml-11">
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-warning-500 rounded-full"></div>
                              Pagar cuota del 15 de abril
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-warning-500 rounded-full"></div>
                              Revisar estado del acuerdo
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-warning-500 rounded-full"></div>
                              Contactar empresa si hay dudas
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Confirmación de Pago */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Confirmar Pago de Cuota"
      >
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-4 bg-gradient-to-br from-success-100 to-success-200 rounded-2xl">
              <CreditCard className="w-8 h-8 text-success-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-secondary-900 font-display">
                Procesar Pago de Cuota
              </h3>
              <p className="text-secondary-600 mt-2">
                Estás a punto de pagar la próxima cuota pendiente de tu acuerdo.
              </p>
            </div>
          </div>

          {paymentToProcess && (
            <div className="bg-gradient-to-r from-secondary-50 to-secondary-100/50 rounded-2xl p-5 border border-secondary-200/50">
              <h4 className="font-bold text-secondary-900 mb-4 font-display">Detalles del Pago</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                  <span className="text-secondary-600 font-medium">Acuerdo:</span>
                  <span className="font-bold text-secondary-900">{paymentToProcess.agreement.offer_title}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                  <span className="text-secondary-600 font-medium">Empresa:</span>
                  <span className="font-bold text-secondary-900">{paymentToProcess.agreement.company_name}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                  <span className="text-secondary-600 font-medium">Fecha de vencimiento:</span>
                  <span className="font-bold text-secondary-900">{formatDate(paymentToProcess.payment.due_date)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-success-50 rounded-xl border-2 border-success-200">
                  <span className="text-success-700 font-bold text-lg">Total a pagar:</span>
                  <span className="text-success-700 font-bold text-2xl font-display">{formatCurrency(paymentToProcess.payment.amount)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-warning-50 to-warning-100/50 border-2 border-warning-200 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-warning-100 rounded-xl">
                <AlertCircle className="w-6 h-6 text-warning-600" />
              </div>
              <div>
                <p className="font-bold text-warning-900 mb-3">Información importante:</p>
                <ul className="space-y-2 text-sm text-warning-800">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-warning-500 rounded-full"></div>
                    El pago se procesará inmediatamente
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-warning-500 rounded-full"></div>
                    Recibirás confirmación por email
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-warning-500 rounded-full"></div>
                    Se aplicará tu incentivo del 5%
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button
              variant="outline"
              onClick={() => setShowPaymentModal(false)}
              className="flex-1 hover:scale-105 transition-all"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={confirmPayment}
              className="flex-1 shadow-soft hover:shadow-glow"
            >
              Confirmar Pago
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AgreementsPage;