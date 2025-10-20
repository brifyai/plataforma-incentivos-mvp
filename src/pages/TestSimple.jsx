/**
 * Test Simple Page
 *
 * Página de prueba simple para verificar que la aplicación funciona
 */

const TestSimple = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-4 text-blue-600">
          ¡Aplicación Funcionando! ✅
        </h1>
        <p className="text-gray-600 text-center mb-4">
          Si puedes ver esta página, la aplicación está funcionando correctamente.
        </p>
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Puerto: 3006
          </p>
          <p className="text-sm text-gray-500">
            Hora: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestSimple;
