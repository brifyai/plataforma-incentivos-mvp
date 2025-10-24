/**
 * Agreement Details Page - Company
 *
 * Página para ver detalles completos de un acuerdo específico
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, Button, LoadingSpinner } from '../../components/common';
import { getUserAgreements } from '../../services/databaseService';
import { formatCurrency, formatDate, formatPercentage } from '../../utils/formatters';
import {
  ArrowLeft,
  FileText,
  Users,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  Target,
  TrendingUp,
} from 'lucide-react';

const AgreementDetailsPage = () => {
  const { agreementId } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [agreement, setAgreement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (agreementId && profile?.company?.id) {
      loadAgreementData();
    }
  }, [agreementId, profile]);

  const loadAgreementData = async () => {
    try {
      setLoading(true);
      // Buscar el acuerdo específico en las agreements de la empresa
      const { agreements, error } = await getUserAgreements(profile.id);

      if (error) {
        console.error('Error loading agreements:', error);
        navigate('/company/dashboard');
        return;
      }

      // Filtrar por agreementId y que pertenezca a la empresa
      const foundAgreement = agreements.find(a =>
        a.id === agreementId && a.company_id === profile.company.id
      );

      if (!foundAgreement) {
        console.error('Agreement not found or not accessible');
        navigate('/company/dashboard');
        return;
      }

      setAgreement(foundAgreement);
    } catch (error) {
      console.error('Error loading agreement data:', error);
      navigate('/company/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getAgreementStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Activo</Badge>;
      case 'completed':
        return <Badge variant="info">Completado</Badge>;
      case 'defaulted':
        return <Badge variant="danger">Incumplido</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getOfferTypeLabel = (type) => {
    switch (type) {
      case 'discount':
        return 'Descuento';
      case 'fixed_amount':
        return 'Monto Fijo';
      case 'installment_plan':
        return 'Plan de Cuotas';
      case 'renegotiation':
        return 'Renegociación';
      case 'partial_condonation':
        return 'Condonación Parcial';
      default:
        return type;
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Cargando detalles del acuerdo..." />;
  }

  if (!agreement) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acuerdo No Encontrado</h2>
          <p className="text-gray-600 mb-4">
            El acuerdo solicitado no existe o no tienes acceso a él.
          </p>
          <Button onClick={() => navigate('/company/dashboard')}>
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/company/dashboard')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detalles del Acuerdo</h1>
          <p className="text-gray-600">Acuerdo #{agreement.id.slice(-8)}</p>
        </div>
      </div>

      {/* Agreement Status */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-success-100 rounded-lg">
              <FileText className="w-8 h-8 text-success-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Acuerdo de Pago</h2>
              <p className="text-gray-600">Creado el {formatDate(agreement.created_at)}</p>
            </div>
          </div>
          {getAgreementStatusBadge(agreement.status)}
        </div>
      </Card>

      {/* Agreement Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Debtor Info */}
        <Card title="Información del Deudor">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-100 rounded-lg">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{agreement.user?.full_name || 'Usuario desconocido'}</h3>
                <p className="text-sm text-gray-600">RUT: {agreement.user?.email || 'N/A'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{agreement.user?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">RUT:</span>
                <span className="font-medium">{agreement.user?.rut || 'N/A'}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Debt Info */}
        <Card title="Información de la Deuda">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-danger-100 rounded-lg">
                <FileText className="w-6 h-6 text-danger-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Deuda #{agreement.debt?.id.slice(-8)}</h3>
                <p className="text-sm text-gray-600">Ref: {agreement.debt?.debt_reference || 'N/A'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Monto Original:</span>
                <span className="font-medium">{formatCurrency(agreement.debt?.original_amount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Monto Actual:</span>
                <span className="font-medium">{formatCurrency(agreement.debt?.current_amount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tipo:</span>
                <span className="font-medium">{agreement.debt?.debt_type || 'N/A'}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Offer Details */}
      <Card title="Detalles de la Oferta">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <Target className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Tipo de Oferta</p>
            <p className="font-semibold text-gray-900">{getOfferTypeLabel(agreement.offer?.offer_type)}</p>
          </div>

          <div className="text-center p-4 bg-success-50 rounded-lg">
            <DollarSign className="w-8 h-8 text-success-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Monto Acordado</p>
            <p className="font-semibold text-gray-900">{formatCurrency(agreement.total_agreed_amount)}</p>
          </div>

          <div className="text-center p-4 bg-warning-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-warning-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Incentivo Usuario</p>
            <p className="font-semibold text-gray-900">{formatPercentage(agreement.offer?.user_incentive_percentage || 0)}</p>
          </div>

          <div className="text-center p-4 bg-info-50 rounded-lg">
            <Calendar className="w-8 h-8 text-info-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Fecha de Acuerdo</p>
            <p className="font-semibold text-gray-900">{formatDate(agreement.created_at)}</p>
          </div>
        </div>

        {agreement.offer?.title && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Título de la Oferta</h4>
            <p className="text-gray-700">{agreement.offer.title}</p>
          </div>
        )}

        {agreement.offer?.description && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Descripción</h4>
            <p className="text-gray-700">{agreement.offer.description}</p>
          </div>
        )}
      </Card>

      {/* Payment Progress */}
      <Card title="Progreso de Pagos">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-success-600" />
              <div>
                <p className="font-semibold text-gray-900">Estado del Acuerdo</p>
                <p className="text-sm text-gray-600">
                  {agreement.status === 'active' ? 'Acuerdo activo y en proceso' :
                   agreement.status === 'completed' ? 'Acuerdo completado exitosamente' :
                   agreement.status === 'defaulted' ? 'Acuerdo incumplido' :
                   'Acuerdo cancelado'}
                </p>
              </div>
            </div>
            {getAgreementStatusBadge(agreement.status)}
          </div>

          {agreement.status === 'active' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Próximos Pasos</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• El deudor debe completar los pagos según lo acordado</li>
                    <li>• Los pagos serán validados automáticamente</li>
                    <li>• Una vez completado, el incentivo será acreditado</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Button
          variant="primary"
          onClick={() => navigate('/company/proposals')}
        >
          Ver Todas las Propuestas
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/company/dashboard')}
        >
          Volver al Dashboard
        </Button>
      </div>
    </div>
  );
};

export default AgreementDetailsPage;