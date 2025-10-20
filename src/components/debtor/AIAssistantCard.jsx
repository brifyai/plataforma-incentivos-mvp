/**
 * AI Assistant Card Component
 * 
 * Componente principal del Asistente de IA Personalizado para deudores
 * con chatbot financiero, análisis predictivo, negociación y educación
 */

import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Brain, 
  TrendingUp, 
  BookOpen, 
  Send, 
  Bot, 
  User,
  Sparkles,
  Target,
  DollarSign,
  Calendar,
  Award,
  ChevronRight,
  Lightbulb,
  BarChart3,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingDown,
  PiggyBank,
  CreditCard,
  GraduationCap
} from 'lucide-react';
import { useDebtorAIAssistant } from '../../hooks/useDebtorAIAssistant';

const AIAssistantCard = ({ userId }) => {
  console.log('🤖 AIAssistantCard renderizado con userId:', userId);
  
  const {
    financialProfile,
    conversationHistory,
    currentMessage,
    isTyping,
    predictiveAnalysis,
    negotiationStrategies,
    educationalContent,
    loading,
    error,
    activeTab,
    selectedDebt,
    selectedTopic,
    educationLevel,
    sendMessage,
    loadNegotiationStrategies,
    loadEducationalContent,
    clearConversation,
    handleSuggestion,
    handleFollowUpAction,
    setCurrentMessage,
    setActiveTab,
    setSelectedDebt,
    setSelectedTopic,
    setEducationLevel,
    quickActions,
    derivedMetrics,
    financialHealthStatus,
    messagesEndRef
  } = useDebtorAIAssistant(userId);

  console.log('🤖 Estado del AI Assistant:', { loading, error, activeTab, financialProfile: !!financialProfile });

  const [showQuickActions, setShowQuickActions] = useState(true);

  // Tabs disponibles
  const tabs = [
    { id: 'chat', label: 'Chat IA', icon: MessageCircle, color: 'blue' },
    { id: 'analysis', label: 'Análisis Predictivo', icon: Brain, color: 'purple' },
    { id: 'negotiation', label: 'Negociación', icon: TrendingUp, color: 'green' },
    { id: 'education', label: 'Educación', icon: BookOpen, color: 'orange' }
  ];

  // Acciones rápidas
  const quickActionButtons = [
    { id: 'payment', label: 'Consejos de Pago', icon: DollarSign, action: quickActions.getPaymentAdvice },
    { id: 'negotiation', label: 'Ayuda Negociación', icon: TrendingUp, action: quickActions.getNegotiationHelp },
    { id: 'budget', label: 'Crear Presupuesto', icon: PiggyBank, action: quickActions.getBudgetHelp },
    { id: 'credit', label: 'Mejorar Crédito', icon: CreditCard, action: quickActions.getCreditImprovement },
    { id: 'investment', label: 'Aprender Inversión', icon: GraduationCap, action: quickActions.getInvestmentAdvice }
  ];

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Renderizar tab de Chat
  const renderChatTab = () => (
    <div className="flex flex-col h-full">
      {/* Header del chat */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold">Asistente Financiero IA</h3>
              <p className="text-xs text-blue-100">Tu experto en finanzas personales</p>
            </div>
          </div>
          <button
            onClick={clearConversation}
            className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors"
          >
            Limpiar chat
          </button>
        </div>
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 min-h-[400px] max-h-[400px]">
        {conversationHistory.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">¿En qué puedo ayudarte?</h4>
            <p className="text-gray-600 text-sm mb-6">Soy tu asistente financiero personal. Puedo ayudarte con:</p>
            
            {/* Acciones rápidas */}
            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
              {quickActionButtons.map((action) => (
                <button
                  key={action.id}
                  onClick={action.action}
                  className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all hover:scale-105 text-left"
                >
                  <action.icon className="w-5 h-5 text-blue-600 mb-1" />
                  <div className="text-xs font-medium text-gray-800">{action.label}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {conversationHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                    msg.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {msg.type === 'assistant' && (
                      <Bot className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-line">{msg.message}</p>
                      
                      {/* Sugerencias */}
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {msg.suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSuggestion(suggestion)}
                              className="w-full text-left bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-2 text-xs transition-colors"
                            >
                              <div className="font-medium text-blue-800">{suggestion.title}</div>
                              <div className="text-blue-600">{suggestion.description}</div>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* Acciones de seguimiento */}
                      {msg.followUpActions && msg.followUpActions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {msg.followUpActions.map((action, index) => (
                            <button
                              key={index}
                              onClick={() => handleFollowUpAction(action)}
                              className="w-full text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-2 text-xs transition-colors"
                            >
                              <div className="font-medium text-gray-800">{action.title}</div>
                              <div className="text-gray-600">{action.description}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {msg.type === 'user' && (
                      <User className="w-5 h-5 text-blue-200 mt-0.5 flex-shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Indicador de escritura */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-5 h-5 text-blue-600" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input de mensaje */}
      <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
        <div className="flex space-x-2">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage(currentMessage)}
            placeholder="Escribe tu pregunta financiera..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading.message}
          />
          <button
            onClick={() => sendMessage(currentMessage)}
            disabled={!currentMessage.trim() || loading.message}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Enviar</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Renderizar tab de Análisis Predictivo
  const renderAnalysisTab = () => (
    <div className="p-6 space-y-6">
      {loading.analysis ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Analizando tu situación financiera...</p>
        </div>
      ) : predictiveAnalysis ? (
        <>
          {/* Predicciones de Pago */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Brain className="w-5 h-5 mr-2" />
              Predicciones de Pago
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-purple-100 text-sm">Probabilidad de próximo pago</p>
                <p className="text-2xl font-bold">{(predictiveAnalysis.paymentPredictions.nextPaymentProbability * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-purple-100 text-sm">Monto recomendado</p>
                <p className="text-2xl font-bold">{formatCurrency(predictiveAnalysis.paymentPredictions.recommendedPaymentAmount)}</p>
              </div>
              <div>
                <p className="text-purple-100 text-sm">Tendencia mensual</p>
                <p className="text-lg font-semibold capitalize">{predictiveAnalysis.paymentPredictions.monthlyPaymentTrend}</p>
              </div>
              <div>
                <p className="text-purple-100 text-sm">Riesgo de default</p>
                <p className="text-lg font-semibold">{(predictiveAnalysis.paymentPredictions.riskOfDefault * 100).toFixed(0)}%</p>
              </div>
            </div>
          </div>

          {/* Proyección de Deuda */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Proyección de Deuda
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-gray-600 text-sm">Deuda actual</p>
                <p className="text-xl font-bold text-gray-800">{formatCurrency(predictiveAnalysis.debtProjection.currentTotal)}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600 text-sm">Fecha estimada de pago</p>
                <p className="text-xl font-bold text-green-600">
                  {new Date(predictiveAnalysis.debtProjection.projectedPayoffDate).toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-600 text-sm">Ahorro potencial</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(predictiveAnalysis.debtProjection.potentialSavings)}</p>
              </div>
            </div>
          </div>

          {/* Oportunidades de Optimización */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-yellow-600" />
              Oportunidades de Optimización
            </h3>
            <div className="space-y-3">
              {predictiveAnalysis.optimizationOpportunities.map((opportunity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 capitalize">{opportunity.type.replace('_', ' ')}</p>
                    <p className="text-sm text-gray-600">Ahorro potencial: {formatCurrency(opportunity.potentialSavings)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">{(opportunity.probability * 100).toFixed(0)}% probabilidad</p>
                    <p className="text-xs text-gray-500">{opportunity.timeframe}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recomendaciones */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-600" />
              Recomendaciones Personalizadas
            </h3>
            <div className="space-y-3">
              {predictiveAnalysis.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    rec.priority === 'high' ? 'bg-red-500' : 
                    rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{rec.action.replace('_', ' ').toUpperCase()}</p>
                    <p className="text-sm text-gray-600">{rec.reasoning}</p>
                    <p className="text-xs text-blue-600 mt-1">Impacto: {rec.impact.replace('_', ' ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No hay análisis predictivo disponible</p>
        </div>
      )}
    </div>
  );

  // Renderizar tab de Negociación
  const renderNegotiationTab = () => (
    <div className="p-6 space-y-6">
      {/* Selector de deuda */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
          Seleccionar Deuda para Negociar
        </h3>
        {financialProfile?.negotiationOpportunities?.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {financialProfile.negotiationOpportunities.map((debt) => (
              <button
                key={debt.debtId}
                onClick={() => loadNegotiationStrategies(debt.debtId)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedDebt === debt.debtId
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="text-left">
                  <p className="font-semibold text-gray-800">{debt.creditor}</p>
                  <p className="text-sm text-gray-600">Tasa actual: {debt.currentRate}%</p>
                  <p className="text-sm text-green-600">Reducción potencial: {(debt.potentialReduction * 100).toFixed(0)}%</p>
                  <p className="text-xs text-gray-500">Confianza: {(debt.confidence * 100).toFixed(0)}%</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No hay oportunidades de negociación disponibles</p>
        )}
      </div>

      {/* Estrategias de negociación */}
      {loading.strategies ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Generando estrategias de negociación...</p>
        </div>
      ) : negotiationStrategies ? (
        <div className="space-y-6">
          {/* Estrategia recomendada */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Estrategia Recomendada</h3>
            <div className="bg-white/20 rounded-lg p-4">
              <p className="font-medium capitalize">
                {negotiationStrategies.recommendedStrategy.replace('_', ' ')}
              </p>
              <p className="text-sm mt-2">
                {negotiationStrategies.strategies[negotiationStrategies.recommendedStrategy]?.description}
              </p>
            </div>
          </div>

          {/* Todas las estrategias */}
          <div className="space-y-4">
            {Object.entries(negotiationStrategies.strategies).map(([key, strategy]) => (
              <div key={key} className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-800 mb-3 capitalize">
                  {key.replace('_', ' ')}
                </h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Probabilidad de éxito</p>
                    <p className="text-lg font-bold text-green-600">{(strategy.successProbability * 100).toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Reducción esperada</p>
                    <p className="text-lg font-bold text-green-600">{(strategy.expectedReduction * 100).toFixed(0)}%</p>
                  </div>
                </div>

                {/* Pasos de preparación */}
                <div className="mb-4">
                  <p className="font-medium text-gray-700 mb-2">Pasos de preparación:</p>
                  <ul className="space-y-1">
                    {strategy.preparationSteps.map((step, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Puntos clave */}
                <div className="mb-4">
                  <p className="font-medium text-gray-700 mb-2">Puntos clave de negociación:</p>
                  <ul className="space-y-1">
                    {strategy.talkingPoints.map((point, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <Lightbulb className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Opciones alternativas */}
                <div>
                  <p className="font-medium text-gray-700 mb-2">Opciones alternativas:</p>
                  <div className="flex flex-wrap gap-2">
                    {strategy.fallbackOptions.map((option, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        {option}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Consejos personalizados */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
              Consejos Personalizados
            </h3>
            <ul className="space-y-2">
              {negotiationStrategies.personalizedTips.map((tip, index) => (
                <li key={index} className="flex items-start text-sm text-gray-700">
                  <ChevronRight className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Selecciona una deuda para ver estrategias de negociación</p>
        </div>
      )}
    </div>
  );

  // Renderizar tab de Educación
  const renderEducationTab = () => (
    <div className="p-6 space-y-6">
      {/* Selector de tema y nivel */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <BookOpen className="w-5 h-5 mr-2 text-orange-600" />
          Contenido Educativo Personalizado
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tema</label>
            <select
              value={selectedTopic}
              onChange={(e) => loadEducationalContent(e.target.value, educationLevel)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="budgeting">Presupuesto</option>
              <option value="debt_management">Gestión de Deudas</option>
              <option value="investing">Inversión</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nivel</label>
            <select
              value={educationLevel}
              onChange={(e) => loadEducationalContent(selectedTopic, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="beginner">Principiante</option>
              <option value="intermediate">Intermedio</option>
              <option value="advanced">Avanzado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contenido educativo */}
      {loading.education ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando contenido educativo...</p>
        </div>
      ) : educationalContent ? (
        <div className="space-y-6">
          {/* Contenido personalizado */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Contenido Personalizado</h3>
            <p className="text-white/90">{educationalContent.personalizedContent}</p>
          </div>

          {/* Ruta de aprendizaje */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <GraduationCap className="w-5 h-5 mr-2 text-orange-600" />
              Ruta de Aprendizaje
            </h3>
            <div className="space-y-4">
              {educationalContent.learningPath.recommendedPath.map((step) => (
                <div key={step.step} className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-orange-600">{step.step}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{step.title}</p>
                    <p className="text-sm text-gray-600">{step.description}</p>
                    <p className="text-xs text-gray-500">Tiempo estimado: {step.estimatedTime}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recursos */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-orange-600" />
              Recursos de Aprendizaje
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {educationalContent.resources.map((resource, index) => (
                <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                    resource.type === 'article' ? 'bg-blue-100' :
                    resource.type === 'video' ? 'bg-red-100' :
                    resource.type === 'tool' ? 'bg-green-100' :
                    resource.type === 'course' ? 'bg-purple-100' :
                    'bg-gray-100'
                  }`}>
                    <FileText className="w-6 h-6 text-gray-600" />
                  </div>
                  <p className="font-medium text-gray-800 text-sm">{resource.title}</p>
                  <p className="text-xs text-gray-500 capitalize">{resource.type}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quiz */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-orange-600" />
              Evaluación de Conocimiento
            </h3>
            <div className="space-y-4">
              {educationalContent.quizzes.map((quiz) => (
                <div key={quiz.id} className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-800 mb-3">{quiz.question}</p>
                  <div className="space-y-2">
                    {quiz.options.map((option, index) => (
                      <label key={index} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`quiz-${quiz.id}`}
                          className="text-orange-600"
                        />
                        <span className="text-sm text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{quiz.explanation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Siguientes pasos */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-600" />
              Siguientes Pasos
            </h3>
            <div className="space-y-3">
              {educationalContent.nextSteps.map((step, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    step.priority === 'high' ? 'bg-red-500' :
                    step.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-800">{step.title}</p>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Selecciona un tema y nivel para comenzar</p>
        </div>
      )}
    </div>
  );

  if (!userId) {
    console.log('🤖 No hay userId, no se renderiza el componente');
    return null;
  }

  console.log('🤖 Renderizando AI Assistant Card completo');
  
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-indigo-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Asistente de IA Personalizado</h2>
              <p className="text-indigo-100">Tu experto financiero inteligente</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-indigo-100">Salud Financiera</p>
              <p className={`text-lg font-bold ${
                financialHealthStatus.color === 'green' ? 'text-green-300' :
                financialHealthStatus.color === 'yellow' ? 'text-yellow-300' : 'text-red-300'
              }`}>
                {financialHealthStatus.score}/100
              </p>
            </div>
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
              <BarChart3 className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-4 px-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? `text-${tab.color}-600 border-b-2 border-${tab.color}-600 bg-${tab.color}-50`
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[600px]">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 m-4 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        {activeTab === 'chat' && renderChatTab()}
        {activeTab === 'analysis' && renderAnalysisTab()}
        {activeTab === 'negotiation' && renderNegotiationTab()}
        {activeTab === 'education' && renderEducationTab()}
      </div>
    </div>
  );
};

export default AIAssistantCard;