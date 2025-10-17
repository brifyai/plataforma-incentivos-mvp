/**
 * useDebtorAIAssistant Hook
 * 
 * Hook personalizado para gestionar el Asistente de IA Personalizado
 * con chatbot, análisis predictivo, negociación y educación financiera
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { debtorAIAssistantService } from '../services/debtorAIAssistantService';

export const useDebtorAIAssistant = (userId) => {
  const [financialProfile, setFinancialProfile] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [predictiveAnalysis, setPredictiveAnalysis] = useState(null);
  const [negotiationStrategies, setNegotiationStrategies] = useState(null);
  const [educationalContent, setEducationalContent] = useState(null);
  const [loading, setLoading] = useState({
    profile: false,
    analysis: false,
    strategies: false,
    education: false,
    message: false
  });
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState('budgeting');
  const [educationLevel, setEducationLevel] = useState('intermediate');
  
  const unsubscribeRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Cargar perfil financiero
  const loadFinancialProfile = useCallback(async () => {
    if (!userId) return;
    
    setLoading(prev => ({ ...prev, profile: true }));
    setError(null);
    
    try {
      const profile = await debtorAIAssistantService.getFinancialProfile(userId);
      setFinancialProfile(profile);
    } catch (err) {
      console.error('Error loading financial profile:', err);
      setError('Error al cargar perfil financiero');
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  }, [userId]);

  // Enviar mensaje al chatbot
  const sendMessage = useCallback(async (message) => {
    if (!message.trim() || !userId) return;
    
    setLoading(prev => ({ ...prev, message: true }));
    setIsTyping(true);
    setError(null);
    
    try {
      const response = await debtorAIAssistantService.processMessage(userId, message);
      
      setConversationHistory(prev => [
        ...prev,
        {
          id: Date.now(),
          type: 'user',
          message,
          timestamp: new Date()
        },
        {
          id: Date.now() + 1,
          type: 'assistant',
          message: response.response,
          suggestions: response.suggestions,
          followUpActions: response.followUpActions,
          intent: response.intent,
          timestamp: new Date()
        }
      ]);
      
      setCurrentMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Error al enviar mensaje');
    } finally {
      setLoading(prev => ({ ...prev, message: false }));
      setIsTyping(false);
    }
  }, [userId]);

  // Cargar análisis predictivo
  const loadPredictiveAnalysis = useCallback(async () => {
    if (!userId) return;
    
    setLoading(prev => ({ ...prev, analysis: true }));
    setError(null);
    
    try {
      const analysis = await debtorAIAssistantService.getPredictiveAnalysis(userId);
      setPredictiveAnalysis(analysis);
    } catch (err) {
      console.error('Error loading predictive analysis:', err);
      setError('Error al cargar análisis predictivo');
    } finally {
      setLoading(prev => ({ ...prev, analysis: false }));
    }
  }, [userId]);

  // Cargar estrategias de negociación
  const loadNegotiationStrategies = useCallback(async (debtId) => {
    if (!userId || !debtId) return;
    
    setLoading(prev => ({ ...prev, strategies: true }));
    setError(null);
    
    try {
      const strategies = await debtorAIAssistantService.getNegotiationStrategies(userId, debtId);
      setNegotiationStrategies(strategies);
      setSelectedDebt(debtId);
    } catch (err) {
      console.error('Error loading negotiation strategies:', err);
      setError('Error al cargar estrategias de negociación');
    } finally {
      setLoading(prev => ({ ...prev, strategies: false }));
    }
  }, [userId]);

  // Cargar contenido educativo
  const loadEducationalContent = useCallback(async (topic, level) => {
    if (!userId) return;
    
    setLoading(prev => ({ ...prev, education: true }));
    setError(null);
    
    try {
      const content = await debtorAIAssistantService.getEducationalContent(userId, topic, level);
      setEducationalContent(content);
      setSelectedTopic(topic);
      setEducationLevel(level);
    } catch (err) {
      console.error('Error loading educational content:', err);
      setError('Error al cargar contenido educativo');
    } finally {
      setLoading(prev => ({ ...prev, education: false }));
    }
  }, [userId]);

  // Acciones rápidas predefinidas
  const quickActions = {
    getPaymentAdvice: () => {
      const message = 'Necesito consejos para pagar mis deudas más eficientemente';
      sendMessage(message);
    },
    getNegotiationHelp: () => {
      const message = '¿Cómo puedo negociar mejores tasas de interés?';
      sendMessage(message);
    },
    getBudgetHelp: () => {
      const message = 'Ayúdame a crear un presupuesto mensual';
      sendMessage(message);
    },
    getCreditImprovement: () => {
      const message = '¿Cómo puedo mejorar mi score de crédito?';
      sendMessage(message);
    },
    getInvestmentAdvice: () => {
      const message = 'Quiero aprender sobre inversión básica';
      sendMessage(message);
    }
  };

  // Manejar sugerencias del chatbot
  const handleSuggestion = useCallback((suggestion) => {
    if (suggestion.action) {
      switch (suggestion.action) {
        case 'generate_payment_plan':
          setActiveTab('analysis');
          loadPredictiveAnalysis();
          break;
        case 'open_negotiation_simulator':
          if (financialProfile?.negotiationOpportunities?.length > 0) {
            loadNegotiationStrategies(financialProfile.negotiationOpportunities[0].debtId);
            setActiveTab('negotiation');
          }
          break;
        case 'view_negotiation_details':
          if (financialProfile?.negotiationOpportunities?.length > 0) {
            loadNegotiationStrategies(financialProfile.negotiationOpportunities[0].debtId);
            setActiveTab('negotiation');
          }
          break;
        case 'calculate_interest_savings':
          setActiveTab('analysis');
          loadPredictiveAnalysis();
          break;
        case 'create_payment_schedule':
          setActiveTab('analysis');
          loadPredictiveAnalysis();
          break;
        case 'create_improvement_plan':
          setActiveTab('education');
          loadEducationalContent('budgeting', 'intermediate');
          break;
        default:
          break;
      }
    }
  }, [financialProfile, loadPredictiveAnalysis, loadNegotiationStrategies, loadEducationalContent]);

  // Manejar acciones de seguimiento
  const handleFollowUpAction = useCallback((action) => {
    if (action.action) {
      switch (action.action) {
        case 'calculate_interest_savings':
          setActiveTab('analysis');
          loadPredictiveAnalysis();
          break;
        case 'create_payment_schedule':
          setActiveTab('analysis');
          loadPredictiveAnalysis();
          break;
        case 'create_improvement_plan':
          setActiveTab('education');
          loadEducationalContent('budgeting', 'intermediate');
          break;
        default:
          break;
      }
    }
  }, [loadPredictiveAnalysis, loadEducationalContent]);

  // Limpiar conversación
  const clearConversation = useCallback(() => {
    setConversationHistory([]);
    setCurrentMessage('');
  }, []);

  // Auto-scroll al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory]);

  // Suscribir a actualizaciones en tiempo real
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = debtorAIAssistantService.subscribe((notification) => {
      // Actualizar datos cuando hay cambios
      if (notification.type === 'ai_assistant_update') {
        loadFinancialProfile();
        loadPredictiveAnalysis();
      }
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [userId, loadFinancialProfile, loadPredictiveAnalysis]);

  // Cargar datos iniciales
  useEffect(() => {
    if (userId) {
      loadFinancialProfile();
      loadPredictiveAnalysis();
    }
  }, [userId, loadFinancialProfile, loadPredictiveAnalysis]);

  // Calcular métricas derivadas
  const derivedMetrics = {
    negotiationCount: financialProfile?.negotiationOpportunities?.length || 0,
    riskLevel: financialProfile?.financialHealth?.level || 'unknown',
    savingsRate: financialProfile?.financialHealth?.factors?.savingsRate || 0,
    debtToIncome: financialProfile?.financialHealth?.factors?.debtToIncome || 0,
    paymentScore: financialProfile?.financialHealth?.factors?.paymentHistory || 0,
    totalDebt: financialProfile?.debtAnalysis?.totalDebt || 0,
    averageInterestRate: financialProfile?.debtAnalysis?.interestRates?.average || 0,
    nextPaymentProbability: predictiveAnalysis?.paymentPredictions?.nextPaymentProbability || 0,
    projectedSavings: predictiveAnalysis?.optimizationOpportunities?.reduce((sum, opp) => sum + opp.potentialSavings, 0) || 0
  };

  // Estado de salud financiera
  const financialHealthStatus = {
    level: derivedMetrics.riskLevel,
    score: derivedMetrics.paymentScore,
    color: derivedMetrics.paymentScore >= 80 ? 'green' : derivedMetrics.paymentScore >= 60 ? 'yellow' : 'red',
    recommendations: derivedMetrics.paymentScore < 70 ? [
      'Mejorar consistencia de pagos',
      'Reducir utilización de crédito',
      'Aumentar tasa de ahorro'
    ] : []
  };

  return {
    // Estado principal
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
    
    // Métodos
    sendMessage,
    loadFinancialProfile,
    loadPredictiveAnalysis,
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
    
    // Acciones rápidas
    quickActions,
    
    // Métricas derivadas
    derivedMetrics,
    financialHealthStatus,
    
    // Refs
    messagesEndRef
  };
};

export default useDebtorAIAssistant;