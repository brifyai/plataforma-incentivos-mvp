const TestGodMode = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1 style={{ color: 'purple', fontSize: '24px' }}>👑 MODO ADMINISTRADOR ACTIVO</h1>
      <p>El sistema de transferencias está funcionando correctamente</p>
      
      <div style={{ margin: '20px 0' }}>
        <button 
          style={{ 
            background: '#8b5cf6', 
            color: 'white', 
            padding: '10px 20px', 
            border: 'none', 
            borderRadius: '5px',
            margin: '5px'
          }}
          onClick={() => window.location.href = '/admin/dashboard'}
        >
          Ir al Dashboard Admin
        </button>
        <button 
          style={{ 
            background: '#10b981', 
            color: 'white', 
            padding: '10px 20px', 
            border: 'none', 
            borderRadius: '5px',
            margin: '5px'
          }}
          onClick={() => window.location.href = '/company/transfers'}
        >
          Ver Transferencias
        </button>
      </div>
      
      <div style={{ fontSize: '14px', color: '#666' }}>
        <p><strong>Credenciales GOD MODE:</strong></p>
        <p>Email: camiloalegriabarra@gmail.com</p>
        <p>Password: Antonito26</p>
      </div>
    </div>
  );
};

export default TestGodMode;
