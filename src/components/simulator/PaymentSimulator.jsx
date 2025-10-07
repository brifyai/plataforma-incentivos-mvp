/**
 * Componente: Calculador de Comisiones
 *
 * Calcula ganancias potenciales basadas en deudas morosas
 */

import { useState, useEffect } from 'react';
import { Calculator, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { Card, Badge } from '../common';
import { useDebts } from '../../hooks';
import { formatCurrency, formatDate } from '../../utils/formatters';

const CommissionCalculator = () => {
  const { debts, loading } = useDebts();
  const [commissionStats, setCommissionStats] = useState(null);

  useEffect(() => {
    if (debts.length > 0) {
      calculateCommissionPotential();
    }
  }, [debts]);

  const calculateCommissionPotential = () => {
    const now = new Date();

    // Filtrar deudas morosas (fecha de vencimiento pasada)
    const overdueDebts = debts.filter(debt => {
      if (!debt.due_date) return false;
      const dueDate = new Date(debt.due_date);
      return dueDate < now && debt.status === 'active';
    });

    // Calcular comisiones potenciales ($60.000 por cierre de negocio, usuario recibe 60% = $36.000)
    const commissionPerClosure = 60000; // $60.000 por cierre de negocio
    const userCommissionPercentage = 0.6; // 60% para el usuario
    const userCommissionPerClosure = commissionPerClosure * userCommissionPercentage; // $36.000

    const potentialCommission = overdueDebts.length * userCommissionPerClosure;

    // Calcular estadísticas
    const totalOverdueAmount = overdueDebts.reduce((sum, debt) => sum + parseFloat(debt.current_amount || 0), 0);
    const stats = {
      totalDebts: debts.length,
      overdueDebts: overdueDebts.length,
      totalOverdueAmount,
      potentialCommission,
      commissionPerClosure: userCommissionPerClosure,
      averageCommission: userCommissionPerClosure // Ahora es fijo por cierre
    };

    setCommissionStats(stats);
  };

  const isOverdue = (debt) => {
    if (!debt.due_date) return false;
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
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-green-100 rounded-lg">
            <Calculator className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              💰 Calculador de Ganancias por Comisiones
            </h2>
            <p className="text-gray-600">
              Descubre cuánto puedes ganar negociando tus deudas morosas
            </p>
          </div>
        </div>

        {/* Estadísticas de comisiones */}
        {commissionStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">Comisión Potencial</span>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(commissionStats.potentialCommission)}
              </p>
              <p className="text-xs text-green-700">$36.000 por cierre</p>
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

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Comisión Promedio</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(commissionStats.commissionPerClosure)}
              </p>
              <p className="text-xs text-blue-700">Por acuerdo exitoso</p>
            </div>
          </div>
        )}

        {/* Información del modelo */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-3">🎯 ¿Cómo funciona?</h4>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex gap-3">
              <span className="text-lg">1️⃣</span>
              <div>
                <p className="font-medium">Registra tus deudas con fechas de vencimiento</p>
                <p className="text-xs">Cuando pasan la fecha límite, entran en mora</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-lg">2️⃣</span>
              <div>
                <p className="font-medium">Las empresas de cobranza contactan deudores morosos</p>
                <p className="text-xs">Ofrecen acuerdos de negociación y descuento</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-lg">3️⃣</span>
              <div>
                <p className="font-medium">Ganas $36.000 por cada acuerdo exitoso cerrado</p>
                <p className="text-xs">Comisión fija de $60.000 (60% para ti, 40% para la plataforma)</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Lista de deudas morosas */}
      {commissionStats && commissionStats.overdueDebts > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            <h3 className="text-xl font-bold text-gray-900">
              Tus Deudas Morosas
            </h3>
          </div>

          <div className="space-y-4">
            {debts.filter(debt => isOverdue(debt)).map((debt) => (
              <div
                key={debt.id}
                className="border border-orange-200 bg-orange-50 p-4 rounded-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {debt.company?.business_name || 'Empresa'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Venció el {formatDate(debt.due_date)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="danger">
                    {getDaysOverdue(debt)} días en mora
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Monto Actual</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(debt.current_amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Comisión Potencial</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(36000)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <div>
                <h4 className="font-semibold text-green-900">¡Oportunidad de Ganancia!</h4>
                <p className="text-sm text-green-800">
                  Estas deudas morosas pueden generar <span className="font-bold">{formatCurrency(commissionStats.potentialCommission)}</span> en comisiones cuando negocies acuerdos exitosos.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Mensaje si no hay deudas morosas */}
      {commissionStats && commissionStats.overdueDebts === 0 && (
        <Card className="p-6 text-center">
          <div className="p-6 bg-green-50 rounded-3xl inline-block mb-4">
            <TrendingUp className="w-12 h-12 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            ¡Excelente! No tienes deudas morosas
          </h3>
          <p className="text-gray-600">
            Todas tus deudas están al día. Cuando alguna deuda entre en mora, podrás calcular las ganancias potenciales por comisiones.
          </p>
        </Card>
      )}
    </div>
  );
};

export default CommissionCalculator;
