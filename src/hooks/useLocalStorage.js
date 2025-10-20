/**
 * useLocalStorage Hook
 *
 * Hook personalizado para persistir estado en localStorage
 * Maneja errores de JSON y SSR automáticamente
 */

import { useState, useEffect } from 'react';

export const useLocalStorage = (key, initialValue) => {
  // Estado para almacenar el valor
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      // Obtener del localStorage
      const item = window.localStorage.getItem(key);
      // Parsear JSON si existe, sino usar valor inicial
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // Si hay error (JSON inválido, etc.), usar valor inicial
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Función para actualizar el valor
  const setValue = (value) => {
    try {
      // Permitir que value sea una función (como useState)
      const valueToStore = value instanceof Function ? value(storedValue) : value;

      // Guardar estado
      setStoredValue(valueToStore);

      // Guardar en localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      // Si hay error al guardar, loggear pero no fallar
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Función para remover del localStorage
  const removeValue = () => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, removeValue];
};

export default useLocalStorage;