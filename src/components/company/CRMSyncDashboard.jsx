/**
 * CRM Synchronization Dashboard Component
 *
 * Dashboard para monitorear la sincronización y matching de contactos CRM
 * Muestra estadísticas en tiempo real y permite gestionar el proceso de matching
 *
 * @module CRMSyncDashboard
 */

import { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal } from '../common';
import crmMatchingService from '../../services/crmMatchingService';
import {
  BarChart3,
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  TrendingUp,
  Target,
  Zap
} from 'lucide-react';

const CRMSyncDashboard = ({ profile, onUpdate }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncModal, setSyncModal] = useState(false);
  const [syncResults, setSyncResults] = useState(null);

  // Cargar estadísticas al montar
  useEffect(() => {
    loadStats();
  }, [profile?.company?.id]);

  const loadStats = async () => {
    if (!profile?.company?.id) return;

    try {
      setLoading(true);
      const result = await crmMatchingService.getMatchingStats(profile.company.id);

      if (result.success) {
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Error loading CRM stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncModal(true);
    setSyncResults(null);

    try {
      // Aquí iría la lógica para sincronizar con el CRM configurado
      // Por ahora simulamos resultados
      setTimeout(() => {
        setSyncResults({
          success: true,
          processed: 150,
          matched: 120,
          autoAssigned: 95,
          needsReview: 25,
          rejected: 5,
          duration: 45,
          message: 'Sincronización completada exitosamente'
        });
      }, 2000);
    } catch (error) {
      setSyncResults({
        success: false,
        error: error.message
      });
    }
  };

  const getStatusColor = (value, total) => {
    if (!total) return 'secondary';
    const percentage = (value / total) * 100;
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'danger';
  };

  const formatPercentage = (value, total) => {
    if (!total) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Dashboard de Sincronización CRM
            </h2>
            <p className="text-gray-600">
              Monitorea el progreso de matching y sincronización de contactos
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={loadStats}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            disabled={loading}
          >
            Actualizar
          </Button>
          <Button
            variant="gradient"
            onClick={handleSyncNow}
            leftIcon={<Zap className="w-4 h-4" />}
          >
            Sincronizar Ahora
          </Button>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="text-center">
          <div className="p-4">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats?.total || 0}
            </div>
            <p className="text-sm text-gray-600">Contactos Procesados</p>
            <Badge variant="info" size="sm" className="mt-2">
              {stats?.period || 'Mes actual'}
            </Badge>
          </div>
        </Card>

        <Card className="text-center">
          <div className="p-4">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {stats?.autoAssigned || 0}
            </div>
            <p className="text-sm text-gray-600">Asignados Automáticamente</p>
            <Badge variant={getStatusColor(stats?.autoAssigned, stats?.total)} size="sm" className="mt-2">
              {formatPercentage(stats?.autoAssigned, stats?.total)}
            </Badge>
          </div>
        </Card>

        <Card className="text-center">
          <div className="p-4">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-yellow-600 mb-1">
              {stats?.needsReview || 0}
            </div>
            <p className="text-sm text-gray-600">Pendientes de Revisión</p>
            <Badge variant={getStatusColor(stats?.needsReview, stats?.total)} size="sm" className="mt-2">
              {formatPercentage(stats?.needsReview, stats?.total)}
            </Badge>
          </div>
        </Card>

        <Card className="text-center">
          <div className="p-4">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-red-600 mb-1">
              {stats?.rejected || 0}
            </div>
            <p className="text-sm text-gray-600">Matchings Rechazados</p>
            <Badge variant={getStatusColor(stats?.rejected, stats?.total)} size="sm" className="mt-2">
              {formatPercentage(stats?.rejected, stats?.total)}
            </Badge>
          </div>
        </Card>
      </div>


      {/* Modal de resultados de sincronización */}
      <Modal
        isOpen={syncModal}
        onClose={() => setSyncModal(false)}
        title="Sincronización CRM"
        size="lg"
      >
        <div className="space-y-6">
          {syncResults ? (
            <div className="text-center">
              <div className={`p-4 rounded-2xl inline-block mb-4 ${
                syncResults.success ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {syncResults.success ? (
                  <CheckCircle className="w-12 h-12 text-green-600" />
                ) : (
                  <AlertTriangle className="w-12 h-12 text-red-600" />
                )}
              </div>
              <h3 className={`text-xl font-bold mb-2 ${
                syncResults.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {syncResults.success ? '¡Sincronización Exitosa!' : 'Error en Sincronización'}
              </h3>
              <p className={`text-sm mb-4 ${
                syncResults.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {syncResults.message || syncResults.error}
              </p>

              {syncResults.success && (
                <div className="bg-gray-50 p-6 rounded-lg text-left">
                  <h4 className="font-semibold text-gray-900 mb-4">Resultados de la sincronización:</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contactos procesados:</span>
                      <span className="font-semibold">{syncResults.processed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Matchings encontrados:</span>
                      <span className="font-semibold text-green-600">{syncResults.matched}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Asignados automáticamente:</span>
                      <span className="font-semibold text-blue-600">{syncResults.autoAssigned}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pendientes de revisión:</span>
                      <span className="font-semibold text-yellow-600">{syncResults.needsReview}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rechazados:</span>
                      <span className="font-semibold text-red-600">{syncResults.rejected}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tiempo de procesamiento:</span>
                      <span className="font-semibold">{syncResults.duration}s</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Sincronizando con CRM...
              </h3>
              <p className="text-gray-600">
                Procesando contactos y aplicando matching inteligente
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setSyncModal(false)}
              className="flex-1"
            >
              Cerrar
            </Button>
            {syncResults?.success && (
              <Button
                variant="gradient"
                onClick={() => {
                  setSyncModal(false);
                  loadStats(); // Recargar estadísticas
                }}
                className="flex-1"
              >
                Ver Dashboard
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CRMSyncDashboard;