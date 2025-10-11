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
  const baseStyles = 'relative inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-300 ease-out focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden group backdrop-blur-sm';

  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 focus:ring-blue-200/50 shadow-lg hover:shadow-xl hover:shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] border border-blue-500/20',
    secondary: 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 hover:from-slate-200 hover:to-slate-300 focus:ring-slate-100 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] border border-slate-300/50',
    success: 'bg-gradient-to-r from-emerald-600 via-emerald-700 to-green-700 text-white hover:from-emerald-700 hover:via-emerald-800 hover:to-green-800 focus:ring-emerald-200/50 shadow-lg hover:shadow-xl hover:shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] border border-emerald-500/20',
    danger: 'bg-gradient-to-r from-red-600 via-red-700 to-rose-700 text-white hover:from-red-700 hover:via-red-800 hover:to-rose-800 focus:ring-red-200/50 shadow-lg hover:shadow-xl hover:shadow-red-500/25 hover:scale-[1.02] active:scale-[0.98] border border-red-500/20',
    warning: 'bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-700 text-white hover:from-amber-700 hover:via-orange-700 hover:to-yellow-800 focus:ring-amber-200/50 shadow-lg hover:shadow-xl hover:shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] border border-amber-500/20',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:border-blue-700 focus:ring-blue-200/50 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] bg-white/80',
    ghost: 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 focus:ring-slate-100 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
    glass: 'bg-white/10 backdrop-blur-xl border border-white/30 text-white hover:bg-white/20 focus:ring-white/30 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]',
    gradient: 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 focus:ring-purple-200/50 shadow-lg hover:shadow-xl hover:shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98] border border-purple-500/20',
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
