/**
 * Onboarding Tour Component
 * 
 * Proporciona tooltips interactivos guiados para nuevos usuarios
 * Se integra sin romper el código existente
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react';

const OnboardingTour = () => {
  const { profile, user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Verificar si el usuario ya completó el onboarding
  useEffect(() => {
    if (user && profile) {
      const completedTours = JSON.parse(localStorage.getItem('completed_tours') || '{}');
      const tourKey = `onboarding_${profile.role || 'user'}_${user.id}`;
      
      if (!completedTours[tourKey]) {
        // Iniciar tour después de un pequeño retraso para que la página cargue
        const timer = setTimeout(() => {
          setIsActive(true);
        }, 2000);
        
        return () => clearTimeout(timer);
      } else {
        setIsCompleted(true);
      }
    }
  }, [user, profile]);

  // Definir pasos del tour según el rol del usuario
  const getTourSteps = useCallback(() => {
    const userRole = profile?.role || 'user';
    
    const commonSteps = [
      {
        id: 'welcome',
        title: '¡Bienvenido a NexuPay! 🎉',
        content: 'Te guiaremos por las características principales de la plataforma.',
        position: 'center',
        target: null,
      }
    ];

    if (userRole === 'company') {
      return [
        ...commonSteps,
        {
          id: 'dashboard',
          title: 'Panel de Control Empresarial',
          content: 'Aquí verás el resumen de tus deudas, pagos y métricas importantes.',
          position: 'bottom',
          target: '[data-tour="dashboard"]',
        },
        {
          id: 'bulk-import',
          title: 'Importación Masiva',
          content: 'Sube archivos Excel para importar múltiples deudores de forma rápida y segura.',
          position: 'left',
          target: '[data-tour="bulk-import"]',
        },
        {
          id: 'analytics',
          title: 'Análisis y Reportes',
          content: 'Visualiza el rendimiento de tu cartera y toma decisiones informadas.',
          position: 'right',
          target: '[data-tour="analytics"]',
        },
        {
          id: 'messages',
          title: 'Centro de Mensajes',
          content: 'Comunicaicate con tus deudores y envía recordatorios personalizados.',
          position: 'top',
          target: '[data-tour="messages"]',
        }
      ];
    } else if (userRole === 'debtor') {
      return [
        ...commonSteps,
        {
          id: 'debtor-dashboard',
          title: 'Tu Panel Personal',
          content: 'Aquí puedes ver todas tus deudas y opciones de pago.',
          position: 'bottom',
          target: '[data-tour="debtor-dashboard"]',
        },
        {
          id: 'payment-options',
          title: 'Opciones de Pago',
          content: 'Explora diferentes formas de pagar tus deudas con beneficios.',
          position: 'left',
          target: '[data-tour="payment-options"]',
        },
        {
          id: 'offers',
          title: 'Ofertas Personalizadas',
          content: 'Recibe ofertas especiales basadas en tu perfil de pago.',
          position: 'right',
          target: '[data-tour="offers"]',
        }
      ];
    } else if (userRole === 'god_mode') {
      return [
        ...commonSteps,
        {
          id: 'admin-dashboard',
          title: 'Panel de Administración',
          content: 'Control total de la plataforma y todos los usuarios.',
          position: 'bottom',
          target: '[data-tour="admin-dashboard"]',
        },
        {
          id: 'system-config',
          title: 'Configuración del Sistema',
          content: 'Ajusta parámetros globales y configura integraciones.',
          position: 'right',
          target: '[data-tour="system-config"]',
        }
      ];
    }

    return commonSteps;
  }, [profile?.role]);

  const steps = getTourSteps();
  const currentStepData = steps[currentStep];

  // Calcular posición del tooltip
  const getTooltipPosition = () => {
    if (!currentStepData || !isActive) return {};

    const { position, target } = currentStepData;
    
    if (position === 'center' || !target) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '400px',
      };
    }

    // Para elementos específicos, buscar el target
    const targetElement = document.querySelector(target);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      
      switch (position) {
        case 'bottom':
          return {
            position: 'fixed',
            top: `${rect.bottom + 10}px`,
            left: `${rect.left + rect.width / 2}px`,
            transform: 'translateX(-50%)',
            maxWidth: '350px',
          };
        case 'top':
          return {
            position: 'fixed',
            bottom: `${window.innerHeight - rect.top + 10}px`,
            left: `${rect.left + rect.width / 2}px`,
            transform: 'translateX(-50%)',
            maxWidth: '350px',
          };
        case 'left':
          return {
            position: 'fixed',
            top: `${rect.top + rect.height / 2}px`,
            right: `${window.innerWidth - rect.left + 10}px`,
            transform: 'translateY(-50%)',
            maxWidth: '350px',
          };
        case 'right':
          return {
            position: 'fixed',
            top: `${rect.top + rect.height / 2}px`,
            left: `${rect.right + 10}px`,
            transform: 'translateY(-50%)',
            maxWidth: '350px',
          };
        default:
          return {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '400px',
          };
      }
    }

    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      maxWidth: '400px',
    };
  };

  // Resaltar elemento actual
  useEffect(() => {
    if (isActive && currentStepData?.target) {
      const targetElement = document.querySelector(currentStepData.target);
      if (targetElement) {
        targetElement.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5)';
        targetElement.style.position = 'relative';
        targetElement.style.zIndex = '9999';
        
        return () => {
          targetElement.style.boxShadow = '';
          targetElement.style.zIndex = '';
        };
      }
    }
  }, [isActive, currentStep, currentStepData]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    const tourKey = `onboarding_${profile?.role || 'user'}_${user?.id}`;
    const completedTours = JSON.parse(localStorage.getItem('completed_tours') || '{}');
    completedTours[tourKey] = true;
    localStorage.setItem('completed_tours', JSON.stringify(completedTours));
    
    setIsActive(false);
    setIsCompleted(true);
  };

  const handleSkip = () => {
    handleComplete();
  };

  const restartTour = () => {
    const tourKey = `onboarding_${profile?.role || 'user'}_${user?.id}`;
    const completedTours = JSON.parse(localStorage.getItem('completed_tours') || '{}');
    delete completedTours[tourKey];
    localStorage.setItem('completed_tours', JSON.stringify(completedTours));
    
    setIsCompleted(false);
    setCurrentStep(0);
    setIsActive(true);
  };

  // No mostrar si no está activo o no hay pasos
  if (!isActive || !currentStepData) {
    return isCompleted ? (
      <button
        onClick={restartTour}
        className="fixed bottom-4 right-4 bg-primary-500 text-white p-3 rounded-full shadow-lg hover:bg-primary-600 transition-colors z-50"
        title="Reiniciar tour guiado"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    ) : null;
  }

  const tooltipStyle = getTooltipPosition();

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleSkip}
      />
      
      {/* Tooltip */}
      <div 
        className="bg-white dark:bg-secondary-800 rounded-lg shadow-2xl p-6 z-50 animate-slide-up"
        style={tooltipStyle}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
            {currentStepData.title}
          </h3>
          <button
            onClick={handleSkip}
            className="text-secondary-400 hover:text-secondary-600 dark:text-secondary-400 dark:hover:text-secondary-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <p className="text-secondary-600 dark:text-secondary-300 mb-6">
          {currentStepData.content}
        </p>

        {/* Progress */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 bg-secondary-200 dark:bg-secondary-700 rounded-full h-2 mr-4">
            <div 
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
          <span className="text-sm text-secondary-500 dark:text-secondary-400">
            {currentStep + 1} / {steps.length}
          </span>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleSkip}
            className="text-sm text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200"
          >
            Saltar tour
          </button>
          
          <div className="flex space-x-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="flex items-center px-3 py-2 text-sm bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 rounded-md hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Anterior
              </button>
            )}
            
            <button
              onClick={handleNext}
              className="flex items-center px-4 py-2 text-sm bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Completar
                </>
              ) : (
                <>
                  Siguiente
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingTour;