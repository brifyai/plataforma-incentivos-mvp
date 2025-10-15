/**
 * Página Unificada de Dashboard de IA
 * 
 * Integra toda la configuración de IA en una sola interfaz con:
 * - Selector de cliente corporativo a la izquierda
 * - Tabs para diferentes funcionalidades
 * - Configuración de proveedores de IA
 * - Base de conocimiento
 * - Configuración de prompts
 * - Analytics y métricas
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, Button, LoadingSpinner, Input, Select, Badge, Modal, ToggleSwitch } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { ragService } from '../../services/ragService';
import { aiProvidersService } from '../../services/aiProvidersService';
import {
  Brain,
  MessageSquare,
  Settings,
  Database,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Users,
  Copy,
  Eye,
  EyeOff,
  Zap,
  Target,
  FileText,
  Bot,
  CheckCircle,
  AlertTriangle,
  TestTube,
  RefreshCw,
  Search,
  Filter,
  TrendingUp,
  BarChart3,
  Activity,
  Upload,
  Clock,
  Cpu
} from 'lucide-react';
import Swal from 'sweetalert2';

// Componente DocumentCard para mostrar documentos con estado de vectorización
const DocumentCard = ({ document, onEdit, onDelete, onReprocess, corporateClientId }) => {
  const [vectorStatus, setVectorStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  useEffect(() => {
    loadVectorStatus();
  }, [document.id]);

  const loadVectorStatus = async () => {
    try {
      setLoadingStatus(true);
      const status = await ragService.getDocumentVectorStatus(document.id);
      setVectorStatus(status);
    } catch (error) {
      console.error('Error loading vector status:', error);
      setVectorStatus({ status: 'error', message: 'No se pudo verificar el estado' });
    } finally {
      setLoadingStatus(false);
    }
  };

  const getStatusIcon = () => {
    if (loadingStatus) return <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />;
    
    switch (vectorStatus?.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    if (loadingStatus) return 'Verificando...';
    
    switch (vectorStatus?.status) {
      case 'completed':
        return `Vectorizado (${vectorStatus.chunksCount} chunks)`;
      case 'processing':
        return 'Vectorizando...';
      case 'failed':
        return 'Error en vectorización';
      case 'pending':
        return 'Pendiente de vectorización';
      default:
        return 'Estado desconocido';
    }
  };

  const getStatusColor = () => {
    switch (vectorStatus?.status) {
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'processing':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'failed':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium text-gray-900">{document.title}</h4>
            <Badge variant="secondary" size="sm">
              {document.category}
            </Badge>
          </div>
          
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {document.content}
          </p>
          
          <div className="flex items-center gap-2 mt-2">
            {/* Estado de vectorización */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="text-xs font-medium">{getStatusText()}</span>
            </div>
            
            <span className="text-xs text-gray-500">
              {new Date(document.created_at).toLocaleDateString('es-CL')}
            </span>
            
            {!document.is_active && (
              <Badge variant="warning" size="sm">
                Inactivo
              </Badge>
            )}
          </div>
          
          {/* Información adicional de vectorización */}
          {vectorStatus && vectorStatus.status === 'completed' && (
            <div className="mt-2 text-xs text-gray-600">
              <span>Última actualización: {new Date(vectorStatus.lastUpdated).toLocaleString('es-CL')}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 ml-4">
          {/* Botón de reprocesamiento si es necesario */}
          {vectorStatus && (vectorStatus.status === 'failed' || vectorStatus.status === 'pending') && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onReprocess && onReprocess(document)}
              title="Reprocesar vectorización"
              className="text-blue-600 hover:text-blue-800"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit && onEdit(document)}
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete && onDelete(document)}
            title="Eliminar"
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const AIDashboardPage = ({ defaultTab = 'providers' }) => {
  const { user, profile } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Determinar el tab activo basado en la URL
  const getActiveTabFromUrl = () => {
    const pathParts = location.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];

    // Mapear URLs en español a IDs internos en inglés
    const urlToTabMap = {
      'proveedores': 'providers',
      'mensajeria': 'messaging',
      'personalizacion': 'personalization',
      'conocimiento': 'knowledge',
      'prompts': 'prompts',
      'analytics': 'analytics'
    };

    // Si la última parte está en el mapa, usar el ID correspondiente
    if (urlToTabMap[lastPart]) {
      return urlToTabMap[lastPart];
    }

    // Si no, usar el defaultTab o 'providers'
    return defaultTab || 'providers';
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromUrl());
  
  // Estados para clientes corporativos
  const [corporateClients, setCorporateClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  
  // Estados para proveedores de IA desde la base de datos
  const [providers, setProviders] = useState([]);
  const [activeProvider, setActiveProvider] = useState(null);
  const [loadingProviders, setLoadingProviders] = useState(true);
  
  // Estados para modelos dinámicos
  const [dynamicModels, setDynamicModels] = useState({});
  const [loadingModels, setLoadingModels] = useState({});
  
  // Estados para modelos de embedding RAG
  const [ragEmbeddingModels, setRagEmbeddingModels] = useState({});
  const [loadingRagModels, setLoadingRagModels] = useState({});
  
  // Estados para configuración legacy (mantener para compatibilidad)
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
    maxRetries: 3,
    rag: {
      enabled: true,
      provider: 'groq',
      apiKey: '',
      embeddingModel: 'text-embedding-ada-002',
      chunkSize: 1000,
      chunkOverlap: 200,
      similarityThreshold: 0.7,
      maxResults: 10
    }
  });
  
  // 🔥 NUEVOS ESTADOS PARA FUNCIONES PERDIDAS
  
  // Configuración de mensajería avanzada
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
  
  // Configuración de personalización detallada
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
  
  // Sistema de respuestas personalizadas completo
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
  
  // Límites de negociación avanzados
  const [negotiationLimits, setNegotiationLimits] = useState({
    maxDiscount: 15,
    maxInstallments: 12,
    maxTerm: 18,
    minPayment: 10000,
    customRules: []
  });
  
  // Estados para base de conocimiento
  const [knowledgeBase, setKnowledgeBase] = useState({
    documents: [],
    policies: [],
    responses: [],
    aiConfig: {
      max_negotiation_discount: 15,
      max_negotiation_term: 12,
      auto_respond: true,
      working_hours: { start: '09:00', end: '18:00' }
    }
  });
  
  // Estados para prompts
  const [promptTemplates, setPromptTemplates] = useState([]);
  const [testMode, setTestMode] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testingPrompt, setTestingPrompt] = useState(false);
  
  // Estados para modales
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [showAddResponse, setShowAddResponse] = useState(false);
  const [showAddPrompt, setShowAddPrompt] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);
  
  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // Formularios
  const [documentForm, setDocumentForm] = useState({
    title: '',
    content: '',
    category: 'general',
    is_active: true
  });

  const [policyForm, setPolicyForm] = useState({
    policy_type: 'discount',
    policy_name: '',
    policy_description: '',
    policy_value: '',
    is_active: true
  });

  const [responseForm, setResponseForm] = useState({
    trigger_keyword: '',
    trigger_type: 'keyword',
    response_template: '',
    use_debtor_name: true,
    use_corporate_name: true,
    is_active: true
  });

  const [promptForm, setPromptForm] = useState({
    prompt_type: 'negotiation',
    prompt_name: '',
    prompt_template: '',
    variables: [],
    is_active: true,
    priority: 1
  });

  // Variables disponibles para los prompts
  const availableVariables = [
    { key: '{nombre_deudor}', description: 'Nombre completo del deudor' },
    { key: '{rut_deudor}', description: 'RUT del deudor' },
    { key: '{nombre_empresa}', description: 'Nombre del cliente corporativo' },
    { key: '{rut_empresa}', description: 'RUT del cliente corporativo' },
    { key: '{monto_deuda}', description: 'Monto total de la deuda' },
    { key: '{dias_mora}', description: 'Días en mora' },
    { key: '{tipo_deuda}', description: 'Tipo de deuda' },
    { key: '{fecha_vencimiento}', description: 'Fecha de vencimiento' },
    { key: '{descuento_maximo}', description: 'Descuento máximo permitido' },
    { key: '{plazo_maximo}', description: 'Plazo máximo en meses' },
    { key: '{historial_pagos}', description: 'Historial de pagos previos' },
    { key: '{nivel_riesgo}', description: 'Nivel de riesgo del deudor' }
  ];

  // Tabs disponibles (actualizados con funciones perdidas)
  const tabs = [
    { id: 'providers', label: 'Proveedores IA', icon: Bot },
    { id: 'messaging', label: 'Mensajería', icon: MessageSquare },
    { id: 'personalization', label: 'Personalización', icon: Users },
    { id: 'knowledge', label: 'Base Conocimiento', icon: Database },
    { id: 'prompts', label: 'Prompts', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  useEffect(() => {
    loadCorporateClients();
    loadAIProviders();
    loadAIConfiguration();
  }, [profile]);

  // Actualizar el tab activo cuando cambia la URL
  useEffect(() => {
    const newActiveTab = getActiveTabFromUrl();
    if (newActiveTab !== activeTab) {
      setActiveTab(newActiveTab);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (selectedClient) {
      loadKnowledgeBase(selectedClient.id);
      loadPromptTemplates(selectedClient.id);
    }
  }, [selectedClient]);

  const loadCorporateClients = async () => {
    try {
      let data;
      
      // Para usuarios con god_mode, mostrar TODOS los clientes corporativos del sistema
      if (profile?.role === 'god_mode') {
        console.log('🔑 God Mode: Cargando todos los clientes corporativos del sistema');
        const { data: allClients, error: allError } = await supabase
          .from('corporate_clients')
          .select('*')
          .eq('is_active', true)
          .order('name');
        
        if (allError) throw allError;
        data = allClients;
      } else {
        // Para usuarios normales, mostrar solo clientes de su empresa
        const companyId = profile?.company?.id;
        if (!companyId) {
          console.warn('No company ID found for normal user');
          setLoading(false);
          return;
        }

        const { data: companyClients, error: companyError } = await supabase
          .from('corporate_clients')
          .select('*')
          .eq('company_id', companyId)
          .eq('is_active', true)
          .order('name');

        if (companyError) throw companyError;
        data = companyClients;
      }

      console.log(`📊 Clientes cargados: ${data?.length || 0}`);
      setCorporateClients(data || []);
      
      if (data && data.length > 0) {
        setSelectedClient(data[0]);
      }
    } catch (error) {
      console.error('Error loading corporate clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAIProviders = async () => {
    try {
      setLoadingProviders(true);
      const providersData = await aiProvidersService.getProviders();
      setProviders(providersData);
      
      // Encontrar el proveedor activo
      const active = providersData.find(p => p.is_active);
      setActiveProvider(active);
      
      // Cargar modelos para todos los proveedores con API keys
      for (const provider of providersData) {
        if (provider.api_key && provider.api_key.length > 10) {
          try {
            // Cargar modelos de chat
            const chatModels = await aiProvidersService.getProviderChatModels(provider.id);
            setDynamicModels(prev => ({
              ...prev,
              [provider.provider_name]: chatModels
            }));
            
            // Cargar modelos de embedding
            const embeddingModels = await aiProvidersService.getProviderEmbeddingModels(provider.id);
            setRagEmbeddingModels(prev => ({
              ...prev,
              [provider.provider_name]: embeddingModels
            }));
          } catch (error) {
            console.error(`Error loading models for ${provider.provider_name}:`, error);
          }
        }
      }
      
    } catch (error) {
      console.error('Error loading AI providers:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los proveedores de IA',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleActivateProvider = async (providerId) => {
    try {
      const updatedProvider = await aiProvidersService.activateProvider(providerId);
      setActiveProvider(updatedProvider);
      
      // Actualizar la lista de proveedores
      await loadAIProviders();
      
      Swal.fire({
        icon: 'success',
        title: 'Proveedor activado',
        text: `${updatedProvider.display_name} ahora es el proveedor activo`,
        confirmButtonText: 'Aceptar'
      });
    } catch (error) {
      console.error('Error activating provider:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo activar el proveedor: ' + error.message,
        confirmButtonText: 'Aceptar'
      });
    }
  };

  const handleUpdateAPIKey = async (providerId, apiKey) => {
    try {
      await aiProvidersService.updateProviderAPIKey(providerId, apiKey);
      
      // Recargar proveedores y modelos
      await loadAIProviders();
      
      Swal.fire({
        icon: 'success',
        title: 'API Key actualizada',
        text: 'La API key se ha actualizado correctamente',
        confirmButtonText: 'Aceptar'
      });
    } catch (error) {
      console.error('Error updating API key:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar la API key: ' + error.message,
        confirmButtonText: 'Aceptar'
      });
    }
  };

  const loadAIConfiguration = async () => {
    try {
      // Para el nuevo sistema, la configuración principal viene de aiProvidersService
      // Solo cargamos la configuración RAG adicional si es necesario
      console.log('🔄 Cargando configuración de IA...');
      
      // La configuración de proveedores ya se carga en loadAIProviders()
      // Solo necesitamos cargar configuración adicional si existe
      
      let companyId;
      
      // Para usuarios con god_mode, usar la primera empresa disponible
      if (profile?.role === 'god_mode') {
        try {
          const { data: companies, error: companyError } = await supabase
            .from('companies')
            .select('id')
            .limit(1);
          
          if (companyError) {
            console.warn('Error getting company for god_mode:', companyError);
            companyId = null;
          } else {
            companyId = companies?.[0]?.id;
          }
        } catch (error) {
          console.warn('Could not get company for god_mode:', error);
          companyId = null;
        }
      } else {
        companyId = profile?.company?.id;
      }
      
      if (companyId) {
        try {
          const { data, error } = await supabase
            .from('company_ai_config')
            .select('rag_config')
            .eq('company_id', companyId)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.warn('Error loading RAG configuration:', error);
          } else if (data?.rag_config) {
            // Actualizar configuración RAG si existe
            setAiConfig(prev => ({
              ...prev,
              rag: {
                ...prev.rag,
                ...data.rag_config
              }
            }));
          }
        } catch (error) {
          console.warn('Could not load RAG config:', error);
        }
      }
      
      console.log('✅ Configuración de IA cargada correctamente');
    } catch (error) {
      console.error('Error in loadAIConfiguration:', error);
      // No lanzamos el error para que la aplicación continúe funcionando
    }
  };

  const loadKnowledgeBase = async (corporateClientId) => {
    try {
      setLoading(true);

      let documents = [];
      let policies = [];
      let responses = [];

      try {
        const { data: docsData } = await supabase
          .from('company_knowledge_base')
          .select('*')
          .eq('corporate_client_id', corporateClientId)
          .eq('is_active', true);
        
        documents = docsData || [];
      } catch (e) {
        console.warn('Tabla company_knowledge_base no disponible:', e.message);
      }

      try {
        const { data: policiesData } = await supabase
          .from('corporate_client_policies')
          .select('*')
          .eq('corporate_client_id', corporateClientId)
          .eq('is_active', true);
        
        policies = policiesData || [];
      } catch (e) {
        console.warn('Tabla corporate_client_policies no disponible:', e.message);
      }

      try {
        const { data: responsesData } = await supabase
          .from('corporate_client_responses')
          .select('*')
          .eq('corporate_client_id', corporateClientId)
          .eq('is_active', true);
        
        responses = responsesData || [];
      } catch (e) {
        console.warn('Tabla corporate_client_responses no disponible:', e.message);
      }

      setKnowledgeBase({
        documents,
        policies,
        responses,
        aiConfig: knowledgeBase.aiConfig
      });

    } catch (error) {
      console.error('Error loading knowledge base:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPromptTemplates = async (corporateClientId) => {
    try {
      const { data, error } = await supabase
        .from('corporate_prompt_templates')
        .select('*')
        .eq('corporate_client_id', corporateClientId)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromptTemplates(data || []);
    } catch (error) {
      console.error('Error loading prompt templates:', error);
    }
  };

  const saveAIConfiguration = async () => {
    setSaving(true);
    try {
      let companyId;

      // Para usuarios con god_mode, usar la primera empresa disponible
      if (profile?.role === 'god_mode') {
        const { data: companies, error: companyError } = await supabase
          .from('companies')
          .select('id')
          .limit(1);

        if (companyError) throw companyError;
        companyId = companies?.[0]?.id;
      } else {
        companyId = profile?.company?.id;
      }

      if (!companyId) {
        throw new Error('No company ID found');
      }

      // Intentar actualizar primero, si no existe, insertar
      const { data: existingConfig, error: selectError } = await supabase
        .from('company_ai_config')
        .select('id')
        .eq('company_id', companyId)
        .single();

      let result;
      if (existingConfig) {
        // Actualizar configuración existente
        result = await supabase
          .from('company_ai_config')
          .update({
            ai_providers: aiConfig,
            rag_config: aiConfig.rag,
            updated_at: new Date().toISOString()
          })
          .eq('company_id', companyId);
      } else {
        // Insertar nueva configuración
        result = await supabase
          .from('company_ai_config')
          .insert({
            company_id: companyId,
            ai_providers: aiConfig,
            rag_config: aiConfig.rag,
            updated_at: new Date().toISOString()
          });
      }

      if (result.error) throw result.error;

      Swal.fire({
        icon: 'success',
        title: 'Configuración guardada',
        text: 'La configuración de IA se ha guardado exitosamente',
        confirmButtonText: 'Aceptar'
      });
    } catch (error) {
      console.error('Error saving AI configuration:', error);
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

  const forceRefreshModels = async (providerName) => {
    const providerData = providers.find(p => p.provider_name === providerName);
    if (!providerData || !providerData.api_key) {
      Swal.fire({
        icon: 'warning',
        title: 'Configuración incompleta',
        text: 'Debes configurar la API Key antes de forzar la actualización',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    try {
      setLoadingModels(prev => ({ ...prev, [providerName]: true }));
      
      console.log(`🔄 Forzando actualización de modelos para ${providerName}...`);
      
      // Forzar la recarga de modelos usando el parámetro forceRefresh
      const chatModels = await aiProvidersService.getProviderChatModels(providerData.id, { forceRefresh: true });
      setDynamicModels(prev => ({ ...prev, [providerName]: chatModels }));
      
      // También forzar la recarga de modelos de embedding
      const embeddingModels = await aiProvidersService.getProviderEmbeddingModels(providerData.id, { forceRefresh: true });
      setRagEmbeddingModels(prev => ({ ...prev, [providerName]: embeddingModels }));

      // Recargar proveedores para actualizar timestamp
      await loadAIProviders();

      Swal.fire({
        icon: 'success',
        title: 'Modelos actualizados',
        html: `
          <div class="text-left">
            <p class="mb-2">✅ Modelos de ${providerData.display_name} actualizados correctamente</p>
            <p class="mb-1">📊 Modelos de chat: ${chatModels.length}</p>
            <p class="mb-2">🧠 Modelos embedding: ${embeddingModels.length}</p>
            <p class="text-sm text-gray-600">Total: ${chatModels.length + embeddingModels.length} modelos recargados desde API</p>
          </div>
        `,
        confirmButtonText: 'Aceptar'
      });
    } catch (error) {
      console.error('Error force refreshing models:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error en la actualización',
        text: `No se pudieron actualizar los modelos de ${providerData.display_name}: ${error.message}`,
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setLoadingModels(prev => ({ ...prev, [providerName]: false }));
    }
  };

  const testProvider = async (providerName) => {
    const providerData = providers.find(p => p.provider_name === providerName);
    if (!providerData || !providerData.api_key) {
      Swal.fire({
        icon: 'warning',
        title: 'Configuración incompleta',
        text: 'Debes configurar la API Key antes de probar',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    try {
      setLoadingModels(prev => ({ ...prev, [providerName]: true }));
      
      // Probar conexión obteniendo modelos de chat
      const chatModels = await aiProvidersService.getProviderChatModels(providerData.id);
      setDynamicModels(prev => ({ ...prev, [providerName]: chatModels }));
      
      // También obtener modelos de embedding
      const embeddingModels = await aiProvidersService.getProviderEmbeddingModels(providerData.id);
      setRagEmbeddingModels(prev => ({ ...prev, [providerName]: embeddingModels }));

      Swal.fire({
        icon: 'success',
        title: 'Prueba exitosa',
        html: `
          <div class="text-left">
            <p class="mb-2">✅ El provider ${providerData.display_name} está funcionando correctamente</p>
            <p class="mb-1">📊 Modelos de chat: ${chatModels.length}</p>
            <p class="mb-2">🧠 Modelos embedding: ${embeddingModels.length}</p>
            <p class="text-sm text-gray-600">Total: ${chatModels.length + embeddingModels.length} modelos disponibles</p>
          </div>
        `,
        confirmButtonText: 'Aceptar'
      });
    } catch (error) {
      console.error('Error testing provider:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error en la prueba',
        text: `No se pudo conectar con ${providerData.display_name}: ${error.message}`,
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setLoadingModels(prev => ({ ...prev, [providerName]: false }));
    }
  };

  const handleAddDocument = async () => {
    try {
      setSaving(true);

      // 1. Guardar documento en la base de conocimiento
      const { data: documentData, error: insertError } = await supabase
        .from('company_knowledge_base')
        .insert({
          corporate_client_id: selectedClient.id,
          company_id: profile?.company?.id,
          title: documentForm.title,
          content: documentForm.content,
          category: documentForm.category,
          knowledge_type: 'document',
          is_active: documentForm.is_active
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 2. Iniciar procesamiento RAG (vectorización)
      try {
        console.log('🧠 Iniciando procesamiento RAG para documento...');
        
        // Mostrar progreso de vectorización
        Swal.fire({
          title: 'Procesando documento',
          html: `
            <div class="text-center">
              <div class="mb-4">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <p class="text-sm text-gray-600 mb-2">Vectorizando documento para búsqueda semántica...</p>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-blue-600 h-2 rounded-full animate-pulse" style="width: 60%"></div>
              </div>
              <p class="text-xs text-gray-500 mt-2">Esto puede tomar unos segundos</p>
            </div>
          `,
          allowOutsideClick: false,
          showConfirmButton: false
        });

        // Procesar documento con RAG usando la configuración seleccionada
        const ragResult = await ragService.processDocument({
          ...documentData,
          corporate_client_id: selectedClient.id,
          company_id: profile?.company?.id
        }, {
          provider: aiConfig.rag.provider,
          apiKey: aiConfig.rag.apiKey,
          embeddingModel: aiConfig.rag.embeddingModel,
          chunkSize: aiConfig.rag.chunkSize,
          chunkOverlap: aiConfig.rag.chunkOverlap,
          similarityThreshold: aiConfig.rag.similarityThreshold,
          maxResults: aiConfig.rag.maxResults
        });

        // Cerrar modal de progreso
        Swal.close();

        // Mostrar éxito con detalles de RAG
        Swal.fire({
          icon: 'success',
          title: 'Documento agregado y procesado',
          html: `
            <div class="text-left">
              <p class="mb-2">✅ Documento guardado correctamente</p>
              <p class="mb-2">🧠 Vectorización completada:</p>
              <ul class="text-sm text-gray-600 ml-4">
                <li>• ${ragResult.chunksProcessed} chunks procesados</li>
                <li>• ${ragResult.embeddingsGenerated} embeddings generados</li>
                <li>• Tiempo: ${(ragResult.processingTime / 1000).toFixed(2)}s</li>
              </ul>
              <p class="text-sm text-green-600 mt-2">🔍 El documento ya está disponible para búsqueda semántica</p>
            </div>
          `,
          confirmButtonText: 'Aceptar'
        });

      } catch (ragError) {
        console.warn('Error en procesamiento RAG:', ragError);
        
        // Cerrar modal de progreso si está abierto
        Swal.close();
        
        // Mostrar advertencia pero continuar
        Swal.fire({
          icon: 'warning',
          title: 'Documento agregado con advertencia',
          html: `
            <div class="text-left">
              <p class="mb-2">✅ El documento se guardó correctamente</p>
              <p class="mb-2">⚠️ Pero hubo un error en la vectorización:</p>
              <p class="text-sm text-gray-600">${ragError.message}</p>
              <p class="text-sm text-blue-600 mt-2">💡 Puedes intentar procesarlo más tarde desde la lista de documentos</p>
            </div>
          `,
          confirmButtonText: 'Entendido'
        });
      }

      // 3. Limpiar formulario y recargar datos
      setShowAddDocument(false);
      setDocumentForm({
        title: '',
        content: '',
        category: 'general',
        is_active: true
      });

      await loadKnowledgeBase(selectedClient.id);

    } catch (error) {
      console.error('Error adding document:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo agregar el documento: ' + error.message
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReprocessDocument = async (document) => {
    try {
      // Mostrar confirmación
      const result = await Swal.fire({
        title: '¿Reprocesar documento?',
        html: `
          <div class="text-left">
            <p class="mb-2">Se volverá a vectorizar el documento:</p>
            <p class="font-medium mb-2">"${document.title}"</p>
            <p class="text-sm text-gray-600">Esto eliminará los embeddings anteriores y creará nuevos.</p>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, reprocesar',
        cancelButtonText: 'Cancelar'
      });

      if (!result.isConfirmed) return;

      // Mostrar progreso
      Swal.fire({
        title: 'Reprocesando documento',
        html: `
          <div class="text-center">
            <div class="mb-4">
              <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <p class="text-sm text-gray-600 mb-2">Eliminando embeddings anteriores...</p>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-blue-600 h-2 rounded-full animate-pulse" style="width: 30%"></div>
            </div>
          </div>
        `,
        allowOutsideClick: false,
        showConfirmButton: false
      });

      // 1. Eliminar embeddings existentes
      await ragService.deleteDocumentEmbeddings(document.id);

      // Actualizar mensaje de progreso
      Swal.fire({
        title: 'Reprocesando documento',
        html: `
          <div class="text-center">
            <div class="mb-4">
              <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <p class="text-sm text-gray-600 mb-2">Vectorizando documento...</p>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-blue-600 h-2 rounded-full animate-pulse" style="width: 70%"></div>
            </div>
          </div>
        `,
        allowOutsideClick: false,
        showConfirmButton: false
      });

      // 2. Reprocesar documento usando la configuración RAG seleccionada
      const ragResult = await ragService.processDocument({
        ...document,
        corporate_client_id: selectedClient.id,
        company_id: profile?.company?.id
      }, {
        provider: aiConfig.rag.provider,
        apiKey: aiConfig.rag.apiKey,
        embeddingModel: aiConfig.rag.embeddingModel,
        chunkSize: aiConfig.rag.chunkSize,
        chunkOverlap: aiConfig.rag.chunkOverlap,
        similarityThreshold: aiConfig.rag.similarityThreshold,
        maxResults: aiConfig.rag.maxResults
      });

      // Cerrar modal de progreso
      Swal.close();

      // Mostrar éxito
      Swal.fire({
        icon: 'success',
        title: 'Documento reprocesado',
        html: `
          <div class="text-left">
            <p class="mb-2">✅ Documento reprocesado correctamente</p>
            <p class="mb-2">🧠 Vectorización completada:</p>
            <ul class="text-sm text-gray-600 ml-4">
              <li>• ${ragResult.chunksProcessed} chunks procesados</li>
              <li>• ${ragResult.embeddingsGenerated} embeddings generados</li>
              <li>• Tiempo: ${(ragResult.processingTime / 1000).toFixed(2)}s</li>
            </ul>
            <p class="text-sm text-green-600 mt-2">🔍 El documento ya está disponible para búsqueda semántica</p>
          </div>
        `,
        confirmButtonText: 'Aceptar'
      });

      // Recargar datos para actualizar el estado
      await loadKnowledgeBase(selectedClient.id);

    } catch (error) {
      console.error('Error reprocessing document:', error);
      
      // Cerrar modal de progreso si está abierto
      Swal.close();
      
      Swal.fire({
        icon: 'error',
        title: 'Error al reprocesar',
        html: `
          <div class="text-left">
            <p class="mb-2">No se pudo reprocesar el documento:</p>
            <p class="text-sm text-gray-600">${error.message}</p>
          </div>
        `,
        confirmButtonText: 'Aceptar'
      });
    }
  };

  const handleAddPolicy = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('corporate_client_policies')
        .insert({
          corporate_client_id: selectedClient.id,
          company_id: profile?.company?.id,
          policy_type: policyForm.policy_type,
          policy_name: policyForm.policy_name,
          policy_description: policyForm.policy_description,
          policy_value: parseFloat(policyForm.policy_value),
          is_active: policyForm.is_active
        });

      if (error) throw error;

      setShowAddPolicy(false);
      setPolicyForm({
        policy_type: 'discount',
        policy_name: '',
        policy_description: '',
        policy_value: '',
        is_active: true
      });

      await loadKnowledgeBase(selectedClient.id);

      Swal.fire({
        icon: 'success',
        title: 'Política agregada',
        text: 'La política se ha agregado correctamente'
      });
    } catch (error) {
      console.error('Error adding policy:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo agregar la política'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddResponse = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('corporate_client_responses')
        .insert({
          corporate_client_id: selectedClient.id,
          company_id: profile?.company?.id,
          trigger_keyword: responseForm.trigger_keyword,
          trigger_type: responseForm.trigger_type,
          response_template: responseForm.response_template,
          use_debtor_name: responseForm.use_debtor_name,
          use_corporate_name: responseForm.use_corporate_name,
          is_active: responseForm.is_active
        });

      if (error) throw error;

      setShowAddResponse(false);
      setResponseForm({
        trigger_keyword: '',
        trigger_type: 'keyword',
        response_template: '',
        use_debtor_name: true,
        use_corporate_name: true,
        is_active: true
      });

      await loadKnowledgeBase(selectedClient.id);

      Swal.fire({
        icon: 'success',
        title: 'Respuesta agregada',
        text: 'La respuesta personalizada se ha agregado correctamente'
      });
    } catch (error) {
      console.error('Error adding response:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo agregar la respuesta'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrompt = async () => {
    try {
      setSaving(true);

      const promptData = {
        corporate_client_id: selectedClient.id,
        company_id: profile?.company?.id,
        prompt_type: promptForm.prompt_type,
        prompt_name: promptForm.prompt_name,
        prompt_template: promptForm.prompt_template,
        variables: promptForm.variables,
        is_active: promptForm.is_active,
        priority: promptForm.priority
      };

      let result;
      if (editingPrompt) {
        result = await supabase
          .from('corporate_prompt_templates')
          .update(promptData)
          .eq('id', editingPrompt.id);
      } else {
        result = await supabase
          .from('corporate_prompt_templates')
          .insert(promptData);
      }

      if (result.error) throw result.error;

      setShowAddPrompt(false);
      setEditingPrompt(null);
      setPromptForm({
        prompt_type: 'negotiation',
        prompt_name: '',
        prompt_template: '',
        variables: [],
        is_active: true,
        priority: 1
      });

      await loadPromptTemplates(selectedClient.id);

      Swal.fire({
        icon: 'success',
        title: editingPrompt ? 'Prompt actualizado' : 'Prompt creado',
        text: `La plantilla de prompt se ha ${editingPrompt ? 'actualizado' : 'creado'} correctamente`
      });
    } catch (error) {
      console.error('Error saving prompt:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar la plantilla de prompt'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestPrompt = async (prompt) => {
    if (!testMessage.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Mensaje de prueba requerido',
        text: 'Ingresa un mensaje de prueba para evaluar el prompt'
      });
      return;
    }

    try {
      setTestingPrompt(true);
      setTestResult(null);

      const { aiService } = await import('../../services/aiService.js');
      
      const context = {
        debtorName: 'Juan Pérez',
        debtorRut: '12.345.678-9',
        corporateName: selectedClient.name,
        corporateRut: selectedClient.contact_email || 'Sin RUT',
        debtAmount: 100000,
        daysOverdue: 45,
        debtType: 'Factura',
        dueDate: '2024-01-15',
        maxDiscount: 15,
        maxTerm: 12,
        paymentHistory: [],
        riskLevel: 'medium'
      };

      let processedPrompt = prompt.prompt_template;
      
      const variableMapping = {
        '{nombre_deudor}': context.debtorName,
        '{rut_deudor}': context.debtorRut,
        '{nombre_empresa}': context.corporateName,
        '{rut_empresa}': context.corporateRut,
        '{monto_deuda}': context.debtAmount,
        '{dias_mora}': context.daysOverdue,
        '{tipo_deuda}': context.debtType,
        '{fecha_vencimiento}': context.dueDate,
        '{descuento_maximo}': context.maxDiscount,
        '{plazo_maximo}': context.maxTerm,
        '{historial_pagos}': context.paymentHistory,
        '{nivel_riesgo}': context.riskLevel
      };
      
      Object.entries(variableMapping).forEach(([variable, value]) => {
        processedPrompt = processedPrompt.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
      });

      const result = await aiService.executeTask('negotiation_response', {
        prompt: processedPrompt,
        context: { message: testMessage, ...context },
        corporateClientId: selectedClient.id
      });

      setTestResult({
        success: true,
        response: result.response,
        processingTime: result.processingTime || 0,
        tokensUsed: result.tokensUsed || 0
      });
    } catch (error) {
      console.error('Error testing prompt:', error);
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setTestingPrompt(false);
    }
  };

  const handleEditPrompt = (prompt) => {
    setEditingPrompt(prompt);
    setPromptForm({
      prompt_type: prompt.prompt_type,
      prompt_name: prompt.prompt_name,
      prompt_template: prompt.prompt_template,
      variables: prompt.variables || [],
      is_active: prompt.is_active,
      priority: prompt.priority
    });
    setShowAddPrompt(true);
  };

  const handleDeletePrompt = async (promptId) => {
    const result = await Swal.fire({
      title: '¿Eliminar prompt?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      const { error } = await supabase
        .from('corporate_prompt_templates')
        .delete()
        .eq('id', promptId);

      if (error) throw error;

      await loadPromptTemplates(selectedClient.id);

      Swal.fire({
        icon: 'success',
        title: 'Prompt eliminado',
        text: 'La plantilla de prompt se ha eliminado correctamente'
      });
    } catch (error) {
      console.error('Error deleting prompt:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar la plantilla de prompt'
      });
    }
  };

  const addVariableToTemplate = (variable) => {
    const currentTemplate = promptForm.prompt_template || '';
    const newTemplate = currentTemplate + (currentTemplate ? ' ' : '') + variable.key;
    
    setPromptForm(prev => ({
      ...prev,
      prompt_template: newTemplate,
      variables: [...prev.variables, variable.key]
    }));
  };

  const getPromptTypeIcon = (type) => {
    switch (type) {
      case 'negotiation':
        return <MessageSquare className="w-4 h-4" />;
      case 'welcome':
        return <Users className="w-4 h-4" />;
      case 'escalation':
        return <Zap className="w-4 h-4" />;
      case 'closing':
        return <Target className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getPromptTypeLabel = (type) => {
    switch (type) {
      case 'negotiation':
        return 'Negociación';
      case 'welcome':
        return 'Bienvenida';
      case 'escalation':
        return 'Escalada';
      case 'closing':
        return 'Cierre';
      default:
        return 'General';
    }
  };

  const filteredDocuments = knowledgeBase.documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPolicies = knowledgeBase.policies.filter(policy => 
    policy.policy_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    policy.policy_description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredResponses = knowledgeBase.responses.filter(response => 
    response.trigger_keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
    response.response_template.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !selectedClient) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="flex h-full">
      {/* Sidebar - Selector de Cliente Corporativo */}
      <div className="w-80 bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 p-6 overflow-y-auto">
        {/* Header del Sidebar */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Clientes Corporativos</h2>
              <p className="text-sm text-gray-600 font-medium">Configuración de IA Personalizada</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Clientes Activos</p>
                <p className="text-2xl font-bold text-gray-900">{corporateClients.length}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600 mb-1">Configuraciones</p>
                <p className="text-lg font-semibold text-blue-600">
                  {selectedClient ? '1 Activa' : 'Sin selección'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Clientes */}
        <div className="space-y-3">
          {corporateClients.map((client) => (
            <div
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className={`group relative cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                selectedClient?.id === client.id
                  ? 'scale-[1.02]'
                  : ''
              }`}
            >
              {/* Card del Cliente */}
              <div className={`relative rounded-xl border-2 p-4 transition-all duration-300 ${
                selectedClient?.id === client.id
                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
              }`}>
                {/* Indicador de selección */}
                {selectedClient?.id === client.id && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                )}

                {/* Contenido del Cliente */}
                <div className="flex items-center gap-4">
                  {/* Avatar con gradiente */}
                  <div className={`relative w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    selectedClient?.id === client.id
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg'
                      : 'bg-gradient-to-br from-gray-400 to-gray-600 group-hover:from-blue-400 group-hover:to-purple-500'
                  }`}>
                    <Users className="w-7 h-7 text-white" />
                    {/* Indicador de estado */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
                  </div>

                  {/* Información del Cliente */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-sm mb-1 truncate ${
                      selectedClient?.id === client.id
                        ? 'text-gray-900'
                        : 'text-gray-800 group-hover:text-gray-900'
                    }`}>
                      {client.name}
                    </h3>
                    <p className="text-xs text-gray-600 mb-2 truncate">
                      {client.contact_email || 'Sin email'}
                    </p>
                    
                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={selectedClient?.id === client.id ? "primary" : "secondary"}
                        size="xs"
                        className="font-medium"
                      >
                        {client.display_category}
                      </Badge>
                      <Badge
                        variant="outline"
                        size="xs"
                        className="text-green-600 border-green-200 bg-green-50"
                      >
                        Activo
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Línea decorativa inferior */}
                {selectedClient?.id === client.id && (
                  <div className="absolute bottom-0 left-4 right-4 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                )}
              </div>

              {/* Efecto de hover */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            </div>
          ))}

          {/* Estado vacío mejorado */}
          {corporateClients.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin clientes corporativos</h3>
              <p className="text-sm text-gray-600 mb-4">No hay clientes disponibles para configurar</p>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-xs text-blue-700">
                  <strong>Tip:</strong> Contacta al administrador para agregar clientes corporativos
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer informativo */}
        {selectedClient && (
          <div className="mt-8 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-green-600" />
              <p className="text-sm font-semibold text-gray-900">IA Configurada</p>
            </div>
            <p className="text-xs text-gray-600">
              {selectedClient.name} está listo para usar con IA personalizada
            </p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg md:text-2xl font-display font-bold tracking-tight mb-2">Dashboard de IA</h1>
                <p className="text-blue-100 text-xs md:text-sm">
                  {selectedClient
                    ? `Configuración de IA para ${selectedClient.name}`
                    : 'Selecciona un cliente corporativo para comenzar'
                  }
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={saveAIConfiguration}
                  loading={saving}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Guardar Configuración
                </Button>
              </div>
            </div>
          </div>

          {selectedClient ? (
            <>
              {/* Tabs - Diseño Mejorado */}
              <div className="mb-6">
                {/* Tarjeta de navegación con diseño moderno */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                    {tabs.map(tab => {
                      const isActive = activeTab === tab.id;
                      const tabToUrlMap = {
                        'providers': 'proveedores',
                        'messaging': 'mensajeria',
                        'personalization': 'personalizacion',
                        'knowledge': 'conocimiento',
                        'prompts': 'prompts',
                        'analytics': 'analytics'
                      };

                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            // Navegar a URL independiente cuando se hace click en un tab
                            const spanishUrl = tabToUrlMap[tab.id] || tab.id;
                            const newUrl = `/empresa/ia/${spanishUrl}`;
                            window.history.pushState({}, '', newUrl);
                            setActiveTab(tab.id);
                          }}
                          className={`
                            relative flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 group
                            ${isActive
                              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-md'
                            }
                          `}
                        >
                          {/* Indicador activo */}
                          {isActive && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
                          )}
                          
                          {/* Icono con efecto */}
                          <div className={`
                            mb-2 p-2 rounded-lg transition-all duration-200
                            ${isActive
                              ? 'bg-white bg-opacity-20 shadow-inner'
                              : 'bg-white group-hover:bg-blue-50 group-hover:shadow-sm'
                            }
                          `}>
                            <tab.icon className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-white' : 'text-blue-600 group-hover:text-blue-700'}`} />
                          </div>
                          
                          {/* Texto */}
                          <span className="text-xs font-medium text-center leading-tight">
                            {tab.label}
                          </span>
                          
                          {/* Badge de estado para tabs específicos */}
                          {tab.id === 'providers' && providers.filter(p => p.is_active).length > 0 && (
                            <div className="absolute top-2 left-2 w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-sm"></div>
                          )}
                          
                          {tab.id === 'knowledge' && selectedClient && (
                            <div className="absolute bottom-2 right-2 w-2 h-2 bg-purple-400 rounded-full shadow-sm"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Indicador visual del tab activo */}
                <div className="mt-4 flex items-center justify-center">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-full border border-gray-200">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>
                      Actualmente en: <strong className="text-gray-900">
                        {tabs.find(t => t.id === activeTab)?.label || 'Desconocido'}
                      </strong>
                    </span>
                    {selectedClient && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-blue-600 font-medium">{selectedClient.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <div className="space-y-6">
                {/* Proveedores IA Tab */}
                {activeTab === 'providers' && (
                  <div className="space-y-6">

                    <Card>
                      <h3 className="text-xl font-bold mb-4">Proveedores de Inteligencia Artificial</h3>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {providers.filter(provider => ['groq', 'chutes'].includes(provider.provider_name)).map((provider) => (
                          <Card key={provider.id} className={`border-2 ${provider.is_active ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{provider.display_name}</h4>
                                {provider.is_active && (
                                  <Badge variant="primary" size="sm">Activo</Badge>
                                )}
                              </div>
                              <Button
                                variant={provider.is_active ? "outline" : "primary"}
                                size="sm"
                                onClick={() => handleActivateProvider(provider.id)}
                                disabled={provider.is_active}
                                leftIcon={provider.is_active ? <CheckCircle className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                              >
                                {provider.is_active ? 'Activado' : 'Activar'}
                              </Button>
                            </div>
                            
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  API Key
                                </label>
                                <div className="flex gap-2">
                                  <Input
                                    type="password"
                                    value={provider.api_key ? '••••••••••••••••' : ''}
                                    onChange={(e) => {
                                      const newApiKey = e.target.value;
                                      handleUpdateAPIKey(provider.id, newApiKey);
                                    }}
                                    placeholder="API Key del proveedor"
                                    className="flex-1"
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      navigator.clipboard.writeText(provider.api_key || '');
                                      Swal.fire({
                                        icon: 'success',
                                        title: 'API Key copiada',
                                        text: 'La API key ha sido copiada al portapapeles',
                                        timer: 1500,
                                        showConfirmButton: false
                                      });
                                    }}
                                    disabled={!provider.api_key}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Modelos Disponibles ({dynamicModels[provider.provider_name]?.length || 0})
                                </label>
                                
                                {/* Vista mejorada de modelos disponibles */}
                                <div className="space-y-2">
                                  {loadingModels[provider.provider_name] ? (
                                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                      <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                                      <span className="text-sm text-gray-600">Cargando modelos desde API...</span>
                                    </div>
                                  ) : (dynamicModels[provider.provider_name] || []).length > 0 ? (
                                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50">
                                      <div className="p-2 space-y-1">
                                        {dynamicModels[provider.provider_name]
                                          .sort((a, b) => a.name.localeCompare(b.name))
                                          .map((model, index) => (
                                            <div
                                              key={model.id || index}
                                              className="flex items-center justify-between p-2 bg-white rounded border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                                            >
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                  <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                                                  <span className="text-sm font-medium text-gray-900 truncate">
                                                    {model.name}
                                                  </span>
                                                </div>
                                                {model.description && (
                                                  <p className="text-xs text-gray-500 mt-1 truncate">
                                                    {model.description}
                                                  </p>
                                                )}
                                                {model.contextWindow && (
                                                  <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                                      {model.contextWindow.toLocaleString('es-CL')} tokens
                                                    </span>
                                                  </div>
                                                )}
                                              </div>
                                              <div className="flex items-center gap-1 ml-2">
                                                {model.isRecommended && (
                                                  <Badge variant="primary" size="xs">
                                                    Recomendado
                                                  </Badge>
                                                )}
                                                {model.isDefault && (
                                                  <Badge variant="secondary" size="xs">
                                                    Por defecto
                                                  </Badge>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                      <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                        <span className="text-sm text-yellow-800">
                                          No hay modelos disponibles
                                        </span>
                                      </div>
                                      <p className="text-xs text-yellow-600 mt-1">
                                        {provider.api_key
                                          ? 'Verifica tu API key o intenta recargar los modelos'
                                          : 'Configura una API key para cargar modelos'
                                        }
                                      </p>
                                    </div>
                                  )}
                                  
                                  {/* Información adicional */}
                                  {(dynamicModels[provider.provider_name] || []).length > 0 && (
                                    <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-100">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Brain className="w-3 h-3 text-blue-600" />
                                        <span className="font-medium text-blue-700">
                                          {dynamicModels[provider.provider_name].length} modelos cargados
                                        </span>
                                      </div>
                                      <p className="text-blue-600">
                                        Ordenados alfabéticamente • Actualizados: {provider.last_models_fetch
                                          ? new Date(provider.last_models_fetch).toLocaleString('es-CL', {
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })
                                          : 'Nunca'
                                        }
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                <div>
                                  <span className="font-medium">Modelos de chat:</span> {(provider.chat_models || []).length}
                                </div>
                                <div>
                                  <span className="font-medium">Modelos embedding:</span> {(provider.embedding_models || []).length}
                                </div>
                              </div>
                              
                              <div className="text-xs text-gray-500">
                                Última actualización: {provider.last_models_fetch
                                  ? new Date(provider.last_models_fetch).toLocaleString('es-CL')
                                  : 'Nunca'
                                }
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => testProvider(provider.provider_name)}
                                  leftIcon={<TestTube className="w-4 h-4" />}
                                  className="w-full"
                                  disabled={loadingModels[provider.provider_name] || !provider.api_key}
                                >
                                  {loadingModels[provider.provider_name] ? 'Cargando Modelos...' : 'Probar Conexión'}
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  onClick={() => forceRefreshModels(provider.provider_name)}
                                  leftIcon={<RefreshCw className="w-4 h-4" />}
                                  className="w-full"
                                  disabled={loadingModels[provider.provider_name] || !provider.api_key}
                                  title="Forzar recarga de modelos desde API"
                                >
                                  {loadingModels[provider.provider_name] ? 'Actualizando...' : 'Forzar Actualización'}
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </Card>

                    <Card>
                      <h3 className="text-xl font-bold mb-4">Configuración General</h3>
                      
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

                    {/* Configuración RAG */}
                    <Card>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Database className="w-5 h-5 text-purple-600" />
                          <h3 className="text-lg font-semibold text-gray-900">Configuración RAG</h3>
                        </div>
                        <ToggleSwitch
                          checked={aiConfig.rag.enabled}
                          onChange={(enabled) => setAiConfig(prev => ({
                            ...prev,
                            rag: { ...prev.rag, enabled }
                          }))}
                          label="Habilitar RAG"
                        />
                      </div>

                      {aiConfig.rag.enabled && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Proveedor de Embeddings
                              </label>
                              <Select
                                value={aiConfig.rag.provider}
                                onChange={async (provider) => {
                                  // Obtener el proveedor seleccionado
                                  const selectedProviderData = providers.find(p => p.provider_name === provider);
                                  
                                  setAiConfig(prev => ({
                                    ...prev,
                                    rag: {
                                      ...prev.rag,
                                      provider,
                                      apiKey: selectedProviderData?.api_key || ''
                                    }
                                  }));
                                  
                                  // Cargar modelos de embedding para el nuevo proveedor
                                  if (selectedProviderData?.api_key && selectedProviderData.api_key.length > 10) {
                                    try {
                                      setLoadingRagModels(prev => ({ ...prev, [provider]: true }));
                                      const embeddingModels = await aiProvidersService.getProviderEmbeddingModels(selectedProviderData.id);
                                      setRagEmbeddingModels(prev => ({ ...prev, [provider]: embeddingModels }));
                                    } catch (error) {
                                      console.error('Error loading embedding models:', error);
                                    } finally {
                                      setLoadingRagModels(prev => ({ ...prev, [provider]: false }));
                                    }
                                  }
                                }}
                                options={providers
                                  .filter(p => ['groq', 'chutes'].includes(p.provider_name))
                                  .map(provider => ({
                                    value: provider.provider_name,
                                    label: `${provider.display_name} ${provider.is_active ? '(Activo)' : ''}`
                                  }))}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Modelo de Embeddings
                              </label>
                              <Select
                                value={aiConfig.rag.embeddingModel}
                                onChange={(embeddingModel) => setAiConfig(prev => ({
                                  ...prev,
                                  rag: { ...prev.rag, embeddingModel }
                                }))}
                                options={
                                  loadingRagModels[aiConfig.rag.provider]
                                    ? [{ value: '', label: 'Cargando modelos...', disabled: true }]
                                    : ragEmbeddingModels[aiConfig.rag.provider]?.length > 0
                                      ? ragEmbeddingModels[aiConfig.rag.provider].map(model => ({
                                          value: model.id,
                                          label: `${model.name} - ${model.description || ''}`
                                        }))
                                      : [{ value: '', label: 'No hay modelos de embedding disponibles', disabled: true }]
                                }
                                placeholder="Selecciona un modelo de embedding"
                              />
                              {ragEmbeddingModels[aiConfig.rag.provider]?.length > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {ragEmbeddingModels[aiConfig.rag.provider].length} modelos de embedding disponibles para {aiConfig.rag.provider}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tamaño de Chunk
                              </label>
                              <Input
                                type="number"
                                min="100"
                                max="2000"
                                value={aiConfig.rag.chunkSize}
                                onChange={(e) => setAiConfig(prev => ({
                                  ...prev,
                                  rag: { ...prev.rag, chunkSize: parseInt(e.target.value) || 1000 }
                                }))}
                                helperText="Caracteres por chunk"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Overlap de Chunk
                              </label>
                              <Input
                                type="number"
                                min="0"
                                max="500"
                                value={aiConfig.rag.chunkOverlap}
                                onChange={(e) => setAiConfig(prev => ({
                                  ...prev,
                                  rag: { ...prev.rag, chunkOverlap: parseInt(e.target.value) || 200 }
                                }))}
                                helperText="Caracteres de solapamiento entre chunks"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Umbral de Similitud
                              </label>
                              <Input
                                type="number"
                                min="0.1"
                                max="1.0"
                                step="0.1"
                                value={aiConfig.rag.similarityThreshold}
                                onChange={(e) => setAiConfig(prev => ({
                                  ...prev,
                                  rag: { ...prev.rag, similarityThreshold: parseFloat(e.target.value) || 0.7 }
                                }))}
                                helperText="Umbral mínimo para coincidencias (0.1-1.0)"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Resultados Máximos
                              </label>
                              <Input
                                type="number"
                                min="1"
                                max="50"
                                value={aiConfig.rag.maxResults}
                                onChange={(e) => setAiConfig(prev => ({
                                  ...prev,
                                  rag: { ...prev.rag, maxResults: parseInt(e.target.value) || 10 }
                                }))}
                                helperText="Máximo de resultados por búsqueda"
                              />
                            </div>
                          </div>

                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Brain className="w-4 h-4 text-blue-600" />
                              <h4 className="font-medium text-blue-900">Información RAG</h4>
                            </div>
                            <div className="text-sm text-blue-700 space-y-1">
                              <p>• <strong>Proveedores:</strong> Usa los mismos proveedores configurados en la sección de Proveedores IA</p>
                              <p>• <strong>Modelos:</strong> Solo se muestran modelos especializados en embeddings</p>
                              <p>• <strong>API Keys:</strong> Se utilizan las mismas API keys configuradas para cada proveedor</p>
                              <p>• <strong>Vectorización:</strong> Los embeddings se usan para vectorizar documentos y búsqueda semántica</p>
                            </div>
                          </div>

                        </div>
                      )}
                    </Card>
                  </div>
                )}

                {/* 🔥 NUEVA TAB: Mensajería */}
                {activeTab === 'messaging' && (
                  <div className="space-y-6">
                    <Card>
                      <h3 className="text-xl font-bold mb-4">Configuración de Mensajería</h3>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Configuración básica */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-900">Respuesta Automática</h4>
                          
                          <ToggleSwitch
                            label="Respuesta automática habilitada"
                            checked={messagingConfig.autoRespond}
                            onChange={(autoRespond) => setMessagingConfig(prev => ({ ...prev, autoRespond }))}
                          />
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Tiempo de respuesta (segundos)
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Mínimo</label>
                                <Input
                                  type="number"
                                  min="1"
                                  max="60"
                                  value={messagingConfig.responseDelay.min}
                                  onChange={(e) => setMessagingConfig(prev => ({
                                    ...prev,
                                    responseDelay: { ...prev.responseDelay, min: parseInt(e.target.value) || 1 }
                                  }))}
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Máximo</label>
                                <Input
                                  type="number"
                                  min="1"
                                  max="60"
                                  value={messagingConfig.responseDelay.max}
                                  onChange={(e) => setMessagingConfig(prev => ({
                                    ...prev,
                                    responseDelay: { ...prev.responseDelay, max: parseInt(e.target.value) || 1 }
                                  }))}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Horario de trabajo */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-900">Horario de Trabajo</h4>
                          
                          <ToggleSwitch
                            label="Respetar horario de trabajo"
                            checked={messagingConfig.workingHours.enabled}
                            onChange={(enabled) => setMessagingConfig(prev => ({
                              ...prev,
                              workingHours: { ...prev.workingHours, enabled }
                            }))}
                          />
                          
                          {messagingConfig.workingHours.enabled && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Zona Horaria
                                </label>
                                <Select
                                  value={messagingConfig.workingHours.timezone}
                                  onChange={(timezone) => setMessagingConfig(prev => ({
                                    ...prev,
                                    workingHours: { ...prev.workingHours, timezone }
                                  }))}
                                  options={[
                                    { value: 'America/Santiago', label: 'Santiago (CLT)' },
                                    { value: 'America/Mexico_City', label: 'Ciudad de México' },
                                    { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires' },
                                    { value: 'America/Lima', label: 'Lima' }
                                  ]}
                                />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Hora Inicio
                                  </label>
                                  <Input
                                    type="time"
                                    value={messagingConfig.workingHours.start}
                                    onChange={(e) => setMessagingConfig(prev => ({
                                      ...prev,
                                      workingHours: { ...prev.workingHours, start: e.target.value }
                                    }))}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Hora Fin
                                  </label>
                                  <Input
                                    type="time"
                                    value={messagingConfig.workingHours.end}
                                    onChange={(e) => setMessagingConfig(prev => ({
                                      ...prev,
                                      workingHours: { ...prev.workingHours, end: e.target.value }
                                    }))}
                                  />
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>

                    <Card>
                      <h3 className="text-xl font-bold mb-4">Umbrales de Escalado</h3>
                      
                      <ToggleSwitch
                        label="Escalado automático habilitado"
                        checked={messagingConfig.escalation.enabled}
                        onChange={(enabled) => setMessagingConfig(prev => ({
                          ...prev,
                          escalation: { ...prev.escalation, enabled }
                        }))}
                      />
                      
                      {messagingConfig.escalation.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Longitud de conversación
                            </label>
                            <Input
                              type="number"
                              min="5"
                              max="50"
                              value={messagingConfig.escalation.thresholds.conversationLength}
                              onChange={(e) => setMessagingConfig(prev => ({
                                ...prev,
                                escalation: {
                                  ...prev.escalation,
                                  thresholds: {
                                    ...prev.escalation.thresholds,
                                    conversationLength: parseInt(e.target.value) || 15
                                  }
                                }
                              }))}
                              helperText="Mensajes antes de escalar"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Descuento solicitado (%)
                            </label>
                            <Input
                              type="number"
                              min="5"
                              max="50"
                              value={messagingConfig.escalation.thresholds.discountRequested}
                              onChange={(e) => setMessagingConfig(prev => ({
                                ...prev,
                                escalation: {
                                  ...prev.escalation,
                                  thresholds: {
                                    ...prev.escalation.thresholds,
                                    discountRequested: parseInt(e.target.value) || 20
                                  }
                                }
                              }))}
                              helperText="Descuento que activa escalado"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tiempo solicitado (meses)
                            </label>
                            <Input
                              type="number"
                              min="6"
                              max="36"
                              value={messagingConfig.escalation.thresholds.timeRequested}
                              onChange={(e) => setMessagingConfig(prev => ({
                                ...prev,
                                escalation: {
                                  ...prev.escalation,
                                  thresholds: {
                                    ...prev.escalation.thresholds,
                                    timeRequested: parseInt(e.target.value) || 18
                                  }
                                }
                              }))}
                              helperText="Meses que activan escalado"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nivel de frustración
                            </label>
                            <Input
                              type="number"
                              min="0.1"
                              max="1.0"
                              step="0.1"
                              value={messagingConfig.escalation.thresholds.frustrationLevel}
                              onChange={(e) => setMessagingConfig(prev => ({
                                ...prev,
                                escalation: {
                                  ...prev.escalation,
                                  thresholds: {
                                    ...prev.escalation.thresholds,
                                    frustrationLevel: parseFloat(e.target.value) || 0.7
                                  }
                                }
                              }))}
                              helperText="Nivel para escalar"
                            />
                          </div>
                        </div>
                      )}
                    </Card>

                    <Card>
                      <h3 className="text-xl font-bold mb-4">Respuestas Personalizadas</h3>
                      
                      <div className="space-y-4">
                        {customResponses.map((response, index) => (
                          <div key={response.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="secondary" size="sm">
                                    {response.type}
                                  </Badge>
                                  <span className="font-medium text-gray-900">
                                    Trigger: "{response.trigger}"
                                  </span>
                                  <ToggleSwitch
                                    checked={response.enabled}
                                    onChange={(enabled) => {
                                      const newResponses = [...customResponses];
                                      newResponses[index].enabled = enabled;
                                      setCustomResponses(newResponses);
                                    }}
                                  />
                                </div>
                                <p className="text-sm text-gray-600">{response.response}</p>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <Button size="sm" variant="ghost">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <Button
                          variant="outline"
                          onClick={() => {
                            const newResponse = {
                              id: Date.now(),
                              trigger: '',
                              type: 'keyword',
                              response: '',
                              enabled: true
                            };
                            setCustomResponses([...customResponses, newResponse]);
                          }}
                          leftIcon={<Plus className="w-4 h-4" />}
                        >
                          Agregar Respuesta
                        </Button>
                      </div>
                    </Card>
                  </div>
                )}

                {/* 🔥 NUEVA TAB: Personalización */}
                {activeTab === 'personalization' && (
                  <div className="space-y-6">
                    <Card>
                      <h3 className="text-xl font-bold mb-4">Configuración de Personalización</h3>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Nivel de personalización */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-900">Nivel de Personalización</h4>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Nivel de Personalización
                            </label>
                            <Select
                              value={personalizationConfig.level}
                              onChange={(level) => setPersonalizationConfig(prev => ({ ...prev, level }))}
                              options={[
                                { value: 'low', label: 'Bajo - Respuestas genéricas' },
                                { value: 'medium', label: 'Medio - Algunos datos personales' },
                                { value: 'high', label: 'Alto - Personalización completa' },
                                { value: 'ultra_high', label: 'Ultra Alto - Máxima personalización' }
                              ]}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Estilo de Comunicación
                            </label>
                            <Select
                              value={personalizationConfig.communicationStyle}
                              onChange={(communicationStyle) => setPersonalizationConfig(prev => ({ ...prev, communicationStyle }))}
                              options={[
                                { value: 'formal', label: 'Formal' },
                                { value: 'professional', label: 'Profesional' },
                                { value: 'informal', label: 'Informal' }
                              ]}
                            />
                          </div>
                        </div>

                        {/* Elementos de personalización */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-900">Elementos de Personalización</h4>
                          
                          <div className="space-y-3">
                            <ToggleSwitch
                              label="Usar nombre del deudor"
                              checked={personalizationConfig.useDebtorName}
                              onChange={(useDebtorName) => setPersonalizationConfig(prev => ({ ...prev, useDebtorName }))}
                            />
                            
                            <ToggleSwitch
                              label="Usar nombre de la empresa"
                              checked={personalizationConfig.useCorporateName}
                              onChange={(useCorporateName) => setPersonalizationConfig(prev => ({ ...prev, useCorporateName }))}
                            />
                            
                            <ToggleSwitch
                              label="Usar RUT del deudor"
                              checked={personalizationConfig.useRUT}
                              onChange={(useRUT) => setPersonalizationConfig(prev => ({ ...prev, useRUT }))}
                            />
                            
                            <ToggleSwitch
                              label="Usar historial de pagos"
                              checked={personalizationConfig.useHistory}
                              onChange={(useHistory) => setPersonalizationConfig(prev => ({ ...prev, useHistory }))}
                            />
                            
                            <ToggleSwitch
                              label="Adaptación al nivel de riesgo"
                              checked={personalizationConfig.riskAdaptation}
                              onChange={(riskAdaptation) => setPersonalizationConfig(prev => ({ ...prev, riskAdaptation }))}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card>
                      <h3 className="text-xl font-bold mb-4">Mensajes Personalizados</h3>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Saludo Personalizado
                          </label>
                          <textarea
                            value={personalizationConfig.customGreeting}
                            onChange={(e) => setPersonalizationConfig(prev => ({ ...prev, customGreeting: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ej: ¡Hola {nombre_deudor}! Bienvenido a {nombre_empresa}..."
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Deja vacío para usar saludo predeterminado
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Despedida Personalizada
                          </label>
                          <textarea
                            value={personalizationConfig.customSignature}
                            onChange={(e) => setPersonalizationConfig(prev => ({ ...prev, customSignature: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ej: Atentamente, el equipo de {nombre_empresa}..."
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Deja vacío para usar despedida predeterminada
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card>
                      <h3 className="text-xl font-bold mb-4">Límites de Negociación</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descuento Máximo (%)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="50"
                            value={negotiationLimits.maxDiscount}
                            onChange={(e) => setNegotiationLimits(prev => ({ ...prev, maxDiscount: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cuotas Máximas
                          </label>
                          <Input
                            type="number"
                            min="1"
                            max="24"
                            value={negotiationLimits.maxInstallments}
                            onChange={(e) => setNegotiationLimits(prev => ({ ...prev, maxInstallments: parseInt(e.target.value) || 1 }))}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Plazo Máximo (meses)
                          </label>
                          <Input
                            type="number"
                            min="1"
                            max="36"
                            value={negotiationLimits.maxTerm}
                            onChange={(e) => setNegotiationLimits(prev => ({ ...prev, maxTerm: parseInt(e.target.value) || 1 }))}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pago Mínimo ($)
                          </label>
                          <Input
                            type="number"
                            min="1000"
                            step="1000"
                            value={negotiationLimits.minPayment}
                            onChange={(e) => setNegotiationLimits(prev => ({ ...prev, minPayment: parseInt(e.target.value) || 1000 }))}
                          />
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {/* Base de Conocimiento Tab */}
                {activeTab === 'knowledge' && (
                  <div className="space-y-6">
                    {/* Configuración de IA */}
                    <Card>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Brain className="w-5 h-5 text-purple-600" />
                          <h3 className="text-lg font-semibold text-gray-900">Configuración de IA</h3>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descuento Máximo (%)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={knowledgeBase.aiConfig.max_negotiation_discount}
                            onChange={(e) => setKnowledgeBase(prev => ({
                              ...prev,
                              aiConfig: {
                                ...prev.aiConfig,
                                max_negotiation_discount: parseFloat(e.target.value) || 0
                              }
                            }))}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Plazo Máximo (meses)
                          </label>
                          <Input
                            type="number"
                            min="1"
                            max="60"
                            value={knowledgeBase.aiConfig.max_negotiation_term}
                            onChange={(e) => setKnowledgeBase(prev => ({
                              ...prev,
                              aiConfig: {
                                ...prev.aiConfig,
                                max_negotiation_term: parseInt(e.target.value) || 1
                              }
                            }))}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Hora Inicio
                          </label>
                          <Input
                            type="time"
                            value={knowledgeBase.aiConfig.working_hours?.start || '09:00'}
                            onChange={(e) => setKnowledgeBase(prev => ({
                              ...prev,
                              aiConfig: {
                                ...prev.aiConfig,
                                working_hours: {
                                  ...prev.aiConfig.working_hours,
                                  start: e.target.value
                                }
                              }
                            }))}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Hora Fin
                          </label>
                          <Input
                            type="time"
                            value={knowledgeBase.aiConfig.working_hours?.end || '18:00'}
                            onChange={(e) => setKnowledgeBase(prev => ({
                              ...prev,
                              aiConfig: {
                                ...prev.aiConfig,
                                working_hours: {
                                  ...prev.aiConfig.working_hours,
                                  end: e.target.value
                                }
                              }
                            }))}
                          />
                        </div>
                      </div>
                    </Card>

                    {/* Barra de búsqueda y filtros */}
                    <Card>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              placeholder="Buscar en base de conocimiento..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <Select
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                          options={[
                            { value: 'all', label: 'Todos' },
                            { value: 'documents', label: 'Documentos' },
                            { value: 'policies', label: 'Políticas' },
                            { value: 'responses', label: 'Respuestas' }
                          ]}
                        />
                      </div>
                    </Card>

                    {/* Documentos */}
                    <Card>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            Documentos ({filteredDocuments.length})
                          </h3>
                        </div>
                        <Button
                          onClick={() => setShowAddDocument(true)}
                          size="sm"
                          variant="primary"
                          leftIcon={<Plus className="w-4 h-4" />}
                        >
                          Agregar Documento
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {filteredDocuments.map((doc) => (
                          <DocumentCard
                            key={doc.id}
                            document={doc}
                            onEdit={() => console.log('Edit document:', doc.id)}
                            onDelete={() => console.log('Delete document:', doc.id)}
                            onReprocess={() => handleReprocessDocument(doc)}
                            corporateClientId={selectedClient.id}
                          />
                        ))}

                        {filteredDocuments.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No hay documentos en la base de conocimiento</p>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Políticas */}
                    <Card>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Settings className="w-5 h-5 text-green-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            Políticas ({filteredPolicies.length})
                          </h3>
                        </div>
                        <Button
                          onClick={() => setShowAddPolicy(true)}
                          size="sm"
                          variant="primary"
                          leftIcon={<Plus className="w-4 h-4" />}
                        >
                          Agregar Política
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {filteredPolicies.map((policy) => (
                          <div key={policy.id} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{policy.policy_name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{policy.policy_description}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="secondary" size="sm">
                                    {policy.policy_type}
                                  </Badge>
                                  {policy.policy_value && (
                                    <Badge variant="outline" size="sm">
                                      {policy.policy_type === 'discount' ? `${policy.policy_value}%` : policy.policy_value}
                                    </Badge>
                                  )}
                                  <span className="text-xs text-gray-500">
                                    {new Date(policy.created_at).toLocaleDateString('es-CL')}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <Button size="sm" variant="ghost">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}

                        {filteredPolicies.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No hay políticas configuradas</p>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Respuestas */}
                    <Card>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Brain className="w-5 h-5 text-purple-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            Respuestas Personalizadas ({filteredResponses.length})
                          </h3>
                        </div>
                        <Button
                          onClick={() => setShowAddResponse(true)}
                          size="sm"
                          variant="primary"
                          leftIcon={<Plus className="w-4 h-4" />}
                        >
                          Agregar Respuesta
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {filteredResponses.map((response) => (
                          <div key={response.id} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">
                                  Trigger: {response.trigger_keyword}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {response.response_template}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="secondary" size="sm">
                                    {response.trigger_type}
                                  </Badge>
                                  {response.use_debtor_name && (
                                    <Badge variant="outline" size="sm">
                                      Usa nombre deudor
                                    </Badge>
                                  )}
                                  {response.use_corporate_name && (
                                    <Badge variant="outline" size="sm">
                                      Usa nombre empresa
                                    </Badge>
                                  )}
                                  <span className="text-xs text-gray-500">
                                    {new Date(response.created_at).toLocaleDateString('es-CL')}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <Button size="sm" variant="ghost">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}

                        {filteredResponses.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No hay respuestas personalizadas configuradas</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                )}

                {/* Prompts Tab */}
                {activeTab === 'prompts' && (
                  <div className="space-y-6">
                    {/* Panel de prueba */}
                    <Card>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Modo de Prueba</h3>
                        <ToggleSwitch
                          checked={testMode}
                          onChange={setTestMode}
                          label="Activar modo prueba"
                        />
                      </div>
                      
                      {testMode && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Mensaje de prueba del deudor
                            </label>
                            <textarea
                              value={testMessage}
                              onChange={(e) => setTestMessage(e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Ej: Hola, me gustaría negociar mi deuda. ¿Pueden ofrecerme un descuento?"
                            />
                          </div>

                          {testResult && (
                            <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                              <h4 className={`font-medium ${testResult.success ? 'text-green-900' : 'text-red-900'}`}>
                                {testResult.success ? 'Respuesta de IA' : 'Error en la prueba'}
                              </h4>
                              {testResult.success ? (
                                <>
                                  <p className="text-green-800 mt-2">{testResult.response}</p>
                                  <div className="flex items-center gap-4 mt-2 text-xs text-green-600">
                                    <span>Tiempo: {testResult.processingTime}ms</span>
                                    <span>Tokens: {testResult.tokensUsed}</span>
                                  </div>
                                </>
                              ) : (
                                <p className="text-red-800 mt-2">{testResult.error}</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </Card>

                    {/* Lista de Prompts */}
                    <Card>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Settings className="w-5 h-5 text-purple-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            Plantillas de Prompt ({promptTemplates.length})
                          </h3>
                        </div>
                        <Button
                          onClick={() => setShowAddPrompt(true)}
                          size="sm"
                          variant="primary"
                          leftIcon={<Plus className="w-4 h-4" />}
                        >
                          Agregar Prompt
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {promptTemplates.map((prompt) => (
                          <div key={prompt.id} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {getPromptTypeIcon(prompt.prompt_type)}
                                  <h4 className="font-medium text-gray-900">{prompt.prompt_name}</h4>
                                  <Badge variant="secondary" size="sm">
                                    {getPromptTypeLabel(prompt.prompt_type)}
                                  </Badge>
                                  <Badge variant="outline" size="sm">
                                    Prioridad: {prompt.priority}
                                  </Badge>
                                  {!prompt.is_active && (
                                    <Badge variant="warning" size="sm">
                                      Inactivo
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                  <p className="text-sm text-gray-700 font-mono line-clamp-3">
                                    {prompt.prompt_template}
                                  </p>
                                </div>

                                {prompt.variables && prompt.variables.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-3">
                                    {prompt.variables.map((variable, index) => (
                                      <Badge key={index} variant="outline" size="xs">
                                        {variable}
                                      </Badge>
                                    ))}
                                  </div>
                                )}

                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>Creado: {new Date(prompt.created_at).toLocaleDateString('es-CL')}</span>
                                  {prompt.updated_at && (
                                    <span>• Actualizado: {new Date(prompt.updated_at).toLocaleDateString('es-CL')}</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 ml-4">
                                {testMode && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleTestPrompt(prompt)}
                                    loading={testingPrompt}
                                    title="Probar prompt"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditPrompt(prompt)}
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeletePrompt(prompt.id)}
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}

                        {promptTemplates.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No hay plantillas de prompt configuradas</p>
                            <p className="text-sm mt-1">Crea tu primera plantilla para personalizar las respuestas de IA</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                  <div className="space-y-6">
                    <Card>
                      <h3 className="text-xl font-bold mb-4">Analytics de IA</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Activity className="w-8 h-8 text-blue-600" />
                            <div>
                              <h4 className="font-semibold text-blue-900">Conversaciones Activas</h4>
                              <p className="text-2xl font-bold text-blue-600">12</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <TrendingUp className="w-8 h-8 text-green-600" />
                            <div>
                              <h4 className="font-semibold text-green-900">Tasa de Éxito</h4>
                              <p className="text-2xl font-bold text-green-600">87%</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <MessageSquare className="w-8 h-8 text-purple-600" />
                            <div>
                              <h4 className="font-semibold text-purple-900">Respuestas IA</h4>
                              <p className="text-2xl font-bold text-purple-600">1,247</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-orange-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Users className="w-8 h-8 text-orange-600" />
                            <div>
                              <h4 className="font-semibold text-orange-900">Escaladas</h4>
                              <p className="text-2xl font-bold text-orange-600">23</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Rendimiento por Cliente</h3>
                      
                      <div className="space-y-4">
                        {corporateClients.slice(0, 5).map((client) => (
                          <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{client.name}</h4>
                                <p className="text-sm text-gray-600">{client.display_category}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-6">
                              <div className="text-center">
                                <p className="text-sm text-gray-600">Conversaciones</p>
                                <p className="font-semibold">{Math.floor(Math.random() * 50) + 10}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-gray-600">Tasa Éxito</p>
                                <p className="font-semibold">{Math.floor(Math.random() * 30) + 70}%</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-gray-600">Tiempo Prom.</p>
                                <p className="font-semibold">{Math.floor(Math.random() * 20) + 5}min</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona un cliente corporativo</h3>
              <p className="text-gray-600">Para comenzar a configurar la IA, selecciona un cliente corporativo del panel izquierdo</p>
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      {/* Modal para agregar documento */}
      <Modal
        isOpen={showAddDocument}
        onClose={() => setShowAddDocument(false)}
        title="Agregar Documento"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título del Documento
            </label>
            <Input
              value={documentForm.title}
              onChange={(e) => setDocumentForm(prev => ({
                ...prev,
                title: e.target.value
              }))}
              placeholder="Ej: Política de descuentos especiales"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contenido
            </label>
            <textarea
              value={documentForm.content}
              onChange={(e) => setDocumentForm(prev => ({
                ...prev,
                content: e.target.value
              }))}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingresa el contenido completo del documento..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <Select
              value={documentForm.category}
              onChange={(e) => setDocumentForm(prev => ({
                ...prev,
                category: e.target.value
              }))}
              options={[
                { value: 'general', label: 'General' },
                { value: 'policy', label: 'Política' },
                { value: 'procedure', label: 'Procedimiento' },
                { value: 'template', label: 'Plantilla' },
                { value: 'faq', label: 'FAQ' }
              ]}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowAddDocument(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddDocument}
              loading={saving}
              disabled={!documentForm.title || !documentForm.content}
            >
              <Save className="w-4 h-4" />
              Agregar Documento
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal para agregar política */}
      <Modal
        isOpen={showAddPolicy}
        onClose={() => setShowAddPolicy(false)}
        title="Agregar Política"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Política
            </label>
            <Select
              value={policyForm.policy_type}
              onChange={(e) => setPolicyForm(prev => ({
                ...prev,
                policy_type: e.target.value
              }))}
              options={[
                { value: 'discount', label: 'Descuento' },
                { value: 'term', label: 'Plazo' },
                { value: 'payment', label: 'Pago' },
                { value: 'escalation', label: 'Escalada' },
                { value: 'general', label: 'General' }
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Política
            </label>
            <Input
              value={policyForm.policy_name}
              onChange={(e) => setPolicyForm(prev => ({
                ...prev,
                policy_name: e.target.value
              }))}
              placeholder="Ej: Descuento máximo para clientes leales"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={policyForm.policy_description}
              onChange={(e) => setPolicyForm(prev => ({
                ...prev,
                policy_description: e.target.value
              }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe en detalle esta política..."
            />
          </div>

          {(policyForm.policy_type === 'discount' || policyForm.policy_type === 'term') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor {policyForm.policy_type === 'discount' ? '(%)' : '(meses)'}
              </label>
              <Input
                type="number"
                min="0"
                max={policyForm.policy_type === 'discount' ? 100 : 60}
                value={policyForm.policy_value}
                onChange={(e) => setPolicyForm(prev => ({
                  ...prev,
                  policy_value: e.target.value
                }))}
                placeholder={policyForm.policy_type === 'discount' ? '15' : '12'}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowAddPolicy(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddPolicy}
              loading={saving}
              disabled={!policyForm.policy_name || !policyForm.policy_description}
            >
              <Save className="w-4 h-4" />
              Agregar Política
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal para agregar respuesta */}
      <Modal
        isOpen={showAddResponse}
        onClose={() => setShowAddResponse(false)}
        title="Agregar Respuesta Personalizada"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Trigger
            </label>
            <Select
              value={responseForm.trigger_type}
              onChange={(e) => setResponseForm(prev => ({
                ...prev,
                trigger_type: e.target.value
              }))}
              options={[
                { value: 'keyword', label: 'Palabra clave' },
                { value: 'phrase', label: 'Frase completa' },
                { value: 'intent', label: 'Intención' },
                { value: 'question', label: 'Pregunta' }
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trigger
            </label>
            <Input
              value={responseForm.trigger_keyword}
              onChange={(e) => setResponseForm(prev => ({
                ...prev,
                trigger_keyword: e.target.value
              }))}
              placeholder={responseForm.trigger_type === 'keyword' ? 'Ej: descuento' : 'Ej: ¿puedo tener un descuento?'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plantilla de Respuesta
            </label>
            <textarea
              value={responseForm.response_template}
              onChange={(e) => setResponseForm(prev => ({
                ...prev,
                response_template: e.target.value
              }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Hola {nombre_deudor}, en base a tu historial con {nombre_empresa}..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Usa {'{nombre_deudor}'} y {'{nombre_empresa}'} como variables
            </p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={responseForm.use_debtor_name}
                onChange={(e) => setResponseForm(prev => ({
                  ...prev,
                  use_debtor_name: e.target.checked
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Usar nombre del deudor
              </span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={responseForm.use_corporate_name}
                onChange={(e) => setResponseForm(prev => ({
                  ...prev,
                  use_corporate_name: e.target.checked
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Usar nombre de la empresa
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowAddResponse(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddResponse}
              loading={saving}
              disabled={!responseForm.trigger_keyword || !responseForm.response_template}
            >
              <Save className="w-4 h-4" />
              Agregar Respuesta
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal para agregar/editar prompt */}
      <Modal
        isOpen={showAddPrompt}
        onClose={() => {
          setShowAddPrompt(false);
          setEditingPrompt(null);
          setPromptForm({
            prompt_type: 'negotiation',
            prompt_name: '',
            prompt_template: '',
            variables: [],
            is_active: true,
            priority: 1
          });
        }}
        title={editingPrompt ? 'Editar Prompt' : 'Agregar Prompt'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Prompt
              </label>
              <Select
                value={promptForm.prompt_type}
                onChange={(e) => setPromptForm(prev => ({
                  ...prev,
                  prompt_type: e.target.value
                }))}
                options={[
                  { value: 'negotiation', label: 'Negociación' },
                  { value: 'welcome', label: 'Bienvenida' },
                  { value: 'escalation', label: 'Escalada' },
                  { value: 'closing', label: 'Cierre' },
                  { value: 'general', label: 'General' }
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridad
              </label>
              <Input
                type="number"
                min="1"
                max="10"
                value={promptForm.priority}
                onChange={(e) => setPromptForm(prev => ({
                  ...prev,
                  priority: parseInt(e.target.value) || 1
                }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Prompt
            </label>
            <Input
              value={promptForm.prompt_name}
              onChange={(e) => setPromptForm(prev => ({
                ...prev,
                prompt_name: e.target.value
              }))}
              placeholder="Ej: Respuesta inicial de negociación"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plantilla del Prompt
            </label>
            <textarea
              value={promptForm.prompt_template}
              onChange={(e) => setPromptForm(prev => ({
                ...prev,
                prompt_template: e.target.value
              }))}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              placeholder="Eres un asistente de negociación para {nombre_empresa}...
El deudor {nombre_deudor} ({rut_deudor}) tiene una deuda de {monto_deuda}..."
            />
          </div>

          {/* Variables disponibles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Variables Disponibles
            </label>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-2 mb-3">
                {availableVariables.map((variable, index) => (
                  <button
                    key={index}
                    onClick={() => addVariableToTemplate(variable)}
                    className="text-left text-xs bg-white border border-gray-200 rounded px-2 py-1 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    title={variable.description}
                  >
                    <span className="font-mono text-blue-600">{variable.key}</span>
                    <span className="text-gray-500 ml-1">- {variable.description}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Haz clic en una variable para agregarla a la plantilla
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={promptForm.is_active}
              onChange={(e) => setPromptForm(prev => ({
                ...prev,
                is_active: e.target.checked
              }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Prompt activo
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setShowAddPrompt(false);
                setEditingPrompt(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSavePrompt}
              loading={saving}
              disabled={!promptForm.prompt_name || !promptForm.prompt_template}
            >
              <Save className="w-4 h-4" />
              {editingPrompt ? 'Actualizar' : 'Crear'} Prompt
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AIDashboardPage;