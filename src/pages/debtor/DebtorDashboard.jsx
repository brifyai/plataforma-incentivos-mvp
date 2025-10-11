/**
 * Debtor Dashboard Page
 * 
 * Dashboard principal para deudores
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, LoadingSpinner, Button } from '../../components/common';
import { useDebts, useOffers, useWallet } from '../../hooks';
import { useRealtimePayments, useRealtimeDebts, useRealtimeAgreements, useRealtimeNotifications } from '../../hooks/useRealtime';
import { getDebtorDashboardStats, getUserCommissionStats } from '../../services/databaseService';
import { formatCurrency, formatDate } from '../../utils/formatters';
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
} from 'lucide-react';

const DebtorDashboard = () => {
  const { user, profile } = useAuth();
  const { debts, loading: debtsLoading, refreshDebts } = useDebts();
  const { offers, loading: offersLoading, refreshOffers } = useOffers();
  const { balance, loading: walletLoading, refreshWallet } = useWallet();
  const [stats, setStats] = useState(null);
  const [commissionStats, setCommissionStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    loadStats();
  }, [user, profile]);

  // Sincronización en tiempo real para pagos
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
    }
  );

  // Sincronización en tiempo real para deudas
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
    }
  );

  // Sincronización en tiempo real para acuerdos
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
    }
  );

  // Sincronización en tiempo real para notificaciones
  useRealtimeNotifications(
    (payload) => {
      console.log('🔔 Nueva notificación:', payload);
      // Mostrar notificación visual
      const notification = payload.new;
      showNotification(notification.title || 'Nueva notificación', 'info');
    }
  );

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

      // Cargar estadísticas del dashboard y comisiones en paralelo
      const [dashboardResult, commissionResult] = await Promise.all([
        getDebtorDashboardStats(user.id),
        getUserCommissionStats(user.id)
      ]);

      // Procesar estadísticas del dashboard
      if (!dashboardResult.error && dashboardResult.stats) {
        setStats(dashboardResult.stats);
      } else {
        console.warn('Error loading dashboard stats:', dashboardResult.error);
        setStats({
          totalDebts: 0,
          totalDebtAmount: 0,
          activeAgreements: 0,
          completedPayments: 0,
          totalPaid: 0,
          walletBalance: 0,
        });
      }

      // Procesar estadísticas de comisiones
      if (!commissionResult.error && commissionResult.commissionStats) {
        setCommissionStats(commissionResult.commissionStats);
      } else {
        console.warn('Error loading commission stats:', commissionResult.error);
        setCommissionStats({
          earnedCommissions: 0,
          nextCommission: 0,
          monthlyPotential: 0,
        });
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || debtsLoading || offersLoading || walletLoading) {
    return <LoadingSpinner fullScreen text="Cargando dashboard..." />;
  }

  const activeDebts = debts.filter(d => d.status === 'active' || d.status === 'in_negotiation');
  const activeOffers = offers.filter(o => o.status === 'active');

  return (
    <div className="space-y-8">
      {/* Realtime Status Indicator */}
      <div className="fixed top-4 right-4 z-40 bg-white/90 backdrop-blur-sm rounded-full px-3 py-2 shadow-md border border-green-200 flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-xs font-medium text-gray-700">Tiempo real</span>
        <span className="text-xs text-gray-500">
          {lastUpdate.toLocaleTimeString()}
        </span>
      </div>

      {/* Enhanced Welcome Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-2xl animate-fade-in border border-blue-500/20">
        {/* Enhanced background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-white/30 to-transparent rounded-full -translate-y-48 translate-x-48 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-white/20 to-transparent rounded-full translate-y-32 -translate-x-32 blur-2xl" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-xl">
              <Wallet className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl font-display font-bold tracking-tight">
                ¡Hola, {user?.user_metadata?.full_name?.split(' ')[0] || profile?.full_name?.split(' ')[0] || 'Usuario'}!
              </h1>
              <p className="text-blue-100 text-xl mt-2">
                Negocia tus deudas y gana el <span className="font-bold text-yellow-300">50% en comisiones</span>
              </p>
            </div>
          </div>

          {/* Enhanced Quick stats in welcome */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-6 border border-white/30 hover:bg-white/20 transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/20 rounded-xl">
                  <TrendingUp className="w-7 h-7 text-emerald-300" />
                </div>
                <div>
                  <p className="text-sm text-blue-100 font-medium">Deudas Activas</p>
                  <p className="text-3xl font-bold">{stats?.totalDebts || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-6 border border-white/30 hover:bg-white/20 transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/20 rounded-xl">
                  <DollarSign className="w-7 h-7 text-yellow-300" />
                </div>
                <div>
                  <p className="text-sm text-blue-100 font-medium">Saldo Billetera</p>
                  <p className="text-3xl font-bold">{formatCurrency(balance || 0)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-6 border border-white/30 hover:bg-white/20 transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <CheckCircle className="w-7 h-7 text-green-300" />
                </div>
                <div>
                  <p className="text-sm text-blue-100 font-medium">Acuerdos</p>
                  <p className="text-3xl font-bold">{stats?.activeAgreements || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Commission Earnings Section */}
      <Card
        variant="gradient"
        className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 text-white shadow-2xl animate-slide-up border border-amber-400/30"
        style={{ animationDelay: '200ms' }}
      >
        {/* Enhanced background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/40 to-transparent rounded-full -translate-y-32 translate-x-32 blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-white/30 to-transparent rounded-full translate-y-24 -translate-x-24 blur-2xl animate-float" />
          <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-gradient-to-br from-yellow-300/30 to-orange-300/30 rounded-full blur-xl animate-bounce-subtle" />
        </div>

        <div className="relative p-8">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="p-5 bg-white/25 backdrop-blur-md rounded-3xl shadow-2xl border border-white/40">
                <Coins className="w-12 h-12 animate-pulse" />
              </div>
              <div>
                <h2 className="text-4xl font-display font-bold mb-3">
                  💰 Gana Dinero Negociando tus Deudas
                </h2>
                <p className="text-amber-100 text-xl">
                  Recibe el <span className="font-bold text-white text-2xl">50% de comisión</span> por cada acuerdo exitoso
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Commission Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <div className="bg-white/15 backdrop-blur-md rounded-3xl p-7 border border-white/30 hover:bg-white/20 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl">
              <div className="flex items-center gap-5 mb-5">
                <div className="p-4 bg-emerald-500/25 rounded-2xl border border-emerald-400/30">
                  <PiggyBank className="w-8 h-8 text-emerald-200" />
                </div>
                <div>
                  <p className="text-sm text-amber-100 font-semibold">Comisiones Ganadas</p>
                  <p className="text-3xl font-bold">{formatCurrency(commissionStats?.earnedCommissions || 0)}</p>
                </div>
              </div>
              <p className="text-sm text-amber-200 font-medium">Este mes</p>
            </div>

            <div className="bg-white/15 backdrop-blur-md rounded-3xl p-7 border border-white/30 hover:bg-white/20 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl">
              <div className="flex items-center gap-5 mb-5">
                <div className="p-4 bg-blue-500/25 rounded-2xl border border-blue-400/30">
                  <Target className="w-8 h-8 text-blue-200" />
                </div>
                <div>
                  <p className="text-sm text-amber-100 font-semibold">Próxima Comisión</p>
                  <p className="text-3xl font-bold">{formatCurrency(commissionStats?.nextCommission || 0)}</p>
                </div>
              </div>
              <p className="text-sm text-amber-200 font-medium">Al cerrar tu próximo acuerdo</p>
            </div>

            <div className="bg-white/15 backdrop-blur-md rounded-3xl p-7 border border-white/30 hover:bg-white/20 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl">
              <div className="flex items-center gap-5 mb-5">
                <div className="p-4 bg-purple-500/25 rounded-2xl border border-purple-400/30">
                  <Calculator className="w-8 h-8 text-purple-200" />
                </div>
                <div>
                  <p className="text-sm text-amber-100 font-semibold">Potencial Mensual</p>
                  <p className="text-3xl font-bold">{formatCurrency(commissionStats?.monthlyPotential || 0)}</p>
                </div>
              </div>
              <p className="text-sm text-amber-200 font-medium">Si pagas todas tus deudas</p>
            </div>
          </div>

          {/* Enhanced Motivational Message */}
          <div className="text-center">
            <div className="bg-white/15 backdrop-blur-md rounded-3xl p-8 border border-white/30 mb-8 hover:bg-white/20 transition-all duration-300">
              <h3 className="text-2xl font-bold mb-4">🎯 ¿Sabías que...?</h3>
              <p className="text-amber-50 text-xl leading-relaxed">
                Cuando una deuda entra en mora, <span className="font-bold text-white">las empresas de cobranza contactan a la persona</span> para negociar acuerdos.
                Con nuestra plataforma, tú <span className="font-bold text-white">ganas el 50% de comisión por cada acuerdo exitoso</span>.
                ¡Registra tus deudas y genera ingresos cuando negocien!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link to="/personas/ofertas">
                <Button
                  variant="glass"
                  size="lg"
                  className="shadow-2xl hover:scale-105 transition-all border-2 border-white/40"
                  leftIcon={<DollarSign className="w-6 h-6" />}
                >
                  Realizar Pago
                </Button>
              </Link>
              <Link to="/personas/simulador">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-white/20 border-2 border-white/40 text-white hover:bg-white/30 hover:scale-105 transition-all"
                  leftIcon={<Calculator className="w-6 h-6" />}
                >
                  Calcular Ganancias
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>


      {/* Ofertas Disponibles */}
      {activeOffers.length > 0 && (
        <Card
          variant="glass"
          title="Ofertas Disponibles"
          subtitle={`${activeOffers.length} oferta${activeOffers.length !== 1 ? 's' : ''} esperando tu decisión`}
          headerAction={
            <Link to="/personas/ofertas">
              <Button variant="outline" size="sm" className="hover:scale-105 transition-all" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Ver todas
              </Button>
            </Link>
          }
          className="animate-slide-up"
          style={{ animationDelay: '500ms' }}
        >
          <div className="space-y-4">
            {activeOffers.slice(0, 3).map((offer, index) => (
              <div
                key={offer.id}
                className="bg-white/60 backdrop-blur-sm border border-white/40 rounded-2xl p-5 hover:bg-white/80 hover:shadow-medium transition-all duration-300 cursor-pointer hover:scale-[1.01] animate-fade-in"
                style={{ animationDelay: `${600 + index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-gradient-to-br from-success-100 to-success-200 rounded-xl">
                        <DollarSign className="w-5 h-5 text-success-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-secondary-900 text-lg">{offer.title}</h4>
                        <Badge variant="success" size="sm" className="mt-1">Nueva</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-secondary-600 leading-relaxed">
                      {offer.description || 'Oferta especial disponible'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-secondary-50/80 rounded-xl p-3">
                    <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide mb-1">Descuento</p>
                    <p className="text-lg font-bold text-success-600">
                      {offer.parameters?.discount_percentage || 0}%
                    </p>
                  </div>
                  <div className="bg-secondary-50/80 rounded-xl p-3">
                    <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide mb-1">Válida hasta</p>
                    <p className="text-sm font-semibold text-secondary-900">
                      {formatDate(offer.validity_end)}
                    </p>
                  </div>
                </div>

                <Link to={`/personas/ofertas/${offer.id}`}>
                  <Button variant="gradient" size="sm" fullWidth className="shadow-soft hover:shadow-glow">
                    Ver Detalles
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Deudas Recientes */}
      <Card
        variant="elevated"
        title="Mis Deudas"
        subtitle={`${activeDebts.length} deuda${activeDebts.length !== 1 ? 's' : ''} activa${activeDebts.length !== 1 ? 's' : ''}`}
        headerAction={
          <Link to="/personas/deudas">
            <Button variant="outline" size="sm" className="hover:scale-105 transition-all" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Ver todas
            </Button>
          </Link>
        }
        className="animate-slide-up"
        style={{ animationDelay: '700ms' }}
      >
        {activeDebts.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-6 bg-gradient-to-br from-success-100 to-success-200 rounded-3xl inline-block mb-6">
              <CheckCircle className="w-16 h-16 text-success-600" />
            </div>
            <h3 className="text-2xl font-display font-bold text-secondary-900 mb-2">
              ¡No tienes deudas activas!
            </h3>
            <p className="text-secondary-600 text-lg">
              Felicitaciones, tu historial está limpio
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeDebts.slice(0, 5).map((debt, index) => (
              <div
                key={debt.id}
                className="bg-gradient-to-r from-white to-secondary-50/50 border border-secondary-200/60 rounded-2xl p-5 hover:shadow-medium hover:border-primary-300/60 transition-all duration-300 cursor-pointer hover:scale-[1.01] animate-fade-in"
                style={{ animationDelay: `${800 + index * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-2xl shadow-soft">
                      <CreditCard className="w-6 h-6 text-secondary-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-secondary-900 text-lg">
                        {debt.company?.business_name || 'Empresa'}
                      </h4>
                      <p className="text-sm text-secondary-600">
                        Desde {formatDate(debt.origin_date)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={debt.status === 'active' ? 'danger' : 'warning'}
                    className="font-semibold px-3 py-1"
                  >
                    {debt.status === 'active' ? 'Activa' : 'En negociación'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-secondary-200/50">
                  <span className="text-sm font-medium text-secondary-600 uppercase tracking-wide">
                    Monto Actual
                  </span>
                  <span className="text-2xl font-display font-bold text-secondary-900">
                    {formatCurrency(debt.current_amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* CTA Banners */}
      {activeOffers.length === 0 && activeDebts.length > 0 && (
        <Card
          variant="gradient"
          className="relative overflow-hidden animate-slide-up"
          style={{ animationDelay: '900ms' }}
        >
          {/* Animated background elements */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl animate-float" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }} />
          </div>

          <div className="relative flex items-center justify-between p-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                  <Coins className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold text-white mb-1">
                    💰 ¿Listo para ganar dinero extra?
                  </h3>
                  <p className="text-white/90 text-lg leading-relaxed">
                    Registra tus deudas morosas y recibe <span className="font-bold text-yellow-300">{formatCurrency((stats?.totalDebtAmount || 0) * 0.5)}</span> en comisiones por acuerdos exitosos
                  </p>
                </div>
              </div>
            </div>
            <div className="ml-8 flex flex-col sm:flex-row gap-3">
              <Link to="/personas/ofertas">
                <Button
                  variant="glass"
                  size="lg"
                  className="shadow-glow hover:scale-105 transition-all"
                  leftIcon={<DollarSign className="w-5 h-5" />}
                >
                  Pagar y Ganar
                </Button>
              </Link>
              <Link to="/personas/simulador">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:scale-105 transition-all"
                  leftIcon={<Calculator className="w-5 h-5" />}
                >
                  Calcular Ganancias
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DebtorDashboard;
