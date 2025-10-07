/**
 * Register Page - Página de Selección de Tipo de Registro
 *
 * Página principal de registro que redirige a formularios específicos
 */

import { Link, useNavigate } from 'react-router-dom';
import { Button, Card } from '../../components/common';
import { User, Building, ArrowRight, CheckCircle } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block hover:opacity-80 transition-opacity">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">N</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              NexuPay
            </h1>
            <p className="text-gray-600 text-lg">
              Gestiona tus deudas y recibe beneficios
            </p>
          </Link>
        </div>

        <Card className="shadow-2xl border-0 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <h2 className="text-2xl font-bold text-center mb-2">
              Crear Cuenta
            </h2>
            <p className="text-center text-blue-100">
              Elige el tipo de cuenta que mejor se adapte a tus necesidades
            </p>
          </div>

          {/* Opciones de registro */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Registro para Personas */}
              <div className="group">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-6 hover:border-blue-400 hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <User className="w-7 h-7 text-white" />
                    </div>
                    <ArrowRight className="w-6 h-6 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <h3 className="text-xl font-bold text-blue-900 mb-2">
                    Soy Persona
                  </h3>
                  <p className="text-blue-700 mb-4">
                    Gestiona tus finanzas personales, paga tus deudas y recibe incentivos por cumplir tus acuerdos.
                  </p>

                  <ul className="text-sm text-blue-800 space-y-2 mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                      <span>Seguimiento de deudas personales</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                      <span>Incentivos por pagos puntuales</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                      <span>Historial completo de transacciones</span>
                    </li>
                  </ul>

                  <Button
                    onClick={() => navigate('/registro/persona')}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl font-semibold"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Registrarme como Persona
                  </Button>
                </div>
              </div>

              {/* Registro para Empresas */}
              <div className="group">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-2xl p-6 hover:border-purple-400 hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Building className="w-7 h-7 text-white" />
                    </div>
                    <ArrowRight className="w-6 h-6 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <h3 className="text-xl font-bold text-purple-900 mb-2">
                    Soy Empresa
                  </h3>
                  <p className="text-purple-700 mb-4">
                    Gestiona tu cartera de deudas, accede a herramientas avanzadas y optimiza tus procesos de cobranza.
                  </p>

                  <ul className="text-sm text-purple-800 space-y-2 mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-purple-600" />
                      <span>Gestión completa de cartera</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-purple-600" />
                      <span>Herramientas de cobranza avanzadas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-purple-600" />
                      <span>Reportes y analytics detallados</span>
                    </li>
                  </ul>

                  <Button
                    onClick={() => navigate('/registro/empresa')}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 rounded-xl font-semibold"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Registrarme como Empresa
                  </Button>
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    ¿No sabes cuál elegir?
                  </p>
                  <p className="text-sm text-gray-700">
                    Si eres un particular con deudas personales, elige "Soy Persona".
                    Si representas a una empresa de cobranza o acreedor, elige "Soy Empresa".
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
