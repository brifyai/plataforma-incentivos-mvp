/**
 * Script de prueba final para verificar los filtros de clientes corporativos
 * en todas las páginas de administración
 */

console.log('🔍 Iniciando prueba final de filtros de clientes corporativos...\n');

// Lista de páginas de administración que deben tener filtros de clientes corporativos
const adminPages = [
  'AdminUsersPage',
  'AdminDebtorsPage', 
  'AdminCompaniesPage',
  'PaymentsDashboard',
  'AdminAnalyticsPage'
];

// Verificar imports del icono Building
console.log('📦 Verificando imports del icono Building...');

const fs = require('fs');
const path = require('path');

adminPages.forEach(page => {
  const filePath = path.join(__dirname, 'src/pages/admin', `${page}.jsx`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasBuildingImport = content.includes('Building') && content.includes("from 'lucide-react'");
    
    console.log(`${hasBuildingImport ? '✅' : '❌'} ${page}: Import Building - ${hasBuildingImport ? 'OK' : 'FALTANTE'}`);
  } catch (error) {
    console.log(`❌ ${page}: Error leyendo archivo - ${error.message}`);
  }
});

// Verificar función getAllCorporateClients en databaseService
console.log('\n🔧 Verificando función getAllCorporateClients...');

try {
  const dbServicePath = path.join(__dirname, 'src/services/databaseService.js');
  const dbContent = fs.readFileSync(dbServicePath, 'utf8');
  
  const hasGetAllCorporateClients = dbContent.includes('export const getAllCorporateClients');
  const usesCorrectTable = dbContent.includes("from('clients')") && dbContent.includes('business_name');
  
  console.log(`${hasGetAllCorporateClients ? '✅' : '❌'} getAllCorporateClients exportada: ${hasGetAllCorporateClients ? 'OK' : 'FALTANTE'}`);
  console.log(`${usesCorrectTable ? '✅' : '❌'} Usa tabla clients correcta: ${usesCorrectTable ? 'OK' : 'INCORRECTO'}`);
} catch (error) {
  console.log(`❌ Error verificando databaseService: ${error.message}`);
}

// Verificar componentes de filtro en cada página
console.log('\n🎛️ Verificando componentes de filtro...');

adminPages.forEach(page => {
  const filePath = path.join(__dirname, 'src/pages/admin', `${page}.jsx`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    const hasFilterCorporateClient = content.includes('filterCorporateClient');
    const hasCorporateClients = content.includes('corporateClients');
    const hasLoadCorporateClients = content.includes('loadCorporateClients');
    const hasFilterComponent = content.includes('Filtrar por cliente') || content.includes('Cliente Corporativo');
    
    console.log(`\n📄 ${page}:`);
    console.log(`  ${hasFilterCorporateClient ? '✅' : '❌'} filterCorporateClient state`);
    console.log(`  ${hasCorporateClients ? '✅' : '❌'} corporateClients state`);
    console.log(`  ${hasLoadCorporateClients ? '✅' : '❌'} loadCorporateClients function`);
    console.log(`  ${hasFilterComponent ? '✅' : '❌'} Filter UI component`);
    
    const allFiltersPresent = hasFilterCorporateClient && hasCorporateClients && 
                             hasLoadCorporateClients && hasFilterComponent;
    console.log(`  ${allFiltersPresent ? '✅' : '❌'} Estado general: ${allFiltersPresent ? 'COMPLETO' : 'INCOMPLETO'}`);
    
  } catch (error) {
    console.log(`❌ ${page}: Error leyendo archivo - ${error.message}`);
  }
});

// Verificar imports de getAllCorporateClients
console.log('\n📥 Verificando imports de getAllCorporateClients...');

adminPages.forEach(page => {
  const filePath = path.join(__dirname, 'src/pages/admin', `${page}.jsx`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasImport = content.includes('getAllCorporateClients') && content.includes('from');
    
    console.log(`${hasImport ? '✅' : '❌'} ${page}: Import getAllCorporateClients - ${hasImport ? 'OK' : 'FALTANTE'}`);
  } catch (error) {
    console.log(`❌ ${page}: Error leyendo archivo - ${error.message}`);
  }
});

// Resumen final
console.log('\n📋 RESUMEN FINAL:');
console.log('=====================================');

let totalChecks = 0;
let passedChecks = 0;

adminPages.forEach(page => {
  const filePath = path.join(__dirname, 'src/pages/admin', `${page}.jsx`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    const checks = [
      content.includes('Building') && content.includes("from 'lucide-react'"),
      content.includes('getAllCorporateClients'),
      content.includes('filterCorporateClient'),
      content.includes('corporateClients'),
      content.includes('loadCorporateClients'),
      content.includes('Filtrar por cliente') || content.includes('Cliente Corporativo')
    ];
    
    const passed = checks.filter(c => c).length;
    totalChecks += checks.length;
    passedChecks += passed;
    
    console.log(`${page}: ${passed}/${checks.length} checks pasados`);
  } catch (error) {
    console.log(`${page}: ERROR - No se pudo verificar`);
  }
});

// Verificar databaseService
try {
  const dbServicePath = path.join(__dirname, 'src/services/databaseService.js');
  const dbContent = fs.readFileSync(dbServicePath, 'utf8');
  
  const dbChecks = [
    dbContent.includes('export const getAllCorporateClients'),
    dbContent.includes("from('clients')"),
    dbContent.includes('business_name')
  ];
  
  const dbPassed = dbChecks.filter(c => c).length;
  totalChecks += dbChecks.length;
  passedChecks += dbPassed;
  
  console.log(`databaseService.js: ${dbPassed}/${dbChecks.length} checks pasados`);
} catch (error) {
  console.log(`databaseService.js: ERROR - No se pudo verificar`);
}

const successRate = totalChecks > 0 ? ((passedChecks / totalChecks) * 100).toFixed(1) : 0;
console.log(`\n🎯 TASA DE ÉXITO GLOBAL: ${passedChecks}/${totalChecks} (${successRate}%)`);

if (successRate >= 90) {
  console.log('🎉 EXCELENTE: Los filtros de clientes corporativos están implementados correctamente!');
} else if (successRate >= 70) {
  console.log('⚠️ BIEN: La mayoría de los filtros están implementados, pero hay algunos detalles por corregir.');
} else {
  console.log('❌ PROBLEMAS: Se necesitan correcciones significativas en los filtros de clientes corporativos.');
}

console.log('\n✅ Prueba final completada');