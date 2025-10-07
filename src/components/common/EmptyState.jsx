/**
 * Empty State Component
 * 
 * Componente para mostrar estado vacío
 */

import { cn } from '../../utils/helpers';
import Button from './Button';

const EmptyState = ({
  icon,
  title,
  description,
  action,
  actionLabel,
  className = '',
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      {icon && (
        <div className="mb-4 text-secondary-400">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-secondary-900 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-secondary-600 mb-6 max-w-md">
          {description}
        </p>
      )}
      
      {action && actionLabel && (
        <Button onClick={action}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
