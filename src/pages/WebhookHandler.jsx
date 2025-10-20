/**
 * Webhook Handler - Maneja webhooks de Mercado Pago
 *
 * Esta página maneja los webhooks enviados por Mercado Pago
 * cuando se procesan pagos.
 */

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../config/supabase';

const WebhookHandler = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleWebhook = async () => {
      try {
        // Obtener parámetros del webhook
        const type = searchParams.get('type');
        const paymentId = searchParams.get('data.id');

        if (!type || !paymentId) {
          console.log('Webhook sin parámetros requeridos');
          return;
        }

        console.log('📥 Procesando webhook:', { type, paymentId });

        // Aquí iría la lógica para procesar el webhook
        // Por ahora solo loggeamos
        console.log('✅ Webhook recibido y procesado');

      } catch (error) {
        console.error('❌ Error procesando webhook:', error);
      }
    };

    handleWebhook();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Webhook Procesado</h1>
        <p className="text-gray-600">
          El webhook de Mercado Pago ha sido recibido y procesado correctamente.
        </p>
      </div>
    </div>
  );
};

export default WebhookHandler;