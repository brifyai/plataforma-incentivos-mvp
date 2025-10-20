/**
 * Privacy Policy Page
 *
 * Página que muestra la política de privacidad con diseño moderno
 */

import { Card, Button } from '../../components/common';
import { ArrowLeft, Shield, Eye, Lock, Users, Database, FileText } from 'lucide-react';

const PrivacyPolicyPage = () => {
  const handleGoBack = () => {
    window.history.back();
  };

  const sections = [
    { id: 'general', title: 'Información General', icon: FileText },
    { id: 'datos', title: 'Datos Recopilados', icon: Database },
    { id: 'finalidades', title: 'Finalidades del Tratamiento', icon: Eye },
    { id: 'base', title: 'Base Jurídica', icon: Shield },
    { id: 'destinatarios', title: 'Destinatarios', icon: Users },
    { id: 'derechos', title: 'Derechos de los Titulares', icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
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
                🔒 Política de Privacidad
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
                <FileText className="w-5 h-5 text-indigo-600" />
                Contenido
              </h3>
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-all text-sm text-slate-600 hover:shadow-soft"
                    >
                      <Icon className="w-4 h-4 text-indigo-500" />
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
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <FileText className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">1. Información General</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-indigo-900 mb-2">🏢 Responsable del Tratamiento</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-indigo-800">
                    <div>
                      <strong>Nombre:</strong> [Nombre de la Empresa Operadora]<br/>
                      <strong>RUT:</strong> [RUT de la empresa]<br/>
                      <strong>Domicilio:</strong> [Dirección en Santiago, Chile]
                    </div>
                    <div>
                      <strong>Email:</strong> privacidad@plataformaincentivos.cl<br/>
                      <strong>Teléfono:</strong> +56 2 1234 5678
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">1.2 Definiciones</h3>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p><strong>Datos Personales:</strong> Cualquier información relativa a persona natural identificada o identificable.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p><strong>Tratamiento:</strong> Operaciones realizadas sobre datos personales.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p><strong>Titular:</strong> Persona natural cuyos datos son tratados.</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Datos Recopilados */}
            <Card variant="elevated" className="p-6" id="datos">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Database className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">2. Datos Personales Recopilados</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">👤 Usuarios Deudores</h3>
                  <div className="space-y-2 text-blue-800 text-sm">
                    <div><strong>Identificación:</strong> Nombres, RUT, fecha nacimiento, dirección, teléfono, email</div>
                    <div><strong>Financieros:</strong> Información de deudas, historial pagos, datos bancarios</div>
                    <div><strong>Uso:</strong> IP, dispositivo, navegación, acciones realizadas</div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900 mb-3">🏢 Empresas Acreedoras</h3>
                  <div className="space-y-2 text-green-800 text-sm">
                    <div><strong>Jurídicos:</strong> Razón social, RUT, representante legal</div>
                    <div><strong>Operacionales:</strong> Empleados autorizados, configuración API</div>
                    <div><strong>Transaccionales:</strong> Historial de operaciones</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-semibold text-orange-800 mb-2">🔐 Datos Sensibles</h4>
                <p className="text-orange-700 text-sm">
                  Información biométrica (huellas dactilares, reconocimiento facial) para validación de identidad,
                  e información de salud solo cuando sea relevante para acuerdos específicos.
                </p>
              </div>
            </Card>

            {/* Finalidades del Tratamiento */}
            <Card variant="elevated" className="p-6" id="finalidades">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Eye className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">3. Finalidades del Tratamiento</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">💰 Para Deudores</h3>
                  <ul className="space-y-2 text-slate-700">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>Verificar identidad (Clave Única, biometría)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>Facilitar negociación de deudas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>Procesar pagos y transferencias</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>Gestionar billetera virtual</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>Enviar notificaciones</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">📊 Para Empresas</h3>
                  <ul className="space-y-2 text-slate-700">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>Verificar personalidad jurídica</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>Gestionar comunicación con deudores</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>Procesar pagos y comisiones</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>Generar reportes y estadísticas</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-2">🎯 Finalidades Secundarias</h4>
                <p className="text-purple-700 text-sm">
                  Mejorar la plataforma, prevenir fraudes, cumplir obligaciones legales y realizar análisis estadísticos anonimizados.
                </p>
              </div>
            </Card>

            {/* Base Jurídica */}
            <Card variant="elevated" className="p-6" id="base">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Shield className="w-6 h-6 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">4. Base Jurídica del Tratamiento</h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">✅ Consentimiento</h4>
                    <ul className="text-green-800 text-sm space-y-1">
                      <li>• Obtenido expresa y previamente</li>
                      <li>• Puede ser revocado en cualquier momento</li>
                      <li>• Consentimiento específico por finalidad</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">⚖️ Interés Legítimo</h4>
                    <ul className="text-blue-800 text-sm space-y-1">
                      <li>• Mejorar servicios y seguridad</li>
                      <li>• Prevenir fraudes</li>
                      <li>• Mantener registros comerciales</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-900 mb-2">📜 Obligaciones Legales</h4>
                  <p className="text-red-800 text-sm">
                    Cumplimiento de la <strong>Ley 19.628</strong>, <strong>Ley 19.799</strong> sobre Servicios Financieros,
                    normativas de la CMF y otras obligaciones tributarias y contables.
                  </p>
                </div>
              </div>
            </Card>

            {/* Destinatarios */}
            <Card variant="elevated" className="p-6" id="destinatarios">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <Users className="w-6 h-6 text-teal-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">5. Destinatarios de los Datos</h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">🏢 Internos</h4>
                    <ul className="text-slate-700 text-sm space-y-1">
                      <li>• Personal autorizado de la empresa</li>
                      <li>• Sistemas internos de procesamiento</li>
                      <li>• Equipos de soporte al cliente</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">🔗 Externos</h4>
                    <ul className="text-slate-700 text-sm space-y-1">
                      <li>• MercadoPago y procesadores de pago</li>
                      <li>• Instituciones bancarias</li>
                      <li>• Proveedores de hosting (Supabase)</li>
                      <li>• Servicios de mensajería</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-indigo-900 mb-2">🌍 Transferencias Internacionales</h4>
                  <p className="text-indigo-800 text-sm">
                    Los datos pueden transferirse a servidores en Estados Unidos (Supabase) con garantías adecuadas
                    según estándares internacionales y cumplimiento con Privacy Shield.
                  </p>
                </div>
              </div>
            </Card>

            {/* Derechos de los Titulares */}
            <Card variant="elevated" className="p-6" id="derechos">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Lock className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">6. Derechos de los Titulares</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">👁️ Acceso</h4>
                    <p className="text-blue-800 text-sm">
                      Solicitar información sobre datos tratados, obtener copia en formato legible y conocer finalidades.
                    </p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">✏️ Rectificación</h4>
                    <p className="text-green-800 text-sm">
                      Corregir datos inexactos o incompletos, actualizar información desactualizada.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-900 mb-2">🗑️ Cancelación</h4>
                    <p className="text-red-800 text-sm">
                      Solicitar eliminación de datos personales, excepto obligaciones legales de conservación.
                    </p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">🚫 Oposición</h4>
                    <p className="text-purple-800 text-sm">
                      Oponerse al tratamiento para fines específicos, negarse a comunicaciones comerciales.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
                <h4 className="font-semibold text-indigo-900 mb-2">📤 Portabilidad</h4>
                <p className="text-indigo-800 text-sm">
                  Obtener datos en formato estructurado, transferir a otros responsables y facilitar portabilidad según normativas.
                </p>
              </div>
            </Card>

            {/* Medidas de Seguridad */}
            <Card variant="elevated" className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Shield className="w-6 h-6 text-slate-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">7. Medidas de Seguridad</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <h4 className="font-semibold text-green-900 mb-2">🔐 Técnicas</h4>
                  <ul className="text-green-800 text-sm space-y-1">
                    <li>• TLS 1.3 en tránsito</li>
                    <li>• AES-256 en reposo</li>
                    <li>• Autenticación multifactor</li>
                    <li>• Control de acceso por roles</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <h4 className="font-semibold text-blue-900 mb-2">👥 Administrativas</h4>
                  <ul className="text-blue-800 text-sm space-y-1">
                    <li>• Políticas de seguridad</li>
                    <li>• Capacitación del personal</li>
                    <li>• Evaluaciones de riesgo</li>
                    <li>• Planes de respuesta</li>
                  </ul>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <h4 className="font-semibold text-purple-900 mb-2">🏢 Físicas</h4>
                  <ul className="text-purple-800 text-sm space-y-1">
                    <li>• Acceso restringido</li>
                    <li>• Control de visitantes</li>
                    <li>• Destrucción segura</li>
                    <li>• Vigilancia perimetral</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Contacto */}
            <Card variant="elevated" className="p-6 bg-gradient-to-r from-slate-50 to-slate-100">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">📞 Contacto y Reclamos</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-6">
                  <div className="bg-white p-3 rounded-lg shadow-soft">
                    <div className="font-semibold text-slate-900">Oficial de Privacidad</div>
                    <div className="text-slate-600">privacidad@plataformaincentivos.cl</div>
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

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">🏛️ Autoridades Competentes</h4>
                  <p className="text-blue-800 text-sm">
                    Servicio de Impuestos Internos (SII) • Comisión para el Mercado Financiero (CMF) •
                    Consejo para la Transparencia • Tribunales de Justicia
                  </p>
                </div>
              </div>
            </Card>

            {/* Legislación */}
            <Card variant="elevated" className="p-6 bg-gradient-to-r from-slate-100 to-slate-200">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">📜 Legislación Aplicable</h2>
                <div className="bg-white p-4 rounded-lg shadow-soft">
                  <p className="text-slate-800 mb-3">
                    Esta política se rige por las siguientes leyes y normativas chilenas:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                      <span><strong>Ley 19.628</strong> - Protección de Datos Personales</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                      <span><strong>Decreto Supremo 380/2001</strong> - Reglamento Habeas Data</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                      <span><strong>Ley 19.799</strong> - Servicios Financieros</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                      <span><strong>Normativas CMF</strong> - Comisión para el Mercado Financiero</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                      <span><strong>Ley 19.496</strong> - Derechos del Consumidor</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                      <span><strong>Código Civil</strong> de Chile</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;