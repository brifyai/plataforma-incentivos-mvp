/**
 * Forgot Password Page - Rediseñada con AuthLayout
 *
 * Página para solicitar recuperación de contraseña con el mismo diseño que el login
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/auth/AuthLayout';
import {
  Mail,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader,
  ArrowRight
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
      <AuthLayout>
        <Card className="bg-gray-800/50 backdrop-blur-xl border border-gray-600/30 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 hover:opacity-10 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
                ¡Email Enviado!
              </h2>
              <p className="text-green-100 text-lg">
                Revisa tu bandeja de entrada
              </p>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-8 relative">
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-green-400/30 rounded-tl-xl"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-emerald-400/30 rounded-tr-xl"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-green-400/30 rounded-bl-xl"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-400/30 rounded-br-xl"></div>

            <div className="text-center space-y-6">
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-gray-200 mb-2">
                  Hemos enviado un enlace de recuperación a:
                </p>
                <p className="text-white font-semibold text-lg">{email}</p>
              </div>

              <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-yellow-200 mb-2">
                      ¿No encuentras el email?
                    </p>
                    <ul className="text-sm text-yellow-300 space-y-1">
                      <li>• Revisa tu carpeta de spam</li>
                      <li>• El enlace expira en 1 hora</li>
                      <li>• Asegúrate de usar el email correcto</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <Link to="/login">
                  <Button
                    variant="gradient"
                    fullWidth
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                    rightIcon={<ArrowRight className="w-5 h-5" />}
                  >
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
                  className="border-gray-600/30 bg-gray-700/50 text-white hover:bg-gray-700/70 py-3 rounded-xl font-medium backdrop-blur-sm transition-all duration-300"
                >
                  Enviar otro email
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6 px-4">
          ¿Necesitas ayuda?{' '}
          <a href="mailto:soporte@aintelligence.cl" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">
            Contacta al soporte
          </a>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card className="bg-gray-800/50 backdrop-blur-xl border border-gray-600/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 hover:opacity-10 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Recuperar Contraseña
            </h2>
            <p className="text-blue-100 text-lg">
              Te enviaremos un enlace para restablecerla
            </p>
          </div>
        </div>

        {/* Formulario */}
        <div className="p-8 relative">
          {/* Corner Accents */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-400/30 rounded-tl-xl"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-purple-400/30 rounded-tr-xl"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-400/30 rounded-bl-xl"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-purple-400/30 rounded-br-xl"></div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Email */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3 border border-gray-600/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700/50 text-white placeholder-gray-400 hover:bg-gray-700/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-900/50 border border-red-500/30 rounded-xl flex items-start gap-3 backdrop-blur-sm">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {/* Botón */}
            <Button
              type="submit"
              variant="gradient"
              fullWidth
              loading={loading}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              rightIcon={!loading ? <ArrowRight className="w-5 h-5" /> : <Loader className="w-5 h-5 animate-spin" />}
            >
              {loading ? 'Enviando...' : 'Enviar Email de Recuperación'}
            </Button>

            {/* Footer del formulario */}
            <div className="text-center">
              <p className="text-sm text-gray-400">
                ¿Recordaste tu contraseña?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                >
                  Inicia sesión
                </Link>
              </p>
            </div>
          </form>
        </div>
      </Card>

      {/* Footer */}
      <p className="text-center text-xs text-gray-400 mt-6 px-4">
        Al recuperar tu contraseña, aceptas nuestros{' '}
        <Link to="/terminos-servicio" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">
          Términos de Servicio
        </Link>{' '}
        y{' '}
        <Link to="/privacy-policy" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">
          Política de Privacidad
        </Link>
      </p>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;