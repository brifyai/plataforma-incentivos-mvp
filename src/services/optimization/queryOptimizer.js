/**
 * Servicio de Optimización de Consultas SQL para NexuPay
 * 
 * Proporciona utilidades para optimizar consultas a Supabase,
 * incluyendo paginación inteligente, selección de campos específicos
 * y estrategias de carga de datos.
 */

// Configuración de optimización
const QUERY_CONFIG = {
  defaultPageSize: 20,
  maxPageSize: 100,
  enableQueryOptimization: true,
  enableFieldSelection: true,
  enableIndexHints: true,
  enableQueryCaching: true
};

// Mapa de campos específicos por tabla para optimizar consultas
const TABLE_FIELDS = {
  users: {
    minimal: ['id', 'full_name', 'email', 'role'],
    profile: ['id', 'full_name', 'email', 'rut', 'phone', 'role', 'validation_status', 'created_at'],
    detailed: ['*']
  },
  companies: {
    minimal: ['id', 'company_name', 'contact_email'],
    profile: ['id', 'company_name', 'contact_email', 'contact_phone', 'rut', 'validation_status', 'created_at'],
    detailed: ['*']
  },
  debts: {
    minimal: ['id', 'original_amount', 'current_amount', 'status', 'created_at'],
    list: ['id', 'original_amount', 'current_amount', 'status', 'created_at', 'user_id', 'company_id'],
    detailed: ['*']
  },
  payments: {
    minimal: ['id', 'amount', 'status', 'transaction_date'],
    list: ['id', 'amount', 'status', 'transaction_date', 'user_id', 'company_id'],
    detailed: ['*']
  },
  clients: {
    minimal: ['id', 'business_name', 'contact_email'],
    profile: ['id', 'business_name', 'contact_email', 'contact_phone', 'rut', 'created_at'],
    detailed: ['*']
  }
};

// Índices sugeridos para optimización
const SUGGESTED_INDEXES = {
  users: ['idx_users_role', 'idx_users_email', 'idx_users_validation_status'],
  companies: ['idx_companies_user_id', 'idx_companies_validation_status', 'idx_companies_contact_email'],
  debts: ['idx_debts_company_id', 'idx_debts_user_id', 'idx_debts_status', 'idx_debts_created_at'],
  payments: ['idx_payments_company_id', 'idx_payments_user_id', 'idx_payments_status', 'idx_payments_transaction_date'],
  clients: ['idx_clients_company_id', 'idx_clients_corporate_client_id', 'idx_clients_business_name']
};

/**
 * Construye una consulta optimizada con selección de campos específicos
 * @param {Object} supabase - Instancia de Supabase
 * @param {string} table - Nombre de la tabla
 * @param {string} fieldSet - Conjunto de campos ('minimal', 'profile', 'detailed')
 * @returns {Object} - Query builder de Supabase
 */
const buildOptimizedQuery = (supabase, table, fieldSet = 'profile') => {
  if (!QUERY_CONFIG.enableFieldSelection) {
    return supabase.from(table);
  }

  const fields = TABLE_FIELDS[table]?.[fieldSet] || TABLE_FIELDS[table]?.profile || ['*'];
  return supabase.from(table).select(fields.join(', '));
};

/**
 * Aplica paginación inteligente a una consulta
 * @param {Object} query - Query builder de Supabase
 * @param {Object} options - Opciones de paginación
 * @returns {Object} - Query con paginación aplicada
 */
const applyPagination = (query, options = {}) => {
  const {
    page = 1,
    pageSize = QUERY_CONFIG.defaultPageSize,
    enableCount = true
  } = options;

  // Validar y ajustar pageSize
  const safePageSize = Math.min(Math.max(pageSize, 1), QUERY_CONFIG.maxPageSize);
  const offset = (page - 1) * safePageSize;

  let paginatedQuery = query
    .range(offset, offset + safePageSize - 1);

  // Agregar conteo total si se solicita
  if (enableCount) {
    paginatedQuery = paginatedQuery.select('*', { count: 'exact' });
  }

  return paginatedQuery;
};

/**
 * Aplica ordenamiento optimizado basado en campos indexados
 * @param {Object} query - Query builder de Supabase
 * @param {string} table - Nombre de la tabla
 * @param {Array} orderBy - Configuración de ordenamiento
 * @returns {Object} - Query con ordenamiento aplicado
 */
const applyOptimizedOrdering = (query, table, orderBy = []) => {
  if (!QUERY_CONFIG.enableIndexHints || orderBy.length === 0) {
    return query;
  }

  // Para cada campo de ordenamiento, verificar si hay índices sugeridos
  const suggestedIndexes = SUGGESTED_INDEXES[table] || [];
  
  orderBy.forEach(order => {
    const { column, ascending = true } = order;
    
    // Priorizar campos que tienen índices sugeridos
    const hasIndex = suggestedIndexes.some(index => 
      index.includes(column) || index.includes(`idx_${table}_${column}`)
    );

    if (hasIndex) {
      query = query.order(column, { ascending });
    }
  });

  return query;
};

