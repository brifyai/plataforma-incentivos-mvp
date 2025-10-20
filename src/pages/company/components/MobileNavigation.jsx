/**
 * Mobile Navigation Component
 *
 * Componente de navegación móvil para el dashboard de empresa
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../../../components/common';
import {
  Menu,
  X,
  Home,
  Users,
  FileText,
  MessageSquare,
  BarChart3,
  Settings,
  Building,
  TrendingUp,
  Upload,
  Calendar
} from 'lucide-react';

const MobileNavigation = ({ profile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/empresa/dashboard',
      icon: Home,
      current: location.pathname === '/empresa/dashboard'
    },
    {
      name: 'Clientes',
      href: '/empresa/clientes',
      icon: Users,
      current: location.pathname.startsWith('/empresa/clientes')
    },
    {
      name: 'Deudas',
      href: '/empresa/deudas',
      icon: FileText,
      current: location.pathname.startsWith('/empresa/deudas')
    },
    {
      name: 'Ofertas',
      href: '/empresa/ofertas',
      icon: TrendingUp,
      current: location.pathname.startsWith('/empresa/ofertas')
    },
    {
      name: 'Acuerdos',
      href: '/empresa/acuerdos',
      icon: Calendar,
      current: location.pathname.startsWith('/empresa/acuerdos')
    },
    {
      name: 'Mensajes',
      href: '/empresa/mensajes',
      icon: MessageSquare,
      current: location.pathname.startsWith('/empresa/mensajes')
    },
    {
      name: 'Analytics',
      href: '/empresa/analytics',
      icon: BarChart3,
      current: location.pathname.startsWith('/empresa/analytics')
    },
    {
      name: 'Verificación',
      href: '/empresa/verification',
      icon: Upload,
      current: location.pathname === '/empresa/verification'
    },
    {
      name: 'Perfil',
      href: '/empresa/perfil',
      icon: Settings,
      current: location.pathname.startsWith('/empresa/perfil')
    }
  ];

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <Button
          onClick={toggleMenu}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </Button>
      </div>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMenu}
        />
      )}

      {/* Mobile menu panel */}
      <div className={`lg:hidden fixed bottom-20 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 transform transition-transform duration-300 ${
        isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
      }`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Building className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-secondary-900">
                {profile?.company?.business_name || 'Mi Empresa'}
              </h3>
              <p className="text-sm text-secondary-600">Panel de Empresa</p>
            </div>
          </div>

          {/* Navigation items */}
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={closeMenu}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    item.current
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200'
                      : 'text-secondary-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${
                    item.current ? 'text-blue-600' : 'text-secondary-500'
                  }`} />
                  <span className="font-medium">{item.name}</span>
                  {item.current && (
                    <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Quick actions */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-3">
              <Link to="/empresa/deudas/nueva" onClick={closeMenu}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  leftIcon={<FileText className="w-3 h-3" />}
                >
                  Nueva Deuda
                </Button>
              </Link>

              <Link to="/empresa/clientes/nuevo" onClick={closeMenu}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  leftIcon={<Users className="w-3 h-3" />}
                >
                  Nuevo Cliente
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileNavigation;