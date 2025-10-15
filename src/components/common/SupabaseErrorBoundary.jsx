/**
 * Componente para manejar errores de Supabase
 * 
 * Este componente captura errores relacionados con Supabase
 * y proporciona una experiencia de usuario graceful
 */

import React, { useState, useEffect } from 'react';
import { isSupabaseMockMode, isSupabaseConfigured } from '../../config/supabase';

const SupabaseErrorBoundary = ({ children, fallback = null }) => {
  const [hasError, setHasError] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);
  const [isMockMode, setIsMockMode] = useState(false);

  useEffect(() => {
    // Verificar el estado de Supabase
    try {
      setIsMockMode(isSupabaseMockMode());
    } catch (error) {
      console.warn('Error checking Supabase status:', error);
      setIsMockMode(true);
    }

    // Capturar errores globales relacionados con Supabase
    const handleError = (event) => {
      const error = event.error || event.reason;
      if (error && (
        error.message?.includes('Supabase') ||
        error.message?.includes('supabase') ||
        error.message?.includes('VITE_SUPABASE')
      )) {
        console.warn('Supabase-related error caught:', error);
        setHasError(true);
        setErrorInfo({
          message: error.message,
          isConfigError: error.message.includes('no configurado')
        });
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  // Si hay un error, mostrar el fallback
  if (hasError) {
    if (fallback) {
      return typeof fallback === 'function' ? fallback(errorInfo) : fallback;
    }

    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Conexión a base de datos limitada
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                {errorInfo?.isConfigError 
                  ? 'La aplicación está funcionando en modo demo. Algunas funciones pueden no estar disponibles.'
                  : 'Hay un problema temporal con la conexión a la base de datos. La aplicación continuará funcionando con funcionalidad limitada.'
                }
              </p>
            </div>
            <div className="mt-3">
              <button
                onClick={() => setHasError(false)}
                className="text-sm font-medium text-yellow-800 hover:text-yellow-700 underline"
              >
                Entendido, continuar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si estamos en modo mock, mostrar una advertencia sutil
  if (isMockMode && process.env.NODE_ENV === 'development') {
    return (
      <>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-2">
              <p className="text-xs text-blue-700">
                Modo desarrollo: Supabase no configurado. La aplicación funciona en modo demo.
              </p>
            </div>
          </div>
        </div>
        {children}
      </>
    );
  }

  return children;
};

export default SupabaseErrorBoundary;