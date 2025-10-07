/**
 * Test Page
 *
 * Página de prueba simple para verificar que el routing funciona
 */

const TestPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          ¡Hola Mundo!
        </h1>
        <p className="text-gray-600 mb-6">
          Esta es una página de prueba simple para verificar que el routing funciona correctamente.
        </p>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            ✅ El routing está funcionando<br/>
            ✅ React está renderizando<br/>
            ✅ Tailwind CSS está aplicado
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestPage;