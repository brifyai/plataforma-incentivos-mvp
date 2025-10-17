/**
 * Debtor-Corporate Client Matching Service
 * 
 * Servicio para automatizar el pareo entre deudores y clientes corporativos
 * basado en coincidencias de nombre y RUT
 */

import { getSupabaseInstance } from './supabaseInstances';

const supabase = getSupabaseInstance('main');

class DebtorCorporateMatchingService {
  constructor() {
    this.matchingThresholds = {
      // Umbral de similitud para matching por nombre (0-1)
      nameSimilarityThreshold: 0.8,
      // Umbral de coincidencia exacta para RUT
      rutExactMatch: true,
      // Considerar variaciones comunes de RUT
      rutVariations: true
    };
  }

  /**
   * Realiza matching automático para un deudor específico
   * @param {string} debtorId - ID del deudor a matchear
   * @returns {Promise<Object>} Resultados del matching
   */
  async matchDebtorToCorporate(debtorId) {
    try {
      console.log(`🔍 Iniciando matching para deudor: ${debtorId}`);

      // 1. Obtener información del deudor
      const debtor = await this.getDebtorInfo(debtorId);
      if (!debtor) {
        throw new Error('Deudor no encontrado');
      }

      // 2. Obtener todos los clientes corporativos activos
      const corporateClients = await this.getActiveCorporateClients();
      if (!corporateClients || corporateClients.length === 0) {
        console.log('❓ No hay clientes corporativos activos para matching');
        return { matches: [], debtor, message: 'No hay clientes corporativos disponibles' };
      }

      // 3. Realizar matching por diferentes criterios
      const matches = await this.findMatches(debtor, corporateClients);

      // 4. Guardar matches encontrados
      if (matches.length > 0) {
        await this.saveMatches(debtorId, matches);
        console.log(`✅ Se encontraron ${matches.length} matches para ${debtor.full_name}`);
      } else {
        console.log(`❓ No se encontraron matches para ${debtor.full_name}`);
      }

      return {
        matches,
        debtor,
        totalCorporateClients: corporateClients.length,
        matchedCount: matches.length
      };

    } catch (error) {
      console.error('❌ Error en matching automático:', error);
      throw error;
    }
  }

