/**
 * Componente de formulario de login limpio y reutilizable
 * Contiene solo la lógica del formulario, sin layout ni decoración
 */

import { Link } from 'react-router-dom';
import { Card, Button } from '../common';
import { Mail, Lock, AlertCircle, Chrome, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useLogin } from '../../hooks/useLogin';
import { useOAuthErrors } from '../../hooks/useOAuthErrors';

const LoginForm = () => {
  const loginHook = useLogin();
  const oauthErrors = useOAuthErrors();

  // Combinar errores de OAuth y del formulario
  const displayError = oauthErrors.error || loginHook.error;

  return (
    <Card className="bg-gray-800/50 backdrop-blur-xl border border-gray-600/30 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 hover:opacity-10 transition-opacity duration-500"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
            ¡Bienvenido!
          </h2>
          <p className="text-blue-100 text-lg">
            Ingresa a tu cuenta para continuar
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
        <form onSubmit={loginHook.handleSubmit} className="space-y-6">
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
                value={loginHook.formData.email}
                onChange={(e) => loginHook.handleChange('email', e.target.value)}
                placeholder="tu@email.com"
                required
                disabled={loginHook.isLoading}
                className="w-full pl-12 pr-4 py-3 border border-gray-600/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700/50 text-white placeholder-gray-400 hover:bg-gray-700/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type={loginHook.showPassword ? "text" : "password"}
                value={loginHook.formData.password}
                onChange={(e) => loginHook.handleChange('password', e.target.value)}
                placeholder="••••••••"
                required
                disabled={loginHook.isLoading}
                className="w-full pl-12 pr-12 py-3 border border-gray-600/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700/50 text-white placeholder-gray-400 hover:bg-gray-700/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
              />
              <button
                type="button"
                onClick={loginHook.togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
                disabled={loginHook.isLoading}
              >
                {loginHook.showPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {displayError && (
            <div className="p-4 bg-red-900/50 border border-red-500/30 rounded-xl flex items-start gap-3 backdrop-blur-sm">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{displayError}</p>
            </div>
          )}

          {/* Opciones adicionales */}
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={loginHook.rememberMe}
                onChange={loginHook.toggleRememberMe}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={loginHook.isLoading}
              />
              <span className="ml-2 text-sm text-gray-300">
                Recordarme
              </span>
            </label>

            <Link
              to="/recuperar-contrasena"
              className="text-sm text-blue-400 hover:text-blue-300 font-medium hover:underline transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* Botones */}
          <div className="space-y-4">
            {/* Botón principal */}
            <Button
              type="submit"
              variant="gradient"
              fullWidth
              loading={loginHook.loading}
              disabled={loginHook.googleLoading}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              {loginHook.loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
            </Button>

            {/* Separador */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600/30" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-800/50 text-gray-400 font-medium backdrop-blur-sm">O</span>
              </div>
            </div>

            {/* Botón de Google */}
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={loginHook.handleGoogleLogin}
              loading={loginHook.googleLoading}
              leftIcon={<Chrome className="w-6 h-6" />}
              className="border-gray-600/30 bg-gray-700/50 text-white hover:bg-gray-700/70 py-3 rounded-xl font-medium backdrop-blur-sm transition-all duration-300"
              disabled={loginHook.loading}
            >
              Continuar con Google
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            ¿No tienes una cuenta?{' '}
            <Link
              to="/registro"
              className="font-semibold text-blue-400 hover:text-blue-300 hover:underline transition-colors"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </Card>
  );
};

export default LoginForm;