/**
 * Gesture Navigation Component
 * 
 * Proporciona navegación por gestos (swipe) para dispositivos móviles
 * Se integra sin romper el código existente
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GestureNavigation = ({ children }) => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es dispositivo móvil
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                           window.innerWidth <= 768;
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Distancia mínima para considerar un swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      handleSwipe(isLeftSwipe ? 'left' : 'right');
    }
  };

  const handleSwipe = (direction) => {
    // Obtener la ruta actual
    const currentPath = window.location.pathname;
    
    // Definir rutas y su orden para navegación
    const routeHierarchy = {
      '/company/dashboard': 0,
      '/company/clients': 1,
      '/company/debts': 2,
      '/company/bulk-import': 3,
      '/company/analytics': 4,
      '/company/messages': 5,
      '/debtor/dashboard': 0,
      '/debtor/debts': 1,
      '/debtor/offers': 2,
      '/debtor/payments': 3,
      '/debtor/messages': 4,
      '/admin/dashboard': 0,
      '/admin/companies': 1,
      '/admin/users': 2,
      '/admin/debtors': 3,
      '/admin/config': 4,
    };

    // Encontrar la ruta actual y sus vecinos
    const currentRoute = Object.keys(routeHierarchy).find(route => 
      currentPath.startsWith(route)
    );

    if (!currentRoute) return;

    const currentOrder = routeHierarchy[currentRoute];
    const routesInOrder = Object.entries(routeHierarchy)
      .sort(([,a], [,b]) => a - b)
      .map(([route]) => route);

    // Filtrar rutas del mismo tipo (company, debtor, admin)
    const routeType = currentRoute.split('/')[1];
    const sameTypeRoutes = routesInOrder.filter(route => 
      route.split('/')[1] === routeType
    );

    const currentIndex = sameTypeRoutes.indexOf(currentRoute);

    if (direction === 'left' && currentIndex < sameTypeRoutes.length - 1) {
      // Swipe izquierda - siguiente ruta
      navigate(sameTypeRoutes[currentIndex + 1]);
      showSwipeIndicator('left');
    } else if (direction === 'right' && currentIndex > 0) {
      // Swipe derecha - ruta anterior
      navigate(sameTypeRoutes[currentIndex - 1]);
      showSwipeIndicator('right');
    }
  };

  const showSwipeIndicator = (direction) => {
    // Crear indicador visual del swipe
    const indicator = document.createElement('div');
    indicator.className = `fixed top-1/2 transform -translate-y-1/2 z-50 pointer-events-none ${
      direction === 'left' ? 'right-4' : 'left-4'
    }`;
    
    indicator.innerHTML = `
      <div class="bg-primary-500 text-white rounded-full p-3 animate-pulse">
        <svg class="w-6 h-6 ${direction === 'left' ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </div>
    `;
    
    document.body.appendChild(indicator);
    
    // Eliminar después de la animación
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    }, 1000);
  };

  // Solo aplicar gestos en dispositivos móviles
  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="touch-pan-y"
      style={{ touchAction: 'pan-y' }}
    >
      {children}
      
      {/* Indicador de gestos (solo visible en mobile) */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 md:hidden">
        <div className="bg-black bg-opacity-50 text-white text-xs px-3 py-2 rounded-full">
          Desliza para navegar
        </div>
      </div>
    </div>
  );
};

export default GestureNavigation;