import React, { useState, useEffect } from 'react';

import { useAuth } from '../../context/AuthContext';
import { getCompanyVerification } from '../../services/verificationService';
import BulkImportDebtsFixed from '../../components/company/BulkImportDebtsFixed';

const BulkImportPage = () => {
  const { user, profile } = useAuth();
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVerification = async () => {
      console.log('🔍 BulkImportPage - useEffect iniciado');
      console.log('🔍 BulkImportPage - Profile:', profile);
      console.log('🔍 BulkImportPage - Profile.company_id:', profile?.company_id);
      
      if (!profile?.company_id) {
        console.log('❌ BulkImportPage - No hay company_id, saliendo');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 BulkImportPage - Cargando verificación para company:', profile.company_id);
        const { verification, error } = await getCompanyVerification(profile.company_id);
        
        console.log('🔍 BulkImportPage - Respuesta de getCompanyVerification:', { verification, error });
        
        if (error) {
          console.error('❌ BulkImportPage - Error cargando verificación:', error);
        } else {
          console.log('✅ BulkImportPage - Verificación cargada:', verification);
          console.log('✅ BulkImportPage - Verification.status:', verification?.status);
          setVerification(verification);
        }
      } catch (error) {
        console.error('💥 BulkImportPage - Error general:', error);
      } finally {
        console.log('🔍 BulkImportPage - Finalizando loading');
        setLoading(false);
      }
    };

    loadVerification();
  }, [profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  console.log('🔍 BulkImportPage - Renderizando con verification:', verification);
  console.log('🔍 BulkImportPage - Puede operar:', verification?.status);

  // BLOQUEO DIRECTO: Solo permitir acceso si está aprobado explícitamente
  const isApproved = verification?.status === 'approved';
  console.log('🚫 BulkImportPage - isApproved:', isApproved);

  // Si no está aprobado, mostrar bloqueo
  if (!isApproved) {
    console.log('🚫 BulkImportPage - BLOQUEANDO ACCESO - Estado:', verification?.status);
    
    // Determinar el mensaje específico según el estado
    let statusMessage = '';
    let statusColor = 'red';
    
    if (!verification) {
      statusMessage = 'Su empresa no ha iniciado el proceso de verificación. Debe subir los documentos requeridos.';
      statusColor = 'orange';
    } else if (verification.status === 'pending') {
      statusMessage = 'Su empresa ha iniciado el proceso de verificación pero debe completar todos los documentos.';
      statusColor = 'yellow';
    } else if (verification.status === 'submitted') {
      statusMessage = 'Su verificación ha sido enviada y está siendo revisada por el administrador.';
      statusColor = 'blue';
    } else if (verification.status === 'under_review') {
      statusMessage = 'Su verificación está siendo revisada actualmente por el administrador.';
      statusColor = 'blue';
    } else if (verification.status === 'rejected') {
      statusMessage = 'Su verificación fue rechazada. Contacte al administrador para más información.';
      statusColor = 'red';
    } else if (verification.status === 'needs_corrections') {
      statusMessage = 'Su verificación necesita correcciones. Por favor revise los comentarios del administrador.';
      statusColor = 'orange';
    } else {
      statusMessage = 'Su empresa debe estar verificada y aprobada para usar esta función.';
      statusColor = 'red';
    }

    const bgColor = statusColor === 'red' ? 'bg-red-50' :
                   statusColor === 'orange' ? 'bg-orange-50' :
                   statusColor === 'yellow' ? 'bg-yellow-50' :
                   statusColor === 'blue' ? 'bg-blue-50' : 'bg-gray-50';
    
    const borderColor = statusColor === 'red' ? 'border-red-200' :
                       statusColor === 'orange' ? 'border-orange-200' :
                       statusColor === 'yellow' ? 'border-yellow-200' :
                       statusColor === 'blue' ? 'border-blue-200' : 'border-gray-200';
    
    const textColor = statusColor === 'red' ? 'text-red-800' :
                      statusColor === 'orange' ? 'text-orange-800' :
                      statusColor === 'yellow' ? 'text-yellow-800' :
                      statusColor === 'blue' ? 'text-blue-800' : 'text-gray-800';

    return (
      <div className={`${bgColor} ${borderColor} rounded-lg p-8 text-center m-8`}>
        <div className={`${textColor} mb-4`}>
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className={`text-xl font-bold ${textColor} mb-4`}>
          🚫 Importación Masiva Bloqueada
        </h3>
        <p className={`${textColor} mb-4`}>
          {statusMessage}
        </p>
        <div className={`bg-${statusColor}-100 p-4 rounded border ${statusColor}-300 mb-4`}>
          <p className={`text-sm ${textColor}`}>
            <strong>Estado actual:</strong> {verification?.status || 'No iniciado'}<br/>
            <strong>Requisito:</strong> Estado debe ser 'approved'<br/>
            <strong>Acción:</strong> Complete el proceso de verificación
          </p>
        </div>
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => window.location.href = '/empresa/verification'}
        >
          {verification ? 'Ver Estado de Verificación' : 'Iniciar Verificación'}
        </button>
      </div>
    );
  }

  console.log('✅ BulkImportPage - PERMITIENDO ACCESO - Estado aprobado');
  
  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Importación Masiva de Deudas</h1>
          <p className="mt-2 text-gray-600">
            Importe múltiples deudas desde un archivo CSV o Excel
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-800 font-medium">
              Empresa Global verificada y aprobada - Puede usar la importación masiva
            </span>
          </div>
        </div>

        <BulkImportDebtsFixed profile={profile} onImportComplete={() => {
          console.log('✅ Importación completada exitosamente');
        }} />
      </div>
    </div>
  );
};

export default BulkImportPage;