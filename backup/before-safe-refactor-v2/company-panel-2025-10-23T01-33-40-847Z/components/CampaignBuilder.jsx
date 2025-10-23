/**
 * Campaign Builder Component - Constructor Visual de Campañas Jerárquicas
 *
 * Permite construir campañas visualmente con filtros jerárquicos,
 * preview de alcance y estimaciones de conversión
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal, Input, Select } from '../../../components/common';
import { hierarchicalFilterEngine } from '../../../services/hierarchicalFilterEngine';
import { aiService } from '../../../services/aiService';
import {
  Target,
  Users,
  Filter,
  Eye,
  Zap,
  TrendingUp,
  BarChart3,
  Settings,
  Plus,
  Minus,
  CheckCircle,
  AlertTriangle,
  Info,
  Loader
} from 'lucide-react';

const CampaignBuilder = ({ onCampaignCreate, companyId }) => {
  const [builderState, setBuilderState] = useState({
    // Paso 1: Configuración básica
    name: '',
    description: '',
    campaignType: 'mass_offers',

    // Paso 2: Filtros jerárquicos
    filters: {
      corporateClients: [],
      corporateSegments: [],
      riskLevels: [],
      debtAmountRange: { min: '', max: '' },
      debtAgeRange: { min: '', max: '' },
      excludeCorporate: false
    },

    // Paso 3: Oferta y configuración
    offer: {
      discountPercentage: 15,
      paymentPlan: 'monthly_6',
      validityDays: 30,
      specialConditions: ''
    },

    // Paso 4: IA y optimización
    aiConfig: {
      enabled: true,
      segmentation: true,
      personalization: true,
      optimization: true,
      abTesting: false
    }
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [hierarchy, setHierarchy] = useState(null);
  const [reachPreview, setReachPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [creating, setCreating] = useState(false);

  // Cargar jerarquía al montar
  useEffect(() => {
    loadHierarchy();
  }, [companyId]);

  const loadHierarchy = async () => {
    try {
      const hierarchyData = await hierarchicalFilterEngine.getCompleteHierarchy(companyId);
      setHierarchy(hierarchyData);
    } catch (error) {
      console.error('Error loading hierarchy:', error);
    }
  };

  // Calcular preview de alcance cuando cambian los filtros
  useEffect(() => {
    if (currentStep >= 2) {
      calculateReachPreview();
    }
  }, [builderState.filters, currentStep]);

  const calculateReachPreview = async () => {
    if (!hierarchy) return;

    setLoadingPreview(true);
    try {
      const preview = await hierarchicalFilterEngine.calculateReachPreview(companyId, builderState.filters);
      setReachPreview(preview);

      // Generar insights de IA si está habilitado
      if (builderState.aiConfig.enabled) {
        generateAIInsights(preview);
      }
    } catch (error) {
      console.error('Error calculating reach preview:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  const generateAIInsights = async (preview) => {
    setLoadingAI(true);
    try {
      const insights = await aiService.executeTask('predictive_analytics', {
        prompt: `Analiza esta campaña potencial y proporciona insights predictivos:

Campaña: ${builderState.name}
Tipo: ${builderState.campaignType}
Alcance estimado: ${preview.totalDebtors} deudores
Filtros aplicados: ${JSON.stringify(builderState.filters)}
Oferta: ${builderState.offer.discountPercentage}% descuento

Proporciona insights sobre:
1. Tasa de conversión esperada
2. Segmentos más prometedores
3. Recomendaciones de optimización
4. Riesgos potenciales

Responde en JSON con estructura clara.`
      });

      const parsedInsights = JSON.parse(insights.response || '{}');
      setAiInsights(parsedInsights);
    } catch (error) {
      console.error('Error generating AI insights:', error);
      setAiInsights({
        predictedConversionRate: 0.15,
        recommendations: ['Habilita segmentación automática para mejores resultados'],
        riskLevel: 'medium'
      });
    } finally {
      setLoadingAI(false);
    }
  };

  const updateFilters = (filterType, value) => {
    setBuilderState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [filterType]: value
      }
    }));
  };

  const toggleCorporateClient = (clientId) => {
    const current = builderState.filters.corporateClients;
    const updated = current.includes(clientId)
      ? current.filter(id => id !== clientId)
      : [...current, clientId];

    updateFilters('corporateClients', updated);
  };

  const toggleRiskLevel = (riskLevel) => {
    const current = builderState.filters.riskLevels;
    const updated = current.includes(riskLevel)
      ? current.filter(level => level !== riskLevel)
      : [...current, riskLevel];

    updateFilters('riskLevels', updated);
  };

  const handleCreateCampaign = async () => {
    setCreating(true);
    try {
      const campaignData = {
        ...builderState,
        estimatedReach: reachPreview?.totalDebtors || 0,
        aiInsights: aiInsights
      };

      await onCampaignCreate(campaignData);
    } catch (error) {
      console.error('Error creating campaign:', error);
    } finally {
      setCreating(false);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return builderState.name.trim() && builderState.description.trim();
      case 2:
        return true; // Los filtros son opcionales
      case 3:
        return builderState.offer.discountPercentage > 0;
      case 4:
        return true; // Configuración IA es opcional
      default:
        return false;
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map(step => (
        <div key={step} className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
            step <= currentStep
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 text-gray-500'
          }`}>
            {step}
          </div>
          {step < 4 && (
            <div className={`w-12 h-1 mx-2 transition-all ${
              step < currentStep ? 'bg-primary-500' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="p-6 bg-gradient-to-br from-primary-100 to-primary-200 rounded-3xl inline-block mb-6">
          <Target className="w-16 h-16 text-primary-600" />
        </div>
        <h3 className="text-2xl font-display font-bold text-secondary-900 mb-2">
          Información Básica
        </h3>
        <p className="text-secondary-600">
          Define los fundamentos de tu campaña inteligente
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-secondary-900 mb-2">
            Nombre de la Campaña *
          </label>
          <Input
            placeholder="Ej: Campaña Descuentos Especiales Q4"
            value={builderState.name}
            onChange={(e) => setBuilderState(prev => ({ ...prev, name: e.target.value }))}
            className="text-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-secondary-900 mb-2">
            Descripción
          </label>
          <textarea
            className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-lg resize-none"
            rows={3}
            placeholder="Describe el objetivo y alcance de esta campaña..."
            value={builderState.description}
            onChange={(e) => setBuilderState(prev => ({ ...prev, description: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-secondary-900 mb-2">
            Tipo de Campaña
          </label>
          <Select
            value={builderState.campaignType}
            onChange={(value) => setBuilderState(prev => ({ ...prev, campaignType: value }))}
            options={[
              { value: 'mass_offers', label: 'Ofertas Masivas' },
              { value: 'segmented', label: 'Segmentadas' },
              { value: 'personalized', label: 'Personalizadas' },
              { value: 'ab_test', label: 'A/B Testing' }
            ]}
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="p-6 bg-gradient-to-br from-success-100 to-success-200 rounded-3xl inline-block mb-6">
          <Filter className="w-16 h-16 text-success-600" />
        </div>
        <h3 className="text-2xl font-display font-bold text-secondary-900 mb-2">
          Filtros Jerárquicos
        </h3>
        <p className="text-secondary-600">
          Selecciona el alcance de tu campaña usando filtros inteligentes
        </p>
      </div>

      {/* Vista previa de alcance */}
      {reachPreview && (
        <Card className="border-2 border-info-200 bg-gradient-to-r from-info-50 to-info-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-info-100 rounded-xl">
              <BarChart3 className="w-6 h-6 text-info-600" />
            </div>
            <div>
              <h4 className="font-bold text-info-900">Vista Previa de Alcance</h4>
              <p className="text-sm text-info-700">Estimación basada en filtros aplicados</p>
            </div>
          </div>

          {loadingPreview ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-8 h-8 animate-spin text-info-600" />
              <span className="ml-3 text-info-700">Calculando alcance...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-info-600">{reachPreview.totalDebtors}</div>
                <div className="text-sm text-info-700">Deudores objetivo</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-success-600">
                  ${Math.round((reachPreview.estimatedCost || 0) * 100) / 100}
                </div>
                <div className="text-sm text-success-700">Costo estimado</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-warning-600">
                  {reachPreview.aiUsage || 0}
                </div>
                <div className="text-sm text-warning-700">Tokens IA</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {Math.round((aiInsights?.predictedConversionRate || 0.15) * 100)}%
                </div>
                <div className="text-sm text-blue-700">Conversión estimada</div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Filtros jerárquicos */}
      <div className="space-y-6">
        {/* Clientes Corporativos */}
        <Card className="border-2 border-primary-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <h4 className="font-bold text-primary-900">Clientes Corporativos</h4>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={builderState.filters.excludeCorporate}
                onChange={(e) => updateFilters('excludeCorporate', e.target.checked)}
                className="w-4 h-4 text-primary-600"
              />
              <span className="text-sm font-medium">Solo deudores individuales (excluir corporativos)</span>
            </label>

            {!builderState.filters.excludeCorporate && hierarchy?.corporateClients?.map(client => (
              <label key={client.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={builderState.filters.corporateClients.includes(client.id)}
                  onChange={() => toggleCorporateClient(client.id)}
                  className="w-4 h-4 text-primary-600"
                />
                <div className="flex-1">
                  <span className="font-medium text-gray-900">{client.name}</span>
                  <div className="text-sm text-gray-600">
                    {client.segment_count || 0} segmentos • {client.trust_level} confianza
                  </div>
                </div>
                <Badge variant="outline">{client.display_category}</Badge>
              </label>
            ))}
          </div>
        </Card>

        {/* Niveles de Riesgo */}
        <Card className="border-2 border-warning-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-warning-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-warning-600" />
            </div>
            <h4 className="font-bold text-warning-900">Niveles de Riesgo</h4>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {['low', 'medium', 'high'].map(risk => (
              <label key={risk} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={builderState.filters.riskLevels.includes(risk)}
                  onChange={() => toggleRiskLevel(risk)}
                  className="w-4 h-4 text-warning-600"
                />
                <span className="text-sm font-medium capitalize">
                  {risk === 'low' ? 'Bajo' : risk === 'medium' ? 'Medio' : 'Alto'} Riesgo
                </span>
              </label>
            ))}
          </div>
        </Card>

        {/* Rangos de Deuda */}
        <Card className="border-2 border-danger-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-danger-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-danger-600" />
            </div>
            <h4 className="font-bold text-danger-900">Rangos de Deuda</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto de deuda (CLP)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Mínimo"
                  value={builderState.filters.debtAmountRange.min}
                  onChange={(e) => updateFilters('debtAmountRange', {
                    ...builderState.filters.debtAmountRange,
                    min: e.target.value
                  })}
                />
                <Input
                  type="number"
                  placeholder="Máximo"
                  value={builderState.filters.debtAmountRange.max}
                  onChange={(e) => updateFilters('debtAmountRange', {
                    ...builderState.filters.debtAmountRange,
                    max: e.target.value
                  })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Antigüedad (días)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Mínimo"
                  value={builderState.filters.debtAgeRange.min}
                  onChange={(e) => updateFilters('debtAgeRange', {
                    ...builderState.filters.debtAgeRange,
                    min: e.target.value
                  })}
                />
                <Input
                  type="number"
                  placeholder="Máximo"
                  value={builderState.filters.debtAgeRange.max}
                  onChange={(e) => updateFilters('debtAgeRange', {
                    ...builderState.filters.debtAgeRange,
                    max: e.target.value
                  })}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="p-6 bg-gradient-to-br from-warning-100 to-warning-200 rounded-3xl inline-block mb-6">
          <Settings className="w-16 h-16 text-warning-600" />
        </div>
        <h3 className="text-2xl font-display font-bold text-secondary-900 mb-2">
          Configuración de Oferta
        </h3>
        <p className="text-secondary-600">
          Define los términos de la oferta que recibirán los deudores
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 border-warning-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-secondary-900 mb-2">
                Porcentaje de Descuento
              </label>
              <Input
                type="number"
                min="0"
                max="50"
                value={builderState.offer.discountPercentage}
                onChange={(e) => setBuilderState(prev => ({
                  ...prev,
                  offer: { ...prev.offer, discountPercentage: parseInt(e.target.value) || 0 }
                }))}
                className="text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-secondary-900 mb-2">
                Plan de Pago
              </label>
              <Select
                value={builderState.offer.paymentPlan}
                onChange={(value) => setBuilderState(prev => ({
                  ...prev,
                  offer: { ...prev.offer, paymentPlan: value }
                }))}
                options={[
                  { value: 'lump_sum', label: 'Pago único' },
                  { value: 'monthly_3', label: '3 cuotas mensuales' },
                  { value: 'monthly_6', label: '6 cuotas mensuales' },
                  { value: 'monthly_12', label: '12 cuotas mensuales' }
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-secondary-900 mb-2">
                Días de Validez
              </label>
              <Input
                type="number"
                min="1"
                max="90"
                value={builderState.offer.validityDays}
                onChange={(e) => setBuilderState(prev => ({
                  ...prev,
                  offer: { ...prev.offer, validityDays: parseInt(e.target.value) || 30 }
                }))}
              />
            </div>
          </div>
        </Card>

        <Card className="border-2 border-info-200">
          <div>
            <label className="block text-sm font-bold text-secondary-900 mb-2">
              Condiciones Especiales
            </label>
            <textarea
              className="w-full px-4 py-3 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-info-500 focus:border-info-500 bg-white resize-none"
              rows={6}
              placeholder="Condiciones adicionales, descuentos por pronto pago, etc..."
              value={builderState.offer.specialConditions}
              onChange={(e) => setBuilderState(prev => ({
                ...prev,
                offer: { ...prev.offer, specialConditions: e.target.value }
              }))}
            />
          </div>
        </Card>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="p-6 bg-gradient-to-br from-info-100 to-info-200 rounded-3xl inline-block mb-6">
          <Zap className="w-16 h-16 text-info-600" />
        </div>
        <h3 className="text-2xl font-display font-bold text-secondary-900 mb-2">
          Inteligencia Artificial
        </h3>
        <p className="text-secondary-600">
          Configura las capacidades de IA para optimizar tu campaña
        </p>
      </div>

      {/* Insights de IA */}
      {aiInsights && (
        <Card className="border-2 border-info-200 bg-gradient-to-r from-info-50 to-info-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-info-100 rounded-xl">
              <Zap className="w-6 h-6 text-info-600" />
            </div>
            <div>
              <h4 className="font-bold text-info-900">Insights Predictivos de IA</h4>
              <p className="text-sm text-info-700">Análisis automático de tu campaña</p>
            </div>
          </div>

          {loadingAI ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-8 h-8 animate-spin text-info-600" />
              <span className="ml-3 text-info-700">Generando insights...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-info-600">
                  {Math.round((aiInsights.predictedConversionRate || 0) * 100)}%
                </div>
                <div className="text-sm text-info-700">Conversión esperada</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-success-600">
                  {aiInsights.recommendations?.length || 0}
                </div>
                <div className="text-sm text-success-700">Recomendaciones</div>
              </div>
              <div className="text-center">
                <Badge variant={aiInsights.riskLevel === 'low' ? 'success' : aiInsights.riskLevel === 'medium' ? 'warning' : 'danger'}>
                  {aiInsights.riskLevel === 'low' ? 'Bajo' : aiInsights.riskLevel === 'medium' ? 'Medio' : 'Alto'} Riesgo
                </Badge>
                <div className="text-sm text-gray-600 mt-1">Nivel de riesgo</div>
              </div>
            </div>
          )}
        </Card>
      )}

      <Card className="border-2 border-info-200">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-info-900">Habilitar IA en esta campaña</h4>
              <p className="text-sm text-info-700">La IA optimizará automáticamente tu campaña</p>
            </div>
            <input
              type="checkbox"
              checked={builderState.aiConfig.enabled}
              onChange={(e) => setBuilderState(prev => ({
                ...prev,
                aiConfig: { ...prev.aiConfig, enabled: e.target.checked }
              }))}
              className="w-6 h-6 text-info-600"
            />
          </div>

          {builderState.aiConfig.enabled && (
            <div className="space-y-4 pl-6 border-l-2 border-info-200">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={builderState.aiConfig.segmentation}
                  onChange={(e) => setBuilderState(prev => ({
                    ...prev,
                    aiConfig: { ...prev.aiConfig, segmentation: e.target.checked }
                  }))}
                  className="w-4 h-4 text-info-600"
                />
                <div>
                  <span className="font-medium text-gray-900">Segmentación automática</span>
                  <p className="text-sm text-gray-600">Clasifica deudores por riesgo y comportamiento</p>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={builderState.aiConfig.personalization}
                  onChange={(e) => setBuilderState(prev => ({
                    ...prev,
                    aiConfig: { ...prev.aiConfig, personalization: e.target.checked }
                  }))}
                  className="w-4 h-4 text-info-600"
                />
                <div>
                  <span className="font-medium text-gray-900">Personalización individual</span>
                  <p className="text-sm text-gray-600">Adapta ofertas según perfil de cada deudor</p>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={builderState.aiConfig.optimization}
                  onChange={(e) => setBuilderState(prev => ({
                    ...prev,
                    aiConfig: { ...prev.aiConfig, optimization: e.target.checked }
                  }))}
                  className="w-4 h-4 text-info-600"
                />
                <div>
                  <span className="font-medium text-gray-900">Optimización en tiempo real</span>
                  <p className="text-sm text-gray-600">Ajusta campaña basado en resultados</p>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={builderState.aiConfig.abTesting}
                  onChange={(e) => setBuilderState(prev => ({
                    ...prev,
                    aiConfig: { ...prev.aiConfig, abTesting: e.target.checked }
                  }))}
                  className="w-4 h-4 text-info-600"
                />
                <div>
                  <span className="font-medium text-gray-900">A/B Testing automático</span>
                  <p className="text-sm text-gray-600">Prueba diferentes ofertas automáticamente</p>
                </div>
              </label>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return renderStep1();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {renderStepIndicator()}

      <Card className="mb-6">
        {renderCurrentStep()}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
          leftIcon={<Minus className="w-4 h-4" />}
        >
          Anterior
        </Button>

        {currentStep < 4 ? (
          <Button
            variant="gradient"
            onClick={() => setCurrentStep(prev => Math.min(4, prev + 1))}
            disabled={!canProceedToNext()}
            rightIcon={<Plus className="w-4 h-4" />}
          >
            Siguiente
          </Button>
        ) : (
          <Button
            variant="gradient"
            onClick={handleCreateCampaign}
            loading={creating}
            rightIcon={<CheckCircle className="w-4 h-4" />}
          >
            {creating ? 'Creando Campaña...' : 'Crear Campaña Inteligente'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default CampaignBuilder;