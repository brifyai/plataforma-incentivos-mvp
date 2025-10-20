/**
 * useRateLimit Hook
 *
 * Hook personalizado para limitar la frecuencia de llamadas a funciones
 * Útil para prevenir spam en formularios y llamadas a APIs
 */

import { useRef, useCallback } from 'react';

export const useRateLimit = (fn, limit = 5, windowMs = 60000) => {
  const calls = useRef([]);

  const rateLimitedFn = useCallback((...args) => {
    const now = Date.now();

    // Limpiar llamadas antiguas fuera de la ventana
    calls.current = calls.current.filter(time => now - time < windowMs);

    // Verificar si excede el límite
    if (calls.current.length >= limit) {
      const oldestCall = Math.min(...calls.current);
      const timeToWait = windowMs - (now - oldestCall);

      throw new Error(
        `Demasiadas solicitudes. Espera ${Math.ceil(timeToWait / 1000)} segundos.`
      );
    }

    // Registrar la llamada
    calls.current.push(now);

    // Ejecutar la función
    return fn(...args);
  }, [fn, limit, windowMs]);

  // Información sobre el estado del rate limit
  const getRateLimitInfo = useCallback(() => {
    const now = Date.now();
    const recentCalls = calls.current.filter(time => now - time < windowMs);

    return {
      callsInWindow: recentCalls.length,
      limit,
      windowMs,
      remainingCalls: Math.max(0, limit - recentCalls.length),
      resetTime: recentCalls.length > 0
        ? Math.min(...recentCalls) + windowMs
        : now,
    };
  }, [limit, windowMs]);

  return [rateLimitedFn, getRateLimitInfo];
};

export default useRateLimit;