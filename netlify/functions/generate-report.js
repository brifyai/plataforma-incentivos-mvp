/**
 * Netlify Function para Generación de Reportes
 * 
 * Esta función genera reportes de analytics y métricas
 * para dashboard administrativos y de empresa
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async (event, context) => {
  // Configurar CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Manejar preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { reportType, filters, format = 'json' } = JSON.parse(event.body);

    // Validar datos requeridos
    if (!reportType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required field: reportType' 
        })
      };
    }

    console.log('📊 Generando reporte:', {
      reportType,
      format,
      timestamp: new Date().toISOString()
    });

    // Generar el reporte según el tipo
    const reportData = await generateReport(reportType, filters);

    // Formatear según lo solicitado
    let response;
    if (format === 'csv') {
      response = await formatAsCSV(reportData, reportType);
      headers['Content-Type'] = 'text/csv';
      headers['Content-Disposition'] = `attachment; filename="${reportType}-${Date.now()}.csv"`;
    } else {
      response = JSON.stringify(reportData);
    }

    // Registrar la generación del reporte
    await logReportGeneration({
      reportType,
      filters,
      format,
      status: 'success',
      recordCount: Array.isArray(reportData) ? reportData.length : 1
    });

    return {
      statusCode: 200,
      headers,
      body: response
    };

  } catch (error) {
    console.error('❌ Error generando reporte:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};

/**
 * Generar el reporte según el tipo solicitado
 */
async function generateReport(reportType, filters = {}) {
  switch (reportType) {
    case 'company_analytics':
      return await generateCompanyAnalytics(filters);
    
    case 'payment_summary':
      return await generatePaymentSummary(filters);
    
    case 'debt_portfolio':
      return await generateDebtPortfolio(filters);
    
    case 'user_activity':
      return await generateUserActivity(filters);
    
    case 'commission_report':
      return await generateCommissionReport(filters);
    
    case 'negotiation_performance':
      return await generateNegotiationPerformance(filters);
    
    default:
      throw new Error(`Report type not supported: ${reportType}`);
  }
}

/**
 * Generar reporte de analytics de empresa
 */
