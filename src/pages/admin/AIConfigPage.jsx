/**
 * AI Configuration Page - Configuración de Inteligencia Artificial
 *
 * Página dedicada a la configuración de servicios de IA
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, LoadingSpinner, Input, Select } from '../../components/common';
import { ConfigStatsCards, ConfigServiceList } from '../../components/common';
import { Brain, Bot, Cpu, CheckCircle, ArrowLeft, TestTube, Settings, Zap, AlertTriangle } from 'lucide-react';
import { useAIConfig } from '../../hooks/useAIConfig';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

const AIConfigPage = () => {
  const navigate = useNavigate();
  const { isAdmin, profile, user } = useAuth();

  // Usar el custom hook para toda la lógica de configuración
  const {
    aiConfig,
    loading,
    saving,
    updateConfig,
    updateChutesApi,
    updateGroqApi,
    saveServiceConfig,
    saveModelSelection,
    testService,
    testModel
  } = useAIConfig();

  // Debug logging
  console.log('🔍 AIConfigPage - Auth status:', {
    isAdmin,
    profileRole: profile?.role,
    userRole: user?.user_metadata?.role,
    profile,
    user
  });

  // Handlers que delegan al hook
  const handleSaveConfig = async (serviceType) => {
    if (!isAdmin) {
      await Swal.fire({
        icon: 'error',
        title: 'Permisos insuficientes',
        text: 'No tienes permisos para modificar la configuración del sistema. Solo administradores pueden realizar esta acción.',
        confirmButtonText: 'Aceptar'
      });
      return;
    }
    await saveServiceConfig(serviceType);
  };

  const handleTestService = async (serviceType) => {
    await testService(serviceType);
  };

  const handleSaveModelSelection = async () => {
    await saveModelSelection();
  };

  const handleTestModel = async () => {
    await testModel();
  };

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
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold tracking-tight">
                  Inteligencia Artificial
                </h1>
                <p className="text-primary-100 text-sm">
                  Configuración de servicios de IA y modelos
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <ConfigStatsCards
        stats={[
          {
            icon: Bot,
            iconBg: 'from-purple-100 to-purple-200',
            iconColor: 'purple',
            value: aiConfig.chutesApi.isActive ? 'Activo' : 'Inactivo',
            label: 'Chutes AI',
            isActive: aiConfig.chutesApi.isActive,
            statusText: aiConfig.chutesApi.isActive ? 'Configurado' : 'Requiere atención'
          },
          {
            icon: Cpu,
            iconBg: 'from-green-100 to-green-200',
            iconColor: 'green',
            value: aiConfig.groqApi.isActive ? 'Activo' : 'Inactivo',
            label: 'Groq AI',
            isActive: aiConfig.groqApi.isActive,
            statusText: aiConfig.groqApi.isActive ? 'Configurado' : 'Requiere atención'
          },
          {
            icon: Brain,
            iconBg: 'from-blue-100 to-blue-200',
            iconColor: 'blue',
            value: aiConfig.selectedModel || 'Sin seleccionar',
            label: 'Modelo Activo',
            extraInfo: aiConfig.selectedProvider === 'chutes' ? 'Chutes AI' : aiConfig.selectedProvider === 'groq' ? 'Groq AI' : 'Sin proveedor'
          },
          {
            icon: Zap,
            iconBg: 'from-orange-100 to-orange-200',
            iconColor: 'orange',
            value: (aiConfig.chutesApi.isActive || aiConfig.groqApi.isActive) ? 'Activos' : 'Inactivos',
            label: 'Servicios IA',
            extraInfo: `${[aiConfig.chutesApi.isActive, aiConfig.groqApi.isActive].filter(Boolean).length} de 2`
          }
        ]}
      />

      {/* Filters and Search */}
      <Card className="mt-6">
        <div className="p-6">
          <div className="flex flex-row gap-4 items-center">
            <div className="flex-1 mt-4">
              <div className="relative">
                <Brain className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
                <Input
                  placeholder="Buscar servicios de IA..."
                  value=""
                  onChange={() => {}}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-secondary-400" />
              <select
                value="all"
                onChange={() => {}}
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* AI Services List */}
      <ConfigServiceList
        title="Servicios de Inteligencia Artificial"
        services={[
          {
            id: 'chutes',
            name: 'Chutes AI',
            description: 'Plataforma de IA especializada en modelos avanzados',
            icon: Bot,
            iconBg: 'from-purple-500 to-purple-600',
            color: 'purple',
            isActive: aiConfig.chutesApi.isActive,
            statusText: aiConfig.chutesApi.isActive ? 'Configurado' : 'Requiere atención',
            metrics: [
              { value: aiConfig.chutesApi.apiKey ? 'Configurada' : 'Pendiente', label: 'API Key' },
              { value: aiConfig.chutesApi.baseUrl, label: 'URL Base' },
              { value: aiConfig.chutesApi.isActive ? 'Activo' : 'Inactivo', label: 'Estado' },
              { value: 'GPT-4, Claude', label: 'Modelos' }
            ],
            onConfigure: () => {/* TODO: Open Chutes config modal */},
            onTest: () => handleTestService('Chutes AI')
          },
          {
            id: 'groq',
            name: 'Groq AI',
            description: 'Plataforma de IA de alto rendimiento y velocidad',
            icon: Cpu,
            iconBg: 'from-green-500 to-green-600',
            color: 'green',
            isActive: aiConfig.groqApi.isActive,
            statusText: aiConfig.groqApi.isActive ? 'Configurado' : 'Requiere atención',
            metrics: [
              { value: aiConfig.groqApi.apiKey ? 'Configurada' : 'Pendiente', label: 'API Key' },
              { value: aiConfig.groqApi.baseUrl, label: 'URL Base' },
              { value: aiConfig.groqApi.isActive ? 'Activo' : 'Inactivo', label: 'Estado' },
              { value: 'Llama, Mixtral', label: 'Modelos' }
            ],
            onConfigure: () => {/* TODO: Open Groq config modal */},
            onTest: () => handleTestService('Groq AI')
          }
        ]}
        onSaveAll={() => {/* TODO: Save all services */}}
        saving={saving}
      />

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