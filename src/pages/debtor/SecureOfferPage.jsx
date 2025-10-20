/**
 * Secure Offer Page - Debtor
 *
 * Página segura para que los deudores vean ofertas personalizadas
 * sin compartir datos de contacto
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, Button, LoadingSpinner } from '../../components/common';
import { validateSecureMessageToken, updateSecureMessage } from '../../services/databaseService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  CreditCard,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

const SecureOfferPage = () => {
  const { token } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [showOfferDetails, setShowOfferDetails] = useState(false);

  useEffect(() => {
    if (token && user?.id) {
      loadSecureMessage();
    }
  }, [token, user]);

  const loadSecureMessage = async () => {
    try {
      setLoading(true);
      setError(null);

      const { message: secureMessage, error } = await validateSecureMessageToken(token, user.id);

      if (error) {
        setError('Enlace inválido o expirado. Contacta a tu empresa de cobranza.');
        return;
      }

      if (!secureMessage) {
        setError('Mensaje no encontrado.');
        return;
      }

      setMessage(secureMessage);

      // Marcar como leído si no lo estaba
      if (secureMessage.status === 'sent') {
        await updateSecureMessage(secureMessage.id, {
          status: 'opened',
          read_at: new Date().toISOString()
        });
      }

    } catch (err) {
      console.error('Error loading secure message:', err);
      setError('Error al cargar la oferta. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async () => {
    try {
      setAccepting(true);

      // Aquí iría la lógica para aceptar la oferta
      // Crear un acuerdo, actualizar el estado del mensaje, etc.

      await updateSecureMessage(message.id, {
        status: 'converted',
        converted_at: new Date().toISOString()
      });

      // Redirigir al dashboard del deudor
      navigate('/debtor/dashboard', {
        state: {
          message: '¡Felicitaciones! Has aceptado la oferta exitosamente.',
          type: 'success'
        }
      });

    } catch (error) {
      console.error('Error accepting offer:', error);
      setError('Error al aceptar la oferta. Intenta de nuevo.');
    } finally {
      setAccepting(false);
    }
  };

  const handleRejectOffer = async () => {
    try {
      await updateSecureMessage(message.id, {
        status: 'expired',
        replied_at: new Date().toISOString()
      });

      navigate('/debtor/dashboard', {
        state: {
          message: 'Has rechazado la oferta.',
          type: 'info'
        }
      });
    } catch (error) {
      console.error('Error rejecting offer:', error);
      setError('Error al rechazar la oferta.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-secondary-600">Verificando enlace seguro...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="p-6 bg-white rounded-2xl shadow-lg">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Enlace No Válido</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => navigate('/debtor/dashboard')}>
              Ir al Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="p-6 bg-white rounded-2xl shadow-lg">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Mensaje No Encontrado</h2>
            <p className="text-gray-600 mb-6">El mensaje que buscas no existe o ha expirado.</p>
            <Button onClick={() => navigate('/debtor/dashboard')}>
              Ir al Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const offerDetails = message.offer_details || {};
  const companyName = message.company_name_visible || 'Empresa';
  const debtReference = message.debt_reference_visible || 'N/A';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Security Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Oferta Segura</h1>
              <p className="text-green-100">
                Comunicación segura • Sin compartir datos personales • Verificada por NexuPay
              </p>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          {message.trust_badges?.map((badge, index) => (
            <Badge key={index} variant="success" className="px-4 py-2">
              <CheckCircle className="w-4 h-4 mr-2" />
              {badge === 'verified' ? 'Empresa Verificada' :
               badge === 'secure' ? 'Comunicación Segura' :
               badge === 'encrypted' ? 'Encriptado' : badge}
            </Badge>
          ))}
        </div>

        {/* Main Offer Card */}
        <Card className="mb-8 shadow-xl border-2 border-primary-200">
          <div className="text-center mb-8">
            <div className="p-6 bg-gradient-to-br from-primary-100 to-primary-200 rounded-3xl inline-block mb-6">
              <DollarSign className="w-16 h-16 text-primary-600" />
            </div>
            <h2 className="text-3xl font-display font-bold text-secondary-900 mb-2">
              Oferta Especial de {companyName}
            </h2>
            <p className="text-secondary-600 text-lg">
              Referencia de deuda: {debtReference}
            </p>
          </div>

          {/* Message Content */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <div className="prose prose-lg max-w-none">
              <div dangerouslySetInnerHTML={{
                __html: message.content.replace(/\n/g, '<br>')
              }} />
            </div>
          </div>

          {/* Offer Details Toggle */}
          <div className="text-center mb-8">
            <Button
              variant="outline"
              onClick={() => setShowOfferDetails(!showOfferDetails)}
              leftIcon={showOfferDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            >
              {showOfferDetails ? 'Ocultar Detalles' : 'Ver Detalles de la Oferta'}
            </Button>
          </div>

          {/* Offer Details */}
          {showOfferDetails && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card padding={false} className="border-2 border-success-200">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-success-100 rounded-lg">
                      <DollarSign className="w-5 h-5 text-success-600" />
                    </div>
                    <h3 className="font-bold text-success-900">Descuento</h3>
                  </div>
                  <p className="text-3xl font-bold text-success-600 mb-2">
                    {offerDetails.discountPercentage || 0}%
                  </p>
                  <p className="text-sm text-success-700">
                    Descuento aplicado sobre el monto total
                  </p>
                </div>
              </Card>

              <Card padding={false} className="border-2 border-info-200">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-info-100 rounded-lg">
                      <CreditCard className="w-5 h-5 text-info-600" />
                    </div>
                    <h3 className="font-bold text-info-900">Plan de Pago</h3>
                  </div>
                  <p className="text-xl font-bold text-info-600 mb-2">
                    {offerDetails.paymentPlan === 'monthly_3' ? '3 cuotas mensuales' :
                     offerDetails.paymentPlan === 'monthly_6' ? '6 cuotas mensuales' :
                     offerDetails.paymentPlan === 'monthly_12' ? '12 cuotas mensuales' :
                     'Pago único'}
                  </p>
                  <p className="text-sm text-info-700">
                    Facilita el pago de tu deuda
                  </p>
                </div>
              </Card>

              <Card padding={false} className="border-2 border-warning-200">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-warning-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-warning-600" />
                    </div>
                    <h3 className="font-bold text-warning-900">Validez</h3>
                  </div>
                  <p className="text-2xl font-bold text-warning-600 mb-2">
                    {offerDetails.validityDays || 30} días
                  </p>
                  <p className="text-sm text-warning-700">
                    Tiempo para aceptar esta oferta
                  </p>
                </div>
              </Card>

              <Card padding={false} className="border-2 border-secondary-200">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-secondary-100 rounded-lg">
                      <Lock className="w-5 h-5 text-secondary-600" />
                    </div>
                    <h3 className="font-bold text-secondary-900">Seguridad</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-secondary-700">Enlace seguro y único</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-secondary-700">Sin compartir datos personales</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-secondary-700">Verificado por NexuPay</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Special Conditions */}
          {offerDetails.specialConditions && (
            <Card className="mb-8 border-2 border-yellow-200 bg-yellow-50">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-bold text-yellow-900 mb-2">Condiciones Especiales</h3>
                  <p className="text-yellow-800">{offerDetails.specialConditions}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="gradient"
              size="lg"
              onClick={handleAcceptOffer}
              loading={accepting}
              className="flex-1 py-4 text-lg"
              leftIcon={<CheckCircle className="w-5 h-5" />}
            >
              {accepting ? 'Aceptando Oferta...' : 'Aceptar Oferta'}
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={handleRejectOffer}
              className="flex-1 py-4 text-lg border-2 hover:bg-red-50 hover:border-red-300"
              leftIcon={<XCircle className="w-5 h-5" />}
            >
              Rechazar Oferta
            </Button>
          </div>

          {/* Footer Note */}
          <div className="mt-8 text-center">
            <p className="text-sm text-secondary-600">
              Esta oferta es personalizada y exclusiva para ti. No compartas este enlace.
            </p>
            <p className="text-xs text-secondary-500 mt-2">
              Plataforma segura proporcionada por NexuPay • Todos los derechos reservados
            </p>
          </div>
        </Card>

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card padding={false} className="text-center">
            <div className="p-6">
              <Shield className="w-8 h-8 text-primary-600 mx-auto mb-3" />
              <h3 className="font-bold text-secondary-900 mb-2">Seguridad Garantizada</h3>
              <p className="text-sm text-secondary-600">
                Tus datos personales están protegidos. Solo ves el nombre real de la empresa.
              </p>
            </div>
          </Card>

          <Card padding={false} className="text-center">
            <div className="p-6">
              <Clock className="w-8 h-8 text-success-600 mx-auto mb-3" />
              <h3 className="font-bold text-secondary-900 mb-2">Proceso Rápido</h3>
              <p className="text-sm text-secondary-600">
                Acepta la oferta en segundos y comienza a resolver tu deuda inmediatamente.
              </p>
            </div>
          </Card>

          <Card padding={false} className="text-center">
            <div className="p-6">
              <CheckCircle className="w-8 h-8 text-info-600 mx-auto mb-3" />
              <h3 className="font-bold text-secondary-900 mb-2">Soporte Continuo</h3>
              <p className="text-sm text-secondary-600">
                Si tienes dudas, puedes contactar a NexuPay para asistencia.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SecureOfferPage;