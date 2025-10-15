/**
 * Main Entry Point - Simplificado para Producción
 * 
 * Versión simplificada para evitar errores en producción
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Renderizado simple y directo
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('✅ NexuPay Application started successfully');