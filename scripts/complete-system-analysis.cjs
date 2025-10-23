// ANÁLISIS COMPLETO DEL SISTEMA NEXUPAY
// Mapeo de todos los campos UI vs Base de Datos para identificar discrepancias

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wvluqdldygmgncqqjkow.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

console.log('🔍 ANÁLISIS COMPLETO DEL SISTEMA NEXUPAY');
console.log('='.repeat(60));
console.log('📋 Mapeando campos UI vs Base de Datos...');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class SystemAnalyzer {
  constructor() {
    this.dbTables = new Map();
    this.uiComponents = new Map();
    this.discrepancies = [];
    this.analysisResults = {
      tablesFound: [],
      uiComponentsFound: [],
      missingColumns: [],
      orphanedUIFields: [],
      databaseOnlyFields: []
    };
  }

  // Paso 1: Analizar estructura completa de la base de datos
  async analyzeDatabaseStructure() {
    console.log('\n📊 PASO 1: Analizando estructura de la base de datos...');
    
    try {
      // Obtener información de todas las tablas
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_type', 'BASE TABLE');

      if (tablesError) {
        console.log('⚠️ No se puede acceder a information_schema, usando método alternativo...');
        
        // Método alternativo: probar tablas conocidas
        const knownTables = [
          'users', 'companies', 'clients', 'debts', 'campaigns', 
          'proposals', 'agreements', 'payments', 'notifications',
          'messages', 'analytics', 'bank_accounts', 'wallet_transactions'
        ];
        
        for (const tableName of knownTables) {
          try {
            const { data, error } = await supabase
              .from(tableName)
              .select('*')
              .limit(1);
            
            if (!error && data) {
              const columns = Object.keys(data[0] || {});
              this.dbTables.set(tableName, columns);
              console.log(`✅ Tabla encontrada: ${tableName} (${columns.length} columnas)`);
            }
          } catch (e) {
            console.log(`❌ Tabla no encontrada: ${tableName}`);
          }
        }
      } else {
        // Método con information_schema
        for (const table of tables) {
          try {
            const { data, error } = await supabase
              .from(table.table_name)
              .select('*')
              .limit(1);
            
            if (!error && data) {
              const columns = Object.keys(data[0] || {});
              this.dbTables.set(table.table_name, columns);
            }
          } catch (e) {
            // Ignorar errores de permisos
          }
        }
      }

      this.analysisResults.tablesFound = Array.from(this.dbTables.keys());
      console.log(`📋 Total tablas encontradas: ${this.dbTables.size}`);

    } catch (error) {
      console.error('❌ Error analizando base de datos:', error.message);
    }
  }

  // Paso 2: Escanear todos los componentes React para encontrar campos de formulario
  scanUIComponents() {
    console.log('\n🎨 PASO 2: Escaneando componentes UI...');
    
    const srcPath = path.join(__dirname, '../src');
    
    const scanDirectory = (dir, componentName = '') => {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath, path.join(componentName, file));
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
          this.analyzeComponent(fullPath, componentName);
        }
      }
    };
    
    scanDirectory(srcPath);
    console.log(`📋 Total componentes analizados: ${this.uiComponents.size}`);
  }

  // Analizar un componente específico
  analyzeComponent(filePath, componentName) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(path.join(__dirname, '../src'), filePath);
      
      // Buscar patrones de campos de formulario
      const patterns = [
        // Form fields
        /name=['"`]([^'"`]+)['"`]/g,
        /placeholder=['"`]([^'"`]+)['"`]/g,
        /label=['"`]([^'"`]+)['"`]/g,
        // State variables
        /const\s+\[([a-zA-Z_][a-zA-Z0-9_]*)\s*,/g,
        /useState\(['"`]([^'"`]+)['"`]\)/g,
        // Database field references
        /\.([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g,
        /set([A-Z][a-zA-Z0-9]*)\(/g,
        // Form validation
        /validate([A-Z][a-zA-Z0-9]*)/g,
        /errors\.([a-zA-Z_][a-zA-Z0-9_]*)/g
      ];
      
      const fields = new Set();
      
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const field = match[1];
          if (field.length > 2 && !field.includes('className') && !field.includes('style')) {
            fields.add(field);
          }
        }
      });
      
      if (fields.size > 0) {
        this.uiComponents.set(relativePath, {
          componentName: componentName || path.basename(filePath, '.jsx'),
          fields: Array.from(fields),
          path: relativePath
        });
      }
      
    } catch (error) {
      // Ignorar errores de lectura
    }
  }

  // Paso 3: Analizar servicios de base de datos
  analyzeDatabaseServices() {
    console.log('\n🔧 PASO 3: Analizando servicios de base de datos...');
    
    const servicesPath = path.join(__dirname, '../src/services');
    
    const scanServices = (dir) => {
      try {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            scanServices(fullPath);
          } else if (file.endsWith('.js') && !file.includes('index')) {
            this.analyzeService(fullPath);
          }
        }
      } catch (error) {
        // Ignorar errores
      }
    };
    
    scanServices(servicesPath);
  }

  analyzeService(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(path.join(__dirname, '../src'), filePath);
      
      // Buscar referencias a tablas y columnas
      const tablePattern = /\.from\(['"`]([^'"`]+)['"`]\)/g;
      const columnPattern = /select\(['"`]([^'"`]+)['"`]\)/g;
      const insertPattern = /insert\(\{([^}]+)\}\)/g;
      const updatePattern = /update\(\{([^}]+)\}\)/g;
      
      const tables = new Set();
      const columns = new Set();
      
      let match;
      while ((match = tablePattern.exec(content)) !== null) {
        tables.add(match[1]);
      }
      
      while ((match = columnPattern.exec(content)) !== null) {
        const cols = match[1].split(',').map(c => c.trim().replace(/['"`]/g, ''));
        cols.forEach(col => {
          if (col && col !== '*') columns.add(col);
        });
      }
      
      if (tables.size > 0) {
        this.uiComponents.set(`service:${relativePath}`, {
          componentName: path.basename(filePath, '.js'),
          fields: Array.from(columns),
          tables: Array.from(tables),
          path: relativePath,
          type: 'service'
        });
      }
      
    } catch (error) {
      // Ignorar errores
    }
  }

  // Paso 4: Identificar discrepancias
  identifyDiscrepancies() {
    console.log('\n🔍 PASO 4: Identificando discrepancias...');
    
    // Para cada tabla, verificar campos faltantes en la UI
    for (const [tableName, dbColumns] of this.dbTables) {
      const uiReferences = [];
      
      // Buscar referencias en componentes UI
      for (const [componentPath, component] of this.uiComponents) {
        if (component.fields) {
          const matchingFields = component.fields.filter(field => 
            dbColumns.some(col => col.toLowerCase().includes(field.toLowerCase()) || 
                                field.toLowerCase().includes(col.toLowerCase()))
          );
          
          if (matchingFields.length > 0) {
            uiReferences.push({
              component: component.componentName,
              path: componentPath,
              fields: matchingFields
            });
          }
        }
      }
      
      // Identificar campos de BD no referenciados en UI
      const referencedDbFields = new Set();
      uiReferences.forEach(ref => {
        ref.fields.forEach(field => {
          const matchingDbField = dbColumns.find(col => 
            col.toLowerCase().includes(field.toLowerCase()) || 
            field.toLowerCase().includes(col.toLowerCase())
          );
          if (matchingDbField) {
            referencedDbFields.add(matchingDbField);
          }
        });
      });
      
      const orphanedDbFields = dbColumns.filter(col => !referencedDbFields.has(col));
      
      if (orphanedDbFields.length > 0) {
        this.analysisResults.databaseOnlyFields.push({
          table: tableName,
          fields: orphanedDbFields
        });
      }
    }
    
    // Identificar campos UI no encontrados en BD
    for (const [componentPath, component] of this.uiComponents) {
      if (component.fields) {
        for (const field of component.fields) {
          let foundInDb = false;
          
          for (const [tableName, dbColumns] of this.dbTables) {
            if (dbColumns.some(col => 
              col.toLowerCase() === field.toLowerCase() || 
              col.toLowerCase().includes(field.toLowerCase()) || 
              field.toLowerCase().includes(col.toLowerCase())
            )) {
              foundInDb = true;
              break;
            }
          }
          
          if (!foundInDb && field.length > 2) {
            this.analysisResults.orphanedUIFields.push({
              component: component.componentName,
              path: componentPath,
              field: field
            });
          }
        }
      }
    }
  }

  // Paso 5: Generar reporte completo
  generateReport() {
    console.log('\n📋 PASO 5: Generando reporte completo...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTables: this.dbTables.size,
        totalComponents: this.uiComponents.size,
        totalDiscrepancies: this.analysisResults.orphanedUIFields.length + this.analysisResults.databaseOnlyFields.length
      },
      databaseStructure: {},
      uiComponents: {},
      discrepancies: {
        missingInDatabase: this.analysisResults.orphanedUIFields,
        missingInUI: this.analysisResults.databaseOnlyFields
      },
      recommendations: []
    };
    
    // Estructura de base de datos
    for (const [tableName, columns] of this.dbTables) {
      report.databaseStructure[tableName] = columns;
    }
    
    // Componentes UI
    for (const [path, component] of this.uiComponents) {
      report.uiComponents[path] = {
        name: component.componentName,
        fields: component.fields,
        type: component.type || 'component'
      };
    }
    
    // Generar recomendaciones
    if (this.analysisResults.orphanedUIFields.length > 0) {
      report.recommendations.push({
        type: 'missing_columns',
        priority: 'high',
        description: `Se encontraron ${this.analysisResults.orphanedUIFields.length} campos en la UI que no existen en la base de datos`,
        fields: this.analysisResults.orphanedUIFields
      });
    }
    
    if (this.analysisResults.databaseOnlyFields.length > 0) {
      report.recommendations.push({
        type: 'missing_ui_fields',
        priority: 'medium',
        description: `Se encontraron ${this.analysisResults.databaseOnlyFields.length} campos en la BD que no se usan en la UI`,
        fields: this.analysisResults.databaseOnlyFields
      });
    }
    
    // Guardar reporte
    const reportPath = path.join(__dirname, 'system-analysis-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`✅ Reporte guardado en: ${reportPath}`);
    
    return report;
  }

  // Método principal para ejecutar todo el análisis
  async runCompleteAnalysis() {
    console.log('🚀 Iniciando análisis completo del sistema...');
    
    await this.analyzeDatabaseStructure();
    this.scanUIComponents();
    this.analyzeDatabaseServices();
    this.identifyDiscrepancies();
    
    const report = this.generateReport();
    
    // Mostrar resumen en consola
    console.log('\n📊 RESUMEN DEL ANÁLISIS:');
    console.log('='.repeat(40));
    console.log(`📋 Tablas encontradas: ${report.summary.totalTables}`);
    console.log(`🎨 Componentes analizados: ${report.summary.totalComponents}`);
    console.log(`⚠️ Discrepancias totales: ${report.summary.totalDiscrepancies}`);
    
    if (report.discrepancies.missingInDatabase.length > 0) {
      console.log(`\n❌ Campos UI no encontrados en BD: ${report.discrepancies.missingInDatabase.length}`);
      report.discrepancies.missingInDatabase.slice(0, 5).forEach(item => {
        console.log(`   • ${item.component}: ${item.field}`);
      });
    }
    
    if (report.discrepancies.missingInUI.length > 0) {
      console.log(`\n⚠️ Campos BD no usados en UI: ${report.discrepancies.missingInUI.length}`);
      report.discrepancies.missingInUI.slice(0, 5).forEach(item => {
        console.log(`   • ${item.table}: ${item.fields.join(', ')}`);
      });
    }
    
    console.log('\n🎯 Análisis completado');
    
    return report;
  }
}

// Ejecutar análisis
async function runAnalysis() {
  const analyzer = new SystemAnalyzer();
  const report = await analyzer.runCompleteAnalysis();
  
  console.log('\n📋 Reporte generado exitosamente');
  console.log('📁 Archivo: scripts/system-analysis-report.json');
  
  return report;
}

runAnalysis().then(report => {
  console.log('\n🏁 Proceso finalizado');
}).catch(error => {
  console.error('❌ Error en el análisis:', error.message);
});