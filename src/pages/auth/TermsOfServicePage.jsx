/**
 * Terms of Service Page
 *
 * Página que muestra los términos de servicio con diseño moderno
 */

import { Card, Button } from '../../components/common';
import { ArrowLeft, FileText, Users, CreditCard, Shield, AlertTriangle, Scale } from 'lucide-react';

const TermsOfServicePage = () => {
  const handleGoBack = () => {
    window.history.back();
  };

  const sections = [
    { id: 'general', title: 'Información General', icon: FileText },
    { id: 'uso', title: 'Condiciones de Uso', icon: Users },
    { id: 'servicios', title: 'Servicios Ofrecidos', icon: Shield },
    { id: 'datos', title: 'Protección de Datos', icon: Shield },
    { id: 'legislacion', title: 'Legislación Aplicable', icon: Scale },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoBack}
              className="hover:scale-105 transition-all shadow-soft"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Volver
            </Button>
            <div>
              <h1 className="text-4xl font-display font-bold text-slate-900">
                📋 Términos de Servicio
              </h1>
              <p className="text-slate-600 mt-2 text-lg">
                Última actualización: 3 de octubre de 2025
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Table of Contents - Sidebar */}
          <div className="lg:col-span-1">
            <Card variant="elevated" className="sticky top-8 p-6 shadow-soft">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Contenido
              </h3>
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-all text-sm text-slate-600 hover:shadow-soft"
                    >
                      <Icon className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">{section.title}</span>
                    </a>
                  );
                })}
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">

            {/* Información General */}
            <Card variant="elevated" className="p-6" id="general">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">1. Información General</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">1.1 Definiciones</h3>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p><strong>Plataforma:</strong> Sistema digital de incentivos para acuerdos de pago.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p><strong>Usuario Deudor:</strong> Persona natural que registra sus deudas.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p><strong>Empresa Acreedora:</strong> Persona jurídica que gestiona cobros.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p><strong>Incentivo:</strong> Comisión por acuerdos exitosos.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">1.2 Objeto del Servicio</h3>
                  <p className="text-slate-700 leading-relaxed">
                    Esta plataforma facilita la negociación de deudas entre personas naturales y empresas,
                    ofreciendo incentivos económicos a los deudores que completen acuerdos de pago exitosos.
                  </p>
                </div>
              </div>
            </Card>

            {/* Condiciones de Uso */}
            <Card variant="elevated" className="p-6" id="uso">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">2. Condiciones de Uso</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">👤 Usuarios Deudores</h3>
                  <ul className="space-y-2 text-slate-700">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>Ser mayor de 18 años</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>RUT válido</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>Información veraz</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>Confidencialidad de credenciales</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">🏢 Empresas Acreedoras</h3>
                  <ul className="space-y-2 text-slate-700">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>Constitución legal en Chile</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>Autorización de cobranza (si aplica)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>Información actualizada</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>Cumplimiento normativo</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">🚫 Prohibiciones</h4>
                <p className="text-red-700 text-sm">
                  Queda expresamente prohibido utilizar la plataforma para fines ilícitos,
                  proporcionar información falsa, vulnerar la seguridad del sistema,
                  violar derechos de terceros o usar bots automatizados.
                </p>
              </div>
            </Card>

            {/* Servicios Ofrecidos */}
            <Card variant="elevated" className="p-6" id="servicios">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">3. Servicios Ofrecidos</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">💰 Para Deudores</h3>
                  <ul className="space-y-2 text-blue-800">
                    <li>• Registro y gestión de deudas</li>
                    <li>• Acceso a ofertas de negociación</li>
                    <li>• Simulador de ganancias</li>
                    <li>• Sistema de pagos integrado</li>
                    <li>• Billetera virtual</li>
                    <li>• Centro de mensajes</li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900 mb-3">📊 Para Empresas</h3>
                  <ul className="space-y-2 text-green-800">
                    <li>• Gestión de cartera</li>
                    <li>• Creación de ofertas</li>
                    <li>• Comunicación directa</li>
                    <li>• Procesamiento de pagos</li>
                    <li>• Reportes y estadísticas</li>
                    <li>• Integración CRM</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">🎯 Sistema de Incentivos</h4>
                <p className="text-yellow-700">
                  Los deudores reciben hasta el <strong>50% de comisión</strong> por acuerdos exitosos,
                  calculado sobre el monto acordado y acreditado tras verificación del pago.
                </p>
              </div>
            </Card>

            {/* Protección de Datos */}
            <Card variant="elevated" className="p-6" id="datos">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Shield className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">4. Protección de Datos</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-indigo-900 mb-2">🔒 Tratamiento de Datos</h3>
                  <p className="text-indigo-800">
                    Los datos se tratan conforme a la <strong>Ley 19.628</strong> sobre Protección de Datos Personales,
                    obteniendo consentimiento expreso y utilizándolos únicamente para los fines descritos.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Seguridad</h4>
                    <ul className="text-green-800 text-sm space-y-1">
                      <li>• Encriptación TLS 1.3</li>
                      <li>• Datos encriptados en reposo</li>
                      <li>• Control de acceso por roles</li>
                      <li>• Logs de auditoría</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Derechos ARCO+</h4>
                    <ul className="text-blue-800 text-sm space-y-1">
                      <li>• Acceso a datos personales</li>
                      <li>• Rectificación de información</li>
                      <li>• Cancelación/supresión</li>
                      <li>• Oposición al tratamiento</li>
                      <li>• Portabilidad de datos</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>

            {/* Legislación */}
            <Card variant="elevated" className="p-6" id="legislacion">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Scale className="w-6 h-6 text-slate-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">5. Legislación Aplicable</h2>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">📜 Leyes Aplicables</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                    <span>Ley 19.628 - Protección de Datos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                    <span>Ley 19.496 - Derechos del Consumidor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                    <span>Ley 19.799 - Servicios Financieros</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                    <span>Código Civil de Chile</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                    <span>Normas de Comercio Electrónico</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                    <span>Regulaciones de la CMF</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">⚖️ Jurisdicción</h4>
                <p className="text-blue-800 text-sm">
                  Tribunales de Santiago de Chile tendrán jurisdicción exclusiva.
                  Las controversias se resolverán mediante mediación antes de litigio.
                </p>
              </div>
            </Card>

            {/* Contacto */}
            <Card variant="elevated" className="p-6 bg-gradient-to-r from-slate-50 to-slate-100">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">📞 Contacto</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-lg shadow-soft">
                    <div className="font-semibold text-slate-900">Email Legal</div>
                    <div className="text-slate-600">legal@plataformaincentivos.cl</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-soft">
                    <div className="font-semibold text-slate-900">Teléfono</div>
                    <div className="text-slate-600">+56 2 1234 5678</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-soft">
                    <div className="font-semibold text-slate-900">Dirección</div>
                    <div className="text-slate-600">Santiago, Chile</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Aceptación */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-2xl text-center shadow-strong">
              <h3 className="text-xl font-bold mb-2">✅ Aceptación de Términos</h3>
              <p className="text-blue-100">
                Al utilizar esta plataforma, confirmas que has leído, entendido y aceptado estos términos de servicio.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;