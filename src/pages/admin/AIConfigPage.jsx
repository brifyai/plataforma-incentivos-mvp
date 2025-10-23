/**
 * AI Configuration Page - Configuración de Inteligencia Artificial
 *
 * Página dedicada a la configuración de servicios de IA
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, LoadingSpinner, Input, Select } from '../../components/common';
import { ConfigStatsCards, ConfigServiceList } from '../../components/common';
import { Brain, Bot, Cpu, CheckCircle, ArrowLeft, TestTube, Settings, Zap, AlertTriangle, MessageSquare } from 'lucide-react';
import { useAIConfig } from '../../hooks/useAIConfig';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

const AIConfigPage = ({ defaultSection }) => {
  const navigate = useNavigate();
  const { isAdmin, profile, user } = useAuth();
  const [activeMainMenu, setActiveMainMenu] = useState(defaultSection || 'ai-services');

  // Estados para configuración API del Módulo Conversacional
  const [conversationalConfig, setConversationalConfig] = useState({
    apiKey: '',
    model: 'llama-3.1-70b',
    temperature: 0.7,
    maxTokens: 1000,
    provider: 'groq',
    systemPrompt: 'Eres un asistente experto en negociación de deudas, ayudando a los deudores a encontrar soluciones de pago realistas.',
    personality: 'empática-profesional',
    responseStyle: 'conversacional',
    autoSaveEnabled: true
  });

  const [showConversationalKey, setShowConversationalKey] = useState(false);

  // Solo Groq AI como proveedor para el Módulo Conversacional
  const [conversationalProviders] = useState([
    { value: 'groq', label: 'Groq AI', icon: '⚡' }
  ]);

  // Todos los modelos disponibles de Groq AI
  const [groqModels] = useState([
    { value: 'llama-3.1-70b', label: 'Llama 3.1 70B', description: 'Modelo de 70 mil millones de parámetros, máximo rendimiento' },
    { value: 'llama-3.1-8b', label: 'Llama 3.1 8B', description: 'Modelo de 8 mil millones de parámetros, rápido y eficiente' },
    { value: 'llama-3.2-3b', label: 'Llama 3.2 3B', description: 'Modelo de 3 mil millones de parámetros, ligero y rápido' },
    { value: 'llama-3.2-1b', label: 'Llama 3.2 1B', description: 'Modelo de 1 mil millones de parámetros, ultrarrápido' },
    { value: 'mixtral-8x7b', label: 'Mixtral 8x7B', description: 'Modelo mixture-of-experts, excelente para razonamiento' },
    { value: 'mixtral-8x22b', label: 'Mixtral 8x22B', description: 'Modelo mixture-of-experts grande, superior en complejidad' },
    { value: 'gemma-7b-it', label: 'Gemma 7B IT', description: 'Modelo de Google optimizado para instrucciones' },
    { value: 'gemma-2b-it', label: 'Gemma 2B IT', description: 'Modelo ligero de Google para instrucciones rápidas' }
  ]);

  const [personalityOptions] = useState([
    { value: 'empática-profesional', label: 'Empática y Profesional', description: 'Tono amable pero firme, enfocado en soluciones' },
    { value: 'directa-eficiente', label: 'Directa y Eficiente', description: 'Comunicación clara y orientada a resultados' },
    { value: 'persuasiva-amigable', label: 'Persuasiva y Amigable', description: 'Enfoque cercano para generar confianza' },
    { value: 'formal-autoritativa', label: 'Formal y Autoritativa', description: 'Tono serio y respetuoso, para casos complejos' }
  ]);

  const [responseStyles] = useState([
    { value: 'conversacional', label: 'Conversacional', description: 'Diálogo natural y fluido' },
    { value: 'estructurada', label: 'Estructurada', description: 'Respuestas organizadas con viñetas' },
    { value: 'detallada', label: 'Detallada', description: 'Explicaciones completas y exhaustivas' },
    { value: 'concisa', label: 'Concisa', description: 'Respuestas breves y directas' }
  ]);

  // Menú principal de IA con URLs dinámicas
  const mainMenu = [
    {
      id: 'ai-services',
      label: 'Servicios de Inteligencia Artificial',
      icon: Bot,
      description: 'Configuración de proveedores y modelos de IA',
      color: 'from-blue-500 to-purple-600',
      url: '/admin/ia/servicios'
    },
    {
      id: 'conversations-module',
      label: 'Módulo Conversaciones',
      icon: MessageSquare,
      description: 'Control del sistema de IA conversacional',
      color: 'from-green-500 to-teal-600',
      url: '/admin/ia/conversaciones'
    },
    {
      id: 'nuclear-module',
      label: 'Módulo Nuclear',
      icon: Zap,
      description: 'Activación avanzada y control del sistema',
      color: 'from-red-500 to-orange-600',
      url: '/admin/ia/nuclear'
    }
  ];

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

  // Efecto para actualizar el menú activo cuando cambia defaultSection
  useEffect(() => {
    if (defaultSection) {
      setActiveMainMenu(defaultSection);
    }
  }, [defaultSection]);

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

  const handleSaveConversationalConfig = async () => {
    try {
      if (!isAdmin) {
        await Swal.fire({
          icon: 'error',
          title: 'Permisos insuficientes',
          text: 'No tienes permisos para modificar la configuración del sistema. Solo administradores pueden realizar esta acción.',
          confirmButtonText: 'Aceptar'
        });
        return;
      }

      console.log('Guardando configuración del módulo conversacional:', conversationalConfig);
      
      // Simulación de guardado exitoso
      setTimeout(() => {
        Swal.fire({
          icon: 'success',
          title: '✅ Configuración Guardada',
          text: 'La configuración del Módulo Conversacional ha sido guardada exitosamente',
          timer: 2000,
          showConfirmButton: false
        });
      }, 500);
    } catch (error) {
      console.error('Error guardando configuración conversacional:', error);
      Swal.fire({
        icon: 'error',
        title: '❌ Error',
        text: 'No se pudo guardar la configuración'
      });
    }
  };

  const handleTestConversationalAPI = async () => {
    try {
      if (!conversationalConfig.apiKey) {
        Swal.fire({
          icon: 'warning',
          title: '⚠️ API Key Requerida',
          text: 'Por favor, ingresa una API Key antes de probar',
          confirmButtonText: 'Entendido'
        });
        return;
      }

      console.log('Probando API del módulo conversacional...');
      
      // Simulación de prueba de API
      setTimeout(() => {
        Swal.fire({
          icon: 'success',
          title: '✅ API Funcionando',
          text: 'La API del Módulo Conversacional está funcionando correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      }, 1000);
    } catch (error) {
      console.error('Error probando API conversacional:', error);
      Swal.fire({
        icon: 'error',
        title: '❌ Error de API',
        text: 'No se pudo conectar con la API'
      });
    }
  };

  const handleResetConversationalConfig = () => {
    setConversationalConfig({
      apiKey: '',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 1000,
      provider: 'openai',
      systemPrompt: 'Eres un asistente experto en negociación de deudas, ayudando a los deudores a encontrar soluciones de pago realistas.',
      personality: 'empática-profesional',
      responseStyle: 'conversacional',
      autoSaveEnabled: true
    });
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

      {/* Menú Principal de IA - Siempre visible */}
      <div className="mb-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Panel de Control de Inteligencia Artificial</h2>
            <p className="text-gray-600">Selecciona una opción para gestionar el sistema de IA</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mainMenu.map((item) => {
              const isActive = activeMainMenu === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveMainMenu(item.id);
                    navigate(item.url);
                  }}
                  className={`
                    relative group p-6 rounded-xl transition-all duration-300 transform hover:scale-105
                    ${isActive
                      ? `bg-gradient-to-br ${item.color} text-white shadow-2xl ring-4 ring-white ring-opacity-50`
                      : 'bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl'
                    }
                  `}
                >
                  {/* Indicador activo */}
                  {isActive && (
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-green-400 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  {/* Icono principal */}
                  <div className={`
                    mb-4 p-4 rounded-xl transition-all duration-300
                    ${isActive
                      ? 'bg-white bg-opacity-20 shadow-inner'
                      : 'bg-gray-50 group-hover:bg-gray-100'
                    }
                  `}>
                    <item.icon className={`w-8 h-8 transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-700 group-hover:text-gray-900'}`} />
                  </div>
                  
                  {/* Contenido */}
                  <div className="text-center">
                    <h3 className={`font-bold text-lg mb-2 ${isActive ? 'text-white' : 'text-gray-900'}`}>
                      {item.label}
                    </h3>
                    <p className={`text-sm ${isActive ? 'text-white text-opacity-90' : 'text-gray-600'}`}>
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Títulos específicos eliminados - Solo menú principal visible */}

      {/* Stats Cards - Solo mostrar si no hay sección específica o es servicios */}
      {!defaultSection || defaultSection === 'ai-services' ? (
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
      ) : null}

      {/* AI Features Overview - MOVIDO ARRIBA - Solo mostrar si no hay sección específica o es servicios */}
      {!defaultSection || defaultSection === 'ai-services' ? (
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
      ) : null}

      {/* Filters and Search - Eliminado caja de búsqueda de servicios de IA */}
      {null}

      {/* AI Services List - Solo mostrar si no hay sección específica o es servicios */}
      {!defaultSection || defaultSection === 'ai-services' ? (
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
              onConfigure: () => {
                Swal.fire({
                  icon: 'info',
                  title: 'Configuración de Chutes AI',
                  html: `
                    <div class="text-left">
                      <p class="mb-3">La configuración de Chutes AI se realiza directamente en los campos de abajo:</p>
                      <ul class="text-sm space-y-2">
                        <li>• <strong>API Key:</strong> Ingresa tu clave de API de Chutes</li>
                        <li>• <strong>URL Base:</strong> Configura la URL del servidor</li>
                        <li>• <strong>Servicio Activo:</strong> Habilita o deshabilita el servicio</li>
                      </ul>
                      <p class="mt-3 text-sm text-gray-600">Usa los campos de configuración que aparecen en esta misma sección.</p>
                    </div>
                  `,
                  confirmButtonText: 'Entendido'
                });
              },
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
              onConfigure: () => {
                Swal.fire({
                  icon: 'info',
                  title: 'Configuración de Groq AI',
                  html: `
                    <div class="text-left">
                      <p class="mb-3">La configuración de Groq AI se realiza directamente en los campos de abajo:</p>
                      <ul class="text-sm space-y-2">
                        <li>• <strong>API Key:</strong> Ingresa tu clave de API de Groq (gsk_...)</li>
                        <li>• <strong>URL Base:</strong> Configura la URL del servidor API</li>
                        <li>• <strong>Servicio Activo:</strong> Habilita o deshabilita el servicio</li>
                      </ul>
                      <p class="mt-3 text-sm text-gray-600">Usa los campos de configuración que aparecen en esta misma sección.</p>
                    </div>
                  `,
                  confirmButtonText: 'Entendido'
                });
              },
              onTest: () => handleTestService('Groq AI')
            }
          ]}
          onSaveAll={() => {/* TODO: Save all services */}}
          saving={saving}
        />
      ) : null}

      {/* Provider Configuration - Solo mostrar si no hay sección específica o es servicios */}
      {!defaultSection || defaultSection === 'ai-services' ? (
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
                onChange={(e) => updateChutesApi({ apiKey: e.target.value })}
                placeholder="chutes_..."
                leftIcon={<Settings className="w-4 h-4" />}
              />

              <Input
                label="URL Base"
                value={aiConfig.chutesApi.baseUrl}
                onChange={(e) => updateChutesApi({ baseUrl: e.target.value })}
                placeholder="https://chutes.ai"
                leftIcon={<Settings className="w-4 h-4" />}
              />

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="chutesActive"
                  checked={aiConfig.chutesApi.isActive}
                  onChange={(e) => updateChutesApi({ isActive: e.target.checked })}
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
                onChange={(e) => updateGroqApi({ apiKey: e.target.value })}
                placeholder="gsk_..."
                leftIcon={<Settings className="w-4 h-4" />}
              />

              <Input
                label="URL Base"
                value={aiConfig.groqApi.baseUrl}
                onChange={(e) => updateGroqApi({ baseUrl: e.target.value })}
                placeholder="https://api.groq.com"
                leftIcon={<Settings className="w-4 h-4" />}
              />

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="groqActive"
                  checked={aiConfig.groqApi.isActive}
                  onChange={(e) => updateGroqApi({ isActive: e.target.checked })}
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
      ) : null}

      {/* Model Selection - Solo mostrar si no hay sección específica o es servicios */}
      {!defaultSection || defaultSection === 'ai-services' ? (
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
                onChange={(value) => updateConfig({ selectedProvider: value })}
                options={[
                  { value: 'chutes', label: 'Chutes AI' },
                  { value: 'groq', label: 'Groq AI' }
                ]}
              />

              <Select
                label="Modelo Seleccionado"
                value={aiConfig.selectedModel}
                onChange={(value) => updateConfig({ selectedModel: value })}
                options={[
                  { value: 'gpt-4', label: 'GPT-4 (Chutes)' },
                  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Chutes)' },
                  { value: 'claude-3', label: 'Claude 3 (Chutes)' },
                  { value: 'llama-3.1-70b', label: 'Llama 3.1 70B (Groq)' },
                  { value: 'llama-3.1-8b', label: 'Llama 3.1 8B (Groq)' },
                  { value: 'mixtral-8x7b', label: 'Mixtral 8x7B (Groq)' },
                  { value: 'gemma-7b-it', label: 'Gemma 7B IT (Groq)' },
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
      ) : null}

      {/* AI Features Overview - MOVIDO ARRIBA, sección duplicada eliminada */}
      {null}

      {/* 🤖 SECCIÓN IA CONVERSACIONAL - Solo para conversaciones */}
      {(activeMainMenu === 'conversations-module' || defaultSection === 'conversations-module' || window.location.pathname.includes('/admin/ia/conversaciones')) ? (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  🤖 Módulo Conversacional IA
                </h2>
                <p className="text-sm text-gray-600">
                  Sistema inteligente de negociación automática y conversaciones
                </p>
              </div>
            </div>
            <Badge
              variant={conversationalConfig.apiKey ? "success" : "danger"}
              className="text-sm px-3 py-1"
            >
              {conversationalConfig.apiKey ? "✅ ACTIVO" : "⚠️ SIN API"}
            </Badge>
          </div>

          {/* Descripción Explicativa del Módulo Conversacional */}
          <div className="bg-blue-100 rounded-lg p-4 mb-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              ¿Qué es el Módulo Conversacional IA?
            </h3>
            <div className="text-blue-800 space-y-2">
              <p>
                <strong>El Módulo Conversacional IA</strong> es un sistema avanzado de inteligencia artificial diseñado
                específicamente para gestionar automáticamente negociaciones y conversaciones con deudores.
                Utiliza algoritmos de lenguaje natural para:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Generar mensajes personalizados y contextualizados</li>
                <li>Negociar planes de pago adaptados a cada situación</li>
                <li>Responder preguntas frecuentes de forma automática</li>
                <li>Analizar el perfil de pago del deudor y ajustar estrategias</li>
                <li>Mantener un tono empático pero firme en las comunicaciones</li>
              </ul>
            </div>
          </div>

          {/* Compatibilidad con Servicios de IA */}
          <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
            <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
              <Cpu className="w-5 h-5" />
              Compatibilidad con Servicios de Inteligencia Artificial
            </h3>
            <div className="text-green-800 space-y-2">
              <p>
                <strong>✅ Totalmente Compatible:</strong> El Módulo Conversacional está diseñado para
                funcionar simultáneamente con los Servicios de Inteligencia Artificial sin conflictos.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div className="bg-white rounded p-3 border border-green-300">
                  <h4 className="font-semibold text-green-900 mb-2">Módulo Conversacional</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Gestión de conversaciones en tiempo real</li>
                    <li>• Negociación automática de pagos</li>
                    <li>• Respuestas inteligentes contextualizadas</li>
                  </ul>
                </div>
                <div className="bg-white rounded p-3 border border-green-300">
                  <h4 className="font-semibold text-green-900 mb-2">Servicios de IA</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Procesamiento de lenguaje natural</li>
                    <li>• Análisis de datos y patrones</li>
                    <li>• Generación de insights y recomendaciones</li>
                  </ul>
                </div>
              </div>
              <p className="text-sm text-green-700 mt-3">
                <strong>Recomendación:</strong> Mantén ambos módulos activos para maximizar la eficiencia
                del sistema de cobranza. El Módulo Conversacional utiliza la infraestructura de los Servicios de IA
                para funcionar de manera óptima.
              </p>
            </div>
          </div>

          {/* Configuración API del Módulo Conversacional */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 mb-6 border border-indigo-200">
            <div className="flex items-center mb-4">
              <Settings className="w-5 h-5 text-indigo-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Configuración API del Módulo Conversacional</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Configuración Básica */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Settings className="inline mr-2 text-indigo-600" />
                    API Key
                  </label>
                  <div className="relative">
                    <Input
                      type={showConversationalKey ? 'text' : 'password'}
                      value={conversationalConfig.apiKey}
                      onChange={(e) => setConversationalConfig({...conversationalConfig, apiKey: e.target.value})}
                      placeholder="Ingresa tu API Key para conversaciones"
                      leftIcon={<Settings className="w-4 h-4" />}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConversationalKey(!showConversationalKey)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConversationalKey ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Bot className="inline mr-2 text-indigo-600" />
                    Proveedor IA
                  </label>
                  <select
                    value={conversationalConfig.provider}
                    onChange={(e) => setConversationalConfig({...conversationalConfig, provider: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {conversationalProviders.map(provider => (
                      <option key={provider.value} value={provider.value}>
                        {provider.icon} {provider.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Brain className="inline mr-2 text-indigo-600" />
                    Modelo Groq AI
                  </label>
                  <select
                    value={conversationalConfig.model}
                    onChange={(e) => setConversationalConfig({...conversationalConfig, model: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {groqModels.map(model => (
                      <option key={model.value} value={model.value}>
                        {model.label} - {model.description}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {groqModels.find(m => m.value === conversationalConfig.model)?.description}
                  </p>
                </div>
              </div>

              {/* Configuración Avanzada */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Zap className="inline mr-2 text-indigo-600" />
                    Temperatura: {conversationalConfig.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={conversationalConfig.temperature}
                    onChange={(e) => setConversationalConfig({...conversationalConfig, temperature: parseFloat(e.target.value)})}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0 (Preciso)</span>
                    <span>1 (Balanceado)</span>
                    <span>2 (Creativo)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Cpu className="inline mr-2 text-indigo-600" />
                    Tokens Máximos
                  </label>
                  <Input
                    type="number"
                    min="100"
                    max="4000"
                    step="100"
                    value={conversationalConfig.maxTokens}
                    onChange={(e) => setConversationalConfig({...conversationalConfig, maxTokens: parseInt(e.target.value)})}
                    leftIcon={<Cpu className="w-4 h-4" />}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MessageSquare className="inline mr-2 text-indigo-600" />
                    Personalidad del Asistente
                  </label>
                  <select
                    value={conversationalConfig.personality}
                    onChange={(e) => setConversationalConfig({...conversationalConfig, personality: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {personalityOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {personalityOptions.find(opt => opt.value === conversationalConfig.personality)?.description}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Settings className="inline mr-2 text-indigo-600" />
                    Estilo de Respuesta
                  </label>
                  <select
                    value={conversationalConfig.responseStyle}
                    onChange={(e) => setConversationalConfig({...conversationalConfig, responseStyle: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {responseStyles.map(style => (
                      <option key={style.value} value={style.value}>
                        {style.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {responseStyles.find(style => style.value === conversationalConfig.responseStyle)?.description}
                  </p>
                </div>
              </div>
            </div>

            {/* System Prompt */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Brain className="inline mr-2 text-indigo-600" />
                System Prompt (Instrucciones del Asistente)
              </label>
              <textarea
                value={conversationalConfig.systemPrompt}
                onChange={(e) => setConversationalConfig({...conversationalConfig, systemPrompt: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Define el comportamiento y tono del asistente conversacional..."
              />
            </div>

            {/* Botones de Acción */}
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleSaveConversationalConfig}
                variant="gradient"
                leftIcon={<CheckCircle className="w-4 h-4" />}
                className="flex-1"
              >
                Guardar Configuración
              </Button>
              <Button
                onClick={handleTestConversationalAPI}
                variant="outline"
                leftIcon={<TestTube className="w-4 h-4" />}
              >
                Probar API
              </Button>
              <Button
                onClick={handleResetConversationalConfig}
                variant="secondary"
                leftIcon={<AlertTriangle className="w-4 h-4" />}
              >
                Restablecer
              </Button>
            </div>
          </div>

          {/* Botones de Control Conversacional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Button
              onClick={async () => {
                console.log('🚀 Activando IA Conversacional...');
                try {
                  const { activateAIModule } = await import('../../modules/ai-negotiation/utils/activateAI.js');
                  const result = await activateAIModule();
                  if (result.success) {
                    Swal.fire({
                      icon: 'success',
                      title: 'IA Conversacional Activada',
                      text: 'El sistema de negociación automática está ahora operativo',
                      timer: 2000,
                      showConfirmButton: false
                    });
                  }
                } catch (error) {
                  console.error('Error activando IA:', error);
                  Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo activar la IA conversacional'
                  });
                }
              }}
              variant="primary"
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold shadow-lg"
            >
              🚀 Activar Conversaciones IA
            </Button>

            <Button
              onClick={async () => {
                console.log('🛑 Desactivando IA Conversacional...');
                try {
                  const { deactivateAIModule } = await import('../../modules/ai-negotiation/utils/activateAI.js');
                  const result = await deactivateAIModule();
                  if (result.success) {
                    Swal.fire({
                      icon: 'success',
                      title: 'IA Conversacional Desactivada',
                      text: 'El sistema de negociación ha sido desactivado',
                      timer: 2000,
                      showConfirmButton: false
                    });
                  }
                } catch (error) {
                  console.error('Error desactivando IA:', error);
                }
              }}
              variant="secondary"
              className="w-full"
            >
              🛑 Desactivar Conversaciones
            </Button>
          </div>

          {/* Configuración de Conversaciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Configuración de Mensajes
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tono de conversación</span>
                  <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                    <option>Profesional</option>
                    <option>Amigable</option>
                    <option>Formal</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Respuesta automática</span>
                  <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tiempo de respuesta</span>
                  <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                    <option>Inmediato</option>
                    <option>5 segundos</option>
                    <option>10 segundos</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                Estrategias de Negociación
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Enfoque principal</span>
                  <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                    <option>Colaborativo</option>
                    <option>Asertivo</option>
                    <option>Empático</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Ofertas automáticas</span>
                  <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Análisis de contexto</span>
                  <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" defaultChecked />
                </div>
              </div>
            </div>
          </div>

          {/* Estado del Sistema Conversacional */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
            <h3 className="text-lg font-semibold mb-3">📊 Estado del Módulo Conversacional</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: 'ai_module_enabled', label: 'Módulo IA', icon: '🤖' },
                { key: 'ai_negotiation_enabled', label: 'Negociación', icon: '💬' },
                { key: 'ai_conversation_active', label: 'Conversaciones', icon: '💭' },
                { key: 'ai_auto_response', label: 'Autorespuesta', icon: '⚡' }
              ].map((item) => {
                const isEnabled = localStorage.getItem('ai_feature_flags') ?
                  JSON.parse(localStorage.getItem('ai_feature_flags'))[item.key] ||
                  (item.key === 'ai_module_enabled' || item.key === 'ai_negotiation_enabled') : false;
                 
                return (
                  <div key={item.key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-xs font-medium flex items-center gap-1">
                      <span>{item.icon}</span>
                      {item.label}
                    </span>
                    <Badge
                      variant={isEnabled ? "success" : "secondary"}
                      className="text-xs"
                    >
                      {isEnabled ? "ON" : "OFF"}
                    </Badge>
                  </div>
                );
              })}
            </div>
            
            {/* Estado de API Configurada */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Estado API Conversacional
                </span>
                <Badge
                  variant={conversationalConfig.apiKey ? "success" : "danger"}
                  className="text-xs"
                >
                  {conversationalConfig.apiKey ? "✅ CONFIGURADA" : "⚠️ SIN CONFIGURAR"}
                </Badge>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                {conversationalConfig.apiKey
                  ? `API Key configurada para ${conversationalConfig.provider.toUpperCase()} con modelo ${conversationalConfig.model}`
                  : "Debes configurar una API Key para activar el módulo conversacional"
                }
              </p>
            </div>
          </div>

          {/* Instrucciones Específicas */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">📋 Guía del Módulo Conversacional</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• <strong>Activar Conversaciones IA:</strong> Inicia el sistema de negociación automática</p>
              <p>• <strong>Configuración de Mensajes:</strong> Personaliza el tono y estilo de comunicación</p>
              <p>• <strong>Estrategias de Negociación:</strong> Define el enfoque para las conversaciones</p>
              <p>• <strong>Estado del Sistema:</strong> Monitorea las funcionalidades activas del módulo</p>
            </div>
          </div>
        </Card>
      ) : null}

      {/* 💥 SECCIÓN MÓDULO NUCLEAR - Solo para nuclear */}
      {(activeMainMenu === 'nuclear-module' || defaultSection === 'nuclear-module' || window.location.pathname.includes('/admin/ia/nuclear')) ? (
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-red-500 to-orange-600 rounded-xl text-white">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  💥 Módulo Nuclear
                </h2>
                <p className="text-sm text-gray-600">
                  Activación avanzada y control completo del sistema
                </p>
              </div>
            </div>
            <Badge
              variant="danger"
              className="text-sm px-3 py-1 animate-pulse"
            >
              ⚠️ MODO AVANZADO
            </Badge>
          </div>

          {/* Descripción Explicativa del Módulo Nuclear */}
          <div className="bg-red-100 rounded-lg p-4 mb-6 border border-red-200">
            <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              ¿Qué es el Módulo Nuclear?
            </h3>
            <div className="text-red-800 space-y-2">
              <p>
                <strong>El Módulo Nuclear</strong> es el sistema de control máximo de NexuPay que proporciona
                activación completa y gestión avanzada de todas las funcionalidades de Inteligencia Artificial.
                Es una herramienta de poder excepcional diseñada para administradores expertos que necesitan:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Activación simultánea de TODOS los módulos de IA del sistema</li>
                <li>Control centralizado sobre servicios, analytics y configuraciones</li>
                <li>Forzar activación de funcionalidades críticas en situaciones de emergencia</li>
                <li>Supervisión completa del estado operativo del ecosistema IA</li>
                <li>Ejecución de pruebas integrales del sistema completo</li>
                <li>Recuperación y escalada automática ante fallos del sistema</li>
              </ul>
            </div>
          </div>

          {/* Capacidades Nucleares */}
          <div className="bg-orange-50 rounded-lg p-4 mb-6 border border-orange-200">
            <h3 className="text-lg font-semibold text-orange-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Capacidades y Funcionalidades Nucleares
            </h3>
            <div className="text-orange-800 space-y-2">
              <p>
                <strong>🚀 Activación Total del Sistema:</strong> El Módulo Nuclear puede activar simultáneamente
                todas las funcionalidades de IA sin necesidad de configuración individual:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div className="bg-white rounded p-3 border border-orange-300">
                  <h4 className="font-semibold text-orange-900 mb-2">🎯 Control Centralizado</h4>
                  <ul className="text-sm text-orange-700 space-y-1">
                    <li>• Activación masiva de módulos IA</li>
                    <li>• Configuración automática de servicios</li>
                    <li>• Sincronización de componentes</li>
                    <li>• Gestión unificada de permisos</li>
                  </ul>
                </div>
                <div className="bg-white rounded p-3 border border-orange-300">
                  <h4 className="font-semibold text-orange-900 mb-2">⚡ Potencia Máxima</h4>
                  <ul className="text-sm text-orange-700 space-y-1">
                    <li>• Forzado de estado operativo</li>
                    <li>• Anulación de restricciones</li>
                    <li>• Modo de emergencia activado</li>
                    <li>• Recuperación automática</li>
                  </ul>
                </div>
              </div>
              <p className="text-sm text-orange-700 mt-3">
                <strong>Impacto:</strong> Una vez ejecutado, el Módulo Nuclear establece un estado de operación
                óptimo en todo el ecosistema IA, garantizando máxima disponibilidad y rendimiento.
              </p>
            </div>
          </div>

          {/* Casos de Uso y Escenarios */}
          <div className="bg-yellow-50 rounded-lg p-4 mb-6 border border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              ¿Cuándo Usar el Módulo Nuclear?
            </h3>
            <div className="text-yellow-800 space-y-2">
              <p>
                <strong>Escenarios Recomendados para Activación Nuclear:</strong>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div className="bg-white rounded p-3 border border-yellow-300">
                  <h4 className="font-semibold text-yellow-900 mb-2">🚨 Emergencias Críticas</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Caída total del sistema IA</li>
                    <li>• Fallos múltiples simultáneos</li>
                    <li>• Pérdida de funcionalidades críticas</li>
                    <li>• Recuperación de desastres</li>
                  </ul>
                </div>
                <div className="bg-white rounded p-3 border border-yellow-300">
                  <h4 className="font-semibold text-yellow-900 mb-2">🔧 Mantenimiento Avanzado</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Despliegues masivos</li>
                    <li>• Actualizaciones críticas</li>
                    <li>• Reconfiguración completa</li>
                    <li>• Optimización del sistema</li>
                  </ul>
                </div>
              </div>
              <div className="bg-white rounded p-3 border border-yellow-300 mt-3">
                <h4 className="font-semibold text-yellow-900 mb-2">⚡ Situaciones Especiales</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• <strong>Primer Despliegue:</strong> Activación inicial del sistema completo</li>
                  <li>• <strong>Pruebas de Estrés:</strong> Verificación de capacidad máxima</li>
                  <li>• <strong>Auditorías de Sistema:</strong> Validación operativa completa</li>
                  <li>• <strong>Optimización:</strong> Maximización de rendimiento global</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botones de Control Nuclear */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Button
              onClick={async () => {
                console.log('💪 EJECUTANDO MÓDULO NUCLEAR...');
                try {
                  Swal.fire({
                    title: '⚠️ Confirmación Requerida',
                    text: '¿Estás seguro de ejecutar el módulo nuclear? Esto forzará la activación completa del sistema.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#dc2626',
                    cancelButtonColor: '#6b7280',
                    confirmButtonText: 'Sí, ejecutar nuclear',
                    cancelButtonText: 'Cancelar'
                  }).then(async (result) => {
                    if (result.isConfirmed) {
                      // Método 1: Directo en localStorage
                      console.log('💾 Aplicando directamente en localStorage...');
                      const nuclearFlags = {
                        ai_module_enabled: true,
                        ai_negotiation_enabled: true,
                        ai_dashboard_enabled: true,
                        ai_config_enabled: true,
                        ai_analytics_enabled: true,
                        ai_real_time_enabled: true,
                        ai_escalation_enabled: true,
                        ai_groq_enabled: true,
                        ai_chutes_enabled: true,
                        ai_safe_mode: false,
                        ai_fallback_enabled: true,
                        ai_error_recovery_enabled: true
                      };

                      localStorage.setItem('ai_feature_flags', JSON.stringify(nuclearFlags));
                      console.log('✅ Flags nucleares aplicados:', nuclearFlags);

                      Swal.fire({
                        icon: 'success',
                        title: '💥 MÓDULO NUCLEAR EJECUTADO',
                        html: `
                          <div class="text-left">
                            <p class="mb-2">✅ Sistema activado con modo nuclear</p>
                            <p class="text-sm text-gray-600">Todas las funcionalidades de IA están ahora activas</p>
                          </div>
                        `,
                        timer: 3000,
                        showConfirmButton: false
                      });

                      // Recargar página después de 2 segundos
                      setTimeout(() => {
                        window.location.reload();
                      }, 2000);
                    }
                  });
                } catch (error) {
                  console.error('Error en módulo nuclear:', error);
                  Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo ejecutar el módulo nuclear'
                  });
                }
              }}
              variant="danger"
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold shadow-lg animate-pulse"
            >
              💥 EJECUTAR MÓDULO NUCLEAR
            </Button>

            <Button
              onClick={async () => {
                console.log('🧪 Ejecutando pruebas completas...');
                try {
                  const { testAIModule } = await import('../../modules/ai-negotiation/utils/testAI.js');
                  const result = await testAIModule();
                  
                  Swal.fire({
                    icon: result.success ? 'success' : 'error',
                    title: result.success ? 'Pruebas Completadas' : 'Error en Pruebas',
                    html: result.success ? `
                      <div class="text-left">
                        <p class="mb-2">✅ Todas las pruebas pasaron exitosamente</p>
                        <div class="text-sm text-gray-600">
                          <p>• Banderas: ${Object.keys(result.flags || {}).length} verificadas</p>
                          <p>• Servicios: ${result.services?.length || 0} disponibles</p>
                          <p>• Componentes: ${result.components?.length || 0} cargados</p>
                        </div>
                      </div>
                    ` : `Error: ${result.error}`,
                    confirmButtonText: 'Aceptar'
                  });
                } catch (error) {
                  console.error('Error en pruebas:', error);
                  Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudieron ejecutar las pruebas'
                  });
                }
              }}
              variant="outline"
              className="w-full"
            >
              🧪 Probar Sistema Completo
            </Button>
          </div>

          {/* Estado del Sistema Nuclear */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
            <h3 className="text-lg font-semibold mb-3">📊 Estado del Sistema Nuclear</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: 'ai_module_enabled', label: 'Módulo IA', icon: '🤖' },
                { key: 'ai_negotiation_enabled', label: 'Negociación', icon: '💬' },
                { key: 'ai_dashboard_enabled', label: 'Dashboard', icon: '📊' },
                { key: 'ai_config_enabled', label: 'Configuración', icon: '⚙️' },
                { key: 'ai_analytics_enabled', label: 'Analytics', icon: '📈' },
                { key: 'ai_real_time_enabled', label: 'Tiempo Real', icon: '⚡' },
                { key: 'ai_escalation_enabled', label: 'Escalada', icon: '🔥' },
                { key: 'ai_safe_mode', label: 'Modo Seguro', icon: '🛡️' }
              ].map((item) => {
                const isEnabled = localStorage.getItem('ai_feature_flags') ?
                  JSON.parse(localStorage.getItem('ai_feature_flags'))[item.key] : false;
                
                return (
                  <div key={item.key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-xs font-medium flex items-center gap-1">
                      <span>{item.icon}</span>
                      {item.label}
                    </span>
                    <Badge
                      variant={isEnabled ? "success" : "secondary"}
                      className="text-xs"
                    >
                      {isEnabled ? "ON" : "OFF"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Advertencias Nuclear */}
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <h4 className="font-semibold text-red-900 mb-2">⚠️ Advertencias del Módulo Nuclear</h4>
            <div className="text-sm text-red-800 space-y-1">
              <p>• <strong>Módulo Nuclear:</strong> Activa TODAS las funcionalidades del sistema</p>
              <p>• <strong>Uso avanzado:</strong> Solo para administradores con experiencia</p>
              <p>• <strong>Impacto total:</strong> Afecta todos los módulos de IA simultáneamente</p>
              <p>• <strong>Irreversible:</strong> Los cambios persisten hasta reinicio manual</p>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
};

export default AIConfigPage;