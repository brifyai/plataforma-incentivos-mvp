/**
 * Register Page - Página de Selección de Tipo de Registro
 *
 * Página principal de registro que redirige a formularios específicos
 * Rediseñada con el mismo estilo que el login
 */

import { Link, useNavigate } from 'react-router-dom';
import { Button, Card } from '../../components/common';
import { User, Building, ArrowRight, CheckCircle, Chrome } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Modern Dark Background - igual que AuthLayout */}
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
          {/* Floating Elements */}
          <div className="absolute top-10 right-10 animate-float">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full opacity-20 blur-lg"></div>
          </div>
          <div className="absolute bottom-10 left-10 animate-float animation-delay-2000">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full opacity-20 blur-lg"></div>
          </div>

          <div className="relative z-10 text-white max-w-lg">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">N</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  NexuPay
                </h1>
                <p className="text-gray-400 text-sm">Gestiona tus deudas inteligentemente</p>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Únete a miles de usuarios que:</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-gray-300">Gestionan sus deudas de forma eficiente</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-gray-300">Reciben incentivos por pagos puntuales</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                  <span className="text-gray-300">Mejoran su historial crediticio</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-2xl border border-gray-600/30 backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold text-blue-400">10K+</div>
                  <div className="text-sm text-gray-400">Usuarios Activos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">$2M</div>
                  <div className="text-sm text-gray-400">Deudas Gestionadas</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Derecho - Contenido */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
          {/* Floating Elements */}
          <div className="absolute top-10 right-10 animate-float">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full opacity-20 blur-lg"></div>
          </div>
          <div className="absolute bottom-10 left-10 animate-float animation-delay-2000">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full opacity-20 blur-lg"></div>
          </div>
          
          <div className="w-full max-w-2xl relative z-10">
            {/* Logo móvil */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">N</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    NexuPay
                  </h1>
                  <p className="text-gray-400 text-sm">Gestiona tus deudas inteligentemente</p>
                </div>
              </div>
            </div>

            <Card className="bg-gray-800/50 backdrop-blur-xl border border-gray-600/30 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 hover:opacity-10 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                    Crear Cuenta
                  </h2>
                  <p className="text-blue-100 text-lg">
                    Elige el tipo de cuenta que mejor se adapte a tus necesidades
                  </p>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-8 relative">
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-400/30 rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-purple-400/30 rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-400/30 rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-purple-400/30 rounded-br-xl"></div>

                {/* Botón de Google */}
                <div className="mb-8">
                  <Button
                    variant="outline"
                    fullWidth
                    leftIcon={<Chrome className="w-6 h-6" />}
                    className="border-gray-600/30 bg-gray-700/50 text-white hover:bg-gray-700/70 py-3 rounded-xl font-medium backdrop-blur-sm transition-all duration-300"
                  >
                    Registrarse con Google
                  </Button>
                </div>

                {/* Separador */}
                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600/30" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-gray-800/50 text-gray-400 font-medium backdrop-blur-sm">O regístrate como</span>
                  </div>
                </div>

                {/* Opciones de registro */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Registro para Personas */}
                  <div className="group h-full">
                    <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border-2 border-blue-600/30 rounded-2xl p-6 hover:border-blue-400/60 hover:shadow-lg hover:bg-blue-900/40 transition-all duration-300 cursor-pointer backdrop-blur-sm h-full flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                          <User className="w-7 h-7 text-white" />
                        </div>
                        <ArrowRight className="w-6 h-6 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      <h3 className="text-xl font-bold text-blue-100 mb-2">
                        Soy Persona
                      </h3>
                      <p className="text-blue-300 mb-4 text-sm">
                        Gestiona tus finanzas personales, paga tus deudas y recibe incentivos.
                      </p>

                      <ul className="text-sm text-blue-200 space-y-2 mb-6 flex-grow">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-400" />
                          <span>Seguimiento de deudas personales</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-400" />
                          <span>Incentivos por pagos puntuales</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-400" />
                          <span>Historial completo de transacciones</span>
                        </li>
                      </ul>

                      <Button
                        onClick={() => navigate('/registro/persona')}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-sm"
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        <span className="truncate">Soy Persona</span>
                      </Button>
                    </div>
                  </div>

                  {/* Registro para Empresas */}
                  <div className="group h-full">
                    <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 border-2 border-purple-600/30 rounded-2xl p-6 hover:border-purple-400/60 hover:shadow-lg hover:bg-purple-900/40 transition-all duration-300 cursor-pointer backdrop-blur-sm h-full flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Building className="w-7 h-7 text-white" />
                        </div>
                        <ArrowRight className="w-6 h-6 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      <h3 className="text-xl font-bold text-purple-100 mb-2">
                        Soy Empresa
                      </h3>
                      <p className="text-purple-300 mb-4 text-sm">
                        Gestiona tu cartera de deudas y optimiza tus procesos de cobranza.
                      </p>

                      <ul className="text-sm text-purple-200 space-y-2 mb-6 flex-grow">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-purple-400" />
                          <span>Gestión completa de cartera</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-purple-400" />
                          <span>Herramientas de cobranza avanzadas</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-purple-400" />
                          <span>Reportes y analytics detallados</span>
                        </li>
                      </ul>

                      <Button
                        onClick={() => navigate('/registro/empresa')}
                        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-sm"
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        <span className="truncate">Soy Empresa</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="mt-8 p-6 bg-gradient-to-r from-gray-700/30 to-blue-700/30 rounded-xl border border-gray-600/30 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-200 mb-1">
                        ¿No sabes cuál elegir?
                      </p>
                      <p className="text-sm text-gray-300">
                        Si eres un particular con deudas personales, elige "Soy Persona".
                        Si representas a una empresa de cobranza o acreedor, elige "Soy Empresa".
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-6 bg-gray-700/30 border-t border-gray-600/30 text-center backdrop-blur-sm">
                <p className="text-sm text-gray-300">
                  ¿Ya tienes una cuenta?{' '}
                  <Link
                    to="/login"
                    className="font-semibold text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                  >
                    Inicia sesión aquí
                  </Link>
                </p>
              </div>
            </Card>

            {/* Términos y condiciones */}
            <p className="text-center text-xs text-gray-400 mt-6 px-4">
              Al registrarte, aceptas nuestros{' '}
              <Link to="/terminos-servicio" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">
                Términos de Servicio
              </Link>{' '}
              y{' '}
              <Link to="/privacy-policy" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">
                Política de Privacidad
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
