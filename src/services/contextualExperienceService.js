/**
 * Contextual Experience Service
 * 
 * Servicio para crear experiencias contextuales basadas en el comportamiento
 * del usuario, adaptando la interfaz y contenido en tiempo real
 */

import { adaptiveProfileService } from './adaptiveProfileService';
import { advancedAIService } from './advancedAIService';
import { streamingAnalyticsService } from './streamingAnalyticsService';
import { analyticsService } from './analyticsService';

class ContextualExperienceService {
  constructor() {
    this.contextData = new Map();
    this.behavioralPatterns = new Map();
    this.contextualRules = new Map();
    this.experienceCache = new Map();
    this.activeExperiences = new Map();
    this.isInitialized = false;
    this.observers = new Set();
  }

  /**
   * Inicializar el servicio de experiencia contextual
   */
  async initialize() {
    try {
      console.log('🎭 Inicializando Contextual Experience Service...');
      
      // Cargar reglas contextuales
      await this.loadContextualRules();
      
      // Inicializar modelos de predicción contextual
      await this.initializeContextualModels();
      
      // Configurar listeners de comportamiento
      this.setupBehaviorListeners();
      
      // Iniciar motor de contexto
      this.startContextEngine();
      
      this.isInitialized = true;
      console.log('✅ Contextual Experience Service inicializado correctamente');
      
    } catch (error) {
      console.error('❌ Error inicializando Contextual Experience Service:', error);
      throw error;
    }
  }

