/**
 * Dashboard Layout
 *
 * Modern dashboard layout with glassmorphism effects and enhanced navigation
 */

import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Button, Badge } from '../common';
import QuickNav from '../common/QuickNav';
import {
  Menu,
  X,
  Home,
  FileText,
  CreditCard,
  DollarSign,
  Wallet,
  Bell,
  MessageSquare,
  User,
  LogOut,
  Building,
  Users,
  BarChart3,
  Settings,
  Sparkles,
  TrendingUp,
  HelpCircle,
  Database,
  Brain,
  Bot,
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { profile, logout, user, loading, initializing } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle sidebar state based on device type
  useEffect(() => {
    if (isMobile) {
      // On mobile, always start closed
      setSidebarOpen(false);
    } else {
      // On desktop, always start open
      setSidebarOpen(true);
    }
  }, [isMobile]);

  // Handle body scroll lock when mobile sidebar is open
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, sidebarOpen]);


  // Menú para admin
  const adminMenu = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: Home, description: 'Vista general del sistema' },
    { name: 'Usuarios', path: '/admin/usuarios', icon: Users, description: 'Gestionar todos los usuarios' },
    { name: 'Deudores', path: '/admin/deudores', icon: Users, description: 'Gestionar usuarios deudores' },
    { name: 'Empresas', path: '/admin/empresas', icon: Building, description: 'Gestionar empresas' },
    { name: 'Pagos', path: '/admin/pagos', icon: CreditCard, description: 'Sistema de pagos' },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3, description: 'Métricas y análisis' },
    { name: 'Base de Datos', path: '/admin/base-datos', icon: Database, description: 'Gestionar datos' },
    { name: 'Configuración', path: '/admin/configuracion', icon: Settings, description: 'Configuración del sistema' },
  ];

  // Menú para personas
  const debtorMenu = [
    { name: 'Dashboard', path: '/personas/dashboard', icon: Home, description: 'Vista general' },
    { name: 'Perfil', path: '/personas/perfil', icon: User, description: 'Editar perfil' },
    { name: 'Mis Deudas', path: '/personas/deudas', icon: FileText, description: 'Gestionar deudas' },
    { name: 'Ofertas', path: '/personas/ofertas', icon: CreditCard, description: 'Ofertas disponibles' },
    { name: 'Acuerdos', path: '/personas/acuerdos', icon: DollarSign, description: 'Acuerdos activos' },
    { name: 'Pagos', path: '/personas/pagos', icon: DollarSign, description: 'Historial de pagos' },
    { name: 'Mi Billetera', path: '/personas/billetera', icon: Wallet, description: 'Saldo e incentivos' },
    { name: 'Mensajes', path: '/personas/mensajes', icon: MessageSquare, description: 'Comunicación' },
    { name: 'Notificaciones', path: '/personas/notificaciones', icon: Bell, description: 'Centro de notificaciones' },
    { name: 'Simulador', path: '/personas/simulador', icon: TrendingUp, description: 'Simular pagos' },
    { name: 'Ayuda', path: '/personas/ayuda', icon: HelpCircle, description: 'Centro de ayuda' },
  ];

  // Menú para empresa
  const companyMenu = [
    { name: 'Dashboard', path: '/empresa/dashboard', icon: Home, description: 'Vista general' },
    { name: 'Perfil', path: '/empresa/perfil', icon: User, description: 'Editar perfil y verificación' },
    { name: 'Clientes', path: '/empresa/clientes', icon: Users, description: 'Gestión de deudores' },
    { name: 'Propuestas', path: '/empresa/propuestas', icon: Users, description: 'Propuestas de pago' },
    { name: 'Transferencias', path: '/empresa/transferencias', icon: FileText, description: 'Transferencias bancarias' },
    { name: 'Crear Oferta', path: '/empresa/ofertas', icon: CreditCard, description: 'Crear ofertas de pago' },
    { name: 'Acuerdos', path: '/empresa/acuerdos', icon: DollarSign, description: 'Gestión de acuerdos' },
    { name: 'Mensajes con IA', path: '/empresa/mensajes', icon: Brain, description: 'Conversaciones con IA automatizada' },
    { name: 'Configuración IA', path: '/empresa/configuracion-ia', icon: Settings, description: 'Configurar IA y mensajería' },
    { name: 'Base de Conocimiento', path: '/empresa/base-conocimiento', icon: Database, description: 'Gestionar conocimiento por cliente' },
    { name: 'Configuración Prompts', path: '/empresa/configuracion-prompts', icon: Bot, description: 'Personalizar prompts de IA' },
    { name: 'Analytics', path: '/empresa/analytics', icon: BarChart3, description: 'Análisis y métricas' },
    { name: 'Notificaciones', path: '/empresa/notificaciones', icon: Bell, description: 'Centro de notificaciones' },
  ];

  // Determine menu and display mode based on role (memoized) - MUST be before loading check
  const menuItems = useMemo(() => {
    const role = profile?.role || user?.user_metadata?.role;

    // If admin in preview mode, show appropriate menu
    const urlParams = new URLSearchParams(window.location.search);
    const previewMode = urlParams.get('preview');
    if (previewMode === 'admin') {
      if (location.pathname.startsWith('/personas')) return debtorMenu;
      if (location.pathname.startsWith('/empresa')) return companyMenu;
    }

    // Normal admin mode
    if (role === 'god_mode') return adminMenu;
    if (role === 'debtor') return debtorMenu;
    if (role === 'company') return companyMenu;
    return [];
  }, [profile?.role, user?.user_metadata?.role, location.pathname]);

  const displayMode = useMemo(() => {
    // Check if admin is in preview mode
    const urlParams = new URLSearchParams(window.location.search);
    const previewMode = urlParams.get('preview');

    if (previewMode === 'admin') {
      // Admin is previewing user dashboards
      if (location.pathname.startsWith('/personas')) return 'debtor';
      if (location.pathname.startsWith('/empresa')) return 'company';
    }

    const role = profile?.role || user?.user_metadata?.role;
    if (role === 'debtor') return 'debtor';
    if (role === 'company') return 'company';
    return 'admin';
  }, [profile?.role, user?.user_metadata?.role, location.pathname]);

  const isPreviewMode = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('preview') === 'admin';
  }, []);

  // Show loading only during initialization (not during OAuth flows)
  if (initializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Cargando tu dashboard...</h2>
          <p className="text-gray-500">Estamos configurando todo para ti</p>
        </div>
      </div>
    );
  }

  // Debug logging removed - issue resolved

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" role="application" aria-label="Dashboard de la plataforma de incentivos">
      {/* Enhanced animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/3 -left-32 w-80 h-80 bg-gradient-to-br from-purple-200/15 to-pink-200/15 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-gradient-to-br from-emerald-200/15 to-teal-200/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-br from-amber-200/10 to-orange-200/10 rounded-full blur-2xl animate-pulse" />
      </div>

      {/* Enhanced Header */}
      <header
        className={`
          sticky top-0 z-50 transition-all duration-300
          ${isScrolled
            ? 'bg-white/95 backdrop-blur-2xl border-b border-slate-200/60 shadow-xl shadow-slate-200/20'
            : 'bg-white/90 backdrop-blur-xl border-b border-slate-200/40 shadow-lg shadow-slate-200/10'
          }
        `}
        role="banner"
        aria-label="Cabecera principal"
      >
        <div className="px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo & Mobile Menu */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-3 rounded-xl hover:bg-slate-100/80 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-white/95 shadow-md border border-slate-200/50"
                aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={sidebarOpen}
              >
                {sidebarOpen ? <X className="w-6 h-6 text-slate-700" /> : <Menu className="w-6 h-6 text-slate-700" />}
              </button>

              <Link
                to={displayMode === 'debtor' ? '/personas/dashboard' : displayMode === 'company' ? '/empresa/dashboard' : '/admin/dashboard'}
                className="flex items-center gap-4 group"
              >
                <div className="relative p-3 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl shadow-lg group-hover:shadow-xl group-hover:shadow-blue-500/25 transition-all duration-300 group-hover:scale-110 border border-blue-500/20">
                  <Wallet className="w-7 h-7 text-white" aria-hidden="true" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl" aria-hidden="true" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="font-display font-bold text-xl text-slate-900 tracking-tight">
                    NexuPay
                  </h1>
                  <p className="text-xs text-slate-600 font-medium">
                    Gestión Inteligente
                  </p>
                </div>
              </Link>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {/* Enhanced Welcome message */}
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-slate-900">
                  ¡Hola, {profile?.full_name?.split(' ')[0] || 'Usuario'}!
                </p>
                <p className="text-xs text-slate-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  {isPreviewMode
                    ? `PREVISUALIZANDO: ${displayMode === 'debtor' ? 'Dashboard Deudor' : 'Dashboard Empresa'}`
                    : displayMode === 'admin' ? 'MODO ADMINISTRADOR' : displayMode === 'debtor' ? 'Personas' : displayMode === 'company' ? 'Empresas' : 'Usuario'
                  }
                </p>
              </div>

              {/* Enhanced Notificaciones */}
              <Link
                to={displayMode === 'debtor' ? '/personas/notificaciones' : displayMode === 'company' ? '/empresa/notificaciones' : '/admin/notificaciones'}
                className="relative p-3 rounded-xl hover:bg-slate-100/80 transition-all duration-200 hover:scale-105 group bg-white/50 border border-slate-200/30"
              >
                <Bell className="w-6 h-6 text-slate-600 group-hover:text-blue-600 transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-rose-600 rounded-full shadow-lg animate-bounce-subtle border-2 border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Enhanced Cerrar Sesión */}
              <button
                onClick={handleLogout}
                className="p-3 rounded-xl hover:bg-red-50/80 transition-all duration-200 hover:scale-105 group bg-white/50 border border-slate-200/30"
                title="Cerrar Sesión"
              >
                <LogOut className="w-6 h-6 text-slate-600 group-hover:text-red-600 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </header>


      {/* Preview Mode Banner */}
      {isPreviewMode && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Modo Vista Previa</h3>
                <p className="text-sm opacity-90">
                  Estás viendo cómo se ve el dashboard para {displayMode === 'debtor' ? 'deudores' : 'empresas'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/dashboard')}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              ← Volver a Admin
            </Button>
          </div>
        </div>
      )}

      <div className="relative">
        {/* Mobile Backdrop */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed top-20 left-0 h-[calc(100vh-5rem)] w-72
            transform transition-all duration-300 ease-out z-40
            ${isMobile
              ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full')
              : 'lg:translate-x-0'
            }
          `}
          role="navigation"
          aria-label="Menú de navegación principal"
        >
          {/* Enhanced sidebar background */}
          <div className="h-full bg-white/95 backdrop-blur-2xl border-r border-slate-200/60 shadow-2xl">
            {/* Sidebar content */}
            <nav className="p-6 space-y-3 overflow-y-auto h-full">

              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => isMobile && setSidebarOpen(false)}
                    className={`
                      group flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ease-out
                      hover:scale-[1.02] hover:shadow-lg hover:-translate-y-0.5
                      ${active
                        ? 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-xl shadow-blue-500/25 border border-blue-400/30'
                        : 'text-slate-700 hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 hover:text-blue-700 hover:border hover:border-blue-200/50'
                      }
                    `}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className={`
                      p-3 rounded-xl transition-all duration-300 flex-shrink-0
                      ${active
                        ? 'bg-white/20 shadow-lg shadow-white/10'
                        : 'bg-slate-100/80 group-hover:bg-blue-100 group-hover:shadow-md group-hover:shadow-blue-200/50'
                      }
                    `}>
                      <Icon className={`w-5 h-5 transition-all duration-300 group-hover:scale-110 ${active ? 'text-white' : 'text-slate-600 group-hover:text-blue-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm truncate">{item.name}</span>
                      <p className={`text-xs mt-0.5 truncate transition-colors ${active ? 'text-white/80' : 'text-slate-500 group-hover:text-blue-600'}`}>
                        {item.description}
                      </p>
                    </div>
                    {active && (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-lg shadow-white/50" />
                    )}
                  </Link>
                );
              })}

              {/* Logout section */}
              <div className="pt-8 mt-8 border-t border-slate-200/60">
                <div className="px-5 py-3">
                  <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200/50">
                    <p className="text-xs font-semibold text-slate-700 mb-2">¿Necesitas ayuda?</p>
                    <Link
                      to="/personas/ayuda"
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      Visita nuestro centro de ayuda →
                    </Link>
                  </div>
                </div>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={`
            transition-all duration-300 ease-out p-6 lg:p-8 relative
            ${isMobile ? 'ml-0' : 'lg:ml-72'}
          `}
          role="main"
          aria-label="Contenido principal"
        >
          <div className="max-w-7xl mx-auto">
            <div className="animate-slide-up">
              {children}
            </div>
          </div>
        </main>
      </div>



      {/* Footer */}
      <footer
        className={`
          bg-white/60 backdrop-blur-sm border-t border-secondary-200/50 mt-16
          transition-all duration-300 ease-out
          ${isMobile ? 'ml-0' : 'lg:ml-72'}
        `}
        role="contentinfo"
        aria-label="Pie de página"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <p className="text-sm text-secondary-600">
                © 2025 NexuPay. Todos los derechos reservados.
              </p>
              <p className="text-xs text-secondary-500 mt-1">
                Desarrollado para facilitar la negociación de deudas en Chile
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link
                to="/terminos-servicio"
                className="text-secondary-600 hover:text-primary-600 transition-colors hover:underline"
              >
                Términos de Servicio
              </Link>
              <Link
                to="/privacy-policy"
                className="text-secondary-600 hover:text-primary-600 transition-colors hover:underline"
              >
                Política de Privacidad
              </Link>
              {displayMode === 'debtor' && (
                <a
                  href="mailto:legal@plataformaincentivos.cl"
                  className="text-secondary-600 hover:text-primary-600 transition-colors hover:underline"
                >
                  Contacto Legal
                </a>
              )}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-secondary-200/50 text-center">
            <p className="text-xs text-secondary-500">
              Esta plataforma cumple con la legislación chilena, incluyendo la Ley 19.628 sobre Protección de Datos Personales
              y la Ley 19.799 sobre Servicios Financieros.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout;
