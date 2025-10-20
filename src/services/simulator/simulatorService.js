/**
 * Simulator Service
 * 
 * Servicio para gestionar las simulaciones de pagos
 */

import { supabase } from '../../config/supabase';

const simulatorService = {
  /**
   * Obtiene las simulaciones guardadas de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Array>} - Lista de simulaciones
   */
  async getUserSimulations(userId) {
    try {
      const { data, error } = await supabase
        .from('payment_simulations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user simulations:', error);
      return [];
    }
  },

  /**
   * Elimina una simulación
   * @param {string} simulationId - ID de la simulación
   * @returns {Promise<boolean>} - True si se eliminó correctamente
   */
  async deleteSimulation(simulationId) {
    try {
      const { error } = await supabase
        .from('payment_simulations')
        .delete()
        .eq('id', simulationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting simulation:', error);
      throw error;
    }
  },

  /**
   * Guarda una nueva simulación
   * @param {Object} simulationData - Datos de la simulación
   * @returns {Promise<Object>} - Simulación guardada
   */
  async saveSimulation(simulationData) {
    try {
      const { data, error } = await supabase
        .from('payment_simulations')
        .insert([simulationData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving simulation:', error);
      throw error;
    }
  }
};

export default simulatorService;