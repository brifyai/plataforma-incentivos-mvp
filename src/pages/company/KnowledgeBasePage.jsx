/**
 * Página de Configuración de Base de Conocimiento
 * 
 * Permite a las empresas configurar la base de conocimiento específica
 * por cliente corporativo para personalizar las respuestas de la IA
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, LoadingSpinner, Input, Select, Badge, Modal } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { 
  Database, 
  Upload, 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Brain,
  Settings,
  Users,
  Search,
  Filter
} from 'lucide-react';
import Swal from 'sweetalert2';

const KnowledgeBasePage = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [corporateClients, setCorporateClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [knowledgeBase, setKnowledgeBase] = useState(null);
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [showAddResponse, setShowAddResponse] = useState(false);
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

  useEffect(() => {
    loadCorporateClients();
  }, [profile]);

  useEffect(() => {
    if (selectedClient) {
      loadKnowledgeBase(selectedClient.id);
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

  const loadKnowledgeBase = async (corporateClientId) => {
    try {
      setLoading(true);

      // Cargar documentos de base de conocimiento
      const { data: documents, error: docsError } = await supabase
        .from('company_knowledge_base')
        .select('*')
        .eq('corporate_client_id', corporateClientId)
        .eq('is_active', true);

      if (docsError) throw docsError;

      // Cargar políticas
      const { data: policies, error: policiesError } = await supabase
        .from('corporate_client_policies')
        .select('*')
        .eq('corporate_client_id', corporateClientId)
        .eq('is_active', true);

      if (policiesError) throw policiesError;

      // Cargar respuestas personalizadas
      const { data: responses, error: responsesError } = await supabase
        .from('corporate_client_responses')
        .select('*')
        .eq('corporate_client_id', corporateClientId)
        .eq('is_active', true);

      if (responsesError) throw responsesError;

      // Cargar configuración de IA
      const { data: aiConfig, error: configError } = await supabase
        .from('negotiation_ai_config')
        .select('*')
        .eq('corporate_client_id', corporateClientId)
        .single();

      setKnowledgeBase({
        documents: documents || [],
        policies: policies || [],
        responses: responses || [],
        aiConfig: aiConfig || {
          max_negotiation_discount: 15,
          max_negotiation_term: 12,
          auto_respond: true,
          working_hours: { start: '09:00', end: '18:00' }
        }
      });
    } catch (error) {
      console.error('Error loading knowledge base:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar la base de conocimiento'
      });
    } finally {
      setLoading(false);
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

  const handleUpdateAIConfig = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('negotiation_ai_config')
        .upsert({
          corporate_client_id: selectedClient.id,
          company_id: profile?.company?.id,
          max_negotiation_discount: knowledgeBase.aiConfig.max_negotiation_discount,
          max_negotiation_term: knowledgeBase.aiConfig.max_negotiation_term,
          auto_respond: knowledgeBase.aiConfig.auto_respond,
          working_hours: knowledgeBase.aiConfig.working_hours
        });

      if (error) throw error;

      Swal.fire({
        icon: 'success',
        title: 'Configuración actualizada',
        text: 'La configuración de IA se ha actualizado correctamente'
      });
    } catch (error) {
      console.error('Error updating AI config:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar la configuración de IA'
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredDocuments = knowledgeBase?.documents?.filter(doc => 
    doc.document_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.document_content.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredPolicies = knowledgeBase?.policies?.filter(policy => 
    policy.policy_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    policy.policy_description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredResponses = knowledgeBase?.responses?.filter(response => 
    response.trigger_keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
    response.response_template.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading && !knowledgeBase) {
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
          <h1 className="text-2xl font-bold text-gray-900">Base de Conocimiento</h1>
          <p className="text-gray-600">Configura la información específica por cliente corporativo</p>
        </div>
        <div className="flex items-center gap-3">
          <Database className="w-8 h-8 text-blue-600" />
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
        </div>
      </Card>

      {selectedClient && knowledgeBase && (
        <>
          {/* Configuración de IA */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Configuración de IA</h3>
              </div>
              <Button
                onClick={handleUpdateAIConfig}
                loading={saving}
                size="sm"
                variant="primary"
              >
                <Save className="w-4 h-4" />
                Guardar Configuración
              </Button>
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

            <div className="mt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={knowledgeBase.aiConfig.auto_respond}
                  onChange={(e) => setKnowledgeBase(prev => ({
                    ...prev,
                    aiConfig: {
                      ...prev.aiConfig,
                      auto_respond: e.target.checked
                    }
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Respuesta automática activada
                </span>
              </label>
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

          {/* Documentos de Base de Conocimiento */}
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

          {/* Políticas del Cliente */}
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

          {/* Respuestas Personalizadas */}
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
        </>
      )}

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
    </div>
  );
};

export default KnowledgeBasePage;