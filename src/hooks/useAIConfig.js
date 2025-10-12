/**
 * Custom Hook para gestión de configuración de IA
 *
 * Extrae toda la lógica de configuración de servicios de IA
 * para mantener los componentes más limpios y reutilizables
 */

import { useState, useEffect } from 'react';
import { updateSystemConfig } from '../services/databaseService';
import Swal from 'sweetalert2';

export const useAIConfig = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Configuración de IA
  const [aiConfig, setAiConfig] = useState({
    selectedProvider: 'chutes',
    selectedModel: 'gpt-4',
    chutesApi: {
      apiKey: '',
      baseUrl: 'https://chutes.ai',
      isActive: false
    },
    groqApi: {
      apiKey: '',
      baseUrl: 'https://api.groq.com',
      isActive: false
    }
  });

  // Cargar configuración guardada al iniciar
  useEffect(() => {
    const loadSavedConfig = async () => {
      try {
        const { getSystemConfig } = await import('../services/databaseService');
        const { config, error } = await getSystemConfig();

        if (!error && config) {
          setAiConfig(prev => ({
            selectedProvider: config.aiSelectedProvider || 'chutes',
            selectedModel: config.aiSelectedModel || 'gpt-4',
            chutesApi: {
              apiKey: config.chutesApiKey || '',
              baseUrl: 'https://chutes.ai',
              isActive: config.chutesApiActive || false
            },
            groqApi: {
              apiKey: config.groqApiKey || '',
              baseUrl: 'https://api.groq.com',
              isActive: config.groqApiActive || false
            }
          }));
        }
      } catch (error) {
        console.error('❌ Error en loadSavedConfig:', error);
      }
    };

    loadSavedConfig();
  }, []);

  // Actualizar configuración
  const updateConfig = (updates) => {
    setAiConfig(prev => ({
      ...prev,
      ...updates
    }));
  };

  // Actualizar API de Chutes
  const updateChutesApi = (updates) => {
    setAiConfig(prev => ({
      ...prev,
      chutesApi: {
        ...prev.chutesApi,
        ...updates
      }
    }));
  };

  // Actualizar API de Groq
  const updateGroqApi = (updates) => {
    setAiConfig(prev => ({
      ...prev,
      groqApi: {
        ...prev.groqApi,
        ...updates
      }
    }));
  };

  // Guardar configuración de servicio específico
  const saveServiceConfig = async (serviceType) => {
    try {
      setSaving(true);

      let configToSave = {};

      if (serviceType === 'Chutes AI') {
        configToSave = {
          chutes_api_key: aiConfig.chutesApi.apiKey,
          chutes_api_url: aiConfig.chutesApi.baseUrl,
          chutes_api_active: aiConfig.chutesApi.isActive
        };
      } else if (serviceType === 'Groq AI') {
        configToSave = {
          groq_api_key: aiConfig.groqApi.apiKey,
          groq_api_url: aiConfig.groqApi.baseUrl,
          groq_api_active: aiConfig.groqApi.isActive
        };
      }

      const result = await updateSystemConfig(configToSave);

      if (result.error) {
        throw new Error(result.error);
      }

      await Swal.fire({
        icon: 'success',
        title: 'Configuración guardada',
        text: `Configuración de ${serviceType} guardada exitosamente`,
        confirmButtonText: 'Aceptar'
      });

    } catch (error) {
      console.error(`❌ Error saving ${serviceType}:`, error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: `No se pudo guardar la configuración de ${serviceType}. ${error.message}`,
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setSaving(false);
    }
  };

  // Guardar selección de modelo
  const saveModelSelection = async () => {
    try {
      setSaving(true);

      const configToSave = {
        ai_selected_provider: aiConfig.selectedProvider,
        ai_selected_model: aiConfig.selectedModel
      };

      const result = await updateSystemConfig(configToSave);

      if (result.error) {
        throw new Error(result.error);
      }

      await Swal.fire({
        icon: 'success',
        title: 'Configuración guardada',
        text: 'Selección de modelo guardada exitosamente',
        confirmButtonText: 'Aceptar'
      });

    } catch (error) {
      console.error('Error saving model selection:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: error.message || 'No se pudo guardar la selección de modelo',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setSaving(false);
    }
  };

  // Probar servicio
  const testService = async (serviceType) => {
    try {
      await Swal.fire({
        icon: 'info',
        title: 'Probando servicio',
        text: `Probando conexión con ${serviceType}...`,
        showConfirmButton: false,
        timer: 2000
      });
    } catch (error) {
      console.error(`Error testing ${serviceType}:`, error);
      await Swal.fire({
        icon: 'error',
        title: 'Error en la prueba',
        text: `No se pudo probar el servicio de ${serviceType}`,
        confirmButtonText: 'Aceptar'
      });
    }
  };

  // Probar modelo
  const testModel = async () => {
    try {
      await Swal.fire({
        icon: 'info',
        title: 'Probando modelo',
        text: `Probando modelo ${aiConfig.selectedModel}...`,
        showConfirmButton: false,
        timer: 2000
      });
    } catch (error) {
      console.error('Error testing model:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error en la prueba',
        text: 'No se pudo probar el modelo seleccionado',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  return {
    // Estados
    aiConfig,
    loading,
    saving,

    // Acciones
    updateConfig,
    updateChutesApi,
    updateGroqApi,
    saveServiceConfig,
    saveModelSelection,
    testService,
    testModel
  };
};