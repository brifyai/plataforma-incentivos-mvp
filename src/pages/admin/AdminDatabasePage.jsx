/**
 * Admin Database Page - Gestión de Base de Datos
 *
 * Página administrativa para gestionar la base de datos y migraciones
 */

import { useState, useEffect } from 'react';
import { Card, Badge, Button, LoadingSpinner } from '../../components/common';
import { Database, Server, HardDrive, Zap, Download, Upload, RefreshCw, AlertTriangle, Activity, Users, Building, CreditCard, Eye, EyeOff } from 'lucide-react';
import { getDatabaseTableStats, getDatabaseStats, getDatabaseSystemInfo } from '../../services/databaseService';

const AdminDatabasePage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dbStats, setDbStats] = useState(null);
  const [tableStats, setTableStats] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);
  const [showTableDetails, setShowTableDetails] = useState(false);

  useEffect(() => {
    loadDatabaseData();
  }, []);

  const loadDatabaseData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsResult, tableResult, systemResult] = await Promise.all([
        getDatabaseStats(),
        getDatabaseTableStats(),
        getDatabaseSystemInfo()
      ]);

      if (statsResult.error) {
        setError('Error al cargar estadísticas de la base de datos');
        console.error('Database stats error:', statsResult.error);
      } else {
        setDbStats(statsResult.dbStats);
      }

      if (tableResult.error) {
        console.error('Table stats error:', tableResult.error);
      } else {
        setTableStats(tableResult.tableStats);
      }

      if (systemResult.error) {
        console.error('System info error:', systemResult.error);
      } else {
        setSystemInfo(systemResult.systemInfo);
      }
    } catch (error) {
      console.error('Error loading database data:', error);
      setError('Error al cargar los datos de la base de datos');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStats = async () => {
    setIsRefreshing(true);
    await loadDatabaseData();
    setIsRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'danger': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return '🟢';
      case 'warning': return '🟡';
      case 'danger': return '🔴';
      default: return '⚪';
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar datos de la base de datos</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => loadDatabaseData()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Modern Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-strong">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Database className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight">
                Gestión de Base de Datos
              </h1>
              <p className="text-blue-100 text-lg">
                Monitoreo y administración completa de PostgreSQL
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="px-4 py-2 bg-white/10 border-white/30 text-white">
              <Server className="w-4 h-4 mr-2" />
              PostgreSQL
            </Badge>
            <Button
              variant="gradient"
              onClick={handleRefreshStats}
              loading={isRefreshing}
              leftIcon={<RefreshCw className="w-4 h-4" />}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0"
            >
              Actualizar
            </Button>
          </div>
        </div>

        {/* Quick Stats in Header */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-blue-300" />
              <div>
                <p className="text-sm text-blue-100">Disponibilidad</p>
                <p className="text-2xl font-bold">{dbStats?.availability || 0}%</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <HardDrive className="w-6 h-6 text-blue-300" />
              <div>
                <p className="text-sm text-blue-100">Almacenamiento</p>
                <p className="text-2xl font-bold">{dbStats?.storageUsed || 0}GB</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-blue-300" />
              <div>
                <p className="text-sm text-blue-100">Latencia</p>
                <p className="text-2xl font-bold">{dbStats?.avgLatency || 0}ms</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-blue-300" />
              <div>
                <p className="text-sm text-blue-100">Tablas</p>
                <p className="text-2xl font-bold">{dbStats?.activeTables || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Database Tables Overview */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-secondary-900">Tablas de la Base de Datos</h3>
              <p className="text-secondary-600 mt-1">Estado y estadísticas de todas las tablas del sistema</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTableDetails(!showTableDetails)}
                leftIcon={showTableDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              >
                {showTableDetails ? 'Ocultar Detalles' : 'Ver Detalles'}
              </Button>
              <Badge variant="primary" className="px-3 py-1">
                {tableStats.length} Tablas
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tableStats.map((table) => {
              const getTableIcon = (tableName) => {
                if (tableName.includes('user')) return <Users className="w-5 h-5" />;
                if (tableName.includes('company') || tableName.includes('client')) return <Building className="w-5 h-5" />;
                if (tableName.includes('payment') || tableName.includes('transaction')) return <CreditCard className="w-5 h-5" />;
                if (tableName.includes('debt') || tableName.includes('agreement') || tableName.includes('offer')) return <Database className="w-5 h-5" />;
                return <Database className="w-5 h-5" />;
              };

              return (
                <div key={table.name} className="p-4 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getStatusColor(table.status)}`}>
                        {getTableIcon(table.name)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-secondary-900 capitalize text-sm">
                          {table.name.replace(/_/g, ' ')}
                        </h4>
                        <div className="flex items-center gap-1">
                          <span className="text-xs">{getStatusIcon(table.status)}</span>
                          <span className="text-xs text-secondary-600 capitalize">{table.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-secondary-600">Registros</span>
                      <span className="font-bold text-secondary-900">{table.records.toLocaleString()}</span>
                    </div>
                    {showTableDetails && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-secondary-600">Tamaño</span>
                          <span className="font-medium text-secondary-700">{table.size}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-secondary-600">Estado</span>
                          <Badge
                            variant={
                              table.status === 'healthy' ? 'success' :
                              table.status === 'warning' ? 'warning' : 'danger'
                            }
                            size="sm"
                          >
                            {table.status === 'healthy' ? 'Saludable' :
                             table.status === 'warning' ? 'Advertencia' : 'Problema'}
                          </Badge>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Database Actions & System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-green-100 rounded-lg">
                <RefreshCw className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-secondary-900">Acciones de Mantenimiento</h3>
                <p className="text-secondary-600">Operaciones de mantenimiento de la base de datos</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer group">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                  <div>
                    <h4 className="font-medium text-secondary-900">Backup Completo</h4>
                    <p className="text-sm text-secondary-600">Crear copia de seguridad</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  Ejecutar
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200 hover:shadow-md transition-all duration-200 cursor-pointer group">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
                  <div>
                    <h4 className="font-medium text-secondary-900">Optimizar Tablas</h4>
                    <p className="text-sm text-secondary-600">Mejorar rendimiento</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  Ejecutar
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200 hover:shadow-md transition-all duration-200 cursor-pointer group">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 group-hover:scale-110 transition-transform" />
                  <div>
                    <h4 className="font-medium text-secondary-900">Verificar Integridad</h4>
                    <p className="text-sm text-secondary-600">Comprobar consistencia</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  Ejecutar
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Server className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-secondary-900">Estado del Sistema</h3>
                <p className="text-secondary-600">Información del sistema y conexiones</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-secondary-900">Última Migración</h4>
                  <Badge variant={systemInfo?.lastMigration?.status === 'success' ? 'success' : 'danger'}>
                    {systemInfo?.lastMigration?.status === 'success' ? 'Exitosa' : 'Fallida'}
                  </Badge>
                </div>
                <p className="text-sm text-secondary-600">
                  {systemInfo?.lastMigration?.name || 'N/A'} - {systemInfo?.lastMigration?.executedAt ? new Date(systemInfo.lastMigration.executedAt).toLocaleDateString('es-ES') : 'N/A'}
                </p>
              </div>

              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-secondary-900">Estado RLS</h4>
                  <Badge variant={systemInfo?.rlsStatus === 'enabled' ? 'success' : 'danger'}>
                    {systemInfo?.rlsStatus === 'enabled' ? 'Activado' : 'Desactivado'}
                  </Badge>
                </div>
                <p className="text-sm text-secondary-600">
                  Políticas de seguridad {systemInfo?.rlsStatus === 'enabled' ? 'activas' : 'inactivas'}
                </p>
              </div>

              <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-secondary-900">Conexiones Activas</h4>
                  <Badge variant="primary" className="font-bold">{systemInfo?.activeConnections || 0}</Badge>
                </div>
                <p className="text-sm text-secondary-600">
                  Usuarios conectados actualmente
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDatabasePage;
