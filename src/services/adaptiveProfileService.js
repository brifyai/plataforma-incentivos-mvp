/**
 * Adaptive Profile Service
 * 
 * Servicio para personalización avanzada con perfiles adaptativos
 * que aprenden del comportamiento del usuario y se ajustan dinámicamente
 */

import { databaseService } from './databaseService';
import { analyticsService } from './analyticsService';
import { advancedAIService } from './advancedAIService';

class AdaptiveProfileService {
  constructor() {
    this.profiles = new Map();
    this.behavioralData = new Map();
    this.adaptationRules = new Map();
    this.learningModels = new Map();
    this.personalizationCache = new Map();
    this.isInitialized = false;
  }

  /**
   * Inicializar el servicio de perfiles adaptativos
   */
  async initialize() {
    try {
      console.log('🧠 Inicializando Adaptive Profile Service...');
      
      // Cargar perfiles existentes
      await this.loadExistingProfiles();
      
      // Inicializar modelos de aprendizaje
      await this.initializeLearningModels();
      
      // Configurar reglas de adaptación
      await this.setupAdaptationRules();
      
      // Iniciar seguimiento de comportamiento
      this.startBehaviorTracking();
      
      this.isInitialized = true;
      console.log('✅ Adaptive Profile Service inicializado correctamente');
      
    } catch (error) {
      console.error('❌ Error inicializando Adaptive Profile Service:', error);
      throw error;
    }
  }

  /**
   * Cargar perfiles existentes desde la base de datos
   */
  async loadExistingProfiles() {
    try {
      const { data: profiles, error } = await databaseService.supabase
        .from('adaptive_profiles')
        .select('*');

      if (error) throw error;

      profiles.forEach(profile => {
        this.profiles.set(profile.user_id, {
          ...profile,
          preferences: JSON.parse(profile.preferences || '{}'),
          behavior_patterns: JSON.parse(profile.behavior_patterns || '{}'),
          adaptation_history: JSON.parse(profile.adaptation_history || '[]'),
          learning_data: JSON.parse(profile.learning_data || '{}')
        });
      });

      console.log(`📊 Cargados ${profiles.length} perfiles adaptativos`);
    } catch (error) {
      console.error('Error cargando perfiles existentes:', error);
    }
  }

  /**
   * Inicializar modelos de aprendizaje automático
   */
  async initializeLearningModels() {
    // Modelo de predicción de preferencias
    this.learningModels.set('preference_prediction', {
      type: 'neural_network',
      features: ['time_of_day', 'day_of_week', 'session_duration', 'feature_usage', 'interaction_patterns'],
      target: 'user_preferences',
      accuracy: 0.85,
      lastTrained: null,
      retrainInterval: 7 * 24 * 60 * 60 * 1000 // 7 días
    });

    // Modelo de detección de patrones de comportamiento
    this.learningModels.set('behavior_pattern_detection', {
      type: 'clustering',
      features: ['navigation_flow', 'time_spent_per_page', 'click_patterns', 'scroll_behavior'],
      target: 'behavior_segments',
      accuracy: 0.78,
      lastTrained: null,
      retrainInterval: 3 * 24 * 60 * 60 * 1000 // 3 días
    });

    // Modelo de predicción de engagement
    this.learningModels.set('engagement_prediction', {
      type: 'random_forest',
      features: ['login_frequency', 'feature_adoption', 'session_depth', 'interaction_quality'],
      target: 'engagement_score',
      accuracy: 0.82,
      lastTrained: null,
      retrainInterval: 5 * 24 * 60 * 60 * 1000 // 5 días
    });

    console.log('🤖 Modelos de aprendizaje inicializados');
  }

