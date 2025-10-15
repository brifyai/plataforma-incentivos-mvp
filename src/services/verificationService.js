/**
 * Servicio de Verificación de Empresas
 *
 * Maneja todas las operaciones relacionadas con la verificación de empresas:
 * - Subida de documentos
 * - Consulta de estado
 * - Revisión administrativa
 * - Historial de cambios
 */

import { supabase } from '../config/supabase';
import { createClient } from '@supabase/supabase-js';
import { getVerificationSubmittedTemplate } from './emailTemplates';

// Cliente con service role para operaciones administrativas
// Solo se inicializa si hay una SERVICE_ROLE_KEY válida
let supabaseAdmin = null;

const initializeSupabaseAdmin = () => {
  const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey || serviceRoleKey.includes('3k3k3k3k') || serviceRoleKey.length < 100) {
    console.warn('⚠️ SERVICE_ROLE_KEY no válida o no configurada. Las operaciones de administrador estarán limitadas.');
    return null;
  }

  try {
    return createClient(
      import.meta.env.VITE_SUPABASE_URL,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  } catch (error) {
    console.error('❌ Error inicializando supabaseAdmin:', error);
    return null;
  }
};

// Inicializar cliente admin
supabaseAdmin = initializeSupabaseAdmin();

/**
 * Tipos de estado de verificación
 */
export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  NEEDS_CORRECTIONS: 'needs_corrections'
};

/**
 * Tipos de documentos
 */
export const DOCUMENT_TYPES = {
  CERTIFICADO_VIGENCIA: 'certificado_vigencia',
  INFORME_EQUIFAX: 'informe_equifax'
};

/**
 * Obtiene el estado de verificación de una empresa
 * @param {string} companyId - ID de la empresa
 * @returns {Promise<{verification, error}>}
 */
export const getCompanyVerification = async (companyId) => {
  try {
    // First get the basic verification data with a simpler query
    const { data, error } = await supabase
      .from('company_verifications')
      .select(`
        id,
        company_id,
        status,
        certificado_vigencia_url,
        certificado_vigencia_filename,
        certificado_vigencia_uploaded_at,
        informe_equifax_url,
        informe_equifax_filename,
        informe_equifax_uploaded_at,
        submitted_at,
        approved_at,
        rejected_at,
        assigned_to,
        reviewed_by,
        decision_notes,
        rejection_reason,
        correction_requests,
        correction_deadline,
        created_at,
        updated_at
      `)
      .eq('company_id', companyId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No verification found - this is normal for new companies
        return { verification: null, error: null };
      }
      console.error('Error querying company_verifications:', error);
      return { verification: null, error: error.message };
    }

    // If no verification found, return null (this is expected for new companies)
    if (!data) {
      return { verification: null, error: null };
    }

    let verification = { ...data };

    // If there are assigned_to or reviewed_by users, fetch their info separately
    if (data.assigned_to) {
      try {
        const { data: assignedUser, error: assignedError } = await supabase
          .from('users')
          .select('id, full_name, email')
          .eq('id', data.assigned_to)
          .single();

        if (!assignedError && assignedUser) {
          verification.assigned_to_user = assignedUser;
        }
      } catch (userError) {
        console.warn('Could not fetch assigned user info:', userError.message);
      }
    }

    if (data.reviewed_by) {
      try {
        const { data: reviewedUser, error: reviewedError } = await supabase
          .from('users')
          .select('id, full_name, email')
          .eq('id', data.reviewed_by)
          .single();

        if (!reviewedError && reviewedUser) {
          verification.reviewed_by_user = reviewedUser;
        }
      } catch (userError) {
        console.warn('Could not fetch reviewed user info:', userError.message);
      }
    }

    return { verification, error: null };
  } catch (error) {
    console.error('Error getting company verification:', error);
    return { verification: null, error: 'Error al obtener verificación' };
  }
};

