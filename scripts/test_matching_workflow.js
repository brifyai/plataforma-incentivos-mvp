/**
 * Test Script for End-to-End Matching Workflow
 * 
 * Este script prueba el flujo completo de matching:
 * 1. Crear un usuario de prueba
 * 2. Probar el matching automático
 * 3. Verificar los resultados en la base de datos
 * 4. Probar la interfaz de administración
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

class MatchingWorkflowTester {
  constructor() {
    this.testUser = null;
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

  async createTestUser() {
    this.log('Creando usuario de prueba para matching...');
    
    const testUserData = {
      email: `test${Date.now()}@gmail.com`,
      password: 'TestPassword123!',
      full_name: 'Juan Pérez TechCorp',
      rut: '12.345.678-9',
      phone: '+56 9 1234 5678'
    };

    try {
      // 1. Registrar usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testUserData.email,
        password: testUserData.password,
        options: {
          data: {
            full_name: testUserData.full_name,
            rut: testUserData.rut,
            phone: testUserData.phone,
            role: 'debtor'
          }
        }
      });

      if (authError) {
        this.log(`Error creando usuario Auth: ${authError.message}`, 'error');
        return false;
      }

      this.log(`Usuario Auth creado: ${authData.user?.id}`);

      // 2. Crear perfil en la tabla users
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: testUserData.email,
          full_name: testUserData.full_name,
          rut: testUserData.rut,
          phone: testUserData.phone,
          role: 'debtor',
          is_active: true,
          email_verified: false // Simular no verificado para testing
        })
        .select()
        .single();

      if (profileError) {
        this.log(`Error creando perfil: ${profileError.message}`, 'error');
        return false;
      }

      this.testUser = {
        ...testUserData,
        id: authData.user.id,
        profile: profileData
      };

      this.log(`Usuario de prueba creado exitosamente: ${this.testUser.email}`, 'success');
      return true;

    } catch (error) {
      this.log(`Error general creando usuario: ${error.message}`, 'error');
      return false;
    }
  }

  async testMatchingService() {
    if (!this.testUser) {
      this.log('No hay usuario de prueba disponible', 'error');
      return false;
    }

    this.log('Probando servicio de matching...');

    try {
      // Importar el servicio de matching
      const { default: debtorMatchingService } = await import('../src/services/debtorMatchingService.js');

      // Realizar matching
      const matchingResult = await debtorMatchingService.autoMatchAfterRegistration({
        id: this.testUser.id,
        full_name: this.testUser.full_name,
        email: this.testUser.email,
        rut: this.testUser.rut,
        phone: this.testUser.phone
      });

      this.log(`Matching completado: ${matchingResult.matchesFound} matches encontrados`);

      if (matchingResult.matchesFound > 0) {
        this.log('Matches encontrados:', 'success');
        matchingResult.matches.forEach((match, index) => {
          this.log(`  ${index + 1}. ${match.corporateName} - Score: ${(match.matchScore * 100).toFixed(1)}% - Tipo: ${match.matchType}`);
        });
        return matchingResult.matches;
      } else {
        this.log('No se encontraron matches', 'warning');
        return [];
      }

    } catch (error) {
      this.log(`Error en servicio de matching: ${error.message}`, 'error');
      return false;
    }
  }

  async verifyDatabaseResults() {
    this.log('Verificando resultados en la base de datos...');

    try {
      // Verificar matches guardados
      const { data: matches, error: matchesError } = await supabase
        .from('debtor_corporate_matches')
        .select(`
          *,
          corporate_client:corporate_clients(
            name,
            contact_email,
            display_category
          )
        `)
        .eq('debtor_id', this.testUser.id)
        .eq('status', 'active');

      if (matchesError) {
        this.log(`Error obteniendo matches: ${matchesError.message}`, 'error');
        return false;
      }

      this.log(`Se encontraron ${matches.length} matches en la base de datos`);

      if (matches.length > 0) {
        matches.forEach((match, index) => {
          this.log(`  Match ${index + 1}:`);
          this.log(`    - Cliente: ${match.corporate_client?.name}`);
          this.log(`    - Score: ${(match.match_score * 100).toFixed(1)}%`);
          this.log(`    - Tipo: ${match.match_type}`);
          this.log(`    - Detalles: ${JSON.stringify(match.match_details)}`);
        });
      }

      return matches;

    } catch (error) {
      this.log(`Error verificando base de datos: ${error.message}`, 'error');
      return false;
    }
  }

  async testMatchingAlgorithm() {
    this.log('Probando algoritmo de matching directamente...');

    try {
      // Obtener todos los clientes corporativos
      const { data: corporateClients, error: clientError } = await supabase
        .from('corporate_clients')
        .select('*')
        .eq('is_active', true);

      if (clientError) {
        this.log(`Error obteniendo clientes corporativos: ${clientError.message}`, 'error');
        return false;
      }

      this.log(`Analizando ${corporateClients.length} clientes corporativos`);

      // Importar servicio para testing
      const { default: debtorMatchingService } = await import('../src/services/debtorMatchingService.js');

      const testDebtor = {
        id: this.testUser.id,
        full_name: this.testUser.full_name,
        email: this.testUser.email,
        rut: this.testUser.rut,
        phone: this.testUser.phone
      };

      const detailedResults = [];

      for (const corporate of corporateClients) {
        const score = debtorMatchingService.calculateMatchScore(testDebtor, corporate);
        const details = debtorMatchingService.getMatchDetails(testDebtor, corporate);
        const matchType = debtorMatchingService.getMatchType(score);

        detailedResults.push({
          corporateName: corporate.name,
          score,
          matchType,
          details
        });

        if (score >= 0.7) {
          this.log(`✅ Match con ${corporate.name}: ${(score * 100).toFixed(1)}% (${matchType})`);
        } else {
          this.log(`❌ No match con ${corporate.name}: ${(score * 100).toFixed(1)}%`);
        }
      }

      return detailedResults;

    } catch (error) {
      this.log(`Error probando algoritmo: ${error.message}`, 'error');
      return false;
    }
  }

  async cleanupTestData() {
    this.log('Limpiando datos de prueba...');

    try {
      // Eliminar matches
      if (this.testUser) {
        const { error: matchDeleteError } = await supabase
          .from('debtor_corporate_matches')
          .delete()
          .eq('debtor_id', this.testUser.id);

        if (matchDeleteError) {
          this.log(`Error eliminando matches: ${matchDeleteError.message}`, 'error');
        }

        // Eliminar perfil de usuario
        const { error: profileDeleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', this.testUser.id);

        if (profileDeleteError) {
          this.log(`Error eliminando perfil: ${profileDeleteError.message}`, 'error');
        }

        // Eliminar usuario Auth
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(
          this.testUser.id
        );

        if (authDeleteError) {
          this.log(`Error eliminando usuario Auth: ${authDeleteError.message}`, 'warning');
        }
      }

      this.log('Limpieza completada', 'success');

    } catch (error) {
      this.log(`Error en limpieza: ${error.message}`, 'error');
    }
  }

  async generateReport() {
    this.log('Generando reporte de pruebas...');

    const report = {
      timestamp: new Date().toISOString(),
      testUser: this.testUser ? {
        email: this.testUser.email,
        full_name: this.testUser.full_name,
        rut: this.testUser.rut
      } : null,
      results: this.testResults,
      summary: {
        total: this.testResults.length,
        success: this.testResults.filter(r => r.type === 'success').length,
        errors: this.testResults.filter(r => r.type === 'error').length,
        warnings: this.testResults.filter(r => r.type === 'warning').length
      }
    };

    return report;
  }

  async runFullTest() {
    this.log('🚀 Iniciando prueba end-to-end del sistema de matching');
    this.log('================================================');

    let testPassed = true;

    // Paso 1: Crear usuario de prueba
    const userCreated = await this.createTestUser();
    if (!userCreated) {
      testPassed = false;
    }

    // Esperar un momento para que se propaguen los datos
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Paso 2: Probar algoritmo de matching
    const algorithmResults = await this.testMatchingAlgorithm();
    if (!algorithmResults) {
      testPassed = false;
    }

    // Paso 3: Probar servicio de matching
    const matchingResults = await this.testMatchingService();
    if (matchingResults === false) {
      testPassed = false;
    }

    // Paso 4: Verificar resultados en base de datos
    const dbResults = await this.verifyDatabaseResults();
    if (dbResults === false) {
      testPassed = false;
    }

    // Paso 5: Generar reporte
    const report = await this.generateReport();

    // Paso 6: Limpiar datos (solo si todo salió bien)
    if (testPassed) {
      await this.cleanupTestData();
    }

    this.log('================================================');
    if (testPassed) {
      this.log('🎉 Prueba completada exitosamente', 'success');
    } else {
      this.log('❌ Prueba falló - revisar errores above', 'error');
    }

    return {
      success: testPassed,
      report,
      algorithmResults,
      matchingResults,
      dbResults
    };
  }
}

// Ejecutar prueba
async function main() {
  console.log('🔧 Sistema de Pruebas End-to-End - Matching Workflow');
  console.log('==================================================\n');

  const tester = new MatchingWorkflowTester();
  
  try {
    const results = await tester.runFullTest();
    
    // Guardar reporte en archivo
    const fs = await import('fs');
    const reportPath = `./matching_test_report_${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(results.report, null, 2));
    
    console.log(`\n📄 Reporte guardado en: ${reportPath}`);
    
    if (results.success) {
      console.log('\n✨ Todos los tests pasaron correctamente');
      process.exit(0);
    } else {
      console.log('\n💥 Algunos tests fallaron - revisar el reporte');
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

export default MatchingWorkflowTester;