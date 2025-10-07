import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as nodemailer from 'https://esm.sh/nodemailer@6.9.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create SMTP transporter
    const transporter = nodemailer.createTransporter({
      host: 'mail.nexupay.cl',
      port: 587,
      secure: false,
      auth: {
        user: 'info@nexupay.cl',
        pass: 'Aintelligence2025$'
      },
      tls: {
        rejectUnauthorized: false
      }
    })

    // Get email data from request
    const { to, subject, html, text }: EmailData = await req.json()

    if (!to || !subject || !html) {
      throw new Error('Missing required fields: to, subject, html')
    }

    // Send email
    const mailOptions = {
      from: {
        name: 'NexuPay',
        address: 'info@nexupay.cl'
      },
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML tags for text version
    }

    const info = await transporter.sendMail(mailOptions)

    console.log('Email sent successfully:', info.messageId)

    return new Response(
      JSON.stringify({
        success: true,
        messageId: info.messageId,
        message: 'Email sent successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error sending email:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Failed to send email'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
