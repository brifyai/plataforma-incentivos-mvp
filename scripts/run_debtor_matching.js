/**
 * Script para ejecutar matching automático entre deudores y clientes corporativos
 * 
 * Uso:
 * node scripts/run_debtor_matching.js [--debtor-id <id>] [--test]
 * 
 * Opciones:
 * --debtor-id <id>  : Ejecutar matching para un deudor específico
 * --test             : Modo prueba (no guarda en base de datos)
 * --all              : Ejecutar para todos los deudores sin matchear (default)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configuración de Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

class DebtorMatchingScript {
  constructor() {
    this.testMode = false;
    this.specificDebtorId = null;
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
   * Obtiene todos los deudores
   * @returns {Promise<Array>}
   */
  async getAllDebtors() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, rut, phone')
        .eq('role', 'debtor');

      if (error) {
        console.error('❌ Error obteniendo deudores:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error en getAllDebtors:', error);
      return [];
    }
  }

  /**
   * Obtiene todos los clientes corporativos activos
   * @returns {Promise<Array>}
   */
  async getActiveCorporateClients() {
    try {
      const { data, error } = await supabase
        .from('corporate_clients')
        .select('id, name, contact_email, contact_phone, company_id, display_category')
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
   * Encuentra matches para un deudor específico
   * @param {Object} debtor 
   * @param {Array} corporateClients 
   * @returns {Promise<Array>}
   */
  async findMatchesForDebtor(debtor, corporateClients) {
    const matches = [];

    console.log(`🔍 Analizando matches para: ${debtor.full_name} (RUT: ${debtor.rut})`);

    for (const corporate of corporateClients) {
      const matchScore = await this.calculateMatchScore(debtor, corporate);
      
      if (matchScore.totalScore >= 0.7) { // Umbral del 70%
        matches.push({
          corporateId: corporate.id,
          corporateName: corporate.name,
          matchScore: matchScore.totalScore,
          matchDetails: matchScore.details,
          matchType: matchScore.matchType
        });
        
        console.log(`✅ Match encontrado: ${corporate.name} (${(matchScore.totalScore * 100).toFixed(1)}%)`);
      }
    }

    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Calcula score de matching
   * @param {Object} debtor 
   * @param {Object} corporate 
   * @returns {Object}
   */
  async calculateMatchScore(debtor, corporate) {
    const details = {
      nameMatch: 0,
      emailMatch: 0
    };

    let totalScore = 0;
    let matchType = 'partial';

    // Matching por nombre
    if (debtor.full_name && corporate.name) {
      const nameSimilarity = this.calculateNameSimilarity(debtor.full_name, corporate.name);
      details.nameMatch = nameSimilarity;
      totalScore += nameSimilarity * 0.7; // 70% del peso para nombre
      
      if (nameSimilarity > 0.9) {
        matchType = 'name_high';
      }
    }

    // Matching por email
    if (debtor.email && corporate.contact_email) {
      const emailMatch = debtor.email.toLowerCase() === corporate.contact_email.toLowerCase() ? 1 : 0;
      details.emailMatch = emailMatch;
      totalScore += emailMatch * 0.3; // 30% del peso para email
      
      if (emailMatch === 1) {
        matchType = matchType === 'name_high' ? 'perfect' : 'email_exact';
      }
    }

    return {
      totalScore: Math.min(totalScore, 1.0),
      details,
      matchType
    };
  }

  /**
   * Guarda matches en la base de datos
   * @param {string} debtorId 
   * @param {Array} matches 
   * @returns {Promise<boolean>}
   */
  async saveMatches(debtorId, matches) {
    if (this.testMode) {
      console.log(`🧪 TEST MODE: No guardando ${matches.length} matches para deudor ${debtorId}`);
      return true;
    }

    try {
      const matchesToInsert = matches.map(match => ({
        debtor_id: debtorId,
        corporate_id: match.corporateId,
        match_score: match.matchScore,
        match_type: match.matchType,
        match_details: match.matchDetails,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('debtor_corporate_matches')
        .insert(matchesToInsert);

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('⚠️ Tabla debtor_corporate_matches no existe. Ejecuta la migración primero.');
          return false;
        }
        console.error('❌ Error guardando matches:', error);
        return false;
      }

      console.log(`✅ Guardados ${matches.length} matches para deudor ${debtorId}`);
      return true;
    } catch (error) {
      console.error('❌ Error en saveMatches:', error);
      return false;
    }
  }

  /**
   * Procesa un deudor específico
   * @param {string} debtorId 
   * @returns {Promise<Object>}
   */
  async processDebtor(debtorId) {
    try {
      // Obtener información del deudor
      const { data: debtor, error } = await supabase
        .from('users')
        .select('id, full_name, email, rut, phone')
        .eq('id', debtorId)
        .eq('role', 'debtor')
        .single();

      if (error || !debtor) {
        return { error: 'Deudor no encontrado', debtorId };
      }

      // Obtener clientes corporativos
      const corporateClients = await this.getActiveCorporateClients();
      if (corporateClients.length === 0) {
        return { error: 'No hay clientes corporativos disponibles', debtor };
      }

      // Buscar matches
      const matches = await this.findMatchesForDebtor(debtor, corporateClients);

      // Guardar matches
      if (matches.length > 0) {
        const saved = await this.saveMatches(debtorId, matches);
        return {
          debtor,
          matchesFound: matches.length,
          matches,
          saved
        };
      } else {
        return {
          debtor,
          matchesFound: 0,
          matches: [],
          message: 'No se encontraron matches'
        };
      }

    } catch (error) {
      console.error(`❌ Error procesando deudor ${debtorId}:`, error);
      return { error: error.message, debtorId };
    }
  }

  /**
   * Procesa todos los deudores
   * @returns {Promise<Object>}
   */
  async processAllDebtors() {
    try {
      console.log('🔄 Iniciando matching masivo de deudores...');

      const debtors = await this.getAllDebtors();
      console.log(`📊 Total de deudores a procesar: ${debtors.length}`);

      const corporateClients = await this.getActiveCorporateClients();
      console.log(`📊 Total de clientes corporativos disponibles: ${corporateClients.length}`);

      if (corporateClients.length === 0) {
        return { message: 'No hay clientes corporativos activos', results: [] };
      }

      const results = [];
      let totalMatches = 0;

      for (const debtor of debtors) {
        try {
          console.log(`\n🔄 Procesando: ${debtor.full_name}`);
          
          const matches = await this.findMatchesForDebtor(debtor, corporateClients);

          if (matches.length > 0) {
            const saved = await this.saveMatches(debtor.id, matches);
            totalMatches += matches.length;
            
            results.push({
              debtorId: debtor.id,
              debtorName: debtor.full_name,
              matchesFound: matches.length,
              matches: matches.map(m => ({
                corporateName: m.corporateName,
                score: (m.matchScore * 100).toFixed(1) + '%'
              })),
              saved
            });
          } else {
            results.push({
              debtorId: debtor.id,
              debtorName: debtor.full_name,
              matchesFound: 0,
              message: 'No se encontraron matches'
            });
          }

        } catch (error) {
          console.error(`❌ Error procesando ${debtor.full_name}:`, error);
          results.push({
            debtorId: debtor.id,
            debtorName: debtor.full_name,
            error: error.message
          });
        }
      }

      console.log(`\n🎉 Matching completado. Total matches: ${totalMatches}`);

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
   * Ejecuta el script
   */
  async run() {
    console.log('🚀 Iniciando script de matching deudores-clientes corporativos\n');

    // Parsear argumentos
    const args = process.argv.slice(2);
    this.testMode = args.includes('--test');
    this.specificDebtorId = args.find(arg => arg.startsWith('--debtor-id='))?.split('=')[1];

    if (this.testMode) {
      console.log('🧪 MODO PRUEBA ACTIVADO - No se guardarán cambios\n');
    }

    try {
      let result;

      if (this.specificDebtorId) {
        console.log(`🎯 Procesando deudor específico: ${this.specificDebtorId}`);
        result = await this.processDebtor(this.specificDebtorId);
      } else {
        console.log('🔄 Procesando todos los deudores...');
        result = await this.processAllDebtors();
      }

      console.log('\n📊 RESULTADOS:');
      console.log(JSON.stringify(result, null, 2));

    } catch (error) {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    }
  }
}

// Ejecutar script
if (import.meta.url === `file://${process.argv[1]}`) {
  const script = new DebtorMatchingScript();
  script.run();
}

export default DebtorMatchingScript;