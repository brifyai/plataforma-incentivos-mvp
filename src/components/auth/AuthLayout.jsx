/**
 * Layout reutilizable para páginas de autenticación
 * Proporciona la estructura visual consistente para login, registro, etc.
 */

import AuthLogo from './AuthLogo';
import { AuthBackgroundDecorations, AuthStatsCard, AuthBenefitsList } from '../ui/DecorativeElements';

const AuthLayout = ({ children, showBenefits = true }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex">
      {/* Panel Izquierdo - Información */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 p-12 flex-col justify-center relative overflow-hidden">
        <AuthBackgroundDecorations />

        <div className="relative z-10 text-white max-w-lg">
          <AuthLogo />

          {showBenefits && <AuthBenefitsList />}

          <AuthStatsCard />
        </div>
      </div>

      {/* Panel Derecho - Contenido (Formulario) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo móvil */}
          <div className="lg:hidden text-center mb-8">
            <AuthLogo variant="mobile" />
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;