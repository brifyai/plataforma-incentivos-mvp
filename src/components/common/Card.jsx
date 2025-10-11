/**
 * Card Component
 *
 * Modern card component with glassmorphism effects and enhanced styling
 */

import { cn } from '../../utils/helpers';

const Card = ({
  children,
  title,
  subtitle,
  headerAction,
  padding = true,
  hover = false,
  glass = false, // eslint-disable-line no-unused-vars
  gradient = false, // eslint-disable-line no-unused-vars
  variant = 'default', // default, elevated, glass, gradient
  className = '',
  ...props
}) => {
  const baseStyles = 'relative overflow-hidden transition-all duration-300 ease-out backdrop-blur-sm';

  const variants = {
    default: 'bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-lg hover:shadow-xl',
    elevated: 'bg-white/95 backdrop-blur-lg shadow-xl border border-slate-100/80 hover:shadow-2xl',
    glass: 'bg-white/10 backdrop-blur-2xl border border-white/30 shadow-2xl hover:shadow-3xl',
    gradient: 'bg-gradient-to-br from-blue-50/90 via-indigo-50/90 to-purple-50/90 backdrop-blur-md border border-blue-200/40 shadow-xl hover:shadow-2xl',
  };

  const hoverStyles = hover
    ? 'hover:shadow-2xl hover:scale-[1.03] hover:-translate-y-2 cursor-pointer hover:bg-white/95'
    : '';

  const roundedStyles = 'rounded-3xl';

  return (
    <div
      className={cn(
        baseStyles,
        variants[variant],
        roundedStyles,
        hoverStyles,
        'animate-fade-in',
        className
      )}
      {...props}
    >
      {/* Background gradient overlay for glass effect */}
      {variant === 'glass' && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      )}

      {/* Header */}
      {(title || headerAction) && (
        <div className="relative px-6 py-5 border-b border-secondary-100/50 flex items-center justify-between">
          <div className="flex-1">
            {title && (
              <h3 className="text-xl font-bold text-secondary-900 font-display tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-secondary-600 mt-1.5 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && (
            <div className="flex-shrink-0 ml-4">
              {headerAction}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className={cn(
        padding && 'p-6',
        'relative'
      )}>
        {children}
      </div>

      {/* Subtle inner glow for glass variant */}
      {variant === 'glass' && (
        <div className="absolute inset-0 rounded-2xl shadow-inner-light pointer-events-none" />
      )}
    </div>
  );
};

export default Card;
