/**
 * AI Message Handler Component
 * 
 * Componente para integrar IA de negociación directamente en el sistema de mensajes
 */

import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, LoadingSpinner } from '../common';
import { Bot, User, Send, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';

const AIMessageHandler = ({
  conversation,
  onSendMessage,
  onEscalateToHuman,
  companyId,
  className = ''
}) => {
  const [aiStatus, setAiStatus] = useState({
    isActive: false,
    isTyping: false,
    lastResponse: null,
    escalationThreshold: 0.7
  });
  
  const [aiConfig, setAiConfig] = useState({
    maxDiscount: 15,
    maxInstallments: 12,
    workingHours: { start: '09:00', end: '18:00' },
    autoRespond: true
  });

  useEffect(() => {
    // Cargar configuración de IA para esta empresa
    loadAIConfiguration();
    
    // Verificar si la IA debe estar activa para esta conversación
    checkAIStatus();
  }, [conversation, companyId]);

  const loadAIConfiguration = async () => {
    try {
      // Importar dinámicamente para evitar errores si el módulo no está disponible
      const { aiFeatureFlags } = await import('../../modules/ai-negotiation/utils/featureFlags.js');
      
      if (aiFeatureFlags.isEnabled('AI_MODULE_ENABLED')) {
        // Cargar configuración específica de la empresa
        const config = await loadCompanyAIConfig(companyId);
        setAiConfig(config);
        setAiStatus(prev => ({ ...prev, isActive: true }));
      }
    } catch (error) {
      console.log('AI module not available or disabled');
      setAiStatus(prev => ({ ...prev, isActive: false }));
    }
  };

  const loadCompanyAIConfig = async (companyId) => {
    // Simular carga de configuración - en producción vendría de la BD
    return {
      maxDiscount: 15,
      maxInstallments: 12,
      workingHours: { start: '09:00', end: '18:00' },
      autoRespond: true,
      escalationThreshold: 0.7
    };
  };

  const checkAIStatus = () => {
    if (!conversation || !aiStatus.isActive) return;

    // Verificar si hay respuestas sin responder de deudores
    const lastMessage = conversation.messages?.[conversation.messages.length - 1];
    if (lastMessage?.sender === 'debtor' && !lastMessage.aiResponded) {
      // Activar IA para responder
      handleAIResponse(lastMessage);
    }
  };

  const handleAIResponse = async (debtorMessage) => {
    if (!aiStatus.isActive || !aiConfig.autoRespond) return;

    setAiStatus(prev => ({ ...prev, isTyping: true }));

    try {
      // Importar servicios necesarios
      const { NegotiationAIService } = await import('../../modules/ai-negotiation/services/negotiationAIService.js');
      const { knowledgeBaseService } = await import('../../services/ai/knowledgeBaseService.js');
      
      const aiService = new NegotiationAIService();

      // Enriquecer la conversación con información del deudor y cliente corporativo
      const enrichedConversation = {
        ...conversation,
        debtorId: conversation.debtorId || conversation.debtorRut, // Usar RUT como fallback
        corporateClientId: conversation.corporateClientId || companyId
      };

      // Generar respuesta de IA personalizada
      const response = await aiService.generateNegotiationResponse(
        debtorMessage.content || debtorMessage,
        enrichedConversation,
        aiConfig
      );

      // Enviar respuesta generada por IA
      if (response.content) {
        const aiMessage = {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          content: response.content,
          timestamp: new Date().toISOString(),
          metadata: {
            aiGenerated: true,
            confidence: response.confidence || 0.8,
            escalationTriggered: response.escalationTriggered || false,
            escalationReason: response.escalationReason,
            debtorInfo: response.metadata?.debtorInfo,
            corporateInfo: response.metadata?.corporateInfo,
            personalizationLevel: response.metadata?.personalizationLevel || 'medium',
            responseType: response.metadata?.responseType,
            keywords: response.metadata?.keywords
          }
        };

        await onSendMessage(aiMessage);
        
        setAiStatus(prev => ({
          ...prev,
          isTyping: false,
          lastResponse: response
        }));

        // Si la IA recomienda escalada, mostrar opción
        if (response.escalationTriggered) {
          handleEscalationRecommendation(response);
        }
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      setAiStatus(prev => ({ ...prev, isTyping: false }));
      
      // Enviar mensaje de error
      const errorMessage = {
        id: `ai_error_${Date.now()}`,
        sender: 'ai',
        content: 'Lo siento, he tenido un problema técnico. Un representante humano te atenderá en breve.',
        timestamp: new Date().toISOString(),
        metadata: {
          aiGenerated: true,
          confidence: 0.1,
          escalationTriggered: true,
          escalationReason: 'technical_error',
          error: true
        }
      };
      
      await onSendMessage(errorMessage);
    }
  };

  const handleEscalationRecommendation = (aiResponse) => {
    // Mostrar notificación de escalada recomendada
    console.log('AI recommends escalation:', aiResponse);
  };

  const handleManualAIResponse = async () => {
    if (!conversation.messages?.length) return;

    const lastDebtorMessage = conversation.messages
      .reverse()
      .find(msg => msg.sender === 'debtor');

    if (lastDebtorMessage) {
      await handleAIResponse(lastDebtorMessage);
    }
  };

  const handleEscalateToHuman = () => {
    setAiStatus(prev => ({ ...prev, isActive: false }));
    onEscalateToHuman?.(conversation);
  };

  const isWithinWorkingHours = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return currentTime >= aiConfig.workingHours.start && currentTime <= aiConfig.workingHours.end;
  };

  const getAIStatusBadge = () => {
    if (!aiStatus.isActive) {
      return <Badge variant="secondary">Inactiva</Badge>;
    }
    
    if (aiStatus.isTyping) {
      return <Badge variant="warning">Escribiendo...</Badge>;
    }
    
    if (!isWithinWorkingHours()) {
      return <Badge variant="info">Fuera de horario</Badge>;
    }
    
    return <Badge variant="success">Activa</Badge>;
  };

  const getAIStatusIcon = () => {
    if (aiStatus.isTyping) {
      return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />;
    }
    
    if (!aiStatus.isActive) {
      return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
    
    return <Bot className="w-4 h-4 text-green-500" />;
  };

  if (!aiStatus.isActive) {
    return null;
  }

  return (
    <Card className={`bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getAIStatusIcon()}
            <h4 className="font-semibold text-blue-900">Asistente IA de Negociación</h4>
            {getAIStatusBadge()}
          </div>
          
          <div className="flex items-center gap-2">
            {aiStatus.lastResponse && (
              <>
                <Badge variant="outline" size="sm">
                  Confianza: {Math.round((aiStatus.lastResponse.confidence || 0.8) * 100)}%
                </Badge>
                {aiStatus.lastResponse.metadata?.personalizationLevel && (
                  <Badge variant="info" size="sm">
                    {aiStatus.lastResponse.metadata.personalizationLevel === 'ultra_high' ? '🎯 Ultra-Personalizado' :
                     aiStatus.lastResponse.metadata.personalizationLevel === 'high' ? '👤 Personalizado' :
                     '⚙️ Estándar'}
                  </Badge>
                )}
                {aiStatus.lastResponse.metadata?.debtorInfo && (
                  <Badge variant="success" size="sm">
                    👤 {aiStatus.lastResponse.metadata.debtorInfo.name}
                  </Badge>
                )}
              </>
            )}
          </div>
        </div>

        {/* Estado de la IA */}
        <div className="space-y-3">
          {aiStatus.isTyping && (
            <div className="flex items-center gap-2 p-2 bg-blue-100 rounded-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-700">La IA está analizando y generando respuesta...</span>
            </div>
          )}

          {/* Última respuesta de la IA */}
          {aiStatus.lastResponse && (
            <div className="p-3 bg-white rounded-lg border border-blue-200">
              <div className="flex items-start gap-2 mb-2">
                <Bot className="w-4 h-4 text-blue-600 mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-gray-700 font-medium">Última respuesta generada:</p>
                  <p className="text-sm text-gray-600 mt-1">{aiStatus.lastResponse.content}</p>
                  
                  {/* Mostrar información de personalización */}
                  {aiStatus.lastResponse.metadata?.debtorInfo && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                      <strong>🎯 Personalizado para:</strong> {aiStatus.lastResponse.metadata.debtorInfo.name}
                      {aiStatus.lastResponse.metadata.debtorInfo.rut && ` (${aiStatus.lastResponse.metadata.debtorInfo.rut})`}
                      {aiStatus.lastResponse.metadata.corporateInfo?.name &&
                        ` • Cliente de: ${aiStatus.lastResponse.metadata.corporateInfo.name}`}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Metadatos de la respuesta */}
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500">Información de la respuesta:</p>
                  <div className="flex items-center gap-1">
                    {aiStatus.lastResponse.metadata?.responseType && (
                      <Badge variant="outline" size="sm">
                        {aiStatus.lastResponse.metadata.responseType}
                      </Badge>
                    )}
                    {aiStatus.lastResponse.escalationTriggered && (
                      <Badge variant="warning" size="sm">
                        ⚠️ Escalada recomendada
                      </Badge>
                    )}
                  </div>
                </div>
                
                {aiStatus.lastResponse.metadata?.keywords && (
                  <div className="flex flex-wrap gap-1">
                    {aiStatus.lastResponse.metadata.keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary" size="sm">
                        #{keyword}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Controles de la IA */}
          <div className="flex items-center justify-between pt-2 border-t border-blue-200">
            <div className="text-xs text-blue-700">
              <Zap className="w-3 h-3 inline mr-1" />
              Respuesta automática: {aiConfig.autoRespond ? 'Activada' : 'Desactivada'}
              {!isWithinWorkingHours() && (
                <span className="ml-2 text-orange-600">
                  (Fuera de horario: {aiConfig.workingHours.start} - {aiConfig.workingHours.end})
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualAIResponse}
                disabled={aiStatus.isTyping}
                leftIcon={<Send className="w-3 h-3" />}
              >
                Responder con IA
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleEscalateToHuman}
                leftIcon={<User className="w-3 h-3" />}
              >
                Escalar a Humano
              </Button>
            </div>
          </div>

          {/* Configuración rápida */}
          <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
            <div>
              <span className="font-medium">Descuento máximo:</span> {aiConfig.maxDiscount}%
            </div>
            <div>
              <span className="font-medium">Cuotas máximas:</span> {aiConfig.maxInstallments}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AIMessageHandler;