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
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  // Aplicar el tema al documento
  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Detectar preferencia del sistema
  const getSystemTheme = () => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // Cambiar entre temas
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Usar tema del sistema
  const useSystemTheme = () => {
    setTheme(getSystemTheme());
  };

  // Verificar si está usando el tema del sistema
  const isSystemTheme = theme === getSystemTheme();

  const value = {
    theme,
    setTheme,
    toggleTheme,
    useSystemTheme,
    isSystemTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;