/**
 * Componente reutilizable para el logo de autenticación
 * Elimina duplicación entre versiones móvil y desktop
 */

import { Link } from 'react-router-dom';

const AuthLogo = ({ variant = 'default', className = '' }) => {
  const isMobile = variant === 'mobile';

  const baseClasses = isMobile
    ? "inline-block hover:opacity-80 transition-opacity"
    : "inline-block mb-8 hover:opacity-80 transition-opacity";

  const logoClasses = isMobile
    ? "w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"
    : "w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-sm";

  const textClasses = isMobile
    ? "text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2"
    : "text-4xl font-bold mb-2";

  const subtitleClasses = isMobile
    ? "text-gray-600"
    : "text-blue-100 text-lg";

  return (
    <Link to="/" className={`${baseClasses} ${className}`}>
      <div className="flex items-center mb-4">
        <div className={logoClasses}>
          <span className="text-white font-bold text-2xl">N</span>
        </div>
      </div>
      <h1 className={textClasses}>
        NexuPay
      </h1>
      <p className={subtitleClasses}>
        Gestiona tus deudas y recibe beneficios
      </p>
    </Link>
  );
};

export default AuthLogo;