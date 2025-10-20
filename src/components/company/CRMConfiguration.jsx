/**
 * CRM Configuration Component
 *
 * Componente para que las empresas configuren sus propias integraciones CRM
 * Permite conectar HubSpot, Salesforce, o Zoho por empresa
 */

import { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Modal, Badge } from '../common';
import { useCRM } from '../../hooks/integrations';
import Swal from 'sweetalert2';
import {
  Settings,
  Link,
  Unlink,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Key,
  Globe,
  TestTube
} from 'lucide-react';
import {
  getCompanyCRMConfig,
  saveCompanyCRMConfig,
  disconnectCompanyCRM,
  testCompanyCRMConnection
} from '../../services/companyCRMService';

const CRMConfiguration = ({ profile, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testModal, setTestModal] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Configuración CRM de la empresa
  const [crmConfig, setCrmConfig] = useState({
    provider: '',
    config: {},
    connected: false,
    lastSync: null,
    syncStatus: 'disconnected'
  });

  const { changeCRM, syncDebtor, getDebtors } = useCRM();

  // Cargar configuración CRM al montar el componente
  useEffect(() => {
    const loadCRMConfig = async () => {
      if (profile?.company?.id) {
        try {
          const result = await getCompanyCRMConfig(profile.company.id);
          if (result.success) {
            setCrmConfig(result.config);
          }
        } catch (error) {
          console.error('Error cargando configuración CRM:', error);
        }
      }
    };

    loadCRMConfig();
  }, [profile?.company?.id]);

  // Opciones de CRM disponibles
  const crmOptions = [
    { value: '', label: 'Seleccionar CRM...' },
    { value: 'hubspot', label: 'HubSpot', icon: '🔗', docs: 'https://developers.hubspot.com/docs/api/crm/contacts' },
    { value: 'salesforce', label: 'Salesforce', icon: '☁️', docs: 'https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_rest.htm' },
    { value: 'zoho', label: 'Zoho CRM', icon: '📊', docs: 'https://www.zoho.com/crm/developer/docs/api/v2/' },
    { value: 'upnify', label: 'Upnify', icon: '🎯', docs: 'https://developers.upnify.com/' },
    { value: 'pipedrive', label: 'Pipedrive', icon: '📈', docs: 'https://developers.pipedrive.com/docs/api/v1/' }
  ];

  // Campos de configuración por CRM
  const getCRMFields = (provider) => {
    switch (provider) {
      case 'hubspot':
        return [
          {
            name: 'accessToken',
            label: 'Private App Token',
            type: 'password',
            placeholder: 'hap-xxx-xxx-xxx-xxx',
            help: 'Token de aplicación privada de HubSpot',
            required: true
          }
        ];
      case 'salesforce':
        return [
          {
            name: 'accessToken',
            label: 'Access Token',
            type: 'password',
            placeholder: '00Dxxx...',
            help: 'Token de acceso de Salesforce',
            required: true
          },
          {
            name: 'instanceUrl',
            label: 'Instance URL',
            type: 'url',
            placeholder: 'https://your-org.salesforce.com',
            help: 'URL de instancia de Salesforce',
            required: true
          }
        ];
      case 'zoho':
        return [
          {
            name: 'accessToken',
            label: 'Access Token',
            type: 'password',
            placeholder: '1000.xxx...',
            help: 'Token de acceso de Zoho',
            required: true
          },
          {
            name: 'apiDomain',
            label: 'API Domain',
            type: 'url',
            placeholder: 'https://www.zohoapis.com',
            help: 'Dominio API de Zoho',
            required: true
          }
        ];
      case 'upnify':
        return [
          {
            name: 'apiKey',
            label: 'API Key',
            type: 'password',
            placeholder: 'upn_xxx...',
            help: 'Clave API de Upnify',
            required: true
          }
        ];
      case 'pipedrive':
        return [
          {
            name: 'apiToken',
            label: 'API Token',
            type: 'password',
            placeholder: 'xxx...',
            help: 'Token API de Pipedrive',
            required: true
          }
        ];
      default:
        return [];
    }
  };

  const handleProviderChange = (provider) => {
    setCrmConfig(prev => ({
      ...prev,
      provider,
      config: {} // Reset config when changing provider
    }));
  };

  const handleConfigChange = (field, value) => {
    setCrmConfig(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      if (!profile?.company?.id) {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error: No se pudo identificar la empresa',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#EF4444'
        });
        return;
      }

      // Validar campos requeridos
      const fields = getCRMFields(crmConfig.provider);
      const missingFields = fields.filter(field =>
        field.required && !crmConfig.config[field.name]
      );

      if (missingFields.length > 0) {
        await Swal.fire({
          icon: 'error',
          title: 'Campos Requeridos',
          text: `Faltan campos requeridos: ${missingFields.map(f => f.label).join(', ')}`,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#EF4444'
        });
        return;
      }

      // Guardar configuración en la base de datos
      const result = await saveCompanyCRMConfig(profile.company.id, {
        provider: crmConfig.provider,
        config: crmConfig.config,
        connected: true
      });

      if (!result.success) {
        await Swal.fire({
          icon: 'error',
          title: 'Error al Guardar',
          text: 'Error al guardar configuración: ' + result.error,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#EF4444'
        });
        return;
      }

      // Actualizar estado local
      setCrmConfig(prev => ({
        ...prev,
        connected: true,
        syncStatus: 'connected',
        lastSync: new Date()
      }));

      setIsEditing(false);
      await Swal.fire({
        icon: 'success',
        title: '¡Configuración Guardada!',
        text: '✅ Configuración CRM guardada exitosamente',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#10B981',
        timer: 3000,
        timerProgressBar: true
      });

      // Notificar al componente padre para refrescar datos
      if (onUpdate) {
        onUpdate();
      }

    } catch (error) {
      console.error('Error saving CRM config:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error de Conexión',
        text: 'Error al guardar configuración: ' + error.message,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestModal(true);
    setTestResult(null);

    try {
      if (!profile?.company?.id) {
        setTestResult({
          success: false,
          error: 'No se pudo identificar la empresa'
        });
        return;
      }

      const result = await testCompanyCRMConnection(profile.company.id);

      setTestResult(result.success ? {
        success: true,
        message: result.message || 'Conexión exitosa',
        details: result.details || {}
      } : {
        success: false,
        error: result.error || 'Error desconocido'
      });

    } catch (error) {
      console.error('Error testing CRM connection:', error);
      setTestResult({
        success: false,
        error: error.message || 'Error interno del sistema'
      });
    }
  };

  const handleDisconnect = async () => {
    const result = await Swal.fire({
      title: '¿Desconectar CRM?',
      text: '¿Estás seguro de que deseas desconectar el CRM? Se perderá la configuración actual.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, desconectar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setLoading(true);

      if (!profile?.company?.id) {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error: No se pudo identificar la empresa',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#EF4444'
        });
        return;
      }

      const result = await disconnectCompanyCRM(profile.company.id);

      if (!result.success) {
        await Swal.fire({
          icon: 'error',
          title: 'Error al Desconectar',
          text: 'Error al desconectar CRM: ' + result.error,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#EF4444'
        });
        return;
      }

      // Actualizar estado local
      setCrmConfig({
        provider: '',
        config: {},
        connected: false,
        syncStatus: 'disconnected',
        lastSync: null
      });

      await Swal.fire({
        icon: 'success',
        title: '¡Desconectado!',
        text: 'CRM desconectado exitosamente',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#10B981',
        timer: 2000,
        timerProgressBar: true
      });

      // Notificar al componente padre para refrescar datos
      if (onUpdate) {
        onUpdate();
      }

    } catch (error) {
      console.error('Error disconnecting CRM:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error de Conexión',
        text: 'Error al desconectar CRM: ' + error.message,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!crmConfig.provider) return null;

    const variants = {
      connected: 'success',
      error: 'danger',
      syncing: 'warning',
      disconnected: 'secondary'
    };

    const labels = {
      connected: 'Conectado',
      error: 'Error',
      syncing: 'Sincronizando',
      disconnected: 'Desconectado'
    };

    return (
      <Badge variant={variants[crmConfig.syncStatus] || 'secondary'}>
        {labels[crmConfig.syncStatus] || crmConfig.syncStatus}
      </Badge>
    );
  };

  const selectedCRM = crmOptions.find(option => option.value === crmConfig.provider);

  return (
    <div className="mb-6">
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                Configuración CRM
              </h2>
              <p className="text-xs text-gray-600">
                Conecta tu sistema CRM para sincronizar datos automáticamente
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Button
              variant={isEditing ? 'primary' : 'secondary'}
              onClick={() => setIsEditing(!isEditing)}
              disabled={loading}
              leftIcon={isEditing ? <CheckCircle className="w-3 h-3" /> : <Settings className="w-3 h-3" />}
              className="text-xs py-2"
            >
              {isEditing ? 'Cancelar' : 'Configurar'}
            </Button>
          </div>
        </div>

        {/* Estado actual */}
        {crmConfig.connected && !isEditing && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900 text-xs">
                    {selectedCRM?.icon} {selectedCRM?.label} Conectado
                  </p>
                  <p className="text-xs text-green-700">
                    Última sincronización: {crmConfig.lastSync ? new Date(crmConfig.lastSync).toLocaleString('es-CL') : 'Nunca'}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  leftIcon={<TestTube className="w-3 h-3" />}
                  className="text-xs py-1"
                >
                  Probar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDisconnect}
                  leftIcon={<Unlink className="w-3 h-3" />}
                  className="text-xs py-1"
                >
                  Desconectar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Formulario de configuración */}
        {isEditing && (
          <div className="space-y-4">
            {/* Selección de CRM */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Proveedor CRM
              </label>
              <Select
                value={crmConfig.provider}
                onChange={handleProviderChange}
                options={crmOptions}
                className="w-full text-xs"
              />
            </div>

            {/* Campos específicos del CRM */}
            {crmConfig.provider && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  {selectedCRM?.icon} Configuración de {selectedCRM?.label}
                </h3>

                {getCRMFields(crmConfig.provider).map(field => (
                  <Input
                    key={field.name}
                    label={field.label}
                    type={field.type}
                    value={crmConfig.config[field.name] || ''}
                    onChange={(e) => handleConfigChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    helperText={field.help}
                    required={field.required}
                    leftIcon={field.type === 'password' ? <Key className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                    className="text-xs"
                  />
                ))}

                {/* Documentación */}
                {selectedCRM?.docs && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-start gap-2">
                      <ExternalLink className="w-3 h-3 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-900 mb-1 text-xs">Documentación</p>
                        <p className="text-xs text-blue-700 mb-2">
                          Consulta la documentación oficial para obtener tus credenciales:
                        </p>
                        <a
                          href={selectedCRM.docs}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          {selectedCRM.label} API Documentation →
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botones */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="gradient"
                    onClick={handleSave}
                    loading={loading}
                    leftIcon={<CheckCircle className="w-3 h-3" />}
                    className="flex-1 text-xs py-2"
                  >
                    {loading ? 'Guardando...' : 'Guardar Configuración'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    leftIcon={<TestTube className="w-3 h-3" />}
                    className="text-xs py-2"
                  >
                    Probar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Información cuando no está configurado */}
        {!crmConfig.provider && !isEditing && (
          <div className="text-center py-8">
            <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl inline-block mb-4">
              <Settings className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">
              Configura tu CRM
            </h3>
            <p className="text-xs text-gray-600 mb-4 max-w-md mx-auto">
              Conecta tu sistema CRM para sincronizar automáticamente los datos de tus deudores y mantener todo actualizado.
            </p>
            <Button
              variant="primary"
              onClick={() => setIsEditing(true)}
              leftIcon={<Link className="w-3 h-3" />}
              className="text-xs py-2"
            >
              Configurar CRM
            </Button>
          </div>
        )}
      </Card>

      {/* Modal de prueba de conexión */}
      <Modal
        isOpen={testModal}
        onClose={() => setTestModal(false)}
        title="Prueba de Conexión CRM"
        size="md"
      >
        <div className="space-y-6">
          {testResult ? (
            <div className="text-center">
              <div className={`p-4 rounded-2xl inline-block mb-4 ${
                testResult.success ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {testResult.success ? (
                  <CheckCircle className="w-12 h-12 text-green-600" />
                ) : (
                  <AlertCircle className="w-12 h-12 text-red-600" />
                )}
              </div>
              <h3 className={`text-xl font-bold mb-2 ${
                testResult.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {testResult.success ? '¡Conexión Exitosa!' : 'Error de Conexión'}
              </h3>
              <p className={`text-sm mb-4 ${
                testResult.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {testResult.message}
              </p>

              {testResult.success && testResult.details && (
                <div className="bg-gray-50 p-4 rounded-lg text-left">
                  <h4 className="font-semibold text-gray-900 mb-3">Detalles de la conexión:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contactos encontrados:</span>
                      <span className="font-semibold">{testResult.details.contacts.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Última sincronización:</span>
                      <span className="font-semibold">{new Date(testResult.details.lastSync).toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Versión API:</span>
                      <span className="font-semibold">{testResult.details.version}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Probando conexión...
              </h3>
              <p className="text-gray-600">
                Verificando credenciales y conectividad con {selectedCRM?.label}
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setTestModal(false)}
              className="flex-1"
            >
              Cerrar
            </Button>
            {testResult?.success && (
              <Button
                variant="gradient"
                onClick={() => setTestModal(false)}
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

export default CRMConfiguration;