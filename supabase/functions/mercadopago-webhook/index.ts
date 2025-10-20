import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Obtener el cuerpo del webhook
    const webhookData = await req.json()
    console.log('📥 Webhook recibido de Mercado Pago:', webhookData)

    const { type, data } = webhookData

    // Verificar que sea una notificación de pago
    if (type !== 'payment') {
      console.log('⚠️ Webhook no es de tipo payment, ignorando')
      return new Response(JSON.stringify({ success: true, message: 'Webhook ignorado' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const paymentId = data.id
    console.log('💳 Procesando pago ID:', paymentId)

    // Obtener información detallada del pago desde Mercado Pago
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN no configurado')
    }

    // Consultar la API de Mercado Pago para obtener detalles del pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!mpResponse.ok) {
      throw new Error(`Error al consultar Mercado Pago: ${mpResponse.status}`)
    }

    const paymentData = await mpResponse.json()
    console.log('📊 Datos del pago:', paymentData)

    // Extraer información relevante
    const {
      id: mpPaymentId,
      status,
      status_detail,
      transaction_amount,
      currency_id,
      payment_method_id,
      payment_type_id,
      payer,
      external_reference,
      metadata,
      date_created,
      date_approved
    } = paymentData

    // Buscar la preferencia de pago en nuestra base de datos
    const { data: preference, error: prefError } = await supabaseClient
      .from('payment_preferences')
      .select('*')
      .eq('preference_id', external_reference)
      .single()

    if (prefError || !preference) {
      console.warn('⚠️ No se encontró preferencia de pago para external_reference:', external_reference)
      // Continuar de todos modos, podría ser un pago manual
    }

    // Guardar la transacción en la tabla transactions
    const { error: txError } = await supabaseClient
      .from('transactions')
      .upsert({
        payment_id: mpPaymentId.toString(),
        external_reference,
        status,
        status_detail,
        amount: transaction_amount,
        currency: currency_id,
        payment_method: payment_method_id,
        payment_type: payment_type_id,
        payer_email: payer?.email,
        metadata: {
          ...metadata,
          preference_id: preference?.id,
          debt_id: preference?.debt_id,
          debtor_id: preference?.debtor_id
        },
        date_created,
        date_approved
      }, {
        onConflict: 'payment_id'
      })

    if (txError) {
      console.error('❌ Error al guardar transacción:', txError)
      throw txError
    }

    // Si el pago fue aprobado, procesar el pago
    if (status === 'approved') {
      console.log('✅ Pago aprobado, procesando...')

      const debtorId = preference?.debtor_id || metadata?.debtor_id
      const debtId = preference?.debt_id || metadata?.debt_id

      if (debtorId && debtId) {
        // Actualizar el estado de la deuda
        const { error: debtError } = await supabaseClient
          .from('debts')
          .update({
            status: 'paid',
            paid_amount: transaction_amount,
            paid_at: date_approved,
            updated_at: new Date().toISOString()
          })
          .eq('id', debtId)

        if (debtError) {
          console.error('❌ Error al actualizar deuda:', debtError)
        } else {
          console.log('✅ Deuda actualizada')
        }

        // Calcular y otorgar incentivo (5%)
        const incentiveAmount = transaction_amount * 0.05

        // Actualizar wallet del deudor
        const { data: wallet, error: walletError } = await supabaseClient
          .from('wallets')
          .select('balance')
          .eq('user_id', debtorId)
          .single()

        if (walletError && walletError.code !== 'PGRST116') {
          console.error('❌ Error al obtener wallet:', walletError)
        } else {
          const currentBalance = wallet?.balance || 0
          const newBalance = currentBalance + incentiveAmount

          const { error: updateError } = await supabaseClient
            .from('wallets')
            .upsert({
              user_id: debtorId,
              balance: newBalance,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' })

          if (updateError) {
            console.error('❌ Error al actualizar wallet:', updateError)
          } else {
            console.log(`✅ Incentivo otorgado: $${incentiveAmount} a usuario ${debtorId}`)
          }

          // Registrar la transacción de incentivo
          const { error: txError } = await supabaseClient
            .from('wallet_transactions')
            .insert({
              user_id: debtorId,
              amount: incentiveAmount,
              type: 'incentive',
              description: `Incentivo por pago de deuda`,
              related_payment_id: mpPaymentId.toString(),
              balance_after: newBalance,
              created_at: new Date().toISOString()
            })

          if (txError) {
            console.error('❌ Error al registrar transacción de incentivo:', txError)
          }
        }

        // Registrar en historial de pagos
        const { error: historyError } = await supabaseClient
          .from('payment_history')
          .insert({
            debtor_id: debtorId,
            debt_id: debtId,
            payment_id: mpPaymentId.toString(),
            amount: transaction_amount,
            payment_method: payment_method_id,
            status: 'completed',
            paid_at: date_approved,
            created_at: new Date().toISOString()
          })

        if (historyError) {
          console.error('❌ Error al registrar en historial:', historyError)
        } else {
          console.log('✅ Pago registrado en historial')
        }
      } else {
        console.warn('⚠️ No se encontraron debtor_id o debt_id en metadata')
      }
    }

    console.log('✅ Webhook procesado exitosamente')

    return new Response(JSON.stringify({
      success: true,
      message: 'Webhook procesado exitosamente',
      paymentId: mpPaymentId,
      status
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('❌ Error en webhook de Mercado Pago:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})