async function generateCompanyAnalytics(filters) {
  try {
    const { companyId, dateRange } = filters;
    
    let query = supabase
      .from('company_analytics')
      .select('*');

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    if (dateRange) {
      const { start, end } = dateRange;
      query = query
        .gte('created_at', start)
        .lte('created_at', end);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Calcular métricas adicionales
    const metrics = calculateCompanyMetrics(data);

    return {
      summary: metrics,
      details: data,
      generated_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error en generateCompanyAnalytics:', error);
    throw error;
  }
}

/**
 * Generar reporte de resumen de pagos
 */
async function generatePaymentSummary(filters) {
  try {
    const { companyId, status, dateRange } = filters;
    
    let query = supabase
      .from('payments')
      .select(`
        *,
        debts!inner(
          id,
          amount,
          debtor_id,
          companies!inner(id, name)
        )
      `);

    if (companyId) {
      query = query.eq('debts.companies.id', companyId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (dateRange) {
      const { start, end } = dateRange;
      query = query
        .gte('created_at', start)
        .lte('created_at', end);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Calcular totales y estadísticas
    const summary = calculatePaymentSummary(data);

    return {
      summary,
      payments: data,
      generated_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error en generatePaymentSummary:', error);
    throw error;
  }
}

/**
 * Generar reporte de portafolio de deudas
 */
async function generateDebtPortfolio(filters) {
  try {
    const { companyId, status, ageRange } = filters;
    
    let query = supabase
      .from('debts')
      .select(`
        *,
        debtors!inner(id, name, email),
        companies!inner(id, name)
      `);

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Calcular métricas del portafolio
    const portfolio = calculateDebtPortfolio(data, ageRange);

    return {
      portfolio,
      debts: data,
      generated_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error en generateDebtPortfolio:', error);
    throw error;
  }
}

/**
 * Generar reporte de actividad de usuarios
 */
async function generateUserActivity(filters) {
  try {
    const { userId, role, dateRange } = filters;
    
    let query = supabase
      .from('user_activity_logs')
      .select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (role) {
      query = query.eq('user_role', role);
    }

    if (dateRange) {
      const { start, end } = dateRange;
      query = query
        .gte('created_at', start)
        .lte('created_at', end);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Analizar patrones de actividad
    const activity = analyzeUserActivity(data);

    return {
      summary: activity,
      logs: data,
      generated_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error en generateUserActivity:', error);
    throw error;
  }
}

/**
 * Generar reporte de comisiones
 */
async function generateCommissionReport(filters) {
  try {
    const { companyId, dateRange, status } = filters;
    
    let query = supabase
      .from('commissions')
      .select(`
        *,
        users!inner(id, email, full_name),
        payments!inner(id, amount, status)
      `);

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (dateRange) {
      const { start, end } = dateRange;
      query = query
        .gte('created_at', start)
        .lte('created_at', end);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Calcular totales de comisiones
    const commissionSummary = calculateCommissionSummary(data);

    return {
      summary: commissionSummary,
      commissions: data,
      generated_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error en generateCommissionReport:', error);
    throw error;
  }
}

/**
 * Generar reporte de desempeño de negociación IA
 */
async function generateNegotiationPerformance(filters) {
  try {
    const { companyId, dateRange, outcome } = filters;
    
    // Aquí deberías consultar tus tablas de negociación IA
    // Por ahora, simulamos datos
    const data = [
      {
        id: 1,
        negotiation_id: 'neg_001',
        outcome: 'success',
        response_time: 120,
        completion_rate: 85,
        satisfaction_score: 4.5
      }
    ];

    const performance = calculateNegotiationMetrics(data);

    return {
      summary: performance,
      negotiations: data,
      generated_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error en generateNegotiationPerformance:', error);
    throw error;
  }
}

/**
 * Funciones de cálculo de métricas
 */
function calculateCompanyMetrics(data) {
  if (!data || data.length === 0) return {};

  const totalDebts = data.reduce((sum, item) => sum + (item.total_debts || 0), 0);
  const totalPayments = data.reduce((sum, item) => sum + (item.total_payments || 0), 0);
  const totalUsers = data.reduce((sum, item) => sum + (item.active_users || 0), 0);

  return {
    total_debts: totalDebts,
    total_payments: totalPayments,
    total_users: totalUsers,
    recovery_rate: totalDebts > 0 ? (totalPayments / totalDebts) * 100 : 0
  };
}

function calculatePaymentSummary(payments) {
  if (!payments || payments.length === 0) return {};

  const total = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const successful = payments.filter(p => p.status === 'approved').length;
  const pending = payments.filter(p => p.status === 'pending').length;
  const failed = payments.filter(p => p.status === 'rejected').length;

  return {
    total_amount: total,
    total_count: payments.length,
    successful_count: successful,
    pending_count: pending,
    failed_count: failed,
    success_rate: payments.length > 0 ? (successful / payments.length) * 100 : 0
  };
}

function calculateDebtPortfolio(debts, ageRange) {
  if (!debts || debts.length === 0) return {};

  const total = debts.reduce((sum, d) => sum + (d.amount || 0), 0);
  const paid = debts.filter(d => d.status === 'paid').reduce((sum, d) => sum + (d.amount || 0), 0);

  return {
    total_debt: total,
    paid_debt: paid,
    outstanding_debt: total - paid,
    recovery_rate: total > 0 ? (paid / total) * 100 : 0
  };
}

function analyzeUserActivity(logs) {
  if (!logs || logs.length === 0) return {};

  const actions = logs.reduce((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {});

  return {
    total_actions: logs.length,
    action_breakdown: actions,
    unique_users: new Set(logs.map(l => l.user_id)).size
  };
}

function calculateCommissionSummary(commissions) {
  if (!commissions || commissions.length === 0) return {};

  const total = commissions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const paid = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.amount || 0), 0);

  return {
    total_commissions: total,
    paid_commissions: paid,
    pending_commissions: total - paid
  };
}

function calculateNegotiationMetrics(negotiations) {
  if (!negotiations || negotiations.length === 0) return {};

  const successful = negotiations.filter(n => n.outcome === 'success').length;
  const avgResponseTime = negotiations.reduce((sum, n) => sum + (n.response_time || 0), 0) / negotiations.length;
  const avgSatisfaction = negotiations.reduce((sum, n) => sum + (n.satisfaction_score || 0), 0) / negotiations.length;

  return {
    total_negotiations: negotiations.length,
    success_rate: (successful / negotiations.length) * 100,
    avg_response_time: avgResponseTime,
    avg_satisfaction_score: avgSatisfaction
  };
}

/**
 * Formatear datos como CSV
 */
async function formatAsCSV(data, reportType) {
  if (!data || !Array.isArray(data.details)) {
    return 'No data available';
  }

  const headers = Object.keys(data.details[0] || {});
  const csvRows = [
    headers.join(','),
    ...data.details.map(row => 
      headers.map(header => `"${row[header] || ''}"`).join(',')
    )
  ];

  return csvRows.join('\n');
}

/**
 * Registrar generación de reporte
 */
async function logReportGeneration({ reportType, filters, format, status, recordCount }) {
  try {
    const { data, error } = await supabase
      .from('report_logs')
      .insert({
        report_type: reportType,
        filters,
        format,
        status,
        record_count: recordCount,
        generated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error registrando generación de reporte:', error);
    }

    return data;
  } catch (error) {
    console.error('Error en logReportGeneration:', error);
  }
}