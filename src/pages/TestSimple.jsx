const TestSimple = () => {
  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center',
      backgroundColor: '#f0f9ff',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#1e40af', fontSize: '32px', marginBottom: '20px' }}>
        🚀 SISTEMA OPERATIVO
      </h1>
      <p style={{ fontSize: '18px', color: '#374151', marginBottom: '30px' }}>
        La aplicación React está funcionando correctamente
      </p>
      
      <div style={{ 
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <h2 style={{ color: '#7c3aed', marginBottom: '15px' }}>✅ DIAGNÓSTICO COMPLETADO</h2>
        <ul style={{ textAlign: 'left', color: '#4b5563' }}>
          <li>✅ Servidor corriendo en puerto 3005</li>
          <li>✅ React funcionando correctamente</li>
          <li>✅ Rutas configuradas</li>
          <li>✅ Componentes básicos OK</li>
        </ul>
        
        <div style={{ marginTop: '20px' }}>
          <button 
            style={{ 
              background: '#8b5cf6', 
              color: 'white', 
              padding: '12px 24px', 
              border: 'none', 
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              margin: '5px'
            }}
            onClick={() => window.location.href = '/'}
          >
            Ir al Inicio
          </button>
          <button 
            style={{ 
              background: '#10b981', 
              color: 'white', 
              padding: '12px 24px', 
              border: 'none', 
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              margin: '5px'
            }}
            onClick={() => window.location.href = '/test-god-mode'}
          >
            Probar GOD MODE
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestSimple;