  /**
   * Cargar reglas contextuales
   */
  async loadContextualRules() {
    // Reglas basadas en tiempo
    this.contextualRules.set('time_based', [
      {
        id: 'morning_productivity',
        condition: 'hour >= 6 && hour < 12',
        experience: {
          theme: 'light',
          energy_mode: 'high',
          content_priority: 'important_tasks',
          notification_level: 'normal',
          layout_density: 'comfortable',
          quick_actions: ['new_task', 'calendar', 'reports']
        },
        weight: 0.8
      },
      {
        id: 'afternoon_focus',
        condition: 'hour >= 12 && hour < 18',
        experience: {
          theme: 'light',
          energy_mode: 'medium',
          content_priority: 'ongoing_tasks',
          notification_level: 'low',
          layout_density: 'compact',
          quick_actions: ['analytics', 'team_status', 'messages']
        },
        weight: 0.7
      },
      {
        id: 'evening_review',
        condition: 'hour >= 18 && hour < 22',
        experience: {
          theme: 'auto',
          energy_mode: 'medium',
          content_priority: 'summary',
          notification_level: 'minimal',
          layout_density: 'comfortable',
          quick_actions: ['reports', 'settings', 'logout']
        },
        weight: 0.6
      },
      {
        id: 'night_mode',
        condition: 'hour >= 22 || hour < 6',
        experience: {
          theme: 'dark',
          energy_mode: 'low',
          content_priority: 'urgent_only',
          notification_level: 'emergency_only',
          layout_density: 'spacious',
          quick_actions: ['emergency_contacts', 'status']
        },
        weight: 0.9
      }
    ]);

    // Reglas basadas en comportamiento
    this.contextualRules.set('behavior_based', [
      {
        id: 'deep_work_session',
        condition: 'session_duration > 5400 && interaction_rate < 0.1', // 90 min, baja interacción
        experience: {
          focus_mode: true,
          auto_hide_panels: true,
          minimal_ui: true,
          notification_level: 'off',
          quick_actions: ['pause_focus', 'complete_session'],
          contextual_help: 'focus_tips'
        },
        weight: 0.9
      },
      {
        id: 'high_activity_period',
        condition: 'interaction_rate > 2.0 && task_switch_rate > 0.5',
        experience: {
          focus_mode: false,
          multi_task_mode: true,
          enhanced_navigation: true,
          quick_switch_panel: true,
          quick_actions: ['task_switcher', 'recent_items'],
          contextual_help: 'productivity_tips'
        },
        weight: 0.8
      },
      {
        id: 'exploration_mode',
        condition: 'new_feature_visits > 3 && help_requests > 0',
        experience: {
          discovery_mode: true,
          feature_highlights: true,
          interactive_tours: true,
          contextual_tips: true,
          quick_actions: ['tour_guide', 'feature_discovery'],
          contextual_help: 'discovery_assistant'
        },
        weight: 0.7
      },
      {
        id: 'stress_detection',
        condition: 'error_rate > 0.1 && frustration_signals > 2',
        experience: {
          stress_relief_mode: true,
          simplified_interface: true,
          enhanced_guidance: true,
          auto_suggest_help: true,
          quick_actions: ['help_center', 'live_support'],
          contextual_help: 'stress_support'
        },
        weight: 0.9
      }
    ]);

    // Reglas basadas en contexto de negocio
    this.contextualRules.set('business_context', [
      {
        id: 'quarter_end',
        condition: 'is_quarter_end && role === "admin"',
        experience: {
          reporting_mode: true,
          kpi_focus: true,
          deadline_reminders: true,
          quick_actions: ['quarterly_report', 'team_performance'],
          contextual_help: 'quarter_end_guide'
        },
        weight: 0.8
      },
      {
        id: 'campaign_active',
        condition: 'active_campaigns > 0 && role === "company"',
        experience: {
          campaign_mode: true,
          real_time_metrics: true,
          campaign_controls: true,
          quick_actions: ['campaign_dashboard', 'campaign_analytics'],
          contextual_help: 'campaign_optimizer'
        },
        weight: 0.7
      },
      {
        id: 'onboarding_period',
        condition: 'days_since_signup < 7 && feature_usage_rate < 0.3',
        experience: {
          onboarding_mode: true,
          progressive_disclosure: true,
          guided_workflow: true,
          quick_actions: ['onboarding_tour', 'getting_started'],
          contextual_help: 'onboarding_assistant'
        },
        weight: 0.9
      }
    ]);

    // Reglas basadas en dispositivo y entorno
    this.contextualRules.set('environmental', [
      {
        id: 'mobile_device',
        condition: 'device_type === "mobile"',
        experience: {
          mobile_optimized: true,
          touch_friendly: true,
          simplified_navigation: true,
          gesture_navigation: true,
          quick_actions: ['essential_actions_only'],
          contextual_help: 'mobile_tips'
        },
        weight: 0.8
      },
      {
        id: 'low_bandwidth',
        condition: 'connection_speed < 1.0', // Mbps
        experience: {
          lite_mode: true,
          reduced_animations: true,
          essential_content_only: true,
          offline_capabilities: true,
          quick_actions: ['offline_actions'],
          contextual_help: 'connectivity_tips'
        },
        weight: 0.9
      },
      {
        id: 'poor_battery',
        condition: 'battery_level < 0.2',
        experience: {
          power_saver: true,
          minimal_processing: true,
          reduced_refresh_rate: true,
          background_sync_off: true,
          quick_actions: ['battery_saver_mode'],
          contextual_help: 'battery_tips'
        },
        weight: 0.8
      }
    ]);

    console.log('📋 Reglas contextuales cargadas');
  }

  /**
   * Inicializar modelos de predicción contextual
   */
  async initializeContextualModels() {
    // Modelo de predicción de intenciones
    this.contextualModels = {
      intention_prediction: {
        features: [
          'time_of_day', 'session_duration', 'recent_actions',
          'navigation_pattern', 'search_queries', 'interaction_frequency'
        ],
        predictions: [
          'task_completion', 'exploration', 'learning', 'troubleshooting',
          'reporting', 'communication', 'planning'
        ],
        accuracy: 0.82,
        last_updated: null
      },
      context_anticipation: {
        features: [
          'user_role', 'business_context', 'time_constraints',
          'resource_availability', 'team_status', 'deadline_pressure'
        ],
        predictions: [
          'urgent_action_needed', 'planning_phase', 'review_required',
          'collaboration_opportunity', 'automation_possible'
        ],
        accuracy: 0.78,
        last_updated: null
      },
      experience_optimization: {
        features: [
          'user_satisfaction', 'task_success_rate', 'time_on_task',
          'error_frequency', 'help_requests', 'feature_adoption'
        ],
        predictions: [
          'interface_simplification', 'feature_highlighting',
          'workflow_optimization', 'guidance_level', 'support_intensity'
        ],
        accuracy: 0.85,
        last_updated: null
      }
    };

    console.log('🤖 Modelos contextuales inicializados');
  }

