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
    const { data, error } = await supabase
      .from('company_verifications')
      .select(`
        *,
        assigned_to_user:assigned_to (
          id,
          full_name,
          email
        ),
        reviewed_by_user:reviewed_by (
          id,
          full_name,
          email
        )
      `)
      .eq('company_id', companyId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return { verification: null, error: error.message };
    }

    return { verification: data, error: null };
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
    const { data: verification, error } = await supabase
      .from('company_verifications')
      .upsert({
        company_id: companyId,
        ...data,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'company_id'
      })
      .select()
      .single();

    if (error) {
      return { verification: null, error: error.message };
    }

    return { verification, error: null };
  } catch (error) {
    console.error('Error upserting company verification:', error);
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
    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${companyId}/${documentType}_${Date.now()}.${fileExt}`;

    // Subir archivo a Supabase Storage
    const { data, error } = await supabase.storage
      .from('verification-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      return { url: null, error: error.message };
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('verification-documents')
      .getPublicUrl(fileName);

    return { url: publicUrl, fileName, error: null };
  } catch (error) {
    console.error('Error uploading verification document:', error);
    return { url: null, error: 'Error al subir documento' };
  }
};

/**
 * Envía la verificación para revisión
 * @param {string} companyId - ID de la empresa
 * @returns {Promise<{success, error}>}
 */
export const submitVerificationForReview = async (companyId) => {
  try {
    // Verificar que tenga todos los documentos requeridos
    const { verification, error: getError } = await getCompanyVerification(companyId);

    if (getError) {
      return { success: false, error: getError };
    }

    if (!verification) {
      return { success: false, error: 'No se encontró verificación para esta empresa' };
    }

    // Verificar documentos
    const hasCertificadoVigencia = verification.certificado_vigencia_url;
    const hasInformeEquifax = verification.informe_equifax_url;

    if (!hasCertificadoVigencia || !hasInformeEquifax) {
      return { success: false, error: 'Debe subir ambos documentos antes de enviar' };
    }

    // Actualizar estado a submitted
    const { error: updateError } = await supabase
      .from('company_verifications')
      .update({
        status: VERIFICATION_STATUS.SUBMITTED,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('company_id', companyId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error submitting verification:', error);
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