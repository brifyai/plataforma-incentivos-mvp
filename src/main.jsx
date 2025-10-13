/**
 * Main Entry Point
 *
 * Punto de entrada de la aplicación React
 * Con sistema de prevención de errores
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Importar sistemas de prevención
import { initializeErrorPrevention, appHealthMonitor } from './utils/errorPrevention.jsx';
import { quickHealthCheck } from './utils/preDeploymentChecks.js';

// Inicializar sistema de prevención de errores
initializeErrorPrevention();

// Verificación de salud inicial
const initializeApp = async () => {
  try {
    console.log('🚀 Initializing NexuPay Application...');
    
    // Verificación rápida de salud
    const healthCheck = await quickHealthCheck();
    console.log(`🏥 Initial Health Check: ${healthCheck.status} (${healthCheck.summary})`);
    
    // Si hay problemas críticos, mostrar advertencia
    if (healthCheck.status === 'CRITICAL') {
      console.warn('⚠️ Critical issues detected. App may not function properly.');
      
      // Mostrar mensaje de error en desarrollo
      if (process.env.NODE_ENV === 'development') {
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
          <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc2626;
            color: white;
            padding: 16px;
            border-radius: 8px;
            z-index: 9999;
            max-width: 400px;
            font-family: system-ui, -apple-system, sans-serif;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          ">
            <h4 style="margin: 0 0 8px 0; font-size: 16px;">⚠️ Critical Issues Detected</h4>
            <p style="margin: 0; font-size: 14px;">
              The application has critical issues that may prevent it from working properly.
              Check the console for details.
            </p>
            <button onclick="this.parentElement.remove()" style="
              margin-top: 8px;
              padding: 4px 8px;
              background: white;
              color: #dc2626;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            ">Dismiss</button>
          </div>
        `;
        document.body.appendChild(errorDiv);
        
        // Auto-remover después de 10 segundos
        setTimeout(() => {
          if (errorDiv.parentElement) {
            errorDiv.remove();
          }
        }, 10000);
      }
    }
    
    // Renderizar la aplicación
    const root = ReactDOM.createRoot(document.getElementById('root'));
    
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log('✅ NexuPay Application initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    
    // Mostrar pantalla de error crítico
    document.getElementById('root').innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        font-family: system-ui, -apple-system, sans-serif;
        color: white;
        text-align: center;
        padding: 20px;
      ">
        <div style="max-width: 500px;">
          <div style="font-size: 64px; margin-bottom: 20px;">🚨</div>
          <h1 style="font-size: 24px; margin-bottom: 16px;">Application Failed to Load</h1>
          <p style="margin-bottom: 24px; opacity: 0.9;">
            We're sorry, but the application couldn't be loaded due to a critical error.
            Please try refreshing the page or contact support if the problem persists.
          </p>
          <div style="
            background: rgba(255, 255, 255, 0.1);
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 24px;
            text-align: left;
            font-family: monospace;
            font-size: 12px;
            opacity: 0.8;
          ">
            <strong>Error Details:</strong><br>
            ${error.message}<br>
            <strong>Time:</strong> ${new Date().toISOString()}
          </div>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button onclick="window.location.reload()" style="
              background: white;
              color: #667eea;
              border: none;
              padding: 12px 24px;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 600;
            ">Refresh Page</button>
            <button onclick="window.open('mailto:support@nexupay.cl', '_blank')" style="
              background: transparent;
              color: white;
              border: 1px solid white;
              padding: 12px 24px;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 600;
            ">Contact Support</button>
          </div>
        </div>
      </div>
    `;
    
    // Reportar error al monitor de salud
    appHealthMonitor.logError(error, 'App Initialization');
  }
};

// Inicializar la aplicación
initializeApp();

// Exponer funciones globales para debugging (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  window.appHealth = {
    getHealthStatus: () => appHealthMonitor.getHealthStatus(),
    runHealthCheck: quickHealthCheck,
    clearErrors: () => appHealthMonitor.clear(),
    getErrorCount: () => appHealthMonitor.getHealthStatus().totalErrors
  };
  
  console.log('🔧 Development tools available in window.appHealth');
}
