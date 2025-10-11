/**
 * Reusable Form Section Component
 * Provides consistent styling for form sections with headers and descriptions
 */

import React from 'react';

const FormSection = ({
  title,
  description,
  icon,
  children,
  className = '',
  gradient = 'primary',
  ...props
}) => {
  const gradientClasses = {
    primary: 'bg-gradient-to-r from-primary-50 to-primary-100/50 border-primary-200',
    success: 'bg-gradient-to-r from-success-50 to-success-100/50 border-success-200',
    blue: 'bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-200',
    purple: 'bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-200',
    green: 'bg-gradient-to-r from-green-50 to-green-100/50 border-green-200',
    amber: 'bg-gradient-to-r from-amber-50 to-amber-50 border-amber-200',
  };

  return (
    <div
      className={`border-2 rounded-2xl p-6 ${gradientClasses[gradient]} ${className}`}
      {...props}
    >
      {(title || icon) && (
        <div className="flex items-center gap-3 mb-6">
          {icon && (
            <div className="p-2 bg-white rounded-lg shadow-sm">
              {icon}
            </div>
          )}
          <div>
            <h3 className="text-xl font-display font-bold text-secondary-900">
              {title}
            </h3>
            {description && (
              <p className="text-secondary-600 text-sm mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};

export default FormSection;