/**
 * Construye una consulta con joins optimizados
 * @param {Object} supabase - Instancia de Supabase
 * @param {string} primaryTable - Tabla principal
 * @param {Array} joins - Configuración de joins
 * @param {string} fieldSet - Conjunto de campos
 * @returns {Object} - Query con joins aplicados
 */
const buildOptimizedJoin = (supabase, primaryTable, joins = [], fieldSet = 'profile') => {
  if (!QUERY_CONFIG.enableQueryOptimization || joins.length === 0) {
    return buildOptimizedQuery(supabase, primaryTable, fieldSet);
  }

  const primaryFields = TABLE_FIELDS[primaryTable]?.[fieldSet] || ['*'];
  let selectFields = primaryFields.join(', ');

  // Agregar campos de las tablas relacionadas
  joins.forEach(join => {
    const { table, fields = 'minimal', foreignKey, localKey } = join;
    const relatedFields = TABLE_FIELDS[table]?.[fields] || ['id'];
    selectFields += `, ${table}(${relatedFields.join(', ')})`;
  });

  return supabase.from(primaryTable).select(selectFields);
};

/**
 * Optimiza consulta de deudas con relaciones complejas
 * @param {Object} supabase - Instancia de Supabase
 * @param {Object} filters - Filtros a aplicar
 * @param {Object} options - Opciones adicionales
 * @returns {Object} - Query optimizada
 */
const buildOptimizedDebtsQuery = (supabase, filters = {}, options = {}) => {
  const {
    companyId,
    userId,
    status,
    clientId,
    page = 1,
    pageSize = 20,
    includeUser = true,
    includeClient = true
  } = filters;

  let query = supabase.from('debts');

  // Selección de campos optimizada
  const fields = ['id', 'original_amount', 'current_amount', 'status', 'created_at', 'company_id'];
  
  if (includeUser) {
    fields.push('user:users(id, full_name, email, rut)');
  }
  
  if (includeClient) {
    fields.push('client:clients(id, business_name, contact_email, rut)');
  }

  query = query.select(fields.join(', '));

  // Aplicar filtros
  if (companyId) query = query.eq('company_id', companyId);
  if (userId) query = query.eq('user_id', userId);
  if (clientId) query = query.eq('client_id', clientId);
  if (status) query = query.eq('status', status);

  // Ordenamiento optimizado (usar índices)
  query = query.order('created_at', { ascending: false });

  // Paginación
  query = applyPagination(query, { page, pageSize, enableCount: true });

  return query;
};

/**
 * Optimiza consulta de analytics para dashboard
 * @param {Object} supabase - Instancia de Supabase
 * @param {string} companyId - ID de la empresa
 * @param {Object} options - Opciones de consulta
 * @returns {Promise<Object>} - Datos de analytics optimizados
 */
const getOptimizedAnalytics = async (supabase, companyId, options = {}) => {
  const { useAggregates = true, cacheResults = true } = options;

  if (useAggregates) {
    // Usar consultas agregadas para mejor rendimiento
    const [
      debtsResult,
      paymentsResult,
      clientsResult
    ] = await Promise.all([
      // Consulta agregada de deudas
      supabase
        .from('debts')
        .select('company_id, status, count(*)', { count: 'exact' })
        .eq('company_id', companyId),

      // Consulta agregada de pagos
      supabase
        .from('payments')
        .select('company_id, status, amount, count(*)', { count: 'exact' })
        .eq('company_id', companyId)
        .eq('status', 'completed'),

      // Consulta de clientes
      supabase
        .from('clients')
        .select('id, company_id', { count: 'exact' })
        .eq('company_id', companyId)
    ]);

    // Procesar resultados agregados
    const analytics = {
      totalDebts: debtsResult.data?.length || 0,
      totalPayments: paymentsResult.data?.length || 0,
      totalClients: clientsResult.count || 0,
      totalAmount: paymentsResult.data?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0,
      // Agregar más métricas calculadas
    };

    return { analytics, error: null };
  } else {
    // Consulta tradicional (más lenta pero más detallada)
    const [debtsResult, paymentsResult, clientsResult] = await Promise.all([
      supabase.from('debts').select('*').eq('company_id', companyId),
      supabase.from('payments').select('*').eq('company_id', companyId),
      supabase.from('clients').select('*').eq('company_id', companyId)
    ]);

    // Procesamiento tradicional
    const analytics = {
      totalDebts: debtsResult.data?.length || 0,
      totalPayments: paymentsResult.data?.length || 0,
      totalClients: clientsResult.data?.length || 0,
      totalAmount: paymentsResult.data?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0
    };

    return { analytics, error: null };
  }
};

