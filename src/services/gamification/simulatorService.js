/**
 * Servicio del Simulador de Pagos
 * 
 * Maneja cálculos y simulaciones de escenarios de pago
 * para ayudar a los usuarios a planificar sus pagos
 */

import { supabase } from '../../config/supabase';

/**
 * Calcula el plan de pagos basado en los parámetros
 * @param {Object} params - Parámetros de la simulación
 * @returns {Object} Resultados de la simulación
 */
export const calculatePaymentPlan = (params) => {
  const {
    debtAmount,
    interestRate,
    paymentAmount,
    paymentFrequency = 'monthly', // 'weekly', 'biweekly', 'monthly'
    startDate = new Date()
  } = params;

  // Convertir tasa de interés anual a tasa por período
  const periodsPerYear = {
    weekly: 52,
    biweekly: 26,
    monthly: 12
  };

  const periods = periodsPerYear[paymentFrequency];
  const periodInterestRate = (interestRate / 100) / periods;

  // Calcular número de pagos necesarios
  let remainingBalance = debtAmount;
  let totalInterestPaid = 0;
  let paymentSchedule = [];
  let paymentNumber = 1;
  let currentDate = new Date(startDate);

  // Límite de seguridad para evitar loops infinitos
  const maxPayments = 1000;

  while (remainingBalance > 0.01 && paymentNumber <= maxPayments) {
    // Calcular interés del período
    const interestForPeriod = remainingBalance * periodInterestRate;
    
    // Calcular pago a principal
    let principalPayment = paymentAmount - interestForPeriod;
    
    // Si el pago es menor que el interés, ajustar
    if (principalPayment <= 0) {
      return {
        error: 'El monto de pago es insuficiente para cubrir los intereses',
        minimumPayment: Math.ceil(interestForPeriod + 1)
      };
    }

    // Si es el último pago, ajustar al saldo restante
    if (principalPayment > remainingBalance) {
      principalPayment = remainingBalance;
    }

    const totalPayment = principalPayment + interestForPeriod;
    remainingBalance -= principalPayment;
    totalInterestPaid += interestForPeriod;

    // Agregar al cronograma
    paymentSchedule.push({
      paymentNumber,
      date: new Date(currentDate),
      paymentAmount: totalPayment,
      principalPayment,
      interestPayment: interestForPeriod,
      remainingBalance: Math.max(remainingBalance, 0)
    });

    // Avanzar fecha según frecuencia
    switch (paymentFrequency) {
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'biweekly':
        currentDate.setDate(currentDate.getDate() + 14);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
    }

    paymentNumber++;
  }

  // Calcular métricas
  const totalPaid = debtAmount + totalInterestPaid;
  const totalPayments = paymentSchedule.length;
  
  // Calcular fecha de finalización
  const completionDate = paymentSchedule[paymentSchedule.length - 1]?.date;
  
  // Calcular tiempo hasta estar libre de deuda
  const monthsToFreedom = calculateMonthsDifference(startDate, completionDate);
  const yearsToFreedom = Math.floor(monthsToFreedom / 12);
  const remainingMonths = monthsToFreedom % 12;

  return {
    success: true,
    summary: {
      debtAmount,
      totalInterestPaid,
      totalPaid,
      totalPayments,
      completionDate,
      timeToFreedom: {
        months: monthsToFreedom,
        years: yearsToFreedom,
        remainingMonths,
        formatted: formatTimeToFreedom(yearsToFreedom, remainingMonths)
      }
    },
    paymentSchedule
  };
};

/**
 * Compara diferentes estrategias de pago
 * @param {Object} baseParams - Parámetros base de la deuda
 * @param {Array} strategies - Array de estrategias a comparar
 * @returns {Object} Comparación de estrategias
 */
export const comparePaymentStrategies = (baseParams, strategies) => {
  const results = strategies.map(strategy => {
    const params = { ...baseParams, ...strategy };
    const calculation = calculatePaymentPlan(params);
    
    return {
      name: strategy.name,
      paymentAmount: strategy.paymentAmount,
      ...calculation
    };
  });

  // Encontrar la mejor estrategia (menor interés total)
  const bestStrategy = results.reduce((best, current) => {
    if (!current.success) return best;
    if (!best.success) return current;
    return current.summary.totalInterestPaid < best.summary.totalInterestPaid 
      ? current 
      : best;
  }, results[0]);

  return {
    strategies: results,
    bestStrategy: bestStrategy.name,
    comparison: {
      maxInterestSaved: Math.max(...results.map(r => 
        r.success ? r.summary.totalInterestPaid : 0
      )) - Math.min(...results.map(r => 
        r.success ? r.summary.totalInterestPaid : Infinity
      ))
    }
  };
};

/**
 * Calcula el ahorro de intereses al hacer pagos adicionales
 * @param {Object} params - Parámetros de la simulación
 * @returns {Object} Análisis de ahorro
 */
