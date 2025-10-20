/**
 * General Configuration Page - Configuración General
 *
 * Página dedicada a la configuración general del sistema
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, LoadingSpinner, Input, Select, ToggleSwitch } from '../../components/common';
import { Settings, Shield, Database, Mail, Key, CheckCircle, ArrowLeft, RefreshCw, AlertTriangle, Eye, Edit } from 'lucide-react';
import { getSystemConfig, updateSystemConfig } from '../../services/databaseService';
import { getDefaultConfig } from '../../config/systemConfig';
import Swal from 'sweetalert2';

const GeneralConfigPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Configuración del estado del sistema
  const [config, setConfig] = useState(() => {
    const defaultConfig = getDefaultConfig();
    return {
      oauthEnabled: defaultConfig.oauth_enabled,
      userValidation: defaultConfig.user_validation_enabled,
      emailNotifications: defaultConfig.email_notifications_enabled,
      pushNotifications: defaultConfig.push_notifications_enabled,
      mercadoPagoEnabled: defaultConfig.mercado_pago_enabled,
      whatsappEnabled: defaultConfig.whatsapp_enabled,
      queryLimit: defaultConfig.query_limit_per_minute || 1000,
      backupFrequency: defaultConfig.backup_frequency || 'daily',
      logRetention: defaultConfig.log_retention_days || 30,
      maintenanceMode: defaultConfig.system_maintenance_mode || false,
    };
  });

  useEffect(() => {
    loadSystemConfig();
  }, []);

  const loadSystemConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getSystemConfig();
      if (result.error) {
        console.error('Config error:', result.error);
        // Usar configuración por defecto si hay error
      } else {
        setConfig({
          oauthEnabled: result.config.oauthEnabled,
          userValidation: result.config.userValidation,
          emailNotifications: result.config.emailNotifications,
          pushNotifications: result.config.pushNotifications,
          mercadoPagoEnabled: result.config.mercadoPagoEnabled,
          whatsappEnabled: result.config.whatsappEnabled,
          queryLimit: result.config.queryLimit || 1000,
          backupFrequency: result.config.backupFrequency || 'daily',
          logRetention: result.config.logRetention || 30,
          maintenanceMode: result.config.maintenanceMode || false,
        });
      }
    } catch (error) {
      console.error('Error loading system config:', error);
      setError('Error al cargar configuración del sistema');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);

      const configToSave = {
        oauth_enabled: config.oauthEnabled,
        user_validation_enabled: config.userValidation,
        email_notifications_enabled: config.emailNotifications,
        push_notifications_enabled: config.pushNotifications,
        mercado_pago_enabled: config.mercadoPagoEnabled,
        whatsapp_enabled: config.whatsappEnabled,
        query_limit_per_minute: config.queryLimit,
        backup_frequency: config.backupFrequency,
        log_retention_days: config.logRetention,
        system_maintenance_mode: config.maintenanceMode,
      };

      const result = await updateSystemConfig(configToSave);

      if (result.error) {
        throw new Error(result.error);
      }

      await Swal.fire({
        icon: 'success',
        title: 'Configuración guardada',
        text: 'Los cambios han sido aplicados exitosamente',
        confirmButtonText: 'Aceptar'
      });

    } catch (error) {
      console.error('Error saving config:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: error.message || 'No se pudo guardar la configuración',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReloadConfig = async () => {
    await loadSystemConfig();
    await Swal.fire({
      icon: 'success',
      title: 'Configuración recargada',
      text: 'Los cambios han sido aplicados desde la base de datos',
      confirmButtonText: 'Aceptar',
      timer: 2000
    });
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar configuración</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => loadSystemConfig()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 rounded-3xl p-4 text-white shadow-strong animate-fade-in">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
        </div>

        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold tracking-tight">
                  Configuración General
                </h1>
                <p className="text-primary-100 text-sm">
                  Configuración general del sistema y servicios básicos
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-1.5 mt-2">
        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-1">
            <div className="flex items-center justify-center mb-1.5">
              <div className="p-0.5 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg group-hover:shadow-glow-blue transition-all duration-300">
                <Shield className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {config.oauthEnabled && config.userValidation ? 'Activa' : 'Incompleta'}
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Seguridad</p>
            <div className="flex items-center justify-center mt-0.5">
              {config.oauthEnabled && config.userValidation ? (
                <CheckCircle className="w-2.5 h-2.5 text-green-500 mr-0.5" />
              ) : (
                <XCircle className="w-2.5 h-2.5 text-red-500 mr-0.5" />
              )}
              <span className="text-xs text-green-600 font-medium">
                {config.oauthEnabled && config.userValidation ? 'Configurada' : 'Requiere atención'}
              </span>
            </div>
          </div>
        </Card>

        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-1">
            <div className="flex items-center justify-center mb-1.5">
              <div className="p-0.5 bg-gradient-to-br from-green-100 to-green-200 rounded-lg group-hover:shadow-glow-green transition-all duration-300">
                <Database className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              Conectada
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Base de Datos</p>
            <div className="text-xs text-green-600 mt-0.5 font-medium">
              PostgreSQL + RLS
            </div>
          </div>
        </Card>

        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-1">
            <div className="flex items-center justify-center mb-1.5">
              <div className="p-0.5 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg group-hover:shadow-glow-orange transition-all duration-300">
                <Mail className="w-4 h-4 text-orange-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {config.emailNotifications && config.pushNotifications ? 'Completas' :
               config.emailNotifications || config.pushNotifications ? 'Parciales' : 'Inactivas'}
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Notificaciones</p>
            <div className="text-xs text-orange-600 mt-0.5 font-medium">
              {config.emailNotifications ? 'Email' : ''}{config.emailNotifications && config.pushNotifications ? ' + ' : ''}{config.pushNotifications ? 'Push' : ''}
            </div>
          </div>
        </Card>

        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-1">
            <div className="flex items-center justify-center mb-1.5">
              <div className="p-0.5 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg group-hover:shadow-glow-purple transition-all duration-300">
                <Key className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {config.mercadoPagoEnabled && config.whatsappEnabled ? 'Completas' :
               config.mercadoPagoEnabled || config.whatsappEnabled ? 'Parciales' : 'Pendientes'}
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Integraciones</p>
            <div className="text-xs text-purple-600 mt-0.5 font-medium">
              {config.mercadoPagoEnabled ? 'MP' : ''}{config.mercadoPagoEnabled && config.whatsappEnabled ? ' + ' : ''}{config.whatsappEnabled ? 'WA' : ''}
            </div>
          </div>
        </Card>
      </div>

      {/* Configuration List */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-secondary-900">
              Configuraciones del Sistema ({4})
            </h2>
            <div className="flex items-center gap-3">
              <Button
                variant="gradient"
                size="sm"
                onClick={handleSaveConfig}
                loading={saving}
                leftIcon={<CheckCircle className="w-3 h-3" />}
              >
                Guardar Cambios
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReloadConfig}
                leftIcon={<RefreshCw className="w-3 h-3" />}
              >
                Actualizar
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-secondary-600">Cargando configuraciones...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Security Configuration */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Seguridad</h3>
                        <p className="text-gray-600 text-xs">Configuraciones de autenticación y validación</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant={config.oauthEnabled && config.userValidation ? 'success' : 'warning'}>
                        {config.oauthEnabled && config.userValidation ? 'Configurada' : 'Requiere atención'}
                      </Badge>

                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="xs"
                          leftIcon={<Eye className="w-3 h-3" />}
                          onClick={() => {/* TODO: Open view modal */}}
                          className="hover:bg-blue-50 hover:border-blue-300 px-2 py-1 text-xs"
                        >
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          leftIcon={<Edit className="w-3 h-3" />}
                          onClick={() => {/* TODO: Open edit modal */}}
                          className="hover:bg-green-50 hover:border-green-300 px-2 py-1 text-xs"
                        >
                          Editar
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-blue-600">
                        {config.oauthEnabled ? 'Habilitado' : 'Deshabilitado'}
                      </div>
                      <div className="text-xs text-secondary-600">OAuth Google</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-blue-600">
                        {config.userValidation ? 'Activa' : 'Inactiva'}
                      </div>
                      <div className="text-xs text-secondary-600">Validación</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-blue-600">
                        {config.queryLimit}
                      </div>
                      <div className="text-xs text-secondary-600">Límite consultas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-blue-600">
                        {config.maintenanceMode ? 'Sí' : 'No'}
                      </div>
                      <div className="text-xs text-secondary-600">Mantenimiento</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </Card>

      {/* System Actions */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-secondary-900">Acciones del Sistema</h3>
              <p className="text-xs text-secondary-600">Operaciones críticas del sistema</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-amber-600" />
                <div>
                  <h4 className="text-sm font-medium text-secondary-900">Modo Mantenimiento</h4>
                  <p className="text-xs text-secondary-600">Desactiva acceso temporal</p>
                </div>
              </div>
              <ToggleSwitch
                enabled={config.maintenanceMode}
                onChange={(value) => handleConfigChange('maintenanceMode', value)}
              />
            </div>

            <div className="bg-amber-100 p-3 rounded-lg border border-amber-300">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-800 mb-1">⚠️ Configuración Crítica</h4>
                  <p className="text-xs text-amber-700">
                    Algunos cambios pueden afectar la disponibilidad del sistema.
                    Se recomienda hacer backup antes de cambios importantes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GeneralConfigPage;