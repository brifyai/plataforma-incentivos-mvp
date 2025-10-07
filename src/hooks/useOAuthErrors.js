/**
 * Hook personalizado para manejar errores de OAuth
 * Centraliza la lógica de manejo de errores de autenticación externa
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useOAuthErrors = () => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const errorParam = searchParams.get('error');
    const details = searchParams.get('details');

    if (errorParam) {
      let errorMessage = '';

      switch (errorParam) {
        case 'oauth_callback_failed':
          errorMessage = `Error al procesar la autenticación con Google. ${details ? `Detalles: ${details}` : 'Por favor, intenta de nuevo.'}`;
          break;
        case 'oauth_callback_error':
          errorMessage = `Error en el proceso de autenticación. ${details ? `Detalles: ${details}` : 'Por favor, intenta de nuevo.'}`;
          break;
        case 'access_denied':
          errorMessage = 'Acceso denegado. El usuario canceló la autenticación.';
          break;
        case 'invalid_request':
          errorMessage = 'Solicitud inválida. Por favor, intenta de nuevo.';
          break;
        case 'unauthorized_client':
          errorMessage = 'Cliente no autorizado para esta operación.';
          break;
        case 'unsupported_response_type':
          errorMessage = 'Tipo de respuesta no soportado.';
          break;
        case 'invalid_scope':
          errorMessage = 'Alcance de permisos inválido.';
          break;
        case 'server_error':
          errorMessage = 'Error interno del servidor. Por favor, intenta más tarde.';
          break;
        case 'temporarily_unavailable':
          errorMessage = 'Servicio temporalmente no disponible. Por favor, intenta más tarde.';
          break;
        default:
          errorMessage = `Error de autenticación: ${errorParam}${details ? ` - ${details}` : ''}`;
      }

      setError(errorMessage);
    }
  }, [searchParams]);

  const clearError = () => {
    setError('');
  };

  return {
    error,
    clearError,
    hasError: error.length > 0,
  };
};