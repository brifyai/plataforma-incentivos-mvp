/**
 * Compliance Section
 *
 * Sección que agrupa toda la verificación y cumplimiento legal
 */

import { Card } from '../common';
import { Shield, FileText, CheckCircle, AlertCircle, Clock, Send } from 'lucide-react';
import VerificationProgress from './VerificationProgress';

const ComplianceSection = ({
  profile,
  verification,
  verificationLoading,
  uploading,
  onDocumentUpload,
  onViewDocument,
  onSubmitVerification
}) => {
  return (
    <div className="space-y-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Verificación y Cumplimiento</h2>
          <p className="text-gray-600">Documentos legales y estado de verificación de tu empresa</p>
        </div>
      </div>

      {/* Verification Progress */}
      <VerificationProgress profile={profile} verification={verification} />

      {/* Document Verification Section */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Documentos de Verificación</h3>
              <p className="text-gray-600">Sube tus documentos para verificar tu empresa</p>
            </div>
          </div>

          {verification && (
            <div className="flex items-center gap-2">
              {(() => {
                const statusInfo = getVerificationStatusInfo(verification.status);
                const StatusIcon = statusInfo.icon;
                return (
                  <>
                    <StatusIcon className={`w-5 h-5 text-${statusInfo.color}-500`} />
                    <span className={`text-sm font-semibold text-${statusInfo.color}-600`}>
                      {statusInfo.text}
                    </span>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {verificationLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Document Upload Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Certificado de Vigencia */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Certificado de Vigencia</h3>
                    <p className="text-sm text-gray-600">Documento que certifica la existencia legal de tu empresa</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) onDocumentUpload('certificado_vigencia', file);
                    }}
                    className="hidden"
                    id="certificado-upload"
                    disabled={uploading}
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => document.getElementById('certificado-upload').click()}
                      disabled={uploading}
                      className="flex-1 bg-white border border-blue-200 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      {verification?.certificado_vigencia_url ? 'Cambiar' : 'Subir'}
                    </button>

                    <button
                      onClick={() => onViewDocument(verification?.certificado_vigencia_url, 'Certificado de Vigencia')}
                      disabled={!verification?.certificado_vigencia_url}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Ver
                    </button>
                  </div>
                </div>
              </div>

              {/* Informe Equifax */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Informe Empresarial Equifax</h3>
                    <p className="text-sm text-gray-600">Análisis crediticio y de riesgo empresarial</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) onDocumentUpload('informe_equifax', file);
                    }}
                    className="hidden"
                    id="equifax-upload"
                    disabled={uploading}
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => document.getElementById('equifax-upload').click()}
                      disabled={uploading}
                      className="flex-1 bg-white border border-purple-200 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      {verification?.informe_equifax_url ? 'Cambiar' : 'Subir'}
                    </button>

                    <button
                      onClick={() => onViewDocument(verification?.informe_equifax_url, 'Informe Equifax')}
                      disabled={!verification?.informe_equifax_url}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Ver
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            {verification?.certificado_vigencia_url && verification?.informe_equifax_url && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-green-900 mb-1">¡Documentos completos!</h3>
                    <p className="text-sm text-green-700">
                      Ambos documentos han sido subidos. Ahora puedes enviar tu verificación para revisión.
                    </p>
                  </div>

                  <button
                    onClick={onSubmitVerification}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all duration-200"
                  >
                    <Send className="w-4 h-4" />
                    Enviar para Revisión
                  </button>
                </div>
              </div>
            )}

            {/* Status Messages */}
            {verification?.status === 'approved' && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">¡Verificación Aprobada!</p>
                    <p className="text-sm text-green-700">Tu empresa ha sido verificada exitosamente.</p>
                  </div>
                </div>
              </div>
            )}

            {verification?.status === 'rejected' && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-4 border border-red-100">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-900">Verificación Rechazada</p>
                    <p className="text-sm text-red-700">
                      {verification.rejection_reason || 'Contacta al soporte para más información.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

// Helper function for status info
const getVerificationStatusInfo = (status) => {
  switch (status) {
    case 'approved':
      return { color: 'green', text: 'Aprobado', icon: CheckCircle };
    case 'rejected':
      return { color: 'red', text: 'Rechazado', icon: AlertCircle };
    case 'under_review':
      return { color: 'yellow', text: 'En Revisión', icon: Clock };
    case 'submitted':
      return { color: 'blue', text: 'Enviado', icon: Send };
    default:
      return { color: 'gray', text: 'Pendiente', icon: Clock };
  }
};

export default ComplianceSection;