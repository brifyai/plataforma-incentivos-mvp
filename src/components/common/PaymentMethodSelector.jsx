/**
 * Payment Method Selector Component
 *
 * Componente para seleccionar método de pago (Transferencia o Mercado Pago)
 */

import { useState } from 'react';
import { Card, Button } from './index';
import {
  CreditCard,
  Building,
  Check,
  AlertCircle,
  Upload,
  DollarSign,
} from 'lucide-react';

const PaymentMethodSelector = ({
  amount,
  onMethodSelect,
  selectedMethod = null,
  showReceiptUpload = false,
  onReceiptUpload = null,
  receiptFile = null,
  receiptUploading = false,
}) => {
  const [method, setMethod] = useState(selectedMethod);

  const paymentMethods = [
    {
      id: 'bank_transfer',
      name: 'Transferencia Bancaria',
      description: 'Paga directamente desde tu banco',
      icon: Building,
      color: 'blue',
      requiresValidation: true,
      features: [
        'Sin comisiones adicionales',
        'Pago directo a la empresa',
        'Requiere subir comprobante',
      ],
    },
    {
      id: 'mercadopago',
      name: 'Mercado Pago',
      description: 'Pago rápido y seguro',
      icon: CreditCard,
      color: 'purple',
      requiresValidation: false,
      features: [
        'Pago instantáneo',
        'Confirmación automática',
        'Múltiples medios de pago',
      ],
    },
  ];

  const handleMethodSelect = (methodId) => {
    setMethod(methodId);
    onMethodSelect?.(methodId);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      onReceiptUpload?.(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="p-4 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl inline-block mb-4">
          <DollarSign className="w-12 h-12 text-primary-600" />
        </div>
        <h3 className="text-2xl font-display font-bold text-secondary-900 mb-2">
          Selecciona Método de Pago
        </h3>
        <p className="text-secondary-600 mb-4">
          Elige cómo quieres realizar tu pago de{' '}
          <span className="font-semibold text-primary-600">
            ${amount?.toLocaleString('es-CL') || '0'}
          </span>
        </p>
      </div>

      {/* Payment Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentMethods.map((paymentMethod) => {
          const Icon = paymentMethod.icon;
          const isSelected = method === paymentMethod.id;

          return (
            <Card
              key={paymentMethod.id}
              variant={isSelected ? 'elevated' : 'glass'}
              className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                isSelected
                  ? 'ring-2 ring-primary-500 shadow-glow'
                  : 'hover:shadow-soft'
              }`}
              onClick={() => handleMethodSelect(paymentMethod.id)}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 bg-${paymentMethod.color}-100 rounded-xl`}>
                      <Icon className={`w-6 h-6 text-${paymentMethod.color}-600`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-secondary-900">
                        {paymentMethod.name}
                      </h4>
                      <p className="text-sm text-secondary-600">
                        {paymentMethod.description}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="p-2 bg-primary-100 rounded-full">
                      <Check className="w-5 h-5 text-primary-600" />
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-4">
                  {paymentMethod.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-secondary-700">
                      <div className="w-1.5 h-1.5 bg-secondary-400 rounded-full flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Nuevo modelo económico */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm font-medium text-green-800">Beneficio por cierre</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Al completar exitosamente este pago, recibirás <strong>$30.000</strong> de incentivo.
                  </p>
                </div>

                {/* Validation Notice */}
                {paymentMethod.requiresValidation && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span className="text-sm text-amber-800">
                      Requiere validación manual de comprobante
                    </span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Receipt Upload Section */}
      {showReceiptUpload && method === 'bank_transfer' && (
        <Card variant="elevated" className="animate-slide-up">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-secondary-900">
                  Subir Comprobante de Pago
                </h4>
                <p className="text-sm text-secondary-600">
                  Sube el comprobante de tu transferencia para validación
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* File Input */}
              <div className="border-2 border-dashed border-secondary-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="receipt-upload"
                  disabled={receiptUploading}
                />
                <label
                  htmlFor="receipt-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <div className="p-4 bg-secondary-100 rounded-full">
                    <Upload className="w-8 h-8 text-secondary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-secondary-900">
                      {receiptFile ? receiptFile.name : 'Haz clic para seleccionar archivo'}
                    </p>
                    <p className="text-sm text-secondary-600">
                      PNG, JPG, PDF hasta 10MB
                    </p>
                  </div>
                </label>
              </div>

              {/* File Preview */}
              {receiptFile && (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-900">{receiptFile.name}</p>
                      <p className="text-sm text-green-700">
                        {(receiptFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  {receiptUploading && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600" />
                  )}
                </div>
              )}

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-medium text-blue-900 mb-2">Instrucciones:</h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• El comprobante debe mostrar claramente el monto y fecha de la transferencia</li>
                  <li>• Asegúrate de que el nombre del destinatario sea visible</li>
                  <li>• La validación puede tardar hasta 24 horas hábiles</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Mercado Pago Notice */}
      {method === 'mercadopago' && (
        <Card variant="elevated" className="bg-gradient-to-r from-blue-50 to-blue-50 border-blue-200">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-semibold text-secondary-900">
                Pago con Mercado Pago
              </h4>
            </div>
            <div className="space-y-3 text-sm text-secondary-700">
              <p>
                <strong>Confirmación automática:</strong> Una vez completado el pago,
                se confirmará inmediatamente en tu historial.
              </p>
              <p>
                <strong>Sin comisiones por transacción:</strong> La empresa de cobranza
                asume todos los costos de Mercado Pago.
              </p>
              <p>
                <strong>Modelo de negocio:</strong> Recibirás $30.000 de incentivo por
                este cierre exitoso, pagado desde las comisiones mensuales de la empresa.
              </p>
              <p>
                <strong>Seguridad:</strong> Tus datos están protegidos con encriptación
                de nivel bancario.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PaymentMethodSelector;