/**
 * Theme Context
 *
 * Maneja el estado del tema (claro/oscuro) de la aplicación
 */

import { createContext, useContext, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const ThemeContext = createContext({});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Usar localStorage para persistir la preferencia del usuario
  const [theme, setTheme] = useLocalStorage('theme', 'auto');
  const [isAutoTheme, setIsAutoTheme] = useLocalStorage('isAutoTheme', true);

  // Aplicar el tema al documento
  useEffect(() => {
    const root = document.documentElement;
    const actualTheme = isAutoTheme ? getSystemTheme() : theme;

    if (actualTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, isAutoTheme]);

  // Detectar preferencia del sistema y escuchar cambios
  const getSystemTheme = () => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // Escuchar cambios en la preferencia del sistema
  useEffect(() => {
    if (typeof window !== 'undefined' && isAutoTheme) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = () => {
        const root = document.documentElement;
        if (mediaQuery.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [isAutoTheme]);

  // Cambiar entre temas
  const toggleTheme = () => {
    if (isAutoTheme) {
      // Si está en modo automático, cambiar a manual y alternar
      setIsAutoTheme(false);
      setTheme(getSystemTheme() === 'dark' ? 'light' : 'dark');
    } else {
      // Si está en modo manual, alternar
      setTheme(theme === 'light' ? 'dark' : 'light');
    }
  };

  // Usar tema del sistema
  const useSystemTheme = () => {
    setIsAutoTheme(true);
    setTheme('auto');
  };

  // Establecer tema manualmente
  const setManualTheme = (newTheme) => {
    setIsAutoTheme(false);
    setTheme(newTheme);
  };

  // Verificar si está usando el tema del sistema
  const isSystemTheme = isAutoTheme;
  
  // Obtener el tema actual real
  const getCurrentTheme = () => {
    return isAutoTheme ? getSystemTheme() : theme;
  };

  const currentTheme = getCurrentTheme();

  const value = {
    theme: currentTheme,
    setTheme,
    toggleTheme,
    useSystemTheme,
    setManualTheme,
    isSystemTheme,
    isAutoTheme,
    isDark: currentTheme === 'dark',
    isLight: currentTheme === 'light',
    systemTheme: getSystemTheme(),
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;