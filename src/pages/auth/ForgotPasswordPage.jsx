/**
 * Forgot Password Page
 *
 * Página para solicitar recuperación de contraseña
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Input } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import {
  Mail,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';

const ForgotPasswordPage = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🚀 ForgotPasswordPage: handleSubmit called with email:', email);

    if (!email.trim()) {
      setError('Por favor ingresa tu email');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Por favor ingresa un email válido');
      return;
    }

    setLoading(true);
    setError('');
    console.log('📤 ForgotPasswordPage: Starting password reset process...');

    try {
      console.log('🔗 ForgotPasswordPage: Calling resetPassword...');
      const result = await resetPassword(email);
      console.log('📨 ForgotPasswordPage: resetPassword result:', result);

      if (result.error) {
        console.error('❌ ForgotPasswordPage: Error from resetPassword:', result.error);
        setError(result.error);
      } else {
        console.log('✅ ForgotPasswordPage: Password reset email sent successfully');
        setSuccess(true);
      }
    } catch (err) {
      console.error('❌ ForgotPasswordPage: Exception in handleSubmit:', err);
      setError('Error al enviar el email. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl border-0 overflow-hidden">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                ¡Email enviado!
              </h1>

              <p className="text-gray-600 mb-6">
                Hemos enviado un enlace de recuperación a <strong>{email}</strong>.
                Revisa tu bandeja de entrada y sigue las instrucciones.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      ¿No encuentras el email?
                    </p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Revisa tu carpeta de spam</li>
                      <li>• El enlace expira en 1 hora</li>
                      <li>• Asegúrate de usar el email correcto</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Link to="/login">
                  <Button variant="gradient" fullWidth>
                    Volver al Login
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                  }}
                >
                  Enviar otro email
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/login" className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al login
          </Link>

          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Mail className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Recuperar Contraseña
          </h1>

          <p className="text-gray-600">
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        <Card className="shadow-2xl border-0 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              leftIcon={<Mail className="w-5 h-5" />}
              error={error}
              required
              disabled={loading}
              className="bg-gray-50 border-gray-200 focus:bg-white"
            />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            <Button
              type="submit"
              variant="gradient"
              fullWidth
              loading={loading}
              leftIcon={!loading ? <Mail className="w-4 h-4" /> : <Loader className="w-4 h-4 animate-spin" />}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {loading ? 'Enviando...' : 'Enviar Email de Recuperación'}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                ¿Recordaste tu contraseña?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </form>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            ¿Necesitas ayuda?{' '}
            <a href="mailto:soporte@aintelligence.cl" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
              Contacta al soporte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;