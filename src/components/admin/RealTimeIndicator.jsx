/**
 * Real Time Indicator Component
 * 
 * Componente para mostrar estado de conexión y actualizaciones en tiempo real
 * Indicador visual de performance del sistema
 */

import React, { useState, useEffect } from 'react';
import { Badge } from '../common';
import {
  Wifi,
  WifiOff,
  Activity,
  Clock,
  Zap,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const RealTimeIndicator = ({ 
  connectionStatus = 'connected',
  lastUpdate = null,
  updateFrequency = 30000,
  showDetails = false 
}) => {
  const [timeSinceLastUpdate, setTimeSinceLastUpdate] = useState(0);
  const [isPulsing, setIsPulsing] = useState(true);

  // Calcular tiempo desde última actualización
  useEffect(() => {
    if (!lastUpdate) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const lastUpdateTime = new Date(lastUpdate).getTime();
      const diff = now - lastUpdateTime;
      setTimeSinceLastUpdate(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdate]);

  // Efecto de pulsado para indicador activo
  useEffect(() => {
    if (connectionStatus === 'connected') {
      const pulseInterval = setInterval(() => {
        setIsPulsing(prev => !prev);
      }, 2000);

      return () => clearInterval(pulseInterval);
    } else {
      setIsPulsing(false);
    }
  }, [connectionStatus]);

  // Obtener color y texto del estado
  const getStatusInfo = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          color: 'success',
          text: 'Conectado',
          icon: Wifi,
          description: 'Sincronización en tiempo real activa'
        };
      case 'connecting':
        return {
          color: 'warning',
          text: 'Conectando',
          icon: Activity,
          description: 'Estableciendo conexión...'
        };
      case 'disconnected':
        return {
          color: 'danger',
          text: 'Desconectado',
          icon: WifiOff,
          description: 'Sin conexión en tiempo real'
        };
      case 'error':
        return {
          color: 'danger',
          text: 'Error',
          icon: AlertCircle,
          description: 'Error en la conexión'
        };
      default:
        return {
          color: 'secondary',
          text: 'Desconocido',
          icon: AlertCircle,
          description: 'Estado de conexión desconocido'
        };
    }
  };

  // Formatear tiempo desde última actualización
  const formatTimeSinceUpdate = (ms) => {
    if (ms < 1000) return 'Ahora';
    if (ms < 60000) return `Hace ${Math.floor(ms / 1000)}s`;
    if (ms < 3600000) return `Hace ${Math.floor(ms / 60000)}m`;
    return `Hace ${Math.floor(ms / 3600000)}h`;
  };

  // Determinar si los datos están stale
  const isStale = timeSinceLastUpdate > updateFrequency * 2; // 2x el intervalo de actualización

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  // Versión compacta (solo indicador)
  if (!showDetails) {
    return (
      <div className="flex items-center gap-2">
        <div className={`relative ${isPulsing && connectionStatus === 'connected' ? 'animate-pulse' : ''}`}>
          <div className={`w-2 h-2 rounded-full bg-${statusInfo.color}-500`} />
          {connectionStatus === 'connected' && (
            <div className={`absolute inset-0 w-2 h-2 rounded-full bg-${statusInfo.color}-500 animate-ping`} />
          )}
        </div>
        <span className={`text-xs font-medium text-${statusInfo.color}-600`}>
          {statusInfo.text}
        </span>
        {lastUpdate && (
          <span className="text-xs text-gray-500">
            {formatTimeSinceUpdate(timeSinceLastUpdate)}
          </span>
        )}
      </div>
    );
  }

  // Versión detallada
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`relative ${isPulsing && connectionStatus === 'connected' ? 'animate-pulse' : ''}`}>
            <div className={`w-3 h-3 rounded-full bg-${statusInfo.color}-500`} />
            {connectionStatus === 'connected' && (
              <div className={`absolute inset-0 w-3 h-3 rounded-full bg-${statusInfo.color}-500 animate-ping`} />
            )}
          </div>
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-4 h-4 text-${statusInfo.color}-600`} />
            <span className={`text-sm font-semibold text-${statusInfo.color}-600`}>
              {statusInfo.text}
            </span>
          </div>
        </div>
        
        <Badge
          variant={isStale ? 'warning' : 'success'}
          size="sm"
        >
          {isStale ? 'Datos desactualizados' : 'Datos actualizados'}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Estado:</span>
          <span className={`font-medium text-${statusInfo.color}-600`}>
            {statusInfo.description}
          </span>
        </div>

        {lastUpdate && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Última actualización:
            </span>
            <span className={`font-medium ${isStale ? 'text-orange-600' : 'text-green-600'}`}>
              {formatTimeSinceUpdate(timeSinceLastUpdate)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Frecuencia:
          </span>
          <span className="font-medium text-gray-900">
            {updateFrequency / 1000}s
          </span>
        </div>

        {/* Indicador de rendimiento */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Rendimiento:</span>
            <div className="flex items-center gap-1">
              {connectionStatus === 'connected' && !isStale && (
                <>
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-green-600 font-medium">Óptimo</span>
                </>
              )}
              {isStale && (
                <>
                  <AlertCircle className="w-3 h-3 text-orange-500" />
                  <span className="text-orange-600 font-medium">Lento</span>
                </>
              )}
              {connectionStatus !== 'connected' && (
                <>
                  <AlertCircle className="w-3 h-3 text-red-500" />
                  <span className="text-red-600 font-medium">Sin conexión</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Barra de progreso de actualización */}
        {lastUpdate && (
          <div className="pt-2">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className={`h-1 rounded-full transition-all duration-1000 ${
                  isStale ? 'bg-orange-500' : 'bg-green-500'
                }`}
                style={{
                  width: `${Math.max(0, 100 - (timeSinceLastUpdate / updateFrequency) * 100)}%`
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">
              Próxima actualización en {Math.max(0, Math.ceil((updateFrequency - timeSinceLastUpdate) / 1000))}s
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimeIndicator;