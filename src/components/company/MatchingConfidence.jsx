/**
 * Matching Confidence Component
 *
 * Componente que muestra la confianza promedio del sistema de matching inteligente
 */

import { Card } from '../common';
import { TrendingUp } from 'lucide-react';

const MatchingConfidence = ({ stats }) => {
  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Confianza de Matching
            </h3>
            <p className="text-sm text-gray-600">
              Precisión promedio del sistema de matching inteligente
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">
            {stats?.averageConfidence?.toFixed(1) || 0}%
          </div>
          <p className="text-xs text-gray-500">Confianza promedio</p>
        </div>
      </div>

      {/* Barra de progreso de confianza */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Excelente (95%+)</span>
          <span>Bueno (80-94%)</span>
          <span>Regular (60-79%)</span>
          <span>Pobre (0-59%)</span>
        </div>
        <div className="flex h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="bg-green-500 h-full"
            style={{ width: `${Math.min(stats?.averageConfidence || 0, 100)}%` }}
          ></div>
        </div>
      </div>
    </Card>
  );
};

export default MatchingConfidence;