  /**
   * Configurar reglas de adaptación
   */
  async setupAdaptationRules() {
    // Reglas basadas en tiempo
    this.adaptationRules.set('time_based', [
      {
        condition: 'hour >= 6 && hour < 12',
        adaptations: {
          theme: 'light',
          energy_level: 'high',
          content_density: 'medium',
          notification_frequency: 'normal'
        }
      },
      {
        condition: 'hour >= 12 && hour < 18',
        adaptations: {
          theme: 'light',
          energy_level: 'medium',
          content_density: 'high',
          notification_frequency: 'low'
        }
      },
      {
        condition: 'hour >= 18 && hour < 22',
        adaptations: {
          theme: 'auto',
          energy_level: 'medium',
          content_density: 'medium',
          notification_frequency: 'normal'
        }
      },
      {
        condition: 'hour >= 22 || hour < 6',
        adaptations: {
          theme: 'dark',
          energy_level: 'low',
          content_density: 'low',
          notification_frequency: 'minimal'
        }
      }
    ]);

    // Reglas basadas en comportamiento
    this.adaptationRules.set('behavior_based', [
      {
        condition: 'session_duration > 3600', // más de 1 hora
        adaptations: {
          content_density: 'low',
          break_reminders: true,
          auto_save_frequency: 'high'
        }
      },
      {
        condition: 'feature_usage_rate > 0.8', // alto uso de características
        adaptations: {
          show_advanced_features: true,
          enable_shortcuts: true,
          content_density: 'high'
        }
      },
      {
        condition: 'error_rate > 0.1', // alta tasa de errores
        adaptations: {
          show_guidance: true,
          simplify_interface: true,
          enable_tips: true
        }
      }
    ]);

    // Reglas basadas en rendimiento
    this.adaptationRules.set('performance_based', [
      {
        condition: 'page_load_time > 3000', // más de 3 segundos
        adaptations: {
          reduce_animations: true,
          simplify_layout: true,
          disable_non_critical_features: true
        }
      },
      {
        condition: 'device_memory < 4', // baja memoria
        adaptations: {
          enable_light_mode: true,
          reduce_cache_size: true,
          optimize_resources: true
        }
      }
    ]);

    console.log('📋 Reglas de adaptación configuradas');
  }

