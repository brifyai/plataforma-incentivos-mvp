const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Términos comunes para identificar contenido mock
const mockTerms = [
  'mock', 'demo', 'test', 'fake', 'dummy', 'sample', 'example',
  'TechCorp', 'RetailMax', 'HealthPlus', 'EduSmart', 'FoodCo',
  'Juan Pérez', 'Ana López', 'Carlos Rodríguez', 'María González',
  'john.doe', 'jane.smith', 'admin', 'test@', 'demo@',
  '12345678', '11111111', '22222222', '99999999',
  'Santiago', 'Providencia', 'Las Condes',
  'prueba', 'ejemplo', 'testing'
];

async function analyzeMockContent() {
  console.log('🔍 Analizando todo el contenido mock en NexuPay...\n');

  try {
    // 1. Analizar base de datos
    console.log('📊 ANALIZANDO BASE DE DATOS:');
    await analyzeDatabase();

    // 2. Analizar archivos JavaScript/JSX
    console.log('\n📁 ANALIZANDO ARCHIVOS DE CÓDIGO:');
    await analyzeCodeFiles();

    // 3. Analizar archivos de configuración
    console.log('\n⚙️ ANALIZANDO ARCHIVOS DE CONFIGURACIÓN:');
    await analyzeConfigFiles();

    // 4. Analizar archivos SQL/migraciones
    console.log('\n🗄️ ANALIZANDO ARCHIVOS SQL:');
    await analyzeSQLFiles();

    console.log('\n✅ Análisis completado');

  } catch (error) {
    console.error('❌ Error durante el análisis:', error);
  }
}

async function analyzeDatabase() {
  const tables = [
    'companies', 'users', 'corporate_clients', 'clients', 
    'debts', 'payments', 'campaigns', 'messages', 'offers'
  ];

  for (const table of tables) {
    try {
      console.log(`\n📋 Analizando tabla: ${table}`);
      const { data, error } = await supabase.from(table).select('*').limit(100);
      
      if (error) {
        console.log(`   ❌ Error accessing ${table}: ${error.message}`);
        continue;
      }

      if (!data || data.length === 0) {
        console.log(`   ✅ Tabla ${table} vacía`);
        continue;
      }

      const mockEntries = data.filter(row => {
        const rowStr = JSON.stringify(row).toLowerCase();
        return mockTerms.some(term => rowStr.includes(term.toLowerCase()));
      });

      if (mockEntries.length > 0) {
        console.log(`   ⚠️ Se encontraron ${mockEntries.length} entradas mock en ${table}:`);
        mockEntries.forEach((entry, index) => {
          console.log(`      ${index + 1}. ID: ${entry.id}`);
          // Mostrar campos clave que contienen términos mock
          Object.keys(entry).forEach(key => {
            const value = String(entry[key || '']).toLowerCase();
            const mockTerm = mockTerms.find(term => value.includes(term.toLowerCase()));
            if (mockTerm) {
              console.log(`         ${key}: "${entry[key]}" (contiene "${mockTerm}")`);
            }
          });
        });
      } else {
        console.log(`   ✅ No se encontraron datos mock en ${table}`);
      }
    } catch (error) {
      console.log(`   ❌ Error analyzing ${table}: ${error.message}`);
    }
  }
}

async function analyzeCodeFiles() {
  const srcDir = path.join(__dirname, '../src');
  
  function findJSFiles(dir) {
    const files = [];
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          files.push(...findJSFiles(fullPath));
        } else if (item.endsWith('.js') || item.endsWith('.jsx')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignorar errores de permisos o directorios inexistentes
    }
    
    return files;
  }

  const jsFiles = findJSFiles(srcDir);
  console.log(`   Analizando ${jsFiles.length} archivos JavaScript/JSX...`);

  for (const file of jsFiles.slice(0, 20)) { // Limitar a 20 archivos para no sobrecargar
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      
      let mockFound = false;
      lines.forEach((line, index) => {
        const lineLower = line.toLowerCase();
        const mockTerm = mockTerms.find(term => lineLower.includes(term.toLowerCase()));
        
        if (mockTerm && !line.includes('//') && !line.includes('*')) {
          if (!mockFound) {
            console.log(`\n   📄 ${path.relative(srcDir, file)}:`);
            mockFound = true;
          }
          console.log(`      Línea ${index + 1}: ${line.trim().substring(0, 100)}...`);
        }
      });
    } catch (error) {
      // Ignorar errores de lectura
    }
  }
}

async function analyzeConfigFiles() {
  const configFiles = [
    'package.json', 'tailwind.config.js', '.env.example',
    'vite.config.js', 'tsconfig.json', 'jsconfig.json'
  ];

  for (const file of configFiles) {
    try {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        const mockTerm = mockTerms.find(term => 
          content.toLowerCase().includes(term.toLowerCase())
        );
        
        if (mockTerm) {
          console.log(`   ⚠️ ${file}: contiene término "${mockTerm}"`);
        }
      }
    } catch (error) {
      // Ignorar errores
    }
  }
}

async function analyzeSQLFiles() {
  const sqlDir = path.join(__dirname, '../supabase-migrations');
  
  if (!fs.existsSync(sqlDir)) {
    console.log('   ✅ No se encontró directorio de migraciones SQL');
    return;
  }

  try {
    const sqlFiles = fs.readdirSync(sqlDir).filter(file => file.endsWith('.sql'));
    console.log(`   Analizando ${sqlFiles.length} archivos SQL...`);

    for (const file of sqlFiles.slice(0, 10)) { // Limitar a 10 archivos
      try {
        const filePath = path.join(sqlDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        const mockTerm = mockTerms.find(term => 
          content.toLowerCase().includes(term.toLowerCase())
        );
        
        if (mockTerm) {
          console.log(`   ⚠️ ${file}: contiene término "${mockTerm}"`);
        }
      } catch (error) {
        // Ignorar errores
      }
    }
  } catch (error) {
    console.log('   ❌ Error analizando archivos SQL');
  }
}

analyzeMockContent();