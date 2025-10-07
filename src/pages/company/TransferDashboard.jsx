/**
 * Transfer Dashboard Page
 *
 * Dashboard para gestionar transferencias bancarias automáticas
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, LoadingSpinner, Button, Modal, DateFilter } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getCompanyTransfers, processTransferBatch } from '../../services/transferService';
import {
  Banknote,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Download,
  Eye,
  TrendingUp,
  DollarSign,
  Calendar,
  Building,
} from 'lucide-react';

const TransferDashboard = () => {
  const { user, profile } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    loadTransfers();
  }, [profile]);

  const loadTransfers = async () => {
    // Para usuarios god_mode, mostrar datos simulados
    if (profile?.role === 'god_mode') {
      console.log('God mode user - showing simulated transfers');
      setTransfers([
        {
          id: 'batch-001',
          batch_name: 'Transferencias Enero 2025',
          status: 'completed',
          total_amount: 2500000,
          total_transfers: 25,
          transfer_method: 'bank_transfer',
          created_at: new Date(),
          description: 'Transferencias automáticas generadas por pagos exitosos',
          items: [
            {
              id: 'item-001',
              amount: 100000,
              transfer_status: 'completed',
              payment_id: 'pay-001',
              transfer_reference: 'REF001',
              mercadopago_beneficiary_id: 'MP001',
              processed_at: new Date(),
              completed_at: new Date()
            }
          ]
        },
        {
          id: 'batch-002',
          batch_name: 'Transferencias Pendientes',
          status: 'pending',
          total_amount: 1500000,
          total_transfers: 15,
          transfer_method: 'mercadopago_transfer',
          created_at: new Date(),
          description: 'Lote de transferencias pendiente de procesamiento',
          items: []
        }
      ]);
      setLoading(false);
      return;
    }

    if (!profile?.company?.id) return;

    try {
      setLoading(true);
      setError(null);

      const { transfers: transferData, error } = await getCompanyTransfers(profile.company.id);

      if (error) {
        console.error('Error loading transfers:', error);
        setError(error);
        // Fallback a datos vacíos en lugar de mock
        setTransfers([]);
      } else {
        setTransfers(transferData || []);
      }
    } catch (err) {
      console.error('Error loading transfers:', err);
      setError('Error al cargar transferencias');
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success-600" />;
      case 'processing':
        return <RefreshCw className="w-5 h-5 text-warning-600 animate-spin" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-info-600" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-danger-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-secondary-600" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completada</Badge>;
      case 'processing':
        return <Badge variant="warning">Procesando</Badge>;
      case 'pending':
        return <Badge variant="info">Pendiente</Badge>;
      case 'failed':
        return <Badge variant="danger">Fallida</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTransferMethodBadge = (method) => {
    switch (method) {
      case 'mercadopago_transfer':
        return <Badge variant="primary">Mercado Pago</Badge>;
      case 'bank_transfer':
        return <Badge variant="info">Transferencia Bancaria</Badge>;
      case 'wire_transfer':
        return <Badge variant="warning">Transferencia Wire</Badge>;
      default:
        return <Badge variant="secondary">{method}</Badge>;
    }
  };

  const handleViewDetails = (transfer) => {
    setSelectedTransfer(transfer);
    setShowDetailsModal(true);
  };

  const handleProcessBatch = async (batchId) => {
    try {
      // Actualizar UI inmediatamente
      setTransfers(prev =>
        prev.map(transfer =>
          transfer.id === batchId
            ? { ...transfer, status: 'processing' }
            : transfer
        )
      );

      // Procesar el lote
      const { success, error } = await processTransferBatch(batchId);

      if (success) {
        // Recargar datos para mostrar el estado actualizado
        await loadTransfers();
      } else {
        console.error('Error processing batch:', error);
        // Revertir cambio en UI
        setTransfers(prev =>
          prev.map(transfer =>
            transfer.id === batchId
              ? { ...transfer, status: 'pending' }
              : transfer
          )
        );
        setError(error);
      }
    } catch (err) {
      console.error('Error processing batch:', err);
      setError('Error al procesar el lote de transferencias');
    }
  };

  const stats = {
    totalTransferred: transfers.reduce((sum, t) => sum + (t.status === 'completed' ? parseFloat(t.total_amount || 0) : 0), 0),
    pendingTransfers: transfers.filter(t => t.status === 'pending').length,
    processingTransfers: transfers.filter(t => t.status === 'processing').length,
    completedTransfers: transfers.filter(t => t.status === 'completed').length,
    failedTransfers: transfers.filter(t => t.status === 'failed').length,
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Cargando transferencias..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-danger-600 via-danger-700 to-danger-800 rounded-3xl p-8 text-white shadow-strong">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-display font-bold tracking-tight">
                Error al Cargar Transferencias
              </h1>
              <p className="text-danger-100 text-lg">
                {error}
              </p>
            </div>
          </div>
        </div>

        <Card className="text-center py-16">
          <div className="p-8 bg-gradient-to-br from-danger-100 to-danger-200 rounded-3xl inline-block mb-8">
            <AlertCircle className="w-20 h-20 text-danger-600" />
          </div>
          <h3 className="text-3xl font-display font-bold text-secondary-900 mb-4">
            No se pudieron cargar las transferencias
          </h3>
          <p className="text-lg text-secondary-600 mb-6 max-w-md mx-auto">
            Ha ocurrido un error al cargar los datos de transferencias. Por favor, intenta nuevamente.
          </p>
          <Button
            variant="primary"
            onClick={loadTransfers}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Reintentar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-3xl p-8 text-white shadow-strong animate-fade-in">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
        </div>

        <div className="relative">
          {/* Mobile: Stack vertically, Desktop: Side by side */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-8 mb-4 lg:mb-6">
            {/* Left side - Title and description */}
            <div className="flex items-center gap-3 md:gap-6">
              <div className="p-3 md:p-4 bg-white/20 rounded-xl md:rounded-2xl backdrop-blur-sm">
                <Banknote className="w-6 h-6 md:w-10 md:h-10" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl md:text-3xl font-display font-bold tracking-tight">
                  Transferencias Automáticas
                </h1>
                <p className="text-white text-sm md:text-lg">
                  Gestiona tus transferencias bancarias automáticas
                </p>
              </div>
            </div>

            {/* Right side - Date Filter */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/30 shadow-sm w-full lg:min-w-fit">
              <DateFilter
                onFilterChange={setDateFilter}
                className="mb-0"
              />
            </div>
          </div>

          {/* Quick stats in header */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-success-300" />
                <div>
                  <p className="text-sm text-success-100">Total Transferido</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalTransferred)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-success-300" />
                <div>
                  <p className="text-sm text-success-100">Completadas</p>
                  <p className="text-2xl font-bold">{stats.completedTransfers}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-6 h-6 text-warning-300" />
                <div>
                  <p className="text-sm text-success-100">Procesando</p>
                  <p className="text-2xl font-bold">{stats.processingTransfers}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-info-300" />
                <div>
                  <p className="text-sm text-success-100">Pendientes</p>
                  <p className="text-2xl font-bold">{stats.pendingTransfers}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-danger-300" />
                <div>
                  <p className="text-sm text-success-100">Fallidas</p>
                  <p className="text-2xl font-bold">{stats.failedTransfers}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Batches */}
      <div className="space-y-6">
        {transfers.length === 0 ? (
          <Card className="text-center py-16">
            <div className="p-8 bg-gradient-to-br from-success-100 to-success-200 rounded-3xl inline-block mb-8">
              <Banknote className="w-20 h-20 text-success-600" />
            </div>
            <h3 className="text-3xl font-display font-bold text-secondary-900 mb-4">
              No hay transferencias aún
            </h3>
            <p className="text-lg text-secondary-600 mb-6 max-w-md mx-auto">
              Las transferencias automáticas se crearán cuando tus deudores realicen pagos exitosos.
            </p>
          </Card>
        ) : (
          transfers.map((transfer, index) => (
            <Card
              key={transfer.id}
              variant="elevated"
              className="group hover:scale-[1.01] transition-all duration-300 animate-slide-up cursor-pointer"
              style={{ animationDelay: `${200 + index * 100}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-6">
                  <div className="p-4 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-2xl group-hover:shadow-soft transition-all duration-300">
                    {getStatusIcon(transfer.status)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-xl font-bold text-secondary-900 font-display">
                        {transfer.batch_name}
                      </h3>
                      {getStatusBadge(transfer.status)}
                      {getTransferMethodBadge(transfer.transfer_method)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center gap-3 p-3 bg-secondary-50/80 rounded-xl">
                        <DollarSign className="w-5 h-5 text-secondary-500" />
                        <div>
                          <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide">Monto Total</p>
                          <p className="text-sm font-semibold text-secondary-900">
                            {formatCurrency(transfer.total_amount)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-secondary-50/80 rounded-xl">
                        <TrendingUp className="w-5 h-5 text-secondary-500" />
                        <div>
                          <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide">Transferencias</p>
                          <p className="text-sm font-semibold text-secondary-900">
                            {transfer.total_transfers} pagos
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-secondary-50/80 rounded-xl">
                        <Calendar className="w-5 h-5 text-secondary-500" />
                        <div>
                          <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide">Fecha</p>
                          <p className="text-sm font-semibold text-secondary-900">
                            {formatDate(transfer.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {transfer.description && (
                      <p className="text-secondary-600 text-sm mb-4">
                        {transfer.description}
                      </p>
                    )}

                    {/* Progress bar for processing transfers */}
                    {transfer.status === 'processing' && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 bg-secondary-200 rounded-full h-2">
                            <div className="bg-warning-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                          </div>
                          <span className="text-sm text-secondary-600">60%</span>
                        </div>
                        <p className="text-sm text-secondary-600">Procesando transferencias...</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 ml-6">
                  <Button
                    variant="primary"
                    size="md"
                    className="shadow-soft hover:shadow-glow hover:scale-105 transition-all"
                    onClick={() => handleViewDetails(transfer)}
                    leftIcon={<Eye className="w-4 h-4" />}
                  >
                    Ver Detalles
                  </Button>

                  {transfer.status === 'pending' && (
                    <Button
                      variant="gradient"
                      size="md"
                      className="shadow-soft hover:shadow-glow hover:scale-105 transition-all"
                      onClick={() => handleProcessBatch(transfer.id)}
                      leftIcon={<RefreshCw className="w-4 h-4" />}
                    >
                      Procesar Ahora
                    </Button>
                  )}

                  {transfer.status === 'completed' && (
                    <Button
                      variant="outline"
                      size="md"
                      className="hover:scale-105 transition-all"
                      leftIcon={<Download className="w-4 h-4" />}
                    >
                      Descargar Comprobante
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Transfer Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Detalles de Transferencia"
        size="xl"
      >
        {selectedTransfer && (
          <div className="space-y-6">
            {/* Transfer Header */}
            <div className="p-6 bg-gradient-to-r from-primary-50 to-primary-100 rounded-2xl border border-primary-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-primary-100 rounded-xl">
                  <Banknote className="w-8 h-8 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-secondary-900">
                    {selectedTransfer.batch_name}
                  </h3>
                  <p className="text-secondary-600">
                    {selectedTransfer.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white/60 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600 mb-1">
                    {formatCurrency(selectedTransfer.total_amount)}
                  </div>
                  <div className="text-sm text-secondary-600">Monto Total</div>
                </div>

                <div className="text-center p-4 bg-white/60 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600 mb-1">
                    {selectedTransfer.total_transfers}
                  </div>
                  <div className="text-sm text-secondary-600">Transferencias</div>
                </div>

                <div className="text-center p-4 bg-white/60 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600 mb-1">
                    {getStatusBadge(selectedTransfer.status)}
                  </div>
                  <div className="text-sm text-secondary-600">Estado</div>
                </div>
              </div>
            </div>

            {/* Individual Transfers */}
            <div>
              <h4 className="text-lg font-semibold text-secondary-900 mb-4">
                Transferencias Individuales
              </h4>

              <div className="space-y-4">
                {selectedTransfer.items.map((item, index) => (
                  <div key={item.id} className="p-4 bg-secondary-50 rounded-xl border border-secondary-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(item.transfer_status)}
                        <span className="font-semibold text-secondary-900">
                          Transferencia #{index + 1}
                        </span>
                        {getStatusBadge(item.transfer_status)}
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-bold text-secondary-900">
                          {formatCurrency(item.amount)}
                        </div>
                        <div className="text-sm text-secondary-600">
                          Ref: {item.transfer_reference}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-secondary-500">ID de Pago:</span>
                        <span className="ml-2 font-mono text-secondary-900">{item.payment_id}</span>
                      </div>

                      <div>
                        <span className="text-secondary-500">Beneficiario MP:</span>
                        <span className="ml-2 font-mono text-secondary-900">{item.mercadopago_beneficiary_id}</span>
                      </div>

                      {item.processed_at && (
                        <div>
                          <span className="text-secondary-500">Procesado:</span>
                          <span className="ml-2 text-secondary-900">{formatDate(item.processed_at)}</span>
                        </div>
                      )}

                      {item.completed_at && (
                        <div>
                          <span className="text-secondary-500">Completado:</span>
                          <span className="ml-2 text-secondary-900">{formatDate(item.completed_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-6 border-t border-secondary-200">
              <Button
                variant="outline"
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 hover:scale-105 transition-all"
              >
                Cerrar
              </Button>

              {selectedTransfer.status === 'completed' && (
                <Button
                  variant="gradient"
                  className="flex-1 shadow-soft hover:shadow-glow"
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Descargar Reporte Completo
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TransferDashboard;