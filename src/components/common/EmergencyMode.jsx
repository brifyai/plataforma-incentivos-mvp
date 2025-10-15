/**
 * Componente de Modo de Emergencia
 * 
 * Se muestra cuando Supabase no está configurado en producción
 * En lugar de mostrar una página en blanco, muestra una página de mantenimiento
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Mail, ExternalLink } from 'lucide-react';

const EmergencyMode = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-600/30 rounded-2xl p-8 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            NexuPay en Mantenimiento
          </h1>

          {/* Message */}
          <div className="text-center mb-8">
            <p className="text-xl text-gray-300 mb-4">
              Estamos actualizando nuestros sistemas para brindarte una mejor experiencia.
            </p>
            <p className="text-gray-400">
              La aplicación estará disponible nuevamente en breve. Gracias por tu paciencia.
            </p>
          </div>

          {/* Status */}
          <div className="bg-gray-700/50 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Estado del sistema:</span>
              <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium">
                Mantenimiento Temporal
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-gray-300">Última actualización:</span>
              <span className="text-gray-400 text-sm">
                {new Date().toLocaleString('es-CL', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit'
                })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <button
              onClick={handleRefresh}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium"
            >
              <RefreshCw className="w-5 h-5" />
              Verificar Estado Actual
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="mailto:soporte@nexupay.cl"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-700/70 transition-all duration-300 font-medium"
              >
                <Mail className="w-5 h-5" />
                Contactar Soporte
              </a>
              
              <a
                href="https://status.nexupay.cl"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-700/70 transition-all duration-300 font-medium"
              >
                <ExternalLink className="w-5 h-5" />
                Estado del Sistema
              </a>
            </div>
          </div>

          {/* Info */}
          <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-300 text-center">
              <strong>Información importante:</strong> Tu información y datos están seguros. 
              Solo estamos realizando actualizaciones técnicas para mejorar el servicio.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="text-white font-bold">NexuPay</span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2025 NexuPay. Tecnología blockchain aplicada a las finanzas tradicionales.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmergencyMode;