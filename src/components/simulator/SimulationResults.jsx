/**
 * Componente: Resultados de Simulación
 * 
 * Muestra los resultados calculados de una simulación de pagos
 */

import React, { useState } from 'react';
import { TrendingDown, Calendar, DollarSign, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../common';
import { formatCurrency } from '../../utils/formatters';

const SimulationResults = ({ simulation }) => {
  const [showSchedule, setShowSchedule] = useState(false);

  if (!simulation || !simulation.success) {
    return null;
  }

  const { summary, paymentSchedule } = simulation;

  // Calcular porcentaje de interés sobre el total
  const interestPercentage = (summary.totalInterestPaid / summary.totalPaid) * 100;

  return (
    <div className="space-y-6">
      {/* Resumen principal */}
      <Card className="p-6 bg-gradient-to-br from-green-50 to-blue-50">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          📊 Resultados de la Simulación
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total a pagar */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-medium">Total a Pagar</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(summary.totalPaid)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Deuda + Intereses
            </p>
          </div>

          {/* Intereses totales */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 text-orange-600 mb-2">
              <TrendingDown className="w-4 h-4" />
              <span className="text-sm font-medium">Intereses</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(summary.totalInterestPaid)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {interestPercentage.toFixed(1)}% del total
            </p>
          </div>

          {/* Número de pagos */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Número de Pagos</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {summary.totalPayments}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Cuotas totales
            </p>
          </div>

          {/* Tiempo hasta estar libre */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Tiempo</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {summary.timeToFreedom.months}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {summary.timeToFreedom.formatted}
            </p>
          </div>
        </div>

        {/* Fecha de finalización */}
        <div className="mt-6 p-4 bg-white rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Fecha de Finalización</p>
              <p className="text-lg font-bold text-gray-900">
                {new Date(summary.completionDate).toLocaleDateString('es-CL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Deuda Original</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(summary.debtAmount)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Cronograma de pagos */}
      <Card className="p-6">
        <button
          onClick={() => setShowSchedule(!showSchedule)}
          className="w-full flex items-center justify-between text-left"
        >
          <h3 className="text-xl font-bold text-gray-900">
            📅 Cronograma de Pagos
          </h3>
          {showSchedule ? (
            <ChevronUp className="w-6 h-6 text-gray-600" />
          ) : (
            <ChevronDown className="w-6 h-6 text-gray-600" />
          )}
        </button>

        {showSchedule && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-semibold text-gray-700">#</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Fecha</th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-700">Pago Total</th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-700">A Principal</th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-700">A Interés</th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-700">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {paymentSchedule.map((payment, index) => (
                  <tr
                    key={index}
                    className={`
                      border-b border-gray-100 hover:bg-gray-50 transition-colors
                      ${index % 5 === 0 ? 'bg-blue-50/30' : ''}
                    `}
                  >
                    <td className="py-3 px-2 text-gray-900 font-medium">
                      {payment.paymentNumber}
                    </td>
                    <td className="py-3 px-2 text-gray-700">
                      {new Date(payment.date).toLocaleDateString('es-CL', {
                        year: 'numeric',
                        month: 'short'
                      })}
                    </td>
                    <td className="py-3 px-2 text-right font-semibold text-gray-900">
                      {formatCurrency(payment.paymentAmount)}
                    </td>
                    <td className="py-3 px-2 text-right text-green-600">
                      {formatCurrency(payment.principalPayment)}
                    </td>
                    <td className="py-3 px-2 text-right text-orange-600">
                      {formatCurrency(payment.interestPayment)}
                    </td>
                    <td className="py-3 px-2 text-right font-medium text-gray-900">
                      {formatCurrency(payment.remainingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!showSchedule && (
          <p className="mt-4 text-sm text-gray-600 text-center">
            Haz clic para ver el cronograma completo de {paymentSchedule.length} pagos
          </p>
        )}
      </Card>

      {/* Gráfico de amortización (placeholder) */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          📈 Evolución de la Deuda
        </h3>
        <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">
            Gráfico de amortización (implementar con Chart.js o similar)
          </p>
        </div>
      </Card>

      {/* Consejos basados en los resultados */}
      <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          💡 Recomendaciones
        </h3>
        <div className="space-y-3">
          {summary.totalInterestPaid > summary.debtAmount * 0.3 && (
            <div className="flex gap-3 p-3 bg-white rounded-lg">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold text-gray-900">
                  Alto costo de intereses
                </p>
                <p className="text-sm text-gray-600">
                  Considera aumentar el monto de pago para reducir los intereses totales.
                  Un aumento del 20% podría ahorrarte miles de pesos.
                </p>
              </div>
            </div>
          )}

          {summary.timeToFreedom.months > 24 && (
            <div className="flex gap-3 p-3 bg-white rounded-lg">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="font-semibold text-gray-900">
                  Plazo extendido
                </p>
                <p className="text-sm text-gray-600">
                  Tu deuda tomará más de 2 años en pagarse. Considera hacer pagos adicionales
                  cuando sea posible para acelerar el proceso.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 p-3 bg-white rounded-lg">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-gray-900">
                Mantén la consistencia
              </p>
              <p className="text-sm text-gray-600">
                Realizar pagos puntuales te ayudará a acumular puntos y desbloquear beneficios
                en la plataforma. ¡Cada pago cuenta!
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SimulationResults;
