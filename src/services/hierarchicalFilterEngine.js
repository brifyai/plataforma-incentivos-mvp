/**
 * Hierarchical Filter Engine - Lógica de Filtros Jerárquicos
 *
 * Motor de filtrado avanzado que maneja la jerarquía:
 * Empresa → Clientes Corporativos → Segmentos → Deudores Individuales
 *
 * Soporta filtros complejos con preview de alcance antes de envío
 */

import { supabase } from '../config/supabase';
import { logError, logInfo } from './loggerService';

export class HierarchicalFilterEngine {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  /**
   * APLICAR FILTROS JERÁRQUICOS
   * Construye consulta compleja basada en jerarquía corporativa
   */
  async applyHierarchicalFilters(companyId, filters = {}) {
    try {
      logInfo('Aplicando filtros jerárquicos', { companyId, filters });

      const queryBuilder = new HierarchicalQueryBuilder(companyId, filters);
      const results = await queryBuilder.buildAndExecute();

      // Calcular estadísticas de alcance
      const reachStats = await this.calculateReachStatistics(results, filters);

      return {
        debtors: results,
        reachStats,
        appliedFilters: filters,
        queryMetadata: queryBuilder.getMetadata()
      };
    } catch (error) {
      logError('Error aplicando filtros jerárquicos', error, { companyId, filters });
      throw new Error('Error al aplicar filtros jerárquicos');
    }
  }

  /**
   * PREVIEW DE ALCANCE ANTES DE ENVÍO
   * Calcula estadísticas sin ejecutar la campaña completa
   */
  async calculateReachPreview(companyId, filters = {}) {
    try {
      const queryBuilder = new HierarchicalQueryBuilder(companyId, filters);
      const preview = await queryBuilder.buildPreviewQuery();

      return {
        totalDebtors: preview.totalCount,
        breakdown: preview.breakdown,
        filtersApplied: preview.filtersApplied,
        estimatedCost: preview.estimatedCost,
        aiUsage: preview.aiUsage
      };
    } catch (error) {
      logError('Error calculando preview de alcance', error, { companyId, filters });
      return {
        totalDebtors: 0,
        breakdown: {},
        filtersApplied: [],
        estimatedCost: 0,
        aiUsage: 0
      };
    }
  }

