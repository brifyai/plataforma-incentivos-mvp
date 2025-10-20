/**
 * Supabase Edge Function: Schedule Payment Reminders
 * 
 * Función programada (cron) que crea recordatorios de pago
 * para acuerdos con pagos próximos a vencer
 */

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

    // Obtener fecha actual y fechas objetivo
    const now = new Date()
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)

    // Obtener acuerdos activos con pagos próximos
    const { data: agreements, error: agreementsError } = await supabaseClient
      .from('agreements')
      .select(`
        id,
        user_id,
        payment_plan,
        users (
          email,
          full_name
        )
      `)
      .eq('status', 'active')

    if (agreementsError) {
      throw agreementsError
    }

    const remindersCreated = {
      threeDays: 0,
      oneDay: 0
    }

    // Procesar cada acuerdo
    for (const agreement of agreements || []) {
      const paymentPlan = agreement.payment_plan as any[]
      
      if (!paymentPlan || paymentPlan.length === 0) continue

      // Buscar próximo pago pendiente
      const nextPayment = paymentPlan.find((payment: any) => {
        return !payment.paid && new Date(payment.due_date) > now
      })

      if (!nextPayment) continue

      const dueDate = new Date(nextPayment.due_date)
      const userEmail = agreement.users?.email
      const userName = agreement.users?.full_name || 'Usuario'

      // Verificar preferencias de email del usuario
      const { data: preferences } = await supabaseClient
        .from('email_preferences')
        .select('payment_reminders')
        .eq('user_id', agreement.user_id)
        .single()

      if (preferences && !preferences.payment_reminders) {
        continue // Usuario no quiere recordatorios
      }

      // Recordatorio de 3 días
      if (dueDate.toDateString() === threeDaysFromNow.toDateString()) {
        await createPaymentReminder(
          supabaseClient,
          agreement.user_id,
          userEmail,
          userName,
          nextPayment,
          dueDate,
          'payment_reminder_3days'
        )
        remindersCreated.threeDays++
      }

      // Recordatorio de 1 día
      if (dueDate.toDateString() === oneDayFromNow.toDateString()) {
        await createPaymentReminder(
          supabaseClient,
          agreement.user_id,
          userEmail,
          userName,
          nextPayment,
          dueDate,
          'payment_reminder_1day'
        )
        remindersCreated.oneDay++
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Payment reminders scheduled successfully',
        remindersCreated
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in schedule-payment-reminders:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function createPaymentReminder(
  supabaseClient: any,
  userId: string,
  userEmail: string,
  userName: string,
  payment: any,
  dueDate: Date,
  emailType: string
) {
  const daysUntilDue = emailType === 'payment_reminder_3days' ? 3 : 1
  
  // Crear notificación in-app
  await supabaseClient
    .from('notifications')
    .insert({
      user_id: userId,
      type: 'payment_reminder',
      title: `Recordatorio de Pago - ${daysUntilDue} ${daysUntilDue === 1 ? 'día' : 'días'}`,
      message: `Tienes un pago de ${formatCurrency(payment.amount)} que vence el ${dueDate.toLocaleDateString('es-CL')}`,
      action_url: '/debtor/agreements'
    })

  // Programar email
  const emailSubject = `Recordatorio: Pago próximo a vencer en ${daysUntilDue} ${daysUntilDue === 1 ? 'día' : 'días'}`
  const emailBody = generateReminderEmailHTML(userName, payment.amount, dueDate, daysUntilDue)

  await supabaseClient
    .from('email_queue')
    .insert({
      user_id: userId,
      email_type: emailType,
      recipient_email: userEmail,
      subject: emailSubject,
      body_html: emailBody,
      scheduled_for: new Date().toISOString()
    })
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP'
  }).format(amount)
}

function generateReminderEmailHTML(
  userName: string,
  amount: number,
  dueDate: Date,
  daysUntilDue: number
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; }
        .payment-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Recordatorio de Pago</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${userName}</strong>,</p>
          <p>Te recordamos que tienes un pago pendiente que vence en <strong>${daysUntilDue} ${daysUntilDue === 1 ? 'día' : 'días'}</strong>.</p>
          
          <div class="payment-box">
            <p><strong>Monto a pagar:</strong> ${formatCurrency(amount)}</p>
            <p><strong>Fecha de vencimiento:</strong> ${dueDate.toLocaleDateString('es-CL', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>

          <p>Recuerda que al pagar a tiempo:</p>
          <ul>
            <li>✅ Acumulas puntos en tu perfil</li>
            <li>💰 Recibes incentivos monetarios</li>
            <li>🏆 Desbloqueas logros y beneficios</li>
            <li>📈 Mejoras tu historial de pagos</li>
          </ul>

          <center>
            <a href="${Deno.env.get('APP_URL')}/debtor/agreements" class="button">
              Realizar Pago Ahora
            </a>
          </center>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Si ya realizaste este pago, puedes ignorar este mensaje.
          </p>
        </div>
        <div class="footer">
          <p>Plataforma de Incentivos para Acuerdos de Pago</p>
          <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
        </div>
      </div>
    </body>
    </html>
  `
}
