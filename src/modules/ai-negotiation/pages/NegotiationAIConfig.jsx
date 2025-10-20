import React, { useState, useEffect } from 'react';
import { Card, Button, Input, ToggleSwitch } from '../../../components/common';

/**
 * Página de Configuración de IA para Negociación
 * 
 * Componente seguro para configurar límites y parámetros de IA
 */
const NegotiationAIConfig = () => {
  const [config, setConfig] = useState({
    // Límites de autoridad
    maxAdditionalDiscount: 15,
    maxTermMonths: 12,
    
    // Respuestas automáticas
    keywordResponses: {
      'descuento': 'Puedo ofrecer hasta un 15% adicional de descuento sobre la propuesta original. ¿Le gustaría que calculemos una nueva cuota con este descuento?',
      'cuotas': 'Tenemos opciones de pago en 3, 6, 9 o 12 cuotas. ¿Cuál prefiere para ajustarse a su presupuesto?',
      'tiempo': 'El plazo máximo de financiamiento es de 12 meses. ¿En cuántos meses le gustaría pagar su deuda?',
      'hablar persona': 'Entiendo que prefiere hablar con una persona. Lo transferiré inmediatamente con un representante humano.'
    },
    
    // Umbrales de escalada
    escalationThresholds: {
      discountRequested: 20,
      timeRequested: 18,
      conversationLength: 15,
      frustrationLevel: 0.7
    },
    
    // Configuración general
    autoActivate: true,
    workingHours: {
      start: '09:00',
      end: '18:00'
    },
    timezone: 'America/Santiago',
    
    // Métricas y límites
    maxDailyNegotiations: 100,
    responseDelaySeconds: 3
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('limits');

  useEffect(() => {
    // Cargar configuración existente
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    setLoading(true);
    try {
      // Aquí iría la lógica real de carga desde la base de datos
      // Por ahora, usamos los valores por defecto
    } catch (error) {
      console.error('Error loading configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    setSaving(true);
    try {
      // Aquí iría la lógica real de guardado
      console.log('Saving configuration:', config);
      
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const updateKeywordResponse = (keyword, response) => {
    setConfig(prev => ({
      ...prev,
      keywordResponses: {
        ...prev.keywordResponses,
        [keyword]: response
      }
    }));
  };

  const updateEscalationThreshold = (threshold, value) => {
    setConfig(prev => ({
      ...prev,
      escalationThresholds: {
        ...prev.escalationThresholds,
        [threshold]: parseFloat(value)
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuración de IA para Negociación</h2>
          <p className="text-gray-600 mt-1">Configure los límites y parámetros del sistema de IA conversacional</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={loadConfiguration}>
            Descartar Cambios
          </Button>
          <Button onClick={saveConfiguration} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'limits', label: 'Límites de Autoridad' },
            { id: 'responses', label: 'Respuestas Automáticas' },
            { id: 'escalation', label: 'Escalada Automática' },
            { id: 'general', label: 'Configuración General' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'limits' && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Límites de Autoridad de IA</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="Máximo descuento adicional (%)"
                    type="number"
                    min="0"
                    max="50"
                    value={config.maxAdditionalDiscount}
                    onChange={(value) => setConfig(prev => ({ ...prev, maxAdditionalDiscount: parseInt(value) }))}
                    helperText="Porcentaje máximo de descuento adicional que la IA puede ofrecer"
                  />
                </div>
                
                <div>
                  <Input
                    label="Máximo plazo (meses)"
                    type="number"
                    min="1"
                    max="36"
                    value={config.maxTermMonths}
                    onChange={(value) => setConfig(prev => ({ ...prev, maxTermMonths: parseInt(value) }))}
                    helperText="Plazo máximo en meses que la IA puede ofrecer"
                  />
                </div>
                
                <div>
                  <Input
                    label="Negociaciones diarias máximas"
                    type="number"
                    min="1"
                    max="1000"
                    value={config.maxDailyNegotiations}
                    onChange={(value) => setConfig(prev => ({ ...prev, maxDailyNegotiations: parseInt(value) }))}
                    helperText="Límite diario de negociaciones simultáneas"
                  />
                </div>
                
                <div>
                  <Input
                    label="Tiempo de respuesta (segundos)"
                    type="number"
                    min="1"
                    max="30"
                    value={config.responseDelaySeconds}
                    onChange={(value) => setConfig(prev => ({ ...prev, responseDelaySeconds: parseInt(value) }))}
                    helperText="Tiempo máximo para que la IA responda"
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'responses' && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Respuestas Automáticas por Palabras Clave</h3>
              
              <div className="space-y-4">
                {Object.entries(config.keywordResponses).map(([keyword, response]) => (
                  <div key={keyword} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Palabra clave: <span className="text-blue-600">"{keyword}"</span>
                    </label>
                    <textarea
                      value={response}
                      onChange={(e) => updateKeywordResponse(keyword, e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Respuesta automática cuando se detecte esta palabra clave"
                    />
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Las respuestas automáticas se activan cuando la IA detecta estas palabras clave 
                  en los mensajes de los deudores. Puede personalizarlas según las políticas de su empresa.
                </p>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'escalation' && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Umbrales de Escalada Automática</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="Descuento solicitado para escalar (%)"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={config.escalationThresholds.discountRequested}
                    onChange={(value) => updateEscalationThreshold('discountRequested', value)}
                    helperText="Si el deudor pide más de este descuento, se escala a humano"
                  />
                </div>
                
                <div>
                  <Input
                    label="Tiempo solicitado para escalar (meses)"
                    type="number"
                    min="1"
                    max="60"
                    value={config.escalationThresholds.timeRequested}
                    onChange={(value) => updateEscalationThreshold('timeRequested', value)}
                    helperText="Si el deudor pide más tiempo, se escala a humano"
                  />
                </div>
                
                <div>
                  <Input
                    label="Largo de conversación para escalar"
                    type="number"
                    min="5"
                    max="50"
                    value={config.escalationThresholds.conversationLength}
                    onChange={(value) => updateEscalationThreshold('conversationLength', value)}
                    helperText="Número de mensajes antes de escalar automáticamente"
                  />
                </div>
                
                <div>
                  <Input
                    label="Nivel de frustración para escalar"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.escalationThresholds.frustrationLevel}
                    onChange={(value) => updateEscalationThreshold('frustrationLevel', value)}
                    helperText="Nivel de frustración detectado (0-1) para escalar"
                  />
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>Importante:</strong> Cuando se alcanza cualquiera de estos umbrales, 
                  la conversación se transferirá automáticamente a un representante humano.
                </p>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'general' && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Configuración General</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Activar IA automáticamente</label>
                    <p className="text-sm text-gray-500">La IA se activará automáticamente cuando un deudor elija renegociar</p>
                  </div>
                  <ToggleSwitch
                    checked={config.autoActivate}
                    onChange={(checked) => setConfig(prev => ({ ...prev, autoActivate: checked }))}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Input
                      label="Hora de inicio"
                      type="time"
                      value={config.workingHours.start}
                      onChange={(value) => setConfig(prev => ({
                        ...prev,
                        workingHours: { ...prev.workingHours, start: value }
                      }))}
                    />
                  </div>
                  
                  <div>
                    <Input
                      label="Hora de fin"
                      type="time"
                      value={config.workingHours.end}
                      onChange={(value) => setConfig(prev => ({
                        ...prev,
                        workingHours: { ...prev.workingHours, end: value }
                      }))}
                    />
                  </div>
                  
                  <div>
                    <Input
                      label="Zona horaria"
                      value={config.timezone}
                      onChange={(value) => setConfig(prev => ({ ...prev, timezone: value }))}
                      helperText="Zona horaria para el horario de trabajo"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default NegotiationAIConfig;