/**
 * Componente reutilizable para mostrar tarjetas de estadísticas de configuración
 *
 * Recibe un array de configuraciones y muestra estadísticas visuales
 */

import { Card } from './index';
import { CheckCircle, AlertTriangle } from 'lucide-react';

const ConfigStatsCards = ({ stats, className = "grid grid-cols-1 md:grid-cols-4 gap-1.5 mt-2" }) => {
  return (
    <div className={className}>
      {stats.map((stat, index) => (
        <Card key={index} className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-1">
            <div className="flex items-center justify-center mb-1.5">
              <div className={`p-0.5 bg-gradient-to-br ${stat.iconBg} rounded-lg group-hover:shadow-glow-${stat.iconColor} transition-all duration-300`}>
                <stat.icon className={`w-4 h-4 text-${stat.iconColor}-600`} />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {stat.value}
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">
              {stat.label}
            </p>
            {stat.showStatus && (
              <div className="flex items-center justify-center mt-0.5">
                {stat.isActive ? (
                  <CheckCircle className="w-2.5 h-2.5 text-green-500 mr-0.5" />
                ) : (
                  <AlertTriangle className="w-2.5 h-2.5 text-red-500 mr-0.5" />
                )}
                <span className="text-xs text-green-600 font-medium">
                  {stat.statusText}
                </span>
              </div>
            )}
            {stat.extraInfo && (
              <div className="text-xs text-orange-600 mt-0.5 font-medium">
                {stat.extraInfo}
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ConfigStatsCards;