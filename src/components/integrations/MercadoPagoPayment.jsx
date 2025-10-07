/**
 * Componente de Pago con Mercado Pago
 * 
 * Permite a los deudores realizar pagos de deudas o cuotas usando Mercado Pago.
 * Genera preferencias de pago y redirige al checkout de Mercado Pago.
 */

import React, { useState } from 'react';
import { useMercadoPago } from '../../hooks/integrations';
import { useAuth } from '../../context/AuthContext';

const MercadoPagoPayment = ({ debt, onPaymentCreated, installment = null }) => {
  const [loading, setLoading] = useState(false);
  const { createDebtPayment, createInstallmentPaymentForAgreement, isConfigured } = useMercadoPago();
  const { user } = useAuth();

  const handlePayment = async () => {
    setLoading(true);

    try {
      let result;
      
      if (installment) {
        // Pago de cuota
        result = await createInstallmentPaymentForAgreement(debt, installment.number);
      } else {
        // Pago completo de deuda
        result = await createDebtPayment(debt);
      }

      if (result.success) {
        // Redirigir al checkout de Mercado Pago
        const checkoutUrl = result.sandboxInitPoint || result.initPoint;
        window.location.href = checkoutUrl;
        
        if (onPaymentCreated) {
          onPaymentCreated(result);
        }
      }
    } catch (error) {
      console.error('Error al crear pago:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
        <p className="text-sm text-yellow-700">
          Los pagos con Mercado Pago no están disponibles en este momento. 
          Por favor, contacte al administrador.
        </p>
      </div>
    );
  }

  const paymentAmount = installment 
    ? (debt.total_amount / debt.installments)
    : debt.amount;

  const incentiveAmount = paymentAmount * 0.05; // 5% de incentivo

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Pago con Mercado Pago
        </h3>
        <img 
          src="https://i.pinimg.com/originals/67/c8/31/67c831333d5757e2fd46292f5e2d01f5.jpg" 
          alt="Mercado Pago"
          className="h-8"
        />
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">
            {installment ? `Cuota ${installment.number} de ${debt.installments}` : 'Pago completo'}
          </span>
          <span className="font-semibold text-gray-800">
            ${paymentAmount.toLocaleString('es-CL')}
          </span>
        </div>

        <div className="flex justify-between items-center text-green-600">
          <span className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
            </svg>
            Incentivo por pagar
          </span>
          <span className="font-semibold">
            +${incentiveAmount.toLocaleString('es-CL')}
          </span>
        </div>

        <div className="pt-3 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Total a pagar</span>
            <span className="text-2xl font-bold text-blue-600">
              ${paymentAmount.toLocaleString('es-CL')}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={handlePayment}
        disabled={loading}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
          loading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Procesando...
          </span>
        ) : (
          'Pagar con Mercado Pago'
        )}
      </button>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-800">
          🔒 Pago seguro procesado por Mercado Pago. 
          Puedes pagar con tarjeta de crédito, débito, o efectivo en puntos de pago.
        </p>
      </div>

      <div className="mt-3 flex items-center justify-center space-x-4 text-xs text-gray-500">
        <span className="flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
          </svg>
          Pago seguro
        </span>
        <span className="flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
          Certificado
        </span>
      </div>
    </div>
  );
};

export default MercadoPagoPayment;