  /**
   * Configurar listeners de comportamiento
   */
  setupBehaviorListeners() {
    if (typeof window !== 'undefined') {
      // Listener de visibilidad de página
      document.addEventListener('visibilitychange', () => {
        this.updateContext('visibility', {
          is_visible: !document.hidden,
          timestamp: Date.now()
        });
      });

      // Listener de foco/pérdida de foco
      window.addEventListener('focus', () => {
        this.updateContext('window_focus', {
          is_focused: true,
          timestamp: Date.now()
        });
      });

      window.addEventListener('blur', () => {
        this.updateContext('window_focus', {
          is_focused: false,
          timestamp: Date.now()
        });
      });

      // Listener de movimiento del mouse (para detectar actividad)
      let mouseTimer;
      window.addEventListener('mousemove', () => {
        clearTimeout(mouseTimer);
        this.updateContext('user_activity', {
          last_activity: Date.now(),
          activity_type: 'mouse'
        });
        
        mouseTimer = setTimeout(() => {
          this.updateContext('user_activity', {
            last_activity: Date.now(),
            activity_type: 'idle'
          });
        }, 30000); // 30 segundos de inactividad
      });

      // Listener de scroll
      let scrollTimer;
      window.addEventListener('scroll', () => {
        clearTimeout(scrollTimer);
        this.updateContext('scroll_behavior', {
          scroll_depth: window.scrollY / (document.body.scrollHeight - window.innerHeight),
          timestamp: Date.now()
        });
        
        scrollTimer = setTimeout(() => {
          this.updateContext('scroll_behavior', {
            reading_mode: true,
            timestamp: Date.now()
          });
        }, 2000);
      });
    }

    console.log('👂 Listeners de comportamiento configurados');
  }

  /**
   * Iniciar motor de contexto
   */
  startContextEngine() {
    // Evaluar contexto cada 30 segundos
    setInterval(() => {
      this.evaluateContext();
    }, 30000);

    // Actualizar modelos cada 5 minutos
    setInterval(() => {
      this.updateContextualModels();
    }, 300000);

    console.log('⚙️ Motor de contexto iniciado');
  }

  /**
   * Actualizar datos de contexto
   */
  async updateContext(contextType, data) {
    if (!data.userId) return;

    const userId = data.userId;
    const currentContext = this.contextData.get(userId) || {};

    // Actualizar contexto específico
    currentContext[contextType] = {
      ...currentContext[contextType],
      ...data,
      last_updated: Date.now()
    };

    // Actualizar timestamp general
    currentContext.last_updated = Date.now();

    // Guardar en memoria
    this.contextData.set(userId, currentContext);

    // Notificar observadores
    this.notifyObservers(userId, contextType, data);

    // Evaluar si es necesario actualizar la experiencia
    if (this.shouldUpdateExperience(userId, contextType)) {
      await this.updateUserExperience(userId);
    }
  }

  /**
   * Evaluar contexto completo del usuario
   */
  async evaluateContext() {
    for (const [userId, context] of this.contextData) {
      try {
        // Evaluar reglas contextuales
        const applicableRules = this.evaluateContextualRules(userId, context);
        
        // Predecir intenciones
        const intentions = await this.predictUserIntentions(userId, context);
        
        // Anticipar necesidades
        const anticipatedNeeds = await this.anticipateUserNeeds(userId, context);
        
        // Generar experiencia contextual
        const contextualExperience = this.generateContextualExperience(
          applicableRules,
          intentions,
          anticipatedNeeds,
          context
        );

        // Actualizar experiencia activa
        this.activeExperiences.set(userId, contextualExperience);

        // Notificar cambios
        this.notifyExperienceChange(userId, contextualExperience);

      } catch (error) {
        console.error(`Error evaluando contexto para usuario ${userId}:`, error);
      }
    }
  }

  /**
   * Evaluar reglas contextuales aplicables
   */
  evaluateContextualRules(userId, context) {
    const applicableRules = [];
    const currentHour = new Date().getHours();
    const currentTime = Date.now();

    // Evaluar todas las reglas
    for (const [category, rules] of this.contextualRules) {
      for (const rule of rules) {
        if (this.evaluateRuleCondition(rule.condition, {
          ...context,
          hour: currentHour,
          current_time: currentTime
        })) {
          applicableRules.push({
            ...rule,
            category,
            confidence: this.calculateRuleConfidence(rule, context)
          });
        }
      }
    }

    // Ordenar por confianza y peso
    return applicableRules.sort((a, b) => {
      const scoreA = a.confidence * a.weight;
      const scoreB = b.confidence * b.weight;
      return scoreB - scoreA;
    });
  }

  /**
   * Evaluar condición de regla
   */
  evaluateRuleCondition(condition, context) {
    try {
      // Crear función segura para evaluar condición
      const func = new Function('context', `
        const { ${Object.keys(context).join(', ')} } = context;
        return ${condition};
      `);
      
      return func(context);
    } catch (error) {
      console.error('Error evaluando condición de regla:', error);
      return false;
    }
  }

  /**
   * Calcular confianza de regla
   */
  calculateRuleConfidence(rule, context) {
    let confidence = rule.weight || 0.5;

    // Ajustar basado en datos históricos
    const historicalData = this.getHistoricalRuleData(rule.id);
    if (historicalData.success_rate) {
      confidence *= (0.5 + historicalData.success_rate);
    }

    // Ajustar basado en contextualidad
    if (context.relevance_score) {
      confidence *= context.relevance_score;
    }

    return Math.min(1, Math.max(0, confidence));
  }

  /**
   * Predecir intenciones del usuario
   */
  async predictUserIntentions(userId, context) {
    try {
      // Usar IA para predecir intenciones
      const aiPrediction = await advancedAIService.predictUserIntentions({
        userId,
        context,
        historicalData: this.behavioralPatterns.get(userId),
        model: 'intention_prediction'
      });

      return aiPrediction.intentions || [];
    } catch (error) {
      console.error('Error prediciendo intenciones:', error);
      return this.getDefaultIntentions(context);
    }
  }

  /**
   * Anticipar necesidades del usuario
   */
  async anticipateUserNeeds(userId, context) {
    try {
      // Usar IA para anticipar necesidades
      const aiAnticipation = await advancedAIService.anticipateUserNeeds({
        userId,
        context,
        userProfile: await adaptiveProfileService.getOrCreateProfile(userId),
        model: 'context_anticipation'
      });

      return aiAnticipation.needs || [];
    } catch (error) {
      console.error('Error anticipando necesidades:', error);
      return this.getDefaultNeeds(context);
    }
  }

  /**
   * Generar experiencia contextual
   */
  generateContextualExperience(applicableRules, intentions, anticipatedNeeds, context) {
    const experience = {
      id: `exp_${Date.now()}`,
      timestamp: Date.now(),
      rules: applicableRules,
      intentions,
      anticipated_needs: anticipatedNeeds,
      adaptations: {},
      ui_adjustments: {},
      content_priorities: [],
      quick_actions: [],
      contextual_help: null,
      confidence_score: 0
    };

    // Combinar adaptaciones de reglas aplicables
    applicableRules.forEach(rule => {
      if (rule.experience) {
        Object.assign(experience.adaptations, rule.experience);
        experience.confidence_score += rule.confidence * rule.weight;
      }
    });

    // Agregar adaptaciones basadas en intenciones
    intentions.forEach(intention => {
      const intentionAdaptations = this.getIntentionAdaptations(intention);
      Object.assign(experience.adaptations, intentionAdaptations);
    });

    // Agregar adaptaciones basadas en necesidades anticipadas
    anticipatedNeeds.forEach(need => {
      const needAdaptations = this.getNeedAdaptations(need);
      Object.assign(experience.adaptations, needAdaptations);
    });

    // Generar ajustes de UI
    experience.ui_adjustments = this.generateUIAdjustments(experience.adaptations);

    // Establecer prioridades de contenido
    experience.content_priorities = this.generateContentPriorities(
      experience.adaptations,
      intentions,
      anticipatedNeeds
    );

    // Generar acciones rápidas
    experience.quick_actions = this.generateQuickActions(experience.adaptations);

    // Determinar ayuda contextual
    experience.contextual_help = this.determineContextualHelp(
      experience.adaptations,
      intentions,
      anticipatedNeeds
    );

    // Normalizar confianza
    const totalWeight = applicableRules.reduce((sum, rule) => sum + rule.weight, 0);
    experience.confidence_score = totalWeight > 0 ? experience.confidence_score / totalWeight : 0;

    return experience;
  }

