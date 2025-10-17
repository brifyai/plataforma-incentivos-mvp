/**
 * Virtual Assistant Card Component
 * 
 * Componente para asistente virtual inteligente con NLP
 * Integración con el servicio de IA avanzada
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, Badge, Button, Input } from '../common';
import { advancedAIService } from '../../services/advancedAIService';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Brain,
  Lightbulb,
  User,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const VirtualAssistantCard = ({ currentUserId, userProfile }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [conversationContext, setConversationContext] = useState({});
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Estado del asistente
  const [assistantStatus, setAssistantStatus] = useState({
    isOnline: false,
    isInitialized: false,
    capabilities: []
  });

  // Inicializar asistente al montar
  useEffect(() => {
    initializeAssistant();
  }, []);

  // Auto-scroll al final de los mensajes
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeAssistant = async () => {
    try {
      setAssistantStatus(prev => ({ ...prev, isInitialized: false }));
      
      await advancedAIService.initialize();
      
      setAssistantStatus({
        isOnline: true,
        isInitialized: true,
        capabilities: [
          'Análisis de sentimientos',
          'Clasificación de intención',
          'Extracción de entidades',
          'Recomendaciones personalizadas',
          'Aprendizaje continuo'
        ]
      });

      // Mensaje de bienvenida
      const welcomeMessage = {
        id: 'welcome',
        type: 'assistant',
        text: '¡Hola! Soy tu asistente virtual inteligente. Puedo ayudarte con consultas de pagos, reportar problemas, análisis de datos y mucho más. ¿En qué puedo asistirte hoy?',
        timestamp: new Date(),
        sentiment: { sentiment: 'positive', confidence: 0.9 },
        suggestions: [
          'Ver mis pagos',
          'Generar reporte',
          'Ayuda con configuración',
          'Análisis de datos'
        ]
      };

      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Error inicializando asistente:', error);
      setAssistantStatus({
        isOnline: false,
        isInitialized: false,
        capabilities: []
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;

    const userMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      text: inputText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);
    setIsTyping(true);

    try {
      // Procesar consulta con IA avanzada
      const response = await advancedAIService.processUserQuery(
        currentUserId || 'anonymous',
        userMessage.text,
        conversationContext
      );

      const assistantMessage = {
        id: `assistant_${Date.now()}`,
        type: 'assistant',
        text: response.response.text,
        timestamp: new Date(),
        sentiment: response.sentiment,
        intent: response.intent,
        confidence: response.confidence,
        suggestions: response.suggestions,
        actions: response.response.actions,
        followUpQuestions: response.response.followUpQuestions,
        entities: response.entities
      };

      setMessages(prev => [...prev, assistantMessage]);
      setSuggestions(response.suggestions || []);
      
      // Actualizar contexto de conversación
      setConversationContext(prev => ({
        ...prev,
        lastIntent: response.intent.intent,
        lastSentiment: response.sentiment.sentiment,
        entities: response.entities
      }));

    } catch (error) {
      console.error('Error procesando mensaje:', error);
      
      const errorMessage = {
        id: `error_${date.now()}`,
        type: 'assistant',
        text: 'Lo siento, he tenido un problema procesando tu consulta. Por favor, intenta reformular tu pregunta o contacta al soporte técnico.',
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputText(suggestion);
    inputRef.current?.focus();
  };

  const handleActionClick = async (action) => {
    try {
      switch (action.action) {
        case 'navigate':
          // Navegar a la ruta especificada
          console.log('Navegando a:', action.target);
          break;
        case 'process_pending':
          // Procesar pagos pendientes
          console.log('Procesando pagos pendientes');
          break;
        case 'diagnose':
          // Ejecutar diagnóstico
          console.log('Ejecutando diagnóstico del sistema');
          break;
        case 'contact_support':
          // Contactar soporte
          console.log('Contactando soporte técnico');
          break;
        case 'start_tutorial':
          // Iniciar tutorial
          console.log('Iniciando tutorial guiado');
          break;
        default:
          console.log('Acción desconocida:', action);
      }
    } catch (error) {
      console.error('Error ejecutando acción:', error);
    }
  };

  const handleFeedback = async (messageId, isPositive) => {
    // Registrar feedback para aprendizaje continuo
    const message = messages.find(m => m.id === messageId);
    if (message) {
      console.log(`Feedback ${isPositive ? 'positivo' : 'negativo'} para mensaje:`, messageId);
      
      // Aquí se enviaría el feedback al sistema de aprendizaje
      // await advancedAIService.recordFeedback(messageId, isPositive);
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      stopVoiceInput();
    } else {
      startVoiceInput();
    }
  };

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Tu navegador no soporta reconocimiento de voz');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Error en reconocimiento de voz:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const stopVoiceInput = () => {
    setIsListening(false);
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment?.sentiment) {
      case 'positive':
        return <ThumbsUp className="w-4 h-4 text-green-600" />;
      case 'negative':
        return <ThumbsDown className="w-4 h-4 text-red-600" />;
      default:
        return <MessageCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment?.sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              assistantStatus.isOnline 
                ? 'bg-gradient-to-br from-green-100 to-emerald-100' 
                : 'bg-gradient-to-br from-gray-100 to-gray-200'
            } group-hover:scale-110 transition-transform duration-300`}>
              <Bot className={`w-5 h-5 ${
                assistantStatus.isOnline ? 'text-green-600' : 'text-gray-600'
              }`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-secondary-900">🤖 Asistente IA</h3>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  assistantStatus.isOnline ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <span className="text-sm text-secondary-600">
                  {assistantStatus.isOnline ? 'En línea' : 'Desconectado'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {assistantStatus.capabilities.slice(0, 2).map((capability, index) => (
              <Badge key={index} variant="secondary" size="sm">
                {capability}
              </Badge>
            ))}
          </div>
        </div>

        {/* Messages Area */}
        <div className="mb-6 bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Brain className="w-12 h-12 text-gray-400 mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Asistente Inteligente
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Puedo ayudarte con consultas, análisis y recomendaciones personalizadas
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>IA Avanzada</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                  <Lightbulb className="w-4 h-4 text-yellow-600" />
                  <span>NLP</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md ${
                      message.type === 'user'
                        ? 'bg-primary-600 text-white'
                        : message.isError
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-white text-gray-900 border border-gray-200'
                    } rounded-lg p-3 shadow-sm`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-1">
                        {message.type === 'user' ? (
                          <User className="w-4 h-4" />
                        ) : message.isError ? (
                          <AlertCircle className="w-4 h-4" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{message.text}</p>
                        
                        {/* Metadatos del asistente */}
                        {message.type === 'assistant' && !message.isError && (
                          <div className="mt-2 space-y-2">
                            {/* Sentimiento */}
                            {message.sentiment && (
                              <div className="flex items-center gap-2">
                                {getSentimentIcon(message.sentiment)}
                                <Badge
                                  variant="secondary"
                                  size="sm"
                                  className={getSentimentColor(message.sentiment)}
                                >
                                  {message.sentiment.sentiment}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {Math.round((message.confidence || 0) * 100)}%
                                </span>
                              </div>
                            )}

                            {/* Intención */}
                            {message.intent && (
                              <div className="text-xs text-gray-600">
                                <span className="font-medium">Intención:</span> {message.intent.intent}
                              </div>
                            )}

                            {/* Acciones recomendadas */}
                            {message.actions && message.actions.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-gray-700">Acciones recomendadas:</p>
                                {message.actions.map((action, index) => (
                                  <Button
                                    key={index}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleActionClick(action)}
                                    className="text-xs h-auto py-1"
                                  >
                                    {action.label}
                                  </Button>
                                ))}
                              </div>
                            )}

                            {/* Preguntas de seguimiento */}
                            {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-gray-700">Preguntas de seguimiento:</p>
                                {message.followUpQuestions.map((question, index) => (
                                  <button
                                    key={index}
                                    onClick={() => setInputText(question)}
                                    className="text-xs text-blue-600 hover:text-blue-800 text-left"
                                  >
                                    • {question}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Timestamp y feedback */}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs opacity-70">
                        {formatTime(message.timestamp)}
                      </span>
                      {message.type === 'assistant' && !message.isError && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleFeedback(message.id, true)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Respuesta útil"
                          >
                            <ThumbsUp className="w-3 h-3 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleFeedback(message.id, false)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Respuesta no útil"
                          >
                            <ThumbsDown className="w-3 h-3 text-gray-600" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Indicador de escritura */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-900 border border-gray-200 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Sugerencias:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Escribe tu consulta..."
              disabled={isProcessing}
              className="pr-10"
            />
            <button
              onClick={toggleVoiceInput}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded ${
                isListening 
                  ? 'bg-red-100 text-red-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={isListening ? 'Detener grabación' : 'Iniciar entrada de voz'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isProcessing}
            className="px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Status Bar */}
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3" />
            <span>
              {assistantStatus.isInitialized 
                ? 'IA avanzada con NLP y Deep Learning' 
                : 'Inicializando...'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span>Procesamiento local</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default VirtualAssistantCard;