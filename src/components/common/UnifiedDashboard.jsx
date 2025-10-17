/**
 * Unified Dashboard Component
 * 
 * Componente que muestra métricas compartidas entre portales empresas-personas
 * Proporciona vista consolidada del progreso financiero y estado de negociaciones
 */

import React, { useState, useEffect } from 'react';
import { Card, LoadingSpinner, Badge } from './index';
import { useEcosystemSync } from '../../hooks/useEcosystemSync';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Building,
  DollarSign,
  Activity,
  Bell,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  BarChart3,
  PieChart,
  Target,
  Zap,
  Globe,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';

const UnifiedDashboard = ({ 
  userType = 'company', 
  timeRange = '30d',
  showNotifications = true,
  showRealTimeStatus = true,
  compact = false 
}) => {
  const {
    isConnected,
    syncStatus,
    sharedStates,
    crossNotifications,
    unifiedMetrics,
    lastSyncTime,
    syncErrors,
    forceSync,
    clearNotifications,
    getSyncStatus
  } = useEcosystemSync({
    userType,
    enableRealTime: true,
    autoConnect: true,
    onSyncEvent: handleSyncEvent,
    onCrossNotification: handleCrossNotification,
    onMetricsUpdate: handleMetricsUpdate
  });

  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedMetrics, setExpandedMetrics] = useState(false);

  // Manejadores de eventos
  function handleSyncEvent(eventData) {
    console.log('🔄 Sync event received:', eventData);
  }

  function handleCrossNotification(notification) {
    console.log('📨 Cross notification received:', notification);
  }

  function handleMetricsUpdate(metricsData) {
    console.log('📊 Metrics updated:', metricsData);
  }

  // Calcular métricas consolidadas
  const getConsolidatedMetrics = () => {
    if (!unifiedMetrics || unifiedMetrics.length === 0) {
      return {
        totalNegotiations: 0,
        activeNegotiations: 0,
        completedNegotiations: 0,
        totalVolume: 0,
        successRate: 0,
        averageResponseTime: 0,
        crossPortalActivity: 0
      };
    }

    const metrics = unifiedMetrics.reduce((acc, metric) => {
      return {
        totalNegotiations: acc.totalNegotiations + (metric.total_negotiations || 0),
        activeNegotiations: acc.activeNegotiations + (metric.active_negotiations || 0),
        completedNegotiations: acc.completedNegotiations + (metric.completed_negotiations || 0),
        totalVolume: acc.totalVolume + (metric.total_volume || 0),
        successRate: acc.successRate + (metric.success_rate || 0),
        averageResponseTime: acc.averageResponseTime + (metric.average_response_time || 0),
        crossPortalActivity: acc.crossPortalActivity + (metric.cross_portal_activity || 0)
      };
    }, {
      totalNegotiations: 0,
      activeNegotiations: 0,
      completedNegotiations: 0,
      totalVolume: 0,
      successRate: 0,
      averageResponseTime: 0,
      crossPortalActivity: 0
    });

    // Calcular promedios
    const count = unifiedMetrics.length || 1;
    metrics.successRate = metrics.successRate / count;
    metrics.averageResponseTime = metrics.averageResponseTime / count;

    return metrics;
  };

  const metrics = getConsolidatedMetrics();

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Obtener color según estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'connecting': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Obtener icono según dispositivo
  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      case 'desktop': return <Monitor className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  if (!isConnected && syncStatus === 'connecting') {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner text="Conectando con ecosistema..." />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${compact ? 'space-y-4' : ''}`}>
      {/* Header con estado de sincronización */}
      {showRealTimeStatus && (
        <Card className={`${compact ? 'p-4' : 'p-6'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getStatusColor(syncStatus)}`}>
                {syncStatus === 'connected' ? (
                  <RefreshCw className="w-5 h-5" />
                ) : syncStatus === 'connecting' ? (
                  <Clock className="w-5 h-5 animate-spin" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`}>
                  Ecosistema Conectado
                </h3>
                <p className={`text-gray-600 ${compact ? 'text-xs' : 'text-sm'}`}>
                  {syncStatus === 'connected' 
                    ? `Sincronizado: ${lastSyncTime?.toLocaleTimeString()}`
                    : syncStatus === 'connecting'
                    ? 'Estableciendo conexión...'
                    : 'Error de conexión'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {syncErrors.length > 0 && (
                <div className="relative">
                  <div className="p-2 bg-red-100 rounded-lg cursor-pointer hover:bg-red-200 transition-colors">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
              )}
              
              <button
                onClick={forceSync}
                className="p-2 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                title="Forzar sincronización"
              >
                <RefreshCw className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          </div>

          {/* Errores de sincronización */}
          {syncErrors.length > 0 && (
            <div className="mt-4 space-y-2">
              {syncErrors.slice(-2).map((error, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <p className="text-xs text-red-700 flex-1">{error.message}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Notificaciones cruzadas */}
      {showNotifications && crossNotifications.length > 0 && (
        <Card className={`${compact ? 'p-4' : 'p-6'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <h3 className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`}>
                Notificaciones del Ecosistema
              </h3>
              <Badge variant="primary" size="sm">
                {crossNotifications.length}
              </Badge>
            </div>
            <button
              onClick={clearNotifications}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Limpiar
            </button>
          </div>
          
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {crossNotifications.slice(0, 5).map((notification, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-1 bg-blue-100 rounded-full">
                  <Bell className="w-3 h-3 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title || 'Notificación'}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Métricas Consolidadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`${compact ? 'p-4' : 'p-6'} hover:shadow-lg transition-shadow`}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <Badge variant={metrics.activeNegotiations > 0 ? 'success' : 'secondary'} size="sm">
              Activo
            </Badge>
          </div>
          <div className={`font-bold ${compact ? 'text-xl' : 'text-2xl'} text-gray-900`}>
            {metrics.totalNegotiations}
          </div>
          <p className="text-sm text-gray-600">Negociaciones Totales</p>
          <div className="mt-2 text-xs text-gray-500">
            {metrics.activeNegotiations} activas
          </div>
        </Card>

        <Card className={`${compact ? 'p-4' : 'p-6'} hover:shadow-lg transition-shadow`}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <Badge variant="success" size="sm">
              {Math.round(metrics.successRate)}%
            </Badge>
          </div>
          <div className={`font-bold ${compact ? 'text-xl' : 'text-2xl'} text-gray-900`}>
            {metrics.completedNegotiations}
          </div>
          <p className="text-sm text-gray-600">Completadas</p>
          <div className="mt-2 text-xs text-green-600">
            Tasa de éxito
          </div>
        </Card>

        <Card className={`${compact ? 'p-4' : 'p-6'} hover:shadow-lg transition-shadow`}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <Badge variant="primary" size="sm">
              Total
            </Badge>
          </div>
          <div className={`font-bold ${compact ? 'text-xl' : 'text-2xl'} text-gray-900`}>
            {formatCurrency(metrics.totalVolume)}
          </div>
          <p className="text-sm text-gray-600">Volumen</p>
          <div className="mt-2 text-xs text-purple-600">
            Cross-portal
          </div>
        </Card>

        <Card className={`${compact ? 'p-4' : 'p-6'} hover:shadow-lg transition-shadow`}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Activity className="w-5 h-5 text-orange-600" />
            </div>
            <Badge variant="warning" size="sm">
              {metrics.crossPortalActivity}
            </Badge>
          </div>
          <div className={`font-bold ${compact ? 'text-xl' : 'text-2xl'} text-gray-900`}>
            {metrics.crossPortalActivity}
          </div>
          <p className="text-sm text-gray-600">Actividad</p>
          <div className="mt-2 text-xs text-orange-600">
            Entre portales
          </div>
        </Card>
      </div>

      {/* Estados Compartidos */}
      {sharedStates.size > 0 && (
        <Card className={`${compact ? 'p-4' : 'p-6'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-600" />
              <h3 className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`}>
                Estados Compartidos
              </h3>
            </div>
            <Badge variant="secondary" size="sm">
              {sharedStates.size}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from(sharedStates.entries()).slice(0, 4).map(([entityId, state]) => (
              <div key={entityId} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    {state.entity_type}
                  </span>
                  <Badge 
                    variant={state.state_data?.status === 'active' ? 'success' : 'secondary'} 
                    size="xs"
                  >
                    {state.state_data?.status || 'Unknown'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 truncate">
                  ID: {entityId}
                </p>
                <p className="text-xs text-gray-500">
                  Actualizado: {new Date(state.updated_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Indicadores de Dispositivos */}
      <Card className={`${compact ? 'p-4' : 'p-6'}`}>
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-blue-600" />
          <h3 className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`}>
            Experiencia Multi-Dispositivo
          </h3>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Smartphone className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">Móvil</p>
            <p className="text-xs text-gray-600">Responsive</p>
          </div>
          
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Tablet className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">Tablet</p>
            <p className="text-xs text-gray-600">Optimizado</p>
          </div>
          
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Monitor className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">Desktop</p>
            <p className="text-xs text-gray-600">Completo</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UnifiedDashboard;