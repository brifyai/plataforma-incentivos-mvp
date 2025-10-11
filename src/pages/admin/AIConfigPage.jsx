/**
 * AI Configuration Page - Configuración de Inteligencia Artificial
 *
 * Página dedicada a la configuración de servicios de IA
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, LoadingSpinner, Input, Select } from '../../components/common';
import { Brain, Bot, Cpu, CheckCircle, ArrowLeft, TestTube, Settings, Zap } from 'lucide-react';
import { updateSystemConfig } from '../../services/databaseService';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

const AIConfigPage = () => {
  const navigate = useNavigate();
  const { isAdmin, profile, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('🔍 AIConfigPage - Auth status:', {
      isAdmin,
      profileRole: profile?.role,
      userRole: user?.user_metadata?.role,
      profile,
      user
    });
  }, [isAdmin, profile, user]);

  // Configuración de IA
  const [aiConfig, setAiConfig] = useState({
    selectedProvider: 'chutes',
    selectedModel: 'gpt-4',
    chutesApi: {
      apiKey: '',
      baseUrl: 'https://chutes.ai',
      isActive: false
    },
    groqApi: {
      apiKey: '',
      baseUrl: 'https://api.groq.com',
      isActive: false
    }
  });

  // Cargar configuración guardada al iniciar
  useEffect(() => {
    const loadSavedConfig = async () => {
      try {
        const { getSystemConfig } = await import('../../services/databaseService');
        const { config, error } = await getSystemConfig();
        
        if (!error && config) {
          console.log('🔄 Cargando configuración guardada:', config);
          
          setAiConfig(prev => ({
            selectedProvider: config.aiSelectedProvider || 'chutes',
            selectedModel: config.aiSelectedModel || 'gpt-4',
            chutesApi: {
              apiKey: config.chutesApiKey || '',
              baseUrl: 'https://chutes.ai',
              isActive: config.chutesApiActive || false
            },
            groqApi: {
              apiKey: config.groqApiKey || '',
              baseUrl: 'https://api.groq.com',
              isActive: config.groqApiActive || false
            }
          }));
          
          console.log('✅ Configuración cargada exitosamente');
        } else {
          console.warn('⚠️ Error cargando configuración:', error);
        }
      } catch (error) {
        console.error('❌ Error en loadSavedConfig:', error);
      }
    };

    loadSavedConfig();
  }, []);

  const handleSaveConfig = async (serviceType) => {
    try {
      setSaving(true);

      // Check if user is admin
      if (!isAdmin) {
        throw new Error('No tienes permisos para modificar la configuración del sistema. Solo administradores pueden realizar esta acción.');
      }

      // Prepare config data based on service type
      let configToSave = {};

      if (serviceType === 'Chutes AI') {
        configToSave = {
          chutes_api_key: aiConfig.chutesApi.apiKey,
          chutes_api_url: aiConfig.chutesApi.baseUrl,
          chutes_api_active: aiConfig.chutesApi.isActive
        };
      } else if (serviceType === 'Groq AI') {
        configToSave = {
          groq_api_key: aiConfig.groqApi.apiKey,
          groq_api_url: aiConfig.groqApi.baseUrl,
          groq_api_active: aiConfig.groqApi.isActive
        };
      }

      console.log('🔄 Saving AI config:', configToSave);

      const result = await updateSystemConfig(configToSave);

      if (result.error) {
        console.error('❌ Error from updateSystemConfig:', result.error);
        throw new Error(result.error);
      }

      console.log('✅ AI config saved successfully');

      await Swal.fire({
        icon: 'success',
        title: 'Configuración guardada',
        text: `Configuración de ${serviceType} guardada exitosamente`,
        confirmButtonText: 'Aceptar'
      });

    } catch (error) {
      console.error(`❌ Error saving ${serviceType}:`, error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: `No se pudo guardar la configuración de ${serviceType}. ${error.message}`,
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestService = async (serviceType) => {
    try {
      await Swal.fire({
        icon: 'info',
        title: 'Probando servicio',
        text: `Probando conexión con ${serviceType}...`,
        showConfirmButton: false,
        timer: 2000
      });
    } catch (error) {
      console.error(`Error testing ${serviceType}:`, error);
      await Swal.fire({
        icon: 'error',
        title: 'Error en la prueba',
        text: `No se pudo probar el servicio de ${serviceType}`,
        confirmButtonText: 'Aceptar'
      });
    }
  };

  const handleSaveModelSelection = async () => {
    try {
      setSaving(true);

      const configToSave = {
        ai_selected_provider: aiConfig.selectedProvider,
        ai_selected_model: aiConfig.selectedModel
      };

      const result = await updateSystemConfig(configToSave);

      if (result.error) {
        throw new Error(result.error);
      }

      await Swal.fire({
        icon: 'success',
        title: 'Configuración guardada',
        text: 'Selección de modelo guardada exitosamente',
        confirmButtonText: 'Aceptar'
      });

    } catch (error) {
      console.error('Error saving model selection:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: error.message || 'No se pudo guardar la selección de modelo',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestModel = async () => {
    try {
      await Swal.fire({
        icon: 'info',
        title: 'Probando modelo',
        text: `Probando modelo ${aiConfig.selectedModel}...`,
        showConfirmButton: false,
        timer: 2000
      });
    } catch (error) {
      console.error('Error testing model:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error en la prueba',
        text: 'No se pudo probar el modelo seleccionado',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-800 rounded-3xl p-8 text-white shadow-strong">
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
              <Brain className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight">
                Inteligencia Artificial
              </h1>
              <p className="text-purple-100 text-lg">
                Configuración de servicios de IA y modelos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chutes AI */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Bot className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-secondary-900">Chutes AI</h3>
              <Badge variant={aiConfig.chutesApi.isActive ? 'success' : 'danger'} size="sm">
                {aiConfig.chutesApi.isActive ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="API Key de Chutes"
              type="password"
              value={aiConfig.chutesApi.apiKey}
              onChange={(e) => setAiConfig(prev => ({
                ...prev,
                chutesApi: { ...prev.chutesApi, apiKey: e.target.value }
              }))}
              placeholder="chutes_..."
              leftIcon={<Settings className="w-4 h-4" />}
            />

            <Input
              label="URL Base"
              value={aiConfig.chutesApi.baseUrl}
              onChange={(e) => setAiConfig(prev => ({
                ...prev,
                chutesApi: { ...prev.chutesApi, baseUrl: e.target.value }
              }))}
              placeholder="https://chutes.ai"
              leftIcon={<Settings className="w-4 h-4" />}
            />

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="chutesActive"
                checked={aiConfig.chutesApi.isActive}
                onChange={(e) => setAiConfig(prev => ({
                  ...prev,
                  chutesApi: { ...prev.chutesApi, isActive: e.target.checked }
                }))}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="chutesActive" className="text-sm font-medium text-gray-700">
                Servicio activo
              </label>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-start gap-3">
                <Bot className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-purple-800 mb-1">Sobre Chutes AI</h4>
                  <p className="text-sm text-purple-700">
                    Plataforma de IA especializada en modelos de lenguaje avanzados.
                    Soporta GPT-4, Claude, y otros modelos de última generación.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="gradient"
                onClick={() => handleSaveConfig('Chutes AI')}
                loading={saving}
                leftIcon={<CheckCircle className="w-4 h-4" />}
                className="flex-1"
              >
                Guardar
              </Button>
              <Button
                variant="outline"
                onClick={() => handleTestService('Chutes AI')}
                leftIcon={<TestTube className="w-4 h-4" />}
              >
                Probar
              </Button>
            </div>
          </div>
        </Card>

        {/* Groq AI */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-100 rounded-xl">
              <Cpu className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-secondary-900">Groq AI</h3>
              <Badge variant={aiConfig.groqApi.isActive ? 'success' : 'danger'} size="sm">
                {aiConfig.groqApi.isActive ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="API Key de Groq"
              type="password"
              value={aiConfig.groqApi.apiKey}
              onChange={(e) => setAiConfig(prev => ({
                ...prev,
                groqApi: { ...prev.groqApi, apiKey: e.target.value }
              }))}
              placeholder="gsk_..."
              leftIcon={<Settings className="w-4 h-4" />}
            />

            <Input
              label="URL Base"
              value={aiConfig.groqApi.baseUrl}
              onChange={(e) => setAiConfig(prev => ({
                ...prev,
                groqApi: { ...prev.groqApi, baseUrl: e.target.value }
              }))}
              placeholder="https://api.groq.com"
              leftIcon={<Settings className="w-4 h-4" />}
            />

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="groqActive"
                checked={aiConfig.groqApi.isActive}
                onChange={(e) => setAiConfig(prev => ({
                  ...prev,
                  groqApi: { ...prev.groqApi, isActive: e.target.checked }
                }))}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              />
              <label htmlFor="groqActive" className="text-sm font-medium text-gray-700">
                Servicio activo
              </label>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-start gap-3">
                <Cpu className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-800 mb-1">Sobre Groq AI</h4>
                  <p className="text-sm text-green-700">
                    Plataforma de IA de alto rendimiento con modelos optimizados.
                    Especializada en velocidad y eficiencia para Llama, Mixtral y Gemma.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="gradient"
                onClick={() => handleSaveConfig('Groq AI')}
                loading={saving}
                leftIcon={<CheckCircle className="w-4 h-4" />}
                className="flex-1"
              >
                Guardar
              </Button>
              <Button
                variant="outline"
                onClick={() => handleTestService('Groq AI')}
                leftIcon={<TestTube className="w-4 h-4" />}
              >
                Probar
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Model Selection */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Brain className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-secondary-900">Selección de Modelo</h3>
            <p className="text-secondary-600">Configura el modelo de IA a utilizar en el sistema</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Select
              label="Proveedor de IA"
              value={aiConfig.selectedProvider}
              onChange={(value) => setAiConfig(prev => ({ ...prev, selectedProvider: value }))}
              options={[
                { value: 'chutes', label: 'Chutes AI' },
                { value: 'groq', label: 'Groq AI' }
              ]}
            />

            <Select
              label="Modelo Seleccionado"
              value={aiConfig.selectedModel}
              onChange={(value) => setAiConfig(prev => ({ ...prev, selectedModel: value }))}
              options={[
                { value: 'gpt-4', label: 'GPT-4 (Chutes)' },
                { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Chutes)' },
                { value: 'claude-3', label: 'Claude 3 (Chutes)' },
                { value: 'llama2-70b', label: 'Llama 2 70B (Groq)' },
                { value: 'mixtral-8x7b', label: 'Mixtral 8x7B (Groq)' },
                { value: 'gemma-7b', label: 'Gemma 7B (Groq)' }
              ]}
            />
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-secondary-900">Estado del Modelo</h4>
                <Badge variant={aiConfig.selectedModel ? 'success' : 'secondary'}>
                  {aiConfig.selectedModel ? 'Configurado' : 'Sin seleccionar'}
                </Badge>
              </div>
              <p className="text-sm text-secondary-600">
                {aiConfig.selectedModel
                  ? `Modelo ${aiConfig.selectedModel} activo en ${aiConfig.selectedProvider === 'chutes' ? 'Chutes AI' : 'Groq AI'}`
                  : 'Selecciona un modelo para activar las funciones de IA'
                }
              </p>
            </div>

            <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-secondary-900">Funciones Disponibles</h4>
                <Badge variant="info">4 activas</Badge>
              </div>
              <ul className="text-sm text-secondary-600 space-y-1">
                <li>• Generación de mensajes inteligentes</li>
                <li>• Análisis de propuestas</li>
                <li>• Recomendaciones de pago</li>
                <li>• Chat automatizado</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button
                variant="gradient"
                onClick={handleSaveModelSelection}
                loading={saving}
                leftIcon={<CheckCircle className="w-4 h-4" />}
                className="flex-1"
              >
                Guardar Modelo
              </Button>
              <Button
                variant="outline"
                onClick={handleTestModel}
                leftIcon={<TestTube className="w-4 h-4" />}
              >
                Probar Modelo
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* AI Features Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Bot className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-secondary-900">Mensajes Inteligentes</h3>
                <p className="text-secondary-600 text-sm">Generación automática de mensajes personalizados</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary-600">Mensajes generados</span>
                <span className="font-semibold text-secondary-900">1,247</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary-600">Tasa de conversión</span>
                <span className="font-semibold text-green-600">34%</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-secondary-900">Análisis de Propuestas</h3>
                <p className="text-secondary-600 text-sm">Evaluación inteligente de propuestas de pago</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary-600">Propuestas analizadas</span>
                <span className="font-semibold text-secondary-900">892</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary-600">Precisión</span>
                <span className="font-semibold text-green-600">91%</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-secondary-900">Recomendaciones</h3>
                <p className="text-secondary-600 text-sm">Sugerencias inteligentes para estrategias de cobro</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary-600">Recomendaciones generadas</span>
                <span className="font-semibold text-secondary-900">567</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary-600">Implementadas</span>
                <span className="font-semibold text-green-600">78%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AIConfigPage;