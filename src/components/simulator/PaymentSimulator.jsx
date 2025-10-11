/**
 * Componente: Centro de Ganancias por Comisiones
 *
 * Una experiencia motivacional para que los usuarios entiendan y se entusiasmen
 * con ganar dinero gestionando sus deudas
 */

import { useState, useEffect } from 'react';
import { Calculator, AlertTriangle, TrendingUp, Clock, Target, Award, Zap, Star, Gift, DollarSign, PiggyBank } from 'lucide-react';
import { Card, Badge, Button } from '../common';
import { useDebts } from '../../hooks';
import { formatCurrency, formatDate } from '../../utils/formatters';

const CommissionCalculator = () => {
  const { debts, loading } = useDebts();
  const [commissionStats, setCommissionStats] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState('conservative');
  const [motivationalMessage, setMotivationalMessage] = useState('');

  useEffect(() => {
    if (debts.length > 0) {
      calculateCommissionPotential();
      generateMotivationalMessage();
    }
  }, [debts, selectedScenario]);

  const calculateCommissionPotential = () => {
    const now = new Date();

    // Filtrar deudas morosas (fecha de vencimiento pasada o sin fecha definida)
    const overdueDebts = debts.filter(debt => {
      if (!debt.due_date) return debt.status === 'active'; // Considerar morosas si no tienen fecha
      const dueDate = new Date(debt.due_date);
      return dueDate < now && debt.status === 'active';
    });

    // Escenarios de comisiones basados en diferentes ofertas de empresas
    const scenarios = {
      conservative: { commissionPerClosure: 30000, successRate: 0.7, name: 'Conservador' },
      moderate: { commissionPerClosure: 45000, successRate: 0.8, name: 'Moderado' },
      aggressive: { commissionPerClosure: 60000, successRate: 0.9, name: 'Agresivo' }
    };

    const scenario = scenarios[selectedScenario];
    const baseCommission = scenario.commissionPerClosure;
    const successRate = scenario.successRate;

    // Calcular comisiones potenciales con tasa de éxito
    const expectedClosures = Math.round(overdueDebts.length * successRate);
    const potentialCommission = expectedClosures * baseCommission;

    // Proyección mensual (asumiendo que cierran acuerdos gradualmente)
    const monthlyProjection = Math.round(potentialCommission / 6); // 6 meses promedio

    // Calcular estadísticas
    const totalOverdueAmount = overdueDebts.reduce((sum, debt) => sum + parseFloat(debt.current_amount || 0), 0);
    const stats = {
      totalDebts: debts.length,
      overdueDebts: overdueDebts.length,
      totalOverdueAmount,
      potentialCommission,
      commissionPerClosure: baseCommission,
      expectedClosures,
      successRate: successRate * 100,
      monthlyProjection,
      scenario: scenario.name
    };

    setCommissionStats(stats);
  };

  const generateMotivationalMessage = () => {
    const messages = [
      "¡Imagina ganar dinero mientras resuelves tus deudas! Cada acuerdo exitoso es una victoria financiera.",
      "Tu deuda puede convertirse en tu mayor fuente de ingresos. ¡Toma el control hoy!",
      "Miles de personas ya ganan comisiones negociando sus deudas. ¿Por qué no tú?",
      "Cada deuda morosa es una oportunidad de $36.000 en tu bolsillo. ¡No las dejes pasar!",
      "Convierte tus problemas financieros en soluciones rentables. ¡El cambio está en tus manos!",
      "¡Sé parte de la revolución financiera! Gana mientras pagas tus deudas.",
      "Tu futuro financiero brillante comienza con una decisión: negociar y ganar.",
      "Cada acuerdo exitoso no solo resuelve una deuda, sino que construye tu patrimonio.",
      "¡Despierta el emprendedor financiero que llevas dentro! Tus deudas pueden ser tu negocio.",
      "La libertad financiera está a solo un acuerdo de distancia. ¡Haz que suceda!"
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    setMotivationalMessage(randomMessage);
  };

  const isOverdue = (debt) => {
    if (!debt.due_date) return debt.status === 'active'; // Considerar morosas si no tienen fecha
    const dueDate = new Date(debt.due_date);
    return dueDate < new Date() && debt.status === 'active';
  };

  const getDaysOverdue = (debt) => {
    if (!debt.due_date) return 0;
    const dueDate = new Date(debt.due_date);
    const now = new Date();
    const diffTime = now - dueDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section - Motivacional */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/20 to-orange-400/20" />
        <div className="relative p-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-3xl shadow-xl">
                <PiggyBank className="w-12 h-12 animate-bounce" />
              </div>
              <div>
                <h1 className="text-4xl font-display font-bold mb-2">
                  🚀 Centro de Ganancias por Comisiones
                </h1>
                <p className="text-yellow-100 text-xl">
                  Convierte tus deudas en oportunidades de ingresos
                </p>
              </div>
            </div>

            {/* Mensaje motivacional dinámico */}
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6 text-yellow-200 animate-pulse" />
                <p className="text-lg font-medium text-white">
                  {motivationalMessage || "¡Tu libertad financiera comienza aquí!"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Commission Scenarios Selector */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Target className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            Elige tu Estrategia de Comisiones
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { key: 'conservative', name: 'Conservador', commission: '$30.000', rate: '70%', desc: 'Más seguro, comisiones moderadas' },
            { key: 'moderate', name: 'Moderado', commission: '$45.000', rate: '80%', desc: 'Balance perfecto' },
            { key: 'aggressive', name: 'Agresivo', commission: '$60.000', rate: '90%', desc: 'Máximo potencial' }
          ].map((scenario) => (
            <button
              key={scenario.key}
              onClick={() => setSelectedScenario(scenario.key)}
              className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                selectedScenario === scenario.key
                  ? 'border-purple-500 bg-purple-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-purple-300'
              }`}
            >
              <div className="text-center">
                <h3 className="font-bold text-lg text-gray-900 mb-2">{scenario.name}</h3>
                <p className="text-2xl font-bold text-green-600 mb-1">{scenario.commission}</p>
                <p className="text-sm text-purple-600 mb-2">{scenario.rate} éxito</p>
                <p className="text-xs text-gray-600">{scenario.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Estadísticas de comisiones */}
        {commissionStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">Comisión Potencial</span>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(commissionStats.potentialCommission)}
              </p>
              <p className="text-xs text-green-700">Total esperado</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Acuerdos Esperados</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {commissionStats.expectedClosures}
              </p>
              <p className="text-xs text-blue-700">{commissionStats.successRate}% tasa éxito</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Proyección Mensual</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {formatCurrency(commissionStats.monthlyProjection)}
              </p>
              <p className="text-xs text-purple-700">Próximos 6 meses</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Deudas Morosas</span>
              </div>
              <p className="text-2xl font-bold text-orange-900">
                {commissionStats.overdueDebts}
              </p>
              <p className="text-xs text-orange-700">Listas para negociar</p>
            </div>
          </div>
        )}
      </Card>

      {/* Journey Section */}
      <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">🎯 Tu Viaje hacia las Comisiones</h2>
          <p className="text-gray-600">Así es como convertirás tus deudas en ingresos</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">1. Deuda en Mora</h3>
            <p className="text-sm text-gray-600">Tus deudas pasan la fecha de vencimiento</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">2. Contacto Empresarial</h3>
            <p className="text-sm text-gray-600">Las empresas te contactan para negociar</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">3. Acuerdo Exitoso</h3>
            <p className="text-sm text-gray-600">Cierras un acuerdo de negociación</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PiggyBank className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">4. ¡Comisión Ganada!</h3>
            <p className="text-sm text-gray-600">Recibes tu comisión por el acuerdo</p>
          </div>
        </div>
      </Card>

      {/* Achievement Section */}
      <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Award className="w-8 h-8 text-yellow-600" />
            <h2 className="text-2xl font-bold text-gray-900">🏆 Tus Logros y Próximos Objetivos</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-yellow-200">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Primer Acuerdo</h3>
            <p className="text-sm text-gray-600 mb-3">Gana tu primera comisión</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '0%' }}></div>
            </div>
            <p className="text-xs text-gray-500">0 / 1 completado</p>
          </div>

          <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-yellow-200">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Comisionista Activo</h3>
            <p className="text-sm text-gray-600 mb-3">$100.000 en comisiones</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '0%' }}></div>
            </div>
            <p className="text-xs text-gray-500">$0 / $100.000</p>
          </div>

          <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-yellow-200">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Gift className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Maestro Negociador</h3>
            <p className="text-sm text-gray-600 mb-3">5 acuerdos exitosos</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '0%' }}></div>
            </div>
            <p className="text-xs text-gray-500">0 / 5 completados</p>
          </div>
        </div>
      </Card>

      {/* Motivational Call to Action */}
      <Card className="p-8 bg-gradient-to-br from-green-500 to-blue-600 text-white">
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-3xl">
              <Zap className="w-12 h-12 animate-pulse" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">¡Es hora de actuar!</h2>
              <p className="text-green-100 text-lg">Cada deuda morosa es una oportunidad de $36.000 en tu bolsillo</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-3">💡 Consejos para Éxito</h3>
              <ul className="text-left space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  Mantén tus datos actualizados
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  Responde rápido a las ofertas
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  Negocia términos favorables
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  Registra todas tus deudas
                </li>
              </ul>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-3">🎯 Tu Próximo Paso</h3>
              <div className="space-y-3">
                <p className="text-sm">Registra tus deudas pendientes para comenzar a generar comisiones</p>
                <Button
                  variant="glass"
                  size="lg"
                  className="w-full bg-white/20 border-white/40 hover:bg-white/30"
                  leftIcon={<TrendingUp className="w-5 h-5" />}
                >
                  Registrar Nueva Deuda
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6">
            <h3 className="text-2xl font-bold mb-4">🚀 ¿Listo para cambiar tu futuro financiero?</h3>
            <p className="text-lg mb-6">
              Miles de personas ya están ganando dinero gestionando sus deudas.
              ¡Únete a la revolución financiera y comienza hoy mismo!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="glass"
                size="xl"
                className="bg-white text-green-600 hover:bg-green-50 border-2 border-white"
                leftIcon={<DollarSign className="w-6 h-6" />}
              >
                ¡Comenzar Ahora!
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CommissionCalculator;
