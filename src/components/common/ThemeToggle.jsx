/**
 * Theme Toggle Component
 *
 * Botón para alternar entre modo claro y oscuro
 */

import { useTheme } from '../../context/ThemeContext';
import { Button } from './index';
import { Moon, Sun, Monitor } from 'lucide-react';

const ThemeToggle = ({ variant = 'secondary', size = 'sm' }) => {
  const { theme, toggleTheme, useSystemTheme, isSystemTheme } = useTheme();

  const getIcon = () => {
    if (isSystemTheme) {
      return <Monitor className="w-4 h-4" />;
    }
    return theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />;
  };

  const getLabel = () => {
    if (isSystemTheme) {
      return 'Sistema';
    }
    return theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro';
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      title={getLabel()}
      className="flex items-center gap-2"
    >
      {getIcon()}
      <span className="hidden sm:inline">{getLabel()}</span>
    </Button>
  );
};

export default ThemeToggle;