  /**
   * Obtener adaptaciones basadas en intenciones
   */
  getIntentionAdaptations(intention) {
    const adaptationMap = {
      'task_completion': {
        focus_mode: true,
        distraction_free: true,
        task_prioritization: true
      },
      'exploration': {
        discovery_mode: true,
        feature_highlights: true,
        contextual_tips: true
      },
      'learning': {
        tutorial_mode: true,
        step_by_step_guidance: true,
        detailed_explanations: true
      },
      'troubleshooting': {
        help_mode: true,
        diagnostic_tools: true,
        support_access: true
      },
      'reporting': {
        analytics_mode: true,
        data_visualization: true,
        export_options: true
      },
      'communication': {
        collaboration_mode: true,
        messaging_priority: true,
        team_status_visible: true
      },
      'planning': {
        planning_mode: true,
        calendar_integration: true,
        resource_allocation: true
      }
    };

    return adaptationMap[intention.type] || {};
  }

  /**
   * Obtener adaptaciones basadas en necesidades
   */
  getNeedAdaptations(need) {
    const needMap = {
      'urgent_action_needed': {
        priority_mode: true,
        urgent_notifications: true,
        quick_action_access: true
      },
      'planning_phase': {
        planning_tools: true,
        timeline_view: true,
        resource_overview: true
      },
      'review_required': {
        review_mode: true,
        comparison_tools: true,
        feedback_options: true
      },
      'collaboration_opportunity': {
        team_features: true,
        sharing_options: true,
        communication_tools: true
      },
      'automation_possible': {
        automation_suggestions: true,
        workflow_optimization: true,
        efficiency_tools: true
      }
    };

    return needMap[need.type] || {};
  }

  /**
   * Generar ajustes de UI
   */
  generateUIAdjustments(adaptations) {
    const adjustments = {};

    // Tema
    if (adaptations.theme) {
      adjustments.theme = adaptations.theme;
    }

    // Densidad de layout
    if (adaptations.layout_density) {
      adjustments.layout_density = adaptations.layout_density;
    }

    // Modo de enfoque
    if (adaptations.focus_mode || adaptations.minimal_ui) {
      adjustments.hide_panels = ['notifications', 'sidebar'];
      adjustments.compact_header = true;
      adjustments.reduce_animations = true;
    }

    // Modo móvil
    if (adaptations.mobile_optimized) {
      adjustments.touch_targets = 'large';
      adjustments.gesture_navigation = true;
      adjustments.bottom_navigation = true;
    }

    // Modo de ahorro de energía
    if (adaptations.power_saver || adaptations.lite_mode) {
      adjustments.reduced_animations = true;
      adjustments.simplified_graphics = true;
      adjustments.decreased_refresh_rate = true;
    }

    return adjustments;
  }

  /**
   * Generar prioridades de contenido
   */
  generateContentPriorities(adaptations, intentions, anticipatedNeeds) {
    const priorities = [];

    // Basado en adaptaciones
    if (adaptations.content_priority) {
      priorities.push(adaptations.content_priority);
    }

    // Basado en intenciones
    intentions.forEach(intention => {
      priorities.push(intention.type);
    });

    // Basado en necesidades anticipadas
    anticipatedNeeds.forEach(need => {
      priorities.push(need.type);
    });

    // Eliminar duplicados y ordenar por relevancia
    return [...new Set(priorities)].slice(0, 5);
  }

