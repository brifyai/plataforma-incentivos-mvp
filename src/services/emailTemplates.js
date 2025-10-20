/**
 * Plantillas de Email para NexuPay
 *
 * Contiene todas las plantillas de email utilizadas en el sistema
 */

/**
 * Plantilla de email para notificar al administrador sobre nueva verificación enviada
 * @param {Object} companyData - Datos de la empresa
 * @param {Object} verificationData - Datos de verificación
 * @param {Object} representativeData - Datos del representante
 * @returns {Object} - Objeto con subject y html del email
 */
export const getVerificationSubmittedTemplate = (companyData, verificationData, representativeData) => {
  const submittedDate = new Date(verificationData.submitted_at).toLocaleString('es-CL', {
    timeZone: 'America/Santiago',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return {
    subject: `🔍 Nueva Solicitud de Verificación - ${companyData.company_name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nueva Solicitud de Verificación</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #3b82f6;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
          }
          .title {
            color: #1f2937;
            font-size: 20px;
            margin-bottom: 20px;
          }
          .info-section {
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #3b82f6;
          }
          .info-title {
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
            font-size: 16px;
          }
          .info-item {
            margin: 8px 0;
            display: flex;
            justify-content: space-between;
          }
          .info-label {
            font-weight: 600;
            color: #6b7280;
            min-width: 150px;
          }
          .info-value {
            color: #1f2937;
            flex: 1;
          }
          .document-status {
            background-color: #ecfdf5;
            border: 1px solid #10b981;
            color: #065f46;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .document-missing {
            background-color: #fef2f2;
            border: 1px solid #ef4444;
            color: #991b1b;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .action-button {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
          }
          .action-button:hover {
            background-color: #2563eb;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 12px;
          }
          .priority-badge {
            background-color: #fef3c7;
            color: #92400e;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            display: inline-block;
            margin-left: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏢 NexuPay</div>
            <div class="title">Nueva Solicitud de Verificación de Empresa</div>
          </div>

          <div class="info-section">
            <div class="info-title">📋 Información de la Empresa</div>
            <div class="info-item">
              <span class="info-label">Nombre Empresa:</span>
              <span class="info-value"><strong>${companyData.company_name || 'No especificado'}</strong></span>
            </div>
            <div class="info-item">
              <span class="info-label">RUT:</span>
              <span class="info-value">${companyData.rut || 'No especificado'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Email Contacto:</span>
              <span class="info-value">${companyData.contact_email || representativeData?.email || 'No especificado'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Teléfono:</span>
              <span class="info-value">${companyData.contact_phone || 'No especificado'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Tipo Empresa:</span>
              <span class="info-value">${companyData.company_type || 'No especificado'}</span>
            </div>
          </div>

          <div class="info-section">
            <div class="info-title">👤 Representante Legal</div>
            <div class="info-item">
              <span class="info-label">Nombre Completo:</span>
              <span class="info-value">${representativeData?.full_name || 'No especificado'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">RUT Representante:</span>
              <span class="info-value">${representativeData?.rut || 'No especificado'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Email:</span>
              <span class="info-value">${representativeData?.email || 'No especificado'}</span>
            </div>
          </div>

          <div class="info-section">
            <div class="info-title">📄 Estado de Documentos</div>
            
            ${verificationData.certificado_vigencia_url ? 
              `<div class="document-status">
                ✅ Certificado de Vigencia: Subido correctamente
              </div>` : 
              `<div class="document-missing">
                ❌ Certificado de Vigencia: No subido
              </div>`
            }
            
            ${verificationData.informe_equifax_url ? 
              `<div class="document-status">
                ✅ Informe Equifax: Subido correctamente
              </div>` : 
              `<div class="document-missing">
                ❌ Informe Equifax: No subido
              </div>`
            }
          </div>

          <div class="info-section">
            <div class="info-title">⏰ Detalles de Envío</div>
            <div class="info-item">
              <span class="info-label">Fecha Envío:</span>
              <span class="info-value">${submittedDate}</span>
            </div>
            <div class="info-item">
              <span class="info-label">ID Verificación:</span>
              <span class="info-value">${verificationData.id}</span>
            </div>
            <div class="info-item">
              <span class="info-label">ID Empresa:</span>
              <span class="info-value">${companyData.id}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Estado Actual:</span>
              <span class="info-value">
                <span class="priority-badge">PENDIENTE DE REVISIÓN</span>
              </span>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="https://wvluqdldygmgncqqjkow.supabase.co/storage/v1/object/public/verification-documents/" class="action-button">
              🔍 Revisar Documentos en Portal Administrador
            </a>
          </div>

          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; color: #92400e; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>⚠️ Acción Requerida:</strong><br>
            Por favor revise los documentos enviados y proceda con la verificación en el portal administrador. La empresa no podrá operar hasta que su verificación sea aprobada.
          </div>

          <div class="footer">
            <p>Este email fue generado automáticamente por NexuPay</p>
            <p>Si tiene problemas para acceder al portal, contacte al equipo técnico</p>
            <p>© 2025 NexuPay - Todos los derechos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

/**
 * Plantilla de email para notificar al administrador sobre correcciones solicitadas
 * @param {Object} companyData - Datos de la empresa
 * @param {Object} verificationData - Datos de verificación
 * @param {string} corrections - Detalle de correcciones solicitadas
 * @returns {Object} - Objeto con subject y html del email
 */
export const getCorrectionsRequestedTemplate = (companyData, verificationData, corrections) => {
  return {
    subject: `🔄 Correcciones Solicitadas - ${companyData.company_name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Correcciones Solicitadas</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #f59e0b;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #f59e0b;
            margin-bottom: 10px;
          }
          .corrections-box {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            color: #92400e;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🔄 NexuPay</div>
            <div>Correcciones Solicitadas para Verificación</div>
          </div>

          <div class="corrections-box">
            <strong>Empresa:</strong> ${companyData.company_name}<br>
            <strong>RUT:</strong> ${companyData.rut}<br>
            <strong>Correcciones solicitadas:</strong><br>
            <div style="margin-top: 10px; padding: 10px; background-color: white; border-radius: 4px;">
              ${corrections}
            </div>
          </div>

          <div class="footer">
            <p>Este email fue generado automáticamente por NexuPay</p>
            <p>© 2025 NexuPay - Todos los derechos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

export default {
  getVerificationSubmittedTemplate,
  getCorrectionsRequestedTemplate
};