/**
 * Componente reutilizable para filtros de configuración
 *
 * Incluye filtros de fecha y búsqueda básica
 */

import { Input } from './index';
import { Calendar } from 'lucide-react';

const ConfigFilters = ({
  searchValue = "",
  onSearchChange = () => {},
  showDateFilters = true,
  className = "bg-white/60 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-4 border border-white/30 shadow-sm w-full lg:min-w-fit"
}) => {
  return (
    <div className={className}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-900">Período de análisis</span>
        </div>

        {showDateFilters && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="startDate" className="text-sm text-gray-600">Desde:</label>
              <input
                id="startDate"
                type="date"
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="endDate" className="text-sm text-gray-600">Hasta:</label>
              <input
                id="endDate"
                type="date"
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 mr-2">Rangos rápidos:</span>
          <button className="text-xs px-3 py-1 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            Hoy
          </button>
          <button className="text-xs px-3 py-1 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            Últimos 7 días
          </button>
          <button className="text-xs px-3 py-1 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            Este mes
          </button>
        </div>
      </div>

      {/* Search input */}
      <div className="mt-4">
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
          <Input
            placeholder="Buscar configuraciones..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
    </div>
  );
};

export default ConfigFilters;