/**
 * General Configuration Page - Configuración General
 *
 * Página dedicada a la configuración general del sistema
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, LoadingSpinner, Input, Select, ToggleSwitch } from '../../components/common';
import { Settings, Shield, Database, Mail, Key, CheckCircle, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';
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
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-strong">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/configuracion')}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Settings className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight">
                Configuración General
              </h1>
              <p className="text-blue-100 text-lg">
                Configuración general del sistema y servicios básicos
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleReloadConfig}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Recargar
            </Button>
            <Button
              variant="gradient"
              onClick={handleSaveConfig}
              loading={saving}
              className="bg-white text-blue-600 hover:bg-blue-50"
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              Guardar Cambios
            </Button>
          </div>
        </div>
      </div>

      {/* Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-secondary-900">Seguridad</h3>
                <p className="text-secondary-600">Configuraciones de seguridad y autenticación</p>
              </div>
            </div>

            <div className="space-y-4">
              <ToggleSwitch
                enabled={config.oauthEnabled}
                onChange={(value) => handleConfigChange('oauthEnabled', value)}
                label="Autenticación OAuth (Google)"
              />

              <ToggleSwitch
                enabled={config.userValidation}
                onChange={(value) => handleConfigChange('userValidation', value)}
                label="Validación automática de usuarios"
              />

              <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-secondary-900">Límite de consultas por minuto</h4>
                  <Badge variant="primary" className="font-bold">{config.queryLimit}</Badge>
                </div>
                <Input
                  type="number"
                  value={config.queryLimit}
                  onChange={(e) => handleConfigChange('queryLimit', parseInt(e.target.value))}
                  min="100"
                  max="10000"
                  className="w-full"
                />
                <p className="text-xs text-secondary-500 mt-1">
                  Límite de consultas por minuto para prevenir abuso
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-green-100 rounded-lg">
                <Database className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-secondary-900">Base de Datos</h3>
                <p className="text-secondary-600">Configuración de conexiones y límites</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-secondary-900">Estado de conexión</h4>
                  <Badge variant="success" className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Conectado
                  </Badge>
                </div>
                <p className="text-sm text-secondary-600">PostgreSQL con RLS activado</p>
              </div>

              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-secondary-900">Frecuencia de backups</h4>
                  <Badge variant="primary">{config.backupFrequency}</Badge>
                </div>
                <Select
                  value={config.backupFrequency}
                  onChange={(value) => handleConfigChange('backupFrequency', value)}
                  options={[
                    { value: 'hourly', label: 'Cada hora' },
                    { value: 'daily', label: 'Diario' },
                    { value: 'weekly', label: 'Semanal' }
                  ]}
                />
              </div>

              <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-secondary-900">Retención de logs (días)</h4>
                  <Badge variant="secondary">{config.logRetention}</Badge>
                </div>
                <Input
                  type="number"
                  value={config.logRetention}
                  onChange={(e) => handleConfigChange('logRetention', parseInt(e.target.value))}
                  min="7"
                  max="365"
                  className="w-full"
                />
                <p className="text-xs text-secondary-500 mt-1">
                  Días que se mantendrán los logs del sistema
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Mail className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-secondary-900">Notificaciones</h3>
                <p className="text-secondary-600">Configuración de emails y alertas</p>
              </div>
            </div>

            <div className="space-y-4">
              <ToggleSwitch
                enabled={config.emailNotifications}
                onChange={(value) => handleConfigChange('emailNotifications', value)}
                label="Emails transaccionales (SendGrid)"
              />

              <ToggleSwitch
                enabled={config.pushNotifications}
                onChange={(value) => handleConfigChange('pushNotifications', value)}
                label="Notificaciones push"
              />

              <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-secondary-900">Estado del servicio</h4>
                  <Badge variant={(config.emailNotifications || config.pushNotifications) ? 'success' : 'secondary'}>
                    {(config.emailNotifications || config.pushNotifications) ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <p className="text-sm text-secondary-600">
                  {(config.emailNotifications || config.pushNotifications)
                    ? `${config.emailNotifications ? 'Email' : ''}${config.emailNotifications && config.pushNotifications ? ' + ' : ''}${config.pushNotifications ? 'Push' : ''} configurado(s) y operativo(s)`
                    : 'Servicios de notificaciones desactivados'
                  }
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Key className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-secondary-900">Integraciones</h3>
                <p className="text-secondary-600">Gestión de claves de integración</p>
              </div>
            </div>

            <div className="space-y-4">
              <ToggleSwitch
                enabled={config.mercadoPagoEnabled}
                onChange={(value) => handleConfigChange('mercadoPagoEnabled', value)}
                label="Mercado Pago (Pagos en línea)"
              />

              <ToggleSwitch
                enabled={config.whatsappEnabled}
                onChange={(value) => handleConfigChange('whatsappEnabled', value)}
                label="WhatsApp Business (Notificaciones)"
              />

              <div className="p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-secondary-900">Estado de integraciones</h4>
                  <Badge variant={(config.mercadoPagoEnabled && config.whatsappEnabled) ? 'success' : 'warning'}>
                    {(config.mercadoPagoEnabled && config.whatsappEnabled) ? 'Completas' : 'Parciales'}
                  </Badge>
                </div>
                <p className="text-sm text-secondary-600">
                  {config.mercadoPagoEnabled && config.whatsappEnabled
                    ? 'Todas las integraciones activas'
                    : 'Algunas integraciones requieren configuración'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* System Actions */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-amber-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-secondary-900">Acciones del Sistema</h3>
              <p className="text-secondary-600">Operaciones críticas que afectan el funcionamiento del sistema</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/60 rounded-lg border border-amber-200">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-amber-600" />
                <div>
                  <h4 className="font-medium text-secondary-900">Modo de Mantenimiento</h4>
                  <p className="text-sm text-secondary-600">Desactiva temporalmente el acceso a la plataforma</p>
                </div>
              </div>
              <ToggleSwitch
                enabled={config.maintenanceMode}
                onChange={(value) => handleConfigChange('maintenanceMode', value)}
              />
            </div>

            <div className="bg-amber-100 p-4 rounded-lg border border-amber-300">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-800 mb-1">⚠️ Configuración Crítica</h4>
                  <p className="text-sm text-amber-700">
                    Algunos cambios pueden afectar la disponibilidad del sistema.
                    Se recomienda hacer backup antes de aplicar cambios importantes.
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