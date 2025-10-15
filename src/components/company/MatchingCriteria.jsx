/**
 * Matching Criteria Component
 *
 * Componente que muestra los criterios de matching inteligente
 */

import { Card } from '../common';
import { Target } from 'lucide-react';

const MatchingCriteria = () => {
  return (
    <Card>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Target className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">
            Criterios de Matching Inteligente
          </h3>
          <p className="text-xs text-gray-600">
            Cómo el sistema identifica y empareja contactos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="font-semibold text-blue-900 text-xs">RUT</span>
          </div>
          <p className="text-xs text-blue-700">Matching exacto (100% confianza)</p>
        </div>

        <div className="p-4 bg-green-50 rounded-xl border border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="font-semibold text-green-900 text-xs">Email</span>
          </div>
          <p className="text-xs text-green-700">Matching con tolerancia (80% confianza)</p>
        </div>

        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="font-semibold text-blue-900 text-xs">Nombre</span>
          </div>
          <p className="text-xs text-blue-700">Distancia Levenshtein (50% confianza)</p>
        </div>

        <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="font-semibold text-orange-900 text-xs">Teléfono</span>
          </div>
          <p className="text-xs text-orange-700">Normalizado (70% confianza)</p>
        </div>

        <div className="p-4 bg-teal-50 rounded-xl border border-teal-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
            <span className="font-semibold text-teal-900 text-xs">Dirección</span>
          </div>
          <p className="text-xs text-teal-700">Matching parcial (30% confianza)</p>
        </div>

        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <span className="font-semibold text-gray-900 text-xs">IA Asistida</span>
          </div>
          <p className="text-xs text-gray-700">Próximamente - Machine Learning</p>
        </div>
      </div>
    </Card>
  );
};

export default MatchingCriteria;