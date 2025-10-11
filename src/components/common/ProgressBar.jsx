/**
 * ProgressBar Component
 *
 * Componente para mostrar barras de progreso
 */

import { forwardRef } from 'react';
import { clsx } from 'clsx';

const ProgressBar = forwardRef(({
  progress = 0,
  max = 100,
  className = '',
  color = 'blue',
  size = 'md',
  showLabel = false,
  label,
  ...props
}, ref) => {
  const percentage = Math.min(Math.max((progress / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
    xl: 'h-4'
  };

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600',
    purple: 'bg-blue-600',
    indigo: 'bg-indigo-600'
  };

  return (
    <div className={clsx('w-full', className)} ref={ref} {...props}>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{label || 'Progreso'}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={clsx(
        'w-full bg-gray-200 rounded-full overflow-hidden',
        sizeClasses[size]
      )}>
        <div
          className={clsx(
            'h-full transition-all duration-300 ease-out rounded-full',
            colorClasses[color]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';

export default ProgressBar;