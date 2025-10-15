/**
 * Main Entry Point - Emergency Mode
 * 
 * Versión de emergencia que funciona sin variables de entorno
 * para evitar páginas en blanco en producción
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Componente de emergencia simple
const EmergencyApp = () => {
  const [showConfig, setShowConfig] = React.useState(false);
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: 'white',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🚀</div>
        
        <h1 style={{ fontSize: '48px', marginBottom: '16px', fontWeight: 'bold' }}>
          NexuPay
        </h1>
        
        <p style={{ fontSize: '20px', marginBottom: '32px', opacity: 0.9 }}>
          Convierte tus Deudas en Ingresos con IA + Blockchain
        </p>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '24px',
          borderRadius: '12px',
          marginBottom: '32px',
          backdropFilter: 'blur(10px)'
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>
            🛠️ Configuración en Progreso
          </h2>
          
          <p style={{ marginBottom: '16px' }}>
            La aplicación está siendo configurada para producción.
            Por favor, configura las variables de entorno en Netlify.
          </p>
          
          <button
            onClick={() => setShowConfig(!showConfig)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '12px 24px',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            {showConfig ? 'Ocultar' : 'Mostrar'} Instrucciones
          </button>
        </div>
        
        {showConfig && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '24px',
            borderRadius: '12px',
            textAlign: 'left',
            marginBottom: '32px'
          }}>
            <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>
              📋 Variables de Entorno Requeridas:
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <strong>VITE_SUPABASE_URL:</strong>
              <code style={{
                display: 'block',
                background: 'rgba(0, 0, 0, 0.5)',
                padding: '8px',
                borderRadius: '4px',
                marginTop: '4px',
                fontSize: '14px'
              }}>
                https://wvluqdldygmgncqqjkow.supabase.co
              </code>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <strong>VITE_SUPABASE_ANON_KEY:</strong>
              <code style={{
                display: 'block',
                background: 'rgba(0, 0, 0, 0.5)',
                padding: '8px',
                borderRadius: '4px',
                marginTop: '4px',
                fontSize: '12px',
                wordBreak: 'break-all'
              }}>
                eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4
              </code>
            </div>
            
            <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}>
              <strong>🔧 Pasos para configurar:</strong>
              <ol style={{ marginTop: '8px', paddingLeft: '20px' }}>
                <li>Ve a <a href="https://app.netlify.com/projects/nexupay/configuration/env#environment-variables" target="_blank" style={{ color: '#60a5fa' }}>Netlify Environment Variables</a></li>
                <li>Agrega las dos variables arriba</li>
                <li>Guarda y redeploy el sitio</li>
                <li>La aplicación cargará automáticamente</li>
              </ol>
            </div>
          </div>
        )}
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '20px',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🤖</div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>IA Predictiva</h3>
            <p style={{ fontSize: '14px', opacity: 0.8 }}>Machine learning para optimizar cobranzas</p>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '20px',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>⛓️</div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Blockchain</h3>
            <p style={{ fontSize: '14px', opacity: 0.8 }}>Transparencia y seguridad total</p>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '20px',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>💰</div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>50% Comisión</h3>
            <p style={{ fontSize: '14px', opacity: 0.8 }}>La mejor tasa del mercado</p>
          </div>
        </div>
        
        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          padding: '16px',
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          <p style={{ margin: 0 }}>
            <strong>Estado:</strong> <span style={{ color: '#fbbf24' }}>⚠️ Configuración pendiente</span><br/>
            <strong>Acción:</strong> Configurar variables de entorno en Netlify<br/>
            <strong>Soporte:</strong> <a href="mailto:soporte@nexupay.cl" style={{ color: '#60a5fa' }}>soporte@nexupay.cl</a>
          </p>
        </div>
      </div>
    </div>
  );
};

// Renderizar aplicación de emergencia
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<EmergencyApp />);

console.log('🚑 NexuPay Emergency Mode - Waiting for environment variables');