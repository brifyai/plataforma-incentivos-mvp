import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    // Get email data from request
    const { to, subject, html, text }: EmailData = await req.json()

    if (!to || !subject || !html) {
      throw new Error('Missing required fields: to, subject, html')
    }

    // SendGrid API configuration
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
    const SENDGRID_FROM_EMAIL = Deno.env.get('SENDGRID_FROM_EMAIL') || 'hola@aintelligence.cl'
    const SENDGRID_FROM_NAME = Deno.env.get('SENDGRID_FROM_NAME') || 'AIntelligence'

    console.log('SendGrid Config:', {
      hasApiKey: !!SENDGRID_API_KEY,
      fromEmail: SENDGRID_FROM_EMAIL,
      fromName: SENDGRID_FROM_NAME,
      apiKeyPrefix: SENDGRID_API_KEY?.substring(0, 10) + '...'
    })

    if (!SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY environment variable is not set')
    }

    if (!SENDGRID_API_KEY.startsWith('SG.')) {
      throw new Error('SENDGRID_API_KEY must start with SG.')
    }

    // Prepare SendGrid API request
    const sendGridData = {
      personalizations: [{
        to: [{ email: to }],
        subject: subject
      }],
      from: {
        email: SENDGRID_FROM_EMAIL,
        name: SENDGRID_FROM_NAME
      },
      content: [
        {
          type: 'text/html',
          value: html
        }
      ]
    }

    // Add text content if provided
    if (text) {
      sendGridData.content.push({
        type: 'text/plain',
        value: text
      })
    }

    // Send email via SendGrid API
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sendGridData)
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('SendGrid API error:', response.status, errorData)
      throw new Error(`SendGrid API error: ${response.status} - ${errorData}`)
    }

    // Get message ID from response headers if available
    const messageId = response.headers.get('X-Message-Id') || `sg-${Date.now()}`

    console.log('Email sent successfully via SendGrid:', messageId)

    return new Response(
      JSON.stringify({
        success: true,
        messageId: messageId,
        message: 'Email sent successfully via SendGrid'
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
