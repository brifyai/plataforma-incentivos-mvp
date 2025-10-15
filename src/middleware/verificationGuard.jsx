/**
 * Verification Guard Middleware
 * 
 * Bloquea el acceso a funcionalidades críticas si la empresa no está verificada
 */

import { VERIFICATION_STATUS } from '../services/verificationService';

/**
 * Verifica si la empresa puede operar (está aprobada)
 * @param {Object} verification - Objeto de verificación
 * @returns {boolean} - true si puede operar, false si no
 */
export const canCompanyOperate = (verification) => {
  console.log('🔍 canCompanyOperate - verification:', verification);
  console.log('🔍 canCompanyOperate - VERIFICATION_STATUS:', VERIFICATION_STATUS);
  
  if (!verification) {
    console.log('❌ canCompanyOperate - No hay verificación');
    return false;
  }

  const canOperate = verification.status === VERIFICATION_STATUS.APPROVED;
  console.log(`✅ canCompanyOperate - Estado: ${verification.status}, Estado esperado: ${VERIFICATION_STATUS.APPROVED}, Puede operar: ${canOperate}`);
  
  return canOperate;
};

/**
 * Verifica si la empresa puede acceder a funciones básicas
 * @param {Object} verification - Objeto de verificación
 * @returns {boolean} - true si tiene acceso básico, false si no
 */
export const hasBasicAccess = (verification) => {
  return verification && [
    VERIFICATION_STATUS.PENDING,
    VERIFICATION_STATUS.SUBMITTED,
    VERIFICATION_STATUS.UNDER_REVIEW,
    VERIFICATION_STATUS.APPROVED
  ].includes(verification.status);
};

/**
 * Mensaje de bloqueo según el estado de verificación
 * @param {Object} verification - Objeto de verificación
 * @returns {string} - Mensaje explicativo
 */
export const getBlockingMessage = (verification) => {
  if (!verification) {
    return 'Debe completar el proceso de verificación para acceder a esta función.';
  }

  switch (verification.status) {
    case VERIFICATION_STATUS.PENDING:
      return 'Debe subir todos los documentos requeridos para poder operar.';
    
    case VERIFICATION_STATUS.SUBMITTED:
    case VERIFICATION_STATUS.UNDER_REVIEW:
      return 'Su verificación está siendo revisada. Recibirá una notificación cuando sea aprobada.';
    
    case VERIFICATION_STATUS.REJECTED:
    case VERIFICATION_STATUS.NEEDS_CORRECTIONS:
      return 'Su verificación fue rechazada. Contacte al administrador para más información.';
    
    default:
      return 'Su empresa no está autorizada para operar. Espere la aprobación del administrador.';
  }
};

/**
 * Componente de bloqueo para funcionalidades restringidas
 */
export const VerificationBlock = ({ verification, children, fallback = null }) => {
  console.log('🔍 VerificationBlock - Iniciando evaluación');
  console.log('🔍 VerificationBlock - verification completo:', JSON.stringify(verification, null, 2));
  console.log('🔍 VerificationBlock - verification.status:', verification?.status);
  console.log('🔍 VerificationBlock - VERIFICATION_STATUS.APPROVED:', VERIFICATION_STATUS.APPROVED);
  
  const canOperateResult = canCompanyOperate(verification);
  console.log('🔍 VerificationBlock - canCompanyOperate result:', canOperateResult);

  if (!canOperateResult) {
    console.log('🚫 VerificationBlock - Bloqueando acceso');
    console.log('🚫 VerificationBlock - fallback proporcionado:', !!fallback);
    return fallback || (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <div className="text-yellow-600 mb-2">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          Funcionalidad Bloqueada
        </h3>
        <p className="text-yellow-700">
          {getBlockingMessage(verification)}
        </p>
      </div>
    );
  }

  console.log('✅ VerificationBlock - Permitiendo acceso');
  return children;
};

export default VerificationBlock;