/**
 * Netlify Function para Webhooks de MercadoPago
 * 
 * Esta función maneja los webhooks entrantes de MercadoPago
 * y los procesa actualizando el estado de pagos en Supabase
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async (event, context) => {
  // Configurar CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Manejar preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Solo permitir POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parsear el body del webhook
    const payload = JSON.parse(event.body);
    
    console.log('🔔 MercadoPago Webhook recibido:', {
      type: payload.type,
      action: payload.action,
      data_id: payload.data?.id
    });

    // Verificar si es un pago
    if (payload.type === 'payment') {
      const paymentId = payload.data?.id;
      
      if (!paymentId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Payment ID missing' })
        };
      }

      // Aquí deberías integrarte con la API de MercadoPago
      // para obtener los detalles del pago
      const paymentDetails = await getPaymentDetails(paymentId);
      
      if (paymentDetails) {
        // Actualizar el estado del pago en Supabase
        await updatePaymentStatus(paymentDetails);
        
        console.log('✅ Pago procesado:', paymentId);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Webhook processed successfully',
        received: {
          type: payload.type,
          action: payload.action,
          timestamp: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};

/**
 * Obtener detalles del pago desde MercadoPago
 * NOTA: Debes implementar la lógica real aquí
 */
async function getPaymentDetails(paymentId) {
  try {
    // Aquí deberías hacer una llamada a la API de MercadoPago
    // const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    //   headers: {
    //     'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
    //   }
    // });
    // const payment = await response.json();
    
    // Por ahora, simulamos una respuesta
    return {
      id: paymentId,
      status: 'approved', // approved, rejected, pending, etc.
      external_reference: null,
      metadata: {}
    };
  } catch (error) {
    console.error('Error obteniendo detalles del pago:', error);
    return null;
  }
}

/**
 * Actualizar el estado del pago en Supabase
 */
async function updatePaymentStatus(paymentDetails) {
  try {
    const { data, error } = await supabase
      .from('payments')
      .update({
        status: paymentDetails.status,
        updated_at: new Date().toISOString(),
        metadata: paymentDetails.metadata
      })
      .eq('mercadopago_payment_id', paymentDetails.id);

    if (error) {
      console.error('Error actualizando pago en Supabase:', error);
      throw error;
    }

    console.log('✅ Pago actualizado en Supabase:', data);
    
    // Si el pago fue aprobado, podrías querer hacer acciones adicionales
    if (paymentDetails.status === 'approved') {
      await handleApprovedPayment(paymentDetails);
    }

  } catch (error) {
    console.error('Error en updatePaymentStatus:', error);
    throw error;
  }
}

/**
 * Manejar acciones cuando un pago es aprobado
 */
async function handleApprovedPayment(paymentDetails) {
  try {
    // Aquí puedes implementar lógica adicional:
    // - Enviar confirmación por email
    // - Actualizar estado de deudas
    // - Generar comisiones
    // - Enviar notificaciones
    
    console.log('🎉 Pago aprobado - Ejecutando acciones adicionales');
    
    // Ejemplo: Actualizar estado de la deuda asociada
    if (paymentDetails.external_reference) {
      const { error } = await supabase
        .from('debts')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', paymentDetails.external_reference);

      if (error) {
        console.error('Error actualizando deuda:', error);
      }
    }

  } catch (error) {
    console.error('Error en handleApprovedPayment:', error);
  }
}