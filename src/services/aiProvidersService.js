import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';

/**
 * Servicio para gestionar proveedores de IA y sus configuraciones
 * Permite manejar API keys, modelos y configuraciones desde la base de datos
 */
class AIProvidersService {
  constructor() {
    this.cache = {
      providers: null,
      lastFetch: null,
      cacheTimeout: 5 * 60 * 1000 // 5 minutos
    };
  }

  /**
   * Obtiene todos los proveedores de IA desde la base de datos
   */
  async getProviders() {
    try {
      // Verificar cache
      if (this.cache.providers && 
          this.cache.lastFetch && 
          (Date.now() - this.cache.lastFetch) < this.cache.cacheTimeout) {
        return this.cache.providers;
      }

      const { data, error } = await supabase
        .from('ai_providers')
        .select('*')
        .order('display_name');

      if (error) {
        console.error('Error fetching AI providers:', error);
        throw error;
      }

      this.cache.providers = data;
      this.cache.lastFetch = Date.now();

      return data;
    } catch (error) {
      console.error('Error in getProviders:', error);
      throw error;
    }
  }

  /**
   * Obtiene el proveedor activo actualmente
   */
  async getActiveProvider() {
    try {
      const { data, error } = await supabase
        .from('ai_providers')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching active AI provider:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getActiveProvider:', error);
      throw error;
    }
  }

  /**
   * Activa un proveedor y desactiva los demás (exclusión mutua)
   */
  async activateProvider(providerId) {
    try {
      // Primero desactivar todos los proveedores
      const { error: deactivateError } = await supabase
        .from('ai_providers')
        .update({ is_active: false })
        .neq('id', providerId);

      if (deactivateError) {
        console.error('Error deactivating providers:', deactivateError);
        throw deactivateError;
      }

      // Luego activar el proveedor seleccionado
      const { data, error } = await supabase
        .from('ai_providers')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', providerId)
        .select()
        .single();

      if (error) {
        console.error('Error activating provider:', error);
        throw error;
      }

      // Limpiar cache
      this.cache.providers = null;
      this.cache.lastFetch = null;

      return data;
    } catch (error) {
      console.error('Error in activateProvider:', error);
      throw error;
    }
  }

