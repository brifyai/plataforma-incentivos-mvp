/**
 * Componente Principal de la Aplicación
 *
 * Configura los providers y el router principal
 * 🔥 INCLUYE ACTIVACIÓN FORZADA DEL MÓDULO DE IA
 */

import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import AppRouter from './routes/AppRouter';

function App() {
  // 🔥 ACTIVACIÓN FORZADA DEL MÓDULO DE IA AL INICIO DE LA APLICACIÓN
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('🚀 ACTIVANDO MÓDULO DE IA AL INICIO DE LA APLICACIÓN...');

      try {
        // Forzar activación directa en localStorage
        const forcedFlags = {
          ai_module_enabled: true,
          ai_negotiation_enabled: true,
          ai_dashboard_enabled: true,
          ai_config_enabled: true,
          ai_analytics_enabled: true,
          ai_real_time_enabled: true,
          ai_escalation_enabled: true,
          ai_groq_enabled: true,
          ai_chutes_enabled: true,
          ai_safe_mode: false,
          ai_fallback_enabled: true,
          ai_error_recovery_enabled: true
        };

        localStorage.setItem('ai_feature_flags', JSON.stringify(forcedFlags));
        console.log('✅ MÓDULO DE IA ACTIVADO FORZADAMENTE AL INICIO');
        console.log('📊 Banderas activadas:', forcedFlags);
      } catch (error) {
        console.error('❌ Error en activación forzada al inicio:', error);
      }
    }
  }, []);

  return (
    <div lang="es">
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppRouter />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;