  /**
   * Generar acciones rápidas
   */
  generateQuickActions(adaptations) {
    if (adaptations.quick_actions) {
      return adaptations.quick_actions;
    }

    // Acciones por defecto basadas en modo
    const defaultActions = {
      'focus_mode': ['complete_task', 'take_break', 'pause_focus'],
      'discovery_mode': ['feature_tour', 'explore_new', 'help_center'],
      'collaboration_mode': ['start_chat', 'share_screen', 'schedule_meeting'],
      'planning_mode': ['create_task', 'set_deadline', 'assign_resources']
    };

    for (const [mode, actions] of Object.entries(defaultActions)) {
      if (adaptations[mode]) {
        return actions;
      }
    }

    return ['dashboard', 'search', 'notifications'];
  }

  /**
   * Determinar ayuda contextual
   */
  determineContextualHelp(adaptations, intentions, anticipatedNeeds) {
    // Prioridad: ayuda explícita en adaptaciones
    if (adaptations.contextual_help) {
      return adaptations.contextual_help;
    }

    // Basado en intenciones
    if (intentions.some(i => i.type === 'learning')) {
      return 'learning_assistant';
    }

    if (intentions.some(i => i.type === 'troubleshooting')) {
      return 'troubleshooting_guide';
    }

    // Basado en necesidades
    if (anticipatedNeeds.some(n => n.type === 'urgent_action_needed')) {
      return 'urgent_action_guide';
    }

    return null;
  }

  /**
   * Actualizar experiencia del usuario
   */
  async updateUserExperience(userId) {
    try {
      const experience = this.activeExperiences.get(userId);
      if (!experience) return;

      // Aplicar adaptaciones de UI
      this.applyUIAdjustments(userId, experience.ui_adjustments);

      // Actualizar contenido prioritario
      this.updateContentPriorities(userId, experience.content_priorities);

      // Configurar acciones rápidas
      this.configureQuickActions(userId, experience.quick_actions);

      // Activar ayuda contextual
      if (experience.contextual_help) {
        this.activateContextualHelp(userId, experience.contextual_help);
      }

      // Notificar cambio de experiencia
      this.notifyExperienceChange(userId, experience);

    } catch (error) {
      console.error('Error actualizando experiencia del usuario:', error);
    }
  }

  /**
   * Aplicar ajustes de UI
   */
  applyUIAdjustments(userId, adjustments) {
    // Emitir evento para que los componentes escuchen
    this.emitEvent('ui_adjustments', {
      userId,
      adjustments,
      timestamp: Date.now()
    });
  }

  /**
   * Actualizar prioridades de contenido
   */
  updateContentPriorities(userId, priorities) {
    this.emitEvent('content_priorities', {
      userId,
      priorities,
      timestamp: Date.now()
    });
  }

  /**
   * Configurar acciones rápidas
   */
  configureQuickActions(userId, actions) {
    this.emitEvent('quick_actions', {
      userId,
      actions,
      timestamp: Date.now()
    });
  }

  /**
   * Activar ayuda contextual
   */
  activateContextualHelp(userId, helpType) {
    this.emitEvent('contextual_help', {
      userId,
      helpType,
      timestamp: Date.now()
    });
  }

  /**
   * Determinar si se debe actualizar la experiencia
   */
  shouldUpdateExperience(userId, contextType) {
    const experience = this.activeExperiences.get(userId);
    if (!experience) return true;

    // Tipos de contexto que requieren actualización inmediata
    const highPriorityTypes = [
      'user_activity',
      'visibility',
      'window_focus',
      'session_start',
      'session_end'
    ];

    return highPriorityTypes.includes(contextType);
  }

