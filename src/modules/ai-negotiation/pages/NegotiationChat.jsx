import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Input, Badge } from '../../../components/common';
import { AIStatusIndicator } from '../components/AILoader';

/**
 * Página de Chat de Negociación con IA
 * 
 * Interfaz de conversación entre deudor e IA para renegociación
 */
const NegotiationChat = ({ 
  conversationId, 
  proposalId, 
  debtorData,
  onEscalate,
  onResolve 
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiStatus, setAiStatus] = useState('active');
  const [conversation, setConversation] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (conversationId) {
      loadConversation();
      loadMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversation = async () => {
    try {
      // Aquí iría la lógica real para cargar la conversación
      const conversationData = {
        id: conversationId,
        proposalId,
        debtorId: debtorData?.id,
        status: 'active',
        aiActive: true,
        startedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };
      
      setConversation(conversationData);
    } catch (error) {
      console.error('Error loading conversation:', error);
      setAiStatus('error');
    }
  };

  const loadMessages = async () => {
    try {
      // Mensaje inicial de bienvenida
      const initialMessages = [
        {
          id: 'msg_1',
          content: `¡Hola ${debtorData?.name || 'Cliente'}! Soy el asistente virtual de negociación. Estoy aquí para ayudarte a encontrar la mejor opción para tu propuesta de pago. ¿En qué aspectos te gustaría que trabajáramos?`,
          senderType: 'ai_assistant',
          timestamp: new Date().toISOString(),
          metadata: { aiGenerated: true }
        }
      ];
      
      setMessages(initialMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: newMessage.trim(),
      senderType: 'debtor',
      timestamp: new Date().toISOString(),
      metadata: { aiGenerated: false }
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);

    try {
      // Simular procesamiento de IA
      await new Promise(resolve => setTimeout(resolve, 1500));

      const aiResponse = await generateAIResponse(userMessage.content);
      
      const aiMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: aiResponse.content,
        senderType: 'ai_assistant',
        timestamp: new Date().toISOString(),
        metadata: { 
          aiGenerated: true,
          confidence: aiResponse.confidence,
          escalationTriggered: aiResponse.escalationTriggered
        }
      };

      setMessages(prev => [...prev, aiMessage]);

      // Si la IA detecta que debe escalar
      if (aiResponse.escalationTriggered) {
        setAiStatus('escalated');
        if (onEscalate) {
          onEscalate({
            reason: aiResponse.escalationReason,
            conversationId,
            messages: [...messages, userMessage, aiMessage]
          });
        }
      }

    } catch (error) {
      console.error('Error generating AI response:', error);
      setAiStatus('error');
      
      const errorMessage = {
        id: `msg_error_${Date.now()}`,
        content: 'Lo siento, he tenido un problema técnico. Un representante humano te atenderá en breve.',
        senderType: 'system',
        timestamp: new Date().toISOString(),
        metadata: { error: true }
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateAIResponse = async (userMessage) => {
    const message = userMessage.toLowerCase();
    
    // Lógica simple de detección de palabras clave
    if (message.includes('descuento') || message.includes('rebaja')) {
      return {
        content: 'Puedo ofrecerte hasta un 15% de descuento adicional sobre la propuesta original. Esto reduciría tu cuota mensual significativamente. ¿Te gustaría que calculemos el nuevo monto?',
        confidence: 0.9,
        escalationTriggered: false
      };
    }
    
    if (message.includes('cuotas') || message.includes('plazos')) {
      return {
        content: 'Tenemos opciones flexibles de pago en 3, 6, 9 o 12 cuotas. ¿Cuál se ajustaría mejor a tu presupuesto? También podemos combinar esto con algún descuento.',
        confidence: 0.95,
        escalationTriggered: false
      };
    }
    
    if (message.includes('persona') || message.includes('humano') || message.includes('agente')) {
      return {
        content: 'Entiendo que prefieres hablar con una persona. Te transferiré inmediatamente con uno de nuestros representantes especializados.',
        confidence: 1.0,
        escalationTriggered: true,
        escalationReason: 'user_requested_human'
      };
    }
    
    if (message.includes('muy alto') || message.includes('no puedo pagar')) {
      return {
        content: 'Entiendo tu preocupación. Permíteme ayudarte a encontrar una solución. Podemos revisar opciones como extender el plazo o aplicar descuentos adicionales. ¿Cuál es tu principal preocupación con el monto actual?',
        confidence: 0.85,
        escalationTriggered: false
      };
    }
    
    // Respuesta por defecto
    return {
      content: 'Gracias por tu mensaje. Estoy aquí para ayudarte a encontrar la mejor opción de pago. ¿Podrías decirme más específicamente qué aspecto de la propuesta te gustaría renegociar? (descuentos, plazos, cuotas, etc.)',
      confidence: 0.7,
      escalationTriggered: false
    };
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const escalateToHuman = () => {
    setAiStatus('escalated');
    if (onEscalate) {
      onEscalate({
        reason: 'manual_escalation',
        conversationId,
        messages
      });
    }
  };

  const resolveNegotiation = () => {
    if (onResolve) {
      onResolve({
        conversationId,
        messages,
        resolution: 'agreement_reached'
      });
    }
  };

  if (!conversation) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Header */}
      <Card className="flex-shrink-0 p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold">Negociación de Propuesta</h3>
            <Badge variant={aiStatus === 'active' ? 'success' : aiStatus === 'escalated' ? 'warning' : 'danger'}>
              {aiStatus === 'active' ? 'IA Activa' : aiStatus === 'escalated' ? 'Escalado' : 'Error'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <AIStatusIndicator status={aiStatus} showDetails />
            
            <div className="flex gap-2">
              {aiStatus === 'active' && (
                <Button variant="outline" size="sm" onClick={escalateToHuman}>
                  Escalar a Humano
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={resolveNegotiation}>
                Resolver
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mt-2 text-sm text-gray-600">
          Propuesta: {proposalId} | Cliente: {debtorData?.name || 'N/A'}
        </div>
      </Card>

      {/* Messages */}
      <Card className="flex-1 p-4 mb-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderType === 'debtor' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderType === 'debtor'
                    ? 'bg-blue-600 text-white'
                    : message.senderType === 'system'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-pulse flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  </div>
                  <span className="text-sm">La IA está escribiendo...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </Card>

      {/* Input */}
      <Card className="flex-shrink-0 p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(value) => setNewMessage(value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje..."
            disabled={aiStatus !== 'active' || isTyping}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage}
            disabled={!newMessage.trim() || aiStatus !== 'active' || isTyping}
          >
            Enviar
          </Button>
        </div>
        
        {aiStatus !== 'active' && (
          <div className="mt-2 text-sm text-gray-600 text-center">
            {aiStatus === 'escalated' 
              ? 'Esta conversación ha sido escalada a un representante humano.'
              : 'El sistema de IA no está disponible en este momento.'
            }
          </div>
        )}
      </Card>
    </div>
  );
};

export default NegotiationChat;