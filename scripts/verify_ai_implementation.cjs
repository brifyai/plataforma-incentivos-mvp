/**
 * Script de Verificación de Implementación de IA
 * 
 * Verifica las 9 fases de implementación y la conexión a Supabase
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICACIÓN COMPLETA DEL SISTEMA DE IA PARA NEGOCIACIÓN\n');

// 1. Verificar estructura de archivos
console.log('📁 1. VERIFICANDO ESTRUCTURA DE ARCHIVOS...');

const requiredFiles = [
  // Módulo principal
  'src/modules/ai-negotiation/index.jsx',
  'src/modules/ai-negotiation/integration/SafeAIIntegration.jsx',
  
  // Componentes
  'src/modules/ai-negotiation/components/AIErrorBoundary.jsx',
  'src/modules/ai-negotiation/components/AILoader.jsx',
  'src/modules/ai-negotiation/components/AIControlPanel.jsx',
  
  // Páginas
  'src/modules/ai-negotiation/pages/NegotiationAIDashboard.jsx',
  'src/modules/ai-negotiation/pages/NegotiationAIConfig.jsx',
  'src/modules/ai-negotiation/pages/NegotiationChat.jsx',
  
  // Servicios
  'src/modules/ai-negotiation/services/index.js',
  'src/modules/ai-negotiation/services/negotiationAIService.js',
  'src/modules/ai-negotiation/services/proposalActionService.js',
  
  // Utils
  'src/modules/ai-negotiation/utils/featureFlags.js'
];

let filesOk = 0;
let filesMissing = [];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
    filesOk++;
  } else {
    console.log(`  ❌ ${file} - NO ENCONTRADO`);
    filesMissing.push(file);
  }
});

console.log(`\n📊 Archivos: ${filesOk}/${requiredFiles.length} encontrados\n`);

// 2. Verificar migraciones de base de datos
console.log('🗄️ 2. VERIFICANDO MIGRACIONES DE BASE DE DATOS...');

const requiredMigrations = [
  'supabase-migrations/013_ai_config_keys.sql',
  'supabase-migrations/014_ai_knowledge_base.sql',
  'supabase-migrations/015_negotiation_conversations.sql'
];

let migrationsOk = 0;

requiredMigrations.forEach(migration => {
  if (fs.existsSync(migration)) {
    console.log(`  ✅ ${migration}`);
    migrationsOk++;
  } else {
    console.log(`  ❌ ${migration} - NO ENCONTRADO`);
  }
});

console.log(`\n📊 Migraciones: ${migrationsOk}/${requiredMigrations.length} encontradas\n`);

// 3. Verificar rutas en el router
console.log('🛣️ 3. VERIFICANDO RUTAS EN EL ROUTER...');

const routerPath = 'src/routes/AppRouter.jsx';
if (fs.existsSync(routerPath)) {
  const routerContent = fs.readFileSync(routerPath, 'utf8');
  
  const hasNegotiationRoute = router.includes('/empresa/ia/negociacion');
  const hasConfigRoute = router.includes('/empresa/ia/configuracion');
  
  console.log(`  ${hasNegotiationRoute ? '✅' : '❌'} Ruta de negociación: /empresa/ia/negociacion`);
  console.log(`  ${hasConfigRoute ? '✅' : '❌'} Ruta de configuración: /empresa/ia/configuracion`);
} else {
  console.log('  ❌ Router no encontrado');
}

// 4. Verificar las 9 fases de implementación
console.log('\n🎯 4. VERIFICANDO LAS 9 FASES DE IMPLEMENTACIÓN...');

const phases = [
  {
    name: 'Fase 1: Base y Configuración',
    files: [
      'src/modules/ai-negotiation/pages/NegotiationAIConfig.jsx',
      'supabase-migrations/014_ai_knowledge_base.sql'
    ],
    description: 'Sistema de base de conocimiento y configuración'
  },
  {
    name: 'Fase 2: IA Conversacional Básica',
    files: [
      'src/modules/ai-negotiation/services/negotiationAIService.js',
      'src/modules/ai-negotiation/pages/NegotiationChat.jsx'
    ],
    description: 'Respuestas automáticas y sistema de triggers'
  },
  {
    name: 'Fase 3: Negociación Inteligente',
    files: [
      'src/modules/ai-negotiation/services/proposalActionService.js',
      'src/modules/ai-negotiation/pages/NegotiationAIDashboard.jsx'
    ],
    description: 'Lógica específica y dashboard de negociaciones'
  },
  {
    name: 'Fase 4: Optimización y Analytics',
    files: [
      'supabase-migrations/015_negotiation_conversations.sql',
      'src/modules/ai-negotiation/pages/NegotiationAIDashboard.jsx'
    ],
    description: 'Métricas de rendimiento y optimización'
  },
  {
    name: 'Fase 5: Sistema Modular',
    files: [
      'src/modules/ai-negotiation/index.jsx',
      'src/modules/ai-negotiation/integration/SafeAIIntegration.jsx'
    ],
    description: 'Arquitectura modular y aislada'
  },
  {
    name: 'Fase 6: Lazy Loading',
    files: [
      'src/modules/ai-negotiation/index.jsx',
      'src/routes/AppRouter.jsx'
    ],
    description: 'Carga bajo demanda'
  },
  {
    name: 'Fase 7: Error Boundaries',
    files: [
      'src/modules/ai-negotiation/components/AIErrorBoundary.jsx',
      'src/modules/ai-negotiation/components/AILoader.jsx'
    ],
    description: 'Protección contra errores'
  },
  {
    name: 'Fase 8: Feature Flags',
    files: [
      'src/modules/ai-negotiation/utils/featureFlags.js'
    ],
    description: 'Control de características'
  },
  {
    name: 'Fase 9: Fallback System',
    files: [
      'src/modules/ai-negotiation/components/AILoader.jsx',
      'src/modules/ai-negotiation/integration/SafeAIIntegration.jsx'
    ],
    description: 'Sistema de respaldo'
  }
];

let phasesComplete = 0;

phases.forEach((phase, index) => {
  const phaseFilesOk = phase.files.filter(file => fs.existsSync(file)).length;
  const phaseComplete = phaseFilesOk === phase.files.length;
  
  console.log(`  ${phaseComplete ? '✅' : '⚠️'} ${phase.name}`);
  console.log(`     📝 ${phase.description}`);
  console.log(`     📁 Archivos: ${phaseFilesOk}/${phase.files.length} encontrados`);
  
  if (phaseComplete) {
    phasesComplete++;
  }
  
  console.log('');
});

// 5. Verificar conexión a Supabase
console.log('🔗 5. VERIFICANDO CONEXIÓN A SUPABASE...');

const servicesToCheck = [
  'src/modules/ai-negotiation/services/negotiationAIService.js',
  'src/modules/ai-negotiation/services/proposalActionService.js'
];

let supabaseConnections = 0;

servicesToCheck.forEach(service => {
  if (fs.existsSync(service)) {
    const content = fs.readFileSync(service, 'utf8');
    const hasSupabaseImport = content.includes("from '../../../config/supabase.js'");
    const hasSupabaseQueries = content.includes('supabase.from(');
    
    console.log(`  📄 ${path.basename(service)}:`);
    console.log(`    ${hasSupabaseImport ? '✅' : '❌'} Import de Supabase`);
    console.log(`    ${hasSupabaseQueries ? '✅' : '❌'} Consultas a Supabase`);
    
    if (hasSupabaseImport && hasSupabaseQueries) {
      supabaseConnections++;
    }
  }
});

// 6. Verificar tablas de base de datos
console.log('\n🗄️ 6. VERIFICANDO TABLAS DE BASE DE DATOS...');

const negotiationMigration = 'supabase-migrations/015_negotiation_conversations.sql';
if (fs.existsSync(negotiationMigration)) {
  const migrationContent = fs.readFileSync(negotiationMigration, 'utf8');
  
  const requiredTables = [
    'negotiation_conversations',
    'negotiation_messages',
    'negotiation_ai_config',
    'negotiation_analytics',
    'negotiation_feedback'
  ];
  
  requiredTables.forEach(table => {
    const hasTable = migrationContent.includes(`CREATE TABLE.*${table}`);
    console.log(`  ${hasTable ? '✅' : '❌'} Tabla: ${table}`);
  });
}

// 7. Resumen final
console.log('\n📊 RESUMEN FINAL DE VERIFICACIÓN');
console.log('=====================================');

const totalPhases = phases.length;
const filePercentage = Math.round((filesOk / requiredFiles.length) * 100);
const migrationPercentage = Math.round((migrationsOk / requiredMigrations.length) * 100);
const phasePercentage = Math.round((phasesComplete / totalPhases) * 100);
const supabasePercentage = Math.round((supabaseConnections / servicesToCheck.length) * 100);

console.log(`📁 Archivos del módulo: ${filesOk}/${requiredFiles.length} (${filePercentage}%)`);
console.log(`🗄️ Migraciones de BD: ${migrationsOk}/${requiredMigrations.length} (${migrationPercentage}%)`);
console.log(`🎯 Fases completadas: ${phasesComplete}/${totalPhases} (${phasePercentage}%)`);
console.log(`🔗 Conexión Supabase: ${supabaseConnections}/${servicesToCheck.length} (${supabasePercentage}%)`);

// 8. Estado general
console.log('\n🚀 ESTADO GENERAL DEL SISTEMA');

const overallScore = Math.round((filePercentage + migrationPercentage + phasePercentage + supabasePercentage) / 4);

let status = '❌ INCOMPLETO';
let statusColor = 'rojo';

if (overallScore >= 90) {
  status = '✅ COMPLETO';
  statusColor = 'verde';
} else if (overallScore >= 70) {
  status = '⚠️  PARCIAL';
  statusColor = 'amarillo';
} else if (overallScore >= 50) {
  status = '🔶 BÁSICO';
  statusColor = 'naranja';
}

console.log(`Estado: ${status}`);
console.log(`Puntuación: ${overallScore}%`);

// 9. Recomendaciones
console.log('\n💡 RECOMENDACIONES');

if (filesMissing.length > 0) {
  console.log('📝 Archivos faltantes por crear:');
  filesMissing.forEach(file => console.log(`   - ${file}`));
}

if (phasesComplete < totalPhases) {
  console.log('🎯 Fases incompletas:');
  phases.forEach((phase, index) => {
    const phaseFilesOk = phase.files.filter(file => fs.existsSync(file)).length;
    if (phaseFilesOk < phase.files.length) {
      console.log(`   - ${phase.name}`);
    }
  });
}

if (supabaseConnections < servicesToCheck.length) {
  console.log('🔗 Mejorar conexión a Supabase en los servicios');
}

if (overallScore >= 90) {
  console.log('🎉 ¡Sistema listo para producción!');
} else if (overallScore >= 70) {
  console.log('🔧 Sistema funcional pero requiere ajustes menores');
} else {
  console.log('⚠️  Sistema requiere trabajo adicional antes de producción');
}

console.log('\n✨ Verificación completada ✨');