  /**
   * Obtener experiencia actual del usuario
   */
  async getCurrentExperience(userId) {
    // Verificar caché
    const cached = this.experienceCache.get(userId);
    if (cached && (Date.now() - cached.timestamp) < 60000) { // 1 minuto
      return cached.experience;
    }

    // Generar experiencia si no existe
    let experience = this.activeExperiences.get(userId);
    if (!experience) {
      const context = this.contextData.get(userId) || {};
      await this.evaluateContextForUser(userId, context);
      experience = this.activeExperiences.get(userId);
    }

    // Guardar en caché
    if (experience) {
      this.experienceCache.set(userId, {
        experience,
        timestamp: Date.now()
      });
    }

    return experience;
  }

  /**
   * Evaluar contexto para usuario específico
   */
  async evaluateContextForUser(userId, context) {
    try {
      const applicableRules = this.evaluateContextualRules(userId, context);
      const intentions = await this.predictUserIntentions(userId, context);
      const anticipatedNeeds = await this.anticipateUserNeeds(userId, context);
      
      const contextualExperience = this.generateContextualExperience(
        applicableRules,
        intentions,
        anticipatedNeeds,
        context
      );

      this.activeExperiences.set(userId, contextualExperience);
    } catch (error) {
      console.error(`Error evaluando contexto para usuario ${userId}:`, error);
    }
  }

  /**
   * Suscribir a cambios de experiencia
   */
  subscribe(callback) {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  /**
   * Notificar observadores
   */
  notifyObservers(userId, contextType, data) {
    this.observers.forEach(callback => {
      try {
        callback(userId, contextType, data);
      } catch (error) {
        console.error('Error en observer:', error);
      }
    });
  }

  /**
   * Notificar cambio de experiencia
   */
  notifyExperienceChange(userId, experience) {
    this.emitEvent('experience_changed', {
      userId,
      experience,
      timestamp: Date.now()
    });
  }

  /**
   * Emitir evento
   */
  emitEvent(eventType, data) {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent(eventType, { detail: data }));
    }
  }

  /**
   * Actualizar modelos contextuales
   */
  async updateContextualModels() {
    try {
      // Recopilar datos de entrenamiento
      const trainingData = this.collectTrainingData();

      // Actualizar modelos con IA
      await advancedAIService.updateContextualModels(trainingData);

      console.log('🤖 Modelos contextuales actualizados');
    } catch (error) {
      console.error('Error actualizando modelos contextuales:', error);
    }
  }

  /**
   * Recopilar datos de entrenamiento
   */
  collectTrainingData() {
    const trainingData = [];

    for (const [userId, context] of this.contextData) {
      const experience = this.activeExperiences.get(userId);
      const profile = this.behavioralPatterns.get(userId);

      trainingData.push({
        userId,
        context,
        experience,
        profile,
        timestamp: Date.now()
      });
    }

    return trainingData;
  }

  /**
   * Obtener datos históricos de regla
   */
  getHistoricalRuleData(ruleId) {
    // Implementación simulada
    return {
      success_rate: 0.7 + Math.random() * 0.3,
      usage_count: Math.floor(Math.random() * 100),
      user_satisfaction: 0.6 + Math.random() * 0.4
    };
  }

  /**
   * Obtener intenciones por defecto
   */
  getDefaultIntentions(context) {
    return [
      {
        type: 'task_completion',
        confidence: 0.5,
        reasoning: 'Default intention based on context'
      }
    ];
  }

  /**
   * Obtener necesidades por defecto
   */
  getDefaultNeeds(context) {
    return [
      {
        type: 'productivity',
        confidence: 0.5,
        reasoning: 'Default need based on context'
      }
    ];
  }

  /**
   * Limpiar caché
   */
  clearCache() {
    this.experienceCache.clear();
  }

  /**
   * Obtener estadísticas del servicio
   */
  getStats() {
    return {
      active_contexts: this.contextData.size,
      active_experiences: this.activeExperiences.size,
      cached_experiences: this.experienceCache.size,
      contextual_rules_count: Array.from(this.contextualRules.values)
        .reduce((total, rules) => total + rules.length, 0),
      observers_count: this.observers.size,
      is_initialized: this.isInitialized
    };
  }
}

// Exportar instancia del servicio
export const contextualExperienceService = new ContextualExperienceService();
export default contextualExperienceService;