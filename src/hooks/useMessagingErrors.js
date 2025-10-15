import { useState, useEffect } from 'react';

export const useMessagingErrors = () => {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const addError = (error) => {
    setErrors(prev => [...prev, { ...error, id: Date.now(), timestamp: new Date() }]);
  };

  const clearErrors = () => {
    setErrors([]);
  };

  const removeError = (id) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  };

  return {
    errors,
    loading,
    addError,
    clearErrors,
    removeError
  };
};