/**
 * Debtor Matching Service
 * 
 * Servicio para realizar matching automático entre deudores y clientes corporativos
 * basado en nombre, email y RUT
 */

import { supabase } from '../config/supabase';

class DebtorMatchingService {
  constructor() {
    this.supabase = supabase;
    this.MATCH_THRESHOLD = 0.7; // 70% de similitud mínima
  }

  /**
   * Normaliza un RUT chileno
   * @param {string} rut - RUT a normalizar
   * @returns {string} RUT normalizado
   */
  normalizeRUT(rut) {
    if (!rut) return '';
    return rut
      .replace(/[.\s-]/g, '')
      .toUpperCase();
  }

  /**
   * Calcula similitud entre dos nombres usando distancia de Levenshtein
   * @param {string} name1 - Primer nombre
   * @param {string} name2 - Segundo nombre
   * @returns {number} Similitud (0-1)
   */
  calculateNameSimilarity(name1, name2) {
    if (!name1 || !name2) return 0;

    const normalizeName = (name) => {
      return name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ');
    };

    const normalized1 = normalizeName(name1);
    const normalized2 = normalizeName(name2);

    if (normalized1 === normalized2) return 1.0;

    const distance = this.levenshteinDistance(normalized1, normalized2);
    const maxLength = Math.max(normalized1.length, normalized2.length);
    
    const similarity = maxLength > 0 ? (maxLength - distance) / maxLength : 0;

    const words1 = normalized1.split(' ');
    const words2 = normalized2.split(' ');
    const commonWords = words1.filter(word => words2.includes(word));
    const wordBonus = commonWords.length / Math.max(words1.length, words2.length);

    return Math.min(similarity + (wordBonus * 0.2), 1.0);
  }

  /**
   * Calcula distancia de Levenshtein
   * @param {string} str1 
   * @param {string} str2 
   * @returns {number}
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Obtiene todos los clientes corporativos activos
   * @returns {Promise<Array>}
   */
  async getActiveCorporateClients() {
    try {
      const { data, error } = await this.supabase
        .from('corporate_clients')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('❌ Error obteniendo clientes corporativos:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error en getActiveCorporateClients:', error);
      return [];
    }
  }

  /**
   * Busca matches para un deudor específico
   * @param {Object} debtor - Datos del deudor
   * @returns {Promise<Array>} - Array de matches encontrados
   */
  async findMatchesForDebtor(debtor) {
    try {
      const corporateClients = await this.getActiveCorporateClients();
      
      if (corporateClients.length === 0) {
        return [];
      }

      const matches = [];

      for (const corporate of corporateClients) {
        const matchScore = this.calculateMatchScore(debtor, corporate);
        
        if (matchScore >= this.MATCH_THRESHOLD) {
          matches.push({
            corporateId: corporate.id,
            corporateName: corporate.name,
            matchScore,
            matchDetails: this.getMatchDetails(debtor, corporate),
            matchType: this.getMatchType(matchScore)
          });
        }
      }

      // Ordenar por score descendente
      return matches.sort((a, b) => b.matchScore - a.matchScore);

    } catch (error) {
      console.error('❌ Error buscando matches:', error);
      return [];
    }
  }

  /**
   * Calcula el score de matching entre un deudor y un cliente corporativo
   * @param {Object} debtor 
   * @param {Object} corporate 
   * @returns {number} Score de matching (0-1)
   */
  calculateMatchScore(debtor, corporate) {
    let score = 0;
    let weights = 0;

    // Matching por nombre (peso: 40%)
    if (debtor.full_name && corporate.name) {
      const nameSimilarity = this.calculateNameSimilarity(debtor.full_name, corporate.name);
      score += nameSimilarity * 0.4;
      weights += 0.4;
    }

    // Matching por email exacto (peso: 35%)
    if (debtor.email && corporate.contact_email) {
      const emailMatch = debtor.email.toLowerCase() === corporate.contact_email.toLowerCase() ? 1 : 0;
      score += emailMatch * 0.35;
      weights += 0.35;
    }

    // Matching por dominio de email (peso: 15%)
    if (debtor.email && corporate.contact_email) {
      const debtorDomain = debtor.email.split('@')[1]?.toLowerCase();
      const corporateDomain = corporate.contact_email.split('@')[1]?.toLowerCase();
      
      if (debtorDomain && corporateDomain) {
        const domainMatch = debtorDomain === corporateDomain ? 1 : 0;
        score += domainMatch * 0.15;
        weights += 0.15;
      }
    }

    // Matching por RUT (peso: 10%)
    if (debtor.rut && corporate.rut) {
      const debtorRut = this.normalizeRUT(debtor.rut);
      const corporateRut = this.normalizeRUT(corporate.rut);
      const rutMatch = debtorRut === corporateRut ? 1 : 0;
      score += rutMatch * 0.1;
      weights += 0.1;
    }

    return weights > 0 ? score / weights : 0;
  }

  /**
   * Obtiene detalles del matching
   * @param {Object} debtor 
   * @param {Object} corporate 
   * @returns {Object}
   */
  getMatchDetails(debtor, corporate) {
    const details = {};

    if (debtor.full_name && corporate.name) {
      details.nameMatch = this.calculateNameSimilarity(debtor.full_name, corporate.name);
    }

    if (debtor.email && corporate.contact_email) {
      details.emailMatch = debtor.email.toLowerCase() === corporate.contact_email.toLowerCase() ? 1 : 0;
      
      const debtorDomain = debtor.email.split('@')[1]?.toLowerCase();
      const corporateDomain = corporate.contact_email.split('@')[1]?.toLowerCase();
      
      if (debtorDomain && corporateDomain) {
        details.domainMatch = debtorDomain === corporateDomain ? 1 : 0;
      }
    }

    if (debtor.rut && corporate.rut) {
      const debtorRut = this.normalizeRUT(debtor.rut);
      const corporateRut = this.normalizeRUT(corporate.rut);
      details.rutMatch = debtorRut === corporateRut ? 1 : 0;
    }

    return details;
  }

  /**
   * Determina el tipo de matching basado en el score
   * @param {number} score 
   * @returns {string}
   */
  getMatchType(score) {
    if (score >= 0.9) return 'perfect';
    if (score >= 0.8) return 'high';
    if (score >= 0.7) return 'medium';
    return 'low';
  }

  /**
   * Guarda los matches en la base de datos
   * @param {string} debtorId 
   * @param {Array} matches 
   * @returns {Promise<boolean>}
   */
  async saveMatches(debtorId, matches) {
    try {
      // Primero eliminar matches existentes para este deudor
      await this.supabase
        .from('debtor_corporate_matches')
        .delete()
        .eq('debtor_id', debtorId);

      // Insertar nuevos matches
      if (matches.length > 0) {
        const matchesToInsert = matches.map(match => ({
          debtor_id: debtorId,
          corporate_client_id: match.corporateId,
          match_score: match.matchScore,
          match_details: match.matchDetails,
          match_type: match.matchType,
          status: 'active',
          created_at: new Date().toISOString()
        }));

        const { error } = await this.supabase
          .from('debtor_corporate_matches')
          .insert(matchesToInsert);

        if (error) {
          console.error('❌ Error guardando matches:', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Error en saveMatches:', error);
      return false;
    }
  }

  /**
   * Realiza el matching completo para un deudor
   * @param {Object} debtor - Datos del deudor
   * @returns {Promise<Object>} - Resultado del matching
   */
  async processDebtorMatching(debtor) {
    try {
      console.log(`🔍 Analizando matches para: ${debtor.full_name} (${debtor.rut})`);

      const matches = await this.findMatchesForDebtor(debtor);

      if (matches.length > 0) {
        console.log(`✅ Encontrados ${matches.length} matches para ${debtor.full_name}`);
        
        const saved = await this.saveMatches(debtor.id, matches);
        
        return {
          debtor,
          matchesFound: matches.length,
          matches,
          saved
        };
      } else {
        console.log(`❌ No se encontraron matches para ${debtor.full_name}`);
        
        return {
          debtor,
          matchesFound: 0,
          matches: [],
          message: 'No se encontraron matches'
        };
      }

    } catch (error) {
      console.error('❌ Error procesando matching:', error);
      return {
        debtor,
        matchesFound: 0,
        matches: [],
        error: error.message
      };
    }
  }

  /**
   * Realiza matching automático después del registro de un deudor
   * @param {Object} debtorData - Datos del deudor registrado
   * @returns {Promise<Object>} - Resultado del matching
   */
  async autoMatchAfterRegistration(debtorData) {
    try {
      // Esperar un momento para asegurar que el usuario esté en la base de datos
      await new Promise(resolve => setTimeout(resolve, 1000));

      const result = await this.processDebtorMatching(debtorData);
      
      if (result.matchesFound > 0) {
        console.log(`🎉 Matching automático exitoso para ${debtorData.full_name}: ${result.matchesFound} matches encontrados`);
      }

      return result;

    } catch (error) {
      console.error('❌ Error en matching automático:', error);
      return {
        debtor: debtorData,
        matchesFound: 0,
        matches: [],
        error: error.message
      };
    }
  }

  /**
   * Obtiene los matches de un deudor
   * @param {string} debtorId 
   * @returns {Promise<Array>}
   */
  async getDebtorMatches(debtorId) {
    try {
      const { data, error } = await this.supabase
        .from('debtor_corporate_matches')
        .select(`
          *,
          corporate_client:corporate_clients(
            id,
            name,
            contact_email,
            contact_phone,
            display_category
          )
        `)
        .eq('debtor_id', debtorId)
        .eq('status', 'active')
        .order('match_score', { ascending: false });

      if (error) {
        console.error('❌ Error obteniendo matches del deudor:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error en getDebtorMatches:', error);
      return [];
    }
  }
}

// Exportar instancia única
const debtorMatchingService = new DebtorMatchingService();
export default debtorMatchingService;