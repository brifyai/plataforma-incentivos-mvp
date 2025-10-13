/**
 * Script para inicializar base de conocimiento para empresas existentes
 * 
 * Uso:
 * node scripts/initialize_knowledge_base.js
 */

import { initializeExistingCompaniesKnowledgeBase } from '../src/services/knowledgeBaseService.js';

console.log('🚀 Inicializando base de conocimiento para empresas existentes...\n');

async function main() {
  try {
    const result = await initializeExistingCompaniesKnowledgeBase();
    
    console.log('\n📊 RESULTADOS:');
    console.log(`✅ Empresas procesadas: ${result.processed}`);
    
    if (result.errors.length > 0) {
      console.log('\n⚠️ ERRORES:');
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (result.processed > 0) {
      console.log('\n🎉 Base de conocimiento inicializada exitosamente!');
    } else {
      console.log('\nℹ️ No se encontraron empresas sin base de conocimiento.');
    }
    
  } catch (error) {
    console.error('❌ Error ejecutando el script:', error.message);
    process.exit(1);
  }
}

main();