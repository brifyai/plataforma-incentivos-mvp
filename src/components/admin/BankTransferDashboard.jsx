/**
 * Bank Transfer Dashboard Component
 *
 * Dashboard administrativo para gestionar transferencias bancarias automáticas
 */

import { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal, Input, LoadingSpinner } from '../common';
import {
  getTransferBatches,
  createTransferBatch,
  processTransferBatch,
} from '../../services/bankTransferService';
import {
  Banknote,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  Download,
  Upload,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const BankTransferDashboard = () => {
  const [batches, setBatches] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingBatch, setProcessingBatch] = useState(null);
  const [showCreateBatchModal, setShowCreateBatchModal] = useState(false);
  const [selectedTransfers, setSelectedTransfers] = useState([]);

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar lotes de transferencias
      const { batches: batchesData, error: batchesError } = await getTransferBatches();
      if (!batchesError) {
        setBatches(batchesData);
      }

      // Cargar transferencias pendientes de todas las empresas
      // Nota: En producción, esto debería filtrarse por empresas activas
      const pendingData = [];
      // Aquí iría lógica para obtener todas las empresas y sus transferencias pendientes

      setPendingTransfers(pendingData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Procesar lote de transferencias
  const handleProcessBatch = async (batchId) => {
    try {
      setProcessingBatch(batchId);

      const { success, results, error } = await processTransferBatch(batchId);

      if (success) {
        // Mostrar resultados
        const successCount = results.successful;
        const failCount = results.failed;

        if (failCount === 0) {
          alert(`✅ Lote procesado exitosamente. ${successCount} transferencias completadas.`);
        } else if (successCount === 0) {
          alert(`❌ Error: Todas las transferencias fallaron.`);
        } else {
          alert(`⚠️ Lote procesado parcialmente. ${successCount} exitosas, ${failCount} fallidas.`);
        }

        // Recargar datos
        await loadData();
      } else {
        alert(`❌ Error al procesar lote: ${error}`);
      }

    } catch (error) {
      console.error('Error processing batch:', error);
      alert('Error al procesar el lote de transferencias');
    } finally {
      setProcessingBatch(null);
    }
  };

  // Crear lote masivo con transferencias pendientes
  const handleCreateMassBatch = async () => {
    if (pendingTransfers.length === 0) {
      alert('No hay transferencias pendientes para procesar');
      return;
    }

    try {
      const batchName = `Transferencias Masivas - ${new Date().toLocaleDateString()}`;

      const transfers = pendingTransfers.map(transfer => ({
        companyId: transfer.company_id,
        amount: transfer.amount,
        bankName: transfer.bank_name,
        accountHolderName: transfer.account_holder_name,
        accountHolderRut: transfer.account_holder_rut,
        accountNumber: transfer.account_number,
        email: transfer.email,
        description: `Pago servicios cobranza - ${transfer.company.business_name}`,
      }));

      const { success, batch, error } = await createTransferBatch(
        transfers,
        batchName
      );

      if (success) {
        alert(`✅ Lote creado exitosamente. ${transfers.length} transferencias listas para procesar.`);
        setShowCreateBatchModal(false);
        await loadData();
      } else {
        alert(`❌ Error al crear lote: ${error}`);
      }

    } catch (error) {
      console.error('Error creating mass batch:', error);
      alert('Error al crear lote masivo');
    }
  };

  // Obtener estadísticas del dashboard
  const getStats = () => {
    const totalBatches = batches.length;
    const pendingBatches = batches.filter(b => b.status === 'pending').length;
    const processingBatches = batches.filter(b => b.status === 'processing').length;
    const completedBatches = batches.filter(b => b.status === 'completed').length;

    const totalTransfers = batches.reduce((sum, b) => sum + b.total_transfers, 0);
    const successfulTransfers = batches.reduce((sum, b) => sum + b.successful_transfers, 0);
    const totalAmount = batches.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);

    return {
      totalBatches,
      pendingBatches,
      processingBatches,
      completedBatches,
      totalTransfers,
      successfulTransfers,
      totalAmount,
      successRate: totalTransfers > 0 ? (successfulTransfers / totalTransfers * 100).toFixed(1) : 0,
    };
  };

  const stats = getStats();

  if (loading) {
    return <LoadingSpinner fullScreen text="Cargando dashboard de transferencias..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Transferencias Bancarias</h1>
            <p className="text-blue-100">
              Gestión automática de pagos a empresas de cobranza
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowCreateBatchModal(true)}
              disabled={pendingTransfers.length === 0}
              leftIcon={<Upload className="w-4 h-4" />}
            >
              Crear Lote Masivo
            </Button>
            <Button
              variant="outline"
              onClick={loadData}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-medium transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Banknote className="w-6 h-6 text-blue-600" />
              </div>
              <Badge variant="info">{stats.totalBatches}</Badge>
            </div>
            <p className="text-sm text-secondary-600 mb-1">Total Lotes</p>
            <p className="text-2xl font-bold text-secondary-900">{stats.totalBatches}</p>
          </div>
        </Card>

        <Card className="hover:shadow-medium transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <Badge variant="warning">{stats.pendingBatches}</Badge>
            </div>
            <p className="text-sm text-secondary-600 mb-1">Lotes Pendientes</p>
            <p className="text-2xl font-bold text-secondary-900">{stats.pendingBatches}</p>
          </div>
        </Card>

        <Card className="hover:shadow-medium transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <Badge variant="success">{stats.successRate}%</Badge>
            </div>
            <p className="text-sm text-secondary-600 mb-1">Tasa de Éxito</p>
            <p className="text-2xl font-bold text-secondary-900">{stats.successRate}%</p>
          </div>
        </Card>

        <Card className="hover:shadow-medium transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <Badge variant="info">{formatCurrency(stats.totalAmount)}</Badge>
            </div>
            <p className="text-sm text-secondary-600 mb-1">Monto Total</p>
            <p className="text-2xl font-bold text-secondary-900">{formatCurrency(stats.totalAmount)}</p>
          </div>
        </Card>
      </div>

      {/* Transferencias Pendientes */}
      {pendingTransfers.length > 0 && (
        <Card title="Transferencias Pendientes" className="border-yellow-200">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <h4 className="font-medium text-yellow-900">
                  {pendingTransfers.length} transferencias pendientes
                </h4>
                <p className="text-sm text-yellow-800">
                  Estas transferencias están listas para ser procesadas en lote
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {pendingTransfers.slice(0, 5).map((transfer) => (
              <div key={transfer.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                <div>
                  <p className="font-medium text-secondary-900">
                    {transfer.company?.business_name}
                  </p>
                  <p className="text-sm text-secondary-600">
                    {formatCurrency(transfer.amount)} • {transfer.account_holder_name}
                  </p>
                </div>
                <Badge variant="warning">Pendiente</Badge>
              </div>
            ))}
            {pendingTransfers.length > 5 && (
              <p className="text-sm text-secondary-600 text-center py-2">
                ... y {pendingTransfers.length - 5} más
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Lotes de Transferencias */}
      <Card title="Lotes de Transferencias">
        {batches.length === 0 ? (
          <div className="text-center py-12">
            <Banknote className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              No hay lotes de transferencias
            </h3>
            <p className="text-secondary-600">
              Los lotes aparecerán aquí cuando se creen transferencias masivas
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {batches.map((batch) => (
              <Card key={batch.id} variant="elevated" className="hover:shadow-soft transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-secondary-900">
                          {batch.name}
                        </h3>
                        <Badge
                          variant={
                            batch.status === 'completed' ? 'success' :
                            batch.status === 'processing' ? 'warning' :
                            batch.status === 'failed' ? 'danger' : 'info'
                          }
                        >
                          {batch.status === 'completed' ? 'Completado' :
                           batch.status === 'processing' ? 'Procesando' :
                           batch.status === 'failed' ? 'Fallido' :
                           batch.status === 'partial' ? 'Parcial' : 'Pendiente'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                            Transferencias
                          </p>
                          <p className="text-lg font-semibold text-secondary-900">
                            {batch.total_transfers}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                            Monto Total
                          </p>
                          <p className="text-lg font-semibold text-secondary-900">
                            {formatCurrency(batch.total_amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                            Exitosas
                          </p>
                          <p className="text-lg font-semibold text-green-600">
                            {batch.successful_transfers || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                            Fallidas
                          </p>
                          <p className="text-lg font-semibold text-red-600">
                            {batch.failed_transfers || 0}
                          </p>
                        </div>
                      </div>

                      {batch.description && (
                        <p className="text-sm text-secondary-600 mb-3">
                          {batch.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-secondary-500">
                        <span>Creado: {new Date(batch.created_at).toLocaleDateString()}</span>
                        {batch.started_at && (
                          <span>Inicio: {new Date(batch.started_at).toLocaleTimeString()}</span>
                        )}
                        {batch.completed_at && (
                          <span>Fin: {new Date(batch.completed_at).toLocaleTimeString()}</span>
                        )}
                      </div>
                    </div>

                    <div className="ml-6">
                      {batch.status === 'pending' && (
                        <Button
                          variant="primary"
                          onClick={() => handleProcessBatch(batch.id)}
                          disabled={processingBatch === batch.id}
                          leftIcon={<Play className="w-4 h-4" />}
                        >
                          {processingBatch === batch.id ? 'Procesando...' : 'Procesar Lote'}
                        </Button>
                      )}

                      {batch.status === 'processing' && (
                        <div className="flex items-center gap-2 text-yellow-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600" />
                          <span className="text-sm font-medium">Procesando...</span>
                        </div>
                      )}

                      {batch.status === 'completed' && (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">Completado</span>
                        </div>
                      )}

                      {batch.status === 'failed' && (
                        <div className="flex items-center gap-2 text-red-600">
                          <XCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">Fallido</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Modal Crear Lote Masivo */}
      <Modal
        isOpen={showCreateBatchModal}
        onClose={() => setShowCreateBatchModal(false)}
        title="Crear Lote de Transferencias Masivas"
        size="lg"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="p-4 bg-blue-100 rounded-full inline-block mb-4">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-secondary-900 mb-2">
              Crear Lote Masivo
            </h3>
            <p className="text-secondary-600">
              Procesar todas las transferencias pendientes en un solo lote
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-3">Resumen del Lote</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-700">Transferencias:</p>
                <p className="text-lg font-semibold text-blue-900">{pendingTransfers.length}</p>
              </div>
              <div>
                <p className="text-sm text-blue-700">Monto Total:</p>
                <p className="text-lg font-semibold text-blue-900">
                  {formatCurrency(pendingTransfers.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900 mb-1">Importante</h4>
                <p className="text-sm text-yellow-800">
                  Esta acción procesará todas las transferencias pendientes. Asegúrate de tener
                  suficiente saldo en tu cuenta de Mercado Pago antes de continuar.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-secondary-200">
            <Button
              variant="outline"
              onClick={() => setShowCreateBatchModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateMassBatch}
              className="flex-1"
              leftIcon={<Play className="w-4 h-4" />}
            >
              Crear y Procesar Lote
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BankTransferDashboard;