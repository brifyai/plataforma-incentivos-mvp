/**
 * Layout reutilizable para páginas de autenticación
 * Proporciona la estructura visual consistente para login, registro, etc.
 */

import AuthLogo from './AuthLogo';
import { AuthBackgroundDecorations, AuthStatsCard, AuthBenefitsList } from '../ui/DecorativeElements';

const AuthLayout = ({ children, showBenefits = true }) => {
  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Modern Dark Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
                            radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.2) 0%, transparent 50%)`
          }}></div>
        </div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl opacity-10 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500 rounded-full filter blur-3xl opacity-5 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="flex min-h-screen">
        {/* Panel Izquierdo - Información */}
        <div className="hidden lg:flex lg:w-1/2 bg-gray-800/50 backdrop-blur-xl border-r border-gray-600/30 p-12 flex-col justify-center relative overflow-hidden">
          <AuthBackgroundDecorations />

          <div className="relative z-10 text-white max-w-lg">
            <AuthLogo />

            {showBenefits && <AuthBenefitsList />}

            <AuthStatsCard />
          </div>
        </div>

        {/* Panel Derecho - Contenido (Formulario) */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
          {/* Floating Elements */}
          <div className="absolute top-10 right-10 animate-float">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full opacity-20 blur-lg"></div>
          </div>
          <div className="absolute bottom-10 left-10 animate-float animation-delay-2000">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full opacity-20 blur-lg"></div>
          </div>
          
          <div className="w-full max-w-md relative z-10">
            {/* Logo móvil */}
            <div className="lg:hidden text-center mb-8">
              <AuthLogo variant="mobile" />
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;