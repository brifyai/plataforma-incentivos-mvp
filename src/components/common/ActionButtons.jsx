/**
 * Reusable Action Buttons Component
 * Provides consistent styling for form action buttons (Cancel/Save, etc.)
 */

import React from 'react';
import { Button } from './index';

const ActionButtons = ({
  onCancel,
  onConfirm,
  cancelText = 'Cancelar',
  confirmText = 'Guardar',
  loading = false,
  confirmLoading = false,
  disabled = false,
  confirmDisabled = false,
  variant = 'gradient',
  size = 'default',
  className = '',
  ...props
}) => {
  return (
    <div className={`flex gap-4 pt-6 ${className}`} {...props}>
      <Button
        variant="outline"
        onClick={onCancel}
        className="flex-1 hover:scale-105 transition-all py-3"
        disabled={loading}
      >
        {cancelText}
      </Button>
      <Button
        variant={variant}
        onClick={onConfirm}
        className="flex-1 shadow-soft hover:shadow-glow-primary py-3"
        loading={confirmLoading || loading}
        disabled={disabled || confirmDisabled}
      >
        {confirmLoading ? 'Guardando...' : confirmText}
      </Button>
    </div>
  );
};

export default ActionButtons;