/**
 * Genera sugerencias de índices para una tabla
 * @param {string} table - Nombre de la tabla
 * @param {Array} queries - Consultas frecuentes
 * @returns {Array} - Sugerencias de índices
 */
const generateIndexSuggestions = (table, queries = []) => {
  const suggestions = [];
  const existingIndexes = SUGGESTED_INDEXES[table] || [];

  // Analizar consultas para sugerir índices adicionales
  queries.forEach(query => {
    const { where, orderBy } = query;
    
    // Sugerir índices para campos WHERE
    if (where) {
      where.forEach(field => {
        const indexName = `idx_${table}_${field}`;
        if (!existingIndexes.includes(indexName)) {
          suggestions.push({
            table,
            index: indexName,
            fields: [field],
            reason: 'Frequent WHERE clause',
            query: `CREATE INDEX ${indexName} ON ${table}(${field});`
          });
        }
      });
    }

    // Sugerir índices para campos ORDER BY
    if (orderBy) {
      orderBy.forEach(order => {
        const { column } = order;
        const indexName = `idx_${table}_${column}_order`;
        if (!existingIndexes.includes(indexName)) {
          suggestions.push({
            table,
            index: indexName,
            fields: [column],
            reason: 'Frequent ORDER BY clause',
            query: `CREATE INDEX ${indexName} ON ${table}(${column});`
          });
        }
      });
    }
  });

  return suggestions;
};

/**
 * Analiza el rendimiento de una consulta
 * @param {Object} query - Query builder de Supabase
 * @param {string} queryName - Nombre descriptivo de la consulta
 * @returns {Promise<Object>} - Métricas de rendimiento
 */
const analyzeQueryPerformance = async (query, queryName) => {
  const startTime = performance.now();
  
  try {
    const { data, error, count } = await query;
    const endTime = performance.now();
    
    const metrics = {
      queryName,
      executionTime: endTime - startTime,
      resultCount: Array.isArray(data) ? data.length : (data ? 1 : 0),
      totalRecords: count || 0,
      success: !error,
      error: error?.message || null,
      timestamp: new Date().toISOString()
    };

    // Log de rendimiento para análisis
    if (metrics.executionTime > 1000) { // Consultas lentas (> 1s)
      console.warn(`🐌 Slow query detected: ${queryName}`, {
        executionTime: `${metrics.executionTime.toFixed(2)}ms`,
        resultCount: metrics.resultCount,
        totalRecords: metrics.totalRecords
      });
    }

    return { data, error, metrics };
  } catch (err) {
    const endTime = performance.now();
    
    return {
      data: null,
      error: err,
      metrics: {
        queryName,
        executionTime: endTime - startTime,
        resultCount: 0,
        totalRecords: 0,
        success: false,
        error: err.message,
        timestamp: new Date().toISOString()
      }
    };
  }
};

/**
 * Crea una consulta con manejo inteligente de errores
 * @param {Function} queryFunction - Función que ejecuta la consulta
 * @param {Object} options - Opciones de manejo de errores
 * @returns {Promise<Object>} - Resultado con manejo de errores
 */
const safeQuery = async (queryFunction, options = {}) => {
  const {
    retries = 2,
    retryDelay = 1000,
    fallbackData = null,
    onError = null
  } = options;

  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await queryFunction();
      return result;
    } catch (error) {
      lastError = error;
      
      if (onError) {
        onError(error, attempt);
      }

      if (attempt < retries) {
        console.warn(`Query attempt ${attempt} failed, retrying...`, error.message);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  // Todas las tentativas fallaron
  console.error(`Query failed after ${retries} attempts:`, lastError);
  
  return {
    data: fallbackData,
    error: lastError.message || 'Query failed after retries',
    fallbackUsed: true
  };
};

// Exportar funciones y configuración
export {
  QUERY_CONFIG,
  TABLE_FIELDS,
  SUGGESTED_INDEXES,
  buildOptimizedQuery,
  applyPagination,
  applyOptimizedOrdering,
  buildOptimizedJoin,
  buildOptimizedDebtsQuery,
  getOptimizedAnalytics,
  generateIndexSuggestions,
  analyzeQueryPerformance,
  safeQuery
};

export default {
  config: QUERY_CONFIG,
  tableFields: TABLE_FIELDS,
  suggestedIndexes: SUGGESTED_INDEXES,
  buildOptimizedQuery,
  applyPagination,
  applyOptimizedOrdering,
  buildOptimizedJoin,
  buildOptimizedDebtsQuery,
  getOptimizedAnalytics,
  generateIndexSuggestions,
  analyzeQueryPerformance,
  safeQuery
};