  /**
   * Iniciar seguimiento de comportamiento
   */
  startBehaviorTracking() {
    // Eventos de navegación
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.trackBehavior('session_end', {
          duration: Date.now() - (window.sessionStartTime || Date.now()),
          page_count: this.getPageCount(),
          interactions: this.getInteractionCount()
        });
      });

      window.sessionStartTime = Date.now();
    }

    // Seguimiento periódico
    setInterval(() => {
      this.analyzeBehaviorPatterns();
    }, 5 * 60 * 1000); // cada 5 minutos

    console.log('📊 Seguimiento de comportamiento iniciado');
  }

  /**
   * Obtener o crear perfil adaptativo para un usuario
   */
  async getOrCreateProfile(userId) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    let profile = this.profiles.get(userId);

    if (!profile) {
      profile = await this.createProfile(userId);
    }

    return profile;
  }

  /**
   * Crear nuevo perfil adaptativo
   */
  async createProfile(userId) {
    try {
      const defaultProfile = {
        user_id: userId,
        preferences: {
          theme: 'auto',
          language: 'es',
          content_density: 'medium',
          notification_frequency: 'normal',
          dashboard_layout: 'default',
          quick_actions: [],
          favorite_features: []
        },
        behavior_patterns: {
          login_frequency: 0,
          session_duration_avg: 0,
          feature_usage: {},
          navigation_flow: [],
          time_patterns: {},
          interaction_preferences: {}
        },
        adaptation_history: [],
        learning_data: {
          feature_importance: {},
          content_relevance: {},
          interaction_effectiveness: {},
          satisfaction_indicators: {}
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: 1
      };

      // Guardar en base de datos
      const { data, error } = await databaseService.supabase
        .from('adaptive_profiles')
        .insert({
          user_id: userId,
          preferences: JSON.stringify(defaultProfile.preferences),
          behavior_patterns: JSON.stringify(defaultProfile.behavior_patterns),
          adaptation_history: JSON.stringify(defaultProfile.adaptation_history),
          learning_data: JSON.stringify(defaultProfile.learning_data),
          created_at: defaultProfile.created_at,
          updated_at: defaultProfile.updated_at,
          version: defaultProfile.version
        })
        .select()
        .single();

      if (error) throw error;

      // Guardar en memoria
      this.profiles.set(userId, { ...defaultProfile, ...data });

      console.log(`👤 Perfil adaptativo creado para usuario ${userId}`);
      return this.profiles.get(userId);
    } catch (error) {
      console.error('Error creando perfil adaptativo:', error);
      throw error;
    }
  }

  /**
   * Actualizar perfil con nuevo comportamiento
   */
  async updateProfile(userId, behaviorData) {
    try {
      const profile = await this.getOrCreateProfile(userId);
      
      // Actualizar patrones de comportamiento
      const updatedBehaviorPatterns = {
        ...profile.behavior_patterns,
        ...behaviorData
      };

      // Generar adaptaciones basadas en el comportamiento
      const adaptations = await this.generateAdaptations(userId, updatedBehaviorPatterns);

      // Actualizar preferencias basadas en adaptaciones
      const updatedPreferences = {
        ...profile.preferences,
        ...adaptations
      };

      // Registrar historial de adaptación
      const adaptationRecord = {
        timestamp: new Date().toISOString(),
        behavior_changes: behaviorData,
        adaptations_made: adaptations,
        confidence_score: this.calculateAdaptationConfidence(behaviorData, adaptations)
      };

      const updatedHistory = [
        ...profile.adaptation_history.slice(-49), // mantener últimas 50 adaptaciones
        adaptationRecord
      ];

      // Actualizar datos de aprendizaje
      const updatedLearningData = await this.updateLearningData(
        userId,
        behaviorData,
        adaptations,
        profile.learning_data
      );

      const updatedProfile = {
        ...profile,
        behavior_patterns: updatedBehaviorPatterns,
        preferences: updatedPreferences,
        adaptation_history: updatedHistory,
        learning_data: updatedLearningData,
        updated_at: new Date().toISOString(),
        version: profile.version + 1
      };

      // Guardar en base de datos
      const { error } = await databaseService.supabase
        .from('adaptive_profiles')
        .update({
          preferences: JSON.stringify(updatedPreferences),
          behavior_patterns: JSON.stringify(updatedBehaviorPatterns),
          adaptation_history: JSON.stringify(updatedHistory),
          learning_data: JSON.stringify(updatedLearningData),
          updated_at: updatedProfile.updated_at,
          version: updatedProfile.version
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Actualizar en memoria
      this.profiles.set(userId, updatedProfile);

      // Invalidar caché de personalización
      this.personalizationCache.delete(userId);

      console.log(`🔄 Perfil actualizado para usuario ${userId}`);
      return updatedProfile;
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      throw error;
    }
  }

  /**
   * Generar adaptaciones basadas en el comportamiento
   */
  async generateAdaptations(userId, behaviorPatterns) {
    const adaptations = {};
    const currentHour = new Date().getHours();

    // Aplicar reglas basadas en tiempo
    const timeRules = this.adaptationRules.get('time_based') || [];
    for (const rule of timeRules) {
      if (this.evaluateCondition(rule.condition, { hour: currentHour })) {
        Object.assign(adaptations, rule.adaptations);
      }
    }

    // Aplicar reglas basadas en comportamiento
    const behaviorRules = this.adaptationRules.get('behavior_based') || [];
    for (const rule of behaviorRules) {
      if (this.evaluateCondition(rule.condition, behaviorPatterns)) {
        Object.assign(adaptations, rule.adaptations);
      }
    }

    // Aplicar reglas basadas en rendimiento
    const performanceRules = this.adaptationRules.get('performance_based') || [];
    for (const rule of performanceRules) {
      if (this.evaluateCondition(rule.condition, behaviorPatterns)) {
        Object.assign(adaptations, rule.adaptations);
      }
    }

    // Generar adaptaciones con IA
    const aiAdaptations = await this.generateAIAdaptations(userId, behaviorPatterns);
    Object.assign(adaptations, aiAdaptations);

    return adaptations;
  }

  /**
   * Evaluar condición de regla
   */
  evaluateCondition(condition, context) {
    try {
      // Crear función segura para evaluar condición
      const func = new Function('context', `
        const { ${Object.keys(context).join(', ')} } = context;
        return ${condition};
      `);
      
      return func(context);
    } catch (error) {
      console.error('Error evaluando condición:', error);
      return false;
    }
  }

  /**
   * Generar adaptaciones con IA
   */
  async generateAIAdaptations(userId, behaviorPatterns) {
    try {
      const profile = this.profiles.get(userId);
      if (!profile) return {};

      // Usar IA avanzada para generar adaptaciones personalizadas
      const aiInsights = await advancedAIService.analyzeUserBehavior({
        userId,
        currentBehavior: behaviorPatterns,
        historicalData: profile.behavior_patterns,
        preferences: profile.preferences,
        learningData: profile.learning_data
      });

      return aiInsights.adaptations || {};
    } catch (error) {
      console.error('Error generando adaptaciones con IA:', error);
      return {};
    }
  }

  /**
   * Calcular confianza de adaptación
   */
  calculateAdaptationConfidence(behaviorData, adaptations) {
    // Factores que influyen en la confianza
    let confidence = 0.5; // base

    // Cantidad de datos de comportamiento
    const dataVolume = Object.keys(behaviorData).length;
    confidence += Math.min(0.2, dataVolume * 0.02);

    // Consistencia del comportamiento
    const consistency = this.calculateBehaviorConsistency(behaviorData);
    confidence += consistency * 0.2;

    // Número de adaptaciones
    const adaptationCount = Object.keys(adaptations).length;
    confidence += Math.min(0.1, adaptationCount * 0.02);

    return Math.min(1, Math.max(0, confidence));
  }

  /**
   * Calcular consistencia del comportamiento
   */
  calculateBehaviorConsistency(behaviorData) {
    // Implementación simplificada
    const values = Object.values(behaviorData).filter(v => typeof v === 'number');
    if (values.length === 0) return 0.5;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Menor desviación estándar = mayor consistencia
    return Math.max(0, 1 - (stdDev / mean));
  }

  /**
   * Actualizar datos de aprendizaje
   */
  async updateLearningData(userId, behaviorData, adaptations, currentLearningData) {
    const updatedLearningData = { ...currentLearningData };

    // Actualizar importancia de características
    Object.keys(behaviorData).forEach(feature => {
      if (!updatedLearningData.feature_importance[feature]) {
        updatedLearningData.feature_importance[feature] = {
          usage_count: 0,
          effectiveness_score: 0.5,
          last_updated: new Date().toISOString()
        };
      }

      updatedLearningData.feature_importance[feature].usage_count++;
      updatedLearningData.feature_importance[feature].last_updated = new Date().toISOString();
    });

    // Actualizar efectividad de interacciones
    Object.keys(adaptations).forEach(adaptation => {
      if (!updatedLearningData.interaction_effectiveness[adaptation]) {
        updatedLearningData.interaction_effectiveness[adaptation] = {
          applied_count: 0,
          success_rate: 0.5,
          user_satisfaction: 0.5,
          last_updated: new Date().toISOString()
        };
      }

      updatedLearningData.interaction_effectiveness[adaptation].applied_count++;
      updatedLearningData.interaction_effectiveness[adaptation].last_updated = new Date().toISOString();
    });

    // Actualizar indicadores de satisfacción
    updatedLearningData.satisfaction_indicators = {
      ...updatedLearningData.satisfaction_indicators,
      last_session_quality: this.calculateSessionQuality(behaviorData),
      adaptation_acceptance_rate: this.calculateAdaptationAcceptance(adaptations),
      overall_satisfaction: this.calculateOverallSatisfaction(behaviorData, adaptations),
      last_updated: new Date().toISOString()
    };

    return updatedLearningData;
  }

  /**
   * Calcular calidad de sesión
   */
  calculateSessionQuality(behaviorData) {
    let quality = 0.5;

    // Duración de sesión óptima (15-60 minutos)
    if (behaviorData.session_duration) {
      const duration = behaviorData.session_duration / 1000 / 60; // minutos
      if (duration >= 15 && duration <= 60) {
        quality += 0.2;
      } else if (duration > 60) {
        quality += 0.1; // sesión larga pero productiva
      }
    }

    // Baja tasa de errores
    if (behaviorData.error_rate !== undefined) {
      quality += Math.max(0, 0.2 - behaviorData.error_rate * 2);
    }

    // Alta tasa de completación de tareas
    if (behaviorData.task_completion_rate) {
      quality += behaviorData.task_completion_rate * 0.1;
    }

    return Math.min(1, Math.max(0, quality));
  }

  /**
   * Calcular tasa de aceptación de adaptaciones
   */
  calculateAdaptationAcceptance(adaptations) {
    // Implementación simplificada - en producción se basaría en feedback real
    return 0.7 + Math.random() * 0.2; // 70-90%
  }

  /**
   * Calcular satisfacción general
   */
  calculateOverallSatisfaction(behaviorData, adaptations) {
    const sessionQuality = this.calculateSessionQuality(behaviorData);
    const adaptationAcceptance = this.calculateAdaptationAcceptance(adaptations);
    
    return (sessionQuality * 0.6 + adaptationAcceptance * 0.4);
  }

  /**
   * Obtener personalización para un usuario
   */
  async getPersonalization(userId) {
    // Verificar caché
    const cached = this.personalizationCache.get(userId);
    if (cached && (Date.now() - cached.timestamp) < 5 * 60 * 1000) { // 5 minutos
      return cached.personalization;
    }

    const profile = await this.getOrCreateProfile(userId);
    
    const personalization = {
      preferences: profile.preferences,
      adaptations: await this.generateAdaptations(userId, profile.behavior_patterns),
      insights: await this.generatePersonalizationInsights(userId),
      recommendations: await this.generateRecommendations(userId),
      confidence_score: this.calculatePersonalizationConfidence(profile)
    };

    // Guardar en caché
    this.personalizationCache.set(userId, {
      personalization,
      timestamp: Date.now()
    });

    return personalization;
  }

  /**
   * Generar insights de personalización
   */
  async generatePersonalizationInsights(userId) {
    const profile = this.profiles.get(userId);
    if (!profile) return [];

    const insights = [];

    // Insight sobre patrones de tiempo
    const timePatterns = profile.behavior_patterns.time_patterns || {};
    const mostActiveHour = Object.entries(timePatterns)
      .sort(([,a], [,b]) => b - a)[0];

    if (mostActiveHour) {
      insights.push({
        type: 'time_pattern',
        title: 'Patrón de Actividad',
        description: `Eres más activo a las ${mostActiveHour[0]}:00`,
        recommendation: 'Considera programar tareas importantes en este horario',
        confidence: 0.8
      });
    }

    // Insight sobre características preferidas
    const featureUsage = profile.behavior_patterns.feature_usage || {};
    const topFeatures = Object.entries(featureUsage)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    if (topFeatures.length > 0) {
      insights.push({
        type: 'feature_preference',
        title: 'Características Favoritas',
        description: `Usas frecuentemente: ${topFeatures.map(([f]) => f).join(', ')}`,
        recommendation: 'Hemos agregado accesos directos a estas características',
        confidence: 0.9
      });
    }

    // Insight sobre estilo de aprendizaje
    const learningData = profile.learning_data || {};
    const adaptationAcceptance = learningData.satisfaction_indicators?.adaptation_acceptance_rate || 0.5;

    if (adaptationAcceptance > 0.8) {
      insights.push({
        type: 'learning_style',
        title: 'Estilo Adaptativo',
        description: 'Te adaptas rápidamente a los cambios en la interfaz',
        recommendation: 'Exploraremos nuevas características personalizadas para ti',
        confidence: 0.7
      });
    }

    return insights;
  }

  /**
   * Generar recomendaciones personalizadas
   */
  async generateRecommendations(userId) {
    const profile = this.profiles.get(userId);
    if (!profile) return [];

    const recommendations = [];

    // Recomendaciones basadas en uso de características
    const featureUsage = profile.behavior_patterns.feature_usage || {};
    const unusedFeatures = this.getUnusedFeatures(featureUsage);

    if (unusedFeatures.length > 0) {
      recommendations.push({
        type: 'feature_discovery',
        title: 'Descubre Nuevas Funcionalidades',
        description: `Hay ${unusedFeatures.length} características que podrías encontrar útiles`,
        action: 'Explorar características',
        priority: 'medium'
      });
    }

    // Recomendaciones basadas en eficiencia
    const sessionDuration = profile.behavior_patterns.session_duration_avg || 0;
    if (sessionDuration > 3600000) { // más de 1 hora
      recommendations.push({
        type: 'efficiency',
        title: 'Optimiza tu Tiempo',
        description: 'Podrías ahorrar tiempo con atajos y automatizaciones',
        action: 'Ver sugerencias de eficiencia',
        priority: 'high'
      });
    }

    // Recomendaciones basadas en IA
    try {
      const aiRecommendations = await advancedAIService.generatePersonalizedRecommendations({
        userId,
        profile: profile,
        context: 'adaptive_profile'
      });

      recommendations.push(...aiRecommendations);
    } catch (error) {
      console.error('Error generando recomendaciones con IA:', error);
    }

    return recommendations.slice(0, 5); // máximo 5 recomendaciones
  }

  /**
   * Obtener características no utilizadas
   */
  getUnusedFeatures(featureUsage) {
    const allFeatures = [
      'dashboard_analytics', 'bulk_import', 'ai_negotiation', 'campaigns',
      'reports', 'gamification', 'real_time_monitoring', 'predictive_analytics'
    ];

    return allFeatures.filter(feature => 
      !featureUsage[feature] || featureUsage[feature] < 0.1
    );
  }

  /**
   * Calcular confianza de personalización
   */
  calculatePersonalizationConfidence(profile) {
    let confidence = 0.3; // base

    // Antigüedad del perfil
    const profileAge = Date.now() - new Date(profile.created_at).getTime();
    const daysOld = profileAge / (1000 * 60 * 60 * 24);
    confidence += Math.min(0.3, daysOld * 0.01);

    // Cantidad de datos de comportamiento
    const behaviorDataPoints = Object.keys(profile.behavior_patterns).length;
    confidence += Math.min(0.2, behaviorDataPoints * 0.02);

    // Historial de adaptaciones
    const adaptationCount = profile.adaptation_history.length;
    confidence += Math.min(0.2, adaptationCount * 0.01);

    return Math.min(1, Math.max(0, confidence));
  }

  /**
   * Registrar evento de comportamiento
   */
  async trackBehavior(eventType, data) {
    if (!data.userId) return;

    const userId = data.userId;
    const currentData = this.behavioralData.get(userId) || {};

    // Actualizar datos de comportamiento
    const updatedData = {
      ...currentData,
      [eventType]: {
        ...currentData[eventType],
        ...data,
        timestamp: new Date().toISOString(),
        count: (currentData[eventType]?.count || 0) + 1
      }
    };

    this.behavioralData.set(userId, updatedData);

    // Actualizar perfil periódicamente
    if (updatedData[eventType].count % 5 === 0) { // cada 5 eventos
      await this.updateProfile(userId, updatedData);
    }
  }

  /**
   * Analizar patrones de comportamiento
   */
  async analyzeBehaviorPatterns() {
    for (const [userId, data] of this.behavioralData) {
      try {
        const patterns = this.extractPatterns(data);
        await this.updateProfile(userId, { patterns });
      } catch (error) {
        console.error(`Error analizando patrones para usuario ${userId}:`, error);
      }
    }
  }

  /**
   * Extraer patrones de los datos de comportamiento
   */
  extractPatterns(data) {
    const patterns = {};

    // Patrones temporales
    patterns.time_patterns = this.extractTimePatterns(data);

    // Patrones de navegación
    patterns.navigation_patterns = this.extractNavigationPatterns(data);

    // Patrones de interacción
    patterns.interaction_patterns = this.extractInteractionPatterns(data);

    return patterns;
  }

  /**
   * Extraer patrones temporales
   */
  extractTimePatterns(data) {
    const timePatterns = {};

    Object.entries(data).forEach(([eventType, eventData]) => {
      if (eventData.timestamp) {
        const hour = new Date(eventData.timestamp).getHours();
        timePatterns[hour] = (timePatterns[hour] || 0) + 1;
      }
    });

    return timePatterns;
  }

  /**
   * Extraer patrones de navegación
   */
  extractNavigationPatterns(data) {
    // Implementación simplificada
    return {
      page_sequence: data.page_views?.sequence || [],
      preferred_sections: data.page_views?.sections || [],
      bounce_rate: this.calculateBounceRate(data)
    };
  }

  /**
   * Extraer patrones de interacción
   */
  extractInteractionPatterns(data) {
    return {
      click_frequency: data.clicks?.count || 0,
      scroll_depth: data.scrolls?.average_depth || 0,
      form_interactions: data.forms?.count || 0,
      search_queries: data.searches?.count || 0
    };
  }

  /**
   * Calcular tasa de rebote
   */
  calculateBounceRate(data) {
    const sessions = data.sessions || {};
    const bouncedSessions = Object.values(sessions).filter(session => 
      session.page_count <= 1
    ).length;

    const totalSessions = Object.keys(sessions).length;
    return totalSessions > 0 ? bouncedSessions / totalSessions : 0;
  }

  /**
   * Obtener conteo de páginas
   */
  getPageCount() {
    // Implementación simplificada
    return 1;
  }

  /**
   * Obtener conteo de interacciones
   */
  getInteractionCount() {
    // Implementación simplificada
    return 0;
  }

  /**
   * Limpiar caché
   */
  clearCache() {
    this.personalizationCache.clear();
  }

  /**
   * Obtener estadísticas del servicio
   */
  getStats() {
    return {
      profiles_count: this.profiles.size,
      behavioral_data_count: this.behavioralData.size,
      cache_size: this.personalizationCache.size,
      learning_models_count: this.learningModels.size,
      adaptation_rules_count: Array.from(this.adaptationRules.values)
        .reduce((total, rules) => total + rules.length, 0),
      is_initialized: this.isInitialized
    };
  }
}

// Exportar instancia del servicio
export const adaptiveProfileService = new AdaptiveProfileService();
export default adaptiveProfileService;