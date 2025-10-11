/**
 * Complete Registration Page
 *
 * Página para completar el registro de usuarios invitados por administradores
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Button, Input, LoadingSpinner } from '../../components/common';
import { validateInvitationToken, completeUserRegistration } from '../../services/databaseService';
import { sendWelcomeEmailDebtor, sendWelcomeEmailCompany } from '../../services/emailService';
import Swal from 'sweetalert2';
import {
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Lock,
  User,
  Mail,
  AlertTriangle
} from 'lucide-react';

const CompleteRegistrationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Token de invitación no válido');
      setLoading(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      setLoading(true);
      setError(null);

      const { valid, user: userData, error: validationError } = await validateInvitationToken(token);

      if (!valid) {
        setError(validationError || 'Token de invitación inválido o expirado');
        return;
      }

      setUser(userData);
    } catch (error) {
      console.error('Error validating token:', error);
      setError('Error al validar la invitación');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    // Validaciones
    if (password.length < 8) {
      await Swal.fire({
        icon: 'error',
        title: 'Contraseña muy corta',
        text: 'La contraseña debe tener al menos 8 caracteres',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    if (password !== confirmPassword) {
      await Swal.fire({
        icon: 'error',
        title: 'Contraseñas no coinciden',
        text: 'Por favor verifica que ambas contraseñas sean iguales',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    setSubmitting(true);
    try {
      const { success, user: updatedUser, error: completionError } = await completeUserRegistration(token, password);

      if (!success) {
        await Swal.fire({
          icon: 'error',
          title: 'Error al completar registro',
          text: completionError,
          confirmButtonText: 'Aceptar'
        });
        return;
      }

      // Enviar email de bienvenida
      try {
        if (updatedUser.role === 'debtor') {
          await sendWelcomeEmailDebtor({
            fullName: updatedUser.full_name,
            email: updatedUser.email
          });
        } else if (updatedUser.role === 'company') {
          await sendWelcomeEmailCompany({
            fullName: updatedUser.full_name,
            email: updatedUser.email,
            companyName: updatedUser.full_name // Simplificado
          });
        }
      } catch (emailError) {
        console.warn('Error sending welcome email:', emailError);
        // No fallar por error de email
      }

      await Swal.fire({
        icon: 'success',
        title: '¡Registro completado!',
        text: 'Tu cuenta ha sido activada exitosamente. Ya puedes iniciar sesión.',
        confirmButtonText: 'Ir al login'
      });

      navigate('/login');
    } catch (error) {
      console.error('Error completing registration:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error inesperado',
        text: 'Ha ocurrido un error al completar tu registro. Inténtalo nuevamente.',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <h2 className="text-xl font-semibold text-gray-700 mt-4">Validando invitación...</h2>
          <p className="text-gray-500 mt-2">Por favor espera un momento</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <div className="text-center">
            <div className="p-4 bg-red-100 rounded-2xl inline-block mb-4">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-red-900 mb-2">Invitación inválida</h2>
            <p className="text-red-700 mb-6">{error}</p>
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/login')}
                className="w-full"
              >
                Ir al login
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full"
              >
                Ir al inicio
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <div className="text-center mb-6">
          <div className="p-4 bg-green-100 rounded-2xl inline-block mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-green-900 mb-2">
            ¡Completa tu registro!
          </h1>
          <p className="text-green-700">
            Has sido invitado a unirte a NexuPay. Solo falta crear tu contraseña.
          </p>
        </div>

        {/* Información del usuario */}
        {user && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">{user.full_name}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-600" />
              <span className="text-blue-700">{user.email}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nueva contraseña *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Ingresa tu nueva contraseña"
                className="pl-10 pr-10"
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Mínimo 8 caracteres
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar contraseña *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                placeholder="Confirma tu nueva contraseña"
                className="pl-10 pr-10"
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-900 mb-1">Recomendaciones de seguridad:</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Usa al menos 8 caracteres</li>
                  <li>• Incluye letras mayúsculas y minúsculas</li>
                  <li>• Agrega números y símbolos</li>
                  <li>• No uses información personal</li>
                </ul>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            loading={submitting}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
            leftIcon={<CheckCircle className="w-4 h-4" />}
          >
            Completar registro
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Inicia sesión aquí
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default CompleteRegistrationPage;