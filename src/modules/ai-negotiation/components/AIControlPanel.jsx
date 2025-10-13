/**
 * AI Control Panel
 * 
 * Panel de control para activar/desactivar el módulo de IA de forma segura
 * Permite monitorear el estado y realizar acciones de emergencia
 */

import React, { useState, useEffect } from 'react';
import { aiFeatureFlags } from '../utils/featureFlags';
import { aiServices } from '../services';
import { AILoader } from './AILoader';

export const AIControlPanel = ({ compact = false }) => {
  const [status, setStatus] = useState('unknown');
  const [isLoading, setIsLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);
  const [error, setError] = useState(null);

  // Verificar estado del módulo
  const checkModuleStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const isOperational = aiFeatureFlags.isAIModuleOperational();
      const areServicesAvailable = aiServices.areAvailable();

      if (isOperational && areServicesAvailable) {
        setStatus('operational');
      } else if (aiFeatureFlags.isEnabled(aiFeatureFlags.AI_SAFE_MODE)) {
        setStatus('safe-mode');
      } else {
        setStatus('disabled');
      }

      setLastCheck(new Date());
    } catch (error) {
      console.error('Error checking AI module status:', error);
      setStatus('error');
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Activar módulo de IA
  const enableAIModule = async () => {
    try {
      setIsLoading(true);
      
      // Activar flags gradualmente
      aiFeatureFlags.enable(aiFeatureFlags.AI_CONFIG_ENABLED);
      aiFeatureFlags.enable(aiFeatureFlags.AI_FALLBACK_ENABLED);
      aiFeatureFlags.enable(aiFeatureFlags.AI_ERROR_RECOVERY_ENABLED);
      
      // Esperar un momento
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Activar módulo principal
      aiFeatureFlags.enable(aiFeatureFlags.AI_MODULE_ENABLED);
      
      // Precargar servicios
      await aiServices.preload();
      
      await checkModuleStatus();
    } catch (error) {
      console.error('Error enabling AI module:', error);
      setError(error.message);
      // Activar modo seguro automáticamente
      aiFeatureFlags.enableSafeMode();
    } finally {
      setIsLoading(false);
    }
  };

  // Desactivar módulo de IA
  const disableAIModule = () => {
    try {
      aiFeatureFlags.disableAll();
      aiFeatureFlags.enable(aiFeatureFlags.AI_CONFIG_ENABLED); // Mantener config disponible
      checkModuleStatus();
    } catch (error) {
      console.error('Error disabling AI module:', error);
      setError(error.message);
    }
  };

  // Activar modo seguro
  const enableSafeMode = () => {
    try {
      aiFeatureFlags.enableSafeMode();
      checkModuleStatus();
    } catch (error) {
      console.error('Error enabling safe mode:', error);
      setError(error.message);
    }
  };

  // Reset completo
  const resetAIModule = async () => {
    try {
      setIsLoading(true);
      await aiServices.reset();
      await checkModuleStatus();
    } catch (error) {
      console.error('Error resetting AI module:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkModuleStatus();
    
    // Verificar estado cada 30 segundos
    const interval = setInterval(checkModuleStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Versión compacta para espacios pequeños
  if (compact) {
    return (
      <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
        <span className="text-xs font-medium">{getStatusText()}</span>
        <button
          onClick={checkModuleStatus}
          disabled={isLoading}
          className="p-1 hover:bg-gray-200 rounded"
          title="Actualizar estado"
        >
          {isLoading ? '...' : '↻'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Control de IA</h3>
        <button
          onClick={checkModuleStatus}
          disabled={isLoading}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Actualizar estado"
        >
          {isLoading ? <AILoader size="small" /> : '↻'}
        </button>
      </div>

      {/* Estado actual */}
      <div className="flex items-center space-x-3">
        <div className={`w-4 h-4 rounded-full ${getStatusColor()}`}></div>
        <div>
          <p className="font-medium text-gray-900">{getStatusText()}</p>
          <p className="text-xs text-gray-500">
            {lastCheck ? `Última verificación: ${lastCheck.toLocaleTimeString()}` : 'Sin verificar'}
          </p>
        </div>
      </div>

      {/* Error si existe */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">Error: {error}</p>
        </div>
      )}

      {/* Acciones */}
      <div className="space-y-2">
        {status === 'disabled' && (
          <button
            onClick={enableAIModule}
            disabled={isLoading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Activando...' : 'Activar Módulo IA'}
          </button>
        )}

        {status === 'operational' && (
          <>
            <button
              onClick={disableAIModule}
              className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Desactivar IA
            </button>
            <button
              onClick={enableSafeMode}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Modo Seguro
            </button>
          </>
        )}

        {status === 'safe-mode' && (
          <>
            <button
              onClick={enableAIModule}
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Reactivando...' : 'Reactivar IA'}
            </button>
            <button
              onClick={disableAIModule}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
            >
              Desactivar Completamente
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <button
              onClick={resetAIModule}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Reiniciando...' : 'Reiniciar Módulo'}
            </button>
            <button
              onClick={enableSafeMode}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Modo Seguro
            </button>
          </>
        )}

        <button
          onClick={resetAIModule}
          disabled={isLoading}
          className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Reiniciando...' : 'Reiniciar Sistema'}
        </button>
      </div>

      {/* Información detallada */}
      <div className="text-xs text-gray-600 space-y-1">
        <p>• <strong>Operacional:</strong> IA funcionando normalmente</p>
        <p>• <strong>Modo Seguro:</strong> IA desactivada, sistema protegido</p>
        <p>• <strong>Desactivado:</strong> IA completamente apagada</p>
        <p>• <strong>Error:</strong> Problemas detectados, revisar logs</p>
      </div>
    </div>
  );

  function getStatusColor() {
    switch (status) {
      case 'operational': return 'bg-green-500';
      case 'safe-mode': return 'bg-yellow-500';
      case 'disabled': return 'bg-gray-400';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  }

  function getStatusText() {
    switch (status) {
      case 'operational': return 'IA Operacional';
      case 'safe-mode': return 'Modo Seguro';
      case 'disabled': return 'IA Desactivada';
      case 'error': return 'Error en IA';
      default: return 'Estado Desconocido';
    }
  }
};

export default AIControlPanel;