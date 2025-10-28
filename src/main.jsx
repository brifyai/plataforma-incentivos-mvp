/**
 * Main Entry Point - Simplified Version
 *
 * Punto de entrada simplificado para evitar problemas de inicialización
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

console.log('🚀 Starting NexuPay Application...');

// Renderizado simple y directo
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(rootElement);

try {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('✅ NexuPay Application started successfully');
} catch (error) {
  console.error('❌ Failed to render application:', error);
  
  // Mostrar pantalla de error simple
  rootElement.innerHTML = `
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
        <h1 style="font-size: 24px; margin-bottom: 16px;">Application Error</h1>
        <p style="margin-bottom: 24px; opacity: 0.9;">
          The application couldn't load due to an error.
        </p>
        <button onclick="window.location.reload()" style="
          background: white;
          color: #667eea;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        ">Refresh Page</button>
      </div>
    </div>
  `;
}
