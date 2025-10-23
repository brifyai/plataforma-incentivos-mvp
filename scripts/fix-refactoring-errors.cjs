#!/usr/bin/env node

/**
 * Script de Reparación de Errores de Refactorización
 * 
 * Corrige los errores de sintaxis introducidos durante la refactorización.
 */

const fs = require('fs');
const path = require('path');

// Configuración
const CONFIG = {
  sourceDir: 'src/pages/company',
  backupDir: 'backup/before-safe-refactor'
};

// Función para reparar errores de sintaxis comunes
function fixSyntaxErrors(content) {
  let fixed = content;
  
  // 1. Reparar puntos y comas faltantes en bloques catch
  fixed = fixed.replace(/(\s+)}\s+catch\s*\(/g, '$1};\n    } catch (');
  
  // 2. Reparar asignaciones de variables malformadas
  fixed = fixed.replace(/const\s+(\w+)\s*=\s*\(\s*\)\s*=>\s*{\s*([^}]+)\s*},\s*\[\];/g, 
    'const [$1] = useState($2);');
  
  // 3. Reparar funciones con sintaxis incorrecta
  fixed = fixed.replace(/const\s+(\w+)\s*=\s*\(\s*\)\s*=>\s*{\s*([^}]+)\s*}/g, 
    'const $1 = () => {\n    $2\n  };');
  
  // 4. Reparar await fuera de contexto async
  fixed = fixed.replace(/const\s+({[^}]+})\s*=\s*await\s+([^;]+);/g, 
    'const $1 = await $2;');
  
  // 5. Reparar objetos en funciones async
  fixed = fixed.replace(/const\s+handleConfirmFilters\s*=\s*async\s*\(\s*\)\s*=>\s*{\s*icon:/g, 
    'const handleConfirmFilters = async () => {\n    await Swal.fire({\n      icon:');
  
  // 6. Reparar declaraciones const con sintaxis incorrecta
  fixed = fixed.replace(/const\s+(\w+)\s*=\s*\(\s*\)\s*=>\s*{\s*([^{]+)\s*},\s*\[\];/g,
    'useEffect(() => {\n    $2\n  }, []);');
  
  // 7. Reparar funciones de componente malformadas
  fixed = fixed.replace(/const\s+(\w+)\s*=\s*\(\s*\)\s*=>\s*{\s*([^{]+)\s*}/g,
    'const $1 = () => {\n    $2\n  };');
  
  // 8. Reparar bloques try/catch con sintaxis incorrecta
  fixed = fixed.replace(/}\s+catch\s*\(/g, '  } catch (');
  
  // 9. Reparar asignaciones destructuring malformadas
  fixed = fixed.replace(/const\s+({[^}]+})\s*=\s*await\s+([^;]+);/g,
    'const $1 = await $2;');
  
  return fixed;
}

// Función para reparar archivos específicos
function fixSpecificFiles(filePath, content) {
  let fixed = content;
  
  // Reparaciones específicas para archivos conocidos
  if (filePath.includes('AgreementDetailsPage.jsx')) {
    fixed = fixed.replace(/(\s+)}\s+catch\s*\(/g, '$1};\n    } catch (');
  }
  
  if (filePath.includes('NewDebtorPage.jsx')) {
    fixed = fixed.replace(/},\s*\[\];/g, '\n  }, []);');
  }
  
  if (filePath.includes('OffersPage.jsx')) {
    fixed = fixed.replace(/(\s+)}\s+catch\s*\(/g, '$1};\n    } catch (');
  }
  
  if (filePath.includes('TransferDashboard.jsx')) {
    fixed = fixed.replace(/const\s+({[^}]+})\s*=\s*await\s+([^;]+);/g,
      'const $1 = await $2;');
  }
  
  if (filePath.includes('NewMessagePage.jsx')) {
    fixed = fixed.replace(/const\s+handleConfirmFilters\s*=\s*async\s*\(\s*\)\s*=>\s*{\s*icon:/g,
      'const handleConfirmFilters = async () => {\n    await Swal.fire({\n      icon:');
  }
  
  if (filePath.includes('ProposalsPage.jsx')) {
    fixed = fixed.replace(/const\s+ProposalsPage\s*=\s*\(\s*\)\s*=>\s*{\s*loading,/g,
      'const ProposalsPage = () => {\n  const {\n    loading,');
  }
  
  return fixed;
}

// Función principal de reparación
async function fixRefactoringErrors() {
  console.log('🔧 Reparando errores de sintaxis de la refactorización...');
  
  function getAllJsxFiles(dir) {
    const files = [];
    
    function traverse(currentDir) {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          traverse(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.jsx')) {
          files.push(fullPath);
        }
      }
    }
    
    traverse(dir);
    return files;
  }
  
  const jsxFiles = getAllJsxFiles(CONFIG.sourceDir);
  console.log(`📄 Se encontraron ${jsxFiles.length} archivos para reparar`);
  
  let fixedCount = 0;
  let errorCount = 0;
  
  for (const filePath of jsxFiles) {
    try {
      console.log(`🔄 Reparando: ${filePath}`);
      
      const originalContent = fs.readFileSync(filePath, 'utf8');
      let fixedContent = originalContent;
      
      // Aplicar reparaciones generales
      fixedContent = fixSyntaxErrors(fixedContent);
      
      // Aplicar reparaciones específicas
      fixedContent = fixSpecificFiles(filePath, fixedContent);
      
      // Solo escribir si hubo cambios
      if (fixedContent !== originalContent) {
        fs.writeFileSync(filePath, fixedContent, 'utf8');
        console.log(`✅ Reparado: ${filePath}`);
        fixedCount++;
      } else {
        console.log(`⏭️  Sin reparaciones necesarias: ${filePath}`);
      }
      
    } catch (error) {
      console.error(`❌ Error reparando ${filePath}:`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n🎉 Reparación completada');
  console.log(`📊 Resumen:`);
  console.log(`   - Archivos procesados: ${jsxFiles.length}`);
  console.log(`   - Archivos reparados: ${fixedCount}`);
  console.log(`   - Errores: ${errorCount}`);
  
  if (errorCount > 0) {
    console.log('\n⚠️  Se encontraron errores durante la reparación.');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixRefactoringErrors().catch(console.error);
}

module.exports = { fixRefactoringErrors };