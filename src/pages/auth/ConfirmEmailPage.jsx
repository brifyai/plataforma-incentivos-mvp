/**
 * Página de Confirmación de Email
 *
 * Maneja la confirmación de cuentas de usuario mediante tokens JWT
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, Button, LoadingSpinner } from '../../components/common';
import { CheckCircle, XCircle, Mail, ArrowRight } from 'lucide-react';
import { confirmEmail } from '../../services/authService';

const ConfirmEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const confirmUserEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Token de confirmación no encontrado. Verifica el enlace en tu email.');
        return;
      }

      try {
        const { user: confirmedUser, error } = await confirmEmail(token);

        if (error) {
          setStatus('error');
          setMessage(error);
        } else {
          setStatus('success');
          setUser(confirmedUser);
          setMessage('¡Tu cuenta ha sido confirmada exitosamente!');
        }
      } catch (error) {
        console.error('Error confirming email:', error);
        setStatus('error');
        setMessage('Error al confirmar tu email. El enlace puede haber expirado.');
      }
    };

    confirmUserEmail();
  }, [searchParams]);

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const handleGoToDashboard = () => {
    // Redirigir según el rol del usuario
    if (user?.user_metadata?.role === 'company') {
      navigate('/company/dashboard');
    } else {
      navigate('/debtor/dashboard');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md p-8 text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Confirmando tu cuenta...
          </h1>
          <p className="text-gray-600">
            Estamos verificando tu email. Esto tomará solo un momento.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md p-8 text-center">
        {/* Icono de estado */}
        <div className="mb-6">
          {status === 'success' ? (
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          )}
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {status === 'success' ? '¡Cuenta Confirmada!' : 'Error de Confirmación'}
        </h1>

        {/* Mensaje */}
        <p className="text-gray-600 mb-8">
          {message}
        </p>

        {/* Información adicional para éxito */}
        {status === 'success' && user && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <Mail className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-800">
                Email confirmado
              </span>
            </div>
            <p className="text-sm text-green-700">
              Bienvenido, {user.user_metadata?.full_name}!<br />
              Tu cuenta está ahora activa y puedes acceder a todos los servicios.
            </p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="space-y-3">
          {status === 'success' ? (
            <Button
              onClick={handleGoToDashboard}
              className="w-full"
              leftIcon={<ArrowRight className="w-4 h-4" />}
            >
              Ir al Dashboard
            </Button>
          ) : (
            <Button
              onClick={handleGoToLogin}
              variant="outline"
              className="w-full"
            >
              Volver al Login
            </Button>
          )}

          {status === 'error' && (
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">
                ¿Necesitas ayuda?
              </p>
              <Button
                variant="link"
                size="sm"
                onClick={() => navigate('/register')}
                className="text-blue-600 hover:text-blue-800"
              >
                Registrarse nuevamente
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            ¿Tienes problemas? Contacta a nuestro soporte técnico.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ConfirmEmailPage;