  /**
   * Realiza matching para todos los deudores sin matchear
   * @returns {Promise<Object>} Resultados del proceso masivo
   */
  async matchAllUnmatchedDebtors() {
    try {
      console.log('🔄 Iniciando matching masivo de deudores...');

      // 1. Obtener todos los deudores
      const debtors = await this.getAllDebtors();
      console.log(`📊 Total de deudores a procesar: ${debtors.length}`);

      // 2. Obtener todos los clientes corporativos activos
      const corporateClients = await this.getActiveCorporateClients();
      console.log(`📊 Total de clientes corporativos disponibles: ${corporateClients.length}`);

      if (corporateClients.length === 0) {
        return { message: 'No hay clientes corporativos activos', results: [] };
      }

      // 3. Procesar cada deudor
      const results = [];
      let totalMatches = 0;

      for (const debtor of debtors) {
        try {
          // Verificar si ya tiene matches
          const existingMatches = await this.getExistingMatches(debtor.id);
          if (existingMatches.length > 0) {
            console.log(`⏭️  Deudor ${debtor.full_name} ya tiene ${existingMatches.length} matches`);
            continue;
          }

          // Realizar matching
          const matches = await this.findMatches(debtor, corporateClients);

          if (matches.length > 0) {
            await this.saveMatches(debtor.id, matches);
            totalMatches += matches.length;
            console.log(`✅ ${debtor.full_name}: ${matches.length} matches`);
          }

          results.push({
            debtorId: debtor.id,
            debtorName: debtor.full_name,
            matchesFound: matches.length,
            matches: matches.map(m => ({ corporateId: m.corporateId, corporateName: m.corporateName }))
          });

        } catch (error) {
          console.error(`❌ Error procesando deudor ${debtor.full_name}:`, error);
          results.push({
            debtorId: debtor.id,
            debtorName: debtor.full_name,
            error: error.message
          });
        }
      }

      console.log(`🎉 Matching masivo completado. Total matches: ${totalMatches}`);

      return {
        totalDebtors: debtors.length,
        totalMatches,
        results,
        processedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error en matching masivo:', error);
      throw error;
    }
  }

  /**
   * Encuentra matches entre un deudor y los clientes corporativos
   * @param {Object} debtor - Información del deudor
   * @param {Array} corporateClients - Lista de clientes corporativos
   * @returns {Promise<Array>} Lista de matches encontrados
   */
  async findMatches(debtor, corporateClients) {
    const matches = [];

    for (const corporate of corporateClients) {
      const matchScore = await this.calculateMatchScore(debtor, corporate);
      
      if (matchScore.totalScore >= this.matchingThresholds.nameSimilarityThreshold) {
        matches.push({
          corporateId: corporate.id,
          corporateName: corporate.name,
          matchScore: matchScore.totalScore,
          matchDetails: matchScore.details,
          matchType: matchScore.matchType
        });
      }
    }

    // Ordenar por score descendente
    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Calcula el score de matching entre un deudor y un cliente corporativo
   * @param {Object} debtor - Información del deudor
   * @param {Object} corporate - Información del cliente corporativo
   * @returns {Object} Score y detalles del matching
   */
  async calculateMatchScore(debtor, corporate) {
    const details = {
      nameMatch: 0,
      rutMatch: 0,
      emailMatch: 0,
      phoneMatch: 0
    };

    let totalScore = 0;
    let matchType = 'partial';

    // 1. Matching por RUT (máxima prioridad)
    if (debtor.rut && corporate.rut) {
      const rutMatch = this.compareRUT(debtor.rut, corporate.rut);
      if (rutMatch) {
        details.rutMatch = 1.0;
        totalScore += 0.6; // 60% del peso para RUT exacto
        matchType = 'rut_exact';
      }
    }

    // 2. Matching por nombre
    if (debtor.full_name && corporate.name) {
      const nameSimilarity = this.calculateNameSimilarity(debtor.full_name, corporate.name);
      details.nameMatch = nameSimilarity;
      totalScore += nameSimilarity * 0.3; // 30% del peso para nombre
      
      if (nameSimilarity > 0.9) {
        matchType = matchType === 'rut_exact' ? 'perfect' : 'name_high';
      }
    }

    // 3. Matching por email (si está disponible)
    if (debtor.email && corporate.contact_email) {
      const emailMatch = debtor.email.toLowerCase() === corporate.contact_email.toLowerCase() ? 1 : 0;
      details.emailMatch = emailMatch;
      totalScore += emailMatch * 0.1; // 10% del peso para email
    }

    return {
      totalScore: Math.min(totalScore, 1.0), // Limitar a 1.0
      details,
      matchType
    };
  }

  /**
   * Compara dos RUTs considerando formatos y variaciones
   * @param {string} rut1 - Primer RUT
   * @param {string} rut2 - Segundo RUT
   * @returns {boolean} Si los RUTs coinciden
   */
  compareRUT(rut1, rut2) {
    if (!rut1 || !rut2) return false;

    // Normalizar RUTs: quitar puntos, guiones y convertir a mayúsculas
    const normalizeRUT = (rut) => {
      return rut
        .replace(/[.\s-]/g, '')
        .toUpperCase();
    };

    const normalized1 = normalizeRUT(rut1);
    const normalized2 = normalizeRUT(rut2);

    return normalized1 === normalized2;
  }

  /**
   * Calcula similitud entre dos nombres usando algoritmo de Levenshtein
   * @param {string} name1 - Primer nombre
   * @param {string} name2 - Segundo nombre
   * @returns {number} Similitud (0-1)
   */
  calculateNameSimilarity(name1, name2) {
    if (!name1 || !name2) return 0;

    // Normalizar nombres: minúsculas, sin espacios extra
    const normalizeName = (name) => {
      return name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ');
    };

    const normalized1 = normalizeName(name1);
    const normalized2 = normalizeName(name2);

    // Si son exactamente iguales
    if (normalized1 === normalized2) return 1.0;

    // Calcular distancia de Levenshtein
    const distance = this.levenshteinDistance(normalized1, normalized2);
    const maxLength = Math.max(normalized1.length, normalized2.length);
    
    // Convertir distancia a similitud
    const similarity = maxLength > 0 ? (maxLength - distance) / maxLength : 0;

    // Bonus por coincidencia de palabras clave
    const words1 = normalized1.split(' ');
    const words2 = normalized2.split(' ');
    const commonWords = words1.filter(word => words2.includes(word));
    const wordBonus = commonWords.length / Math.max(words1.length, words2.length);

    return Math.min(similarity + (wordBonus * 0.2), 1.0);
  }

  /**
   * Calcula distancia de Levenshtein entre dos strings
   * @param {string} str1 - Primer string
   * @param {string} str2 - Segundo string
   * @returns {number} Distancia de Levenshtein
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
   * Obtiene información de un deudor
   * @param {string} debtorId - ID del deudor
   * @returns {Promise<Object|null>} Información del deudor
   */
  async getDebtorInfo(debtorId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, rut, phone')
        .eq('id', debtorId)
        .eq('role', 'debtor')
        .single();

      if (error) {
        console.error('Error obteniendo deudor:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error en getDebtorInfo:', error);
      return null;
    }
  }

  /**
   * Obtiene todos los deudores
   * @returns {Promise<Array>} Lista de deudores
   */
  async getAllDebtors() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, rut, phone')
        .eq('role', 'debtor');

      if (error) {
        console.error('Error obteniendo deudores:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error en getAllDebtors:', error);
      return [];
    }
  }

  /**
   * Obtiene todos los clientes corporativos activos
   * @returns {Promise<Array>} Lista de clientes corporativos
   */
  async getActiveCorporateClients() {
    try {
      const { data, error } = await supabase
        .from('corporate_clients')
        .select('id, name, contact_email, contact_phone, address, company_id, display_category')
        .eq('is_active', true);

      if (error) {
        console.error('Error obteniendo clientes corporativos:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error en getActiveCorporateClients:', error);
      return [];
    }
  }

  /**
   * Obtiene matches existentes para un deudor
   * @param {string} debtorId - ID del deudor
   * @returns {Promise<Array>} Matches existentes
   */
  async getExistingMatches(debtorId) {
    try {
      const { data, error } = await supabase
        .from('debtor_corporate_matches')
        .select('*')
        .eq('debtor_id', debtorId);

      if (error) {
        if (error.code === 'PGRST116') {
          // Tabla no existe, retornar vacío
          return [];
        }
        console.error('Error obteniendo matches existentes:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error en getExistingMatches:', error);
      return [];
    }
  }

  /**
   * Guarda los matches encontrados
   * @param {string} debtorId - ID del deudor
   * @param {Array} matches - Matches a guardar
   * @returns {Promise<boolean>} Si se guardaron correctamente
   */
  async saveMatches(debtorId, matches) {
    try {
      // Preparar datos para inserción
      const matchesToInsert = matches.map(match => ({
        debtor_id: debtorId,
        corporate_id: match.corporateId,
        match_score: match.matchScore,
        match_type: match.matchType,
        match_details: match.matchDetails,
        created_at: new Date().toISOString()
      }));

      // Insertar matches
      const { error } = await supabase
        .from('debtor_corporate_matches')
        .insert(matchesToInsert);

      if (error) {
        if (error.code === 'PGRST116') {
          // Tabla no existe, crearla primero
          await this.createMatchingTable();
          // Reintentar inserción
          const { error: retryError } = await supabase
            .from('debtor_corporate_matches')
            .insert(matchesToInsert);
          
          if (retryError) {
            console.error('Error guardando matches (reintento):', retryError);
            return false;
          }
        } else {
          console.error('Error guardando matches:', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error en saveMatches:', error);
      return false;
    }
  }

  /**
   * Crea la tabla de matching si no existe
   * @returns {Promise<boolean>} Si se creó correctamente
   */
  async createMatchingTable() {
    try {
      console.log('🔧 Creando tabla debtor_corporate_matches...');
      
      // Esta sería una migración de base de datos
      // Por ahora, retornamos true y asumimos que la tabla existe o será creada manualmente
      console.log('⚠️ La tabla debtor_corporate_matches debe ser creada manualmente');
      
      return true;
    } catch (error) {
      console.error('Error creando tabla de matching:', error);
      return false;
    }
  }

  /**
   * Actualiza información de un cliente corporativo para incluir RUT
   * @param {string} corporateId - ID del cliente corporativo
   * @param {string} rut - RUT del cliente corporativo
   * @returns {Promise<boolean>} Si se actualizó correctamente
   */
  async updateCorporateClientWithRUT(corporateId, rut) {
    try {
      const { error } = await supabase
        .from('corporate_clients')
        .update({ rut })
        .eq('id', corporateId);

      if (error) {
        console.error('Error actualizando RUT de cliente corporativo:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en updateCorporateClientWithRUT:', error);
      return false;
    }
  }
}

// Exportar instancia del servicio
export const debtorCorporateMatchingService = new DebtorCorporateMatchingService();

// Exportar clase para uso directo
export default DebtorCorporateMatchingService;