/**
 * Help Page - Sistema de Comisiones
 *
 * Página dedicada con preguntas y respuestas motivacionales sobre el sistema de comisiones
 */

import { Card, Button } from '../../components/common';
import {
  HelpCircle,
  DollarSign,
  TrendingUp,
  Clock,
  Shield,
  Calculator,
  Plus,
  MessageSquare,
} from 'lucide-react';

const HelpPage = () => {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 rounded-3xl p-4 text-white shadow-strong animate-fade-in">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
        </div>

        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold tracking-tight">
                  Centro de Ayuda
                </h1>
                <p className="text-primary-100 text-sm">
                  Sistema de Comisiones por Negociación
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <Card variant="elevated" className="p-6 bg-gradient-to-r from-green-50 via-blue-50 to-purple-50">
        <h3 className="text-xl font-bold text-secondary-900 mb-4 text-center">
          🚀 ¿Listo para empezar?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="primary"
            onClick={() => window.location.href = '/debtor/debts'}
            className="hover:scale-105 transition-all"
            leftIcon={<Plus className="w-5 h-5" />}
          >
            Registrar Deuda
          </Button>
          <Button
            variant="gradient"
            onClick={() => window.location.href = '/debtor/simulator'}
            className="hover:scale-105 transition-all"
            leftIcon={<Calculator className="w-5 h-5" />}
          >
            Calcular Ganancias
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/debtor/messages'}
            className="hover:scale-105 transition-all"
            leftIcon={<MessageSquare className="w-5 h-5" />}
          >
            Contactar Soporte
          </Button>
        </div>
      </Card>

      {/* Navigation Menu */}
      <Card variant="elevated" className="p-6">
        <h3 className="text-lg font-bold text-secondary-900 mb-4">📋 Navegación Rápida</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            onClick={() => scrollToSection('cuanto-gano')}
            className="p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <span className="font-medium text-blue-800">💰 ¿Cuánto gano?</span>
          </button>
          <button
            onClick={() => scrollToSection('como-funciona')}
            className="p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <span className="font-medium text-purple-800">🎯 ¿Cómo funciona?</span>
          </button>
          <button
            onClick={() => scrollToSection('ventajas')}
            className="p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
          >
            <span className="font-medium text-green-800">✅ ¿Por qué usar?</span>
          </button>
          <button
            onClick={() => scrollToSection('tiempo')}
            className="p-3 text-left bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
          >
            <span className="font-medium text-orange-800">⏰ ¿Cuánto tarda?</span>
          </button>
          <button
            onClick={() => scrollToSection('seguridad')}
            className="p-3 text-left bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <span className="font-medium text-red-800">🔒 ¿Es seguro?</span>
          </button>
          <button
            onClick={() => scrollToSection('proyecciones')}
            className="p-3 text-left bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
          >
            <span className="font-medium text-indigo-800">📈 ¿Cuánto al año?</span>
          </button>
        </div>
      </Card>

      {/* FAQ Sections */}
      <div className="space-y-8">
        {/* Pregunta 1 */}
        <Card id="cuanto-gano" variant="elevated" className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-xl flex-shrink-0">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-secondary-900 mb-4">
                💰 ¿Cuánto dinero puedo ganar con mis deudas?
              </h3>
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl mb-6 border border-green-200">
                <p className="text-3xl font-bold text-green-700 mb-2">$36.000 por cada deuda morosa que negocies exitosamente</p>
                <p className="text-lg text-green-600">¡Es una cantidad fija que no depende del tamaño de tu deuda!</p>
              </div>
              <p className="text-lg text-secondary-700 mb-4">
                Imagina que tienes 3 deudas morosas. Si logras acuerdos exitosos en todas ellas,
                ¡ganarías <span className="font-bold text-green-600 text-xl">$108.000</span>! Y lo mejor es que
                puedes seguir ganando más registrando más deudas.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800">
                  <strong>Ejemplo real:</strong> Una deuda de $500.000 que negocias por $300.000
                  (40% de descuento) te paga $36.000 de comisión. ¡El descuento lo obtienes tú,
                  pero la comisión es extra!
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Pregunta 2 */}
        <Card id="como-funciona" variant="elevated" className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 rounded-xl flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-secondary-900 mb-4">
                🎯 ¿Cómo funciona exactamente el sistema de comisiones?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="text-4xl mb-3">1️⃣</div>
                  <h4 className="font-bold text-blue-800 mb-2">Registras tu deuda</h4>
                  <p className="text-sm text-blue-700">Con fecha de vencimiento</p>
                </div>
                <div className="text-center p-6 bg-orange-50 rounded-xl border border-orange-200">
                  <div className="text-4xl mb-3">2️⃣</div>
                  <h4 className="font-bold text-orange-800 mb-2">Espera a que venza</h4>
                  <p className="text-sm text-orange-700">Se vuelve morosa automáticamente</p>
                </div>
                <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200">
                  <div className="text-4xl mb-3">3️⃣</div>
                  <h4 className="font-bold text-green-800 mb-2">¡Ganas $36.000!</h4>
                  <p className="text-sm text-green-700">Por cada acuerdo exitoso</p>
                </div>
              </div>
              <p className="text-lg text-secondary-700">
                El proceso es completamente automático. Solo registras tus deudas con sus fechas de vencimiento,
                y cuando pasan la fecha límite, automáticamente se convierten en deudas morosas. Las empresas
                de cobranza te contactarán para ofrecer acuerdos de negociación. Tú decides aceptar o rechazar
                cualquier oferta. ¡Si aceptas y cumples, ganas $36.000 por cada acuerdo exitoso!
              </p>
            </div>
          </div>
        </Card>

        {/* Pregunta 3 */}
        <Card id="ventajas" variant="elevated" className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-100 rounded-xl flex-shrink-0">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-secondary-900 mb-4">
                ✅ ¿Por qué debería usar esta plataforma en lugar de otras?
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl border border-green-200">
                  <span className="text-green-600 font-bold text-2xl">✓</span>
                  <div>
                    <p className="font-bold text-green-800 text-lg">Comisión garantizada de $36.000 fijos</p>
                    <p className="text-green-700">No importa si tu deuda es de $100.000 o $5.000.000, siempre ganas lo mismo por acuerdo exitoso</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <span className="text-blue-600 font-bold text-2xl">✓</span>
                  <div>
                    <p className="font-bold text-blue-800 text-lg">Sin riesgos para ti</p>
                    <p className="text-blue-700">Solo cobramos cuando tú cobras. Si no hay acuerdo exitoso, no hay comisión. Tú no pierdes nada</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <span className="text-purple-600 font-bold text-2xl">✓</span>
                  <div>
                    <p className="font-bold text-purple-800 text-lg">Proceso 100% automático</p>
                    <p className="text-purple-700">Registras una vez y el sistema maneja todo lo demás. Te notificamos cuando hay ofertas</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <span className="text-orange-600 font-bold text-2xl">✓</span>
                  <div>
                    <p className="font-bold text-orange-800 text-lg">Ingresos ilimitados</p>
                    <p className="text-orange-700">Puedes registrar tantas deudas como tengas. Cada una es una oportunidad de ganar $36.000</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Pregunta 4 */}
        <Card id="tiempo" variant="elevated" className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-100 rounded-xl flex-shrink-0">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-secondary-900 mb-4">
                ⏰ ¿Cuánto tiempo tarda en generar ingresos?
              </h3>
              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl mb-6 border border-orange-200">
                <p className="text-2xl font-bold text-orange-700 mb-2">¡Puedes empezar a ganar desde hoy mismo!</p>
                <p className="text-lg text-orange-600">Si ya tienes deudas vencidas, puedes comenzar inmediatamente</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-green-50 rounded-xl border border-green-200">
                  <h4 className="font-bold text-green-800 mb-3 text-lg">Si tienes deudas morosas AHORA:</h4>
                  <p className="text-green-700 mb-3">¡Empieza a ganar inmediatamente! Registra tus deudas y comienza a recibir ofertas de las empresas de cobranza en las próximas 24-48 horas.</p>
                  <p className="text-sm text-green-600 italic">Tiempo estimado: 1-2 días para primera oferta</p>
                </div>
                <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                  <h4 className="font-bold text-blue-800 mb-3 text-lg">Si tus deudas vencerán PRONTO:</h4>
                  <p className="text-blue-700 mb-3">Regístralas ahora y cuando venzan, automáticamente estarán listas para generar comisiones. El sistema te notificará cuando cambien a morosas.</p>
                  <p className="text-sm text-blue-600 italic">Tiempo estimado: Dependiendo de fecha de vencimiento</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Pregunta 5 */}
        <Card id="seguridad" variant="elevated" className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 rounded-xl flex-shrink-0">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-secondary-900 mb-4">
                🔒 ¿Es seguro usar esta plataforma?
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl border border-green-200">
                  <span className="text-green-600 font-bold text-2xl">✓</span>
                  <div>
                    <p className="font-bold text-green-800 text-lg">Tus datos están 100% protegidos</p>
                    <p className="text-green-700">Usamos encriptación de nivel bancario y cumplimos con todas las normativas de protección de datos (LGPD y equivalentes)</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <span className="text-blue-600 font-bold text-2xl">✓</span>
                  <div>
                    <p className="font-bold text-blue-800 text-lg">Solo facilitamos la negociación</p>
                    <p className="text-blue-700">No manejamos dinero ni pagos directamente. Solo conectamos deudores con empresas de cobranza certificadas</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <span className="text-purple-600 font-bold text-2xl">✓</span>
                  <div>
                    <p className="font-bold text-purple-800 text-lg">Tú controlas todo</p>
                    <p className="text-purple-700">Puedes aceptar o rechazar cualquier oferta. Nunca te obligamos a nada. Tu información solo se comparte con tu consentimiento</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <span className="text-orange-600 font-bold text-2xl">✓</span>
                  <div>
                    <p className="font-bold text-orange-800 text-lg">Transparencia total</p>
                    <p className="text-orange-700">Sabes exactamente cuánto ganas, cuándo y cómo. No hay costos ocultos ni comisiones sorpresa</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Pregunta 6 */}
        <Card id="proyecciones" variant="elevated" className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-100 rounded-xl flex-shrink-0">
              <Calculator className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-secondary-900 mb-4">
                📈 ¿Cuánto puedo ganar al mes o al año?
              </h3>
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl mb-6 border border-indigo-200">
                <p className="text-2xl font-bold text-indigo-700 mb-2">¡El límite lo pones tú!</p>
                <p className="text-lg text-indigo-600">Dependiendo de cuántas deudas registres y negocies exitosamente</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200">
                  <p className="text-3xl font-bold text-green-600 mb-2">$36.000</p>
                  <p className="text-lg text-green-700 font-medium">Por deuda negociada</p>
                  <p className="text-sm text-green-600">Comisión fija garantizada</p>
                </div>
                <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-3xl font-bold text-blue-600 mb-2">$108.000</p>
                  <p className="text-lg text-blue-700 font-medium">Con 3 deudas al mes</p>
                  <p className="text-sm text-blue-600">Si negocias 3 acuerdos exitosos</p>
                </div>
                <div className="text-center p-6 bg-purple-50 rounded-xl border border-purple-200">
                  <p className="text-3xl font-bold text-purple-600 mb-2">$432.000</p>
                  <p className="text-lg text-purple-700 font-medium">Con 3 deudas al mes × 12</p>
                  <p className="text-sm text-purple-600">Ingresos anuales proyectados</p>
                </div>
              </div>
              <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                <h4 className="font-bold text-yellow-800 mb-3">💡 Ejemplo real de ingresos:</h4>
                <p className="text-yellow-800 mb-3">
                  Si tienes 5 deudas morosas y logras acuerdos exitosos en 3 de ellas este mes,
                  ¡ganarías <span className="font-bold text-xl">$108.000</span>! Imagina lo que podrías lograr
                  con más deudas registradas a lo largo del año.
                </p>
                <p className="text-sm text-yellow-700 italic">
                  *Los números son proyecciones basadas en acuerdos exitosos. El rendimiento real depende
                  de diversos factores incluyendo la negociación individual de cada deuda.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Call to Action Final */}
      <Card variant="elevated" className="p-8 bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 border-green-200">
        <div className="text-center">
          <h3 className="text-3xl font-bold text-secondary-900 mb-4">
            ¡Es hora de empezar a ganar dinero extra! 💰
          </h3>
          <p className="text-xl text-secondary-700 mb-8 max-w-4xl mx-auto">
            Registra tus deudas ahora y comienza tu camino hacia ingresos adicionales.
            ¡Cada deuda morosa es una oportunidad de ganar $36.000!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="primary"
              size="lg"
              onClick={() => window.location.href = '/debtor/debts'}
              className="hover:scale-105 transition-all shadow-glow"
              leftIcon={<Plus className="w-6 h-6" />}
            >
              🚀 Registrar Mi Primera Deuda
            </Button>
            <Button
              variant="gradient"
              size="lg"
              onClick={() => window.location.href = '/debtor/simulator'}
              className="hover:scale-105 transition-all shadow-glow"
              leftIcon={<Calculator className="w-6 h-6" />}
            >
              💰 Calcular Mis Ganancias
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default HelpPage;