  /**
   * Actualiza la API key de un proveedor
   */
  async updateProviderAPIKey(providerId, apiKey) {
    try {
      const { data, error } = await supabase
        .from('ai_providers')
        .update({ 
          api_key: apiKey,
          updated_at: new Date().toISOString()
        })
        .eq('id', providerId)
        .select()
        .single();

      if (error) {
        console.error('Error updating API key:', error);
        throw error;
      }

      // Limpiar cache
      this.cache.providers = null;
      this.cache.lastFetch = null;

      return data;
    } catch (error) {
      console.error('Error in updateProviderAPIKey:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los modelos disponibles de un proveedor específico
   * Si no están en cache, los obtiene desde la API del proveedor
   */
  async getProviderModels(providerId, options = {}) {
    try {
      const { forceRefresh = false } = options;
      const provider = await this.getProviderById(providerId);
      if (!provider) {
        throw new Error('Provider not found');
      }

      console.log(`🔄 Getting models for ${provider.provider_name}, forceRefresh: ${forceRefresh}`);

      // Si tenemos modelos cacheados y son recientes, los usamos (a menos que se fuerce la actualización)
      const cacheAge = provider.last_models_fetch 
        ? Date.now() - new Date(provider.last_models_fetch).getTime() 
        : Infinity;
      
      const isCacheValid = cacheAge < 60 * 60 * 1000; // 1 hora en lugar de 24 horas
      
      if (!forceRefresh && 
          provider.models_available &&
          provider.models_available.length > 0 &&
          isCacheValid) {
        console.log(`📦 Using cached models for ${provider.provider_name}: ${provider.models_available.length} models`);
        return provider.models_available;
      }

      // Obtener modelos desde la API del proveedor con manejo de errores
      let models = [];
      try {
        console.log(`🌐 Fetching fresh models from ${provider.provider_name} API...`);
        switch (provider.provider_name) {
          case 'groq':
            models = await this.fetchGroqModels(provider.api_key);
            break;
          case 'chutes':
            models = await this.fetchChutesModels(provider.api_key);
            break;
          case 'openai':
            models = await this.fetchOpenAIModels(provider.api_key);
            break;
          default:
            throw new Error(`Unsupported provider: ${provider.provider_name}`);
        }
      } catch (apiError) {
        console.error(`❌ Error fetching models from ${provider.provider_name}:`, apiError);
        
        // Si hay error de API y no se fuerza la actualización, devolver modelos cacheados
        if (!forceRefresh && provider.models_available && provider.models_available.length > 0) {
          console.log(`📦 Using cached models for ${provider.provider_name} due to API error: ${provider.models_available.length} models`);
          return provider.models_available;
        }
        
        // Si se fuerza la actualización o no hay cache, usar modelos por defecto
        models = this.getDefaultModels(provider.provider_name);
        console.log(`🔄 Using default models for ${provider.provider_name}: ${models.length} models`);
      }

      // Actualizar modelos en la base de datos solo si se obtuvieron correctamente
      if (models.length > 0) {
        console.log(`💾 Updating ${models.length} models in database for ${provider.provider_name}`);
        await this.updateProviderModels(providerId, models);
      }

      return models;
    } catch (error) {
      console.error('❌ Error in getProviderModels:', error);
      // En caso de error grave, devolver un array vacío en lugar de lanzar el error
      return [];
    }
  }

  /**
   * Obtiene solo los modelos de embedding de un proveedor
   */
  async getProviderEmbeddingModels(providerId, options = {}) {
    try {
      const provider = await this.getProviderById(providerId);
      if (!provider) {
        throw new Error('Provider not found');
      }

      console.log(`🔍 Getting embedding models for ${provider.provider_name}, forceRefresh: ${options.forceRefresh || false}`);

      // Si tenemos modelos de embedding cacheados y no se fuerza la actualización, los usamos
      const cacheAge = provider.last_models_fetch 
        ? Date.now() - new Date(provider.last_models_fetch).getTime() 
        : Infinity;
      
      const isCacheValid = cacheAge < 60 * 60 * 1000; // 1 hora
      
      if (!options.forceRefresh && 
          provider.embedding_models && 
          provider.embedding_models.length > 0 && 
          isCacheValid) {
        console.log(`📦 Using cached embedding models for ${provider.provider_name}: ${provider.embedding_models.length} models`);
        return provider.embedding_models;
      }

      // Obtener todos los modelos y filtrar los de embedding
      console.log(`🌐 Fetching fresh embedding models for ${provider.provider_name}...`);
      const allModels = await this.getProviderModels(providerId, options);
      const embeddingModels = allModels.filter(model => 
        model.name.toLowerCase().includes('embed') ||
        model.description?.toLowerCase().includes('embed') ||
        model.capabilities?.includes('embedding')
      );

      console.log(`🎯 Found ${embeddingModels.length} embedding models for ${provider.provider_name}`);

      // Actualizar modelos de embedding en la base de datos
      await this.updateProviderEmbeddingModels(providerId, embeddingModels);

      return embeddingModels;
    } catch (error) {
      console.error('❌ Error in getProviderEmbeddingModels:', error);
      throw error;
    }
  }

  /**
   * Obtiene solo los modelos de chat de un proveedor
   */
  async getProviderChatModels(providerId, options = {}) {
    try {
      const provider = await this.getProviderById(providerId);
      if (!provider) {
        throw new Error('Provider not found');
      }

      console.log(`💬 Getting chat models for ${provider.provider_name}, forceRefresh: ${options.forceRefresh || false}`);

      // Si tenemos modelos de chat cacheados y no se fuerza la actualización, los usamos
      const cacheAge = provider.last_models_fetch 
        ? Date.now() - new Date(provider.last_models_fetch).getTime() 
        : Infinity;
      
      const isCacheValid = cacheAge < 60 * 60 * 1000; // 1 hora
      
      if (!options.forceRefresh && 
          provider.chat_models && 
          provider.chat_models.length > 0 && 
          isCacheValid) {
        console.log(`📦 Using cached chat models for ${provider.provider_name}: ${provider.chat_models.length} models`);
        return provider.chat_models;
      }

      // Obtener todos los modelos y filtrar los de chat
      console.log(`🌐 Fetching fresh chat models for ${provider.provider_name}...`);
      const allModels = await this.getProviderModels(providerId, options);
      const chatModels = allModels.filter(model => 
        !model.name.toLowerCase().includes('embed') &&
        (!model.description?.toLowerCase().includes('embed')) &&
        (!model.capabilities?.includes('embedding'))
      );

      console.log(`🎯 Found ${chatModels.length} chat models for ${provider.provider_name}`);

      // Actualizar modelos de chat en la base de datos
      await this.updateProviderChatModels(providerId, chatModels);

      return chatModels;
    } catch (error) {
      console.error('❌ Error in getProviderChatModels:', error);
      throw error;
    }
  }

  /**
   * Obtiene un proveedor por su ID
   */
  async getProviderById(providerId) {
    try {
      const { data, error } = await supabase
        .from('ai_providers')
        .select('*')
        .eq('id', providerId)
        .single();

      if (error) {
        console.error('Error fetching provider by ID:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getProviderById:', error);
      throw error;
    }
  }

  /**
   * Actualiza la lista de modelos de un proveedor
   */
  async updateProviderModels(providerId, models) {
    try {
      const { error } = await supabase
        .from('ai_providers')
        .update({ 
          models_available: models,
          last_models_fetch: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', providerId);

      if (error) {
        console.error('Error updating provider models:', error);
        throw error;
      }

      // Limpiar cache
      this.cache.providers = null;
      this.cache.lastFetch = null;
    } catch (error) {
      console.error('Error in updateProviderModels:', error);
      throw error;
    }
  }

  /**
   * Actualiza los modelos de embedding de un proveedor
   */
  async updateProviderEmbeddingModels(providerId, embeddingModels) {
    try {
      const { error } = await supabase
        .from('ai_providers')
        .update({ 
          embedding_models: embeddingModels,
          updated_at: new Date().toISOString()
        })
        .eq('id', providerId);

      if (error) {
        console.error('Error updating embedding models:', error);
        throw error;
      }

      // Limpiar cache
      this.cache.providers = null;
      this.cache.lastFetch = null;
    } catch (error) {
      console.error('Error in updateProviderEmbeddingModels:', error);
      throw error;
    }
  }

  /**
   * Actualiza los modelos de chat de un proveedor
   */
  async updateProviderChatModels(providerId, chatModels) {
    try {
      const { error } = await supabase
        .from('ai_providers')
        .update({ 
          chat_models: chatModels,
          updated_at: new Date().toISOString()
        })
        .eq('id', providerId);

      if (error) {
        console.error('Error updating chat models:', error);
        throw error;
      }

      // Limpiar cache
      this.cache.providers = null;
      this.cache.lastFetch = null;
    } catch (error) {
      console.error('Error in updateProviderChatModels:', error);
      throw error;
    }
  }

  /**
   * Obtiene modelos desde la API de Groq
   */
  async fetchGroqModels(apiKey) {
    try {
      console.log('🔍 Fetching Groq models...');
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Groq API error response:', errorText);
        throw new Error(`Groq API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ Groq API returned ${data.data?.length || 0} models`);
      
      // Mostrar primeros 5 modelos para diagnóstico
      if (data.data && data.data.length > 0) {
        console.log('📋 First 5 Groq models:', data.data.slice(0, 5).map(m => m.id));
      }
      
      // Formatear modelos y ordenar alfabéticamente
      const models = data.data
        .map(model => ({
          id: model.id,
          name: model.id,
          description: `${model.id} - Context: ${model.context_window || 'N/A'}`,
          capabilities: ['chat', 'completion'],
          context_window: model.context_window,
          provider: 'groq',
          isRecommended: model.id.includes('70b') || model.id.includes('8b'),
          isDefault: model.id === 'llama-3.1-8b-instant'
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      console.log(`🎯 Formatted ${models.length} Groq models`);
      return models;
    } catch (error) {
      console.error('❌ Error fetching Groq models:', error);
      throw error;
    }
  }

  /**
   * Obtiene modelos desde la API de Chutes
   */
  async fetchChutesModels(apiKey) {
    try {
      console.log('🔍 Fetching Chutes models...');
      
      // Intentar diferentes endpoints de Chutes
      const endpoints = [
        'https://api.chutes.ai/v1/models',
        'https://api.chutes.ai/openai/v1/models',
        'https://chutes.ai/v1/models',
        'https://chutes.ai/openai/v1/models'
      ];
      
      let modelsData = null;
      let workingEndpoint = null;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`🔍 Probando endpoint: ${endpoint}`);
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.data && Array.isArray(data.data)) {
              modelsData = data;
              workingEndpoint = endpoint;
              console.log(`✅ Endpoint funcional encontrado: ${endpoint}`);
              break;
            }
          }
        } catch (endpointError) {
          console.log(`❌ Endpoint ${endpoint} no funciona:`, endpointError.message);
          continue;
        }
      }
      
      if (modelsData) {
        console.log(`✅ Chutes API returned ${modelsData.data?.length || 0} models`);
        
        // Mostrar primeros 5 modelos para diagnóstico
        if (modelsData.data && modelsData.data.length > 0) {
          console.log('📋 First 5 Chutes models:', modelsData.data.slice(0, 5).map(m => m.id));
        }
        
        // Formatear modelos y ordenar alfabéticamente
        const models = modelsData.data
          .map(model => ({
            id: model.id,
            name: model.id,
            description: model.description || `${model.id} - Chutes AI Model`,
            capabilities: model.capabilities || ['chat', 'completion'],
            provider: 'chutes',
            context_window: model.context_window || 4096,
            isRecommended: model.id.includes('gpt-4') || model.id.includes('claude'),
            isDefault: model.id === 'chutes-gpt-3.5-turbo'
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        console.log(`🎯 Formatted ${models.length} Chutes models`);
        return models;
      } else {
        console.warn('⚠️ No se encontró ningún endpoint funcional para Chutes');
        throw new Error('No se encontró endpoint funcional para Chutes');
      }
    } catch (error) {
      console.error('❌ Error fetching Chutes models:', error);
      console.log('🔄 Usando modelos fallback conocidos de Chutes...');
      
      // Retornar modelos fallback conocidos de Chutes
      // Estos son modelos típicos que suelen estar disponibles
      return [
        {
          id: 'chutes/embedding-small',
          name: 'chutes/embedding-small',
          description: 'Modelo de embedding pequeño de Chutes',
          capabilities: ['embedding'],
          provider: 'chutes',
          context_window: 512,
          isRecommended: false,
          isDefault: false
        },
        {
          id: 'chutes/embedding-large',
          name: 'chutes/embedding-large',
          description: 'Modelo de embedding grande de Chutes',
          capabilities: ['embedding'],
          provider: 'chutes',
          context_window: 2048,
          isRecommended: true,
          isDefault: true
        },
        {
          id: 'chutes/chat-small',
          name: 'chutes/chat-small',
          description: 'Modelo de chat pequeño de Chutes',
          capabilities: ['chat', 'completion'],
          provider: 'chutes',
          context_window: 4096,
          isRecommended: false,
          isDefault: false
        },
        {
          id: 'chutes/chat-large',
          name: 'chutes/chat-large',
          description: 'Modelo de chat grande de Chutes',
          capabilities: ['chat', 'completion'],
          provider: 'chutes',
          context_window: 8192,
          isRecommended: true,
          isDefault: false
        }
      ].sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  /**
   * Obtiene modelos desde la API de OpenAI
   */
  async fetchOpenAIModels(apiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Formatear modelos y ordenar alfabéticamente
      const models = data.data
        .map(model => ({
          id: model.id,
          name: model.id,
          description: `${model.id} - Owned by: ${model.owned_by}`,
          capabilities: model.id.includes('embed') ? ['embedding'] : ['chat', 'completion'],
          owned_by: model.owned_by,
          provider: 'openai'
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return models;
    } catch (error) {
      console.error('Error fetching OpenAI models:', error);
      throw error;
    }
  }

  /**
   * Limpia la cache local
   */
  clearCache() {
    this.cache.providers = null;
    this.cache.lastFetch = null;
  }

  /**
   * Obtiene la configuración actual para el sistema de importación
   */
  async getImportConfiguration() {
    try {
      // Para el sistema de importación, siempre usamos Groq
      const groqProvider = await this.getProviderByName('groq');
      if (!groqProvider) {
        throw new Error('Groq provider not found');
      }

      const chatModels = await this.getProviderChatModels(groqProvider.id);

      return {
        provider: groqProvider,
        models: chatModels,
        apiKey: groqProvider.api_key
      };
    } catch (error) {
      console.error('Error in getImportConfiguration:', error);
      throw error;
    }
  }

  /**
   * Obtiene la configuración actual para el sistema RAG
   */
  async getRAGConfiguration() {
    try {
      const providers = await this.getProviders();
      const activeProvider = providers.find(p => p.is_active);
      
      if (!activeProvider) {
        throw new Error('No active AI provider found');
      }

      const embeddingModels = await this.getProviderEmbeddingModels(activeProvider.id);

      return {
        provider: activeProvider,
        models: embeddingModels,
        apiKey: activeProvider.api_key
      };
    } catch (error) {
      console.error('Error in getRAGConfiguration:', error);
      throw error;
    }
  }

  /**
   * Obtiene un proveedor por su nombre
   */
  async getProviderByName(providerName) {
    try {
      const { data, error } = await supabase
        .from('ai_providers')
        .select('*')
        .eq('provider_name', providerName)
        .single();

      if (error) {
        console.error('Error fetching provider by name:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getProviderByName:', error);
      throw error;
    }
  }

  /**
   * Obtiene modelos por defecto para un proveedor cuando la API falla
   */
  getDefaultModels(providerName) {
    switch (providerName) {
      case 'groq':
        return [
          {
            id: 'llama-3.1-70b-versatile',
            name: 'llama-3.1-70b-versatile',
            description: 'Llama 3.1 70B Versatile - Groq',
            capabilities: ['chat', 'completion'],
            context_window: 131072,
            provider: 'groq'
          },
          {
            id: 'llama-3.1-8b-instant',
            name: 'llama-3.1-8b-instant',
            description: 'Llama 3.1 8B Instant - Groq',
            capabilities: ['chat', 'completion'],
            context_window: 131072,
            provider: 'groq'
          },
          {
            id: 'mixtral-8x7b-32768',
            name: 'mixtral-8x7b-32768',
            description: 'Mixtral 8x7B 32K - Groq',
            capabilities: ['chat', 'completion'],
            context_window: 32768,
            provider: 'groq'
          }
        ].sort((a, b) => a.name.localeCompare(b.name));
      
      case 'chutes':
        return [
          {
            id: 'chutes-gpt-4',
            name: 'chutes-gpt-4',
            description: 'Chutes GPT-4 Model',
            capabilities: ['chat', 'completion'],
            provider: 'chutes'
          },
          {
            id: 'chutes-gpt-3.5-turbo',
            name: 'chutes-gpt-3.5-turbo',
            description: 'Chutes GPT-3.5 Turbo',
            capabilities: ['chat', 'completion'],
            provider: 'chutes'
          }
        ].sort((a, b) => a.name.localeCompare(b.name));
      
      case 'openai':
        return [
          {
            id: 'gpt-4',
            name: 'gpt-4',
            description: 'GPT-4 - OpenAI',
            capabilities: ['chat', 'completion'],
            provider: 'openai'
          },
          {
            id: 'gpt-3.5-turbo',
            name: 'gpt-3.5-turbo',
            description: 'GPT-3.5 Turbo - OpenAI',
            capabilities: ['chat', 'completion'],
            provider: 'openai'
          }
        ].sort((a, b) => a.name.localeCompare(b.name));
      
      default:
        return [];
    }
  }
}

export const aiProvidersService = new AIProvidersService();
export default aiProvidersService;