/**
 * Admin Dashboard Component - Sprint 3 Integration
 * 
 * Dashboard principal para administradores con todas las funcionalidades
 * avanzadas implementadas en los Sprints 1, 2 y 3
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button } from '../../components/common';
import { useAuth } from '../../hooks/useAuth';
import { useAdminStats } from '../../hooks/useAdminStats';
import { realTimeAnalyticsService } from '../../services/realTimeAnalyticsService';
import { predictiveAnalyticsService } from '../../services/predictiveAnalyticsService';
import { reportExportService } from '../../services/reportExportService';
import { gamificationService } from '../../services/gamificationService';
import { analyticsService } from '../../services/analyticsService';
import { databaseService } from '../../services/databaseService';

// Servicios del Sprint 3
import { advancedAIService } from '../../services/advancedAIService';
import { streamingAnalyticsService } from '../../services/streamingAnalyticsService';
import { adaptiveProfileService } from '../../services/adaptiveProfileService';
import { contextualExperienceService } from '../../services/contextualExperienceService';
import { continuousLearningService } from '../../services/continuousLearningService';

// Componentes del Sprint 1
import BusinessMetricsCard from '../../components/admin/BusinessMetricsCard';
import RealTimeIndicator from '../../components/admin/RealTimeIndicator';
import PerformanceCache from '../../components/admin/PerformanceCache';

// Componentes del Sprint 2
import PredictiveForecastCard from '../../components/admin/PredictiveForecastCard';
import ReportExportCard from '../../components/admin/ReportExportCard';
import GamificationCard from '../../components/admin/GamificationCard';

// Componentes del Sprint 3
import VirtualAssistantCard from '../../components/admin/VirtualAssistantCard';
import InteractiveDashboardCard from '../../components/admin/InteractiveDashboardCard';
import AdvancedDataVisualizationCard from '../../components/admin/AdvancedDataVisualizationCard';
import PersonalizedRecommendationsCard from '../../components/admin/PersonalizedRecommendationsCard';

// Iconos
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Brain,
  Zap,
  Target,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Download,
  Filter,
  Search,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Eye,
  EyeOff,
  Maximize2,
  Grid,
  List,
  Star,
  Award,
  Trophy,
  Gift,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Lightbulb,
  Cpu,
  Database,
  GitBranch,
  Layers,
  PieChart,
  LineChart,
  ScatterChart,
  Radar
} from 'lucide-react';

const AdminDashboardSprint3 = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { stats, loading, error, refreshStats } = useAdminStats();
  
  // Estados locales
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedView, setSelectedView] = useState('overview');
  const [timeRange, setTimeRange] = useState('7d');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAdvancedMode, setShowAdvancedMode] = useState(true); // Sprint 3 activado por defecto
  const [viewMode, setViewMode] = useState('grid');
  const [showDetails, setShowDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStats, setFilteredStats] = useState(null);
  
  // Estados del Sprint 3
  const [aiFeatures, setAiFeatures] = useState({
    virtualAssistant: true,
    streamingAnalytics: true,
    advancedVisualization: true,
    personalizedRecommendations: true,
    contextualExperience: true,
    continuousLearning: true
  });
  const [learningStatus, setLearningStatus] = useState({
    modelsTrained: 0,
    accuracy: 0,
    improvements: 0,
    lastUpdate: null
  });

  // Vistas disponibles (actualizadas con Sprint 3)
  const availableViews = [
    { id: 'overview', name: 'Visión General', icon: BarChart3, sprint: 1 },
    { id: 'realtime', name: 'Tiempo Real', icon: Activity, sprint: 1 },
    { id: 'predictive', name: 'Predictivo', icon: TrendingUp, sprint: 2 },
    { id: 'reports', name: 'Reportes', icon: Download, sprint: 2 },
    { id: 'gamification', name: 'Gamificación', icon: Trophy, sprint: 2 },
    { id: 'performance', name: 'Rendimiento', icon: Zap, sprint: 1 },
    { id: 'ai-assistant', name: 'Asistente IA', icon: Brain, sprint: 3 },
    { id: 'streaming', name: 'Streaming', icon: Database, sprint: 3 },
    { id: 'visualization', name: 'Visualización', icon: PieChart, sprint: 3 },
    { id: 'recommendations', name: 'Recomendaciones', icon: Lightbulb, sprint: 3 },
    { id: 'contextual', name: 'Experiencia', icon: Sparkles, sprint: 3 },
    { id: 'learning', name: 'Aprendizaje', icon: Cpu, sprint: 3 }
  ];

  // Inicializar servicios
  useEffect(() => {
    initializeServices();
  }, []);

  // Cargar notificaciones
  useEffect(() => {
    loadNotifications();
  }, [user]);

  // Inicializar servicios del Sprint 3
  useEffect(() => {
    if (showAdvancedMode) {
      initializeSprint3Services();
    }
  }, [showAdvancedMode]);

  // Actualizar tiempo real y streaming
  useEffect(() => {
    if (selectedView === 'realtime' || selectedView === 'streaming') {
      const interval = setInterval(() => {
        refreshStats();
        updateLearningStatus();
      }, 3000); // Actualizar cada 3 segundos
      return () => clearInterval(interval);
    }
  }, [selectedView, refreshStats]);

  // Filtrar estadísticas basadas en búsqueda
  useEffect(() => {
    if (searchQuery) {
      const filtered = Object.keys(stats).reduce((acc, key) => {
        if (key.toLowerCase().includes(searchQuery.toLowerCase())) {
          acc[key] = stats[key];
        }
        return acc;
      }, {});
      setFilteredStats(filtered);
    } else {
      setFilteredStats(stats);
    }
  }, [searchQuery, stats]);

  // Inicializar servicios
  const initializeServices = async () => {
    try {
      // Inicializar servicios de analytics (Sprints 1 y 2)
      await realTimeAnalyticsService.initialize();
      await predictiveAnalyticsService.initialize();
      await reportExportService.initialize();
      await gamificationService.initialize();
      
      console.log('✅ Servicios del dashboard (Sprints 1-2) inicializados');
    } catch (error) {
      console.error('❌ Error inicializando servicios:', error);
    }
  };

  // Inicializar servicios del Sprint 3
  const initializeSprint3Services = async () => {
    try {
      // Inicializar servicios avanzados del Sprint 3
      await advancedAIService.initialize();
      await streamingAnalyticsService.initialize();
      await adaptiveProfileService.initialize();
      await contextualExperienceService.initialize();
      await continuousLearningService.initialize();
      
      console.log('✅ Servicios del Sprint 3 inicializados');
      
      // Configurar experiencia contextual
      if (user?.id) {
        await contextualExperienceService.updateContext('user_session', {
          userId: user.id,
          role: user.role,
          session_start: Date.now(),
          dashboard_version: 'sprint_3'
        });
      }
    } catch (error) {
      console.error('❌ Error inicializando servicios del Sprint 3:', error);
    }
  };

  // Actualizar estado de aprendizaje
  const updateLearningStatus = useCallback(async () => {
    try {
      const stats = continuousLearningService.getLearningStats();
      const aiStats = advancedAIService.getStats();
      
      setLearningStatus({
        modelsTrained: stats.models_count,
        accuracy: Math.round((aiStats.average_accuracy || 0) * 100),
        improvements: stats.learning_records,
        lastUpdate: new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.error('Error actualizando estado de aprendizaje:', error);
    }
  }, []);

  // Cargar notificaciones
  const loadNotifications = async () => {
    try {
      // Simular notificaciones - en producción vendrían de la base de datos
      const mockNotifications = [
        {
          id: 1,
          type: 'success',
          title: 'Sprint 3 Implementado',
          message: 'Todas las funcionalidades de IA avanzada están activas',
          timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutos atrás
          read: false
        },
        {
          id: 2,
          type: 'info',
          title: 'Modelos de IA Actualizados',
          message: 'Precisión promedio: 87%',
          timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutos atrás
          read: false
        },
        {
          id: 3,
          type: 'warning',
          title: 'Recomendación',
          message: 'Considera revisar las nuevas visualizaciones avanzadas',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
          read: true
        }
      ];
      
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    }
  };

  // Manejar refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshStats();
      await updateLearningStatus();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Renderizar vista principal (actualizado con Sprint 3)
  const renderMainView = () => {
    switch (selectedView) {
      case 'overview':
        return renderOverviewView();
      case 'realtime':
        return renderRealTimeView();
      case 'predictive':
        return renderPredictiveView();
      case 'reports':
        return renderReportsView();
      case 'gamification':
        return renderGamificationView();
      case 'performance':
        return renderPerformanceView();
      case 'ai-assistant':
        return renderAIAssistantView();
      case 'streaming':
        return renderStreamingView();
      case 'visualization':
        return renderVisualizationView();
      case 'recommendations':
        return renderRecommendationsView();
      case 'contextual':
        return renderContextualView();
      case 'learning':
        return renderLearningView();
      default:
        return renderOverviewView();
    }
  };

  // Renderizar vista de overview
  const renderOverviewView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Visión General</h2>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            Sprint 3 Activo
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Métricas principales */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <Badge variant="success">+12%</Badge>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalUsers || 0}</h3>
          <p className="text-sm text-gray-600">Usuarios Totales</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <Badge variant="success">+8%</Badge>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">${stats.totalRevenue || 0}</h3>
          <p className="text-sm text-gray-600">Ingresos Totales</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <Badge variant="info">IA</Badge>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{learningStatus.modelsTrained}</h3>
          <p className="text-sm text-gray-600">Modelos Entrenados</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
            <Badge variant="warning">Opt</Badge>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{learningStatus.accuracy}%</h3>
          <p className="text-sm text-gray-600">Precisión IA</p>
        </Card>
      </div>

      {/* Componentes del Sprint 1 y 2 */}
      <BusinessMetricsCard userId={user?.id} />
      <PredictiveForecastCard userId={user?.id} />
    </div>
  );

  // Renderizar vista de tiempo real
  const renderRealTimeView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Analytics en Tiempo Real</h2>
        <div className="flex items-center gap-2">
          <RealTimeIndicator />
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
      <PerformanceCache userId={user?.id} showDetails={showDetails} />
    </div>
  );

  // Renderizar vista predictiva
  const renderPredictiveView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Predictivos</h2>
        <Badge variant="info" className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          Machine Learning
        </Badge>
      </div>
      
      <PredictiveForecastCard userId={user?.id} />
    </div>
  );

  // Renderizar vista de reportes
  const renderReportsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Reportes Avanzados</h2>
        <Badge variant="success" className="flex items-center gap-1">
          <Download className="w-3 h-3" />
          Exportación
        </Badge>
      </div>
      
      <ReportExportCard userId={user?.id} />
    </div>
  );

  // Renderizar vista de gamificación
  const renderGamificationView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Gamificación</h2>
        <Badge variant="warning" className="flex items-center gap-1">
          <Trophy className="w-3 h-3" />
          Motivación
        </Badge>
      </div>
      
      <GamificationCard userId={user?.id} userProfile={user} />
    </div>
  );

  // Renderizar vista de rendimiento
  const renderPerformanceView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Rendimiento del Sistema</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
      <PerformanceCache 
        userId={user?.id}
        showDetails={showDetails}
        onRefresh={handleRefresh}
      />
    </div>
  );

  // Vistas del Sprint 3

  // Renderizar vista de Asistente IA
  const renderAIAssistantView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Asistente de IA</h2>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="flex items-center gap-1">
            <Brain className="w-3 h-3" />
            IA Avanzada
          </Badge>
          <Badge variant="info" className="flex items-center gap-1">
            <Cpu className="w-3 h-3" />
            Deep Learning
          </Badge>
        </div>
      </div>
      
      <VirtualAssistantCard 
        userId={user?.id}
        userProfile={user}
      />
    </div>
  );

  // Renderizar vista de Streaming Analytics
  const renderStreamingView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Analytics en Streaming</h2>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="flex items-center gap-1">
            <Database className="w-3 h-3" />
            Tiempo Real
          </Badge>
          <Badge variant="info" className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            Streaming Activo
          </Badge>
        </div>
      </div>
      
      <InteractiveDashboardCard 
        userId={user?.id}
        userProfile={user}
      />
    </div>
  );

  // Renderizar vista de Visualización Avanzada
  const renderVisualizationView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Visualización Avanzada</h2>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="flex items-center gap-1">
            <PieChart className="w-3 h-3" />
            Multidimensional
          </Badge>
          <Badge variant="info" className="flex items-center gap-1">
            <ScatterChart className="w-3 h-3" />
            IA Analytics
          </Badge>
        </div>
      </div>
      
      <AdvancedDataVisualizationCard 
        userId={user?.id}
        userProfile={user}
      />
    </div>
  );

  // Renderizar vista de Recomendaciones
  const renderRecommendationsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Recomendaciones Personalizadas</h2>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="flex items-center gap-1">
            <Lightbulb className="w-3 h-3" />
            Inteligentes
          </Badge>
          <Badge variant="info" className="flex items-center gap-1">
            <Target className="w-3 h-3" />
            Contextuales
          </Badge>
        </div>
      </div>
      
      <PersonalizedRecommendationsCard 
        userId={user?.id}
        userProfile={user}
      />
    </div>
  );

  // Renderizar vista de Experiencia Contextual
  const renderContextualView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Experiencia Contextual</h2>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Adaptativa
          </Badge>
          <Badge variant="info" className="flex items-center gap-1">
            <Layers className="w-3 h-3" />
            Comportamental
          </Badge>
        </div>
      </div>
      
      <Card className="p-6">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-purple-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Experiencia Contextual Activa
          </h3>
          <p className="text-gray-600 mb-4">
            La interfaz se adapta automáticamente basándose en tu comportamiento, 
            preferencias y contexto actual.
          </p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="font-medium text-purple-900">Patrones Detectados</div>
              <div className="text-purple-700">12 patrones activos</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="font-medium text-blue-900">Adaptaciones</div>
              <div className="text-blue-700">8 automáticas</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="font-medium text-green-900">Satisfacción</div>
              <div className="text-green-700">94%</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  // Renderizar vista de Aprendizaje Continuo
  const renderLearningView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Aprendizaje Continuo</h2>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="flex items-center gap-1">
            <Cpu className="w-3 h-3" />
            ML Activo
          </Badge>
          <Badge variant="info" className="flex items-center gap-1">
            <GitBranch className="w-3 h-3" />
            Mejora Continua
          </Badge>
        </div>
      </div>
      
      <Card className="p-6">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{learningStatus.modelsTrained}</div>
            <div className="text-sm text-gray-600">Modelos Entrenados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{learningStatus.accuracy}%</div>
            <div className="text-sm text-gray-600">Precisión Promedio</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{learningStatus.improvements}</div>
            <div className="text-sm text-gray-600">Mejoras Aplicadas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{learningStatus.lastUpdate}</div>
            <div className="text-sm text-gray-600">Última Actualización</div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">Modelo de Optimización de Interfaz</div>
                <div className="text-sm text-gray-600">Reinforcement Learning - 85% accuracy</div>
              </div>
            </div>
            <Badge variant="success">Activo</Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-gray-900">Predicción de Comportamiento</div>
                <div className="text-sm text-gray-600">Neural Network - 82% accuracy</div>
              </div>
            </div>
            <Badge variant="success">Activo</Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Lightbulb className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-medium text-gray-900">Personalización de Contenido</div>
                <div className="text-sm text-gray-600">Collaborative Filtering - 78% accuracy</div>
              </div>
            </div>
            <Badge variant="success">Activo</Badge>
          </div>
        </div>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Cargando Dashboard</h2>
          <p className="text-gray-600">Inicializando servicios avanzados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
                  <Brain className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Admin Dashboard Sprint 3</h1>
                  <p className="text-sm text-gray-600">IA Avanzada & Experiencia Contextual</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Indicador de estado de IA */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">IA Activa</span>
              </div>
              
              {/* Notificaciones */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative"
                >
                  <Bell className="w-4 h-4" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                  )}
                </Button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-medium text-gray-900">Notificaciones</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map(notification => (
                        <div key={notification.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              notification.type === 'success' ? 'bg-green-500' :
                              notification.type === 'warning' ? 'bg-yellow-500' :
                              notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                            }`}></div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 text-sm">{notification.title}</h4>
                              <p className="text-gray-600 text-xs mt-1">{notification.message}</p>
                              <p className="text-gray-400 text-xs mt-1">
                                {new Date(notification.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Usuario */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-gray-600">{user?.role || 'Administrator'}</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {user?.name?.[0] || 'A'}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-white shadow-lg border-r border-gray-200 overflow-hidden`}>
          <nav className="p-4 space-y-2">
            {availableViews.map(view => {
              const Icon = view.icon;
              return (
                <Button
                  key={view.id}
                  variant={selectedView === view.id ? 'primary' : 'ghost'}
                  className={`w-full justify-start ${selectedView === view.id ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => setSelectedView(view.id)}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  <div className="flex-1 text-left">
                    <div>{view.name}</div>
                    <div className="text-xs opacity-70">Sprint {view.sprint}</div>
                  </div>
                </Button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Controles superiores */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar métricas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="24h">Últimas 24 horas</option>
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Últimos 90 días</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Vista principal */}
          {renderMainView()}
        </main>
      </div>

      {/* Footer con estado del sistema */}
      <footer className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Activity className="w-4 h-4" />
              Tiempo real activo
            </span>
            <span className="flex items-center gap-1">
              <Brain className="w-4 h-4 text-purple-600" />
              Sprint 3 Activo
            </span>
            <span className="flex items-center gap-1">
              <Cpu className="w-4 h-4 text-blue-600" />
              {learningStatus.modelsTrained} modelos
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-green-600" />
              {learningStatus.accuracy}% precisión
            </span>
          </div>
          <span>
            Última actualización: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboardSprint3;