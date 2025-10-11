/**
 * Login Page - Página de Inicio de Sesión Refactorizada
 *
 * Componente orquestador simple que usa hooks y componentes reutilizables
 * Reducido de 379 líneas a ~30 líneas de código limpio
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/auth/AuthLayout';
import LoginForm from '../../components/auth/LoginForm';
import { Link } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, profile } = useAuth();

  // Redirección según rol cuando esté autenticado
  useEffect(() => {
    if (isAuthenticated && profile) {
      const role = profile.role;
      if (role === 'debtor') {
        navigate('/personas/dashboard');
      } else if (role === 'company') {
        navigate('/empresa/dashboard');
      } else if (role === 'god_mode') {
        navigate('/admin/dashboard');
      } else {
        navigate('/personas/dashboard'); // default
      }
    }
  }, [isAuthenticated, profile, navigate]);

  return (
    <AuthLayout>
      <LoginForm />

      {/* Términos y condiciones */}
      <p className="text-center text-xs text-gray-400 mt-6 px-4">
        Al iniciar sesión, aceptas nuestros{' '}
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

export default LoginPage;
