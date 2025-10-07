/**
 * Payment Receipt Manager Component
 *
 * Componente para que las empresas gestionen comprobantes de pago pendientes
 */

import { useState, useEffect } from 'react';
import { Card, Button, Modal, Badge } from './index';
import {
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Clock,
  User,
  DollarSign,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { getPendingReceiptsForCompany, updatePaymentReceiptValidation } from '../../services/databaseService';
import { updatePayment } from '../../services/databaseService';
import { createNotification } from '../../services/databaseService';
import Swal from 'sweetalert2';

const PaymentReceiptManager = ({ companyId }) => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationNotes, setValidationNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Cargar comprobantes pendientes
  const loadPendingReceipts = async () => {
    try {
      setLoading(true);
      const { receipts: data, error } = await getPendingReceiptsForCompany(companyId);

      if (error) {
        console.error('Error loading receipts:', error);
        return;
      }

      setReceipts(data || []);
    } catch (error) {
      console.error('Error loading pending receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      loadPendingReceipts();
    }
  }, [companyId]);

  // Validar comprobante
  const handleValidateReceipt = async (receiptId, status) => {
    try {
      setProcessing(true);

      // Actualizar comprobante
      const { error: receiptError } = await updatePaymentReceiptValidation(receiptId, {
        status,
        validatedBy: 'current-user-id', // TODO: Obtener del contexto de auth
        notes: validationNotes,
      });

      if (receiptError) {
        throw new Error(receiptError);
      }

      // Actualizar estado del pago
      const receipt = receipts.find(r => r.id === receiptId);
      if (receipt) {
        const newPaymentStatus = status === 'approved' ? 'completed' : 'failed';

        const { error: paymentError } = await updatePayment(receipt.payment_id, {
          status: newPaymentStatus,
          validation_status: status,
          validated_at: new Date().toISOString(),
          validated_by: 'current-user-id', // TODO: Obtener del contexto de auth
          validation_notes: validationNotes,
        });

        if (paymentError) {
          throw new Error(paymentError);
        }

        // Si fue aprobado, crear notificación para el usuario
        if (status === 'approved') {
          await createNotification({
            user_id: receipt.payment.user_id,
            type: 'payment_confirmed',
            title: 'Pago Validado',
            message: `Tu pago de $${receipt.payment.amount.toLocaleString('es-CL')} ha sido validado exitosamente.`,
            related_entity_id: receipt.payment_id,
            related_entity_type: 'payment',
            action_url: '/debtor/payments',
          });
        } else {
          // Si fue rechazado, crear notificación de rechazo
          await createNotification({
            user_id: receipt.payment.user_id,
            type: 'payment_confirmed', // Reutilizar tipo existente
            title: 'Pago Rechazado',
            message: `Tu comprobante de pago ha sido rechazado. Motivo: ${validationNotes}`,
            related_entity_id: receipt.payment_id,
            related_entity_type: 'payment',
            action_url: '/debtor/payments',
          });
        }
      }

      // Recargar lista
      await loadPendingReceipts();
      setShowValidationModal(false);
      setSelectedReceipt(null);
      setValidationNotes('');

      // Mostrar mensaje de éxito
      const actionText = status === 'approved' ? 'aprobado' : 'rechazado';
      Swal.fire({
        title: '¡Comprobante Validado!',
        text: `El comprobante ha sido ${actionText} exitosamente.`,
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });

    } catch (error) {
      console.error('Error validating receipt:', error);
      Swal.fire({
        title: 'Error',
        text: 'Error al validar el comprobante. Por favor, intenta de nuevo.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setProcessing(false);
    }
  };

  // Abrir modal de validación
  const openValidationModal = (receipt, action) => {
    setSelectedReceipt({ ...receipt, action });
    setValidationNotes('');
    setShowValidationModal(true);
  };

  // Descargar comprobante
  const downloadReceipt = (receipt) => {
    if (receipt.file_url) {
      window.open(receipt.file_url, '_blank');
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-secondary-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-secondary-200 rounded"></div>
            <div className="h-16 bg-secondary-200 rounded"></div>
            <div className="h-16 bg-secondary-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-secondary-900">
              Comprobantes Pendientes
            </h3>
            <p className="text-sm text-secondary-600">
              {receipts.length} comprobante{receipts.length !== 1 ? 's' : ''} esperando validación
            </p>
          </div>
        </div>
        <Badge variant="warning" className="px-3 py-1">
          <Clock className="w-3 h-3 mr-1" />
          Pendientes: {receipts.length}
        </Badge>
      </div>

      {/* Lista de comprobantes */}
      {receipts.length === 0 ? (
        <Card variant="elevated" className="text-center py-12">
          <div className="p-6 bg-green-100 rounded-full inline-block mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h4 className="text-lg font-semibold text-secondary-900 mb-2">
            ¡Todo al día!
          </h4>
          <p className="text-secondary-600">
            No hay comprobantes pendientes de validación.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {receipts.map((receipt) => (
            <Card key={receipt.id} variant="elevated" className="hover:shadow-soft transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Información del pago */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-secondary-500" />
                        <div>
                          <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                            Deudor
                          </p>
                          <p className="text-sm font-semibold text-secondary-900">
                            {receipt.payment?.user?.full_name || 'Usuario'}
                          </p>
                          <p className="text-xs text-secondary-600">
                            {receipt.payment?.user?.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <DollarSign className="w-4 h-4 text-secondary-500" />
                        <div>
                          <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                            Monto
                          </p>
                          <p className="text-lg font-bold text-secondary-900">
                            ${receipt.payment?.amount?.toLocaleString('es-CL') || '0'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-secondary-500" />
                        <div>
                          <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                            Fecha de Subida
                          </p>
                          <p className="text-sm font-semibold text-secondary-900">
                            {new Date(receipt.uploaded_at).toLocaleDateString('es-CL')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Información del archivo */}
                    <div className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg">
                      <FileText className="w-5 h-5 text-secondary-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-secondary-900">
                          {receipt.file_name}
                        </p>
                        <p className="text-xs text-secondary-600">
                          {(receipt.file_size / 1024 / 1024).toFixed(2)} MB • {receipt.file_type}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadReceipt(receipt)}
                        leftIcon={<Eye className="w-3 h-3" />}
                      >
                        Ver
                      </Button>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 ml-6">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => openValidationModal(receipt, 'approve')}
                      leftIcon={<CheckCircle className="w-4 h-4" />}
                      className="hover:scale-105 transition-all"
                    >
                      Aprobar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => openValidationModal(receipt, 'reject')}
                      leftIcon={<XCircle className="w-4 h-4" />}
                      className="hover:scale-105 transition-all"
                    >
                      Rechazar
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de validación */}
      <Modal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        title={
          selectedReceipt?.action === 'approve'
            ? 'Aprobar Comprobante'
            : 'Rechazar Comprobante'
        }
        size="md"
      >
        <div className="space-y-6">
          {/* Información del comprobante */}
          {selectedReceipt && (
            <div className="p-4 bg-secondary-50 rounded-lg">
              <h4 className="font-semibold text-secondary-900 mb-2">
                Detalles del Comprobante
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-secondary-700">Deudor:</span>
                  <p className="text-secondary-900">
                    {selectedReceipt.payment?.user?.full_name}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-secondary-700">Monto:</span>
                  <p className="text-secondary-900">
                    ${selectedReceipt.payment?.amount?.toLocaleString('es-CL')}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-secondary-700">Archivo:</span>
                  <p className="text-secondary-900 truncate">
                    {selectedReceipt.file_name}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-secondary-700">Fecha:</span>
                  <p className="text-secondary-900">
                    {new Date(selectedReceipt.uploaded_at).toLocaleDateString('es-CL')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notas de validación */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              {selectedReceipt?.action === 'approve'
                ? 'Notas de aprobación (opcional)'
                : 'Motivo del rechazo (requerido)'}
            </label>
            <textarea
              value={validationNotes}
              onChange={(e) => setValidationNotes(e.target.value)}
              placeholder={
                selectedReceipt?.action === 'approve'
                  ? 'Comentarios adicionales sobre la aprobación...'
                  : 'Explica por qué se rechaza el comprobante...'
              }
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              rows={4}
              required={selectedReceipt?.action === 'reject'}
            />
          </div>

          {/* Advertencia para rechazos */}
          {selectedReceipt?.action === 'reject' && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-medium text-red-900 mb-1">
                  Importante
                </h5>
                <p className="text-sm text-red-800">
                  El deudor será notificado del rechazo y podrá subir un nuevo comprobante.
                  Asegúrate de explicar claramente el motivo del rechazo.
                </p>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-4 pt-4 border-t border-secondary-200">
            <Button
              variant="outline"
              onClick={() => setShowValidationModal(false)}
              className="flex-1"
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              variant={selectedReceipt?.action === 'approve' ? 'success' : 'danger'}
              onClick={() => handleValidateReceipt(
                selectedReceipt.id,
                selectedReceipt.action === 'approve' ? 'approved' : 'rejected'
              )}
              className="flex-1"
              disabled={processing || (selectedReceipt?.action === 'reject' && !validationNotes.trim())}
              leftIcon={
                selectedReceipt?.action === 'approve'
                  ? <CheckCircle className="w-4 h-4" />
                  : <XCircle className="w-4 h-4" />
              }
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Procesando...
                </>
              ) : selectedReceipt?.action === 'approve' ? (
                'Aprobar Pago'
              ) : (
                'Rechazar Pago'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PaymentReceiptManager;