/**
 * Debtor AI Assistant Page
 *
 * Página dedicada para el asistente de IA del deudor
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, LoadingSpinner, Button } from '../../components/common';
import AIAssistantCard from '../../components/debtor/AIAssistantCard';
import DebtorNavigationMenu from '../../components/debtor/DebtorNavigationMenu';
import {
  Bot,
  ArrowLeft,
  Settings,
  AlertTriangle,
} from 'lucide-react';

const DebtorAIAssistantPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Cargar datos iniciales si es necesario
    if (user) {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return <LoadingSpinner fullScreen text="Cargando..." />;
  }

  return (
    <div className="space-y-6">
      {/* Navigation Menu */}
      <DebtorNavigationMenu />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
            <Bot className="w-7 h-7 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">
              🤖 Asistente de IA Personalizado
            </h1>
            <p className="text-secondary-600 text-sm">
              Tu experto financiero inteligente con chatbot, análisis predictivo y educación
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            Nuevo
          </div>
        </div>
      </div>

      {/* AI Assistant Card */}
      <div className="border-4 border-dashed border-indigo-300 rounded-xl p-2">
        <p className="text-center text-indigo-600 font-semibold mb-2">🤖 ASISTENTE DE IA ACTIVO</p>
        <AIAssistantCard userId={user?.id} />
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-900">Error en Asistente IA</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner text="Cargando Asistente IA..." />
        </div>
      )}
    </div>
  );
};

export default DebtorAIAssistantPage;