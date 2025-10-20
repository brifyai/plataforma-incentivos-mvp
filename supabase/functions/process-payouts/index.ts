/**
 * Edge Function: Process Pending Payouts
 *
 * Esta función procesa automáticamente los pagos pendientes de transferir
 * a las cuentas bancarias de las empresas.
 *
 * Se ejecuta periódicamente via cron job.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mercado Pago Service implementation for Edge Functions
class MercadoPagoService {
  accessToken: string
  publicKey: string
  baseURL: string

  constructor() {
    this.accessToken = Deno.env.get('VITE_MERCADOPAGO_ACCESS_TOKEN') || ''
    this.publicKey = Deno.env.get('VITE_MERCADOPAGO_PUBLIC_KEY') || ''
    this.baseURL = 'https://api.mercadopago.com'
  }

  isConfigured() {
    return !!(this.accessToken && this.publicKey)
  }

  async makeRequest(method: string, endpoint: string, data: any = null, params: any = null) {
    if (!this.isConfigured()) {
      throw new Error('Mercado Pago no está configurado')
    }

    const config: any = {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${Date.now()}-${Math.random().toString(36).substring(7)}`
      }
    }

    if (data) config.body = JSON.stringify(data)
    if (params) {
      const url = new URL(`${this.baseURL}${endpoint}`)
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
      endpoint = url.toString().replace(this.baseURL, '')
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, config)
    const result = await response.json()

    return {
      success: response.ok,
      data: result
    }
  }

  async createPayout(payoutData: any) {
    const payout = {
      amount: parseFloat(payoutData.amount),
      currency_id: payoutData.currency || 'CLP',
      beneficiary: {
        first_name: payoutData.beneficiary.firstName,
        last_name: payoutData.beneficiary.lastName,
        email: payoutData.beneficiary.email,
        phone: payoutData.beneficiary.phone,
        identification: {
          type: payoutData.beneficiary.identificationType || 'RUT',
          number: payoutData.beneficiary.identificationNumber
        },
        bank_account: {
          bank_id: payoutData.beneficiary.bankId,
          account_type: payoutData.beneficiary.accountType || 'checking_account',
          account_number: payoutData.beneficiary.accountNumber
        }
      },
      description: payoutData.description || 'Pago automático desde plataforma',
      external_reference: payoutData.externalReference || `payout-${Date.now()}`,
      statement_descriptor: 'PLATAFORMA INCENTIVOS'
    }

    return await this.makeRequest('POST', '/v1/payments/payouts', payout)
  }

  async processPendingPayouts(companyId: string, supabase: any) {
    // Get company info
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      return { success: false, error: 'Empresa no encontrada' }
    }

    if (!company.bank_account_info || !company.mercadopago_beneficiary_id) {
      return { success: false, error: 'Empresa no tiene configuración bancaria completa' }
    }

    // Get approved payments not transferred
    const { data: approvedPayments, error: paymentsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('status', 'approved')
      .is('transfer_status', null)

    if (paymentsError) {
      return { success: false, error: paymentsError.message }
    }

    if (!approvedPayments || approvedPayments.length === 0) {
      return { success: true, message: 'No hay pagos pendientes de transferir', processed: 0 }
    }

    let processed = 0
    let failed = 0
    const results = []

    for (const payment of approvedPayments) {
      try {
        const commissionAmount = payment.amount * (company.nexupay_commission || 0.15)
        const transferAmount = payment.amount - commissionAmount

        if (transferAmount <= 0) continue

        const beneficiary = JSON.parse(company.bank_account_info)
        const payoutResult = await this.createPayout({
          amount: transferAmount,
          beneficiary: {
            firstName: beneficiary.firstName || company.company_name.split(' ')[0],
            lastName: beneficiary.lastName || company.company_name.split(' ').slice(1).join(' ') || 'Empresa',
            email: company.contact_email,
            phone: company.contact_phone,
            identificationNumber: company.rut,
            bankId: beneficiary.bankId,
            accountType: beneficiary.accountType,
            accountNumber: beneficiary.accountNumber
          },
          description: `Transferencia por pago aprobado - ${payment.external_reference}`,
          externalReference: `transfer-${payment.payment_id}-${Date.now()}`
        })

        if (payoutResult.success) {
          await supabase
            .from('transactions')
            .update({
              transfer_status: 'processing',
              transfer_id: payoutResult.data.id,
              transfer_amount: transferAmount,
              commission_amount: commissionAmount,
              transfer_initiated_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('payment_id', payment.payment_id)

          processed++
        } else {
          await supabase
            .from('transactions')
            .update({
              transfer_status: 'failed',
              transfer_error: JSON.stringify(payoutResult.data),
              updated_at: new Date().toISOString()
            })
            .eq('payment_id', payment.payment_id)

          failed++
        }
      } catch (error) {
        failed++
      }
    }

    return {
      success: true,
      message: `Procesamiento completado: ${processed} exitosos, ${failed} fallidos`,
      processed,
      failed,
      results
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Iniciando procesamiento de pagos automáticos...')

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Initialize Mercado Pago service
    const mercadoPagoService = new MercadoPagoService()

    // Get all companies that have bank account configuration
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, company_name, bank_account_info, mercadopago_beneficiary_id, nexupay_commission')
      .not('bank_account_info', 'is', null)
      .not('mercadopago_beneficiary_id', 'is', null)

    if (companiesError) {
      throw new Error(`Error obteniendo empresas: ${companiesError.message}`)
    }

    if (!companies || companies.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No hay empresas configuradas para transferencias automáticas',
          processedCompanies: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    console.log(`📋 Procesando ${companies.length} empresas...`)

    let totalProcessed = 0
    let totalFailed = 0
    const results: any[] = []

    // Process each company
    for (const company of companies) {
      try {
        console.log(`🏢 Procesando empresa: ${company.company_name}`)

        const result = await mercadoPagoService.processPendingPayouts(company.id, supabase)

        if (result.success) {
          totalProcessed += result.processed || 0
          totalFailed += result.failed || 0

          results.push({
            companyId: company.id,
            companyName: company.company_name,
            success: true,
            processed: result.processed || 0,
            failed: result.failed || 0,
            message: result.message
          })

          console.log(`✅ ${company.company_name}: ${result.message}`)
        } else {
          totalFailed++
          results.push({
            companyId: company.id,
            companyName: company.company_name,
            success: false,
            error: result.error
          })

          console.error(`❌ Error en ${company.company_name}: ${result.error}`)
        }
      } catch (error: any) {
        console.error(`❌ Error procesando empresa ${company.company_name}:`, error)
        totalFailed++
        results.push({
          companyId: company.id,
          companyName: company.company_name,
          success: false,
          error: error.message
        })
      }
    }

    const summary = {
      success: true,
      message: `Procesamiento completado: ${totalProcessed} transferencias exitosas, ${totalFailed} fallidas`,
      processedCompanies: companies.length,
      totalProcessed,
      totalFailed,
      results,
      timestamp: new Date().toISOString()
    }

    console.log('✅ Procesamiento de pagos automáticos finalizado:', summary)

    return new Response(
      JSON.stringify(summary),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Error en process-payouts:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})