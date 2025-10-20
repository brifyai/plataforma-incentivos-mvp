/**
 * Company Verification Page
 *
 * Página para que las empresas suban sus documentos de verificación
 */

import { useState, useEffect } from 'react';
import { Card, Button, Input, Modal, Badge } from '../../components/common';
import { formatDate } from '../../utils/formatters';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  Eye,
  Send,
  RefreshCw
} from 'lucide-react';
import {
  getCompanyVerification,
  upsertCompanyVerification,
  uploadVerificationDocument,
  submitVerificationForReview,
  VERIFICATION_STATUS
} from '../../services/verificationService';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

const CompanyVerificationPage = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verification, setVerification] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    loadVerification();
  }, []);

  // Efecto para actualizar el estado cuando los documentos se suben
  useEffect(() => {
    if (verification?.certificado_vigencia_url || verification?.informe_equifax_url) {
      console.log('🔄 Documentos detectados, actualizando estado...');
      // Forzar una recarga para asegurar que la UI esté sincronizada
      const timer = setTimeout(() => {
        loadVerification();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [verification?.certificado_vigencia_url, verification?.informe_equifax_url]);

  const loadVerification = async () => {
    try {
      setLoading(true);
      // Obtener el companyId del perfil del usuario
      const companyId = profile?.company?.id;

      console.log('🔍 loadVerification - Iniciando carga:', { companyId, profile: profile?.company });

      if (!companyId) {
        console.warn('❌ No company ID found in user profile');
        setLoading(false);
        return;
      }

      const { verification: data, error } = await getCompanyVerification(companyId);

      console.log('📊 loadVerification - Resultado:', { data, error });

      if (error) {
        console.error('❌ Error loading verification:', error);
        // Si no existe, crear una nueva
        const { verification: newVerification } = await upsertCompanyVerification(companyId, {});
        console.log('🆕 loadVerification - Creando nueva verificación:', newVerification);
        setVerification(newVerification);
      } else {
        console.log('✅ loadVerification - Verificación cargada:', {
          id: data?.id,
          company_id: data?.company_id,
          certificado_vigencia_url: data?.certificado_vigencia_url,
          certificado_vigencia_filename: data?.certificado_vigencia_filename,
          certificado_vigencia_uploaded_at: data?.certificado_vigencia_uploaded_at,
          informe_equifax_url: data?.informe_equifax_url,
          informe_equifax_filename: data?.informe_equifax_filename,
          informe_equifax_uploaded_at: data?.informe_equifax_uploaded_at,
          status: data?.status
        });
        setVerification(data);
      }
    } catch (error) {
      console.error('💥 Error in loadVerification:', error);
      Swal.fire('Error', 'Error al cargar verificación', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (documentType, file) => {
    if (!file) return;

    console.log('🔄 Iniciando subida de documento:', {
      documentType,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    // Validar tipo de archivo
    if (!file.type.includes('pdf')) {
      console.error('❌ Tipo de archivo inválido:', file.type);
      Swal.fire('Error', 'Solo se permiten archivos PDF', 'error');
      return;
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.error('❌ Archivo demasiado grande:', file.size);
      Swal.fire('Error', 'El archivo no puede superar los 10MB', 'error');
      return;
    }

    try {
      setUploading(true);
      const companyId = verification.company_id;

      console.log('📤 Enviando documento al servicio:', {
        companyId,
        documentType,
        verificationExists: !!verification
      });

      const { url, fileName, error } = await uploadVerificationDocument(companyId, documentType, file);

      if (error) {
        console.error('❌ Error en uploadVerificationDocument:', error);
        Swal.fire('Error', error, 'error');
        return;
      }

      console.log('✅ Documento subido exitosamente:', {
        url,
        fileName
      });

      // Actualizar verificación con la URL del documento
      const updateData = {
        [`${documentType}_url`]: url,
        [`${documentType}_filename`]: fileName,
        [`${documentType}_uploaded_at`]: new Date().toISOString()
      };

      console.log('💾 Actualizando verificación con:', updateData);

      const { verification: updated, error: updateError } = await upsertCompanyVerification(companyId, updateData);

      if (updateError) {
        console.error('❌ Error en upsertCompanyVerification:', updateError);
        Swal.fire('Error', updateError, 'error');
        return;
      }

      console.log('✅ Verificación actualizada:', updated);
      console.log('🔍 Verificando campos actualizados:', {
        [`certificado_vigencia_url`]: updated?.certificado_vigencia_url,
        [`informe_equifax_url`]: updated?.informe_equifax_url,
        [`certificado_vigencia_filename`]: updated?.certificado_vigencia_filename,
        [`informe_equifax_filename`]: updated?.informe_equifax_filename
      });
      
      // Forzar actualización del estado inmediatamente
      setVerification(updated);
      
      // Recargar datos frescos desde la base de datos para asegurar sincronización
      setTimeout(() => {
        console.log('🔄 Recargando verificación desde la base de datos...');
        loadVerification();
      }, 500);
      
      // Mostrar mensaje de éxito más informativo
      Swal.fire({
        icon: 'success',
        title: '¡Documento subido correctamente!',
        html: `
          <div class="text-left">
            <p class="mb-2">El documento ha sido guardado exitosamente.</p>
            <div class="bg-blue-50 p-3 rounded border border-blue-200">
              <p class="text-sm text-blue-800">
                <strong>Próximo paso:</strong> Suba el otro documento requerido para poder enviar su verificación.
              </p>
            </div>
          </div>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3B82F6'
      });

    } catch (error) {
      console.error('💥 Error general en handleFileUpload:', error);
      Swal.fire('Error', 'Error al subir el archivo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitForReview = async () => {
    const hasCertificadoVigencia = verification.certificado_vigencia_url;
    const hasInformeEquifax = verification.informe_equifax_url;

    if (!hasCertificadoVigencia || !hasInformeEquifax) {
      Swal.fire('Documentos requeridos', 'Debe subir ambos documentos antes de enviar para revisión', 'warning');
      return;
    }

    const result = await Swal.fire({
      title: '¿Enviar para revisión?',
      text: 'Una vez enviado, no podrá modificar los documentos hasta que el administrador tome una decisión',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      setSubmitting(true);
      console.log('📤 Enviando verificación para revisión:', verification.company_id);
      const { success, error } = await submitVerificationForReview(verification.company_id);

      if (success) {
        console.log('✅ Verificación enviada exitosamente');
        Swal.fire('Enviado', 'Sus documentos han sido enviados para revisión. Recibirá una notificación cuando se tome una decisión.', 'success');
        loadVerification(); // Recargar estado
      } else {
        console.error('❌ Error al enviar verificación:', error);
        Swal.fire('Error', error, 'error');
      }
    } catch (error) {
      console.error('💥 Error general en handleSubmitForReview:', error);
      Swal.fire('Error', 'Error al enviar para revisión', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      [VERIFICATION_STATUS.PENDING]: { variant: 'secondary', text: 'Pendiente', icon: Clock },
      [VERIFICATION_STATUS.SUBMITTED]: { variant: 'info', text: 'Enviado', icon: Send },
      [VERIFICATION_STATUS.UNDER_REVIEW]: { variant: 'warning', text: 'En Revisión', icon: RefreshCw },
      [VERIFICATION_STATUS.APPROVED]: { variant: 'success', text: 'Aprobado', icon: CheckCircle },
      [VERIFICATION_STATUS.REJECTED]: { variant: 'danger', text: 'Rechazado', icon: AlertCircle },
      [VERIFICATION_STATUS.NEEDS_CORRECTIONS]: { variant: 'warning', text: 'Correcciones Requeridas', icon: AlertCircle }
    };

    const config = statusConfig[status] || statusConfig[VERIFICATION_STATUS.PENDING];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const openDocumentModal = (documentType, url) => {
    console.log('🔍 Abriendo modal para documento:', { documentType, url });
    
    if (!url) {
      Swal.fire('Error', 'No hay URL disponible para este documento', 'error');
      return;
    }
    
    setSelectedDocument({ type: documentType, url });
    setShowDocumentModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-strong">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight">
                Verificación de Empresa
              </h1>
              <p className="text-blue-100 text-lg">
                Complete su verificación para acceder a todas las funciones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {getStatusBadge(verification?.status)}
            <Button
              variant="primary"
              onClick={loadVerification}
              leftIcon={<RefreshCw className="w-4 h-4" />}
              className="bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
            >
              Actualizar
            </Button>
          </div>
        </div>

        {/* Status Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-blue-300" />
              <div>
                <p className="text-sm text-blue-100">Estado Actual</p>
                <p className="text-lg font-bold">{getStatusBadge(verification?.status).props.children[1]}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <Send className="w-6 h-6 text-blue-300" />
              <div>
                <p className="text-sm text-blue-100">Enviado</p>
                <p className="text-lg font-bold">
                  {verification?.submitted_at ? formatDate(verification.submitted_at) : 'No enviado'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-blue-300" />
              <div>
                <p className="text-sm text-blue-100">Analista Asignado</p>
                <p className="text-lg font-bold">
                  {verification?.assigned_to_user?.full_name || 'Por asignar'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Certificado de Vigencia */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-xl">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-secondary-900">Certificado de Vigencia</h3>
              <p className="text-secondary-600">Documento que certifica existencia legal</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Opciones de obtención */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">¿Dónde obtenerlo?</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-green-700">Opción Gratuita:</strong>
                    <a
                      href="https://www.registrodeempresasysociedades.cl/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline ml-1"
                    >
                      registrodeempresasysociedades.cl
                    </a>
                    <span className="text-green-600 font-medium"> - $0</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-orange-700">Opción de Pago:</strong>
                    <a
                      href="https://conservador.cl/portal/certificado_vigencia_sociedad"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline ml-1"
                    >
                      conservador.cl
                    </a>
                    <span className="text-orange-600 font-medium"> - $2.300</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Estado del documento */}
            <div className={`border rounded-lg p-4 transition-all duration-300 ${
              verification?.certificado_vigencia_url
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">Estado del documento:</span>
                <Badge variant={verification?.certificado_vigencia_url ? "success" : "secondary"}>
                  {verification?.certificado_vigencia_url ? "✅ Subido" : "⏳ No subido"}
                </Badge>
              </div>

              {verification?.certificado_vigencia_url ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <p className="font-medium text-green-800">✅ Certificado subido exitosamente</p>
                      <p className="text-gray-600">
                        Archivo: {verification.certificado_vigencia_filename || 'Nombre no disponible'}
                      </p>
                      <p className="text-gray-600">
                        Subido: {verification.certificado_vigencia_uploaded_at ? formatDate(verification.certificado_vigencia_uploaded_at) : 'Fecha no disponible'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDocumentModal('Certificado de Vigencia', verification.certificado_vigencia_url)}
                      leftIcon={<Eye className="w-4 h-4" />}
                      className="border-green-300 text-green-700 hover:bg-green-100"
                    >
                      Ver
                    </Button>
                  </div>
                  
                  {!verification?.informe_equifax_url && (
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>📋 Siguiente paso:</strong> Suba el Informe Empresarial Equifax para completar su verificación.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileUpload('certificado_vigencia', e.target.files[0])}
                    className="hidden"
                    id="certificado-vigencia"
                    disabled={uploading}
                  />
                  <label htmlFor="certificado-vigencia">
                    <Button
                      variant="outline"
                      leftIcon={<Upload className="w-4 h-4" />}
                      disabled={uploading}
                      className="w-full"
                      as="span"
                    >
                      {uploading ? '⏳ Subiendo...' : '📤 Subir Certificado de Vigencia'}
                    </Button>
                  </label>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Informe Equifax */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-100 rounded-xl">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-secondary-900">Informe Empresarial Equifax</h3>
              <p className="text-secondary-600">Análisis crediticio y de riesgo empresarial</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Información de obtención */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-3">Obtención del Informe:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <ExternalLink className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Plataforma:</strong>
                    <a
                      href="https://sec.equifax.cl/compraonline/ficha-producto/2/informe-empresarial"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline ml-1"
                    >
                      sec.equifax.cl - Informe Empresarial
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Costo:</strong> <span className="text-green-700 font-medium">$27.990 CLP</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Tiempo:</strong> 1-3 días hábiles
                  </div>
                </div>
              </div>
            </div>

            {/* Estado del documento */}
            <div className={`border rounded-lg p-4 transition-all duration-300 ${
              verification?.informe_equifax_url
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">Estado del documento:</span>
                <Badge variant={verification?.informe_equifax_url ? "success" : "secondary"}>
                  {verification?.informe_equifax_url ? "✅ Subido" : "⏳ No subido"}
                </Badge>
              </div>

              {verification?.informe_equifax_url ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <p className="font-medium text-green-800">✅ Informe subido exitosamente</p>
                      <p className="text-gray-600">
                        Archivo: {verification.informe_equifax_filename || 'Nombre no disponible'}
                      </p>
                      <p className="text-gray-600">
                        Subido: {verification.informe_equifax_uploaded_at ? formatDate(verification.informe_equifax_uploaded_at) : 'Fecha no disponible'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDocumentModal('Informe Equifax', verification.informe_equifax_url)}
                      leftIcon={<Eye className="w-4 h-4" />}
                      className="border-green-300 text-green-700 hover:bg-green-100"
                    >
                      Ver
                    </Button>
                  </div>
                  
                  {!verification?.certificado_vigencia_url && (
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>📋 Siguiente paso:</strong> Suba el Certificado de Vigencia para completar su verificación.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileUpload('informe_equifax', e.target.files[0])}
                    className="hidden"
                    id="informe-equifax"
                    disabled={uploading}
                  />
                  <label htmlFor="informe-equifax">
                    <Button
                      variant="outline"
                      leftIcon={<Upload className="w-4 h-4" />}
                      disabled={uploading}
                      className="w-full"
                      as="span"
                    >
                      {uploading ? '⏳ Subiendo...' : '📤 Subir Informe Equifax'}
                    </Button>
                  </label>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Submit Section */}
      <Card>
        <div className="text-center">
          <h3 className="text-xl font-bold text-secondary-900 mb-4">
            ¿Listo para enviar?
          </h3>

          {verification?.status === VERIFICATION_STATUS.PENDING && (
            <div className="mb-6">
              <p className="text-secondary-600 mb-4">
                Una vez que haya subido ambos documentos, puede enviarlos para revisión.
                El proceso tomará máximo 24 horas.
              </p>

              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className={`w-5 h-5 ${verification?.certificado_vigencia_url ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className={verification?.certificado_vigencia_url ? 'text-green-700' : 'text-gray-500'}>
                    Certificado de Vigencia
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className={`w-5 h-5 ${verification?.informe_equifax_url ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className={verification?.informe_equifax_url ? 'text-green-700' : 'text-gray-500'}>
                    Informe Equifax
                  </span>
                </div>
              </div>

              <Button
                variant="gradient"
                size="lg"
                onClick={handleSubmitForReview}
                disabled={submitting || !verification?.certificado_vigencia_url || !verification?.informe_equifax_url}
                leftIcon={<Send className="w-5 h-5" />}
                className="px-8 py-3"
              >
                {submitting ? 'Enviando...' : 'Enviar para Revisión'}
              </Button>
            </div>
          )}

          {verification?.status === VERIFICATION_STATUS.SUBMITTED && (
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <CheckCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-blue-900 mb-2">
                Documentos Enviados
              </h4>
              <p className="text-blue-700">
                Sus documentos están siendo revisados. Recibirá una notificación cuando se tome una decisión.
              </p>
            </div>
          )}

          {verification?.status === VERIFICATION_STATUS.APPROVED && (
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-green-900 mb-2">
                ¡Verificación Aprobada!
              </h4>
              <p className="text-green-700">
                Su empresa ha sido verificada exitosamente. Ya puede acceder a todas las funciones.
              </p>
            </div>
          )}

          {verification?.status === VERIFICATION_STATUS.REJECTED && (
            <div className="bg-red-50 p-6 rounded-lg border border-red-200">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-red-900 mb-2">
                Verificación Rechazada
              </h4>
              <p className="text-red-700 mb-2">
                {verification.rejection_reason || 'Su verificación ha sido rechazada.'}
              </p>
              <p className="text-sm text-red-600">
                Por favor, contacte al soporte para más información.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Document Viewer Modal */}
      <Modal
        isOpen={showDocumentModal}
        onClose={() => {
          console.log('🔒 Cerrando modal');
          setShowDocumentModal(false);
        }}
        title={selectedDocument?.type || 'Documento'}
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Visualizando: <strong>{selectedDocument?.type}</strong>
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔗 Abriendo documento en nueva pestaña:', selectedDocument?.url);
                if (selectedDocument?.url) {
                  window.open(selectedDocument.url, '_blank', 'noopener,noreferrer');
                }
              }}
              leftIcon={<ExternalLink className="w-4 h-4" />}
            >
              Abrir en nueva pestaña
            </Button>
          </div>
          
          <div className="h-96 border rounded-lg overflow-hidden">
            {selectedDocument?.url ? (
              <iframe
                src={selectedDocument.url}
                className="w-full h-full"
                title={selectedDocument.type}
                onError={(e) => {
                  console.error('❌ Error cargando documento en iframe:', e);
                  e.target.style.display = 'none';
                  // Mostrar mensaje de error
                  const errorDiv = document.createElement('div');
                  errorDiv.className = 'flex items-center justify-center h-full bg-gray-50';
                  errorDiv.innerHTML = `
                    <div class="text-center">
                      <div class="w-12 h-12 text-gray-400 mx-auto mb-3">⚠️</div>
                      <p class="text-gray-600 mb-3">No se puede cargar el documento en el visor</p>
                      <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onclick="window.open('${selectedDocument.url}', '_blank')">
                        Abrir externamente
                      </button>
                    </div>
                  `;
                  e.target.parentNode.appendChild(errorDiv);
                }}
                onLoad={() => {
                  console.log('✅ Documento cargado exitosamente en iframe');
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No se puede cargar el documento</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🔗 Abriendo documento externamente:', selectedDocument?.url);
                      if (selectedDocument?.url) {
                        window.open(selectedDocument.url, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    leftIcon={<ExternalLink className="w-4 h-4" />}
                  >
                    Abrir externamente
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CompanyVerificationPage;