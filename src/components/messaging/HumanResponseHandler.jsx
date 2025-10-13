/**
 * Human Response Handler Component
 * 
 * Componente para que los representantes humanos puedan responder mensajes
 * cuando una conversación ha sido escalada de IA a humano
 */

import { useState } from 'react';
import { Button, Input } from '../common';
import { Send, User } from 'lucide-react';

const HumanResponseHandler = ({ conversation, onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;

    setSending(true);
    try {
      const newMessage = {
        id: `msg-${Date.now()}`,
        sender: 'company',
        content: message.trim(),
        timestamp: new Date(),
        senderType: 'human'
      };

      await onSendMessage(newMessage);
      setMessage('');
    } catch (error) {
      console.error('Error sending human message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Response Templates */}
      <div className="bg-white rounded-lg p-3 border border-orange-200">
        <p className="text-sm font-medium text-orange-800 mb-2">Respuestas Rápidas:</p>
        <div className="flex flex-wrap gap-2">
          {[
            'Gracias por tu mensaje. Estoy revisando tu caso.',
            'Entiendo tu situación. Permíteme ayudarte.',
            'Voy a consultar las opciones disponibles para ti.',
            'Te responderé a la brevedad posible.',
            'He recibido tu consulta y la estoy procesando.'
          ].map((template, index) => (
            <button
              key={index}
              onClick={() => setMessage(template)}
              className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition-colors"
            >
              {template.substring(0, 30)}...
            </button>
          ))}
        </div>
      </div>

      {/* Message Input */}
      <div className="space-y-3">
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <User className="w-4 h-4 text-orange-500" />
          </div>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu respuesta como representante humano..."
            className="pl-10 pr-12 min-h-[80px] resize-none"
            multiline
            rows={3}
          />
          <div className="absolute right-2 bottom-2">
            <span className="text-xs text-gray-500">
              {message.length}/500 caracteres
            </span>
          </div>
        </div>

        {/* Send Button */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={!message.trim() || sending}
            loading={sending}
            leftIcon={<Send className="w-4 h-4" />}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {sending ? 'Enviando...' : 'Enviar Respuesta'}
          </Button>
        </div>
      </div>

      {/* Human Agent Info */}
      <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          <span className="text-sm font-medium text-orange-800">Modo Humano Activado</span>
        </div>
        <p className="text-xs text-orange-700">
          Estás respondiendo como representante humano. Tu respuesta será enviada directamente al deudor 
          sin procesamiento de IA. Mantén un tono profesional y empático.
        </p>
      </div>
    </div>
  );
};

export default HumanResponseHandler;