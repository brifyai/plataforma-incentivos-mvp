/**
 * Logs Page - Visualización de Logs del Sistema
 *
 * Página dedicada a la visualización y gestión de logs del sistema
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, LoadingSpinner, Input, Select, Modal } from '../../components/common';
import { FileText, AlertCircle, CheckCircle, XCircle, Search, Filter, Download, RefreshCw, Eye, Trash2, Calendar, Clock, User, Server, Database, Shield, Activity } from 'lucide-react';
import { getSystemConfig, updateSystemConfig } from '../../services/databaseService';
import { formatDate } from '../../utils/formatters';
import Swal from 'sweetalert2';

const LogsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showLogDetailModal, setShowLogDetailModal] = useState(false);
  const [showClearLogsModal, setShowClearLogsModal] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);

  // Filtros
  const [filters, setFilters] = useState({
    level: '',
    search: '',
    startDate: '',
    endDate: '',
    module: '',
    user: '',
    ip: ''
  });

  const [quickFilter, setQuickFilter] = useState('');

  // Niveles de log
  const logLevels = [
    { value: 'error', label: 'Error', color: 'red', icon: XCircle },
    { value: 'warning', label: 'Warning', color: 'yellow', icon: AlertCircle },
    { value: 'info', label: 'Info', color: 'blue', icon: FileText },
    { value: 'debug', label: 'Debug', color: 'gray', icon: Activity },
    { value: 'success', label: 'Success', color: 'green', icon: CheckCircle }
  ];

  // Módulos
  const modules = [
    { value: 'auth', label: 'Autenticación' },
    { value: 'database', label: 'Base de Datos' },
    { value: 'api', label: 'API' },
    { value: 'payment', label: 'Pagos' },
    { value: 'security', label: 'Seguridad' },
    { value: 'system', label: 'Sistema' },
    { value: 'email', label: 'Email' },
    { value: 'notification', label: 'Notificaciones' }
  ];

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [filters]);

  useEffect(() => {
    let interval;
    if (realTimeEnabled) {
      interval = setInterval(() => {
        loadLogs();
        loadStats();
      }, 5000); // Actualizar cada 5 segundos
    }
    return () => clearInterval(interval);
  }, [realTimeEnabled, filters]);

  const loadLogs = async () => {
    try {
      if (!refreshing) setLoading(true);
      setError(null);

      const result = await getSystemLogs(filters);
      if (result.error) {
        console.error('Error loading logs:', result.error);
        setError('Error al cargar los logs');
      } else {
        setLogs(result.logs || []);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
      setError('Error al cargar los logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await getLogStats();
      if (result.error) {
        console.error('Error loading stats:', result.error);
      } else {
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadLogs();
    loadStats();
  };

  const handleClearLogs = async () => {
    try {
      const result = await Swal.fire({
        title: '¿Limpiar todos los logs?',
        text: 'Esta acción eliminará permanentemente todos los logs del sistema',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Limpiar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        const clearResult = await clearLogs();
        if (clearResult.error) {
          throw new Error(clearResult.error);
        }

        await Swal.fire({
          icon: 'success',
          title: 'Logs eliminados',
          text: 'Todos los logs han sido eliminados exitosamente',
          confirmButtonText: 'Aceptar'
        });

        loadLogs();
        loadStats();
      }
    } catch (error) {
      console.error('Error clearing logs:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al limpiar logs',
        text: error.message || 'No se pudieron eliminar los logs',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  const handleExportLogs = async () => {
    try {
      const result = await Swal.fire({
        title: 'Exportar Logs',
        text: 'Selecciona el formato de exportación',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Exportar JSON',
        cancelButtonText: 'Exportar CSV',
        showDenyButton: true,
        denyButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        // Exportar JSON
        const exportResult = await exportLogs('json', filters);
        if (exportResult.error) {
          throw new Error(exportResult.error);
        }

        // Descargar archivo
        const blob = new Blob([JSON.stringify(exportResult.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        await Swal.fire({
          icon: 'success',
          title: 'Logs exportados',
          text: 'Los logs han sido exportados exitosamente',
          confirmButtonText: 'Aceptar'
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        // Exportar CSV
        const exportResult = await exportLogs('csv', filters);
        if (exportResult.error) {
          throw new Error(exportResult.error);
        }

        // Descargar archivo CSV
        const blob = new Blob([exportResult.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        await Swal.fire({
          icon: 'success',
          title: 'Logs exportados',
          text: 'Los logs han sido exportados exitosamente',
          confirmButtonText: 'Aceptar'
        });
      }
    } catch (error) {
      console.error('Error exporting logs:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al exportar',
        text: error.message || 'No se pudieron exportar los logs',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  const getLogLevelBadge = (level) => {
    const levelConfig = logLevels.find(l => l.value === level) || logLevels[2];
    const Icon = levelConfig.icon;
    
    return (
      <Badge variant={levelConfig.color} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {levelConfig.label}
      </Badge>
    );
  };

  const getModuleIcon = (module) => {
    const icons = {
      auth: User,
      database: Database,
      api: Server,
      payment: Shield,
      security: Shield,
      system: Activity,
      email: FileText,
      notification: FileText
    };
    return icons[module] || FileText;
  };

  const applyQuickFilter = (filterType) => {
    const now = new Date();
    let startDate = '';
    let endDate = now.toISOString().split('T')[0];

    switch (filterType) {
      case 'today':
        startDate = endDate;
        break;
      case 'last1hour':
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        startDate = oneHourAgo.toISOString().slice(0, 16);
        endDate = now.toISOString().slice(0, 16);
        break;
      case 'last24hours':
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        startDate = twentyFourHoursAgo.toISOString().slice(0, 16);
        endDate = now.toISOString().slice(0, 16);
        break;
      case 'errors':
        setFilters({ ...filters, level: 'error' });
        return;
      default:
        startDate = '';
        endDate = '';
    }

    setFilters({ ...filters, startDate, endDate });
    setQuickFilter(filterType);
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !filters.search ||
      log.message?.toLowerCase().includes(filters.search.toLowerCase()) ||
      log.user?.toLowerCase().includes(filters.search.toLowerCase()) ||
      log.ip?.includes(filters.search);

    const matchesLevel = !filters.level || log.level === filters.level;
    const matchesModule = !filters.module || log.module === filters.module;
    const matchesUser = !filters.user || log.user?.toLowerCase().includes(filters.user.toLowerCase());
    const matchesIP = !filters.ip || log.ip?.includes(filters.ip);

    // Filtrar por fecha
    const matchesDate = !filters.startDate && !filters.endDate ||
                      (filters.startDate && filters.endDate &&
                       new Date(log.timestamp).toISOString().split('T')[0] >= filters.startDate &&
                       new Date(log.timestamp).toISOString().split('T')[0] <= filters.endDate);

    return matchesSearch && matchesLevel && matchesModule && matchesUser && matchesIP && matchesDate;
  });

  const openLogDetail = (log) => {
    setSelectedLog(log);
    setShowLogDetailModal(true);
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar logs</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => loadLogs()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-orange-700 to-red-600 rounded-3xl p-4 text-white shadow-strong animate-fade-in">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
        </div>

        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold tracking-tight">
                  Logs del Sistema
                </h1>
                <p className="text-orange-100 text-sm">
                  Monitoreo y auditoría en tiempo real
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={realTimeEnabled ? "gradient" : "outline"}
                size="sm"
                onClick={() => setRealTimeEnabled(!realTimeEnabled)}
                leftIcon={<RefreshCw className={`w-4 h-4 ${realTimeEnabled ? 'animate-spin' : ''}`} />}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                {realTimeEnabled ? 'Tiempo Real' : 'Activar Tiempo Real'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-4">
          <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
            <div className="p-1">
              <div className="flex items-center justify-center mb-2">
                <div className="p-1.5 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg group-hover:shadow-glow-blue transition-all duration-300">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
                {stats.total.toLocaleString()}
              </h3>
              <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Total Logs</p>
            </div>
          </Card>

          <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
            <div className="p-1">
              <div className="flex items-center justify-center mb-2">
                <div className="p-1.5 bg-gradient-to-br from-red-100 to-red-200 rounded-lg group-hover:shadow-glow-red transition-all duration-300">
                  <XCircle className="w-4 h-4 text-red-600" />
                </div>
              </div>
              <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
                {stats.errors.toLocaleString()}
              </h3>
              <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Errores</p>
            </div>
          </Card>

          <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
            <div className="p-1">
              <div className="flex items-center justify-center mb-2">
                <div className="p-1.5 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg group-hover:shadow-glow-yellow transition-all duration-300">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                </div>
              </div>
              <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
                {stats.warnings.toLocaleString()}
              </h3>
              <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Warnings</p>
            </div>
          </Card>

          <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
            <div className="p-1">
              <div className="flex items-center justify-center mb-2">
                <div className="p-1.5 bg-gradient-to-br from-green-100 to-green-200 rounded-lg group-hover:shadow-glow-green transition-all duration-300">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
                {stats.success.toLocaleString()}
              </h3>
              <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Éxitos</p>
            </div>
          </Card>

          <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
            <div className="p-1">
              <div className="flex items-center justify-center mb-2">
                <div className="p-1.5 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg group-hover:shadow-glow-purple transition-all duration-300">
                  <Activity className="w-4 h-4 text-purple-600" />
                </div>
              </div>
              <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
                {stats.today.toLocaleString()}
              </h3>
              <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Hoy</p>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="flex flex-wrap gap-4 items-start">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar en logs..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filters.level}
                onChange={(e) => setFilters({...filters, level: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los niveles</option>
                {logLevels.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-gray-400" />
              <select
                value={filters.module}
                onChange={(e) => setFilters({...filters, module: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los módulos</option>
                {modules.map(module => (
                  <option key={module.value} value={module.value}>{module.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">hasta</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-sm text-gray-600">Filtros rápidos:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyQuickFilter('today')}
              className="text-xs px-3 py-1 h-8"
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyQuickFilter('last1hour')}
              className="text-xs px-3 py-1 h-8"
            >
              Última hora
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyQuickFilter('last24hours')}
              className="text-xs px-3 py-1 h-8"
            >
              Últimas 24h
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyQuickFilter('errors')}
              className="text-xs px-3 py-1 h-8 text-red-600 border-red-300"
            >
              Solo errores
            </Button>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Logs del Sistema ({filteredLogs.length})
        </h2>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            loading={refreshing}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Actualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportLogs}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Exportar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowClearLogsModal(true)}
            leftIcon={<Trash2 className="w-4 h-4" />}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            Limpiar
          </Button>
        </div>
      </div>

      {/* Logs List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nivel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Módulo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mensaje
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No se encontraron logs</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const ModuleIcon = getModuleIcon(log.module);
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {formatDate(log.timestamp, 'short')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getLogLevelBadge(log.level)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <ModuleIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{log.module}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {log.message}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.user || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.ip || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Eye className="w-4 h-4" />}
                          onClick={() => openLogDetail(log)}
                        >
                          Ver
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Log Detail Modal */}
      <Modal
        isOpen={showLogDetailModal}
        onClose={() => setShowLogDetailModal(false)}
        title="Detalle del Log"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                <p className="text-sm text-gray-900">{formatDate(selectedLog.timestamp)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nivel</label>
                <div>{getLogLevelBadge(selectedLog.level)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Módulo</label>
                <p className="text-sm text-gray-900">{selectedLog.module}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Usuario</label>
                <p className="text-sm text-gray-900">{selectedLog.user || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">IP</label>
                <p className="text-sm text-gray-900">{selectedLog.ip || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">User Agent</label>
                <p className="text-sm text-gray-900 truncate">{selectedLog.userAgent || 'N/A'}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mensaje</label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedLog.message}</p>
              </div>
            </div>

            {selectedLog.context && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contexto</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <pre className="text-xs text-gray-900 overflow-x-auto">
                    {JSON.stringify(selectedLog.context, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowLogDetailModal(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Clear Logs Confirmation Modal */}
      <Modal
        isOpen={showClearLogsModal}
        onClose={() => setShowClearLogsModal(false)}
        title="Confirmar Limpieza de Logs"
        size="md"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="p-4 bg-red-100 rounded-2xl inline-block mb-4">
              <Trash2 className="w-12 h-12 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              ¿Estás seguro de limpiar todos los logs?
            </h3>
            <p className="text-gray-600">
              Esta acción eliminará permanentemente todos los logs del sistema.
              Esta acción no se puede deshacer.
            </p>
          </div>

          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900 mb-1">Advertencia</h4>
                <p className="text-sm text-red-700">
                  Al eliminar los logs, perderás toda la información de auditoría y monitoreo.
                  Esto puede afectar la capacidad de investigar problemas o incidentes futuros.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setShowClearLogsModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleClearLogs}
              className="flex-1 bg-red-600 hover:bg-red-700"
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Limpiar Logs
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LogsPage;