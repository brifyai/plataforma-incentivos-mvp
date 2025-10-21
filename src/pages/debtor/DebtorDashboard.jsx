/**
 * Debtor Dashboard Page
 *
 * Dashboard principal para deudores con analytics avanzados
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, LoadingSpinner, Button, ErrorBoundary } from '../../components/common';
import { useDebts, useOffers, useWallet } from '../../hooks';
import { useRealtimePayments, useRealtimeDebts, useRealtimeAgreements, useRealtimeNotifications } from '../../hooks/useRealtime';
import realtimeService from '../../services/realtimeService';
import { useDebtorAnalytics } from '../../hooks/useDebtorAnalytics';
import { useDebtorGamification } from '../../hooks/useDebtorGamification';
import { getDebtorDashboardStats, getUserCommissionStats, updateUserProfile } from '../../services/databaseService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import CompleteProfileModal from '../../components/auth/CompleteProfileModal';
import FinancialMetricsCard from '../../components/debtor/FinancialMetricsCard';
import PaymentPredictionsCard from '../../components/debtor/PaymentPredictionsCard';
import ProgressGoalsCard from '../../components/debtor/ProgressGoalsCard';
import InteractiveChartsCard from '../../components/debtor/InteractiveChartsCard';
import GamificationCard from '../../components/debtor/GamificationCard';
import AIAssistantCard from '../../components/debtor/AIAssistantCard';
import DebtorNavigationMenu from '../../components/debtor/DebtorNavigationMenu';
import UnifiedDashboard from '../../components/common/UnifiedDashboard';
import SharedNegotiationStatus from '../../components/common/SharedNegotiationStatus';
import ConsolidatedFinancialProgress from '../../components/common/ConsolidatedFinancialProgress';
import {
  Wallet,
  TrendingUp,
  CheckCircle,
  DollarSign,
  ArrowRight,
  Coins,
  Calculator,
  PiggyBank,
  Target,
  CreditCard,
  Settings,
  AlertTriangle,
  Star,
  Bot,
  Brain,
  BarChart3,
  Trophy,
} from 'lucide-react';

const DebtorDashboard = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { debts, loading: debtsLoading, refreshDebts } = useDebts();
  const { offers, loading: offersLoading, refreshOffers } = useOffers();
  const { balance, loading: walletLoading, refreshWallet } = useWallet();
  
  // Analytics avanzados
  const {
    financialMetrics,
    paymentPredictions,
    behavioralAnalysis,
    progressMetrics,
    visualizationData,
    loading: analyticsLoading,
    error: analyticsError,
    lastUpdated: analyticsLastUpdated,
    derivedMetrics,
    loadAllData,
    refreshData
  } = useDebtorAnalytics(user?.id, {
    enableRealTime: true,
    autoRefresh: true,
    refreshInterval: 30000
  });
  
  // Gamificación avanzada
  const {
    gamificationProfile,
    loading: gamificationLoading,
    error: gamificationError,
    lastUpdated: gamificationLastUpdated,
    loadAllData: loadGamificationData,
    unlockAchievement,
    redeemReward
  } = useDebtorGamification(user?.id, {
    enableRealTime: true,
    autoRefresh: true,
    refreshInterval: 60000
  });

  const [stats, setStats] = useState(null);
  const [commissionStats, setCommissionStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);
  const [showGamification, setShowGamification] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [activeSection, setActiveSection] = useState('overview'); // overview, analytics, gamification, ai
  const [realtimeStatus, setRealtimeStatus] = useState('connecting'); // connecting, connected, error, disabled
  const [realtimeErrors, setRealtimeErrors] = useState([]);
  const [showEcosystemView, setShowEcosystemView] = useState(false); // Temporalmente desactivado
  const [ecosystemViewMode, setEcosystemViewMode] = useState('unified'); // unified, negotiations, financial
  const navigate = useNavigate();

  // Debug para verificar el estado del Asistente IA
  useEffect(() => {
    console.log('🤖 Estado showAIAssistant:', showAIAssistant);
    console.log('🤖 Usuario disponible:', !!user);
  }, [showAIAssistant, user]);

  // Función para cargar estadísticas con manejo robusto de errores
  const loadStats = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Skip loading stats for god mode user (mock user not in database)
      if (user.id === 'god-mode-user') {
        setStats({
          totalDebts: 0,
          totalDebtAmount: 0,
          activeAgreements: 0,
          completedPayments: 0,
          totalPaid: 0,
          walletBalance: 0,
        });
        setCommissionStats({
          earnedCommissions: 0,
          nextCommission: 0,
          monthlyPotential: 0,
        });
        setLoading(false);
        return;
      }

      // Cargar estadísticas del dashboard y comisiones en paralelo con timeout
      const [dashboardResult, commissionResult] = await Promise.allSettled([
        Promise.race([
          getDebtorDashboardStats(user.id),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout loading dashboard stats')), 10000))
        ]),
        Promise.race([
          getUserCommissionStats(user.id),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout loading commission stats')), 10000))
        ])
      ]);

      // Procesar estadísticas del dashboard con manejo de errores
      if (dashboardResult.status === 'fulfilled' && !dashboardResult.value.error && dashboardResult.value.stats) {
        setStats(dashboardResult.value.stats);
      } else {
        console.warn('Error loading dashboard stats:', dashboardResult.reason || dashboardResult.value?.error);
        setStats({
          totalDebts: 0,
          totalDebtAmount: 0,
          activeAgreements: 0,
          completedPayments: 0,
          totalPaid: 0,
          walletBalance: 0,
        });
      }

      // Procesar estadísticas de comisiones con manejo de errores
      if (commissionResult.status === 'fulfilled' && !commissionResult.value.error && commissionResult.value.commissionStats) {
        setCommissionStats(commissionResult.value.commissionStats);
      } else {
        console.warn('Error loading commission stats:', commissionResult.reason || commissionResult.value?.error);
        setCommissionStats({
          earnedCommissions: 0,
          nextCommission: 0,
          monthlyPotential: 0,
        });
      }
    } catch (err) {
      console.error('Error loading stats:', err);
      // Establecer valores por defecto en caso de error general
      setStats({
        totalDebts: 0,
        totalDebtAmount: 0,
        activeAgreements: 0,
        completedPayments: 0,
        totalPaid: 0,
        walletBalance: 0,
      });
      setCommissionStats({
        earnedCommissions: 0,
        nextCommission: 0,
        monthlyPotential: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    
    // Verificar si el usuario necesita completar su perfil
    if (user && profile && shouldShowCompleteProfileModal()) {
      // Mostrar el modal después de un breve retraso para que el usuario vea el dashboard primero
      setTimeout(() => {
        setShowCompleteProfileModal(true);
      }, 2000);
    }
  }, [user, profile]);

  // Cargar datos de analytics cuando el usuario está disponible
  useEffect(() => {
    if (user && showAdvancedAnalytics) {
      loadAllData();
    }
  }, [user, showAdvancedAnalytics, loadAllData]);

  // Cargar datos de gamificación cuando el usuario está disponible
  useEffect(() => {
    if (user && showGamification) {
      loadGamificationData();
    }
  }, [user, showGamification, loadGamificationData]);

  // Monitorear estado de conexión realtime
  useEffect(() => {
    const checkRealtimeStatus = async () => {
      try {
        const health = await realtimeService.checkConnectionHealth();
        setRealtimeStatus(health.health);
        
        if (health.health === 'unhealthy' || health.health === 'degraded') {
          console.warn('⚠️ Realtime connection issues detected:', health);
          setRealtimeErrors(prev => [...prev.slice(-2), `Realtime: ${health.health}`]);
        }
      } catch (error) {
        console.error('❌ Error checking realtime status:', error);
        setRealtimeStatus('error');
        setRealtimeErrors(prev => [...prev.slice(-2), 'Realtime: Connection failed']);
      }
    };

    // Verificar estado inicial
    checkRealtimeStatus();

    // Verificar estado periódicamente
    const interval = setInterval(checkRealtimeStatus, 30000); // cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  // Sincronización en tiempo real para pagos con manejo de errores
  useRealtimePayments(
    (payload) => {
      console.log('💰 Nuevo pago detectado en dashboard:', payload);
      // Actualizar estadísticas y balance
      loadStats();
      refreshWallet();
      
      // Mostrar notificación visual
      showNotification('¡Nuevo pago registrado!', 'success');
    },
    (payload) => {
      console.log('💰 Pago actualizado en dashboard:', payload);
      // Actualizar estadísticas y balance
      loadStats();
      refreshWallet();
      
      // Mostrar notificación visual
      showNotification('Pago actualizado', 'info');
    },
    (error) => {
      console.error('❌ Error en realtime payments:', error);
      setRealtimeErrors(prev => [...prev.slice(-2), 'Payments: Connection error']);
      setRealtimeStatus('error');
    }
  );

  // Sincronización en tiempo real para deudas con manejo de errores
  useRealtimeDebts(
    (payload) => {
      console.log('📄 Nueva deuda detectada en dashboard:', payload);
      // Actualizar deudas y estadísticas
      refreshDebts();
      loadStats();
      
      // Mostrar notificación visual
      showNotification('Nueva deuda registrada', 'warning');
    },
    (payload) => {
      console.log('📄 Deuda actualizada en dashboard:', payload);
      // Actualizar deudas y estadísticas
      refreshDebts();
      loadStats();
      
      // Mostrar notificación visual
      showNotification('Deuda actualizada', 'info');
    },
    (error) => {
      console.error('❌ Error en realtime debts:', error);
      setRealtimeErrors(prev => [...prev.slice(-2), 'Debts: Connection error']);
      setRealtimeStatus('error');
    }
  );

  // Sincronización en tiempo real para acuerdos con manejo de errores
  useRealtimeAgreements(
    (payload) => {
      console.log('🤝 Nuevo acuerdo detectado en dashboard:', payload);
      // Actualizar todo
      refreshDebts();
      refreshOffers();
      loadStats();
      
      // Mostrar notificación visual
      showNotification('¡Nuevo acuerdo creado!', 'success');
    },
    (payload) => {
      console.log('🤝 Acuerdo actualizado en dashboard:', payload);
      // Actualizar todo
      refreshDebts();
      refreshOffers();
      loadStats();
      
      // Mostrar notificación visual
      showNotification('Acuerdo actualizado', 'info');
    },
    (error) => {
      console.error('❌ Error en realtime agreements:', error);
      setRealtimeErrors(prev => [...prev.slice(-2), 'Agreements: Connection error']);
      setRealtimeStatus('error');
    }
  );

  // Sincronización en tiempo real para notificaciones con manejo de errores
  useRealtimeNotifications(
    (payload) => {
      console.log('🔔 Nueva notificación:', payload);
      // Mostrar notificación visual
      const notification = payload.new;
      showNotification(notification.title || 'Nueva notificación', 'info');
    },
    (error) => {
      console.error('❌ Error en realtime notifications:', error);
      setRealtimeErrors(prev => [...prev.slice(-2), 'Notifications: Connection error']);
      setRealtimeStatus('error');
    }
  );

  // Refresco periódico como fallback cuando realtime falla
  useEffect(() => {
    if (realtimeStatus === 'error' || realtimeStatus === 'degraded') {
      const fallbackInterval = setInterval(() => {
        console.log('🔄 Fallback refresh due to realtime issues');
        loadStats();
        refreshDebts();
        refreshOffers();
        refreshWallet();
      }, 60000); // cada minuto cuando hay problemas

      return () => clearInterval(fallbackInterval);
    }
  }, [realtimeStatus, loadStats, refreshDebts, refreshOffers, refreshWallet]);

  // Función para mostrar notificaciones visuales
  const showNotification = (message, type = 'info') => {
    // Crear una notificación temporal en el DOM
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg animate-slide-in-right ${
      type === 'success' ? 'bg-success-500 text-white' :
      type === 'warning' ? 'bg-warning-500 text-white' :
      type === 'error' ? 'bg-danger-500 text-white' :
      'bg-primary-500 text-white'
    }`;
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="flex-shrink-0">
          ${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'error' ? '❌' : 'ℹ️'}
        </div>
        <div class="flex-1">
          <p class="font-medium">${message}</p>
          <p class="text-sm opacity-90">Actualizado hace un momento</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Eliminar la notificación después de 5 segundos
    setTimeout(() => {
      notification.classList.add('animate-slide-out-right');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 5000);
    
    // Actualizar timestamp de última actualización
    setLastUpdate(new Date());
  };


  // Función para verificar si se debe mostrar el modal de completar perfil
  const shouldShowCompleteProfileModal = () => {
    if (!profile) return false;
    
    // Verificar si el usuario se registró con Google OAuth
    const isGoogleUser = profile.oauth_signup ||
                         user?.app_metadata?.provider === 'google' ||
                         user?.user_metadata?.provider === 'google' ||
                         localStorage.getItem('oauth_signup') === 'true';
    
    // Verificar si necesita completar perfil (campo en la base de datos o verificación manual)
    const needsCompletion = profile.needs_profile_completion ||
                           (!profile.full_name || !profile.rut || !profile.phone);
    
    // Mostrar modal si es usuario de Google y necesita completar perfil
    return isGoogleUser && needsCompletion;
  };

  // Función para guardar los datos del perfil
  const handleSaveProfile = async (formData) => {
    if (!user) return;
    
    try {
      const updates = {
        full_name: formData.fullName || profile.full_name,
        rut: formData.rut || profile.rut,
        phone: formData.phone || profile.phone,
        needs_profile_completion: false, // Marcar que el perfil ya está completo
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await updateUserProfile(user.id, updates);
      
      if (error) {
        throw new Error(error);
      }
      
      // Limpiar flag de OAuth signup
      localStorage.removeItem('oauth_signup');
      
      // Recargar el perfil
      await refreshProfile();
      
      // Cerrar el modal
      setShowCompleteProfileModal(false);
      
      // Mostrar notificación de éxito
      showNotification('Perfil actualizado correctamente', 'success');
      
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  };

  // Manejo robusto de loading states
  const isLoading = loading || debtsLoading || offersLoading || walletLoading;
  
  if (isLoading) {
    return <LoadingSpinner fullScreen text="Cargando dashboard..." />;
  }
  
  // Verificación de datos mínimos requeridos
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Usuario no encontrado</h2>
          <p className="text-gray-600 mb-4">
            No se pudo cargar la información del usuario. Por favor, inicia sesión nuevamente.
          </p>
          <Button onClick={() => window.location.href = '/login'}>
            Iniciar Sesión
          </Button>
        </div>
      </div>
    );
  }

  // Manejo seguro de datos con fallbacks
  const safeDebts = Array.isArray(debts) ? debts : [];
  const safeOffers = Array.isArray(offers) ? offers : [];
  const safeBalance = typeof balance === 'number' ? balance : 0;
  const safeStats = stats || {};
  const safeCommissionStats = commissionStats || {};
  
  const activeDebts = safeDebts.filter(d => d && (d.status === 'active' || d.status === 'in_negotiation'));
  const activeOffers = safeOffers.filter(o => o && o.status === 'active');

  return (
    <div className="space-y-8">
      {/* Realtime Status Indicator */}
      <div className={`fixed top-4 right-4 z-40 bg-white/90 backdrop-blur-sm rounded-full px-3 py-2 shadow-md border flex items-center gap-2 ${
        realtimeStatus === 'connected' ? 'border-green-200' :
        realtimeStatus === 'connecting' ? 'border-yellow-200' :
        realtimeStatus === 'error' ? 'border-red-200' :
        'border-gray-200'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          realtimeStatus === 'connected' ? 'bg-green-500 animate-pulse' :
          realtimeStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
          realtimeStatus === 'error' ? 'bg-red-500' :
          'bg-gray-500'
        }`}></div>
        <span className="text-xs font-medium text-gray-700">
          {realtimeStatus === 'connected' ? 'Tiempo real' :
           realtimeStatus === 'connecting' ? 'Conectando...' :
           realtimeStatus === 'error' ? 'Sin conexión' :
           'Desactivado'}
        </span>
        <span className="text-xs text-gray-500">
          {lastUpdate.toLocaleTimeString()}
        </span>
        {realtimeErrors.length > 0 && (
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
        )}
      </div>

      {/* Realtime Error Banner */}
      {realtimeStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 text-sm">Conexión en tiempo real limitada</h3>
              <p className="text-red-700 text-xs">
                Algunas actualizaciones pueden tardar más en reflejarse. La página se actualizará automáticamente.
              </p>
              {realtimeErrors.length > 0 && (
                <div className="mt-1 text-xs text-red-600">
                  Errores: {realtimeErrors.join(', ')}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setRealtimeStatus('connecting');
                realtimeService.resetConnection();
              }}
              className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <DebtorNavigationMenu />

      {/* Floating AI Assistant Button - Solo visible cuando no está activo */}
      {activeSection !== 'ai' && (
        <button
          onClick={() => {
            console.log('🤖 Botón flotante Asistente IA clickeado');
            setActiveSection('ai');
            setShowAIAssistant(true);
            setTimeout(() => {
              const element = document.getElementById('ai-assistant-section');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 100);
          }}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center group"
        >
          <Bot className="w-6 h-6 group-hover:animate-bounce" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
          <span className="absolute bottom-full mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            🤖 Asistente IA
          </span>
        </button>
      )}

      {/* Contenido solo para la sección overview (resumen) */}
      {window.location.pathname === '/personas/dashboard' && (
        <div className="space-y-6">
          {/* Header Modernizado */}
          <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 rounded-3xl p-4 text-white shadow-strong animate-fade-in">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
            </div>

            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-display font-bold tracking-tight">
                      ¡Hola, {user?.user_metadata?.full_name?.split(' ')[0] || profile?.full_name?.split(' ')[0] || 'Usuario'}!
                    </h1>
                    <p className="text-primary-100 text-sm">
                      Negocia tus deudas y gana el <span className="font-bold text-yellow-300">50% en comisiones</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards Modernizadas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
              <div className="p-0.5">
                <div className="flex items-center justify-center mb-2">
                  <div className="p-1.5 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg group-hover:shadow-glow-blue transition-all duration-300">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
                  {safeStats.totalDebts || 0}
                </h3>
                <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Deudas Activas</p>
                <div className="text-xs text-blue-600 mt-0.5 font-medium">
                  En gestión
                </div>
              </div>
            </Card>

            <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
              <div className="p-0.5">
                <div className="flex items-center justify-center mb-2">
                  <div className="p-1.5 bg-gradient-to-br from-green-100 to-green-200 rounded-lg group-hover:shadow-glow-green transition-all duration-300">
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                </div>
                <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
                  {formatCurrency(safeBalance)}
                </h3>
                <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Saldo</p>
                <div className="text-xs text-green-600 mt-0.5 font-medium">
                  Billetera
                </div>
              </div>
            </Card>

            <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
              <div className="p-0.5">
                <div className="flex items-center justify-center mb-2">
                  <div className="p-1.5 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg group-hover:shadow-glow-purple transition-all duration-300">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
                  {safeStats.activeAgreements || 0}
                </h3>
                <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Acuerdos</p>
                <div className="text-xs text-purple-600 mt-0.5 font-medium">
                  Activos
                </div>
              </div>
            </Card>
          </div>

          {/* Commission Earnings Section Modernizada */}
          <div className="space-y-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
            {/* Header de Comisiones */}
            <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 rounded-3xl p-4 text-white shadow-strong">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
              </div>

              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
                      <Coins className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-display font-bold tracking-tight">
                        💰 Gana Dinero Negociando tus Deudas
                      </h2>
                      <p className="text-amber-100 text-sm">
                        Recibe el <span className="font-bold text-white">50% de comisión</span> por cada acuerdo exitoso
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards de Comisiones */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
                <div className="p-0.5">
                  <div className="flex items-center justify-center mb-2">
                    <div className="p-1.5 bg-gradient-to-br from-green-100 to-green-200 rounded-lg group-hover:shadow-glow-green transition-all duration-300">
                      <PiggyBank className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
                    {formatCurrency(safeCommissionStats.earnedCommissions || 0)}
                  </h3>
                  <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Ganado</p>
                  <div className="text-xs text-green-600 mt-0.5 font-medium">
                    Este mes
                  </div>
                </div>
              </Card>

              <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
                <div className="p-0.5">
                  <div className="flex items-center justify-center mb-2">
                    <div className="p-1.5 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg group-hover:shadow-glow-purple transition-all duration-300">
                      <Target className="w-4 h-4 text-purple-600" />
                    </div>
                  </div>
                  <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
                    {formatCurrency(safeCommissionStats.nextCommission || 0)}
                  </h3>
                  <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Próxima</p>
                  <div className="text-xs text-purple-600 mt-0.5 font-medium">
                    Comisión
                  </div>
                </div>
              </Card>

              <Card className="text-center group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
                <div className="p-0.5">
                  <div className="flex items-center justify-center mb-2">
                    <div className="p-1.5 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg group-hover:shadow-glow-blue transition-all duration-300">
                      <Calculator className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-lg font-display font-bold text-secondary-900 mb-0.5">
                    {formatCurrency(safeCommissionStats.monthlyPotential || 0)}
                  </h3>
                  <p className="text-secondary-600 font-medium uppercase tracking-wide text-xs">Potencial</p>
                  <div className="text-xs text-blue-600 mt-0.5 font-medium">
                    Mensual
                  </div>
                </div>
              </Card>
            </div>

            {/* Mensaje Motivacional Modernizado */}
            <Card className="group hover:scale-[1.01] transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl group-hover:shadow-soft transition-all duration-300">
                    <Target className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-secondary-900 mb-1">🎯 ¿Sabías que...?</h3>
                    <p className="text-secondary-600 text-sm">
                      Cuando una deuda entra en mora, <span className="font-bold text-secondary-900">las empresas de cobranza contactan a la persona</span> para negociar acuerdos.
                    </p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200 mb-4">
                  <p className="text-secondary-700 text-sm leading-relaxed">
                    Con nuestra plataforma, tú <span className="font-bold text-amber-700">ganas el 50% de comisión por cada acuerdo exitoso</span>.
                    ¡Registra tus deudas y genera ingresos cuando negocien!
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/personas/ofertas">
                    <Button
                      variant="gradient"
                      size="md"
                      className="flex-1 shadow-soft hover:shadow-glow hover:scale-105 transition-all"
                      leftIcon={<DollarSign className="w-4 h-4" />}
                    >
                      Realizar Pago
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="md"
                    className="flex-1 hover:scale-105 transition-all bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                    leftIcon={<Bot className="w-4 h-4" />}
                    onClick={() => {
                      console.log('🤖 Botón Asistente IA clickeado');
                      setActiveSection('ai');
                      setShowAIAssistant(true);
                    }}
                  >
                    🤖 Asistente IA
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    className="flex-1 hover:scale-105 transition-all"
                    leftIcon={<Calculator className="w-4 h-4" />}
                    onClick={() => navigate('/personas/simulador')}
                  >
                    Calcular Ganancias
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}


      {/* Advanced Analytics Section */}
      {showAdvancedAnalytics && user && (
        <div className="space-y-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
          {/* Analytics Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl">
                <Brain className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-secondary-900">
                  Analytics Avanzados
                </h2>
                <p className="text-secondary-600 text-sm">
                  Análisis predictivo e inteligencia financiera personalizada
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {analyticsLastUpdated && (
                <span className="text-xs text-gray-500">
                  Actualizado: {analyticsLastUpdated.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={() => loadAllData()}
                className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors"
                disabled={analyticsLoading}
              >
                <Settings className={`w-4 h-4 ${analyticsLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowAdvancedAnalytics(false)}
                className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          {/* Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Financial Metrics */}
            <FinancialMetricsCard
              financialMetrics={financialMetrics}
              loading={analyticsLoading.financial}
              onRefresh={() => refreshData('financial')}
              lastUpdated={analyticsLastUpdated}
            />

            {/* Payment Predictions */}
            <PaymentPredictionsCard
              paymentPredictions={paymentPredictions}
              loading={analyticsLoading.predictions}
              onRefresh={() => refreshData('predictions')}
              behavioralAnalysis={behavioralAnalysis}
            />

            {/* Progress Goals */}
            <ProgressGoalsCard
              progressMetrics={progressMetrics}
              loading={analyticsLoading.progress}
              onRefresh={() => refreshData('progress')}
              onMilestoneComplete={(milestone) => {
                console.log('Milestone completed:', milestone);
                // Aquí se podría mostrar una celebración o notificación
              }}
            />

            {/* Interactive Charts */}
            <InteractiveChartsCard
              visualizationData={visualizationData}
              loading={analyticsLoading.visualization}
              onRefresh={() => refreshData('visualization')}
              onExport={(chartType, data, timeRange) => {
                console.log('Exporting chart:', chartType, data, timeRange);
                // Implementar exportación de datos
              }}
              userId={user?.id}
            />
          </div>

          {/* Analytics Error */}
          {analyticsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-900">Error en Analytics</h3>
                  <p className="text-red-700 text-sm">{analyticsError}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gamification Section */}
      {showGamification && user && (
        <div className="space-y-6 animate-slide-up" style={{ animationDelay: '600ms' }}>
          {/* Gamification Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                <Trophy className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-secondary-900">
                  Gamificación Motivacional
                </h2>
                <p className="text-secondary-600 text-sm">
                  Sube de nivel, gana logros y recompensas exclusivas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {gamificationLastUpdated && (
                <span className="text-xs text-gray-500">
                  Actualizado: {gamificationLastUpdated.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={() => loadGamificationData()}
                className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                disabled={gamificationLoading}
              >
                <Settings className={`w-4 h-4 ${gamificationLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowGamification(false)}
                className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          {/* Gamification Card */}
          <GamificationCard
            gamificationProfile={gamificationProfile}
            loading={gamificationLoading.profile}
            onRefresh={() => loadGamificationData()}
            onAchievementUnlock={(achievementId) => {
              console.log('Achievement unlocked:', achievementId);
              unlockAchievement(achievementId);
            }}
            onRewardRedeem={(rewardId) => {
              console.log('Reward redeemed:', rewardId);
              redeemReward(rewardId);
            }}
          />

          {/* Gamification Error */}
          {gamificationError && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900">Error en Gamificación</h3>
                  <p className="text-purple-700 text-sm">{gamificationError}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ofertas Disponibles Modernizadas */}
      {activeOffers.length > 0 && (
        <div className="animate-slide-up" style={{ animationDelay: '500ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-secondary-900">
                Ofertas Disponibles
              </h2>
              <p className="text-secondary-600 text-sm">
                {activeOffers.length} oferta{activeOffers.length !== 1 ? 's' : ''} esperando tu decisión
              </p>
            </div>
            <Link to="/personas/ofertas">
              <Button variant="outline" size="sm" className="hover:scale-105 transition-all" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Ver todas
              </Button>
            </Link>
          </div>

          <div className="grid gap-4">
            {activeOffers.slice(0, 3).map((offer, index) => (
              <Card
                key={offer.id}
                className="group hover:scale-[1.01] transition-all duration-300 cursor-pointer animate-fade-in"
                style={{ animationDelay: `${600 + index * 100}ms` }}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-success-100 to-success-200 rounded-lg group-hover:shadow-soft transition-all duration-300">
                        <DollarSign className="w-5 h-5 text-success-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-secondary-900 text-lg">{offer.title}</h3>
                        <Badge variant="success" size="sm" className="mt-1">Nueva</Badge>
                      </div>
                    </div>
                  </div>

                  <p className="text-secondary-600 text-sm mb-4">
                    {offer.description || 'Oferta especial disponible'}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-success-50 rounded-lg">
                      <div className="text-lg font-bold text-success-600">
                        {offer.parameters?.discount_percentage || 0}%
                      </div>
                      <div className="text-xs text-success-700">Descuento</div>
                    </div>
                    <div className="text-center p-3 bg-secondary-50 rounded-lg">
                      <div className="text-sm font-semibold text-secondary-900">
                        {formatDate(offer.validity_end)}
                      </div>
                      <div className="text-xs text-secondary-600">Válida hasta</div>
                    </div>
                  </div>

                  <Link to={`/personas/ofertas/${offer.id}`}>
                    <Button variant="gradient" size="md" fullWidth className="shadow-soft hover:shadow-glow hover:scale-105 transition-all">
                      Ver Detalles
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Deudas Recientes Modernizadas */}
      <div className="animate-slide-up" style={{ animationDelay: '700ms' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-secondary-900">
              Mis Deudas
            </h2>
            <p className="text-secondary-600 text-sm">
              {activeDebts.length} deuda{activeDebts.length !== 1 ? 's' : ''} activa{activeDebts.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link to="/personas/deudas">
            <Button variant="outline" size="sm" className="hover:scale-105 transition-all" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Ver todas
            </Button>
          </Link>
        </div>

        {activeDebts.length === 0 ? (
          <Card className="text-center py-8">
            <div className="p-4 bg-gradient-to-br from-success-100 to-success-200 rounded-3xl inline-block mb-4">
              <CheckCircle className="w-12 h-12 text-success-600" />
            </div>
            <h3 className="text-lg font-display font-bold text-secondary-900 mb-2">
              ¡No tienes deudas activas!
            </h3>
            <p className="text-secondary-600 text-sm">
              Felicitaciones, tu historial está limpio
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {activeDebts.slice(0, 5).map((debt, index) => (
              <Card
                key={debt.id}
                className="group hover:scale-[1.01] transition-all duration-300 cursor-pointer animate-fade-in"
                style={{ animationDelay: `${800 + index * 100}ms` }}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-lg group-hover:shadow-soft transition-all duration-300">
                        <CreditCard className="w-4 h-4 text-secondary-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-secondary-900 text-sm">
                          {debt.company?.business_name || 'Empresa'}
                        </h3>
                        <p className="text-xs text-secondary-600">
                          Desde {formatDate(debt.origin_date)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={debt.status === 'active' ? 'danger' : 'warning'}
                      className="font-semibold px-2 py-1 text-xs"
                    >
                      {debt.status === 'active' ? 'Activa' : 'En negociación'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-secondary-200/50">
                    <span className="text-xs font-medium text-secondary-600 uppercase tracking-wide">
                      Monto Actual
                    </span>
                    <span className="text-lg font-display font-bold text-secondary-900">
                      {formatCurrency(debt.current_amount)}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* CTA Banners */}
      {activeOffers.length === 0 && activeDebts.length > 0 && (
        <Card
          className="relative overflow-hidden animate-slide-up bg-blue-600"
          style={{ animationDelay: '900ms' }}
        >
          {/* Animated background elements */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl animate-float" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }} />
          </div>

          <div className="relative flex items-center justify-between p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-2xl">
                  <Coins className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-white mb-1">
                    💰 ¿Listo para ganar dinero extra?
                  </h3>
                  <p className="text-white/90 text-sm leading-relaxed">
                    Registra tus deudas morosas y recibe <span className="font-bold text-yellow-300">{formatCurrency((safeStats.totalDebtAmount || 0) * 0.5)}</span> en comisiones por acuerdos exitosos
                  </p>
                </div>
              </div>
            </div>
            <div className="ml-4 flex flex-col sm:flex-row gap-2">
              <Link to="/personas/ofertas">
                <Button
                  variant="glass"
                  size="md"
                  className="shadow-glow hover:scale-105 transition-all"
                  leftIcon={<DollarSign className="w-4 h-4" />}
                >
                  Pagar y Ganar
                </Button>
              </Link>
              <Button
                variant="outline"
                size="md"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:scale-105 transition-all"
                leftIcon={<Calculator className="w-4 h-4" />}
                onClick={() => navigate('/personas/simulador')}
              >
                Calcular Ganancias
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Ecosystem Integration Section - Temporalmente desactivado */}
      {false && showEcosystemView && (
        <div className="space-y-6 animate-slide-up">
          {/* Ecosystem Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-100 to-blue-100 rounded-xl">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-secondary-900">
                  🌐 Vista del Ecosistema
                </h2>
                <p className="text-secondary-600 text-sm">
                  Sincronización en tiempo real entre portales empresas-personas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={ecosystemViewMode}
                onChange={(e) => setEcosystemViewMode(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="unified">Dashboard Unificado</option>
                <option value="negotiations">Negociaciones Compartidas</option>
                <option value="financial">Progreso Financiero</option>
              </select>
              <button
                onClick={() => setShowEcosystemView(false)}
                className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          {/* Ecosystem Content */}
          {ecosystemViewMode === 'unified' && (
            <UnifiedDashboard
              userType="debtor"
              timeRange="30d"
              showNotifications={true}
              showRealTimeStatus={true}
              compact={false}
            />
          )}

          {ecosystemViewMode === 'negotiations' && (
            <SharedNegotiationStatus
              userType="debtor"
              compact={false}
              showFilters={true}
              autoRefresh={true}
              refreshInterval={30000}
            />
          )}

          {ecosystemViewMode === 'financial' && (
            <ConsolidatedFinancialProgress
              userType="debtor"
              timeRange="30d"
              compact={false}
              showCharts={true}
              showPredictions={true}
            />
          )}
        </div>
      )}

      {/* Ecosystem Toggle Button - Temporalmente desactivado */}
      {false && !showEcosystemView && (
        <div className="fixed bottom-6 left-6 z-40">
          <button
            onClick={() => setShowEcosystemView(true)}
            className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center group"
          >
            <BarChart3 className="w-6 h-6 group-hover:animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
            <span className="absolute bottom-full mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              🌐 Vista del Ecosistema
            </span>
          </button>
        </div>
      )}

      {/* Modal para completar perfil */}
      <CompleteProfileModal
        isOpen={showCompleteProfileModal}
        onClose={() => setShowCompleteProfileModal(false)}
        profile={profile}
        onSave={handleSaveProfile}
      />
    </div>
  );
};

export default DebtorDashboard;
