/**
 * Componente Principal de la Aplicación
 * 
 * Configura los providers y el router principal
 */

import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import AppRouter from './routes/AppRouter';

function App() {
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
