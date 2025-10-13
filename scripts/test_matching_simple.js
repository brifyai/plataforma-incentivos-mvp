
/**
 * Simple Test Script for Matching Workflow
 * 
 * Versión simplificada que prueba el matching sin dependencias externas
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

class SimpleMatchingTester {
  constructor() {
    this.testResults = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[type];

    console.log(`${timestamp} ${prefix} ${message}`);
    this.testResults.push({ timestamp, message, type });
  }

  // Algoritmo de matching simplificado
  calculateMatchScore(debtor, corporateClient) {
    let score = 0;
    let details = {};

    // Matching por nombre (40%)
    if (debtor.full_name && corporateClient.name) {
      const debtorName = debtor.full_name.toLowerCase();
      const corporateName = corporateClient.name.toLowerCase();
      
      if (debtorName.includes(corporateName.split(' ')[0]) || 
          corporateName.includes(debtorName.split(' ')[0])) {
        score += 0.4;
        details.nameMatch = true;
      } else {
        details.nameMatch = false;
      }
    }

    // Matching por email (30%)
    if (debtor.email && corporateClient.contact_email) {
      const debtorDomain = debtor.email.split('@')[1];
      const corporateDomain = corporateClient.contact_email.split('@')[1];
      
      if (debtorDomain === corporateDomain) {
        score += 0.3;
        details.domainMatch = true;
      } else {
        details.domainMatch = false;
      }
    }

    // Matching por RUT (30%)
    if (debtor.rut && corporateClient.rut) {
      if (debtor.rut === corporateClient.rut) {
        score += 0.3;
        details.rutMatch = true;
      } else {
        details.rutMatch = false;
      }
    }

    return { score, details };
  }

  getMatchType(score) {
    if (score >= 0.9) return 'perfect';
    if (score >= 0.8) return 'high';
    if (score >= 0.7) return 'medium';
    return 'low';
  }

  async testMatchingAlgorithm() {
    this.log('Probando algoritmo de matching con datos existentes...');

    try {
      // Obtener usuarios (deudores) - sin filtro is_active que no existe
      const { data: debtors, error: debtorError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'debtor')
        .limit(5);

      if (debtorError) {
        this.log(`Error obteniendo deudores: ${debtorError.message}`, 'error');
        return false;
      }

      this.log(`Se encontraron ${debtors.length} deudores para testing`);

      // Obtener clientes corporativos
      const { data: corporateClients, error: clientError } = await supabase
        .from('corporate_clients')
        .select('*')
        .eq('is_active', true);

      if (clientError) {
        this.log(`Error obteniendo clientes corporativos: ${clientError.message}`, 'error');
        return false;
      }

      this.log(`Se encontraron ${corporateClients.length} clientes corporativos`);

      let totalMatches = 0;
      let highQualityMatches = 0;

      // Probar matching para cada deudor
      for (const debtor of debtors) {
        this.log(`\nAnalizando deudor: ${debtor.full_name} (${debtor.email})`);
        
        let debtorMatches = [];

        for (const corporate of corporateClients) {
          const { score, details } = this.calculateMatchScore(debtor, corporate);
          const matchType = this.getMatchType(score);

          if (score >= 0.7) { // Solo considerar matches de calidad media o superior
            debtorMatches.push({
              corporateId: corporate.id,
              corporateName: corporate.name,
              score,
              matchType,
              details
            });

            totalMatches++;
            if (matchType === 'perfect' || matchType === 'high') {
              highQualityMatches++;
            }

            this.log(`  ✅ Match con ${corporate.name}: ${(score * 100).toFixed(1)}% (${matchType})`);
          }
        }

        if (debtorMatches.length === 0) {
          this.log(`  ❌ No se encontraron matches para ${debtor.full_name}`);
        } else {
          this.log(`  📊 ${debtorMatches.length} matches encontrados para ${debtor.full_name}`);
        }
      }

      this.log(`\n📈 Resumen del Matching:`, 'success');
      this.log(`  - Total de matches: ${totalMatches}`);
      this.log(`  - Matches de alta calidad: ${highQualityMatches}`);
      this.log(`  - Tasa de éxito: ${debtors.length > 0 ? ((totalMatches / debtors.length) * 100).toFixed(1) : 0}%`);

      return {
        totalMatches,
        highQualityMatches,
        successRate: debtors.length > 0 ? (totalMatches / debtors.length) : 0
      };

    } catch (error) {
      this.log(`Error en prueba de matching: ${error.message}`, 'error');
      return false;
    }
  }

  async testExistingMatches() {
    this.log('Verificando matches existentes en la base de datos...');

    try {
      const { data: matches, error: matchesError } = await supabase
        .from('debtor_corporate_matches')
        .select(`
          *,
          debtor:users!debtor_corporate_matches_debtor_id_fkey(
            full_name,
            email,
            rut
          ),
          corporate_client:corporate_clients(
            name,
            contact_email,
            display_category
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);

      if (matchesError) {
        if (matchesError.message.includes('Could not find the table')) {
          this.log('⚠️ La tabla debtor_corporate_matches no existe aún - debe crearse manualmente', 'warning');
          this.log('📋 Ejecuta el SQL proporcionado por el script create_matching_table.js en el panel de Supabase', 'info');
          return [];
        } else {
          this.log(`Error obteniendo matches existentes: ${matchesError.message}`, 'error');
          return false;
        }
      }

      this.log(`Se encontraron ${matches.length} matches activos en la base de datos`);

      if (matches.length > 0) {
        matches.forEach((match, index) => {
          this.log(`\nMatch ${index + 1}:`);
          this.log(`  Deudor: ${match.debtor?.full_name} (${match.debtor?.email})`);
          this.log(`  Cliente: ${match.corporate_client?.name}`);
          this.log(`  Score: ${(match.match_score * 100).toFixed(1)}%`);
          this.log(`  Tipo: ${match.match_type}`);
          this.log(`  Creado: ${new Date(match.created_at).toLocaleString('es-CL')}`);
        });
      }

      return matches;

    } catch (error) {
      this.log(`Error verificando matches existentes: ${error.message}`, 'error');
      return false;
    }
  }

  async runSimpleTest() {
    this.log('🚀 Iniciando prueba simple del sistema de matching');
    this.log('==============================================');

    let testPassed = true;

    // Paso 1: Probar algoritmo de matching
    const algorithmResults = await this.testMatchingAlgorithm();
    if (!algorithmResults) {
      testPassed = false;
    }

    // Paso 2: Verificar matches existentes
    const existingMatches = await this.testExistingMatches();
    if (existingMatches === false) {
      testPassed = false;
    }

    this.log('==============================================');
    if (testPassed) {
      this.log('🎉 Prueba simple completada exitosamente', 'success');
    } else {
      this.log('❌ Prueba simple falló - revisar errores arriba', 'error');
    }

    return {
      success: testPassed,
      algorithmResults,
      existingMatches,
      results: this.testResults
    };
  }
}

// Ejecutar prueba
async function main() {
  console.log('🔧 Sistema de Pruebas Simple - Matching Workflow');
  console.log('===============================================\n');

  const tester = new SimpleMatchingTester();
  
  try {
    const results = await tester.runSimpleTest();
    
    // Guardar reporte en archivo
    const fs = await import('fs');
    const reportPath = `./simple_matching_test_report_${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    
    console.log(`\n📄 Reporte guardado en: ${reportPath}`);
    
    if (results.success) {
      console.log('\n✨ La prueba simple pasó correctamente');
      process.exit(0);
    } else {
      console.log('\n💥 La prueba simple falló - revisar el reporte');
      process.exit(1);
    }
    
  } catch (error) {
    console.error(`\n💥 Error fatal en pruebas: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default SimpleMatchingTester;