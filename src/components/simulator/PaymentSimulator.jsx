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
    <div className="space-y-6">
      {/* Hero Section Compact */}
      <Card className="relative overflow-hidden bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
        <div className="relative p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <PiggyBank className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1">
                🚀 Centro de Ganancias por Comisiones
              </h1>
              <p className="text-yellow-100">
                Convierte tus deudas en oportunidades de ingresos
              </p>
            </div>
          </div>

          {/* Mensaje motivacional compacto */}
          <div className="mt-4 bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-200 animate-pulse" />
              <p className="text-sm font-medium text-white">
                {motivationalMessage || "¡Tu libertad financiera comienza aquí!"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Call to Action - Segundo */}
      <Card className="p-6 bg-gradient-to-r from-green-500 to-blue-600 text-white">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">¡Es hora de actuar!</h2>
              <p className="text-green-100 text-sm">Cada deuda morosa es una oportunidad de $36.000 en tu bolsillo</p>
            </div>
          </div>

          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
            <h3 className="text-lg font-bold mb-2">🚀 ¿Listo para cambiar tu futuro financiero?</h3>
            <p className="text-sm mb-4">
              Miles de personas ya están ganando dinero gestionando sus deudas.
              ¡Únete a la revolución financiera y comienza hoy mismo!
            </p>
            <Button
              variant="glass"
              size="lg"
              className="bg-white text-green-600 hover:bg-green-50 border-2 border-white"
              leftIcon={<DollarSign className="w-5 h-5" />}
            >
              ¡Comenzar Ahora!
            </Button>
          </div>
        </div>
      </Card>

      {/* Achievement Section Compact - Tercero */}
      <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Award className="w-6 h-6 text-yellow-600" />
            <h2 className="text-xl font-bold text-gray-900">🏆 Tus Logros</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-yellow-200">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1 text-sm">Primer Acuerdo</h3>
            <p className="text-xs text-gray-600 mb-2">Gana tu primera comisión</p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
              <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: '0%' }}></div>
            </div>
            <p className="text-xs text-gray-500">0 / 1 completado</p>
          </div>

          <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-yellow-200">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1 text-sm">Comisionista Activo</h3>
            <p className="text-xs text-gray-600 mb-2">$100.000 en comisiones</p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '0%' }}></div>
            </div>
            <p className="text-xs text-gray-500">$0 / $100.000</p>
          </div>

          <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-yellow-200">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Gift className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1 text-sm">Maestro Negociador</h3>
            <p className="text-xs text-gray-600 mb-2">5 acuerdos exitosos</p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
              <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '0%' }}></div>
            </div>
            <p className="text-xs text-gray-500">0 / 5 completados</p>
          </div>
        </div>
      </Card>

      {/* Commission Scenarios Selector - Cuarto */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-5 h-5 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-900">
            Estrategia de Comisiones
          </h2>
        </div>

        <div className="space-y-3 mb-4">
          {[
            { key: 'conservative', name: 'Conservador', commission: '$30.000', rate: '70%', desc: 'Más seguro, comisiones moderadas' },
            { key: 'moderate', name: 'Moderado', commission: '$45.000', rate: '80%', desc: 'Balance perfecto' },
            { key: 'aggressive', name: 'Agresivo', commission: '$60.000', rate: '90%', desc: 'Máximo potencial' }
          ].map((scenario) => (
            <button
              key={scenario.key}
              onClick={() => setSelectedScenario(scenario.key)}
              className={`w-full p-3 rounded-lg border transition-all duration-300 ${
                selectedScenario === scenario.key
                  ? 'border-purple-500 bg-purple-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-purple-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h3 className="font-bold text-gray-900">{scenario.name}</h3>
                  <p className="text-xs text-gray-600">{scenario.desc}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">{scenario.commission}</p>
                  <p className="text-xs text-purple-600">{scenario.rate} éxito</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Estadísticas compactas */}
        {commissionStats && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-800">Comisión Potencial</span>
              </div>
              <p className="text-lg font-bold text-green-900">
                {formatCurrency(commissionStats.potentialCommission)}
              </p>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-800">Acuerdos Esperados</span>
              </div>
              <p className="text-lg font-bold text-blue-900">
                {commissionStats.expectedClosures}
              </p>
            </div>

            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-800">Proyección Mensual</span>
              </div>
              <p className="text-lg font-bold text-purple-900">
                {formatCurrency(commissionStats.monthlyProjection)}
              </p>
            </div>

            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-medium text-orange-800">Deudas Morosas</span>
              </div>
              <p className="text-lg font-bold text-orange-900">
                {commissionStats.overdueDebts}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Journey Section Compact - Quinto */}
      <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">🎯 Tu Viaje hacia las Comisiones</h2>
          <p className="text-sm text-gray-600">Así es como convertirás tus deudas en ingresos</p>
        </div>

        <div className="space-y-4">
          {[
            { icon: AlertTriangle, color: 'blue', title: '1. Deuda en Mora', desc: 'Tus deudas pasan la fecha de vencimiento' },
            { icon: Clock, color: 'orange', title: '2. Contacto Empresarial', desc: 'Las empresas te contactan para negociar' },
            { icon: Award, color: 'green', title: '3. Acuerdo Exitoso', desc: 'Cierras un acuerdo de negociación' },
            { icon: PiggyBank, color: 'yellow', title: '4. ¡Comisión Ganada!', desc: 'Recibes tu comisión por el acuerdo' }
          ].map((step, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className={`w-12 h-12 bg-${step.color}-100 rounded-full flex items-center justify-center flex-shrink-0`}>
                <step.icon className={`w-6 h-6 text-${step.color}-600`} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">{step.title}</h3>
                <p className="text-xs text-gray-600">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default CommissionCalculator;
