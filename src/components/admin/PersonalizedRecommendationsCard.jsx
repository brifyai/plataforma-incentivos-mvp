/**
 * Personalized Recommendations Card Component
 * 
 * Componente para sistema de recomendaciones personalizadas basadas en
 * comportamiento, preferencias y aprendizaje automático
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Badge, Button } from '../common';
import { adaptiveProfileService } from '../../services/adaptiveProfileService';
import { advancedAIService } from '../../services/advancedAIService';
import { analyticsService } from '../../services/analyticsService';
import {
  Brain,
  Target,
  TrendingUp,
  Lightbulb,
  Star,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Share2,
  Filter,
  RefreshCw,
  Settings,
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Zap,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  BarChart3,
  Users,
  MessageSquare,
  FileText,
  Calendar,
  Tag,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const PersonalizedRecommendationsCard = ({ userId, userProfile }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState({});
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [showDetails, setShowDetails] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [personalizationData, setPersonalizationData] = useState(null);

  // Categorías de recomendaciones
  const recommendationCategories = [
    { id: 'all', name: 'Todas', icon: Sparkles, color: 'purple' },
    { id: 'productivity', name: 'Productividad', icon: Zap, color: 'yellow' },
    { id: 'features', name: 'Características', icon: Lightbulb, color: 'blue' },
    { id: 'analytics', name: 'Análisis', icon: BarChart3, color: 'green' },
    { id: 'engagement', name: 'Engagement', icon: Users, color: 'pink' },
    { id: 'optimization', name: 'Optimización', icon: TrendingUp, color: 'indigo' },
    { id: 'learning', name: 'Aprendizaje', icon: Brain, color: 'cyan' },
    { id: 'automation', name: 'Automatización', icon: Settings, color: 'gray' }
  ];

  // Cargar recomendaciones al montar el componente
  useEffect(() => {
    loadRecommendations();
  }, [userId, refreshKey]);

  // Cargar recomendaciones
  const loadRecommendations = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      // Obtener datos de personalización
      const personalization = await adaptiveProfileService.getPersonalization(userId);
      setPersonalizationData(personalization);

      // Generar recomendaciones basadas en el perfil
      const personalizedRecs = await generatePersonalizedRecommendations(personalization);
      
      // Enriquecer recomendaciones con datos adicionales
      const enrichedRecs = await enrichRecommendations(personalizedRecs, personalization);
      
      setRecommendations(enrichedRecs);
      
      // Extraer categorías únicas
      const uniqueCategories = [...new Set(enrichedRecs.map(rec => rec.category))];
      setCategories(uniqueCategories);

    } catch (error) {
      console.error('Error cargando recomendaciones:', error);
      // Recomendaciones de fallback
      setRecommendations(getFallbackRecommendations());
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Generar recomendaciones personalizadas
  const generatePersonalizedRecommendations = useCallback(async (personalization) => {
    const baseRecommendations = [];
    
    // Recomendaciones basadas en patrones de comportamiento
    if (personalization.insights) {
      personalization.insights.forEach(insight => {
        baseRecommendations.push({
          id: `insight_${insight.type}`,
          type: 'insight_based',
          category: getCategoryFromInsight(insight.type),
          title: insight.title,
          description: insight.description,
          recommendation: insight.recommendation,
          confidence: insight.confidence,
          priority: insight.confidence > 0.8 ? 'high' : 'medium',
          action_text: 'Aplicar sugerencia',
          action_type: 'apply_insight',
          metadata: { insight_type: insight.type }
        });
      });
    }

    // Recomendaciones basadas en características no utilizadas
    if (personalization.recommendations) {
      personalization.recommendations.forEach(rec => {
        baseRecommendations.push({
          id: `rec_${rec.type}`,
          type: 'behavior_based',
          category: getCategoryFromRecommendation(rec.type),
          title: rec.title,
          description: rec.description,
          recommendation: rec.action,
          confidence: 0.7,
          priority: rec.priority || 'medium',
          action_text: rec.action,
          action_type: rec.type,
          metadata: { source: 'behavior_analysis' }
        });
      });
    }

    // Recomendaciones basadas en IA
    try {
      const aiRecommendations = await advancedAIService.generateContextualRecommendations({
        userId,
        userProfile,
        personalizationData: personalization,
        context: 'dashboard_recommendations'
      });

      aiRecommendations.forEach((rec, index) => {
        baseRecommendations.push({
          id: `ai_${index}`,
          type: 'ai_generated',
          category: rec.category || 'optimization',
          title: rec.title,
          description: rec.description,
          recommendation: rec.recommendation,
          confidence: rec.confidence || 0.8,
          priority: rec.priority || 'medium',
          action_text: rec.action_text || 'Explorar',
          action_type: rec.action_type || 'explore',
          metadata: { 
            source: 'ai',
            model: rec.model || 'default',
            reasoning: rec.reasoning
          }
        });
      });
    } catch (error) {
      console.error('Error generando recomendaciones con IA:', error);
    }

    // Recomendaciones basadas en mejores prácticas
    const bestPracticeRecs = generateBestPracticeRecommendations(personalization);
    baseRecommendations.push(...bestPracticeRecs);

    // Ordenar por confianza y prioridad
    return baseRecommendations.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const aScore = a.confidence * priorityWeight[a.priority] || 0;
      const bScore = b.confidence * priorityWeight[b.priority] || 0;
      return bScore - aScore;
    }).slice(0, 12); // Limitar a 12 recomendaciones
  }, []);

  // Enriquecer recomendaciones con datos adicionales
  const enrichRecommendations = useCallback(async (recommendations, personalization) => {
    return Promise.all(recommendations.map(async (rec) => {
      const enriched = { ...rec };

      // Agregar métricas de impacto
      enriched.impact_metrics = await calculateImpactMetrics(rec, personalization);

      // Agregar datos de implementación
      enriched.implementation = await getImplementationData(rec);

      // Agregar ejemplos y casos de uso
      enriched.examples = await getExamples(rec);

      // Agregar recursos relacionados
      enriched.resources = await getResources(rec);

      return enriched;
    }));
  }, []);

  // Calcular métricas de impacto
  const calculateImpactMetrics = useCallback(async (recommendation, personalization) => {
    const baseMetrics = {
      potential_improvement: Math.random() * 50 + 10, // 10-60%
      implementation_effort: Math.random() * 3 + 1, // 1-4 (escala)
      time_to_result: Math.random() * 30 + 1, // 1-31 días
      user_satisfaction_prediction: Math.random() * 0.3 + 0.7 // 70-100%
    };

    // Ajustar basado en el perfil del usuario
    if (personalization.learning_data?.satisfaction_indicators) {
      const satisfaction = personalization.learning_data.satisfaction_indicators.overall_satisfaction || 0.5;
      baseMetrics.user_satisfaction_prediction = Math.min(1, 
        baseMetrics.user_satisfaction_prediction * (0.5 + satisfaction)
      );
    }

    return baseMetrics;
  }, []);

  // Obtener datos de implementación
  const getImplementationData = useCallback(async (recommendation) => {
    return {
      steps: getImplementationSteps(recommendation.type),
      prerequisites: getPrerequisites(recommendation.type),
      estimated_time: getEstimatedTime(recommendation.type),
      difficulty_level: getDifficultyLevel(recommendation.type),
      rollback_plan: getRollbackPlan(recommendation.type)
    };
  }, []);

  // Obtener ejemplos
  const getExamples = useCallback(async (recommendation) => {
    const examples = {
      productivity: [
        'Automatiza reportes semanales para ahorrar 2 horas',
        'Usa plantillas para respuestas frecuentes',
        'Configura notificaciones inteligentes'
      ],
      features: [
        'Explora el dashboard de analytics avanzado',
        'Prueba la negociación asistida por IA',
        'Utiliza la importación masiva mejorada'
      ],
      analytics: [
        'Configura alertas automáticas de métricas',
        'Crea dashboards personalizados',
        'Exporta informes personalizados'
      ]
    };

    return examples[recommendation.category] || [
      'Mejora tu flujo de trabajo actual',
      'Optimiza procesos repetitivos',
      'Implementa mejores prácticas'
    ];
  }, []);

  // Obtener recursos
  const getResources = useCallback(async (recommendation) => {
    return {
      documentation: `https://docs.example.com/${recommendation.category}`,
      tutorials: `https://tutorials.example.com/${recommendation.type}`,
      community: `https://community.example.com/${recommendation.category}`,
      support: 'https://support.example.com'
    };
  }, []);

  // Generar recomendaciones de mejores prácticas
  const generateBestPracticeRecommendations = (personalization) => {
    const recommendations = [];

    // Basado en el rol del usuario
    if (userProfile?.role === 'admin') {
      recommendations.push({
        id: 'bp_admin_dashboard',
        type: 'best_practice',
        category: 'analytics',
        title: 'Optimiza tu Dashboard de Administrador',
        description: 'Configura tu dashboard para mostrar las métricas más relevantes para tu rol',
        recommendation: 'Personaliza las widgets y configura alertas automáticas',
        confidence: 0.9,
        priority: 'high',
        action_text: 'Configurar dashboard',
        action_type: 'configure_dashboard',
        metadata: { source: 'best_practices', role: 'admin' }
      });
    }

    // Basado en el comportamiento reciente
    if (personalization.preferences?.theme === 'auto') {
      recommendations.push({
        id: 'bp_theme_optimization',
        type: 'best_practice',
        category: 'productivity',
        title: 'Optimiza el Tema Automático',
        description: 'Ajusta los horarios de cambio de tema según tus patrones de uso',
        recommendation: 'Configura horarios personalizados para tema claro/oscuro',
        confidence: 0.8,
        priority: 'medium',
        action_text: 'Ajustar configuración',
        action_type: 'configure_theme',
        metadata: { source: 'best_practices', feature: 'theme' }
      });
    }

    return recommendations;
  };

  // Obtener categoría desde insight
  const getCategoryFromInsight = (insightType) => {
    const categoryMap = {
      'time_pattern': 'productivity',
      'feature_preference': 'features',
      'learning_style': 'learning'
    };
    return categoryMap[insightType] || 'optimization';
  };

  // Obtener categoría desde recomendación
  const getCategoryFromRecommendation = (recType) => {
    const categoryMap = {
      'feature_discovery': 'features',
      'efficiency': 'productivity',
      'engagement': 'engagement'
    };
    return categoryMap[recType] || 'optimization';
  };

  // Obtener pasos de implementación
  const getImplementationSteps = (type) => {
    const stepsMap = {
      'productivity': [
        'Analiza tu flujo de trabajo actual',
        'Identifica áreas de mejora',
        'Implementa cambios gradualmente',
        'Mide los resultados'
      ],
      'features': [
        'Explora la característica',
        'Configura parámetros iniciales',
        'Realiza pruebas',
        'Activa para todos los usuarios'
      ],
      'analytics': [
        'Define métricas clave',
        'Configura fuentes de datos',
        'Crea visualizaciones',
        'Establece alertas'
      ]
    };
    return stepsMap[type] || ['Analiza requerimientos', 'Implementa solución', 'Valida resultados'];
  };

  // Obtener prerrequisitos
  const getPrerequisites = (type) => {
    const prereqMap = {
      'productivity': ['Acceso a herramientas de análisis', 'Permisos de configuración'],
      'features': ['Rol de administrador', 'Conocimiento del sistema'],
      'analytics': ['Datos históricos', 'Acceso a métricas']
    };
    return prereqMap[type] || ['Acceso al sistema', 'Permisos necesarios'];
  };

  // Obtener tiempo estimado
  const getEstimatedTime = (type) => {
    const timeMap = {
      'productivity': '2-4 horas',
      'features': '1-2 horas',
      'analytics': '3-5 horas'
    };
    return timeMap[type] || '1-3 horas';
  };

  // Obtener nivel de dificultad
  const getDifficultyLevel = (type) => {
    const difficultyMap = {
      'productivity': 'medio',
      'features': 'fácil',
      'analytics': 'difícil'
    };
    return difficultyMap[type] || 'medio';
  };

  // Obtener plan de rollback
  const getRollbackPlan = (type) => {
    return {
      steps: [
        'Identificar cambios realizados',
        'Restaurar configuración anterior',
        'Verificar funcionamiento',
        'Comunicar a usuarios'
      ],
      estimated_time: '30 minutos'
    };
  };

  // Recomendaciones de fallback
  const getFallbackRecommendations = () => [
    {
      id: 'fallback_1',
      type: 'general',
      category: 'productivity',
      title: 'Optimiza tu Flujo de Trabajo',
      description: 'Descubre cómo automatizar tareas repetitivas y mejorar tu eficiencia',
      recommendation: 'Explora nuestras herramientas de automatización',
      confidence: 0.7,
      priority: 'medium',
      action_text: 'Explorar',
      action_type: 'explore_automation'
    },
    {
      id: 'fallback_2',
      type: 'general',
      category: 'features',
      title: 'Nuevas Características Disponibles',
      description: 'Conoce las últimas funcionalidades que pueden mejorar tu experiencia',
      recommendation: 'Revisa el centro de novedades',
      confidence: 0.8,
      priority: 'low',
      action_text: 'Ver novedades',
      action_type: 'view_whats_new'
    }
  ];

  // Filtrar recomendaciones por categoría
  const filteredRecommendations = useMemo(() => {
    if (selectedCategory === 'all') {
      return recommendations;
    }
    return recommendations.filter(rec => rec.category === selectedCategory);
  }, [recommendations, selectedCategory]);

  // Manejar feedback del usuario
  const handleFeedback = useCallback(async (recommendationId, feedbackType) => {
    try {
      // Registrar feedback
      await adaptiveProfileService.trackBehavior('recommendation_feedback', {
        userId,
        recommendationId,
        feedbackType,
        timestamp: new Date().toISOString()
      });

      // Actualizar estado local
      setFeedback(prev => ({
        ...prev,
        [recommendationId]: feedbackType
      }));

      // Si es feedback positivo, considerar como implementada
      if (feedbackType === 'implemented') {
        setRecommendations(prev => 
          prev.map(rec => 
            rec.id === recommendationId 
              ? { ...rec, status: 'implemented', implemented_at: new Date().toISOString() }
              : rec
          )
        );
      }

    } catch (error) {
      console.error('Error registrando feedback:', error);
    }
  }, [userId]);

  // Alternar expansión de item
  const toggleExpanded = useCallback((recommendationId) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recommendationId)) {
        newSet.delete(recommendationId);
      } else {
        newSet.add(recommendationId);
      }
      return newSet;
    });
  }, []);

  // Refrescar recomendaciones
  const refreshRecommendations = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Obtener icono de categoría
  const getCategoryIcon = useCallback((category) => {
    const categoryObj = recommendationCategories.find(cat => cat.id === category);
    return categoryObj?.icon || Sparkles;
  }, []);

  // Obtener color de categoría
  const getCategoryColor = useCallback((category) => {
    const categoryObj = recommendationCategories.find(cat => cat.id === category);
    return categoryObj?.color || 'gray';
  }, []);

  // Renderizar recomendación
  const renderRecommendation = (recommendation) => {
    const isExpanded = expandedItems.has(recommendation.id);
    const userFeedback = feedback[recommendation.id];
    const CategoryIcon = getCategoryIcon(recommendation.category);
    const categoryColor = getCategoryColor(recommendation.category);

    return (
      <div
        key={recommendation.id}
        className={`border rounded-lg p-4 transition-all duration-300 hover:shadow-md ${
          recommendation.status === 'implemented' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-white border-gray-200'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 bg-${categoryColor}-100 rounded-lg`}>
              <CategoryIcon className={`w-4 h-4 text-${categoryColor}-600`} />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{recommendation.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{recommendation.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Prioridad */}
            {recommendation.priority === 'high' && (
              <Badge variant="danger" size="sm">Alta</Badge>
            )}
            {recommendation.priority === 'medium' && (
              <Badge variant="warning" size="sm">Media</Badge>
            )}
            {recommendation.priority === 'low' && (
              <Badge variant="info" size="sm">Baja</Badge>
            )}
            
            {/* Confianza */}
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500" />
              <span className="text-xs text-gray-600">
                {Math.round(recommendation.confidence * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Recomendación principal */}
        <div className="mb-3 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">{recommendation.recommendation}</p>
        </div>

        {/* Métricas de impacto */}
        {showDetails && recommendation.impact_metrics && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
            <h5 className="text-sm font-medium text-gray-900 mb-2">Impacto Esperado</h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Mejora potencial:</span>
                <span className="font-medium text-green-600">
                  +{Math.round(recommendation.impact_metrics.potential_improvement)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Esfuerzo:</span>
                <span className="font-medium">
                  {'⭐'.repeat(Math.round(recommendation.impact_metrics.implementation_effort))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tiempo hasta resultado:</span>
                <span className="font-medium text-gray-900">
                  {Math.round(recommendation.impact_metrics.time_to_result)} días
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Satisfacción:</span>
                <span className="font-medium text-blue-600">
                  {Math.round(recommendation.impact_metrics.user_satisfaction_prediction * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Detalles expandidos */}
        {isExpanded && (
          <div className="mb-3 space-y-3">
            {/* Implementación */}
            {recommendation.implementation && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Implementación</h5>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-gray-700">Pasos:</span>
                    <ul className="mt-1 space-y-1">
                      {recommendation.implementation.steps.map((step, index) => (
                        <li key={index} className="text-xs text-gray-600 flex items-start gap-1">
                          <span className="text-gray-400">{index + 1}.</span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="font-medium text-gray-700">Tiempo estimado:</span>
                      <span className="ml-1 text-gray-600">{recommendation.implementation.estimated_time}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Dificultad:</span>
                      <span className="ml-1 text-gray-600">{recommendation.implementation.difficulty_level}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Ejemplos */}
            {recommendation.examples && recommendation.examples.length > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Ejemplos</h5>
                <ul className="space-y-1">
                  {recommendation.examples.map((example, index) => (
                    <li key={index} className="text-xs text-gray-600 flex items-start gap-1">
                      <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                      {example}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Botón principal */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleFeedback(recommendation.id, 'implemented')}
              disabled={recommendation.status === 'implemented'}
              className="text-xs"
            >
              {recommendation.status === 'implemented' ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Implementado
                </>
              ) : (
                <>
                  <ArrowRight className="w-3 h-3 mr-1" />
                  {recommendation.action_text}
                </>
              )}
            </Button>

            {/* Expandir/Contraer */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleExpanded(recommendation.id)}
              className="text-xs"
            >
              {isExpanded ? (
                <>
                  <EyeOff className="w-3 h-3 mr-1" />
                  Menos
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3 mr-1" />
                  Detalles
                </>
              )}
            </Button>
          </div>

          {/* Feedback */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFeedback(recommendation.id, 'helpful')}
              className={`text-xs ${userFeedback === 'helpful' ? 'bg-green-50 text-green-600 border-green-200' : ''}`}
            >
              <ThumbsUp className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFeedback(recommendation.id, 'not_helpful')}
              className={`text-xs ${userFeedback === 'not_helpful' ? 'bg-red-50 text-red-600 border-red-200' : ''}`}
            >
              <ThumbsDown className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFeedback(recommendation.id, 'saved')}
              className={`text-xs ${userFeedback === 'saved' ? 'bg-blue-50 text-blue-600 border-blue-200' : ''}`}
            >
              <Bookmark className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Brain className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Cargando Recomendaciones Personalizadas
          </h3>
          <p className="text-sm text-gray-600">
            Analizando tu perfil y generando sugerencias...
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-300">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg group-hover:scale-110 transition-transform duration-300`}>
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-secondary-900">🎯 Recomendaciones Personalizadas</h3>
              <p className="text-sm text-secondary-600">Sugerencias basadas en tu comportamiento y preferencias</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Mostrar detalles */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>

            {/* Refrescar */}
            <Button
              variant="outline"
              size="sm"
              onClick={refreshRecommendations}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Información de personalización */}
        {personalizationData && (
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-purple-900 mb-1">Tu Perfil de Personalización</h4>
                <p className="text-sm text-purple-700">
                  Confianza de personalización: {Math.round(personalizationData.confidence_score * 100)}%
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm text-purple-700">
                <span className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  {recommendations.length} recomendaciones
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  {categories.length} categorías
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Filtros de categoría */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filtrar por categoría:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recommendationCategories.map(category => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.id;
              const count = category.id === 'all' 
                ? recommendations.length 
                : recommendations.filter(rec => rec.category === category.id).length;

              return (
                <Button
                  key={category.id}
                  variant={isActive ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  disabled={count === 0 && category.id !== 'all'}
                  className="flex items-center gap-2 text-xs"
                >
                  <Icon className="w-3 h-3" />
                  {category.name}
                  <Badge variant="secondary" size="sm">
                    {count}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Lista de recomendaciones */}
        <div className="space-y-4">
          {filteredRecommendations.length > 0 ? (
            filteredRecommendations.map(renderRecommendation)
          ) : (
            <div className="text-center py-8">
              <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No hay recomendaciones en esta categoría
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Prueba seleccionando otra categoría o refresca las recomendaciones
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                Ver todas las categorías
              </Button>
            </div>
          )}
        </div>

        {/* Estadísticas de feedback */}
        {Object.keys(feedback).length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4" />
                  {Object.values(feedback).filter(f => f === 'helpful').length} útiles
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  {Object.values(feedback).filter(f => f === 'implemented').length} implementadas
                </span>
                <span className="flex items-center gap-1">
                  <Bookmark className="w-4 h-4" />
                  {Object.values(feedback).filter(f => f === 'saved').length} guardadas
                </span>
              </div>
              <span className="flex items-center gap-1">
                <Brain className="w-4 h-4" />
                Las recomendaciones mejoran con tu feedback
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PersonalizedRecommendationsCard;