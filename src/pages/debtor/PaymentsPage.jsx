/**
 * Payments Page
 *
 * Página para mostrar el historial de pagos del deudor
 */

import { useState } from 'react';
import { Card, Badge, LoadingSpinner, EmptyState, Button, Modal } from '../../components/common';
import { usePayments } from '../../hooks';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Swal from 'sweetalert2';
import {
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Building,
  FileText,
  Download,
  Receipt,
  FileDown,
} from 'lucide-react';

const PaymentsPage = () => {
  const { payments, loading } = usePayments();
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-warning-600" />;
      case 'pending_validation':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-danger-600" />;
      default:
        return <DollarSign className="w-5 h-5 text-secondary-600" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completado</Badge>;
      case 'pending':
        return <Badge variant="warning">Pendiente</Badge>;
      case 'pending_validation':
        return <Badge variant="info">Pendiente de Validación</Badge>;
      case 'failed':
        return <Badge variant="danger">Fallido</Badge>;
      default:
        return <Badge variant="info">{status}</Badge>;
    }
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      credit_card: 'Tarjeta de Crédito',
      debit_card: 'Tarjeta de Débito',
      bank_transfer: 'Transferencia Bancaria',
      mercadopago: 'Mercado Pago',
      wallet: 'Billetera Virtual',
    };
    return labels[method] || method;
  };

  const handleViewReceipt = (payment) => {
    setSelectedPayment(payment);
    setShowReceiptModal(true);
  };

  const handleExportPayments = () => {
    // Simular exportación de datos
    const csvContent = [
      ['ID', 'Monto', 'Estado', 'Método', 'Fecha', 'Empresa', 'Acuerdo'],
      ...payments.map(payment => [
        payment.id,
        payment.amount,
        payment.status,
        getPaymentMethodLabel(payment.payment_method),
        formatDate(payment.transaction_date),
        payment.company_name,
        payment.agreement_title
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pagos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire('¡Éxito!', 'Historial de pagos exportado exitosamente', 'success');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 rounded-3xl p-8 text-white shadow-strong animate-fade-in">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
        </div>

        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <DollarSign className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold tracking-tight">
                  Historial de Pagos
                </h1>
                <p className="text-primary-100 text-lg">
                  Revisa todos tus pagos realizados
                </p>
              </div>
            </div>
            <Button
              variant="glass"
              onClick={handleExportPayments}
              className="shadow-glow hover:scale-105 transition-all"
              leftIcon={<Download className="w-4 h-4" />}
            >
              Exportar
            </Button>
          </div>

          {/* Quick stats in header */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-success-300" />
                <div>
                  <p className="text-sm text-primary-100">Completados</p>
                  <p className="text-2xl font-bold">{payments.filter(p => p.status === 'completed').length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-warning-300" />
                <div>
                  <p className="text-sm text-primary-100">Pendientes</p>
                  <p className="text-2xl font-bold">{payments.filter(p => p.status === 'pending').length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-info-300" />
                <div>
                  <p className="text-sm text-primary-100">En Validación</p>
                  <p className="text-2xl font-bold">{payments.filter(p => p.status === 'pending_validation').length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-accent-300" />
                <div>
                  <p className="text-sm text-primary-100">Total Pagado</p>
                  <p className="text-2xl font-bold">{formatCurrency(payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0))}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payments List */}
      {payments.length === 0 ? (
        <Card
          variant="elevated"
          className="text-center py-16 animate-fade-in"
        >
          <div className="p-8 bg-gradient-to-br from-info-100 to-primary-100 rounded-3xl inline-block mb-8">
            <DollarSign className="w-20 h-20 text-info-600" />
          </div>
          <h3 className="text-3xl font-display font-bold text-secondary-900 mb-4">
            No hay pagos registrados
          </h3>
          <p className="text-lg text-secondary-600 mb-6 max-w-md mx-auto">
            Aún no has realizado ningún pago. Cuando realices tu primer pago, aparecerá aquí.
          </p>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/debtor/agreements'}
            className="hover:scale-105 transition-all"
          >
            Ver Acuerdos Activos
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {payments.map((payment, index) => (
            <Card
              key={payment.id}
              variant="elevated"
              className="group hover:scale-[1.01] transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${300 + index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-2xl group-hover:shadow-soft transition-all duration-300">
                    {getStatusIcon(payment.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1">
                    <div className="p-4 bg-gradient-to-r from-secondary-50 to-secondary-100/50 rounded-2xl border border-secondary-200/50">
                      <p className="text-sm font-medium text-secondary-500 uppercase tracking-wide mb-2">Monto</p>
                      <p className="text-2xl font-bold text-secondary-900 font-display">
                        {formatCurrency(payment.amount)}
                      </p>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-info-50 to-info-100/50 rounded-2xl border border-info-200/50">
                      <p className="text-sm font-medium text-info-600 uppercase tracking-wide mb-2">Método</p>
                      <p className="text-sm font-bold text-secondary-900">
                        {getPaymentMethodLabel(payment.payment_method)}
                      </p>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-primary-50 to-primary-100/50 rounded-2xl border border-primary-200/50">
                      <p className="text-sm font-medium text-primary-600 uppercase tracking-wide mb-2">Fecha</p>
                      <p className="text-sm font-bold text-secondary-900">
                        {formatDate(payment.transaction_date)}
                      </p>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-secondary-50 to-secondary-100/50 rounded-2xl border border-secondary-200/50">
                      <p className="text-sm font-medium text-secondary-500 uppercase tracking-wide mb-2">Estado</p>
                      <div className="mt-1">
                        {getStatusBadge(payment.status)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 ml-6">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => handleViewReceipt(payment)}
                    className="hover:scale-105 transition-all"
                    leftIcon={<Receipt className="w-4 h-4" />}
                  >
                    Ver Recibo
                  </Button>
                  <div className="text-xs text-secondary-500 font-mono bg-secondary-100 px-3 py-1 rounded-full">
                    ID: {payment.id}
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="mt-6 pt-6 border-t border-secondary-200/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center gap-3 p-3 bg-secondary-50/80 rounded-xl">
                    <Building className="w-5 h-5 text-secondary-500" />
                    <div>
                      <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide mb-1">Empresa</p>
                      <p className="text-sm font-semibold text-secondary-900">{payment.company_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-secondary-50/80 rounded-xl">
                    <FileText className="w-5 h-5 text-secondary-500" />
                    <div>
                      <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide mb-1">Acuerdo</p>
                      <p className="text-sm font-semibold text-secondary-900">{payment.agreement_title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-secondary-50/80 rounded-xl">
                    <FileText className="w-5 h-5 text-secondary-500" />
                    <div>
                      <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide mb-1">Deuda</p>
                      <p className="text-sm font-semibold text-secondary-900">#{payment.debt_reference}</p>
                    </div>
                  </div>
                </div>

                {/* Información específica para pagos pendientes de validación */}
                {payment.status === 'pending_validation' && (
                  <div className="bg-gradient-to-r from-info-50 to-info-100/50 border-2 border-info-200 rounded-2xl p-5">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-info-100 rounded-xl">
                        <Clock className="w-6 h-6 text-info-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-info-900 mb-3 font-display">
                          Esperando Validación de la Empresa
                        </h4>
                        <p className="text-sm text-info-800 mb-4">
                          {payment.validation_notes || 'Comprobante de pago enviado. La empresa validará el pago en las próximas 24-48 horas.'}
                        </p>
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2 text-sm text-info-700">
                            <div className="w-2 h-2 bg-info-500 rounded-full"></div>
                            📋 Comprobante adjuntado
                          </div>
                          <div className="flex items-center gap-2 text-sm text-info-700">
                            <div className="w-2 h-2 bg-info-500 rounded-full animate-pulse"></div>
                            ⏱️ Esperando revisión
                          </div>
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

      {/* Modal de Recibo */}
      <Modal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        title="Recibo de Pago"
      >
        {selectedPayment && (
          <div className="space-y-8">
            {/* Header del Recibo */}
            <div className="text-center">
              <div className="p-6 bg-gradient-to-br from-success-100 to-success-200 rounded-3xl inline-block mb-6">
                <Receipt className="w-16 h-16 text-success-600" />
              </div>
              <h2 className="text-3xl font-display font-bold text-secondary-900 mb-2">Recibo de Pago</h2>
              <p className="text-secondary-600 text-lg">Comprobante oficial de transacción</p>
            </div>

            {/* Información del Pago */}
            <div className="bg-gradient-to-r from-secondary-50 to-secondary-100/50 rounded-2xl p-6 border border-secondary-200/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-secondary-900 mb-4 font-display">Detalles del Pago</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                      <span className="text-secondary-600 font-medium">ID de Transacción:</span>
                      <span className="font-mono font-bold text-secondary-900">{selectedPayment.id}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                      <span className="text-secondary-600 font-medium">Fecha:</span>
                      <span className="font-bold text-secondary-900">{formatDate(selectedPayment.transaction_date)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                      <span className="text-secondary-600 font-medium">Método:</span>
                      <span className="font-bold text-secondary-900">{getPaymentMethodLabel(selectedPayment.payment_method)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                      <span className="text-secondary-600 font-medium">Estado:</span>
                      <div className="mt-1">
                        {getStatusBadge(selectedPayment.status)}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-secondary-900 mb-4 font-display">Información del Acuerdo</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                      <span className="text-secondary-600 font-medium">Acuerdo:</span>
                      <span className="font-bold text-secondary-900">{selectedPayment.agreement_title}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                      <span className="text-secondary-600 font-medium">Empresa:</span>
                      <span className="font-bold text-secondary-900">{selectedPayment.company_name}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                      <span className="text-secondary-600 font-medium">Deuda:</span>
                      <span className="font-bold text-secondary-900">#{selectedPayment.debt_reference}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Monto Total */}
            <div className="bg-gradient-to-r from-success-50 to-success-100/50 border-2 border-success-200 rounded-2xl p-8 text-center">
              <div className="text-4xl font-display font-bold text-success-600 mb-3">
                {formatCurrency(selectedPayment.amount)}
              </div>
              <div className="text-success-800 font-bold text-lg">Monto Pagado</div>
              <div className="text-success-700 text-sm mt-2">✓ Incluye incentivo del 5%</div>
            </div>

            {/* Información Adicional */}
            <div className="bg-gradient-to-r from-info-50 to-info-100/50 border-2 border-info-200 rounded-2xl p-6">
              <h4 className="font-bold text-info-900 mb-4 font-display">Información Importante</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-info-500 rounded-full"></div>
                    <span className="text-sm text-info-800">Este recibo es válido como comprobante oficial</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-info-500 rounded-full"></div>
                    <span className="text-sm text-info-800">El pago incluye el incentivo del 5% aplicado</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-info-500 rounded-full"></div>
                    <span className="text-sm text-info-800">Para consultas contactar a la empresa correspondiente</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-info-500 rounded-full"></div>
                    <span className="text-sm text-info-800">Fecha de emisión: {new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex gap-4 pt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReceiptModal(false);
                  setSelectedPayment(null);
                  Swal.fire('¡Cerrado!', 'Recibo cerrado', 'success');
                }}
                className="flex-1 hover:scale-105 transition-all"
              >
                Cerrar
              </Button>
              <Button
                variant="gradient"
                onClick={() => {
                  // Simular descarga del PDF creando contenido HTML
                  const receiptHTML = `
                    <html>
                      <head>
                        <title>Recibo de Pago - ${selectedPayment.id}</title>
                        <style>
                          body { font-family: Arial, sans-serif; margin: 20px; }
                          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                          .section { margin-bottom: 20px; }
                          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                          .field { margin-bottom: 10px; }
                          .label { font-weight: bold; color: #666; }
                          .value { color: #333; }
                          .total { text-align: center; font-size: 24px; font-weight: bold; color: #22c55e; padding: 20px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; }
                          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
                        </style>
                      </head>
                      <body>
                        <div class="header">
                          <h1>Recibo de Pago</h1>
                          <p>Comprobante oficial de transacción</p>
                          <p>ID: ${selectedPayment.id}</p>
                        </div>

                        <div class="section">
                          <h2>Detalles del Pago</h2>
                          <div class="grid">
                            <div>
                              <div class="field">
                                <span class="label">Fecha:</span>
                                <span class="value">${formatDate(selectedPayment.transaction_date)}</span>
                              </div>
                              <div className="field">
                                <span class="label">Método:</span>
                                <span class="value">${getPaymentMethodLabel(selectedPayment.payment_method)}</span>
                              </div>
                              <div class="field">
                                <span class="label">Estado:</span>
                                <span class="value">${selectedPayment.status}</span>
                              </div>
                            </div>
                            <div>
                              <div class="field">
                                <span class="label">Acuerdo:</span>
                                <span class="value">${selectedPayment.agreement_title}</span>
                              </div>
                              <div class="field">
                                <span class="label">Empresa:</span>
                                <span class="value">${selectedPayment.company_name}</span>
                              </div>
                              <div class="field">
                                <span class="label">Deuda:</span>
                                <span class="value">#${selectedPayment.debt_reference}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div class="total">
                          Monto Pagado: ${formatCurrency(selectedPayment.amount)}
                        </div>

                        <div class="footer">
                          <p><strong>Información Importante:</strong></p>
                          <ul>
                            <li>Este recibo es válido como comprobante oficial</li>
                            <li>El pago incluye el incentivo del 5% aplicado</li>
                            <li>Para consultas contactar a la empresa correspondiente</li>
                            <li>Fecha de emisión: ${new Date().toLocaleDateString()}</li>
                          </ul>
                        </div>
                      </body>
                    </html>
                  `;

                  const blob = new Blob([receiptHTML], { type: 'text/html;charset=utf-8;' });
                  const link = document.createElement('a');
                  const url = URL.createObjectURL(blob);
                  link.setAttribute('href', url);
                  link.setAttribute('download', `recibo_pago_${selectedPayment.id}.pdf`);
                  link.style.visibility = 'hidden';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);

                  // Limpiar URL del objeto
                  setTimeout(() => URL.revokeObjectURL(url), 100);

                  Swal.fire('¡Descargado!', 'Recibo descargado exitosamente como PDF', 'success');
                }}
                className="flex-1 shadow-soft hover:shadow-glow"
                leftIcon={<FileDown className="w-4 h-4" />}
              >
                Descargar PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PaymentsPage;