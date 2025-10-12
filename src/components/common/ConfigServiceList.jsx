/**
 * Componente reutilizable para mostrar listas de servicios de configuración
 *
 * Recibe configuración de servicios y muestra tarjetas organizadas
 */

import { Card, Badge, Button } from './index';
import { Settings, TestTube, CheckCircle } from 'lucide-react';

const ConfigServiceList = ({
  services = [],
  title = "Servicios",
  onSaveAll = () => {},
  saving = false,
  className = ""
}) => {
  return (
    <Card className={className}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-secondary-900">
            {title} ({services.length})
          </h2>
          <div className="flex items-center gap-3">
            <Button
              variant="gradient"
              size="sm"
              onClick={onSaveAll}
              loading={saving}
              leftIcon={<CheckCircle className="w-3 h-3" />}
            >
              Guardar Todos
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {services.map((service, index) => (
            <div key={service.id || index} className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-purple-300 transition-all duration-300 overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${service.iconBg} rounded-xl flex items-center justify-center shadow-lg`}>
                      <service.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{service.name}</h3>
                      <p className="text-gray-600 text-xs">{service.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={service.isActive ? 'success' : 'warning'}>
                      {service.statusText}
                    </Badge>

                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="xs"
                        leftIcon={<Settings className="w-3 h-3" />}
                        onClick={() => service.onConfigure?.(service)}
                        className={`hover:bg-${service.color}-50 hover:border-${service.color}-300 px-2 py-1 text-xs`}
                      >
                        Configurar
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        leftIcon={<TestTube className="w-3 h-3" />}
                        onClick={() => service.onTest?.(service)}
                        className={`hover:bg-${service.color}-50 hover:border-${service.color}-300 px-2 py-1 text-xs`}
                      >
                        Probar
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-200">
                  {service.metrics.map((metric, metricIndex) => (
                    <div key={metricIndex} className="text-center">
                      <div className={`text-sm font-semibold text-${service.color}-600`}>
                        {metric.value}
                      </div>
                      <div className="text-xs text-secondary-600">{metric.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {services.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No hay servicios configurados
              </h3>
              <p className="text-gray-500">
                Agrega servicios para comenzar a configurar
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ConfigServiceList;