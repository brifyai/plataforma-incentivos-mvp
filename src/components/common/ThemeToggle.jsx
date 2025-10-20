/**
 * Theme Toggle Component
 * 
 * Proporciona control mejorado del tema con modo automático
 * Se integra sin romper el código existente
 */

import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Monitor, Check } from 'lucide-react';

const ThemeToggle = ({ className = '' }) => {
  const { theme, isAutoTheme, setManualTheme, useSystemTheme, systemTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleThemeChange = (newTheme) => {
    if (newTheme === 'auto') {
      useSystemTheme();
    } else {
      setManualTheme(newTheme);
    }
    setIsOpen(false);
  };

  const getCurrentIcon = () => {
    if (isAutoTheme) {
      return <Monitor className="w-5 h-5" />;
    }
    return theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />;
  };

  const getCurrentLabel = () => {
    if (isAutoTheme) {
      return `Automático (${systemTheme === 'dark' ? 'Oscuro' : 'Claro'})`;
    }
    return theme === 'dark' ? 'Oscuro' : 'Claro';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Botón principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg bg-secondary-100 dark:bg-secondary-700 hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-colors"
        title={`Tema: ${getCurrentLabel()}`}
      >
        {getCurrentIcon()}
        <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300 hidden sm:inline">
          {getCurrentLabel()}
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-secondary-800 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-700 z-50">
            <div className="p-1">
              {/* Tema Claro */}
              <button
                onClick={() => handleThemeChange('light')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  !isAutoTheme && theme === 'light'
                    ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Claro</span>
                {!isAutoTheme && theme === 'light' && (
                  <Check className="w-4 h-4 ml-auto" />
                )}
              </button>

              {/* Tema Oscuro */}
              <button
                onClick={() => handleThemeChange('dark')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  !isAutoTheme && theme === 'dark'
                    ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Oscuro</span>
                {!isAutoTheme && theme === 'dark' && (
                  <Check className="w-4 h-4 ml-auto" />
                )}
              </button>

              {/* Tema Automático */}
              <button
                onClick={() => handleThemeChange('auto')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isAutoTheme
                    ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>Automático</span>
                <span className="text-xs text-secondary-500 dark:text-secondary-400">
                  ({systemTheme === 'dark' ? 'Oscuro' : 'Claro'})
                </span>
                {isAutoTheme && (
                  <Check className="w-4 h-4 ml-auto" />
                )}
              </button>
            </div>

            {/* Información */}
            <div className="px-3 py-2 border-t border-secondary-200 dark:border-secondary-700">
              <p className="text-xs text-secondary-500 dark:text-secondary-400">
                El tema automático se ajusta a la preferencia de tu sistema
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeToggle;