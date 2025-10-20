/**
 * CRM Matching Service
 *
 * Servicio inteligente para emparejar contactos del CRM con usuarios registrados
 * Utiliza algoritmos de matching con múltiples criterios y pesos configurables
 *
 * @module CRMMatchingService
 */

import { supabase } from '../config/supabase';

// Configuración de criterios de matching
const MATCHING_CRITERIA = {
  rut: { weight: 100, exact: true, description: 'RUT exacto' },
  email: { weight: 80, fuzzy: true, normalize: true, description: 'Email con tolerancia' },
  phone: { weight: 70, normalize: true, description: 'Teléfono normalizado' },
  full_name: { weight: 50, levenshtein: 0.8, normalize: true, description: 'Nombre con distancia Levenshtein' },
  address: { weight: 30, contains: true, normalize: true, description: 'Dirección parcial' }
};

// Umbrales de confianza para matching automático
const CONFIDENCE_THRESHOLDS = {
  EXCELLENT: 95,  // Matching automático sin revisión
  GOOD: 80,       // Revisión opcional
  FAIR: 60,       // Revisión manual requerida
  POOR: 30        // Matching rechazado
};

class CRMMatchingService {
  constructor() {
    this.matchingHistory = new Map();
  }

  /**
   * Normaliza texto para comparación
   */
  normalizeText(text, options = {}) {
    if (!text) return '';

    let normalized = text.toString().toLowerCase().trim();

    // Remover caracteres especiales
    normalized = normalized.replace(/[^a-z0-9\s]/g, ' ');

    // Normalizar espacios
    normalized = normalized.replace(/\s+/g, ' ').trim();

    // Normalizar teléfono si es necesario
    if (options.phone) {
      normalized = normalized.replace(/[^\d]/g, '');
      // Mantener solo los últimos 8 dígitos para Chile
      if (normalized.length > 8) {
        normalized = normalized.slice(-8);
      }
    }

    // Normalizar email
    if (options.email) {
      normalized = normalized.replace(/\s/g, '').toLowerCase();
    }

    return normalized;
  }

  /**
   * Calcula distancia de Levenshtein entre dos strings
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2;
    if (len2 === 0) return len1;

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // eliminación
          matrix[i][j - 1] + 1,      // inserción
          matrix[i - 1][j - 1] + cost // sustitución
        );
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Calcula similitud entre dos strings usando distancia de Levenshtein
   */
  calculateSimilarity(str1, str2, threshold = 0.8) {
    if (!str1 || !str2) return 0;

    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);

    if (maxLength === 0) return 1;

