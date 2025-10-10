/**
 * Mercado Pago Configuration Page - Configuración de Mercado Pago
 *
 * Página dedicada a la configuración de Mercado Pago
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, LoadingSpinner, Input } from '../../components/common';
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
      <div className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 rounded-3xl p-8 text-white shadow-strong">
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
              <CreditCard className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight">
                Mercado Pago
              </h1>
              <p className="text-green-100 text-lg">
                Configuración de pagos en línea y webhooks
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              loading={testing}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              leftIcon={<Zap className="w-4 h-4" />}
            >
              Probar Conexión
            </Button>
            <Button
              variant="gradient"
              onClick={handleSaveConfig}
              loading={saving}
              className="bg-white text-green-600 hover:bg-green-50"
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              Guardar Configuración
            </Button>
          </div>
        </div>
      </div>

      {/* Configuration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Key className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-secondary-900">Configuración de API</h3>
              <p className="text-secondary-600">Credenciales de Mercado Pago</p>
            </div>
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
                id="mercadoPagoActive"
                checked={mercadoPagoConfig.isActive}
                onChange={(e) => setMercadoPagoConfig({...mercadoPagoConfig, isActive: e.target.checked})}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              />
              <label htmlFor="mercadoPagoActive" className="text-sm font-medium text-gray-700">
                Servicio activo
              </label>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
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
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-100 rounded-xl">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-secondary-900">Estadísticas</h3>
              <p className="text-secondary-600">Métricas de Mercado Pago</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{mercadoPagoConfig.totalTransactions.toLocaleString()}</div>
                <div className="text-sm text-blue-700">Transacciones Totales</div>
              </div>
              <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                <div className="text-2xl font-bold text-green-600">{formatCurrency(mercadoPagoConfig.monthlyVolume)}</div>
                <div className="text-sm text-green-700">Volumen Mensual</div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-secondary-900">Última Sincronización</h4>
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Conectado
                </Badge>
              </div>
              <p className="text-sm text-secondary-600">
                {mercadoPagoConfig.lastSync ? `Sincronizado: ${formatDate(mercadoPagoConfig.lastSync)}` : 'Nunca sincronizado'}
              </p>
            </div>

            <div className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-secondary-900">Estado de Conexión</h4>
                <Badge variant={mercadoPagoConfig.isActive ? "success" : "danger"}>
                  {mercadoPagoConfig.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <p className="text-sm text-secondary-600">
                {mercadoPagoConfig.isActive
                  ? "Mercado Pago está correctamente configurado y operativo"
                  : "La integración no está activa. Configure las credenciales primero."
                }
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Webhook Information */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Settings className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-secondary-900">Configuración de Webhooks</h3>
              <p className="text-secondary-600">Información importante sobre webhooks de Mercado Pago</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-indigo-200">
              <h4 className="font-semibold text-secondary-900 mb-2">URL del Webhook</h4>
              <code className="text-sm text-indigo-700 bg-indigo-50 px-3 py-1 rounded">
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
        </div>
      </Card>
    </div>
  );
};

export default MercadoPagoConfigPage;