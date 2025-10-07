/**
 * Mobile Navigation Component for Company Pages
 * Bottom navigation bar for mobile devices
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  FileText,
  Users,
  MessageSquare,
  Settings,
  Home,
} from 'lucide-react';

const MobileNavigation = () => {
  const location = useLocation();

  const navItems = [
    {
      to: '/empresa',
      icon: Home,
      label: 'Inicio',
      active: location.pathname === '/empresa'
    },
    {
      to: '/empresa/ofertas',
      icon: FileText,
      label: 'Ofertas',
      active: location.pathname.startsWith('/empresa/ofertas')
    },
    {
      to: '/empresa/propuestas',
      icon: Users,
      label: 'Propuestas',
      active: location.pathname.startsWith('/empresa/propuestas')
    },
    {
      to: '/empresa/mensajes',
      icon: MessageSquare,
      label: 'Mensajes',
      active: location.pathname.startsWith('/empresa/mensajes')
    },
    {
      to: '/empresa/analytics',
      icon: BarChart3,
      label: 'Analytics',
      active: location.pathname.startsWith('/empresa/analytics')
    }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-0 flex-1 ${
              item.active
                ? 'text-primary-600 bg-primary-50'
                : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
            }`}
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium truncate">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MobileNavigation;