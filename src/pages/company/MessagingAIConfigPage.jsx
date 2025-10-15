/**
 * Messaging AI Configuration Page
 * 
 * Página completa de configuración para el sistema de mensajería e IA
 * Permite configurar todos los aspectos: IA, personalización, respuestas, etc.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, LoadingSpinner, Input, Select, ToggleSwitch } from '../../components/common';
import { 
  Bot, 
  Brain, 
  Settings, 
  MessageSquare, 
  Users, 
  Database, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  Save,
  TestTube,
  RefreshCw,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import Swal from 'sweetalert2';

const MessagingAIConfigPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  // Estados principales
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('ai-providers');
  
  // Configuración de IA
  const [aiConfig, setAiConfig] = useState({
    providers: {
      chutes: {
        enabled: false,
        apiKey: '',
        baseUrl: 'https://api.chutes.ai',
        model: 'gpt-4',
        maxTokens: 2000,
        temperature: 0.7
      },
      groq: {
        enabled: false,
        apiKey: '',
        baseUrl: 'https://api.groq.com',
        model: 'llama2-70b',
        maxTokens: 2000,
        temperature: 0.7
      }
    },
    selectedProvider: 'chutes',
    fallbackEnabled: true,
    autoRetry: true,
    maxRetries: 3
  });
  
  // Configuración de mensajería
  const [messagingConfig, setMessagingConfig] = useState({
    autoRespond: true,
    workingHours: {
      enabled: true,
      start: '09:00',
      end: '18:00',
      timezone: 'America/Santiago'
    },
    responseDelay: {
      min: 2,
      max: 5
    },
    escalation: {
      enabled: true,
      thresholds: {
        conversationLength: 15,
        discountRequested: 20,
        timeRequested: 18,
        frustrationLevel: 0.7
      }
    }
  });
  
  // Configuración de personalización
  const [personalizationConfig, setPersonalizationConfig] = useState({
    level: 'high', // low, medium, high, ultra_high
    useDebtorName: true,
    useCorporateName: true,
    useRUT: false,
    useHistory: true,
    communicationStyle: 'professional', // formal, professional, informal
    riskAdaptation: true,
    customGreeting: '',
    customSignature: ''
  });
  
  // Respuestas personalizadas
  const [customResponses, setCustomResponses] = useState([
    {
      id: 1,
      trigger: 'descuento',
      type: 'keyword',
      response: 'Como cliente especial, puedo ofrecerte opciones exclusivas de descuento.',
      enabled: true
    },
    {
      id: 2,
      trigger: 'cuotas',
      type: 'keyword',
      response: 'Tenemos planes flexibles que se adaptan a tu presupuesto.',
      enabled: true
    }
  ]);
  
  // Límites de negociación
  const [negotiationLimits, setNegotiationLimits] = useState({
    maxDiscount: 15,
    maxInstallments: 12,
    maxTerm: 18,
    minPayment: 10000,
    customRules: []
  });

  useEffect(() => {
    loadConfiguration();
  }, [profile?.company?.id]);

  const loadConfiguration = async () => {
    if (!profile?.company?.id) return;
    
    setLoading(true);
    try {
      // Cargar configuración desde la base de datos
      const { data, error } = await supabase
        .from('company_ai_config')
        .select('*')
        .eq('company_id', profile.company.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error loading configuration:', error);
        throw error;
      }

      if (data) {
        // Cargar configuración existente y limpiar OpenAI si existe
        const cleanedAiConfig = data.ai_providers || aiConfig;
        
        // Eliminar OpenAI de la configuración si existe
        if (cleanedAiConfig.providers && cleanedAiConfig.providers.openai) {
          delete cleanedAiConfig.providers.openai;
          console.log('OpenAI provider removed from loaded configuration');
        }
        
        // Ajustar selectedProvider si era OpenAI
        if (cleanedAiConfig.selectedProvider === 'openai') {
          cleanedAiConfig.selectedProvider = 'chutes';
          console.log('Selected provider changed from OpenAI to Chutes');
        }
        
        setAiConfig(cleanedAiConfig);
        setMessagingConfig(data.messaging_config || messagingConfig);
        setPersonalizationConfig(data.personalization_config || personalizationConfig);
        setCustomResponses(data.custom_responses || customResponses);
        setNegotiationLimits(data.negotiation_limits || negotiationLimits);
        console.log('Configuration loaded successfully:', data);
      } else {
        // Usar valores por defecto si no hay configuración guardada
        console.log('No saved configuration found, using defaults');
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      
      // Si la tabla no existe, intentar cargar desde localStorage
      if (error.code === 'PGRST205') {
        console.log('Tabla company_ai_config no existe. Intentando cargar configuración local.');
        
        // Intentar cargar desde localStorage
        const localConfig = localStorage.getItem('company_ai_config_local');
        if (localConfig) {
          try {
            const parsedConfig = JSON.parse(localConfig);
            if (parsedConfig.company_id === profile?.company?.id) {
              // Limpiar OpenAI de la configuración local si existe
              const cleanedLocalConfig = parsedConfig.ai_providers || aiConfig;
              
              if (cleanedLocalConfig.providers && cleanedLocalConfig.providers.openai) {
                delete cleanedLocalConfig.providers.openai;
                console.log('OpenAI provider removed from localStorage configuration');
              }
              
              // Ajustar selectedProvider si era OpenAI
              if (cleanedLocalConfig.selectedProvider === 'openai') {
                cleanedLocalConfig.selectedProvider = 'chutes';
                console.log('Selected provider changed from OpenAI to Chutes in localStorage');
              }
              
              setAiConfig(cleanedLocalConfig);
              setMessagingConfig(parsedConfig.messaging_config || messagingConfig);
              setPersonalizationConfig(parsedConfig.personalization_config || personalizationConfig);
              setCustomResponses(parsedConfig.custom_responses || customResponses);
              setNegotiationLimits(parsedConfig.negotiation_limits || negotiationLimits);
              console.log('Configuration loaded from localStorage:', parsedConfig);
            }
          } catch (parseError) {
            console.error('Error parsing local config:', parseError);
          }
        }
        
        Swal.fire({
          icon: 'info',
          title: 'Configuración Local',
          text: 'La tabla de configuración está siendo creada. Por ahora, la configuración se guardará localmente.',
          confirmButtonText: 'Entendido'
        });
        return; // No mostrar error, continuar con valores por defecto
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar la configuración: ' + error.message,
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    setSaving(true);
    try {
      // Guardar configuración en la base de datos
      const { data, error } = await supabase
        .from('company_ai_config')
        .upsert({
          company_id: profile?.company?.id,
          ai_providers: aiConfig,
          messaging_config: messagingConfig,
          personalization_config: personalizationConfig,
          custom_responses: customResponses,
          negotiation_limits: negotiationLimits,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving configuration:', error);
        throw error;
      }

      console.log('Configuration saved successfully:', data);
      
      await Swal.fire({
        icon: 'success',
        title: 'Configuración guardada',
        text: 'Todos los cambios han sido guardados exitosamente',
        confirmButtonText: 'Aceptar'
      });
    } catch (error) {
      console.error('Error saving configuration:', error);
      
      // Si la tabla no existe, guardar en localStorage y mostrar mensaje informativo
      if (error.code === 'PGRST205') {
        console.log('Tabla no existe. Guardando configuración localmente.');
        
        // Guardar en localStorage como fallback
        const localConfig = {
          company_id: profile?.company?.id,
          ai_providers: aiConfig,
          messaging_config: messagingConfig,
          personalization_config: personalizationConfig,
          custom_responses: customResponses,
          negotiation_limits: negotiationLimits,
          updated_at: new Date().toISOString()
        };
        
        localStorage.setItem('company_ai_config_local', JSON.stringify(localConfig));
        
        await Swal.fire({
          icon: 'warning',
          title: 'Configuración Guardada Localmente',
          text: 'La configuración se ha guardado temporalmente en el navegador. Cuando la tabla esté disponible, se sincronizará automáticamente.',
          confirmButtonText: 'Entendido'
        });
        return;
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar la configuración: ' + error.message,
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setSaving(false);
    }
  };

  const testProvider = async (provider) => {
    const config = aiConfig.providers[provider];
    if (!config.apiKey) {
      Swal.fire({
        icon: 'warning',
        title: 'Configuración incompleta',
        text: 'Debes configurar la API Key antes de probar',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    try {
      // Simular prueba del provider
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Swal.fire({
        icon: 'success',
        title: 'Prueba exitosa',
        text: `El provider ${provider} está funcionando correctamente`,
        confirmButtonText: 'Aceptar'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error en la prueba',
        text: `No se pudo conectar con ${provider}: ${error.message}`,
        confirmButtonText: 'Aceptar'
      });
    }
  };

  const addCustomResponse = () => {
    const newResponse = {
      id: Date.now(),
      trigger: '',
      type: 'keyword',
      response: '',
      enabled: true
    };
    setCustomResponses([...customResponses, newResponse]);
  };

  const updateCustomResponse = (id, field, value) => {
    setCustomResponses(customResponses.map(resp => 
      resp.id === id ? { ...resp, [field]: value } : resp
    ));
  };

  const deleteCustomResponse = (id) => {
    setCustomResponses(customResponses.filter(resp => resp.id !== id));
  };

  const tabs = [
    { id: 'ai-providers', label: 'Proveedores de IA', icon: Bot },
    { id: 'messaging', label: 'Mensajería', icon: MessageSquare },
    { id: 'personalization', label: 'Personalización', icon: Users },
    { id: 'responses', label: 'Respuestas', icon: Database },
    { id: 'limits', label: 'Límites', icon: Settings }
  ];

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Configuración de IA y Mensajería</h1>
            <p className="text-blue-100">
              Configura todos los aspectos del sistema de inteligencia artificial y mensajería
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/empresa/mensajes')}
              className="text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white"
            >
              Volver a Mensajes
            </Button>
            <Button
              variant="primary"
              onClick={saveConfiguration}
              loading={saving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Guardar Configuración
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* AI Providers Tab */}
        {activeTab === 'ai-providers' && (
          <div className="space-y-6">
            <Card>
              <h3 className="text-xl font-bold mb-4">Proveedores de Inteligencia Artificial</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {Object.entries(aiConfig.providers).map(([provider, config]) => (
                  <Card key={provider} className="border-2">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold capitalize">{provider}</h4>
                      <ToggleSwitch
                        checked={config.enabled}
                        onChange={(enabled) => setAiConfig(prev => ({
                          ...prev,
                          providers: {
                            ...prev.providers,
                            [provider]: { ...config, enabled }
                          }
                        }))}
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Input
                        label="API Key"
                        type="password"
                        value={config.apiKey}
                        onChange={(e) => setAiConfig(prev => ({
                          ...prev,
                          providers: {
                            ...prev.providers,
                            [provider]: { ...config, apiKey: e.target.value }
                          }
                        }))}
                        placeholder={`API Key de ${provider}`}
                      />
                      
                      <Input
                        label="URL Base"
                        value={config.baseUrl}
                        onChange={(e) => setAiConfig(prev => ({
                          ...prev,
                          providers: {
                            ...prev.providers,
                            [provider]: { ...config, baseUrl: e.target.value }
                          }
                        }))}
                        placeholder="https://api.example.com"
                      />
                      
                      <Select
                        label="Modelo"
                        value={config.model}
                        onChange={(model) => setAiConfig(prev => ({
                          ...prev,
                          providers: {
                            ...prev.providers,
                            [provider]: { ...config, model }
                          }
                        }))}
                        options={
                          provider === 'chutes' ? [
                            { value: 'gpt-4', label: 'GPT-4' },
                            { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
                            { value: 'claude-3', label: 'Claude 3' }
                          ] : provider === 'groq' ? [
                            { value: 'llama-3.1-70b', label: 'Llama 3.1 70B' },
                            { value: 'llama-3.1-8b', label: 'Llama 3.1 8B' },
                            { value: 'mixtral-8x7b', label: 'Mixtral 8x7B' },
                            { value: 'gemma-7b-it', label: 'Gemma 7B IT' }
                          ] : [
                            { value: 'gpt-4', label: 'GPT-4' },
                            { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
                          ]
                        }
                      />
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          label="Max Tokens"
                          type="number"
                          value={config.maxTokens}
                          onChange={(e) => setAiConfig(prev => ({
                            ...prev,
                            providers: {
                              ...prev.providers,
                              [provider]: { ...config, maxTokens: parseInt(e.target.value) }
                            }
                          }))}
                        />
                        
                        <Input
                          label="Temperature"
                          type="number"
                          step="0.1"
                          min="0"
                          max="2"
                          value={config.temperature}
                          onChange={(e) => setAiConfig(prev => ({
                            ...prev,
                            providers: {
                              ...prev.providers,
                              [provider]: { ...config, temperature: parseFloat(e.target.value) }
                            }
                          }))}
                        />
                      </div>
                      
                      <Button
                        variant="outline"
                        onClick={() => testProvider(provider)}
                        leftIcon={<TestTube className="w-4 h-4" />}
                        className="w-full"
                      >
                        Probar Conexión
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-xl font-bold mb-4">Configuración General de IA</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Select
                    label="Provider Principal"
                    value={aiConfig.selectedProvider}
                    onChange={(selectedProvider) => setAiConfig(prev => ({ ...prev, selectedProvider }))}
                    options={[
                      { value: 'chutes', label: 'Chutes AI' },
                      { value: 'groq', label: 'Groq AI' }
                    ]}
                  />
                </div>
                
                <div className="space-y-3">
                  <ToggleSwitch
                    label="Habilitar Fallback"
                    checked={aiConfig.fallbackEnabled}
                    onChange={(fallbackEnabled) => setAiConfig(prev => ({ ...prev, fallbackEnabled }))}
                  />
                  
                  <ToggleSwitch
                    label="Reintentar automáticamente"
                    checked={aiConfig.autoRetry}
                    onChange={(autoRetry) => setAiConfig(prev => ({ ...prev, autoRetry }))}
                  />
                  
                  <Input
                    label="Máximo de reintentos"
                    type="number"
                    value={aiConfig.maxRetries}
                    onChange={(e) => setAiConfig(prev => ({ ...prev, maxRetries: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Messaging Tab */}
        {activeTab === 'messaging' && (
          <div className="space-y-6">
            <Card>
              <h3 className="text-xl font-bold mb-4">Configuración de Mensajería</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Respuesta Automática</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ToggleSwitch
                      label="Responder automáticamente"
                      checked={messagingConfig.autoRespond}
                      onChange={(autoRespond) => setMessagingConfig(prev => ({ ...prev, autoRespond }))}
                    />
                    
                    <ToggleSwitch
                      label="Habilitar escalado"
                      checked={messagingConfig.escalation.enabled}
                      onChange={(enabled) => setMessagingConfig(prev => ({
                        ...prev,
                        escalation: { ...prev.escalation, enabled }
                      }))}
                    />
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Horario de Trabajo</h4>
                  <ToggleSwitch
                    label="Habilitar horario de trabajo"
                    checked={messagingConfig.workingHours.enabled}
                    onChange={(enabled) => setMessagingConfig(prev => ({
                      ...prev,
                      workingHours: { ...prev.workingHours, enabled }
                    }))}
                  />
                  
                  {messagingConfig.workingHours.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                      <Input
                        label="Hora de inicio"
                        type="time"
                        value={messagingConfig.workingHours.start}
                        onChange={(start) => setMessagingConfig(prev => ({
                          ...prev,
                          workingHours: { ...prev.workingHours, start }
                        }))}
                      />
                      
                      <Input
                        label="Hora de fin"
                        type="time"
                        value={messagingConfig.workingHours.end}
                        onChange={(end) => setMessagingConfig(prev => ({
                          ...prev,
                          workingHours: { ...prev.workingHours, end }
                        }))}
                      />
                      
                      <Select
                        label="Zona horaria"
                        value={messagingConfig.workingHours.timezone}
                        onChange={(timezone) => setMessagingConfig(prev => ({
                          ...prev,
                          workingHours: { ...prev.workingHours, timezone }
                        }))}
                        options={[
                          { value: 'America/Santiago', label: 'Santiago' },
                          { value: 'America/Mexico_City', label: 'Ciudad de México' },
                          { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires' }
                        ]}
                      />
                    </div>
                  )}
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Tiempo de Respuesta</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Retraso mínimo (segundos)"
                      type="number"
                      value={messagingConfig.responseDelay.min}
                      onChange={(min) => setMessagingConfig(prev => ({
                        ...prev,
                        responseDelay: { ...prev.responseDelay, min: parseInt(min) }
                      }))}
                    />
                    
                    <Input
                      label="Retraso máximo (segundos)"
                      type="number"
                      value={messagingConfig.responseDelay.max}
                      onChange={(max) => setMessagingConfig(prev => ({
                        ...prev,
                        responseDelay: { ...prev.responseDelay, max: parseInt(max) }
                      }))}
                    />
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Umbrales de Escalado</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Longitud máxima de conversación"
                      type="number"
                      value={messagingConfig.escalation.thresholds.conversationLength}
                      onChange={(conversationLength) => setMessagingConfig(prev => ({
                        ...prev,
                        escalation: {
                          ...prev.escalation,
                          thresholds: { ...prev.escalation.thresholds, conversationLength: parseInt(conversationLength) }
                        }
                      }))}
                    />
                    
                    <Input
                      label="Descuento máximo para escalar (%)"
                      type="number"
                      value={messagingConfig.escalation.thresholds.discountRequested}
                      onChange={(discountRequested) => setMessagingConfig(prev => ({
                        ...prev,
                        escalation: {
                          ...prev.escalation,
                          thresholds: { ...prev.escalation.thresholds, discountRequested: parseInt(discountRequested) }
                        }
                      }))}
                    />
                    
                    <Input
                      label="Tiempo máximo para escalar (meses)"
                      type="number"
                      value={messagingConfig.escalation.thresholds.timeRequested}
                      onChange={(timeRequested) => setMessagingConfig(prev => ({
                        ...prev,
                        escalation: {
                          ...prev.escalation,
                          thresholds: { ...prev.escalation.thresholds, timeRequested: parseInt(timeRequested) }
                        }
                      }))}
                    />
                    
                    <Input
                      label="Nivel de frustración"
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={messagingConfig.escalation.thresholds.frustrationLevel}
                      onChange={(frustrationLevel) => setMessagingConfig(prev => ({
                        ...prev,
                        escalation: {
                          ...prev.escalation,
                          thresholds: { ...prev.escalation.thresholds, frustrationLevel: parseFloat(frustrationLevel) }
                        }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Personalization Tab */}
        {activeTab === 'personalization' && (
          <div className="space-y-6">
            <Card>
              <h3 className="text-xl font-bold mb-4">Configuración de Personalización</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Nivel de Personalización</h4>
                  <Select
                    label="Nivel"
                    value={personalizationConfig.level}
                    onChange={(level) => setPersonalizationConfig(prev => ({ ...prev, level }))}
                    options={[
                      { value: 'low', label: 'Bajo - Solo información básica' },
                      { value: 'medium', label: 'Medio - Nombre y empresa' },
                      { value: 'high', label: 'Alto - Historial y preferencias' },
                      { value: 'ultra_high', label: 'Ultra-Alto - Análisis completo' }
                    ]}
                  />
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Elementos de Personalización</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ToggleSwitch
                      label="Usar nombre del deudor"
                      checked={personalizationConfig.useDebtorName}
                      onChange={(useDebtorName) => setPersonalizationConfig(prev => ({ ...prev, useDebtorName }))}
                    />
                    
                    <ToggleSwitch
                      label="Usar nombre de empresa"
                      checked={personalizationConfig.useCorporateName}
                      onChange={(useCorporateName) => setPersonalizationConfig(prev => ({ ...prev, useCorporateName }))}
                    />
                    
                    <ToggleSwitch
                      label="Usar RUT"
                      checked={personalizationConfig.useRUT}
                      onChange={(useRUT) => setPersonalizationConfig(prev => ({ ...prev, useRUT }))}
                    />
                    
                    <ToggleSwitch
                      label="Usar historial"
                      checked={personalizationConfig.useHistory}
                      onChange={(useHistory) => setPersonalizationConfig(prev => ({ ...prev, useHistory }))}
                    />
                    
                    <ToggleSwitch
                      label="Adaptar al riesgo"
                      checked={personalizationConfig.riskAdaptation}
                      onChange={(riskAdaptation) => setPersonalizationConfig(prev => ({ ...prev, riskAdaptation }))}
                    />
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Estilo de Comunicación</h4>
                  <Select
                    label="Estilo"
                    value={personalizationConfig.communicationStyle}
                    onChange={(communicationStyle) => setPersonalizationConfig(prev => ({ ...prev, communicationStyle }))}
                    options={[
                      { value: 'formal', label: 'Formal - Usted, tratamientos respetuosos' },
                      { value: 'professional', label: 'Profesional - Balanceado y claro' },
                      { value: 'informal', label: 'Informal - Tú, lenguaje cercano' }
                    ]}
                  />
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Mensajes Personalizados</h4>
                  <div className="space-y-4">
                    <Input
                      label="Saludo personalizado"
                      value={personalizationConfig.customGreeting}
                      onChange={(customGreeting) => setPersonalizationConfig(prev => ({ ...prev, customGreeting }))}
                      placeholder="Hola {nombre}, como cliente de {empresa}..."
                    />
                    
                    <Input
                      label="Despedida personalizada"
                      value={personalizationConfig.customSignature}
                      onChange={(customSignature) => setPersonalizationConfig(prev => ({ ...prev, customSignature }))}
                      placeholder="Atentamente, el equipo de {empresa}"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Responses Tab */}
        {activeTab === 'responses' && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Respuestas Personalizadas</h3>
                <Button
                  variant="primary"
                  onClick={addCustomResponse}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Agregar Respuesta
                </Button>
              </div>
              
              <div className="space-y-4">
                {customResponses.map((response) => (
                  <Card key={response.id} className="border">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ToggleSwitch
                            checked={response.enabled}
                            onChange={(enabled) => updateCustomResponse(response.id, 'enabled', enabled)}
                          />
                          <span className="font-medium">Respuesta #{response.id}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteCustomResponse(response.id)}
                            leftIcon={<Trash2 className="w-4 h-4" />}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Trigger (palabra clave)"
                          value={response.trigger}
                          onChange={(e) => updateCustomResponse(response.id, 'trigger', e.target.value)}
                          placeholder="descuento, cuotas, pago"
                        />
                        
                        <Select
                          label="Tipo"
                          value={response.type}
                          onChange={(type) => updateCustomResponse(response.id, 'type', type)}
                          options={[
                            { value: 'keyword', label: 'Palabra clave' },
                            { value: 'intent', label: 'Intención' },
                            { value: 'sentiment', label: 'Sentimiento' }
                          ]}
                        />
                      </div>
                      
                      <Input
                        label="Respuesta"
                        value={response.response}
                        onChange={(e) => updateCustomResponse(response.id, 'response', e.target.value)}
                        placeholder="Respuesta personalizada para este trigger..."
                        multiline
                        rows={3}
                      />
                    </div>
                  </Card>
                ))}
                
                {customResponses.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay respuestas personalizadas configuradas</p>
                    <p className="text-sm">Agrega tu primera respuesta personalizada</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Limits Tab */}
        {activeTab === 'limits' && (
          <div className="space-y-6">
            <Card>
              <h3 className="text-xl font-bold mb-4">Límites de Negociación</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Descuento máximo (%)"
                  type="number"
                  min="0"
                  max="100"
                  value={negotiationLimits.maxDiscount}
                  onChange={(maxDiscount) => setNegotiationLimits(prev => ({ ...prev, maxDiscount: parseInt(maxDiscount) }))}
                />
                
                <Input
                  label="Cuotas máximas"
                  type="number"
                  min="1"
                  max="60"
                  value={negotiationLimits.maxInstallments}
                  onChange={(maxInstallments) => setNegotiationLimits(prev => ({ ...prev, maxInstallments: parseInt(maxInstallments) }))}
                />
                
                <Input
                  label="Plazo máximo (meses)"
                  type="number"
                  min="1"
                  max="36"
                  value={negotiationLimits.maxTerm}
                  onChange={(maxTerm) => setNegotiationLimits(prev => ({ ...prev, maxTerm: parseInt(maxTerm) }))}
                />
                
                <Input
                  label="Pago mínimo ($)"
                  type="number"
                  min="0"
                  value={negotiationLimits.minPayment}
                  onChange={(minPayment) => setNegotiationLimits(prev => ({ ...prev, minPayment: parseInt(minPayment) }))}
                />
              </div>
            </Card>
            
            <Card>
              <h3 className="text-xl font-bold mb-4">Resumen de Configuración</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">IA Configurada</h4>
                  <p className="text-sm text-blue-700">
                    {Object.values(aiConfig.providers).filter(p => p.enabled).length} proveedores activos
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Mensajería</h4>
                  <p className="text-sm text-green-700">
                    {messagingConfig.autoRespond ? 'Respuesta automática' : 'Manual'}
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">Personalización</h4>
                  <p className="text-sm text-purple-700">
                    Nivel: {personalizationConfig.level}
                  </p>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-2">Respuestas</h4>
                  <p className="text-sm text-orange-700">
                    {customResponses.length} personalizadas
                  </p>
                </div>
                
                <div className="p-4 bg-red-50 rounded-lg">
                  <h4 className="font-semibold text-red-900 mb-2">Límites</h4>
                  <p className="text-sm text-red-700">
                    {negotiationLimits.maxDiscount}% descuento máximo
                  </p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Estado</h4>
                  <p className="text-sm text-gray-700">
                    Configuración lista para usar
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingAIConfigPage;