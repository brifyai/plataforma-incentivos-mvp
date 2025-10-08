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
    { name: 'Gamificación', path: '/personas/gamificacion', icon: Sparkles, description: 'Logros y recompensas' },
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
    { name: 'Analytics', path: '/empresa/analytics', icon: BarChart3, description: 'Análisis y métricas' },
    { name: 'Mensajes', path: '/empresa/mensajes', icon: MessageSquare, description: 'Comunicación' },
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
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-neutral-50 to-primary-50/30" role="application" aria-label="Dashboard de la plataforma de incentivos">
      {/* Subtle animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-100/3 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-accent-100/2 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-40 right-1/4 w-64 h-64 bg-success-100/3 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Header */}
      <header
        className={`
          sticky top-0 z-50 transition-all duration-300
          ${isScrolled
            ? 'bg-white/80 backdrop-blur-xl border-b border-secondary-200/50 shadow-glass'
            : 'bg-white/60 backdrop-blur-sm border-b border-secondary-100/50'
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
                className="lg:hidden p-3 rounded-xl hover:bg-secondary-100/80 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 bg-white/90 shadow-soft"
                aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={sidebarOpen}
              >
                {sidebarOpen ? <X className="w-6 h-6 text-secondary-700" /> : <Menu className="w-6 h-6 text-secondary-700" />}
              </button>

              <Link
                to={displayMode === 'debtor' ? '/personas/dashboard' : displayMode === 'company' ? '/empresa/dashboard' : '/admin/dashboard'}
                className="flex items-center gap-4 group"
              >
                <div className="relative p-3 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-soft group-hover:shadow-glow transition-all duration-300 group-hover:scale-110">
                  <Wallet className="w-7 h-7 text-white" aria-hidden="true" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl" aria-hidden="true" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="font-display font-bold text-xl text-secondary-900 tracking-tight">
                    NexuPay
                  </h1>
                  <p className="text-xs text-secondary-600 font-medium">
                    Gestión Inteligente
                  </p>
                </div>
              </Link>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {/* Welcome message */}
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-secondary-900">
                  ¡Hola, {profile?.full_name?.split(' ')[0] || 'Usuario'}!
                </p>
                <p className="text-xs text-secondary-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {isPreviewMode
                    ? `PREVISUALIZANDO: ${displayMode === 'debtor' ? 'Dashboard Deudor' : 'Dashboard Empresa'}`
                    : displayMode === 'admin' ? 'MODO ADMINISTRADOR' : displayMode === 'debtor' ? 'Personas' : displayMode === 'company' ? 'Empresas' : 'Usuario'
                  }
                </p>
              </div>

              {/* Notificaciones */}
              <Link
                to={displayMode === 'debtor' ? '/personas/notificaciones' : displayMode === 'company' ? '/empresa/notificaciones' : '/admin/notificaciones'}
                className="relative p-3 rounded-xl hover:bg-secondary-100/80 transition-all duration-200 hover:scale-105 group"
              >
                <Bell className="w-6 h-6 text-secondary-600 group-hover:text-primary-600 transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-gradient-to-r from-danger-500 to-danger-600 rounded-full shadow-soft animate-bounce-subtle">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Cerrar Sesión */}
              <button
                onClick={handleLogout}
                className="p-3 rounded-xl hover:bg-danger-50/80 transition-all duration-200 hover:scale-105 group"
                title="Cerrar Sesión"
              >
                <LogOut className="w-6 h-6 text-danger-600 group-hover:text-danger-700 transition-colors" />
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
          {/* Sidebar background without shadow */}
          <div className="h-full bg-white/80 backdrop-blur-xl border-r border-secondary-200/50">
            {/* Sidebar content */}
            <nav className="p-6 space-y-2">
              <div className="mb-8">
                <h2 className="text-lg font-display font-bold text-secondary-900 mb-2">
                  {isPreviewMode
                    ? `👁️ Vista Previa: ${displayMode === 'debtor' ? 'Dashboard Deudor' : 'Dashboard Empresa'}`
                    : displayMode === 'admin' ? 'GOD MODE' : displayMode === 'debtor' ? 'Personas' : ''
                  }
                </h2>
              </div>

              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => isMobile && setSidebarOpen(false)}
                    className={`
                      group flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300
                      hover:scale-[1.02] hover:shadow-medium
                      ${active
                        ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-glow'
                        : 'text-secondary-700 hover:bg-white/60 hover:text-primary-700'
                      }
                    `}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className={`
                      p-2 rounded-xl transition-all duration-300
                      ${active
                        ? 'bg-white/20 shadow-soft'
                        : 'bg-secondary-100/80 group-hover:bg-primary-100 group-hover:shadow-soft'
                      }
                    `}>
                      <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-secondary-600'}`} />
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-sm">{item.name}</span>
                      <p className={`text-xs mt-0.5 ${active ? 'text-white/80' : 'text-secondary-500'}`}>
                        {item.description}
                      </p>
                    </div>
                    {active && (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse-slow" />
                    )}
                  </Link>
                );
              })}

              {/* Logout */}
              <div className="pt-6 mt-6 border-t border-secondary-200/50">
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
                to="/terms-of-service"
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
