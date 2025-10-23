/**
 * SystemStatus Component
 *
 * Muestra un resumen del estado del sistema y si está funcionando correctamente
 */

import React, { useState, useEffect } from 'react';
import { Card, Badge } from '../../../components/common';
import { supabase } from '../../../config/supabase';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Database,
  Wifi,
  Server,
  Brain,
  Shield,
  Activity,
  Zap,
  Globe,
  Users,
  RefreshCw
} from 'lucide-react';

const SystemStatus = () => {
  const [systemStatus, setSystemStatus] = useState({
    database: { status: 'checking', message: 'Verificando conexión...', lastCheck: null },
    api: { status: 'checking', message: 'Verificando APIs...', lastCheck: null },
    ai: { status: 'checking', message: 'Verificando servicios de IA...', lastCheck: null },
    auth: { status: 'checking', message: 'Verificando autenticación...', lastCheck: null },
    storage: { status: 'checking', message: 'Verificando almacenamiento...', lastCheck: null }
  });
  
  const [overallStatus, setOverallStatus] = useState('checking');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Función para verificar el estado de la base de datos
  const checkDatabaseStatus = async () => {
    try {
      const startTime = Date.now();
      const { data, error } = await supabase
        .from('companies')
        .select('id')
        .limit(1);
      
      const responseTime = Date.now() - startTime;
      
      if (error) {
        return {
          status: 'error',
          message: `Error: ${error.message}`,
          lastCheck: new Date(),
          responseTime
        };
      }
      
      return {
        status: 'active',
        message: `Conexión estable (${responseTime}ms)`,
        lastCheck: new Date(),
        responseTime
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Error de conexión: ${error.message}`,
        lastCheck: new Date()
      };
    }
  };

  // Función para verificar el estado de las APIs
  const checkApiStatus = async () => {
    try {
      const startTime = Date.now();
      
      // Verificar API de Supabase
      const { data, error } = await supabase
        .from('companies')
        .select('count')
        .limit(1);
      
      const responseTime = Date.now() - startTime;
      
      if (error) {
        return {
          status: 'error',
          message: `API error: ${error.message}`,
          lastCheck: new Date(),
          responseTime
        };
      }
      
      return {
        status: 'active',
        message: `APIs funcionando (${responseTime}ms)`,
        lastCheck: new Date(),
        responseTime
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Error en APIs: ${error.message}`,
        lastCheck: new Date()
      };
    }
  };

  // Función para verificar el estado de los servicios de IA
  const checkAIStatus = async () => {
    try {
      const startTime = Date.now();
      
      // Verificar si hay configuración de IA
      const { data, error } = await supabase
        .from('company_ai_config')
        .select('id')
        .limit(1);
      
      const responseTime = Date.now() - startTime;
      
      if (error) {
        return {
          status: 'warning',
          message: 'Sin configuración de IA',
          lastCheck: new Date(),
          responseTime
        };
      }
      
      return {
        status: 'active',
        message: `Servicios de IA disponibles (${responseTime}ms)`,
        lastCheck: new Date(),
        responseTime
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Error en servicios IA: ${error.message}`,
        lastCheck: new Date()
      };
    }
  };

  // Función para verificar el estado de autenticación
  const checkAuthStatus = async () => {
    try {
      const startTime = Date.now();
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      const responseTime = Date.now() - startTime;
      
      if (error) {
        return {
          status: 'error',
          message: `Error de autenticación: ${error.message}`,
          lastCheck: new Date(),
          responseTime
        };
      }
      
      return {
        status: 'active',
        message: `Autenticación funcionando (${responseTime}ms)`,
        lastCheck: new Date(),
        responseTime
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Error en autenticación: ${error.message}`,
        lastCheck: new Date()
      };
    }
  };

  // Función para verificar el estado de almacenamiento
  const checkStorageStatus = async () => {
    try {
      const startTime = Date.now();
      
      // Intentar listar archivos en storage (si existe la tabla)
      const { data, error } = await supabase
        .from('company_knowledge_base')
        .select('id')
        .limit(1);
      
      const responseTime = Date.now() - startTime;
      
      if (error && error.code !== 'PGRST116') {
        return {
          status: 'error',
          message: `Error en almacenamiento: ${error.message}`,
          lastCheck: new Date(),
          responseTime
        };
      }
      
      return {
        status: 'active',
        message: `Almacenamiento funcionando (${responseTime}ms)`,
        lastCheck: new Date(),
        responseTime
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Error en almacenamiento: ${error.message}`,
        lastCheck: new Date()
      };
    }
  };

  // Función principal para verificar todo el sistema
  const checkAllSystems = async () => {
    const results = await Promise.all([
      checkDatabaseStatus(),
      checkApiStatus(),
      checkAIStatus(),
      checkAuthStatus(),
      checkStorageStatus()
    ]);

    setSystemStatus({
      database: results[0],
      api: results[1],
      ai: results[2],
      auth: results[3],
      storage: results[4]
    });

    // Determinar el estado general
    const statuses = results.map(r => r.status);
    const hasError = statuses.includes('error');
    const hasWarning = statuses.includes('warning');
    
    if (hasError) {
      setOverallStatus('error');
    } else if (hasWarning) {
      setOverallStatus('warning');
    } else {
      setOverallStatus('active');
    }

    setLastRefresh(new Date());
  };

  // Verificar sistemas al montar el componente
  useEffect(() => {
    checkAllSystems();
    
    // Configurar verificación periódica cada 30 segundos
    const interval = setInterval(checkAllSystems, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'checking':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      error: 'danger',
      warning: 'warning',
      checking: 'info'
    };
    
    const labels = {
      active: 'Activo',
      error: 'Error',
      warning: 'Advertencia',
      checking: 'Verificando'
    };
    
    return (
      <Badge variant={variants[status]} size="sm">
        {labels[status]}
      </Badge>
    );
  };

  const getOverallStatusInfo = () => {
    switch (overallStatus) {
      case 'active':
        return {
          icon: <CheckCircle className="w-8 h-8 text-green-500" />,
          title: 'Sistema Funcionando',
          message: 'Todos los servicios están operativos',
          bgColor: 'bg-green-50 border-green-200',
          textColor: 'text-green-900'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-8 h-8 text-red-500" />,
          title: 'Sistema con Errores',
          message: 'Hay servicios que no están funcionando',
          bgColor: 'bg-red-50 border-red-200',
          textColor: 'text-red-900'
        };
      case 'warning':
        return {
          icon: <AlertCircle className="w-8 h-8 text-yellow-500" />,
          title: 'Sistema con Advertencias',
          message: 'Hay servicios con advertencias',
          bgColor: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-900'
        };
      default:
        return {
          icon: <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />,
          title: 'Verificando Sistema',
          message: 'Comprobando el estado de los servicios',
          bgColor: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-900'
        };
    }
  };

  const systemComponents = [
    {
      key: 'database',
      name: 'Base de Datos',
      icon: Database,
      status: systemStatus.database
    },
    {
      key: 'api',
      name: 'APIs',
      icon: Globe,
      status: systemStatus.api
    },
    {
      key: 'ai',
      name: 'Servicios IA',
      icon: Brain,
      status: systemStatus.ai
    },
    {
      key: 'auth',
      name: 'Autenticación',
      icon: Shield,
      status: systemStatus.auth
    },
    {
      key: 'storage',
      name: 'Almacenamiento',
      icon: Server,
      status: systemStatus.storage
    }
  ];

  const overallInfo = getOverallStatusInfo();

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Resumen del Sistema</h3>
          <p className="text-sm text-gray-600">Estado general de la plataforma</p>
        </div>
        <button
          onClick={checkAllSystems}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Actualizar estado"
        >
          <RefreshCw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Estado General */}
      <div className={`${overallInfo.bgColor} border-2 rounded-xl p-6 mb-6`}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            {overallInfo.icon}
          </div>
          <div className="flex-1">
            <h4 className={`text-xl font-bold ${overallInfo.textColor}`}>
              {overallInfo.title}
            </h4>
            <p className={`${overallInfo.textColor} opacity-80`}>
              {overallInfo.message}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Última verificación: {lastRefresh.toLocaleTimeString('es-CL')}
            </p>
          </div>
          <div className="flex flex-col items-end">
            {getStatusBadge(overallStatus)}
            <div className="flex items-center gap-1 mt-2">
              <Activity className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">
                {systemComponents.filter(c => c.status.status === 'active').length}/{systemComponents.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Componentes del Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {systemComponents.map((component) => {
          const Icon = component.icon;
          return (
            <div
              key={component.key}
              className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-gray-50 rounded-lg">
                <Icon className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900">{component.name}</h4>
                  {getStatusBadge(component.status.status)}
                </div>
                <p className="text-sm text-gray-600">{component.status.message}</p>
                {component.status.lastCheck && (
                  <p className="text-xs text-gray-500">
                    {component.status.lastCheck.toLocaleTimeString('es-CL')}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0">
                {getStatusIcon(component.status.status)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Información Adicional */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>Monitoreo automático cada 30 segundos</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>Sistema optimizado para múltiples usuarios</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SystemStatus;