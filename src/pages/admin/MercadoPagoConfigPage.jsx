/**
 * Mercado Pago Configuration Page
 *
 * Página para configurar la integración con Mercado Pago
 */

import { useState, useEffect } from 'react';
import { Card, Button, Input, Modal, Badge } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  CreditCard,
  Settings,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Key,
  DollarSign,
  TrendingUp,
  Shield,
  Zap
} from 'lucide-react';

const MercadoPagoConfigPage = () => {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({
    accessToken: '',
    publicKey: '',
    isActive: false,
    webhookUrl: '',
    lastSync: null,
    totalTransactions: 0,
    monthlyVolume: 0
  });
  const [showTestModal, setShowTestModal] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      // Simular carga de configuración
      setTimeout(() => {
        setConfig({
          accessToken: 'APP_USR-1234567890...',
          publicKey: 'APP_USR-abcdef123456...',
          isActive: true,
          webhookUrl: 'https://tu-dominio.com/api/webhooks/mercadopago',
          lastSync: new Date(),
          totalTransactions: 1250,
          monthlyVolume: 25000000
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading Mercado Pago config:', error);
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      // Aquí iría la lógica para guardar la configuración
      alert('✅ Configuración de Mercado Pago guardada exitosamente');
    } catch (error) {
      alert('Error al guardar configuración: ' + error.message);
    }
  };

  const handleTestConnection = async () => {
    setShowTestModal(true);
    setTestResult(null);

    // Simular prueba de conexión
    setTimeout(() => {
      setTestResult({
        success: true,
        message: 'Conexión exitosa con Mercado Pago',
        details: {
          accountStatus: 'active',
          balance: 150000,
          lastTransaction: new Date()
        }
      });
    }, 2000);
  };

  const handleSyncData = async () => {
    try {
      alert('🔄 Sincronizando datos con Mercado Pago...');
      // Aquí iría la lógica de sincronización
      setTimeout(() => {
        alert('✅ Datos sincronizados exitosamente');
        loadConfig();
      }, 2000);
    } catch (error) {
      alert('Error al sincronizar: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-strong">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <CreditCard className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight">
                Configuración Mercado Pago
              </h1>
              <p className="text-blue-100 text-lg">
                Gestiona la integración con Mercado Pago para pagos en línea
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant={config.isActive ? "success" : "danger"} size="lg">
              {config.isActive ? "Conectado" : "Desconectado"}
            </Badge>
            <Button
              variant="secondary"
              onClick={loadConfig}
              leftIcon={<RefreshCw className="w-4 h-4" />}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              Actualizar
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-blue-300" />
              <div>
                <p className="text-sm text-blue-100">Transacciones Totales</p>
                <p className="text-2xl font-bold">{config.totalTransactions.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-blue-300" />
              <div>
                <p className="text-sm text-blue-100">Volumen Mensual</p>
                <p className="text-2xl font-bold">{formatCurrency(config.monthlyVolume)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-6 h-6 text-blue-300" />
              <div>
                <p className="text-sm text-blue-100">Última Sincronización</p>
                <p className="text-lg font-bold">
                  {config.lastSync ? formatDate(config.lastSync) : 'Nunca'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-300" />
              <div>
                <p className="text-sm text-blue-100">Estado de Seguridad</p>
                <p className="text-lg font-bold">Verificado</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Configuration */}
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
              value={config.accessToken}
              onChange={(e) => setConfig({...config, accessToken: e.target.value})}
              placeholder="APP_USR-..."
              leftIcon={<Key className="w-4 h-4" />}
            />

            <Input
              label="Public Key"
              type="password"
              value={config.publicKey}
              onChange={(e) => setConfig({...config, publicKey: e.target.value})}
              placeholder="APP_USR-..."
              leftIcon={<Key className="w-4 h-4" />}
            />

            <Input
              label="URL de Webhook"
              value={config.webhookUrl}
              onChange={(e) => setConfig({...config, webhookUrl: e.target.value})}
              placeholder="https://tu-dominio.com/api/webhooks/mercadopago"
              leftIcon={<Settings className="w-4 h-4" />}
            />

            <div className="flex gap-3 pt-4">
              <Button
                variant="gradient"
                onClick={handleSaveConfig}
                leftIcon={<CheckCircle className="w-4 h-4" />}
                className="flex-1"
              >
                Guardar Configuración
              </Button>
              <Button
                variant="outline"
                onClick={handleTestConnection}
                leftIcon={<Zap className="w-4 h-4" />}
              >
                Probar Conexión
              </Button>
            </div>
          </div>
        </Card>

        {/* Actions & Status */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-100 rounded-xl">
              <Settings className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-secondary-900">Acciones y Estado</h3>
              <p className="text-secondary-600">Gestión de la integración</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-secondary-900">Estado de Conexión</span>
                <Badge variant={config.isActive ? "success" : "danger"}>
                  {config.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <p className="text-sm text-secondary-600">
                {config.isActive
                  ? "Mercado Pago está correctamente configurado y operativo"
                  : "La integración no está activa. Configure las credenciales primero."
                }
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Button
                variant="outline"
                onClick={handleSyncData}
                leftIcon={<RefreshCw className="w-4 h-4" />}
                className="w-full"
              >
                Sincronizar Datos
              </Button>

              <Button
                variant="outline"
                onClick={() => window.open('https://www.mercadopago.com.ar/developers/panel', '_blank')}
                leftIcon={<CreditCard className="w-4 h-4" />}
                className="w-full"
              >
                Panel de Mercado Pago
              </Button>

              <Button
                variant="outline"
                onClick={() => window.open('https://www.mercadopago.com.ar/developers/es/docs', '_blank')}
                leftIcon={<Settings className="w-4 h-4" />}
                className="w-full"
              >
                Documentación API
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Test Connection Modal */}
      <Modal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        title="Prueba de Conexión"
        size="md"
      >
        <div className="space-y-6">
          {testResult ? (
            <div className="text-center">
              <div className="p-4 bg-green-100 rounded-2xl inline-block mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-2">
                ¡Conexión Exitosa!
              </h3>
              <p className="text-secondary-600 mb-4">
                {testResult.message}
              </p>

              <div className="bg-gray-50 p-4 rounded-lg text-left">
                <h4 className="font-semibold text-secondary-900 mb-3">Detalles de la cuenta:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Estado:</span>
                    <Badge variant="success">{testResult.details.accountStatus}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Saldo disponible:</span>
                    <span className="font-semibold">{formatCurrency(testResult.details.balance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Última transacción:</span>
                    <span className="font-semibold">{formatDate(testResult.details.lastTransaction)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-secondary-900 mb-2">
                Probando conexión...
              </h3>
              <p className="text-secondary-600">
                Verificando credenciales y conectividad con Mercado Pago
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setShowTestModal(false)}
              className="flex-1"
            >
              Cerrar
            </Button>
            {testResult && (
              <Button
                variant="gradient"
                onClick={() => setShowTestModal(false)}
                className="flex-1"
              >
                Continuar
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MercadoPagoConfigPage;