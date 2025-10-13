/**
 * Panel de Control del Módulo de IA
 * 
 * Componente administrativo para activar/desactivar el módulo de IA
 * y verificar su estado funcional.
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, LoadingSpinner } from '../common';

const AIModuleControl = () => {
  const [status, setStatus] = useState({
    isLoading: true,
    moduleEnabled: false,
    flags: {},
    error: null
  });
  
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    checkAIStatus();
  }, []);

  const checkAIStatus = async () => {
    try {
      setStatus(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Importar dinámicamente para evitar errores si el módulo no está disponible
      const { aiFeatureFlags, AIFeatureFlags } = await import('../../modules/ai-negotiation/utils/featureFlags.js');
      
      const flags = aiFeatureFlags.getAllFlags();
      const moduleEnabled = aiFeatureFlags.isEnabled(AIFeatureFlags.AI_MODULE_ENABLED);
      
      setStatus({
        isLoading: false,
        moduleEnabled,
        flags,
        error: null
      });
    } catch (error) {
      setStatus({
        isLoading: false,
        moduleEnabled: false,
        flags: {},
        error: error.message
      });
    }
  };

  const activateAIModule = async () => {
    setActionLoading(true);
    try {
      const { activateAIModule } = await import('../../modules/ai-negotiation/utils/activateAI.js');
      await activateAIModule();
      
      // Esperar un momento y verificar estado
      setTimeout(() => {
        checkAIStatus();
        setActionLoading(false);
      }, 2000);
    } catch (error) {
      setStatus(prev => ({ ...prev, error: error.message }));
      setActionLoading(false);
    }
  };

  const deactivateAIModule = async () => {
    setActionLoading(true);
    try {
      const { deactivateAIModule } = await import('../../modules/ai-negotiation/utils/activateAI.js');
      await deactivateAIModule();
      
      // Esperar un momento y verificar estado
      setTimeout(() => {
        checkAIStatus();
        setActionLoading(false);
      }, 2000);
    } catch (error) {
      setStatus(prev => ({ ...prev, error: error.message }));
      setActionLoading(false);
    }
  };

  const resetAIModule = async () => {
    setActionLoading(true);
    try {
      const { aiFeatureFlags } = await import('../../modules/ai-negotiation/utils/featureFlags.js');
      aiFeatureFlags.reset();
      
      setTimeout(() => {
        checkAIStatus();
        setActionLoading(false);
      }, 1000);
    } catch (error) {
      setStatus(prev => ({ ...prev, error: error.message }));
      setActionLoading(false);
    }
  };

  const runTests = async () => {
    setActionLoading(true);
    try {
      const { testAIModule } = await import('../../modules/ai-negotiation/utils/testAI.js');
      const result = await testAIModule();
      
      console.log('🧪 Resultados de pruebas:', result);
      
      // Mostrar resultado en la interfaz
      if (result.success) {
        setStatus(prev => ({
          ...prev,
          error: null,
          testResults: result
        }));
      } else {
        setStatus(prev => ({
          ...prev,
          error: `Error en pruebas: ${result.error}`
        }));
      }
      
      setActionLoading(false);
    } catch (error) {
      setStatus(prev => ({ ...prev, error: error.message }));
      setActionLoading(false);
    }
  };

  if (status.isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner size="lg" />
          <span className="ml-3">Verificando estado del módulo de IA...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            🤖 Control del Módulo de IA
          </h2>
          <Badge 
            variant={status.moduleEnabled ? "success" : "secondary"}
            className="text-sm"
          >
            {status.moduleEnabled ? "ACTIVADO" : "DESACTIVADO"}
          </Badge>
        </div>

        {status.error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">
              <strong>Error:</strong> {status.error}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Button
            onClick={activateAIModule}
            disabled={status.moduleEnabled || actionLoading}
            variant="primary"
            className="w-full"
          >
            {actionLoading ? <LoadingSpinner size="sm" /> : "🚀 Activar IA"}
          </Button>
          
          <Button
            onClick={deactivateAIModule}
            disabled={!status.moduleEnabled || actionLoading}
            variant="secondary"
            className="w-full"
          >
            {actionLoading ? <LoadingSpinner size="sm" /> : "🛑 Desactivar IA"}
          </Button>
          
          <Button
            onClick={resetAIModule}
            disabled={actionLoading}
            variant="outline"
            className="w-full"
          >
            {actionLoading ? <LoadingSpinner size="sm" /> : "🔄 Resetear"}
          </Button>
          
          <Button
            onClick={runTests}
            disabled={actionLoading}
            variant="outline"
            className="w-full"
          >
            {actionLoading ? <LoadingSpinner size="sm" /> : "🧪 Probar"}
          </Button>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-3">Estado de Banderas</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(status.flags).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-xs font-mono truncate">{key}</span>
                <Badge
                  variant={value ? "success" : "secondary"}
                  className="text-xs ml-2"
                >
                  {value ? "ON" : "OFF"}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {status.testResults && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3">🧪 Resultados de Pruebas</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm text-green-800">
                <div className="font-semibold mb-2">✅ Pruebas completadas exitosamente</div>
                <div className="space-y-1">
                  <div>📊 Banderas: {Object.keys(status.testResults.flags).length} verificadas</div>
                  <div>🔧 Servicios: {status.testResults.services?.length || 0} disponibles</div>
                  <div>📦 Componentes: {status.testResults.components?.length || 0} cargados</div>
                  <div>🔋 Estado: {status.testResults.moduleEnabled ? 'ACTIVADO' : 'DESACTIVADO'}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-lg font-semibold mb-3">📋 Instrucciones de Uso</h3>
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <strong>1. Activar Módulo:</strong> Haz clic en "Activar IA" para habilitar todas las funcionalidades de IA conversacional.
          </div>
          <div>
            <strong>2. Verificar Estado:</strong> Las banderas muestran qué componentes están activos. El modo seguro está siempre activo por defecto.
          </div>
          <div>
            <strong>3. Acceder a Funciones:</strong> Una vez activado, verás nuevas opciones en el dashboard de empresa:
            <ul className="ml-4 mt-1 list-disc">
              <li>IA de Negociación en el menú lateral</li>
              <li>Botones rápidos de IA en el dashboard</li>
              <li>Configuración de IA disponible</li>
            </ul>
          </div>
          <div>
            <strong>4. Desactivar en Caso de Error:</strong> Si experimentas problemas, usa "Desactivar IA" para volver al modo seguro.
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold mb-3">🔧 Consola del Navegador</h3>
        <div className="space-y-2 text-sm">
          <p>También puedes controlar el módulo desde la consola:</p>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-xs">
            <div>activateAIModule() // Activar módulo</div>
            <div>deactivateAIModule() // Desactivar módulo</div>
            <div>testAIModule() // Ejecutar pruebas completas</div>
            <div>testNegotiationFlow() // Probar flujo de negociación</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AIModuleControl;