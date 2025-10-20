/**
 * Terms of Service Page - NexuPay Future Finance
 * Página de términos y condiciones con diseño moderno y profesional
 */

import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { ArrowLeft, FileText, Users, CreditCard, Shield, AlertTriangle, Scale, Mail, Phone, MapPin } from 'lucide-react';

const TerminosServicioPage = () => {
  // Asegurar que la página siempre se muestre desde arriba
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const sections = [
    { id: 'general', title: 'Información General', icon: FileText },
    { id: 'uso', title: 'Condiciones de Uso', icon: Users },
    { id: 'servicios', title: 'Servicios Ofrecidos', icon: Shield },
    { id: 'datos', title: 'Protección de Datos', icon: Shield },
    { id: 'legislacion', title: 'Legislación Aplicable', icon: Scale },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-900">NexuPay</span>
                  <span className="text-xs text-gray-500 block -mt-1">Future Finance</span>
                </div>
              </Link>
            </div>
            <Link
              to="/"
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            📋 Términos de Servicio
          </h1>
          <p className="text-xl text-gray-600">
            Última actualización: 10 de octubre de 2025
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Table of Contents - Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-24 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
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
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-all text-sm text-gray-600"
                    >
                      <Icon className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">{section.title}</span>
                    </a>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">

            {/* Información General */}
            <section className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm" id="general">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">1. Información General</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">1.1 Definiciones</h3>
                  <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <strong className="text-gray-900">Plataforma:</strong>
                        <p className="text-gray-700 mt-1">Sistema digital de incentivos para acuerdos de pago que conecta deudores con empresas acreedoras.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <strong className="text-gray-900">Usuario Deudor:</strong>
                        <p className="text-gray-700 mt-1">Persona natural que registra sus deudas en la plataforma para negociar acuerdos de pago.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <strong className="text-gray-900">Empresa Acreedora:</strong>
                        <p className="text-gray-700 mt-1">Persona jurídica que gestiona cobros y ofrece acuerdos de pago a través de la plataforma.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <strong className="text-gray-900">Incentivo:</strong>
                        <p className="text-gray-700 mt-1">Comisión económica que recibe el deudor por completar acuerdos de pago exitosos (hasta el 50%).</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">1.2 Objeto del Servicio</h3>
                  <p className="text-gray-700 leading-relaxed">
                    NexuPay es una plataforma tecnológica que facilita la negociación de deudas entre personas naturales y empresas,
                    ofreciendo incentivos económicos a los deudores que completen acuerdos de pago exitosos. La plataforma actúa como
                    intermediario digital, proporcionando herramientas de comunicación, procesamiento de pagos y gestión de incentivos.
                  </p>
                </div>
              </div>
            </section>

            {/* Condiciones de Uso */}
            <section className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm" id="uso">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">2. Condiciones de Uso</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">👤 Usuarios Deudores</h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>Ser mayor de 18 años y tener capacidad legal para contratar</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>Proporcionar RUT válido y información veraz</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>Mantener confidencialidad de credenciales de acceso</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>Aceptar los términos y condiciones del servicio</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">🏢 Empresas Acreedoras</h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>Constitución legal vigente en Chile</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>Autorización para realizar cobranzas (si aplica)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>Mantener información actualizada y veraz</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>Cumplir con la normativa chilena aplicable</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-6 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Prohibiciones
                </h4>
                <p className="text-red-700">
                  Queda expresamente prohibido utilizar la plataforma para fines ilícitos,
                  proporcionar información falsa o engañosa, vulnerar la seguridad del sistema,
                  violar derechos de terceros, utilizar bots automatizados sin autorización,
                  o realizar cualquier actividad que contravenga la legislación chilena.
                </p>
              </div>
            </section>

            {/* Servicios Ofrecidos */}
            <section className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm" id="servicios">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">3. Servicios Ofrecidos</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">💰 Para Deudores</h3>
                  <ul className="space-y-2 text-blue-800">
                    <li>• Registro y gestión integral de deudas</li>
                    <li>• Acceso a ofertas personalizadas de negociación</li>
                    <li>• Simulador de ganancias por incentivos</li>
                    <li>• Sistema de pagos seguro e integrado</li>
                    <li>• Billetera virtual para gestionar comisiones</li>
                    <li>• Centro de mensajes directo con empresas</li>
                    <li>• Historial completo de transacciones</li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900 mb-4">📊 Para Empresas</h3>
                  <ul className="space-y-2 text-green-800">
                    <li>• Gestión centralizada de cartera de deudas</li>
                    <li>• Creación de ofertas de negociación flexibles</li>
                    <li>• Comunicación directa con deudores</li>
                    <li>• Procesamiento automatizado de pagos</li>
                    <li>• Reportes detallados y estadísticas en tiempo real</li>
                    <li>• Integración con sistemas CRM existentes</li>
                    <li>• Herramientas de segmentación y análisis</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Sistema de Incentivos
                </h4>
                <p className="text-yellow-700">
                  Los deudores reciben hasta el <strong>50% de comisión</strong> por acuerdos exitosos,
                  calculado sobre el monto acordado y acreditado automáticamente tras verificación del pago.
                  Este incentivo motiva la resolución voluntaria de deudas y beneficia tanto al deudor como a la empresa acreedora.
                </p>
              </div>
            </section>

            {/* Protección de Datos */}
            <section className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm" id="datos">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <Shield className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">4. Protección de Datos</h2>
              </div>

              <div className="space-y-6">
                <div className="bg-indigo-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Tratamiento de Datos
                  </h3>
                  <p className="text-indigo-800">
                    Los datos personales se tratan conforme a la <strong>Ley 19.628</strong> sobre Protección de Datos Personales
                    y su normativa complementaria. Obtenemos consentimiento expreso para el tratamiento de datos
                    y los utilizamos únicamente para los fines descritos en estos términos, implementando
                    medidas técnicas y organizativas adecuadas para garantizar su seguridad.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-green-50 p-6 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Seguridad
                    </h4>
                    <ul className="text-green-800 text-sm space-y-2">
                      <li>• Encriptación TLS 1.3 en todas las comunicaciones</li>
                      <li>• Datos encriptados en reposo con AES-256</li>
                      <li>• Control de acceso basado en roles y permisos</li>
                      <li>• Logs de auditoría y monitoreo continuo</li>
                      <li>• Autenticación de dos factores (2FA)</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Derechos ARCO+
                    </h4>
                    <ul className="text-blue-800 text-sm space-y-2">
                      <li>• Acceso a datos personales</li>
                      <li>• Rectificación de información inexacta</li>
                      <li>• Cancelación y supresión de datos</li>
                      <li>• Oposición al tratamiento de datos</li>
                      <li>• Portabilidad de datos a otros servicios</li>
                      <li>• Información sobre tratamiento de datos</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Legislación */}
            <section className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm" id="legislacion">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <Scale className="w-6 h-6 text-slate-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">5. Legislación Aplicable</h2>
              </div>

              <div className="bg-slate-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Leyes y Normativas Aplicables
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                    <span className="text-gray-700">Ley 19.628 - Protección de Datos Personales</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                    <span className="text-gray-700">Ley 19.496 - Derechos del Consumidor</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                    <span className="text-gray-700">Ley 19.799 - Servicios Financieros</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                    <span className="text-gray-700">Código Civil de Chile</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                    <span className="text-gray-700">Ley 19.925 - Normas sobre Comercio Electrónico</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                    <span className="text-gray-700">Regulaciones de la Comisión para el Mercado Financiero (CMF)</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Scale className="w-5 h-5" />
                  Jurisdicción y Resolución de Controversias
                </h4>
                <p className="text-blue-800 text-sm">
                  Para todos los efectos legales, los tribunales de Santiago de Chile tendrán jurisdicción exclusiva.
                  Las controversias que surjan entre las partes se resolverán preferentemente mediante mediación
                  o arbitraje, antes de recurrir a litigio judicial, en conformidad con la normativa chilena.
                </p>
              </div>
            </section>

            {/* Contacto */}
            <section className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">📞 Contacto Legal</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <Mail className="w-6 h-6 text-blue-600 mx-auto mb-3" />
                    <div className="font-semibold text-gray-900">Email Legal</div>
                    <div className="text-gray-600">legal@nexupay.cl</div>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <Phone className="w-6 h-6 text-green-600 mx-auto mb-3" />
                    <div className="font-semibold text-gray-900">Teléfono</div>
                    <div className="text-gray-600">+56 2 1234 5678</div>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <MapPin className="w-6 h-6 text-purple-600 mx-auto mb-3" />
                    <div className="font-semibold text-gray-900">Dirección</div>
                    <div className="text-gray-600">Santiago, Chile</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Aceptación */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8 rounded-2xl text-center shadow-lg">
              <h3 className="text-xl font-bold mb-3">✅ Aceptación de Términos</h3>
              <p className="text-blue-100">
                Al utilizar esta plataforma NexuPay, confirmas que has leído, entendido y aceptado estos términos y condiciones.
                El uso continuo del servicio constituye aceptación plena e incondicional de los mismos.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminosServicioPage;