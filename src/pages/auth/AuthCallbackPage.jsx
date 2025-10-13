/**
 * Auth Callback Page
 *
 * Página que maneja el callback de OAuth después de la autenticación con Google
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { handleOAuthCallback, user, profile, loading } = useAuth();
  const [callbackProcessed, setCallbackProcessed] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      console.log('🚀 AuthCallbackPage: Iniciando handleCallback');
      try {
        console.log('🔄 AuthCallbackPage: Llamando handleOAuthCallback...');
        const { success, error } = await handleOAuthCallback();
        console.log('📊 AuthCallbackPage: Resultado handleOAuthCallback:', { success, error });

        if (success) {
          console.log('✅ AuthCallbackPage: Callback exitoso, marcando como procesado');
          setCallbackProcessed(true);
        } else {
          console.error('❌ AuthCallbackPage: Error en callback de OAuth:', error);
          // Mostrar error específico si es "Auth session missing!"
          if (error && error.includes('Auth session missing!')) {
            console.error('🔍 Error específico: Sesión de autenticación faltante');
            navigate('/login?error=auth_session_missing&details=' + encodeURIComponent('La sesión de autenticación no se pudo establecer. Por favor, intenta iniciar sesión nuevamente.'));
          } else {
            // Redirigir al login con error genérico
            navigate('/login?error=oauth_callback_failed&details=' + encodeURIComponent(error || 'Error desconocido'));
          }
        }
      } catch (error) {
        console.error('❌ AuthCallbackPage: Excepción en handleCallback:', error);
        console.error('Stack trace:', error.stack);
        navigate('/login?error=oauth_callback_error&details=' + encodeURIComponent(error.message || 'Error desconocido'));
      }
    };

    console.log('▶️ AuthCallbackPage: Ejecutando handleCallback');
    handleCallback();
  }, [handleOAuthCallback, navigate]);

  // Redirigir cuando el perfil esté disponible y tenga rol asignado
  useEffect(() => {
    if (callbackProcessed && !loading && user && profile && profile.role) {
      console.log('🔄 Redirigiendo usuario OAuth con rol:', profile.role);

      if (profile.role === 'god_mode') {
        console.log('👑 Redirigiendo a dashboard de administrador');
        navigate('/admin/dashboard');
      } else if (profile.role === 'debtor') {
        console.log('👤 Redirigiendo a dashboard de deudor');
        navigate('/personas/dashboard');
      } else if (profile.role === 'company') {
        console.log('🏢 Redirigiendo a dashboard de empresa');
        navigate('/empresa/dashboard');
      } else {
        console.warn('⚠️ Rol desconocido, redirigiendo al home:', profile.role);
        navigate('/');
      }
    } else if (callbackProcessed && !loading && user && profile && !profile.role) {
      console.warn('⚠️ Usuario autenticado pero sin rol asignado, esperando...');
    }
  }, [callbackProcessed, loading, user, profile, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <h2 className="text-xl font-semibold text-secondary-900 mt-4">
          Procesando tu inicio de sesión...
        </h2>
        <p className="text-secondary-600 mt-2">
          Estamos verificando tu cuenta de Google
        </p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;