export const calculateExtraPaymentImpact = (params) => {
  const {
    debtAmount,
    interestRate,
    regularPayment,
    extraPayment,
    paymentFrequency = 'monthly'
  } = params;

  // Calcular plan sin pago extra
  const regularPlan = calculatePaymentPlan({
    debtAmount,
    interestRate,
    paymentAmount: regularPayment,
    paymentFrequency
  });

  // Calcular plan con pago extra
  const extraPlan = calculatePaymentPlan({
    debtAmount,
    interestRate,
    paymentAmount: regularPayment + extraPayment,
    paymentFrequency
  });

  if (!regularPlan.success || !extraPlan.success) {
    return {
      error: 'No se pudo calcular el impacto del pago extra'
    };
  }

  const interestSaved = regularPlan.summary.totalInterestPaid - 
                        extraPlan.summary.totalInterestPaid;
  const timeSaved = regularPlan.summary.timeToFreedom.months - 
                    extraPlan.summary.timeToFreedom.months;

  return {
    success: true,
    regularPlan: regularPlan.summary,
    extraPlan: extraPlan.summary,
    savings: {
      interestSaved,
      timeSavedMonths: timeSaved,
      percentageSaved: (interestSaved / regularPlan.summary.totalInterestPaid) * 100
    }
  };
};

/**
 * Guarda una simulación en la base de datos
 * @param {string} userId - ID del usuario
 * @param {Object} simulation - Datos de la simulación
 * @returns {Promise<Object>} Simulación guardada
 */
export const saveSimulation = async (userId, simulation) => {
  try {
    const { data, error } = await supabase
      .from('payment_simulations')
      .insert({
        user_id: userId,
        debt_id: simulation.debtId || null,
        simulation_name: simulation.name,
        input_parameters: simulation.inputParameters,
        results: simulation.results
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al guardar simulación:', error);
    throw error;
  }
};

/**
 * Obtiene las simulaciones guardadas del usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Lista de simulaciones
 */
export const getUserSimulations = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('payment_simulations')
      .select(`
        *,
        debts (
          original_amount,
          current_amount,
          debt_type
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al obtener simulaciones:', error);
    throw error;
  }
};

/**
 * Elimina una simulación
 * @param {string} simulationId - ID de la simulación
 * @returns {Promise<void>}
 */
export const deleteSimulation = async (simulationId) => {
  try {
    const { error } = await supabase
      .from('payment_simulations')
      .delete()
      .eq('id', simulationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error al eliminar simulación:', error);
    throw error;
  }
};

/**
 * Calcula el pago mínimo recomendado
 * @param {number} debtAmount - Monto de la deuda
 * @param {number} interestRate - Tasa de interés anual
 * @param {string} frequency - Frecuencia de pago
 * @returns {number} Pago mínimo recomendado
 */
export const calculateMinimumPayment = (debtAmount, interestRate, frequency = 'monthly') => {
  const periodsPerYear = {
    weekly: 52,
    biweekly: 26,
    monthly: 12
  };

  const periods = periodsPerYear[frequency];
  const periodInterestRate = (interestRate / 100) / periods;
  
  // Pago mínimo = interés del período + 1% del principal
  const interestPayment = debtAmount * periodInterestRate;
  const principalPayment = debtAmount * 0.01;
  
  return Math.ceil(interestPayment + principalPayment);
};

/**
 * Genera datos para gráfico de amortización
 * @param {Array} paymentSchedule - Cronograma de pagos
 * @returns {Object} Datos para gráficos
 */
export const generateAmortizationChartData = (paymentSchedule) => {
  return {
    labels: paymentSchedule.map(p => p.paymentNumber),
    datasets: [
      {
        label: 'Saldo Restante',
        data: paymentSchedule.map(p => p.remainingBalance),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true
      },
      {
        label: 'Pago a Principal',
        data: paymentSchedule.map(p => p.principalPayment),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true
      },
      {
        label: 'Pago a Interés',
        data: paymentSchedule.map(p => p.interestPayment),
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true
      }
    ]
  };
};

// =============================================
// FUNCIONES AUXILIARES
// =============================================

/**
 * Calcula la diferencia en meses entre dos fechas
 */
function calculateMonthsDifference(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const yearsDiff = end.getFullYear() - start.getFullYear();
  const monthsDiff = end.getMonth() - start.getMonth();
  
  return yearsDiff * 12 + monthsDiff;
}

/**
 * Formatea el tiempo hasta estar libre de deuda
 */
function formatTimeToFreedom(years, months) {
  if (years === 0) {
    return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  } else if (months === 0) {
    return `${years} ${years === 1 ? 'año' : 'años'}`;
  } else {
    return `${years} ${years === 1 ? 'año' : 'años'} y ${months} ${months === 1 ? 'mes' : 'meses'}`;
  }
}

export default {
  calculatePaymentPlan,
  comparePaymentStrategies,
  calculateExtraPaymentImpact,
  saveSimulation,
  getUserSimulations,
  deleteSimulation,
  calculateMinimumPayment,
  generateAmortizationChartData
};
