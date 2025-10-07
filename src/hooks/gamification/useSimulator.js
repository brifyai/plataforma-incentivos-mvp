/**
 * Hook personalizado para el simulador de pagos
 */

import { useState, useCallback } from 'react';
import simulatorService from '../../services/gamification/simulatorService';

export const useSimulator = () => {
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calcular plan de pagos
  const calculatePlan = useCallback(async (params) => {
    try {
      setLoading(true);
      setError(null);

      const result = simulatorService.calculatePaymentPlan(params);
      
      if (result.error) {
        setError(result.error);
        return null;
      }

      setSimulation(result);
      return result;
    } catch (err) {
      console.error('Error al calcular plan:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Comparar estrategias
  const compareStrategies = useCallback(async (baseParams, strategies) => {
    try {
      setLoading(true);
      setError(null);

      const result = simulatorService.comparePaymentStrategies(baseParams, strategies);
      return result;
    } catch (err) {
      console.error('Error al comparar estrategias:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Calcular impacto de pago extra
  const calculateExtraPaymentImpact = useCallback(async (params) => {
    try {
      setLoading(true);
      setError(null);

      const result = simulatorService.calculateExtraPaymentImpact(params);
      
      if (result.error) {
        setError(result.error);
        return null;
      }

      return result;
    } catch (err) {
      console.error('Error al calcular impacto:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Guardar simulación
  const saveSimulation = useCallback(async (userId, simulationData) => {
    try {
      setLoading(true);
      setError(null);

      const saved = await simulatorService.saveSimulation(userId, simulationData);
      return saved;
    } catch (err) {
      console.error('Error al guardar simulación:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Limpiar simulación
  const clearSimulation = useCallback(() => {
    setSimulation(null);
    setError(null);
  }, []);

  return {
    simulation,
    loading,
    error,
    calculatePlan,
    compareStrategies,
    calculateExtraPaymentImpact,
    saveSimulation,
    clearSimulation
  };
};

export default useSimulator;
