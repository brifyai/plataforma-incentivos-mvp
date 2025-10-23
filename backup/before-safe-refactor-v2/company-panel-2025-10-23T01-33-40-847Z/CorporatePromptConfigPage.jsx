/**
 * Página de Configuración de Prompts por Cliente Corporativo
 * 
 * Permite a las empresas configurar prompts personalizados para la IA
 * específicamente para cada cliente corporativo
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, LoadingSpinner, Input, Select, Badge, Modal, ToggleSwitch } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { 
  Brain, 
  MessageSquare, 
  Settings, 
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
  FileText
} from 'lucide-react';
import Swal from 'sweetalert2';

const CorporatePromptConfigPage = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [corporateClients, setCorporateClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [promptTemplates, setPromptTemplates] = useState([]);
  const [showAddPrompt, setShowAddPrompt] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [testMode, setTestMode] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testingPrompt, setTestingPrompt] = useState(false);

  // Formulario de prompt
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

  useEffect(() => {
    loadCorporateClients();
  }, [profile]);

  useEffect(() => {
    if (selectedClient) {
      loadPromptTemplates(selectedClient.id);
    }
  }, [selectedClient]);

  const loadCorporateClients = async () => {
    try {
      const { data, error } = await supabase
        .from('corporate_clients')
        .select('*')
        .eq('company_id', profile?.company?.id)
        .order('business_name');

      if (error) throw error;
      setCorporateClients(data || []);
      
      if (data && data.length > 0) {
        setSelectedClient(data[0]);
      }
    } catch (error) {
      console.error('Error loading corporate clients:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los clientes corporativos'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPromptTemplates = async (corporateClientId) => {
    try {
      setLoading(true);

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
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las plantillas de prompts'
      });
    } finally {
      setLoading(false);
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

      // Importar el servicio de IA dinámicamente
      const { aiService } = await import('../../services/aiService.js');
      
      // Preparar el contexto para la prueba
      const context = {
        debtorName: 'Juan Pérez',
        debtorRut: '12.345.678-9',
        corporateName: selectedClient.business_name,
        corporateRut: selectedClient.rut,
        debtAmount: 100000,
        daysOverdue: 45,
        debtType: 'Factura',
        dueDate: '2024-01-15',
        maxDiscount: 15,
        maxTerm: 12,
        paymentHistory: [],
        riskLevel: 'medium'
      };

      // Reemplazar variables en el prompt
      let processedPrompt = prompt.prompt_template;
      
      // Mapeo directo de variables del contexto a las variables del prompt
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

      // Ejecutar el prompt con el servicio de IA
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

  const handleDuplicatePrompt = async (prompt) => {
    try {
      const duplicatedPrompt = {
        ...prompt,
        prompt_name: `${prompt.prompt_name} (Copia)`,
        id: undefined
      };

      const { error } = await supabase
        .from('corporate_prompt_templates')
        .insert(duplicatedPrompt);

      if (error) throw error;

      await loadPromptTemplates(selectedClient.id);

      Swal.fire({
        icon: 'success',
        title: 'Prompt duplicado',
        text: 'La plantilla de prompt se ha duplicado correctamente'
      });
    } catch (error) {
      console.error('Error duplicating prompt:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo duplicar la plantilla de prompt'
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

  if (loading && !promptTemplates.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración de Prompts</h1>
          <p className="text-gray-600">Personaliza los prompts de IA por cliente corporativo</p>
        </div>
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-purple-600" />
        </div>
      </div>

      {/* Selector de Cliente Corporativo */}
      <Card>
        <div className="flex items-center gap-4">
          <Users className="w-5 h-5 text-gray-600" />
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente Corporativo
            </label>
            <Select
              value={selectedClient?.id || ''}
              onChange={(e) => {
                const client = corporateClients.find(c => c.id === e.target.value);
                setSelectedClient(client);
              }}
              options={corporateClients.map(client => ({
                value: client.id,
                label: `${client.business_name} (${client.rut})`
              }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <ToggleSwitch
              checked={testMode}
              onChange={setTestMode}
              label="Modo prueba"
            />
          </div>
        </div>
      </Card>

      {selectedClient && (
        <>
          {/* Panel de prueba */}
          {testMode && (
            <Card variant="elevated">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  Modo de Prueba
                </h3>
                
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
            </Card>
          )}

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
                        onClick={() => handleDuplicatePrompt(prompt)}
                        title="Duplicar"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
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
        </>
      )}

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

export default CorporatePromptConfigPage;