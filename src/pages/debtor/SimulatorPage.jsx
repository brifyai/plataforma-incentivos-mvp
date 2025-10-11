/**
 * Página: Simulador de Pagos
 * 
 * Página dedicada al simulador de pagos para deudores
 */

import { useState, useEffect } from 'react';
import { History, Trash2 } from 'lucide-react';
import CommissionCalculator from '../../components/simulator/PaymentSimulator';
import { Card } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import simulatorService from '../../services/simulator/simulatorService';
import { formatCurrency } from '../../utils/formatters';
import Swal from 'sweetalert2';

const SimulatorPage = () => {
  const { user } = useAuth();
  const [savedSimulations, setSavedSimulations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedSimulations();
  }, []);

  const loadSavedSimulations = async () => {
    try {
      // Skip loading simulations for god mode user (mock user not in database)
      if (user.id === 'god-mode-user') {
        setSavedSimulations([]);
        setLoading(false);
        return;
      }

      const simulations = await simulatorService.getUserSimulations(user.id);
      setSavedSimulations(simulations);
    } catch (error) {
      console.error('Error al cargar simulaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSimulation = async (simulationId) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Quieres eliminar esta simulación?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      await simulatorService.deleteSimulation(simulationId);
      setSavedSimulations(prev => prev.filter(s => s.id !== simulationId));
      Swal.fire('Eliminado', 'La simulación ha sido eliminada.', 'success');
    } catch (error) {
      Swal.fire('Error', 'Error al eliminar la simulación', 'error');
    }
  };

  return (
    <div className="space-y-6">
        {/* Calculador de comisiones */}
        <CommissionCalculator />

        {/* Simulaciones guardadas */}
        {!loading && savedSimulations.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <History className="w-6 h-6 text-gray-700" />
              <h2 className="text-2xl font-bold text-gray-900">
                Simulaciones Guardadas
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedSimulations.map((simulation) => (
                <div
                  key={simulation.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">
                      {simulation.simulation_name}
                    </h3>
                    <button
                      onClick={() => handleDeleteSimulation(simulation.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deuda:</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(simulation.input_parameters.debtAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pago:</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(simulation.input_parameters.paymentAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Interés total:</span>
                      <span className="font-medium text-orange-600">
                        {formatCurrency(simulation.results.summary.totalInterestPaid)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tiempo:</span>
                      <span className="font-medium text-purple-600">
                        {simulation.results.summary.timeToFreedom.formatted}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Guardada el {new Date(simulation.created_at).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Información adicional */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            📚 ¿Cómo usar el simulador?
          </h3>
          <div className="space-y-3 text-gray-700">
            <div className="flex gap-3">
              <span className="text-2xl">1️⃣</span>
              <div>
                <p className="font-semibold">Ingresa los datos de tu deuda</p>
                <p className="text-sm">Monto total, tasa de interés y el pago que planeas hacer</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">2️⃣</span>
              <div>
                <p className="font-semibold">Selecciona la frecuencia de pago</p>
                <p className="text-sm">Elige si pagarás semanal, quincenal o mensualmente</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">3️⃣</span>
              <div>
                <p className="font-semibold">Analiza los resultados</p>
                <p className="text-sm">Revisa cuánto pagarás en total, los intereses y el tiempo que tomará</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">4️⃣</span>
              <div>
                <p className="font-semibold">Guarda y compara</p>
                <p className="text-sm">Guarda diferentes escenarios para comparar y elegir el mejor</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
  );
};

export default SimulatorPage;
