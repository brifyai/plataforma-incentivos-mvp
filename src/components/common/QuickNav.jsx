/**
 * Quick Navigation Component
 *
 * Barra de navegación rápida para modo administrador
 * Permite cambiar entre dashboards sin salir de la sesión
 */

import { useAuth } from '../../context/AuthContext';
import { Button } from './index';
import { Crown, Zap } from 'lucide-react';

const QuickNav = () => {
  const { user } = useAuth();

  // Solo mostrar si es modo administrador
  if (!user || user.user_metadata?.role !== 'god_mode') {
    return null;
  }

  const dashboardModes = [
    { title: '👥 Persona', path: '/debtor/dashboard' },
    { title: '🏢 Empresa', path: '/company/dashboard' },
    { title: '💰 Pagos', path: '/admin/payments' },
    { title: '👑 Admin', path: '/admin/dashboard' }
  ];

  const getCurrentMode = () => {
    if (location.pathname.startsWith('/debtor')) return 'debtor';
    if (location.pathname.startsWith('/company/transfers')) return 'payments';
    if (location.pathname.startsWith('/company')) return 'company';
    if (location.pathname.startsWith('/admin')) return 'admin';
    return null;
  };

  const currentMode = getCurrentMode();

  const handleModeSwitch = (mode) => {
    setSelectedMode(mode);
    setShowSwitchModal(true);
  };

  const confirmModeSwitch = () => {
    if (selectedMode) {
      // Guardar el modo en localStorage para recordar la selección
      localStorage.setItem('admin_override_role', selectedMode.id);

      // Forzar re-render
      setForceUpdate(prev => prev + 1);

      // Usar window.location para navegación forzada
      window.location.href = selectedMode.path;
    }
    setShowSwitchModal(false);
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-white/95 backdrop-blur-sm rounded-2xl shadow-strong border border-purple-200/50 p-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 rounded-xl">
          <Crown className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-semibold text-purple-900">GOD MODE</span>
          <Zap className="w-4 h-4 text-yellow-500" />
        </div>

        <div className="flex gap-1">
          {dashboardModes.map((mode) => (
            <Button
              key={mode.path}
              variant="outline"
              size="sm"
              onClick={() => window.location.href = mode.path}
              className="px-3 py-1 text-xs font-medium hover:bg-purple-50 border-purple-200"
            >
              {mode.title}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickNav;