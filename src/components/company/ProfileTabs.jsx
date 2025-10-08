/**
 * Profile Tabs Navigation
 *
 * Componente de navegación por pestañas para la página de perfil corporativo
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Building,
  Settings,
  Link2,
  Shield,
  Users
} from 'lucide-react';

const ProfileTabs = () => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const tabs = [
    {
      id: 'info',
      path: '/empresa/perfil',
      label: 'Información Corporativa',
      icon: Building,
      shortLabel: 'Info'
    },
    {
      id: 'operations',
      path: '/empresa/perfil/operaciones',
      label: 'Operaciones Diarias',
      icon: Settings,
      shortLabel: 'Ops'
    },
    {
      id: 'integrations',
      path: '/empresa/perfil/integraciones',
      label: 'Integraciones Externas',
      icon: Link2,
      shortLabel: 'CRM'
    },
    {
      id: 'compliance',
      path: '/empresa/perfil/verificacion',
      label: 'Verificación y Cumplimiento',
      icon: Shield,
      shortLabel: 'Legal'
    },
    {
      id: 'clients',
      path: '/empresa/perfil/clientes',
      label: 'Clientes Corporativos',
      icon: Users,
      shortLabel: 'Clientes'
    }
  ];

  // Determine active tab based on current path
  const getActiveTab = () => {
    const currentPath = location.pathname;
    const activeTab = tabs.find(tab => tab.path === currentPath);
    return activeTab ? activeTab.id : 'info';
  };

  const activeTab = getActiveTab();

  return (
    <div className="relative bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
      {/* Tabs Container */}
      <div className="flex justify-center px-2 md:px-4">
        <div className="flex flex-wrap justify-center gap-1 md:gap-2 py-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={`
                  flex items-center gap-1.5 md:gap-2 px-2 md:px-4 py-2 md:py-2.5 rounded-lg font-medium transition-all duration-200 whitespace-nowrap text-xs md:text-sm
                  ${isActive
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md transform scale-[1.02]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
              >
                <Icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                <span>
                  {isMobile ? tab.shortLabel : tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Active Tab Indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600" />
    </div>
  );
};

export default ProfileTabs;