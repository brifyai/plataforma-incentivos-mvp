/**
 * Admin Payments Page - Gestión de Pagos
 *
 * Página administrativa para gestionar todos los pagos del sistema:
 * - Ver pagos pendientes de aprobación
 * - Aprobar/rechazar pagos
 * - Ver historial de pagos completados
 * - Estadísticas de pagos
 */

import { useState, useEffect } from 'react';
import { Card, Badge, Button, LoadingSpinner, Modal, Input, Select } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getRecentPayments, getPendingPayments, getPaymentStats, updatePayment } from '../../services/databaseService';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  Calendar,
  Filter,
  Search,
  CreditCard,
  Building,
  User
} from 'lucide-react';
import Swal from 'sweetalert2';

const AdminPaymentsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [paymentStats, setPaymentStats] = useState({
    totalPayments: 0,
    totalAmount: 0,
    pendingPayments: 0,
    completedPayments: 0,
    failedPayments: 0,
    averagePayment: 0
  });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [recentResult, pendingResult, statsResult] = await Promise.all([
        getRecentPayments(50),
        getPendingPayments(),
        getPaymentStats()
      ]);

      if (recentResult.error) {
        console.error('Error fetching recent payments:', recentResult.error);
      } else {
        setRecentPayments(recentResult.payments || []);
      }

      if (pendingResult.error) {
        console.error('Error fetching pending payments:', pendingResult.error);
      } else {
        setPendingPayments(pendingResult.payments || []);
      }

      if (statsResult.error) {
        console.error('Error fetching payment stats:', statsResult.error);
      } else {
        setPaymentStats(statsResult.stats || {
          totalPayments: 0,
          totalAmount: 0,
          pendingPayments: 0,
          completedPayments: 0,
          failedPayments: 0,
          averagePayment: 0
        });
      }
    } catch (error) {
      console.error('Error fetching payment data:', error);
      setError('Error al cargar datos de pagos');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async (paymentId) => {
    const result = await Swal.fire({
      title: '¿Aprobar pago?',
      text: 'Este pago será marcado como completado y procesado',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Aprobar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setProcessingAction(true);
      try {
        const { error } = await updatePayment(paymentId, {
          status: 'completed',
          processed_at: new Date().toISOString()
        });

        if (error) {
          throw new Error(error);
        }

        await Swal.fire({
          icon: 'success',
          title: 'Pago aprobado',
          text: 'El pago ha sido aprobado y procesado exitosamente',
          timer: 2000
        });

        fetchData(); // Recargar datos
      } catch (error) {
        console.error('Error approving payment:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Error al aprobar pago',
          text: error.message || 'No se pudo aprobar el pago',
          confirmButtonText: 'Aceptar'
        });
      } finally {
        setProcessingAction(false);
      }
    }
  };

  const handleRejectPayment = async (paymentId) => {
    const result = await Swal.fire({
      title: '¿Rechazar pago?',
      text: 'Este pago será marcado como fallido',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setProcessingAction(true);
      try {
        const { error } = await updatePayment(paymentId, {
          status: 'failed',
          processed_at: new Date().toISOString()
        });

        if (error) {
          throw new Error(error);
        }

        await Swal.fire({
          icon: 'success',
          title: 'Pago rechazado',
          text: 'El pago ha sido rechazado',
          timer: 2000
        });

        fetchData(); // Recargar datos
      } catch (error) {
        console.error('Error rejecting payment:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Error al rechazar pago',
          text: error.message || 'No se pudo rechazar el pago',
          confirmButtonText: 'Aceptar'
        });
      } finally {
        setProcessingAction(false);
      }
    }
  };

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Completado
        </Badge>;
      case 'pending':
      case 'awaiting_validation':
        return <Badge variant="warning" className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Pendiente
        </Badge>;
      case 'failed':
        return <Badge variant="danger" className="flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Fallido
        </Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'mercadopago':
        return <CreditCard className="w-4 h-4" />;
      case 'bank_transfer':
        return <Building className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  // Filtrar pagos
  const filteredRecentPayments = recentPayments.filter(payment => {
    const matchesSearch = payment.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar pagos</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => fetchData()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-strong">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <DollarSign className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight">
                Gestión de Pagos
              </h1>
              <p className="text-blue-100 text-lg">
                Administra todos los pagos del sistema
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={fetchData}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            className="bg-indigo-700 hover:bg-indigo-800 text-white border-indigo-600"
          >
            Actualizar
          </Button>
        </div>

        {/* Payment Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-blue-300" />
              <div>
                <p className="text-sm text-blue-100">Total Pagos</p>
                <p className="text-2xl font-bold whitespace-nowrap">{paymentStats.totalPayments}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-blue-300" />
              <div>
                <p className="text-sm text-blue-100">Monto Total</p>
                <p className="text-2xl font-bold whitespace-nowrap">{formatCurrency(paymentStats.totalAmount)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-blue-300" />
              <div>
                <p className="text-sm text-blue-100">Pendientes</p>
                <p className="text-2xl font-bold whitespace-nowrap">{paymentStats.pendingPayments}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-blue-300" />
              <div>
                <p className="text-sm text-blue-100">Completados</p>
                <p className="text-2xl font-bold whitespace-nowrap">{paymentStats.completedPayments}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-blue-300" />
              <div>
                <p className="text-sm text-blue-100">Fallidos</p>
                <p className="text-2xl font-bold whitespace-nowrap">{paymentStats.failedPayments}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Payments Section */}
      {pendingPayments.length > 0 && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-yellow-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Pagos Pendientes ({pendingPayments.length})
                </h2>
              </div>
              <Badge variant="warning" className="animate-pulse">
                Requiere atención
              </Badge>
            </div>

            <div className="space-y-4">
              {pendingPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-yellow-200 rounded-lg">
                      {getPaymentMethodIcon(payment.payment_method)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-900">{payment.debtor}</h3>
                        <Badge variant="warning" size="sm">
                          {formatCurrency(payment.amount)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Empresa: {payment.company}</span>
                        <span>•</span>
                        <span>Método: {payment.payment_method}</span>
                        <span>•</span>
                        <span>Fecha: {formatDate(payment.submitted_date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(payment)}
                      leftIcon={<Eye className="w-4 h-4" />}
                      className="hover:bg-gray-50"
                    >
                      Detalles
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleApprovePayment(payment.id)}
                      leftIcon={<CheckCircle className="w-4 h-4" />}
                      loading={processingAction}
                      className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                    >
                      Aprobar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRejectPayment(payment.id)}
                      leftIcon={<XCircle className="w-4 h-4" />}
                      loading={processingAction}
                    >
                      Rechazar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Recent Payments Section */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Pagos Recientes ({filteredRecentPayments.length})
            </h2>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar pagos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="completed">Completados</option>
                  <option value="pending">Pendientes</option>
                  <option value="failed">Fallidos</option>
                </select>
              </div>
            </div>
          </div>

          {filteredRecentPayments.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No se encontraron pagos
              </h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Aún no hay pagos registrados'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {getPaymentMethodIcon(payment.method)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-900">{payment.user}</h3>
                        <Badge variant={payment.status === 'completed' ? 'success' : payment.status === 'failed' ? 'danger' : 'warning'}>
                          {formatCurrency(payment.amount)}
                        </Badge>
                        {getStatusBadge(payment.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Empresa: {payment.company}</span>
                        <span>•</span>
                        <span>Método: {payment.method}</span>
                        <span>•</span>
                        <span>Fecha: {formatDate(payment.date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(payment)}
                      leftIcon={<Eye className="w-4 h-4" />}
                      className="hover:bg-gray-50"
                    >
                      Detalles
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Payment Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Detalles del Pago"
        size="md"
      >
        {selectedPayment && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID del Pago
                </label>
                <p className="text-gray-900 font-mono text-sm">{selectedPayment.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <div>{getStatusBadge(selectedPayment.status)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto
                </label>
                <p className="text-gray-900 font-semibold">{formatCurrency(selectedPayment.amount)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Método de Pago
                </label>
                <div className="flex items-center gap-2">
                  {getPaymentMethodIcon(selectedPayment.payment_method)}
                  <span className="text-gray-900">{selectedPayment.payment_method}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deudor
                </label>
                <p className="text-gray-900">{selectedPayment.user || selectedPayment.debtor}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Empresa
                </label>
                <p className="text-gray-900">{selectedPayment.company}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Transacción
                </label>
                <p className="text-gray-900">{formatDate(selectedPayment.date || selectedPayment.transaction_date)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Envío
                </label>
                <p className="text-gray-900">{formatDate(selectedPayment.submitted_date)}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setShowDetailsModal(false)}
                className="flex-1"
              >
                Cerrar
              </Button>
              {selectedPayment.status === 'pending' && (
                <>
                  <Button
                    variant="success"
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleApprovePayment(selectedPayment.id);
                    }}
                    loading={processingAction}
                    className="flex-1"
                  >
                    Aprobar
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleRejectPayment(selectedPayment.id);
                    }}
                    loading={processingAction}
                    className="flex-1"
                  >
                    Rechazar
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminPaymentsPage;