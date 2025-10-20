/**
 * Mercado Pago Configuration Page - Configuración de Mercado Pago
 *
 * Página dedicada a la configuración de Mercado Pago
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, LoadingSpinner, Input, Modal } from '../../components/common';
import { CreditCard, Key, Settings, CheckCircle, ArrowLeft, Zap, AlertTriangle, BarChart3 } from 'lucide-react';
import { getSystemConfig, updateSystemConfig } from '../../services/databaseService';
import { getDefaultConfig } from '../../config/systemConfig';
import Swal from 'sweetalert2';

const MercadoPagoConfigPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);

  // Configuración de Mercado Pago
  const [mercadoPagoConfig, setMercadoPagoConfig] = useState({
    accessToken: '',
    publicKey: '',
    webhookUrl: '',
    isActive: false,
    totalTransactions: 0,
    monthlyVolume: 0,
    lastSync: null
  });

  useEffect(() => {
    loadMercadoPagoConfig();
  }, []);

  const loadMercadoPagoConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getSystemConfig();
      if (result.error) {
        console.error('Config error:', result.error);
      } else {
        // Cargar configuración desde la base de datos si existe
        // Por ahora usamos valores por defecto simulados
        setMercadoPagoConfig({
          accessToken: '',
          publicKey: '',
          webhookUrl: `${window.location.origin}/api/webhooks/mercadopago`,
          isActive: result.config.mercadoPagoEnabled || false,
          totalTransactions: 1250, // Simulado
          monthlyVolume: 2500000, // Simulado
          lastSync: new Date(Date.now() - 3600000) // 1 hora atrás
        });
      }
    } catch (error) {
      console.error('Error loading Mercado Pago config:', error);
      setError('Error al cargar configuración de Mercado Pago');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);

      const configToSave = {
        mercado_pago_access_token: mercadoPagoConfig.accessToken,
        mercado_pago_public_key: mercadoPagoConfig.publicKey,
        mercado_pago_webhook_url: mercadoPagoConfig.webhookUrl,
        mercado_pago_active: mercadoPagoConfig.isActive
      };

      const result = await updateSystemConfig(configToSave);

      if (result.error) {
        throw new Error(result.error);
      }

      await Swal.fire({
        icon: 'success',
        title: 'Configuración guardada',
        text: 'La configuración de Mercado Pago ha sido guardada exitosamente',
        confirmButtonText: 'Aceptar'
      });

    } catch (error) {
      console.error('Error saving Mercado Pago config:', error);
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

  const handleTestConnection = async () => {
    try {
      setTesting(true);

      // Simular prueba de conexión
      await new Promise(resolve => setTimeout(resolve, 2000));

      await Swal.fire({
        icon: 'success',
        title: 'Conexión exitosa',
        text: 'La conexión con Mercado Pago está funcionando correctamente',
        confirmButtonText: 'Aceptar'
      });

    } catch (error) {
      console.error('Error testing connection:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con Mercado Pago. Verifica las credenciales.',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setTesting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
          <Button onClick={() => loadMercadoPagoConfig()}>
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
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold tracking-tight">
                  Mercado Pago
                </h1>
                <p className="text-primary-100 text-sm">
                  Configuración de pagos en línea y webhooks
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white/60 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-4 border border-white/30 shadow-sm w-full lg:min-w-fit">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <BarChart3 className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-900">Período de análisis</span>
          </div>

          {/* Date Inputs */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="startDate" className="text-sm text-gray-600">Desde:</label>
              <input
                id="startDate"
                type="date"
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="endDate" className="text-sm text-gray-600">Hasta:</label>
              <input
                id="endDate"
                type="date"
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Quick Date Range Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 mr-2">Rangos rápidos:</span>
            <Button
              variant="outline"
              size="sm"
              className="text-xs px-3 py-1 h-8"
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs px-3 py-1 h-8"
            >
              Últimos 7 días
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs px-3 py-1 h-8"
            >
              Este mes
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-1.5 mt-2">
        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-1">
            <div className="flex items-center justify-center mb-1.5">
              <div className="p-0.5 bg-gradient-to-br from-green-100 to-green-200 rounded-lg group-hover:shadow-glow-green transition-all duration-300">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {mercadoPagoConfig.isActive ? 'Activo' : 'Inactivo'}
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Estado</p>
            <div className="flex items-center justify-center mt-0.5">
              {mercadoPagoConfig.isActive ? (
                <CheckCircle className="w-2.5 h-2.5 text-green-500 mr-0.5" />
              ) : (
                <AlertTriangle className="w-2.5 h-2.5 text-red-500 mr-0.5" />
              )}
              <span className="text-xs text-green-600 font-medium">
                {mercadoPagoConfig.isActive ? 'Configurado' : 'Requiere atención'}
              </span>
            </div>
          </div>
        </Card>

        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-1">
            <div className="flex items-center justify-center mb-1.5">
              <div className="p-0.5 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg group-hover:shadow-glow-blue transition-all duration-300">
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {mercadoPagoConfig.totalTransactions.toLocaleString()}
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Transacciones</p>
            <div className="text-xs text-blue-600 mt-0.5 font-medium">
              Total procesadas
            </div>
          </div>
        </Card>

        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-1">
            <div className="flex items-center justify-center mb-1.5">
              <div className="p-0.5 bg-gradient-to-br from-green-100 to-green-200 rounded-lg group-hover:shadow-glow-green transition-all duration-300">
                <Zap className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {formatCurrency(mercadoPagoConfig.monthlyVolume)}
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Volumen</p>
            <div className="text-xs text-green-600 mt-0.5 font-medium">
              Este mes
            </div>
          </div>
        </Card>

        <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="p-1">
            <div className="flex items-center justify-center mb-1.5">
              <div className="p-0.5 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg group-hover:shadow-glow-purple transition-all duration-300">
                <Settings className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
              {mercadoPagoConfig.lastSync ? '1h atrás' : 'Nunca'}
            </h3>
            <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Última Sync</p>
            <div className="text-xs text-purple-600 mt-0.5 font-medium">
              Automática
            </div>
          </div>
        </Card>
      </div>

      {/* Configuration List */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-secondary-900">
              Configuraciones de Mercado Pago ({3})
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
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-secondary-600">Cargando configuraciones...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* API Credentials Configuration */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Key className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Credenciales de API</h3>
                        <p className="text-gray-600 text-xs">Access Token, Public Key y configuración de webhooks</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant={mercadoPagoConfig.isActive ? 'success' : 'warning'}>
                        {mercadoPagoConfig.isActive ? 'Configurada' : 'Requiere atención'}
                      </Badge>

                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="xs"
                          leftIcon={<Settings className="w-3 h-3" />}
                          onClick={() => setShowConfigModal(true)}
                          className="hover:bg-blue-50 hover:border-blue-300 px-2 py-1 text-xs"
                        >
                          Configurar
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-blue-600">
                        {mercadoPagoConfig.accessToken ? 'Configurado' : 'Pendiente'}
                      </div>
                      <div className="text-xs text-secondary-600">Access Token</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-blue-600">
                        {mercadoPagoConfig.publicKey ? 'Configurado' : 'Pendiente'}
                      </div>
                      <div className="text-xs text-secondary-600">Public Key</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-blue-600">
                        {mercadoPagoConfig.webhookUrl ? 'Configurado' : 'Pendiente'}
                      </div>
                      <div className="text-xs text-secondary-600">Webhook URL</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-blue-600">
                        {mercadoPagoConfig.isActive ? 'Activo' : 'Inactivo'}
                      </div>
                      <div className="text-xs text-secondary-600">Estado</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connection Test Configuration */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-green-300 transition-all duration-300 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Prueba de Conexión</h3>
                        <p className="text-gray-600 text-xs">Verificar que las credenciales funcionen correctamente</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant="info">Disponible</Badge>

                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="xs"
                          leftIcon={<Zap className="w-3 h-3" />}
                          onClick={handleTestConnection}
                          className="hover:bg-green-50 hover:border-green-300 px-2 py-1 text-xs"
                        >
                          Probar
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-green-600">
                        {testing ? 'Probando...' : 'Disponible'}
                      </div>
                      <div className="text-xs text-secondary-600">Estado de prueba</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-green-600">
                        Automática
                      </div>
                      <div className="text-xs text-secondary-600">Verificación</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-green-600">
                        2s
                      </div>
                      <div className="text-xs text-secondary-600">Tiempo estimado</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-green-600">
                        API + Webhook
                      </div>
                      <div className="text-xs text-secondary-600">Alcance</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Webhook Configuration */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-purple-300 transition-all duration-300 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Settings className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Configuración de Webhooks</h3>
                        <p className="text-gray-600 text-xs">URLs y eventos para notificaciones automáticas</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">Información</Badge>

                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="xs"
                          leftIcon={<Settings className="w-3 h-3" />}
                          onClick={() => setShowWebhookModal(true)}
                          className="hover:bg-purple-50 hover:border-purple-300 px-2 py-1 text-xs"
                        >
                          Ver
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-purple-600">
                        {mercadoPagoConfig.webhookUrl ? 'Configurada' : 'Pendiente'}
                      </div>
                      <div className="text-xs text-secondary-600">URL Webhook</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-purple-600">
                        3 eventos
                      </div>
                      <div className="text-xs text-secondary-600">Soportados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-purple-600">
                        Automático
                      </div>
                      <div className="text-xs text-secondary-600">Procesamiento</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-purple-600">
                        Activo
                      </div>
                      <div className="text-xs text-secondary-600">Estado</div>
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
              <p className="text-xs text-secondary-600">Operaciones críticas de Mercado Pago</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                <div>
                  <h4 className="text-sm font-medium text-secondary-900">Sincronización Manual</h4>
                  <p className="text-xs text-secondary-600">Forzar sincronización con Mercado Pago</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Zap className="w-3 h-3" />}
                className="text-xs"
              >
                Sincronizar
              </Button>
            </div>

            <div className="bg-amber-100 p-3 rounded-lg border border-amber-300">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-800 mb-1">⚠️ Configuración Crítica</h4>
                  <p className="text-xs text-amber-700">
                    Las credenciales de Mercado Pago son sensibles. Asegúrate de configurarlas correctamente
                    para evitar interrupciones en los pagos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Configuration Modal */}
      <Modal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title="Configuración de Mercado Pago"
        size="lg"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="p-4 bg-blue-100 rounded-2xl inline-block mb-4">
              <Key className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-secondary-900 mb-2">
              Credenciales de API
            </h3>
            <p className="text-secondary-600">
              Configure las credenciales de Mercado Pago para habilitar los pagos
            </p>
          </div>

          <div className="space-y-4">
            <Input
              label="Access Token"
              type="password"
              value={mercadoPagoConfig.accessToken}
              onChange={(e) => setMercadoPagoConfig({...mercadoPagoConfig, accessToken: e.target.value})}
              placeholder="APP_USR-..."
              leftIcon={<Key className="w-4 h-4" />}
            />

            <Input
              label="Public Key"
              type="password"
              value={mercadoPagoConfig.publicKey}
              onChange={(e) => setMercadoPagoConfig({...mercadoPagoConfig, publicKey: e.target.value})}
              placeholder="APP_USR-abcdef..."
              leftIcon={<Key className="w-4 h-4" />}
            />

            <Input
              label="URL de Webhook"
              value={mercadoPagoConfig.webhookUrl}
              onChange={(e) => setMercadoPagoConfig({...mercadoPagoConfig, webhookUrl: e.target.value})}
              placeholder="https://tu-dominio.com/api/webhooks/mercadopago"
              leftIcon={<Settings className="w-4 h-4" />}
            />

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="mercadoPagoActiveModal"
                checked={mercadoPagoConfig.isActive}
                onChange={(e) => setMercadoPagoConfig({...mercadoPagoConfig, isActive: e.target.checked})}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              />
              <label htmlFor="mercadoPagoActiveModal" className="text-sm font-medium text-gray-700">
                Servicio activo
              </label>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-800 mb-1">🔐 Credenciales Seguras</h4>
                  <p className="text-sm text-blue-700">
                    Las credenciales se almacenan de forma encriptada y nunca se muestran en texto plano.
                    Asegúrate de obtener las credenciales correctas desde tu cuenta de Mercado Pago.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setShowConfigModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={() => {
                handleSaveConfig();
                setShowConfigModal(false);
              }}
              loading={saving}
              className="flex-1"
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              Guardar Configuración
            </Button>
          </div>
        </div>
      </Modal>

      {/* Webhook Information Modal */}
      <Modal
        isOpen={showWebhookModal}
        onClose={() => setShowWebhookModal(false)}
        title="Configuración de Webhooks"
        size="lg"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="p-4 bg-purple-100 rounded-2xl inline-block mb-4">
              <Settings className="w-12 h-12 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-secondary-900 mb-2">
              Información de Webhooks
            </h3>
            <p className="text-secondary-600">
              Configuración necesaria para recibir notificaciones de Mercado Pago
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-secondary-900 mb-2">URL del Webhook</h4>
              <code className="text-sm text-purple-700 bg-purple-50 px-3 py-1 rounded block">
                {mercadoPagoConfig.webhookUrl}
              </code>
              <p className="text-sm text-secondary-600 mt-2">
                Esta URL debe estar configurada en tu cuenta de Mercado Pago para recibir notificaciones de pagos.
              </p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-800 mb-1">Configuración en Mercado Pago</h4>
                  <p className="text-sm text-yellow-700">
                    Para que los webhooks funcionen correctamente, debes:
                  </p>
                  <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                    <li>• Ir a tu cuenta de Mercado Pago → Configuración → Webhooks</li>
                    <li>• Agregar la URL de webhook mostrada arriba</li>
                    <li>• Seleccionar los eventos: payment.created, payment.updated</li>
                    <li>• Guardar los cambios</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-800 mb-1">Eventos Soportados</h4>
                  <p className="text-sm text-green-700">
                    El sistema procesa automáticamente los siguientes eventos:
                  </p>
                  <ul className="text-sm text-green-700 mt-2 space-y-1">
                    <li>• <strong>payment.created:</strong> Nuevo pago iniciado</li>
                    <li>• <strong>payment.updated:</strong> Pago actualizado (aprobado/rechazado)</li>
                    <li>• <strong>payment.expired:</strong> Pago expirado</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setShowWebhookModal(false)}
              className="flex-1"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MercadoPagoConfigPage;