    const similarity = 1 - (distance / maxLength);
    return similarity >= threshold ? similarity : 0;
  }

  /**
   * Evalúa un criterio de matching específico
   */
  evaluateCriterion(crmValue, userValue, criterion) {
    if (!crmValue || !userValue) return { score: 0, matched: false };

    const normalizedCRM = this.normalizeText(crmValue, criterion);
    const normalizedUser = this.normalizeText(userValue, criterion);

    let score = 0;
    let matched = false;

    // Matching exacto
    if (criterion.exact) {
      matched = normalizedCRM === normalizedUser;
      score = matched ? criterion.weight : 0;
    }
    // Matching difuso con Levenshtein
    else if (criterion.levenshtein) {
      const similarity = this.calculateSimilarity(normalizedCRM, normalizedUser, criterion.levenshtein);
      if (similarity > 0) {
        score = criterion.weight * similarity;
        matched = similarity >= criterion.levenshtein;
      }
    }
    // Matching contiene
    else if (criterion.contains) {
      matched = normalizedCRM.includes(normalizedUser) || normalizedUser.includes(normalizedCRM);
      score = matched ? criterion.weight : 0;
    }
    // Matching normalizado
    else if (criterion.normalize) {
      matched = normalizedCRM === normalizedUser;
      score = matched ? criterion.weight : 0;
    }

    return { score, matched, criterion: criterion.description };
  }

  /**
   * Encuentra matches potenciales para un contacto del CRM
   */
  async findPotentialMatches(crmContact, companyId, options = {}) {
    const { limit = 10, minScore = 10 } = options;

    try {
      // Buscar usuarios que podrían coincidir
      let query = supabase
        .from('users')
        .select('id, email, full_name, rut, phone, created_at')
        .eq('role', 'debtor')
        .limit(limit * 2); // Buscar más para filtrar después

      // Si tenemos criterios específicos, filtrar primero
      if (crmContact.rut) {
        query = query.or(`rut.eq.${crmContact.rut}`);
      }
      if (crmContact.email) {
        query = query.or(`email.eq.${crmContact.email}`);
      }

      const { data: potentialUsers, error } = await query;

      if (error) throw error;

      const matches = [];

      // Evaluar cada usuario potencial
      for (const user of potentialUsers || []) {
        const matchResult = this.evaluateMatch(crmContact, user);
        matchResult.user = user;

        if (matchResult.totalScore >= minScore) {
          matches.push(matchResult);
        }
      }

      // Ordenar por score descendente
      matches.sort((a, b) => b.totalScore - a.totalScore);

      return {
        success: true,
        crmContact,
        matches: matches.slice(0, limit),
        totalPotential: potentialUsers?.length || 0
      };

    } catch (error) {
      console.error('Error finding potential matches:', error);
      return {
        success: false,
        error: error.message,
        crmContact,
        matches: []
      };
    }
  }

  /**
   * Evalúa el matching completo entre contacto CRM y usuario
   */
  evaluateMatch(crmContact, user) {
    const results = {
      totalScore: 0,
      maxPossibleScore: 0,
      confidence: 0,
      criteria: {},
      matchedCriteria: [],
      recommendations: []
    };

    // Evaluar cada criterio
    Object.entries(MATCHING_CRITERIA).forEach(([key, criterion]) => {
      const crmValue = crmContact[key];
      const userValue = user[key];

      const evaluation = this.evaluateCriterion(crmValue, userValue, criterion);

      results.criteria[key] = evaluation;
      results.maxPossibleScore += criterion.weight;

      if (evaluation.matched) {
        results.totalScore += evaluation.score;
        results.matchedCriteria.push(key);
      }
    });

    // Calcular confianza
    if (results.maxPossibleScore > 0) {
      results.confidence = (results.totalScore / results.maxPossibleScore) * 100;
    }

    // Generar recomendaciones
    results.recommendations = this.generateRecommendations(results);

    return results;
  }

  /**
   * Genera recomendaciones basadas en el resultado del matching
   */
  generateRecommendations(matchResult) {
    const recommendations = [];

    const { confidence, matchedCriteria, criteria } = matchResult;

    if (confidence >= CONFIDENCE_THRESHOLDS.EXCELLENT) {
      recommendations.push({
        type: 'auto_match',
        priority: 'high',
        message: 'Matching excelente - se puede asignar automáticamente'
      });
    } else if (confidence >= CONFIDENCE_THRESHOLDS.GOOD) {
      recommendations.push({
        type: 'review_optional',
        priority: 'medium',
        message: 'Matching bueno - revisión opcional recomendada'
      });
    } else if (confidence >= CONFIDENCE_THRESHOLDS.FAIR) {
      recommendations.push({
        type: 'manual_review',
        priority: 'medium',
        message: 'Matching regular - revisión manual requerida'
      });
    } else {
      recommendations.push({
        type: 'no_match',
        priority: 'low',
        message: 'Matching pobre - probablemente no es el mismo usuario'
      });
    }

    // Recomendaciones específicas por criterio faltante
    const missingCriteria = Object.keys(MATCHING_CRITERIA).filter(
      key => !matchedCriteria.includes(key) && criteria[key]
    );

    if (missingCriteria.includes('rut')) {
      recommendations.push({
        type: 'data_enrichment',
        priority: 'high',
        message: 'Falta RUT - solicitar actualización de datos'
      });
    }

    if (missingCriteria.includes('email')) {
      recommendations.push({
        type: 'data_enrichment',
        priority: 'medium',
        message: 'Falta email - puede mejorar precisión del matching'
      });
    }

    return recommendations;
  }

  /**
   * Procesa un lote de contactos del CRM
   */
  async processCRMBatch(contacts, companyId, options = {}) {
    const results = {
      processed: 0,
      matched: 0,
      autoAssigned: 0,
      needsReview: 0,
      rejected: 0,
      errors: [],
      matches: []
    };

    console.log(`🔄 Procesando ${contacts.length} contactos del CRM...`);

    for (const contact of contacts) {
      try {
        results.processed++;

        const matchResult = await this.findPotentialMatches(contact, companyId, options);

        if (matchResult.success && matchResult.matches.length > 0) {
          const bestMatch = matchResult.matches[0];

          results.matches.push({
            crmContact: contact,
            bestMatch,
            allMatches: matchResult.matches
          });

          results.matched++;

          // Decidir acción basada en confianza
          if (bestMatch.confidence >= CONFIDENCE_THRESHOLDS.EXCELLENT) {
            // Asignar automáticamente
            await this.autoAssignDebt(contact, bestMatch.user, companyId);
            results.autoAssigned++;
          } else if (bestMatch.confidence >= CONFIDENCE_THRESHOLDS.FAIR) {
            // Marcar para revisión
            await this.markForReview(contact, bestMatch, companyId);
            results.needsReview++;
          } else {
            // Rechazar matching
            results.rejected++;
          }
        } else {
          results.rejected++;
        }

        // Progreso cada 10 contactos
        if (results.processed % 10 === 0) {
          console.log(`📊 Progreso: ${results.processed}/${contacts.length} procesados`);
        }

      } catch (error) {
        console.error(`❌ Error procesando contacto ${contact.id || results.processed}:`, error);
        results.errors.push({
          contact,
          error: error.message
        });
      }
    }

    console.log(`✅ Procesamiento completado:`, results);
    return results;
  }

  /**
   * Asigna deuda automáticamente cuando hay matching de alta confianza
   */
  async autoAssignDebt(crmContact, user, companyId) {
    try {
      console.log(`✅ Asignando deuda automáticamente: ${crmContact.full_name} → ${user.full_name}`);

      // Crear la deuda en el sistema
      const debtData = {
        user_id: user.id,
        company_id: companyId,
        amount: crmContact.amount || crmContact.debt_amount || 0,
        description: crmContact.description || `Deuda importada desde CRM - ${crmContact.full_name}`,
        due_date: crmContact.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días por defecto
        status: 'pending',
        priority: crmContact.priority || 'medium',
        created_from_crm: true,
        crm_contact_id: crmContact.id,
        crm_source: crmContact.source || 'crm_import',
        metadata: {
          crm_matching_confidence: 100,
          crm_matching_criteria: ['high_confidence_match'],
          original_crm_data: crmContact
        }
      };

      // Insertar deuda en la base de datos
      const { data: debt, error: debtError } = await supabase
        .from('debts')
        .insert(debtData)
        .select()
        .single();

      if (debtError) {
        console.error('Error creating debt:', debtError);
        throw new Error(`Error al crear deuda: ${debtError.message}`);
      }

      console.log(`✅ Deuda creada exitosamente: ID ${debt.id} por $${debt.amount}`);

      // Crear acuerdo inicial si es necesario
      if (crmContact.agreement_terms) {
        const agreementData = {
          debt_id: debt.id,
          user_id: user.id,
          company_id: companyId,
          terms: crmContact.agreement_terms,
          status: 'proposed',
          proposed_amount: crmContact.amount || crmContact.debt_amount || 0,
          proposed_installments: crmContact.installments || 1,
          proposed_interest_rate: crmContact.interest_rate || 0,
          created_from_crm: true
        };

        const { data: agreement, error: agreementError } = await supabase
          .from('agreements')
          .insert(agreementData)
          .select()
          .single();

        if (agreementError) {
          console.warn('Error creating agreement:', agreementError);
          // No fallar el proceso por error en acuerdo
        } else {
          console.log(`✅ Acuerdo inicial creado: ID ${agreement.id}`);
        }
      }

      // Registrar en historial de matching
      await this.logMatchingDecision({
        crmContactId: crmContact.id,
        userId: user.id,
        decision: 'auto_assigned',
        confidence: 100,
        criteria: ['high_confidence_match'],
        debt_id: debt.id,
        amount_assigned: debt.amount
      });

      return {
        success: true,
        debt: debt,
        message: `Deuda asignada automáticamente por $${debt.amount}`
      };

    } catch (error) {
      console.error('Error auto-assigning debt:', error);
      throw error;
    }
  }

  /**
   * Marca matching para revisión manual
   */
  async markForReview(crmContact, matchResult, companyId) {
    try {
      console.log(`⚠️ Matching marcado para revisión: ${crmContact.full_name}`);

      // Registrar para revisión manual
      await this.logMatchingDecision({
        crmContactId: crmContact.id,
        userId: matchResult.user.id,
        decision: 'needs_review',
        confidence: matchResult.confidence,
        criteria: matchResult.matchedCriteria
      });

    } catch (error) {
      console.error('Error marking for review:', error);
      throw error;
    }
  }

  /**
   * Registra decisiones de matching en el historial
   */
  async logMatchingDecision(decision) {
    try {
      const { error } = await supabase
        .from('crm_matching_history')
        .insert({
          ...decision,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging matching decision:', error);
      // No fallar el proceso por error de logging
    }
  }

  /**
   * Obtiene estadísticas de matching
   */
  async getMatchingStats(companyId, period = 'month') {
    try {
      const startDate = new Date();
      if (period === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (period === 'year') {
        startDate.setFullYear(startDate.getFullYear() - 1);
      }

      const { data, error } = await supabase
        .from('crm_matching_history')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const stats = {
        total: data.length,
        autoAssigned: data.filter(d => d.decision === 'auto_assigned').length,
        needsReview: data.filter(d => d.decision === 'needs_review').length,
        rejected: data.filter(d => d.decision === 'rejected').length,
        averageConfidence: data.reduce((sum, d) => sum + d.confidence, 0) / data.length || 0,
        period,
        startDate: startDate.toISOString(),

        // Estadísticas adicionales
        successRate: data.length > 0 ? (data.filter(d => d.decision === 'auto_assigned').length / data.length) * 100 : 0,
        manualReviewRate: data.length > 0 ? (data.filter(d => d.decision === 'needs_review').length / data.length) * 100 : 0,
        rejectionRate: data.length > 0 ? (data.filter(d => d.decision === 'rejected').length / data.length) * 100 : 0,

        // Monto total asignado
        totalAmountAssigned: data
          .filter(d => d.amount_assigned)
          .reduce((sum, d) => sum + (d.amount_assigned || 0), 0),

        // Criterios más usados
        topCriteria: this.getTopMatchingCriteria(data)
      };

      return { success: true, stats };
    } catch (error) {
      console.error('Error getting matching stats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene los criterios de matching más utilizados
   */
  getTopMatchingCriteria(historyData) {
    const criteriaCount = {};

    historyData.forEach(record => {
      if (record.criteria && Array.isArray(record.criteria)) {
        record.criteria.forEach(criterion => {
          criteriaCount[criterion] = (criteriaCount[criterion] || 0) + 1;
        });
      }
    });

    return Object.entries(criteriaCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([criterion, count]) => ({ criterion, count }));
  }

  /**
   * Valida y normaliza datos de contacto del CRM
   */
  validateCRMContact(contact) {
    const errors = [];
    const warnings = [];

    // Validaciones requeridas
    if (!contact.full_name || contact.full_name.trim().length < 2) {
      errors.push('Nombre completo es requerido y debe tener al menos 2 caracteres');
    }

    // Al menos un identificador único
    const hasIdentifier = contact.rut || contact.email || contact.phone;
    if (!hasIdentifier) {
      errors.push('Se requiere al menos un identificador único: RUT, email o teléfono');
    }

    // Validar RUT si existe
    if (contact.rut && !this.isValidRut(contact.rut)) {
      errors.push('RUT tiene formato inválido');
    }

    // Validar email si existe
    if (contact.email && !this.isValidEmail(contact.email)) {
      errors.push('Email tiene formato inválido');
    }

    // Validar teléfono si existe
    if (contact.phone && !this.isValidPhone(contact.phone)) {
      warnings.push('Teléfono puede tener formato inválido');
    }

    // Validar monto si existe
    if (contact.amount && (isNaN(contact.amount) || contact.amount <= 0)) {
      errors.push('Monto debe ser un número positivo');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Valida formato de RUT chileno
   */
  isValidRut(rut) {
    // Implementación básica de validación de RUT
    const rutClean = rut.replace(/[^0-9kK]/g, '');
    if (rutClean.length < 8 || rutClean.length > 9) return false;

    const body = rutClean.slice(0, -1);
    const dv = rutClean.slice(-1).toLowerCase();

    let sum = 0;
    let multiplier = 2;

    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const expectedDv = 11 - (sum % 11);
    const calculatedDv = expectedDv === 11 ? '0' : expectedDv === 10 ? 'k' : expectedDv.toString();

    return calculatedDv === dv;
  }

  /**
   * Valida formato de email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida formato de teléfono chileno
   */
  isValidPhone(phone) {
    const phoneRegex = /^(\+?56)?[9][0-9]{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Procesa importación desde diferentes formatos de CRM
   */
  async importFromCRMFile(file, companyId, crmType = 'generic') {
    try {
      const fileContent = await this.readFileContent(file);
      let contacts = [];

      switch (crmType.toLowerCase()) {
        case 'excel':
        case 'xlsx':
          contacts = await this.parseExcelFile(fileContent);
          break;
        case 'csv':
          contacts = await this.parseCSVFile(fileContent);
          break;
        case 'json':
          contacts = JSON.parse(fileContent);
          break;
        default:
          // Intentar detectar formato automáticamente
          if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            contacts = await this.parseExcelFile(fileContent);
          } else if (file.name.endsWith('.csv')) {
            contacts = await this.parseCSVFile(fileContent);
          } else {
            throw new Error('Formato de archivo no soportado');
          }
      }

      // Validar y procesar contactos
      const validContacts = [];
      const invalidContacts = [];

      contacts.forEach((contact, index) => {
        const validation = this.validateCRMContact(contact);
        if (validation.isValid) {
          validContacts.push({
            ...contact,
            source: crmType,
            import_batch: Date.now(),
            original_index: index
          });
        } else {
          invalidContacts.push({
            contact,
            errors: validation.errors,
            warnings: validation.warnings,
            index
          });
        }
      });

      // Procesar contactos válidos
      const results = await this.processCRMBatch(validContacts, companyId);

      return {
        success: true,
        totalContacts: contacts.length,
        validContacts: validContacts.length,
        invalidContacts: invalidContacts.length,
        processed: results,
        errors: invalidContacts
      };

    } catch (error) {
      console.error('Error importing from CRM file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Lee contenido de archivo
   */
  async readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Error leyendo archivo'));
      reader.readAsText(file);
    });
  }

  /**
   * Parsea archivo Excel (simplificado)
   */
  async parseExcelFile(content) {
    // Implementación básica - en producción usar biblioteca como xlsx
    console.warn('Parseo Excel no implementado completamente');
    return [];
  }

  /**
   * Parsea archivo CSV
   */
  async parseCSVFile(content) {
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    const contacts = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = lines[i].split(',');
      const contact = {};

      headers.forEach((header, index) => {
        let value = values[index]?.trim() || '';

        // Mapear headers comunes
        switch (header) {
          case 'nombre':
          case 'name':
          case 'full_name':
            contact.full_name = value;
            break;
          case 'rut':
          case 'dni':
          case 'id':
            contact.rut = value;
            break;
          case 'email':
          case 'correo':
            contact.email = value;
            break;
          case 'telefono':
          case 'phone':
          case 'teléfono':
            contact.phone = value;
            break;
          case 'monto':
          case 'amount':
          case 'deuda':
            contact.amount = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
            break;
          case 'descripcion':
          case 'description':
            contact.description = value;
            break;
          default:
            contact[header] = value;
        }
      });

      contacts.push(contact);
    }

    return contacts;
  }
}

// Exportar instancia única
const crmMatchingService = new CRMMatchingService();
export default crmMatchingService;