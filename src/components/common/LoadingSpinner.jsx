/**
 * Loading Spinner Component
 * 
 * Componente de loading/cargando
 */

import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/helpers';

const LoadingSpinner = ({
  size = 'md',
  fullScreen = false,
  text = 'Cargando...',
  className = '',
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const spinner = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin text-primary-600', sizes[size])} />
      {text && <p className="text-secondary-600 text-sm">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-secondary-50 z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
