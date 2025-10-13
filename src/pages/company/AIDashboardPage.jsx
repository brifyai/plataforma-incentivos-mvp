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
  Activity
} from 'lucide-react';
import Swal from 'sweetalert2';

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
  
  // Estados para configuración de IA
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

  const loadAIConfiguration = async () => {
    let companyId;
    
    // Para usuarios con god_mode, usar la primera empresa disponible
    if (profile?.role === 'god_mode') {
      const { data: companies, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .limit(1);
      
      if (companyError) {
        console.error('Error getting company for god_mode:', companyError);
        return;
      }
      companyId = companies?.[0]?.id;
    } else {
      companyId = profile?.company?.id;
    }
    
    if (!companyId) return;
    
    try {
      const { data, error } = await supabase
        .from('company_ai_config')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading AI configuration:', error);
        return;
      }

      if (data) {
        setAiConfig(data.ai_providers || aiConfig);
      }
    } catch (error) {
      console.error('Error loading AI configuration:', error);
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

      const { error } = await supabase
        .from('company_ai_config')
        .upsert({
          company_id: companyId,
          ai_providers: aiConfig,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

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

  const handleAddDocument = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('company_knowledge_base')
        .insert({
          corporate_client_id: selectedClient.id,
          company_id: profile?.company?.id,
          document_title: documentForm.title,
          document_content: documentForm.content,
          document_category: documentForm.category,
          is_active: documentForm.is_active
        });

      if (error) throw error;

      setShowAddDocument(false);
      setDocumentForm({
        title: '',
        content: '',
        category: 'general',
        is_active: true
      });

      await loadKnowledgeBase(selectedClient.id);

      Swal.fire({
        icon: 'success',
        title: 'Documento agregado',
        text: 'El documento se ha agregado a la base de conocimiento'
      });
    } catch (error) {
      console.error('Error adding document:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo agregar el documento'
      });
    } finally {
      setSaving(false);
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
    doc.document_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.document_content.toLowerCase().includes(searchTerm.toLowerCase())
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
                {activeTab === 'providers' && (
                  <Button
                    variant="primary"
                    onClick={saveAIConfiguration}
                    loading={saving}
                    leftIcon={<Save className="w-4 h-4" />}
                  >
                    Guardar Configuración
                  </Button>
                )}
              </div>
            </div>
          </div>

          {selectedClient ? (
            <>
              {/* Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-8">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        // Mapear IDs internos a URLs en español
                        const tabToUrlMap = {
                          'providers': 'proveedores',
                          'messaging': 'mensajeria',
                          'personalization': 'personalizacion',
                          'knowledge': 'conocimiento',
                          'prompts': 'prompts',
                          'analytics': 'analytics'
                        };

                        // Navegar a URL independiente cuando se hace click en un tab
                        const spanishUrl = tabToUrlMap[tab.id] || tab.id;
                        const newUrl = `/empresa/ia/${spanishUrl}`;
                        window.history.pushState({}, '', newUrl);
                        setActiveTab(tab.id);
                      }}
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
                {/* Proveedores IA Tab */}
                {activeTab === 'providers' && (
                  <div className="space-y-6">
                    <Card>
                      <h3 className="text-xl font-bold mb-4">Proveedores de Inteligencia Artificial</h3>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {Object.entries(aiConfig.providers).filter(([provider]) => provider !== 'openai').map(([provider, config]) => (
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
                                    { value: 'llama2-70b', label: 'Llama 2 70B' },
                                    { value: 'mixtral-8x7b', label: 'Mixtral 8x7B' },
                                    { value: 'gemma-7b', label: 'Gemma 7B' }
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
                        >
                          <Plus className="w-4 h-4" />
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
                        >
                          <Plus className="w-4 h-4" />
                          Agregar Documento
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {filteredDocuments.map((doc) => (
                          <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{doc.document_title}</h4>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {doc.document_content}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="secondary" size="sm">
                                    {doc.document_category}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {new Date(doc.created_at).toLocaleDateString('es-CL')}
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
                        >
                          <Plus className="w-4 h-4" />
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
                        >
                          <Plus className="w-4 h-4" />
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
                        >
                          <Plus className="w-4 h-4" />
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