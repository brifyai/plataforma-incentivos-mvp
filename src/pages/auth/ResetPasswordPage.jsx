/**
 * Reset Password Page
 *
 * Página para restablecer la contraseña usando el token del email
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Button, Input } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader,
  ArrowLeft
} from 'lucide-react';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPasswordToken } = useAuth();

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(null);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      // Aquí podrías validar el token con el backend
      setTokenValid(true);
    } else {
      setTokenValid(false);
      setError('Token de recuperación no válido o expirado.');
    }
  }, [searchParams]);

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return 'La contraseña debe contener al menos una letra minúscula, una mayúscula y un número';
    }
    // Permitir caracteres especiales opcionalmente
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword.trim()) {
      setError('Por favor ingresa tu nueva contraseña');
      return;
    }

    if (!confirmPassword.trim()) {
      setError('Por favor confirma tu nueva contraseña');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await resetPasswordToken(token, newPassword);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError('Error al actualizar la contraseña. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl border-0 overflow-hidden">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Enlace Inválido
              </h1>

              <p className="text-gray-600 mb-6">
                El enlace de recuperación de contraseña no es válido o ha expirado.
                Solicita un nuevo enlace desde la página de login.
              </p>

              <Button
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
              >
                Ir al Login
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl border-0 overflow-hidden">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                ¡Contraseña Actualizada!
              </h1>

              <p className="text-gray-600 mb-6">
                Tu contraseña ha sido cambiada exitosamente.
                Serás redirigido al login en unos segundos...
              </p>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div className="bg-green-600 h-2 rounded-full animate-pulse"></div>
              </div>

              <Button
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                Ir al Login Ahora
              </Button>
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
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Nueva Contraseña
          </h1>

          <p className="text-gray-600">
            Ingresa tu nueva contraseña segura
          </p>
        </div>

        <Card className="shadow-2xl border-0 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="relative">
              <Input
                label="Nueva Contraseña"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                leftIcon={<Lock className="w-5 h-5" />}
                placeholder="••••••••"
                error={error}
                required
                disabled={loading}
                className="bg-gray-50 border-gray-200 focus:bg-white pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirmar Nueva Contraseña"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-5 h-5" />}
                placeholder="••••••••"
                required
                disabled={loading}
                className="bg-gray-50 border-gray-200 focus:bg-white pr-12"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Requisitos de contraseña */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Requisitos de contraseña:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Mínimo 8 caracteres</li>
                <li>• Al menos una letra minúscula</li>
                <li>• Al menos una letra mayúscula</li>
                <li>• Al menos un número</li>
                <li>• Caracteres especiales permitidos ($@!%*#?&)</li>
              </ul>
            </div>

            <Button
              type="submit"
              variant="gradient"
              fullWidth
              loading={loading}
              leftIcon={!loading ? <Lock className="w-4 h-4" /> : <Loader className="w-4 h-4 animate-spin" />}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm text-gray-600 hover:text-gray-800 font-medium hover:underline"
              >
                ← Volver al login
              </button>
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

export default ResetPasswordPage;