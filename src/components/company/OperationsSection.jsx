/**
 * Operations Section
 *
 * Sección que agrupa todas las herramientas y operaciones diarias
 */

import { useState, useEffect } from 'react';
import { Card, Button } from '../common';
import { Settings, Upload, CreditCard, Users, MessageSquare, FileText, AlertTriangle, RefreshCw } from 'lucide-react';
import PaymentTools from '../../pages/company/components/PaymentTools';
import { Link } from 'react-router-dom';
import { getCompanyVerification } from '../../services/verificationService';

const OperationsSection = ({ profile }) => {
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVerification = async () => {
      console.log('🔍 OperationsSection - Cargando verificación para company:', profile?.company_id);
      
      if (!profile?.company_id) {
        console.log('❌ OperationsSection - No hay company_id, saliendo');
        setLoading(false);
        return;
      }

      try {
        const { verification: data, error } = await getCompanyVerification(profile.company_id);
        
        console.log('🔍 OperationsSection - Respuesta de getCompanyVerification:', { verification: data, error });
        
        if (error) {
          console.error('❌ OperationsSection - Error cargando verificación:', error);
        } else {
          console.log('✅ OperationsSection - Verificación cargada:', data);
          console.log('✅ OperationsSection - Verification.status:', data?.status);
          setVerification(data);
        }
      } catch (error) {
        console.error('💥 OperationsSection - Error general:', error);
      } finally {
        console.log('🔍 OperationsSection - Finalizando loading');
        setLoading(false);
      }
    };

    loadVerification();
  }, [profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  console.log('🔍 OperationsSection - Renderizando con verification:', verification);
  console.log('🔍 OperationsSection - Puede operar:', verification?.status);

  // BLOQUEO DIRECTO: Solo permitir acceso si está aprobado explícitamente
  const isApproved = verification?.status === 'approved';
  console.log('🚫 OperationsSection - isApproved:', isApproved);

  // Si no está aprobado, mostrar bloqueo
  if (!isApproved) {
    console.log('🚫 OperationsSection - BLOQUEANDO ACCESO - Estado:', verification?.status);
    
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
      statusMessage = 'Su empresa debe estar verificada y aprobada para usar las operaciones diarias.';
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
          <AlertTriangle className="w-16 h-16 mx-auto" />
        </div>
        <h3 className={`text-xl font-bold ${textColor} mb-4`}>
          🚫 Operaciones Diarias Bloqueadas
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

  console.log('✅ OperationsSection - PERMITIENDO ACCESO - Estado aprobado');
  
  return (
    <div className="space-y-4 mb-6">
      {/* Payment Tools */}
      <div className="mb-4">
        <PaymentTools />
      </div>

      {/* Nota sobre importación de clientes */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-600" />
          <div>
            <h4 className="font-semibold text-blue-900">Importación de Clientes</h4>
            <p className="text-sm text-blue-700">
              Para importar clientes y deudores, diríjase a la sección de
              <Link to="/empresa/clientes" className="text-blue-600 hover:underline font-medium ml-1">
                Clientes
              </Link>
            </p>
          </div>
        </div>
      </Card>

    </div>
  );
};

export default OperationsSection;