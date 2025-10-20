/**
 * useDebouncedValue Hook
 *
 * Hook personalizado para debounce de valores
 * Útil para búsqueda en tiempo real sin sobrecargar APIs
 */

import { useState, useEffect } from 'react';

export const useDebouncedValue = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Establecer timeout para actualizar el valor debounced
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpiar timeout si el valor cambia antes de que expire
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebouncedValue;