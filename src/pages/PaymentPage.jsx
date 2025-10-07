/**
 * Payment Page
 * Página para procesar pagos desde links generados por empresas
 */

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, Button, LoadingSpinner, Badge } from '../components/common';
import { getDebtById } from '../services/databaseService';
import {
  CreditCard,
  Banknote,
  CheckCircle,
  AlertCircle,
  Building,
  User,
  DollarSign,
  Calendar,
  Shield,
  Lock
} from 'lucide-react';

const PaymentPage = () => {
  const { debtId } = useParams();
  const [searchParams] = useSearchParams();
  const [debt, setDebt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('mercadopago');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const method = searchParams.get('method') || 'mercadopago';
    setPaymentMethod(method);
    loadDebt();
  }, [debtId]);

  const loadDebt = async () => {
    if (!debtId) {
      setError('ID de deuda no válido');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await getDebtById(debtId);

      if (result.error) {
        setError('Deuda no encontrada o no autorizada');
      } else {
        setDebt(result.debt);
      }
    } catch (error) {
      console.error('Error loading debt:', error);
      setError('Error al cargar la información de la deuda');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setProcessing(true);
    try {
      if (paymentMethod === 'mercadopago') {
        // Integración con Mercado Pago
        alert('Funcionalidad de Mercado Pago próximamente disponible');
      } else {
        // Transferencia bancaria
        alert('Para transferencias bancarias, contacta directamente con la empresa');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Error al procesar el pago. Intenta de nuevo.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <LoadingSpinner fullScreen text="Cargando información de pago..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <div className="p-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => window.history.back()}>
              Volver
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Pago Seguro</h1>
          </div>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">
            Realiza tu pago de manera segura y rápida
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <DollarSign className="w-6 h-6 text-green-600" />
                  Información del Pago
                </h2>

                {/* Debt Information */}
                <div className="bg-gray-50 rounded-xl p-6 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Detalles de la Deuda
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-500">Deudor</p>
                        <p className="font-semibold text-gray-900">
                          {debt?.user?.full_name || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Building className="w-5 h-5 text-purple-500" />
                      <div>
                        <p className="text-sm text-gray-500">Empresa Acreedora</p>
                        <p className="font-semibold text-gray-900">
                          {debt?.company?.business_name || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-500">Fecha de Creación</p>
                        <p className="font-semibold text-gray-900">
                          {debt?.created_at ? new Date(debt.created_at).toLocaleDateString('es-CL') : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-red-500" />
                      <div>
                        <p className="text-sm text-gray-500">Estado</p>
                        <Badge variant={debt?.status === 'active' ? 'danger' : 'secondary'}>
                          {debt?.status === 'active' ? 'Pendiente' : debt?.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {debt?.description && (
                    <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600">{debt.description}</p>
                    </div>
                  )}
                </div>

                {/* Payment Method Selection */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Método de Pago</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      paymentMethod === 'mercadopago'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}>
                      <input
                        type="radio"
                        value="mercadopago"
                        checked={paymentMethod === 'mercadopago'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <CreditCard className="w-6 h-6" />
                      <div>
                        <p className="font-semibold">Mercado Pago</p>
                        <p className="text-sm opacity-75">Pago electrónico seguro</p>
                      </div>
                    </label>

                    <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      paymentMethod === 'transferencia'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-white hover:border-green-300'
                    }`}>
                      <input
                        type="radio"
                        value="transferencia"
                        checked={paymentMethod === 'transferencia'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-green-600 focus:ring-green-500"
                      />
                      <Banknote className="w-6 h-6" />
                      <div>
                        <p className="font-semibold">Transferencia Bancaria</p>
                        <p className="text-sm opacity-75">Transferencia directa</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-green-900 mb-4">Resumen del Pago</h3>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-green-700">Monto a Pagar:</span>
                      <span className="text-3xl font-bold text-green-600">
                        ${debt?.current_amount?.toLocaleString('es-CL') || '0'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-green-600">Método:</span>
                      <span className="font-medium">
                        {paymentMethod === 'mercadopago' ? 'Mercado Pago' : 'Transferencia Bancaria'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-8">
                  <Button
                    variant="gradient"
                    onClick={handlePayment}
                    loading={processing}
                    className="w-full py-4 text-lg font-semibold"
                    leftIcon={paymentMethod === 'mercadopago' ? <CreditCard className="w-5 h-5" /> : <Banknote className="w-5 h-5" />}
                  >
                    {processing ? 'Procesando...' : `Pagar $${debt?.current_amount?.toLocaleString('es-CL') || '0'}`}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Security Info */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-slate-50 to-gray-100">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Pago Seguro</h3>
                </div>

                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Conexión encriptada SSL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Datos protegidos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Procesamiento seguro</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Help Card */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">¿Necesitas Ayuda?</h3>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  Si tienes problemas con el pago o necesitas asistencia, contacta directamente con la empresa.
                </p>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Empresa:</span>
                    <span className="ml-2 text-gray-900">{debt?.company?.business_name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Email:</span>
                    <span className="ml-2 text-gray-900">{debt?.company?.contact_email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Teléfono:</span>
                    <span className="ml-2 text-gray-900">{debt?.company?.contact_phone || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;