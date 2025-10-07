/**
 * Hook personalizado para manejar la lógica de login
 * Separa la lógica de negocio de la UI
 */

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const useLogin = () => {
  const { login, loginWithGoogle } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setError(''); // Limpiar error al cambiar campos
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Por favor, completa todos los campos');
      return;
    }

    setLoading(true);

    try {
      const { success, error } = await login(formData.email, formData.password);

      if (!success) {
        setError(error || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('Error al iniciar sesión. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');

    try {
      const { success, error } = await loginWithGoogle();

      if (!success) {
        setError(error || 'Error al iniciar sesión con Google');
        setGoogleLoading(false);
      }
      // Si es exitoso, Google redirige automáticamente
    } catch (err) {
      setError('Error al iniciar sesión con Google. Por favor, intenta de nuevo.');
      setGoogleLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const toggleRememberMe = () => {
    setRememberMe(prev => !prev);
  };

  return {
    // Estado del formulario
    formData,
    showPassword,
    rememberMe,
    error,

    // Estados de carga
    loading,
    googleLoading,

    // Handlers
    handleChange,
    handleSubmit,
    handleGoogleLogin,
    togglePasswordVisibility,
    toggleRememberMe,

    // Utilidades
    isFormValid: formData.email && formData.password,
    isLoading: loading || googleLoading,
  };
};