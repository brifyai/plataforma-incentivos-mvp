/**
 * Button Component
 *
 * Modern button component with enhanced styling, animations, and variants
 */

import { cn } from '../../utils/helpers';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  glow = false,
  className = '',
  type = 'button',
  ...props
}) => {
  const baseStyles = 'relative inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 ease-out focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden group';

  const variants = {
    primary: 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 focus:ring-primary-200/50 shadow-soft hover:shadow-glow hover:scale-105 active:scale-95',
    secondary: 'bg-gradient-to-r from-secondary-100 to-secondary-200 text-secondary-800 hover:from-secondary-200 hover:to-secondary-300 focus:ring-secondary-100 shadow-soft hover:shadow-medium hover:scale-105 active:scale-95',
    success: 'bg-gradient-to-r from-success-600 to-success-700 text-white hover:from-success-700 hover:to-success-800 focus:ring-success-200/50 shadow-soft hover:shadow-glow-success hover:scale-105 active:scale-95',
    danger: 'bg-gradient-to-r from-danger-600 to-danger-700 text-white hover:from-danger-700 hover:to-danger-800 focus:ring-danger-200/50 shadow-soft hover:shadow-glow-danger hover:scale-105 active:scale-95',
    warning: 'bg-gradient-to-r from-warning-600 to-warning-700 text-white hover:from-warning-700 hover:to-warning-800 focus:ring-warning-200/50 shadow-soft hover:shadow-glow-warning hover:scale-105 active:scale-95',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 hover:border-primary-700 focus:ring-primary-200/50 shadow-soft hover:shadow-medium hover:scale-105 active:scale-95',
    ghost: 'text-secondary-700 hover:bg-secondary-100/80 hover:text-secondary-900 focus:ring-secondary-100 shadow-soft hover:shadow-medium hover:scale-105 active:scale-95',
    glass: 'bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 focus:ring-white/30 shadow-glass hover:shadow-strong hover:scale-105 active:scale-95',
    gradient: 'bg-gradient-to-r from-accent-500 to-primary-600 text-white hover:from-accent-600 hover:to-primary-700 focus:ring-accent-200/50 shadow-soft hover:shadow-glow hover:scale-105 active:scale-95',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm gap-1.5',
    md: 'px-6 py-3 text-base gap-2',
    lg: 'px-8 py-4 text-lg gap-2.5',
    xl: 'px-10 py-5 text-xl gap-3',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        widthClass,
        glow && variant === 'primary' && 'shadow-glow',
        'animate-fade-in',
        className
      )}
      {...props}
    >
      {/* Background shimmer effect for primary buttons */}
      {variant === 'primary' && !loading && (
        <div className="absolute inset-0 -top-1 -bottom-1 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
      )}

      {/* Loading spinner */}
      {loading && (
        <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
      )}

      {/* Left icon */}
      {!loading && leftIcon && (
        <span className="flex-shrink-0 transition-transform group-hover:scale-110">
          {leftIcon}
        </span>
      )}

      {/* Content */}
      <span className="relative z-10 font-semibold tracking-wide" style={{ whiteSpace: 'nowrap' }}>
        {children}
      </span>

      {/* Right icon */}
      {!loading && rightIcon && (
        <span className="flex-shrink-0 transition-transform group-hover:scale-110">
          {rightIcon}
        </span>
      )}

      {/* Ripple effect overlay */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-active:opacity-20 bg-white transition-opacity duration-150" />
    </button>
  );
};

export default Button;
