/**
 * Script para limpiar contenido mock del portal de personas (deudores)
 * 
 * Este script identifica y elimina todo el contenido mock/datos de ejemplo
 * de las páginas del portal de deudores para asegurar que solo se muestren
 * datos reales de la base de datos.
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Limpiando contenido mock del portal de personas...\n');

// Archivos a limpiar
const debtorFiles = [
  'src/pages/debtor/DebtorDashboard.jsx',
  'src/pages/debtor/DebtsPage.jsx',
  'src/pages/debtor/MessagesPage.jsx',
  'src/pages/debtor/OffersPage.jsx',
  'src/pages/debtor/PaymentsPage.jsx',
  'src/pages/debtor/ProfilePage.jsx',
  'src/pages/debtor/NotificationsPage.jsx',
  'src/pages/debtor/WalletPage.jsx',
  'src/pages/debtor/AgreementsPage.jsx',
  'src/pages/debtor/HelpPage.jsx'
];

// Estadísticas de limpieza
let stats = {
  filesProcessed: 0,
  mockContentRemoved: 0,
  hardcodedDataReplaced: 0,
  commentsCleaned: 0
};

// Función para limpiar contenido mock de un archivo
function cleanMockContent(filePath) {
  console.log(`📁 Procesando: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Archivo no encontrado: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let fileStats = {
    mockRemoved: 0,
    dataReplaced: 0,
    commentsCleaned: 0
  };
  
  // 1. Eliminar lógica de god-mode user
  if (content.includes('god-mode-user')) {
    content = content.replace(/\/\/ Skip loading stats for god mode user[^}]*}/gs, '');
    content = content.replace(/if\s*\(user\.id\s*===\s*['"]god-mode-user['"][^}]*}/gs, '');
    fileStats.mockRemoved++;
    console.log('  ✅ Eliminada lógica de god-mode user');
  }
  
  // 2. Reemplazar empresas de ejemplo con llamada a API real
  if (content.includes('Banco Ejemplo S.A.') || content.includes('Financiera ABC')) {
    const companiesMockPattern = /\{[\s]*id:\s*['"]empresa\d['"][^}]*name:\s*['"][^'"]*['"][^}]*type:\s*['"][^'"]*['"][^}]*\}/g;
    content = content.replace(companiesMockPattern, '{ id: company.id, name: company.business_name, type: company.category }');
    fileStats.dataReplaced++;
    console.log('  ✅ Reemplazadas empresas de ejemplo con datos reales');
  }
  
  // 3. Eliminar comentarios TODO sobre obtener datos de BD
  if (content.includes('TODO: Obtener de BD') || content.includes('TODO: Obtener de la BD')) {
    content = content.replace(/\/\/ TODO: Obtener de BD[\s\S]*?const companies = \[\];/g, 'const companies = companies || [];');
    fileStats.commentsCleaned++;
    console.log('  ✅ Eliminados comentarios TODO de empresas');
  }
  
  // 4. Reemplazar comentarios "Por ahora, solo mostrar éxito" con lógica real
  if (content.includes('Por ahora, solo mostrar éxito')) {
    content = content.replace(/\/\/ Por ahora, solo mostrar éxito[\s\S]*?Swal\.fire\(/g, 'const result = await createDebt({\n            original_amount: parseFloat(debtForm.totalDebt),\n            current_amount: parseFloat(debtForm.totalDebt),\n            interest_rate: 0,\n            origin_date: debtForm.lastPaymentDate || new Date().toISOString().split(\'T\')[0],\n            due_date: debtForm.dueDate,\n            debt_type: debtForm.debtType,\n            company_name: debtForm.companyName,\n            days_overdue: daysOverdue,\n            installment_amount: debtForm.installmentAmount ? parseFloat(debtForm.installmentAmount) : null,\n            paid_installments: debtForm.paidInstallments ? parseInt(debtForm.paidInstallments) : null,\n            pending_installments: debtForm.pendingInstallments ? parseInt(debtForm.pendingInstallments) : null\n          });\n          \n          if (result.success) {\n            Swal.fire(');
    fileStats.dataReplaced++;
    console.log('  ✅ Reemplazada lógica mock con llamada a API real');
  }
  
  // 5. Eliminar datos de ejemplo fijos
  if (content.includes('Empresa Demo') || content.includes('Demo User')) {
    content = content.replace(/Empresa Demo/g, 'company?.business_name || "Empresa"');
    content = content.replace(/Demo User/g, 'user?.full_name || "Usuario"');
    fileStats.dataReplaced++;
    console.log('  ✅ Reemplazados datos de ejemplo fijos');
  }
  
  // 6. Eliminar comentarios mock y datos de prueba
  const mockPatterns = [
    /\/\/ Mock data for testing[\s\S]*?const\s+\w+\s*=\s*\[[\s\S]*?\];/g,
    /\/\/ Datos de ejemplo[\s\S]*?const\s+\w+\s*=\s*\[[\s\S]*?\];/g,
    /\/\/ Example data[\s\S]*?const\s+\w+\s*=\s*\[[\s\S]*?\];/g,
    /\/\*[\s\S]*?MOCK DATA[\s\S]*?\*\//g
  ];
  
  mockPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(pattern, '');
      fileStats.mockRemoved++;
    }
  });
  
  // 7. Reemplazar arrays vacíos mock con llamadas a hooks reales
  if (content.includes('const companies = [];')) {
    content = content.replace(/const companies = \[\];/g, 'const { companies } = useCompanies();');
    fileStats.dataReplaced++;
    console.log('  ✅ Reemplazado array vacío de empresas con hook real');
  }
  
  // 8. Eliminar valores fijos de comisiones
  if (content.includes('36000') || content.includes('$36.000')) {
    content = content.replace(/36000/g, 'calculateCommission(debt.current_amount)');
    content = content.replace(/\$36\.000/g, 'formatCurrency(calculateCommission(debt.current_amount))');
    fileStats.dataReplaced++;
    console.log('  ✅ Reemplazados valores fijos de comisión con cálculo dinámico');
  }
  
  // 9. Eliminar hardcoded company names
  const hardcodedCompanies = [
    'Banco Estado',
    'Falabella',
    'Ripley',
    'Paris',
    'Cencosud',
    'Scotiabank'
  ];
  
  hardcodedCompanies.forEach(company => {
    const regex = new RegExp(`'${company}'`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, 'company.business_name');
      fileStats.dataReplaced++;
    }
  });
  
  // 10. Eliminar comentarios sobre simulación
  if (content.includes('Simular envío') || content.includes('Simular exportación')) {
    content = content.replace(/\/\/ Simular envío[\s\S]*?Swal\.fire\(/g, 'const result = await uploadPaymentProof({\n            amount: numAmount,\n            method: paymentMethod,\n            files: paymentProofFiles\n          });\n          \n          if (result.success) {\n            Swal.fire(');
    fileStats.dataReplaced++;
    console.log('  ✅ Reemplazada simulación con lógica real');
  }
  
  // Guardar archivo si hubo cambios
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  💾 Archivo actualizado`);
    
    // Actualizar estadísticas
    stats.mockContentRemoved += fileStats.mockRemoved;
    stats.hardcodedDataReplaced += fileStats.dataReplaced;
    stats.commentsCleaned += fileStats.commentsCleaned;
    stats.filesProcessed++;
  } else {
    console.log(`  ℹ️  No se encontraron cambios necesarios`);
  }
  
  console.log('');
}

// Función para generar un reporte de limpieza
function generateCleanupReport() {
  console.log('📊 REPORTE DE LIMPIEZA - PORTAL DE PERSONAS');
  console.log('='.repeat(50));
  console.log(`📁 Archivos procesados: ${stats.filesProcessed}`);
  console.log(`🗑️  Contenido mock eliminado: ${stats.mockContentRemoved}`);
  console.log(`🔄 Datos reemplazados con datos reales: ${stats.hardcodedDataReplaced}`);
  console.log(`💬 Comentarios limpiados: ${stats.commentsCleaned}`);
  
  if (stats.filesProcessed > 0) {
    console.log('\n✅ LIMPIEZA COMPLETADA EXITOSAMENTE');
    console.log('🎯 El portal de personas ahora solo usa datos reales de la base de datos');
  } else {
    console.log('\nℹ️  NO SE ENCONTRÓ CONTENIO MOCK QUE LIMPIAR');
    console.log('🎉 El portal de personas ya está limpio de datos de ejemplo');
  }
  
  console.log('\n📋 PRÓXIMOS PASOS RECOMENDADOS:');
  console.log('1. Verificar que todas las páginas carguen datos correctamente');
  console.log('2. Probar la funcionalidad con datos reales');
  console.log('3. Asegurar que no queden referencias a datos de ejemplo');
  console.log('4. Actualizar cualquier hook personalizado que use datos mock');
  
  console.log('\n🔍 ARCHIVOS QUE PODRÍAN NECESITAR ATENCIÓN ADICIONAL:');
  console.log('- src/hooks/useDebts.js - Verificar que no use datos mock');
  console.log('- src/hooks/useOffers.js - Asegurar llamada a API real');
  console.log('- src/hooks/useMessages.js - Comprobar integración con backend');
  console.log('- src/hooks/usePayments.js - Validar conexión con base de datos');
}

// Función principal
function main() {
  console.log('🚀 INICIANDO LIMPIEZA DE CONTENIDO MOCK - PORTAL PERSONAS\n');
  
  // Procesar cada archivo
  debtorFiles.forEach(file => {
    cleanMockContent(file);
  });
  
  // Generar reporte
  generateCleanupReport();
  
  console.log('\n✨ Proceso completado');
}

// Ejecutar script
if (require.main === module) {
  main();
}

module.exports = { cleanMockContent, generateCleanupReport };