/**
 * Crea o actualiza la verificación de una empresa
 * @param {string} companyId - ID de la empresa
 * @param {Object} data - Datos de la verificación
 * @returns {Promise<{verification, error}>}
 */
export const upsertCompanyVerification = async (companyId, data) => {
  try {
    console.log('🔍 upsertCompanyVerification - Datos recibidos:', { companyId, data });
    
    const { data: verification, error } = await supabase
      .from('company_verifications')
      .upsert({
        company_id: companyId,
        ...data,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'company_id'
      })
      .select(`
        id,
        company_id,
        status,
        certificado_vigencia_url,
        certificado_vigencia_filename,
        certificado_vigencia_uploaded_at,
        informe_equifax_url,
        informe_equifax_filename,
        informe_equifax_uploaded_at,
        submitted_at,
        approved_at,
        rejected_at,
        assigned_to,
        reviewed_by,
        decision_notes,
        rejection_reason,
        correction_requests,
        correction_deadline,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error('❌ Error en upsertCompanyVerification:', error);
      return { verification: null, error: error.message };
    }

    console.log('✅ upsertCompanyVerification - Éxito:', verification);
    console.log('🔍 Verificando campos de filename:', {
      certificado_vigencia_filename: verification?.certificado_vigencia_filename,
      informe_equifax_filename: verification?.informe_equifax_filename
    });
    return { verification, error: null };
  } catch (error) {
    console.error('💥 Error general en upsertCompanyVerification:', error);
    return { verification: null, error: 'Error al guardar verificación' };
  }
};

/**
 * Sube un documento de verificación
 * @param {string} companyId - ID de la empresa
 * @param {string} documentType - Tipo de documento
 * @param {File} file - Archivo a subir
 * @returns {Promise<{url, error}>}
 */
export const uploadVerificationDocument = async (companyId, documentType, file) => {
  try {
    console.log('🔍 Verificando bucket verification-documents...');
    
    // Verificar que el bucket existe usando acceso directo (más confiable)
    console.log('🔍 Verificando acceso directo al bucket verification-documents...');
    
    let bucketExists = false;
    
    try {
      // Intentar acceso directo al bucket (método más confiable)
      const { data: testFiles, error: accessError } = await supabase.storage
        .from('verification-documents')
        .list('', { limit: 1 });
      
      if (accessError) {
        if (accessError.message.includes('not found') || accessError.message.includes('does not exist')) {
          console.log('❌ Bucket verification-documents no existe (acceso directo falló)');
        } else {
          console.log('⚠️ Error de acceso al bucket (puede existir pero sin permisos):', accessError.message);
        }
      } else {
        console.log('✅ Bucket verification-documents EXISTE y es accesible');
        console.log('📄 Archivos en el bucket:', testFiles?.length || 0);
        bucketExists = true;
      }
    } catch (error) {
      console.error('❌ Error verificando acceso directo:', error.message);
    }
    
    // Si el acceso directo falla, intentar con el método de lista como fallback
    if (!bucketExists) {
      console.log('🔄 Intentando método de lista como fallback...');
      try {
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
        
        if (!bucketError && buckets) {
          const verificationBucket = buckets.find(b => b.name === 'verification-documents');
          if (verificationBucket) {
            console.log('✅ Bucket verification-documents encontrado en lista');
            bucketExists = true;
          }
        }
      } catch (error) {
        console.warn('⚠️ Método de lista también falló:', error.message);
      }
    }
    
    if (!bucketExists) {
      console.log('❌ Bucket verification-documents no encontrado por ningún método');
      return {
        url: null,
        error: `Error de configuración: Bucket "verification-documents" no encontrado.
        
        Solución:
        1. Ve a: https://supabase.com/dashboard/project/wvluqdldygmgncqqjkow/storage
        2. Crea el bucket "verification-documents" como público
        3. Espera 1-2 minutos y vuelve a intentar
        
        Si el bucket ya existe, recarga la página y limpia la caché del navegador.`
      };
    }

    // El bucket existe y es accesible, continuar con la subida del archivo
    console.log('✅ Bucket verification-documents confirmado, procediendo con la subida...');

    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${companyId}/${documentType}_${Date.now()}.${fileExt}`;

    console.log('📤 Iniciando subida del archivo...');
    console.log('📋 Detalles de la subida:', {
      bucket: 'verification-documents',
      path: fileName,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });

    let uploadData;
    let uploadError;

    try {
      const result = await supabase.storage
        .from('verification-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      uploadData = result.data;
      uploadError = result.error;
    } catch (catchError) {
      console.error('❌ Excepción durante la subida:', catchError);
      return {
        url: null,
        error: `Error crítico al subir el archivo: ${catchError.message}. 
                Detalles: ${catchError.stack || 'No hay stack trace disponible'}`
      };
    }

    if (uploadError) {
      console.error('❌ Error en la subida:', uploadError);
      console.error('Detalles completos del error:', {
        message: uploadError.message,
        status: uploadError.status,
        statusCode: uploadError.statusCode,
        error: uploadError.error
      });

      // Mensajes de error específicos según el tipo
      let errorMessage = `Error al subir el archivo: ${uploadError.message}`;
      
      if (uploadError.message.includes('Bucket not found')) {
        errorMessage = 'Error: El bucket verification-documents no existe. Contacte al administrador.';
      } else if (uploadError.message.includes('duplicate')) {
        errorMessage = 'Error: Ya existe un archivo con el mismo nombre. Intente con otro nombre o elimine el archivo anterior.';
      } else if (uploadError.message.includes('size')) {
        errorMessage = 'Error: El archivo es demasiado grande. El tamaño máximo permitido es 5MB.';
      } else if (uploadError.message.includes('mime') || uploadError.message.includes('type')) {
        errorMessage = 'Error: Tipo de archivo no permitido. Solo se aceptan PDF, JPEG y PNG.';
      } else if (uploadError.message.includes('permission') || uploadError.message.includes('unauthorized')) {
        errorMessage = 'Error: No tiene permisos para subir archivos. Contacte al administrador.';
      } else if (uploadError.message.includes('policy')) {
        errorMessage = 'Error: Políticas de acceso (RLS) no configuradas correctamente. Contacte al administrador.';
      } else if (uploadError.status >= 500) {
        errorMessage = 'Error del servidor. Intente nuevamente en unos minutos.';
      }

      return {
        url: null,
        error: `${errorMessage}. Verifique su conexión e intente nuevamente.`
      };
    }

    console.log('✅ Archivo subido exitosamente:', uploadData);

    // Obtener URL pública
    console.log('🔗 Obteniendo URL pública...');
    let publicUrl;
    
    try {
      const { data } = supabase.storage
        .from('verification-documents')
        .getPublicUrl(fileName);
      
      publicUrl = data?.publicUrl;
      console.log('✅ URL pública generada (método 1):', publicUrl);
    } catch (urlError) {
      console.error('❌ Error generando URL pública (método 1):', urlError);
    }

    // Si el primer método falló, intentar con el método alternativo
    if (!publicUrl) {
      try {
        const { data } = supabase.storage
          .from('verification-documents')
          .getPublicUrl(fileName);
        
        publicUrl = data.publicUrl;
        console.log('✅ URL pública generada (método 2):', publicUrl);
      } catch (urlError2) {
        console.error('❌ Error generando URL pública (método 2):', urlError2);
      }
    }

    // Si ambos métodos fallan, generar URL manualmente
    if (!publicUrl) {
      const manualUrl = `https://wvluqdldygmgncqqjkow.supabase.co/storage/v1/object/public/verification-documents/${fileName}`;
      console.log('🔄 Usando URL manual:', manualUrl);
      publicUrl = manualUrl;
    }

    console.log('🔗 URL final a retornar:', publicUrl);
    return { url: publicUrl, fileName, error: null };
  } catch (error) {
    console.error('💥 Error general en uploadVerificationDocument:', error);
    return {
      url: null,
      error: 'Error al subir documento. Verifique su conexión e intente nuevamente.'
    };
  }
};

/**
 * Envía email de notificación al administrador
 * @param {Object} companyData - Datos de la empresa
 * @param {Object} verificationData - Datos de verificación
 * @param {Object} representativeData - Datos del representante
 * @returns {Promise<{success, error}>}
 */
const sendVerificationNotificationEmail = async (companyData, verificationData, representativeData) => {
  try {
    console.log('📧 Enviando email de notificación a soporte@aintelligence.cl');
    
    // Obtener plantilla de email
    const emailTemplate = getVerificationSubmittedTemplate(companyData, verificationData, representativeData);
    
    // En desarrollo, simular el envío de email
    if (import.meta.env.DEV) {
      console.log('📧 MODO DESARROLLO: Simulando envío de email');
      console.log('📧 Para:', 'soporte@aintelligence.cl');
      console.log('📧 Subject:', emailTemplate.subject);
      console.log('📧 HTML length:', emailTemplate.html.length);
      
      // Guardar el email en una tabla de logs para desarrollo (opcional)
      try {
        await supabase
          .from('email_logs')
          .insert({
            to_email: 'soporte@aintelligence.cl',
            subject: emailTemplate.subject,
            html_content: emailTemplate.html,
            email_type: 'verification_submitted',
            company_id: companyData.id,
            verification_id: verificationData.id,
            sent_at: new Date().toISOString(),
            simulated: true
          });
      } catch (logError) {
        console.warn('⚠️ No se pudo guardar log de email (tabla email_logs puede no existir):', logError.message);
      }
      
      return { success: true, simulated: true };
    }
    
    // En producción, enviar email real usando el servicio de email
    const emailData = {
      to: 'soporte@aintelligence.cl',
      subject: emailTemplate.subject,
      html: emailTemplate.html
    };
    
    // Usar el servicio de email existente
    const { error } = await supabase.functions.invoke('send-email', {
      body: emailData
    });
    
    if (error) {
      console.error('❌ Error enviando email:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Email enviado exitosamente a soporte@aintelligence.cl');
    return { success: true, simulated: false };
    
  } catch (error) {
    console.error('💥 Error general enviando email:', error);
    return { success: false, error: 'Error al enviar notificación por email' };
  }
};

/**
 * Envía la verificación para revisión
 * @param {string} companyId - ID de la empresa
 * @returns {Promise<{success, error}>}
 */
export const submitVerificationForReview = async (companyId) => {
  try {
    console.log('🔍 submitVerificationForReview - Iniciando para companyId:', companyId);
    
    // Verificar que tenga todos los documentos requeridos
    const { verification, error: getError } = await getCompanyVerification(companyId);

    if (getError) {
      console.error('❌ Error obteniendo verificación:', getError);
      return { success: false, error: getError };
    }

    if (!verification) {
      console.error('❌ No se encontró verificación para la empresa:', companyId);
      return { success: false, error: 'No se encontró verificación para esta empresa' };
    }

    console.log('📋 Verificación encontrada:', {
      id: verification.id,
      status: verification.status,
      hasCertificado: !!verification.certificado_vigencia_url,
      hasInforme: !!verification.informe_equifax_url
    });

    // Verificar documentos
    const hasCertificadoVigencia = verification.certificado_vigencia_url;
    const hasInformeEquifax = verification.informe_equifax_url;

    if (!hasCertificadoVigencia || !hasInformeEquifax) {
      return { success: false, error: 'Debe subir ambos documentos antes de enviar' };
    }

    // Actualizar estado a submitted
    console.log('📤 Actualizando estado a submitted...');
    const { data, error: updateError } = await supabase
      .from('company_verifications')
      .update({
        status: VERIFICATION_STATUS.SUBMITTED,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('company_id', companyId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error actualizando verificación:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log('✅ Verificación actualizada exitosamente:', data);
    
    // Obtener datos completos de la empresa y representante para el email
    let companyData = null;
    let representativeData = null;
    
    try {
      // Obtener datos de la empresa
      const { data: companyInfo } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();
      
      if (companyInfo) {
        companyData = companyInfo;
        
        // Obtener datos del representante (usuario)
        const { data: userInfo } = await supabase
          .from('users')
          .select('*')
          .eq('id', companyInfo.user_id)
          .single();
        
        if (userInfo) {
          representativeData = userInfo;
        }
      }
    } catch (dataError) {
      console.warn('⚠️ Error obteniendo datos para email (notificación se enviará sin datos completos):', dataError.message);
    }
    
    // Enviar email de notificación al administrador
    console.log('📧 Enviando notificación por email...');
    const emailResult = await sendVerificationNotificationEmail(
      companyData || { id: companyId, company_name: 'Empresa Desconocida' },
      data,
      representativeData || { email: 'No especificado' }
    );
    
    if (emailResult.success) {
      console.log('✅ Notificación por email enviada exitosamente');
      if (emailResult.simulated) {
        console.log('📧 Email simulado (modo desarrollo)');
      }
    } else {
      console.warn('⚠️ No se pudo enviar email de notificación:', emailResult.error);
      // No fallar toda la operación si el email no se envía
    }
    
    return { success: true, error: null, emailSent: emailResult.success };
  } catch (error) {
    console.error('💥 Error general en submitVerificationForReview:', error);
    return { success: false, error: 'Error al enviar verificación' };
  }
};

/**
 * Obtiene todas las verificaciones pendientes (para administradores)
 * @param {Object} filters - Filtros opcionales
 * @returns {Promise<{verifications, error}>}
 */
export const getPendingVerifications = async (filters = {}) => {
  try {
    let query = supabase
      .from('company_verifications')
      .select(`
        *,
        company:companies (
          company_name,
          rut,
          contact_email,
          user_id
        ),
        assigned_to_user:assigned_to (
          full_name,
          email
        )
      `)
      .in('status', ['submitted', 'under_review'])
      .order('submitted_at', { ascending: true });

    // Aplicar filtros
    if (filters.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      return { verifications: [], error: error.message };
    }

    return { verifications: data || [], error: null };
  } catch (error) {
    console.error('Error getting pending verifications:', error);
    return { verifications: [], error: 'Error al obtener verificaciones pendientes' };
  }
};

/**
 * Toma una decisión sobre una verificación
 * @param {string} verificationId - ID de la verificación
 * @param {Object} decision - Decisión tomada
 * @param {string} adminId - ID del administrador
 * @returns {Promise<{success, error}>}
 */
export const makeVerificationDecision = async (verificationId, decision, adminId) => {
  try {
    const { type, notes, rejectionReason, correctionRequests, correctionDeadline } = decision;

    let updateData = {
      reviewed_by: adminId,
      decision_notes: notes,
      updated_at: new Date().toISOString()
    };

    let newStatus;
    let reason = '';

    switch (type) {
      case 'approve':
        newStatus = VERIFICATION_STATUS.APPROVED;
        updateData.approved_at = new Date().toISOString();
        reason = 'Verificación aprobada';
        break;

      case 'reject':
        newStatus = VERIFICATION_STATUS.REJECTED;
        updateData.rejected_at = new Date().toISOString();
        updateData.rejection_reason = rejectionReason;
        reason = `Verificación rechazada: ${rejectionReason}`;
        break;

      case 'request_corrections':
        newStatus = VERIFICATION_STATUS.NEEDS_CORRECTIONS;
        updateData.correction_requests = correctionRequests;
        updateData.correction_deadline = correctionDeadline;
        reason = 'Solicitadas correcciones';
        break;

      default:
        return { success: false, error: 'Tipo de decisión inválido' };
    }

    updateData.status = newStatus;

    // Actualizar verificación
    const { error } = await supabase
      .from('company_verifications')
      .update(updateData)
      .eq('id', verificationId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Registrar en historial (esto se hace automáticamente con el trigger)
    // Pero podemos agregar metadata adicional
    await supabase
      .from('verification_history')
      .insert({
        verification_id: verificationId,
        previous_status: decision.previousStatus,
        new_status: newStatus,
        changed_by: adminId,
        change_reason: reason,
        metadata: {
          decision_type: type,
          notes: notes,
          rejection_reason: rejectionReason,
          correction_requests: correctionRequests
        }
      });

    return { success: true, error: null };
  } catch (error) {
    console.error('Error making verification decision:', error);
    return { success: false, error: 'Error al procesar decisión' };
  }
};

/**
 * Obtiene estadísticas de verificaciones
 * @returns {Promise<{stats, error}>}
 */
export const getVerificationStats = async () => {
  try {
    const { data, error } = await supabase
      .from('company_verifications')
      .select('status, submitted_at, approved_at, rejected_at');

    if (error) {
      return { stats: null, error: error.message };
    }

    const stats = {
      total: data.length,
      pending: data.filter(v => v.status === 'pending').length,
      submitted: data.filter(v => v.status === 'submitted').length,
      underReview: data.filter(v => v.status === 'under_review').length,
      approved: data.filter(v => v.status === 'approved').length,
      rejected: data.filter(v => v.status === 'rejected').length,
      needsCorrections: data.filter(v => v.status === 'needs_corrections').length,

      // Cálculos de tiempo
      averageProcessingTime: calculateAverageProcessingTime(data),
      approvalRate: calculateApprovalRate(data)
    };

    return { stats, error: null };
  } catch (error) {
    console.error('Error getting verification stats:', error);
    return { stats: null, error: 'Error al obtener estadísticas' };
  }
};

/**
 * Calcula tiempo promedio de procesamiento
 */
const calculateAverageProcessingTime = (verifications) => {
  const completedVerifications = verifications.filter(v =>
    v.approved_at || v.rejected_at
  );

  if (completedVerifications.length === 0) return 0;

  const totalTime = completedVerifications.reduce((sum, v) => {
    const submitted = new Date(v.submitted_at);
    const completed = new Date(v.approved_at || v.rejected_at);
    return sum + (completed - submitted);
  }, 0);

  return totalTime / completedVerifications.length / (1000 * 60 * 60); // horas
};

/**
 * Calcula tasa de aprobación
 */
const calculateApprovalRate = (verifications) => {
  const completed = verifications.filter(v =>
    v.status === 'approved' || v.status === 'rejected'
  ).length;

  if (completed === 0) return 0;

  const approved = verifications.filter(v => v.status === 'approved').length;
  return (approved / completed) * 100;
};

/**
 * Obtiene historial de una verificación
 * @param {string} verificationId - ID de la verificación
 * @returns {Promise<{history, error}>}
 */
export const getVerificationHistory = async (verificationId) => {
  try {
    const { data, error } = await supabase
      .from('verification_history')
      .select(`
        *,
        changed_by_user:changed_by (
          full_name,
          email
        )
      `)
      .eq('verification_id', verificationId)
      .order('created_at', { ascending: false });

    if (error) {
      return { history: [], error: error.message };
    }

    return { history: data || [], error: null };
  } catch (error) {
    console.error('Error getting verification history:', error);
    return { history: [], error: 'Error al obtener historial' };
  }
};

export default {
  getCompanyVerification,
  upsertCompanyVerification,
  uploadVerificationDocument,
  submitVerificationForReview,
  getPendingVerifications,
  makeVerificationDecision,
  getVerificationStats,
  getVerificationHistory,
  VERIFICATION_STATUS,
  DOCUMENT_TYPES
};