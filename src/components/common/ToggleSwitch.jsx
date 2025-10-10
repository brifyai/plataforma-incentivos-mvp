/**
 * ToggleSwitch Component
 *
 * A reusable toggle switch component for boolean values
 */

import React from 'react';

const ToggleSwitch = ({
  enabled,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md'
}) => {
  const handleToggle = () => {
    if (!disabled && onChange) {
      onChange(!enabled);
    }
  };

  const sizeClasses = {
    sm: {
      switch: 'w-8 h-4',
      circle: 'w-3 h-3',
      translate: 'translate-x-4',
      text: 'text-sm'
    },
    md: {
      switch: 'w-11 h-6',
      circle: 'w-5 h-5',
      translate: 'translate-x-5',
      text: 'text-base'
    },
    lg: {
      switch: 'w-14 h-7',
      circle: 'w-6 h-6',
      translate: 'translate-x-7',
      text: 'text-lg'
    }
  };

  const classes = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        {label && (
          <label
            htmlFor={`toggle-${label?.replace(/\s+/g, '-').toLowerCase()}`}
            className={`font-medium text-secondary-900 ${classes.text} ${disabled ? 'opacity-50' : 'cursor-pointer'}`}
            onClick={handleToggle}
          >
            {label}
          </label>
        )}
        {description && (
          <p className="text-sm text-secondary-600 mt-1">{description}</p>
        )}
      </div>

      <button
        type="button"
        id={`toggle-${label?.replace(/\s+/g, '-').toLowerCase()}`}
        className={`
          relative inline-flex ${classes.switch} flex-shrink-0 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          ${enabled ? 'bg-primary-600' : 'bg-secondary-200'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        role="switch"
        aria-checked={enabled}
        onClick={handleToggle}
        disabled={disabled}
      >
        <span
          className={`
            pointer-events-none inline-block ${classes.circle} rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out
            ${enabled ? classes.translate : 'translate-x-0.5'}
          `}
        />
      </button>
    </div>
  );
};

export default ToggleSwitch;