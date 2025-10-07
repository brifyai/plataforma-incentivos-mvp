/**
 * Reusable Form Field Component
 * Provides consistent styling and behavior for form inputs
 */

import React from 'react';

const FormField = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  icon,
  className = '',
  multiline = false,
  rows = 3,
  min,
  max,
  step,
  options = [],
  ...props
}) => {
  const baseInputClasses = `
    w-full px-4 py-3 border-2 border-secondary-200 rounded-xl
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
    bg-white text-lg transition-all
    ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
    ${className}
  `;

  const renderInput = () => {
    if (type === 'select') {
      return (
        <select
          value={value}
          onChange={onChange}
          className={`${baseInputClasses} appearance-none`}
          required={required}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (multiline) {
      return (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          rows={rows}
          className={`${baseInputClasses} resize-none`}
          {...props}
        />
      );
    }

    return (
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
        className={baseInputClasses}
        {...props}
      />
    );
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-bold text-secondary-900 font-display">
          {icon && <span className="mr-2">{icon}</span>}
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && !multiline && type !== 'select' && (
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400 font-medium">
            {icon}
          </span>
        )}

        <div className={icon && !multiline && type !== 'select' ? 'pl-12' : ''}>
          {renderInput()}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
};

export default FormField;