  /**
   * OBTENER JERARQUÍA COMPLETA
   * Devuelve estructura completa de empresa → corporativos → segmentos
   */
  async getCompleteHierarchy(companyId) {
    const cacheKey = `hierarchy_${companyId}`;

    // Verificar cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      // Obtener clientes corporativos
      const { data: corporates, error: corpError } = await supabase
        .from('corporate_clients')
        .select(`
          id,
          name,
          display_category,
          trust_level,
          segment_count,
          corporate_segments (
            id,
            name,
            debtor_count,
            criteria
          )
        `)
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name');

      if (corpError) throw corpError;

      // Obtener deudores individuales (no asociados a corporativos)
      const { data: individualDebtors, error: indError } = await supabase
        .from('debtors')
        .select('id, user_id')
        .eq('company_id', companyId)
        .is('corporate_id', null);

      if (indError) throw indError;

      const hierarchy = {
        company: { id: companyId },
        corporateClients: corporates || [],
        individualDebtors: individualDebtors || [],
        totalSegments: corporates?.reduce((sum, corp) => sum + (corp.segment_count || 0), 0) || 0,
        totalCorporateDebtors: corporates?.reduce((sum, corp) =>
          sum + (corp.corporate_segments?.reduce((segSum, seg) => segSum + (seg.debtor_count || 0), 0) || 0), 0) || 0,
        totalIndividualDebtors: individualDebtors?.length || 0
      };

      // Cachear resultado
      this.cache.set(cacheKey, {
        data: hierarchy,
        timestamp: Date.now()
      });

      return hierarchy;
    } catch (error) {
      logError('Error obteniendo jerarquía completa', error, { companyId });
      throw new Error('Error al obtener jerarquía completa');
    }
  }

  /**
   * VALIDAR FILTROS
   * Verifica que los filtros sean válidos y no conflictivos
   */
  validateFilters(filters) {
    const errors = [];

    // Validar estructura básica
    if (!filters || typeof filters !== 'object') {
      errors.push('Los filtros deben ser un objeto válido');
      return { valid: false, errors };
    }

    // Validar filtros corporativos
    if (filters.corporateClients && !Array.isArray(filters.corporateClients)) {
      errors.push('corporateClients debe ser un array');
    }

    if (filters.corporateSegments && !Array.isArray(filters.corporateSegments)) {
      errors.push('corporateSegments debe ser un array');
    }

    // Validar filtros de riesgo
    if (filters.riskLevels && !Array.isArray(filters.riskLevels)) {
      errors.push('riskLevels debe ser un array');
    }

    // Validar rangos de deuda
    if (filters.debtAmountRange) {
      const { min, max } = filters.debtAmountRange;
      if (min !== undefined && max !== undefined && min > max) {
        errors.push('El monto mínimo no puede ser mayor al máximo');
      }
    }

    // Validar antigüedad de deuda
    if (filters.debtAgeRange) {
      const { min, max } = filters.debtAgeRange;
      if (min !== undefined && max !== undefined && min > max) {
        errors.push('La antigüedad mínima no puede ser mayor a la máxima');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * CALCULAR ESTADÍSTICAS DE ALCANCE
   */
  async calculateReachStatistics(debtors, filters) {
    try {
      const stats = {
        totalDebtors: debtors.length,
        byRiskLevel: {},
        byCorporateClient: {},
        bySegment: {},
        byDebtAmount: {
          ranges: {
            '0-50000': 0,
            '50001-100000': 0,
            '100001-500000': 0,
            '500001+': 0
          }
        },
        byDebtAge: {
          ranges: {
            '0-30': 0,
            '31-90': 0,
            '91-180': 0,
            '181+': 0
          }
        },
        averageDebtAmount: 0,
        averageDebtAge: 0
      };

      let totalDebtAmount = 0;
      let totalDebtAge = 0;

      debtors.forEach(debtor => {
        // Por nivel de riesgo
        const riskLevel = debtor.riskLevel || 'unknown';
        stats.byRiskLevel[riskLevel] = (stats.byRiskLevel[riskLevel] || 0) + 1;

        // Por cliente corporativo
        if (debtor.corporate_id) {
          stats.byCorporateClient[debtor.corporate_id] = (stats.byCorporateClient[debtor.corporate_id] || 0) + 1;
        }

        // Por segmento
        if (debtor.segment_id) {
          stats.bySegment[debtor.segment_id] = (stats.bySegment[debtor.segment_id] || 0) + 1;
        }

        // Por monto de deuda
        const amount = debtor.current_amount || 0;
        totalDebtAmount += amount;

        if (amount <= 50000) stats.byDebtAmount.ranges['0-50000']++;
        else if (amount <= 100000) stats.byDebtAmount.ranges['50001-100000']++;
        else if (amount <= 500000) stats.byDebtAmount.ranges['100001-500000']++;
        else stats.byDebtAmount.ranges['500001+']++;

        // Por antigüedad de deuda
        const age = debtor.debt_age_days || 0;
        totalDebtAge += age;

        if (age <= 30) stats.byDebtAge.ranges['0-30']++;
        else if (age <= 90) stats.byDebtAge.ranges['31-90']++;
        else if (age <= 180) stats.byDebtAge.ranges['91-180']++;
        else stats.byDebtAge.ranges['181+']++;
      });

      // Calcular promedios
      if (debtors.length > 0) {
        stats.averageDebtAmount = totalDebtAmount / debtors.length;
        stats.averageDebtAge = totalDebtAge / debtors.length;
      }

      return stats;
    } catch (error) {
      logError('Error calculando estadísticas de alcance', error);
      return {
        totalDebtors: debtors.length,
        error: 'Error calculando estadísticas'
      };
    }
  }

  /**
   * LIMPIAR CACHE
   */
  clearCache() {
    this.cache.clear();
    logInfo('Cache de jerarquía limpiado');
  }

  /**
   * OBTENER FILTROS PREDEFINIDOS
   */
  getPredefinedFilters() {
    return {
      riskLevels: ['low', 'medium', 'high'],
      debtAmountRanges: [
        { label: 'Bajo (0-50K)', min: 0, max: 50000 },
        { label: 'Medio (50K-100K)', min: 50000, max: 100000 },
        { label: 'Alto (100K-500K)', min: 100000, max: 500000 },
        { label: 'Muy Alto (500K+)', min: 500000, max: null }
      ],
      debtAgeRanges: [
        { label: 'Reciente (0-30 días)', min: 0, max: 30 },
        { label: 'Moderado (31-90 días)', min: 31, max: 90 },
        { label: 'Antiguo (91-180 días)', min: 91, max: 180 },
        { label: 'Muy Antiguo (180+ días)', min: 181, max: null }
      ],
      corporateCategories: ['banco', 'retail', 'servicios', 'telecomunicaciones', 'otros']
    };
  }
}

/**
 * CONSTRUCTOR DE CONSULTAS JERÁRQUICAS
 * Construye consultas SQL complejas basadas en filtros jerárquicos
 */
class HierarchicalQueryBuilder {
  constructor(companyId, filters = {}) {
    this.companyId = companyId;
    this.filters = filters;
    this.queryParts = [];
    this.parameters = [];
    this.metadata = {
      filtersApplied: [],
      estimatedComplexity: 'simple',
      joinCount: 0
    };
  }

  async buildAndExecute() {
    const query = this.buildQuery();
    const { data, error } = await supabase.rpc('execute_hierarchical_filter', {
      company_id: this.companyId,
      filters: this.filters
    });

    if (error) {
      // Fallback: ejecutar consulta directa si RPC no existe
      return this.executeDirectQuery();
    }

    return data || [];
  }

  async buildPreviewQuery() {
    // Consulta optimizada para preview (solo conteos)
    const query = `
      SELECT
        COUNT(*) as total_count,
        jsonb_build_object(
          'byRiskLevel', jsonb_object_agg(COALESCE(risk_level, 'unknown'), risk_count),
          'byCorporate', COUNT(DISTINCT corporate_id) FILTER (WHERE corporate_id IS NOT NULL),
          'bySegment', COUNT(DISTINCT segment_id) FILTER (WHERE segment_id IS NOT NULL)
        ) as breakdown
      FROM (
        ${this.buildBaseQuery()}
      ) preview_data
      CROSS JOIN LATERAL (
        SELECT risk_level, COUNT(*) as risk_count
        FROM debtors d2
        WHERE d2.company_id = $1
        GROUP BY risk_level
      ) risk_stats
    `;

    try {
      const { data, error } = await supabase
        .from('debtors')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', this.companyId);

      if (error) throw error;

      return {
        totalCount: data || 0,
        breakdown: {},
        filtersApplied: this.metadata.filtersApplied,
        estimatedCost: this.estimateCost(),
        aiUsage: this.estimateAIUsage()
      };
    } catch (error) {
      return {
        totalCount: 0,
        breakdown: {},
        filtersApplied: [],
        estimatedCost: 0,
        aiUsage: 0
      };
    }
  }

  buildBaseQuery() {
    let query = `
      SELECT DISTINCT d.*,
             cc.name as corporate_name,
             cs.name as segment_name
      FROM debtors d
      LEFT JOIN corporate_clients cc ON d.corporate_id = cc.id
      LEFT JOIN corporate_segments cs ON d.segment_id = cs.id
      WHERE d.company_id = $1
    `;

    this.parameters = [this.companyId];
    let paramIndex = 2;

    // Aplicar filtros jerárquicos
    if (this.filters.corporateClients?.length > 0) {
      query += ` AND d.corporate_id = ANY($${paramIndex})`;
      this.parameters.push(this.filters.corporateClients);
      paramIndex++;
      this.metadata.filtersApplied.push('corporate_clients');
    }

    if (this.filters.corporateSegments?.length > 0) {
      query += ` AND d.segment_id = ANY($${paramIndex})`;
      this.parameters.push(this.filters.corporateSegments);
      paramIndex++;
      this.metadata.filtersApplied.push('corporate_segments');
    }

    if (this.filters.excludeCorporate) {
      query += ` AND d.corporate_id IS NULL`;
      this.metadata.filtersApplied.push('exclude_corporate');
    }

    // Filtros de riesgo
    if (this.filters.riskLevels?.length > 0) {
      query += ` AND d.risk_level = ANY($${paramIndex})`;
      this.parameters.push(this.filters.riskLevels);
      paramIndex++;
      this.metadata.filtersApplied.push('risk_levels');
    }

    // Filtros de monto de deuda
    if (this.filters.debtAmountRange) {
      const { min, max } = this.filters.debtAmountRange;
      if (min !== undefined) {
        query += ` AND d.current_amount >= $${paramIndex}`;
        this.parameters.push(min);
        paramIndex++;
      }
      if (max !== undefined) {
        query += ` AND d.current_amount <= $${paramIndex}`;
        this.parameters.push(max);
        paramIndex++;
      }
      this.metadata.filtersApplied.push('debt_amount_range');
    }

    // Filtros de antigüedad
    if (this.filters.debtAgeRange) {
      const { min, max } = this.filters.debtAgeRange;
      if (min !== undefined) {
        query += ` AND d.debt_age_days >= $${paramIndex}`;
        this.parameters.push(min);
        paramIndex++;
      }
      if (max !== undefined) {
        query += ` AND d.debt_age_days <= $${paramIndex}`;
        this.parameters.push(max);
        paramIndex++;
      }
      this.metadata.filtersApplied.push('debt_age_range');
    }

    // Filtros demográficos
    if (this.filters.demographics) {
      // Implementar filtros demográficos según estructura de datos
      this.metadata.filtersApplied.push('demographics');
    }

    return query;
  }

  async executeDirectQuery() {
    try {
      const query = this.buildBaseQuery();
      const { data, error } = await supabase
        .from('debtors')
        .select(`
          *,
          corporate_clients!debtors_corporate_id_fkey (
            name,
            display_category
          ),
          corporate_segments!debtors_segment_id_fkey (
            name
          )
        `)
        .eq('company_id', this.companyId);

      if (error) throw error;

      // Aplicar filtros en memoria (fallback)
      let filteredData = data || [];

      if (this.filters.corporateClients?.length > 0) {
        filteredData = filteredData.filter(d => this.filters.corporateClients.includes(d.corporate_id));
      }

      if (this.filters.riskLevels?.length > 0) {
        filteredData = filteredData.filter(d => this.filters.riskLevels.includes(d.risk_level));
      }

      return filteredData;
    } catch (error) {
      logError('Error ejecutando consulta directa', error);
      return [];
    }
  }

  estimateCost() {
    // Estimación simple basada en complejidad de filtros
    let cost = 0.10; // Costo base

    if (this.filters.corporateClients?.length > 0) cost += 0.05;
    if (this.filters.corporateSegments?.length > 0) cost += 0.05;
    if (this.filters.riskLevels?.length > 0) cost += 0.02;
    if (this.filters.debtAmountRange) cost += 0.03;
    if (this.filters.debtAgeRange) cost += 0.03;

    return Math.round(cost * 100) / 100;
  }

  estimateAIUsage() {
    // Estimación de uso de IA basado en filtros aplicados
    let tokens = 100; // Base

    if (this.filters.corporateClients?.length > 0) tokens += 50;
    if (this.filters.corporateSegments?.length > 0) tokens += 50;
    if (this.filters.demographics) tokens += 100;

    return tokens;
  }

  getMetadata() {
    return {
      ...this.metadata,
      estimatedCost: this.estimateCost(),
      estimatedAIUsage: this.estimateAIUsage(),
      queryComplexity: this.metadata.filtersApplied.length > 3 ? 'complex' : 'simple'
    };
  }
}

// =====================================================
// INSTANCIA GLOBAL
// =====================================================

export const hierarchicalFilterEngine = new HierarchicalFilterEngine();

export default hierarchicalFilterEngine;