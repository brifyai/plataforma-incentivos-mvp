// ANÁLISIS DE DISCREPANCIAS CRÍTICAS DEL SISTEMA NEXUPAY
// Enfoque en campos importantes que faltan en la base de datos

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wvluqdldygmgncqqjkow.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

console.log('🔍 ANÁLISIS DE DISCREPANCIAS CRÍTICAS');
console.log('='.repeat(50));

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class CriticalDiscrepanciesAnalyzer {
  constructor() {
    this.dbStructure = new Map();
    this.criticalFields = new Map();
    this.importantUIFields = new Set();
    this.criticalIssues = [];
  }

  // Paso 1: Obtener estructura detallada de la base de datos
  async getDetailedDatabaseStructure() {
    console.log('\n📊 PASO 1: Analizando estructura detallada de la base de datos...');
    
    const tables = ['users', 'companies', 'clients', 'debts', 'campaigns', 'proposals', 'agreements', 'payments'];
    
    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error && data) {
          const columns = data.length > 0 ? Object.keys(data[0]) : [];
          this.dbStructure.set(tableName, columns);
          console.log(`✅ ${tableName}: ${columns.length} columnas`);
          
          // Mostrar columnas importantes
          const importantColumns = columns.filter(col => 
            col.includes('name') || col.includes('email') || col.includes('phone') || 
            col.includes('rut') || col.includes('legal') || col.includes('representative') ||
            col.includes('address') || col.includes('status') || col.includes('validation')
          );
          
          if (importantColumns.length > 0) {
            console.log(`   📋 Columnas importantes: ${importantColumns.join(', ')}`);
          }
        } else {
          console.log(`❌ ${tableName}: No accesible o vacía`);
          this.dbStructure.set(tableName, []);
        }
      } catch (e) {
        console.log(`❌ ${tableName}: Error - ${e.message}`);
        this.dbStructure.set(tableName, []);
      }
    }
  }

  // Paso 2: Analizar campos críticos en componentes específicos
  analyzeCriticalUIFields() {
    console.log('\n🎨 PASO 2: Analizando campos críticos en la UI...');
    
    // Componentes críticos que deben tener campos de base de datos
    const criticalComponents = [
      'src/pages/company/CompanyVerificationPage.jsx',
      'src/pages/company/ProfilePage.jsx',
      'src/pages/company/CompanyDashboard.jsx',
      'src/pages/admin/CompanyVerificationDashboard.jsx',
      'src/components/company/BankAccountSetup.jsx',
      'src/pages/debtor/ProfilePage.jsx'
    ];
    
    const criticalFieldPatterns = [
      'legal_representative', 'representative_legal', 'rut_representante',
      'nombre_representante', 'direccion', 'address', 'comuna', 'region',
      'giro_comercial', 'business_type', 'actividad_economica',
      'fecha_constitucion', 'constitution_date', 'capital_social',
      'validacion_identidad', 'identity_validation', 'estado_verificacion'
    ];
    
    for (const componentPath of criticalComponents) {
      try {
        const fullPath = path.join(__dirname, '..', componentPath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          const foundFields = [];
          criticalFieldPatterns.forEach(pattern => {
            if (content.includes(pattern)) {
              foundFields.push(pattern);
            }
          });
          
          if (foundFields.length > 0) {
            console.log(`📋 ${componentPath}:`);
            foundFields.forEach(field => {
              console.log(`   • ${field}`);
              this.importantUIFields.add(field);
            });
          }
        }
      } catch (error) {
        console.log(`⚠️ No se pudo leer: ${componentPath}`);
      }
    }
    
    console.log(`\n📊 Total campos críticos encontrados en UI: ${this.importantUIFields.size}`);
  }

  // Paso 3: Analizar servicios para identificar campos esperados
  analyzeDatabaseServices() {
    console.log('\n🔧 PASO 3: Analizando servicios de base de datos...');
    
    const serviceFiles = [
      'src/services/databaseService.js',
      'src/services/authService.js',
      'src/services/verificationService.js',
      'src/services/companyService.js'
    ];
    
    for (const servicePath of serviceFiles) {
      try {
        const fullPath = path.join(__dirname, '..', servicePath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          // Buscar referencias a campos específicos
          const fieldMatches = content.match(/['"`]([a-zA-Z_][a-zA-Z0-9_]*)['"`]/g);
          if (fieldMatches) {
            const fields = fieldMatches.map(match => match.replace(/['"`]/g, ''));
            const importantFields = fields.filter(field => 
              field.length > 3 && 
              (field.includes('legal') || field.includes('representative') || 
               field.includes('rut') || field.includes('address') ||
               field.includes('validation') || field.includes('status'))
            );
            
            if (importantFields.length > 0) {
              console.log(`📋 ${servicePath}:`);
              importantFields.forEach(field => {
                console.log(`   • ${field}`);
                this.importantUIFields.add(field);
              });
            }
          }
        }
      } catch (error) {
        console.log(`⚠️ No se pudo leer: ${servicePath}`);
      }
    }
  }

  // Paso 4: Identificar discrepancias críticas
  identifyCriticalDiscrepancies() {
    console.log('\n🔍 PASO 4: Identificando discrepancias críticas...');
    
    // Campos críticos que deberían estar en la base de datos
    const expectedCriticalFields = [
      'legal_representative_name',
      'legal_representative_rut', 
      'legal_representative_email',
      'legal_representative_phone',
      'company_address',
      'company_region',
      'company_commune',
      'business_type',
      'economic_activity',
      'constitution_date',
      'social_capital',
      'identity_validation_status',
      'verification_status',
      'validation_documents',
      'bank_account_number',
      'bank_account_type',
      'bank_name'
    ];
    
    // Verificar qué campos críticos faltan en cada tabla
    for (const [tableName, columns] of this.dbStructure) {
      const missingFields = expectedCriticalFields.filter(field => 
        !columns.some(col => col.toLowerCase().includes(field.toLowerCase()))
      );
      
      if (missingFields.length > 0) {
        this.criticalIssues.push({
          table: tableName,
          missingFields: missingFields,
          currentColumns: columns,
          severity: this.calculateSeverity(tableName, missingFields)
        });
      }
    }
    
    // Ordenar por severidad
    this.criticalIssues.sort((a, b) => b.severity - a.severity);
  }

  calculateSeverity(tableName, missingFields) {
    let severity = 0;
    
    // Tabla companies es la más crítica
    if (tableName === 'companies') {
      severity += missingFields.length * 10;
      
      // Campos extra críticos
      const criticalFields = ['legal_representative_name', 'legal_representative_rut', 'verification_status'];
      criticalFields.forEach(field => {
        if (missingFields.includes(field)) severity += 20;
      });
    }
    
    // Tabla users también es importante
    if (tableName === 'users') {
      severity += missingFields.length * 5;
    }
    
    return severity;
  }

  // Paso 5: Generar reporte de discrepancias críticas
  generateCriticalReport() {
    console.log('\n📋 PASO 5: Generando reporte de discrepancias críticas...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTables: this.dbStructure.size,
        totalCriticalIssues: this.criticalIssues.length,
        highSeverityIssues: this.criticalIssues.filter(issue => issue.severity >= 50).length
      },
      databaseStructure: {},
      criticalIssues: this.criticalIssues,
      recommendations: []
    };
    
    // Estructura actual
    for (const [tableName, columns] of this.dbStructure) {
      report.databaseStructure[tableName] = {
        columnCount: columns.length,
        columns: columns
      };
    }
    
    // Generar recomendaciones específicas
    this.criticalIssues.forEach(issue => {
      if (issue.table === 'companies') {
        report.recommendations.push({
          type: 'urgent',
          table: issue.table,
          description: `Agregar campos críticos faltantes en tabla companies`,
          missingFields: issue.missingFields,
          sql: this.generateMigrationSQL(issue.table, issue.missingFields)
        });
      }
    });
    
    // Guardar reporte
    const reportPath = path.join(__dirname, 'critical-discrepancies-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`✅ Reporte crítico guardado en: ${reportPath}`);
    
    return report;
  }

  generateMigrationSQL(tableName, fields) {
    const sqlStatements = [];
    
    sqlStatements.push(`-- Migración para agregar campos críticos a la tabla ${tableName}`);
    sqlStatements.push(`ALTER TABLE public.${tableName}`);
    
    const fieldDefinitions = {
      'legal_representative_name': 'TEXT',
      'legal_representative_rut': 'TEXT',
      'legal_representative_email': 'TEXT',
      'legal_representative_phone': 'TEXT',
      'company_address': 'TEXT',
      'company_region': 'TEXT',
      'company_commune': 'TEXT',
      'business_type': 'TEXT',
      'economic_activity': 'TEXT',
      'constitution_date': 'DATE',
      'social_capital': 'DECIMAL(15,2)',
      'identity_validation_status': 'VARCHAR(50)',
      'verification_status': 'VARCHAR(50)',
      'validation_documents': 'JSONB',
      'bank_account_number': 'TEXT',
      'bank_account_type': 'VARCHAR(50)',
      'bank_name': 'TEXT'
    };
    
    const alterStatements = fields.map(field => {
      const dataType = fieldDefinitions[field] || 'TEXT';
      return `ADD COLUMN IF NOT EXISTS ${field} ${dataType}`;
    });
    
    sqlStatements.push(alterStatements.join(',\n    '));
    sqlStatements.push(';');
    
    return sqlStatements.join('\n');
  }

  // Mostrar resumen en consola
  displaySummary() {
    console.log('\n📊 RESUMEN DE DISCREPANCIAS CRÍTICAS:');
    console.log('='.repeat(50));
    
    if (this.criticalIssues.length === 0) {
      console.log('✅ No se encontraron discrepancias críticas');
      return;
    }
    
    console.log(`⚠️ Total de problemas críticos: ${this.criticalIssues.length}`);
    
    this.criticalIssues.slice(0, 5).forEach((issue, index) => {
      console.log(`\n${index + 1}. Tabla: ${issue.table} (Severidad: ${issue.severity})`);
      console.log(`   Campos faltantes: ${issue.missingFields.length}`);
      issue.missingFields.slice(0, 5).forEach(field => {
        console.log(`   • ${field}`);
      });
      if (issue.missingFields.length > 5) {
        console.log(`   • ... y ${issue.missingFields.length - 5} más`);
      }
    });
    
    const highSeverityCount = this.criticalIssues.filter(issue => issue.severity >= 50).length;
    if (highSeverityCount > 0) {
      console.log(`\n🚨 PROBLEMAS DE ALTA SEVERIDAD: ${highSeverityCount}`);
      console.log('   Estos problemas deben ser resueltos urgentemente');
    }
  }

  // Método principal
  async runAnalysis() {
    console.log('🚀 Iniciando análisis de discrepancias críticas...');
    
    await this.getDetailedDatabaseStructure();
    this.analyzeCriticalUIFields();
    this.analyzeDatabaseServices();
    this.identifyCriticalDiscrepancies();
    
    const report = this.generateCriticalReport();
    this.displaySummary();
    
    return report;
  }
}

// Ejecutar análisis
async function runCriticalAnalysis() {
  const analyzer = new CriticalDiscrepanciesAnalyzer();
  const report = await analyzer.runAnalysis();
  
  console.log('\n🎯 Análisis crítico completado');
  console.log('📁 Reporte: scripts/critical-discrepancies-report.json');
  
  return report;
}

runCriticalAnalysis().then(report => {
  console.log('\n🏁 Proceso finalizado');
}).catch(error => {
  console.error('❌ Error en el análisis:', error.message);
});