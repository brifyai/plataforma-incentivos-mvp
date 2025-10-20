/**
 * Componente de Configuración de Notificaciones WhatsApp
 * 
 * Permite a los usuarios configurar qué notificaciones desean recibir
 * por WhatsApp.
 */

import React, { useState, useEffect } from 'react';
import { useWhatsApp } from '../../hooks/integrations';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';

const WhatsAppNotificationSettings = () => {
  const [settings, setSettings] = useState({
    paymentReminders: true,
    agreementConfirmations: true,
    paymentConfirmations: true,
    newOffers: true,
    offerExpiring: true,
    incentiveAlerts: true,
    achievements: false,
    levelUp: false
  });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [testingSend, setTestingSend] = useState(false);
  
  const { isConfigured, sendMessage } = useWhatsApp();
  const { user } = useAuth();

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    // Skip loading settings for god mode user (mock user not in database)
    if (user.id === 'god-mode-user') {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings(data.whatsapp_settings || settings);
        setPhoneNumber(data.phone_number || '');
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    }
  };

  const saveSettings = async () => {
    // Skip saving settings for god mode user (mock user not in database)
    if (user.id === 'god-mode-user') {
      alert('Configuración guardada exitosamente (modo administrador)');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('user_notification_settings')
        .upsert([{
          user_id: user.id,
          phone_number: phoneNumber,
          whatsapp_settings: settings,
          updated_at: new Date().toISOString()
        }], { onConflict: 'user_id' });

      if (error) throw error;

      alert('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const sendTestMessage = async () => {
    if (!phoneNumber) {
      alert('Por favor, ingrese su número de teléfono primero');
      return;
    }

    setTestingSend(true);

    try {
      const result = await sendMessage(
        phoneNumber,
        `¡Hola ${user.first_name || 'Usuario'}! 👋\n\nEste es un mensaje de prueba de NexuPay.\n\nSi recibiste este mensaje, tu configuración de WhatsApp está funcionando correctamente. ✅`
      );

      if (result.success) {
        alert('Mensaje de prueba enviado. Revisa tu WhatsApp.');
      } else {
        alert('Error al enviar mensaje de prueba: ' + result.error);
      }
    } catch (error) {
      alert('Error al enviar mensaje de prueba');
    } finally {
      setTestingSend(false);
    }
  };

  if (!isConfigured().configured) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">WhatsApp no disponible</h3>
          <p className="mt-1 text-sm text-gray-500">
            Las notificaciones por WhatsApp no están configuradas en este momento.
          </p>
        </div>
      </div>
    );
  }

  const notificationOptions = [
    {
      key: 'paymentReminders',
      title: 'Recordatorios de Pago',
      description: 'Te recordaremos cuando se acerque la fecha de vencimiento de un pago',
      icon: '📅'
    },
    {
      key: 'agreementConfirmations',
      title: 'Confirmaciones de Acuerdo',
      description: 'Confirma cuando aceptes un nuevo acuerdo de pago',
      icon: '✅'
    },
    {
      key: 'paymentConfirmations',
      title: 'Confirmaciones de Pago',
      description: 'Te notificamos cuando recibamos tu pago',
      icon: '💰'
    },
    {
      key: 'newOffers',
      title: 'Nuevas Ofertas',
      description: 'Recibe alertas de nuevas ofertas especiales',
      icon: '🎁'
    },
    {
      key: 'offerExpiring',
      title: 'Ofertas por Vencer',
      description: 'Te avisamos cuando una oferta está por expirar',
      icon: '⏰'
    },
    {
      key: 'incentiveAlerts',
      title: 'Alertas de Incentivos',
      description: 'Notificaciones cuando tengas incentivos disponibles',
      icon: '💸'
    },
    {
      key: 'achievements',
      title: 'Logros Desbloqueados',
      description: 'Celebra tus logros con notificaciones especiales',
      icon: '🏆'
    },
    {
      key: 'levelUp',
      title: 'Subida de Nivel',
      description: 'Te notificamos cuando subas de nivel',
      icon: '⭐'
    }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Configuración de Notificaciones WhatsApp
        </h3>
        <p className="text-sm text-gray-600">
          Personaliza las notificaciones que deseas recibir por WhatsApp
        </p>
      </div>

      {/* Campo de número de teléfono */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Número de WhatsApp
        </label>
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="56912345678"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Incluye el código de país (ej: 56 para Chile)
            </p>
          </div>
          <button
            onClick={sendTestMessage}
            disabled={testingSend || !phoneNumber}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              testingSend || !phoneNumber
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {testingSend ? 'Enviando...' : 'Probar'}
          </button>
        </div>
      </div>

      {/* Opciones de notificación */}
      <div className="space-y-4 mb-6">
        <h4 className="font-medium text-gray-700 text-sm">Tipos de Notificación</h4>
        {notificationOptions.map(option => (
          <div key={option.key} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{option.icon}</span>
                <div>
                  <h5 className="font-medium text-gray-800">{option.title}</h5>
                  <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleToggle(option.key)}
              className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings[option.key] ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings[option.key] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3">
        <button
          onClick={saveSettings}
          disabled={saving}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            saving
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-800">
          💡 Los mensajes de WhatsApp son gratuitos. Solo recibirás notificaciones según tu configuración.
        </p>
      </div>
    </div>
  );
};

export default WhatsAppNotificationSettings;
