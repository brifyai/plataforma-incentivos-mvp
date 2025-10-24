/**
 * Verificación de Correcciones de Mapeo UI-BD
 * 
 * Este script verifica que las inconsistencias críticas identificadas
 * han sido corregidas correctamente en ProfilePage.jsx
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICACIÓN DE CORRECCIONES DE MAPEO UI-BD');
console.log('================================================================================');

// Archivo a verificar
const profilePagePath = path.join(__dirname, '../src/pages/company/ProfilePage.jsx');

if (!fs.existsSync(profilePagePath)) {
  console.error('❌ ProfilePage.jsx no encontrado');
  process.exit(1);
}

const content = fs.readFileSync(profilePagePath, 'utf8');

console.log('📋 Verificando correcciones críticas...\n');

// Verificación 1: Uso correcto de legal_representative_name en carga de datos
const verificationChecks = [
  {
    name: 'Carga de representante legal para empresas',
    pattern: /legal_representative_name:\s*profile\.company\.legal_representative_name/g,
    expected: true,
    description: 'Debe usar profile.company.legal_representative_name'
  },
  {
    name: 'Carga de RUT de representante legal para empresas',
    pattern: /legal_representative_rut:\s*profile\.company\.legal_representative_rut/g,
    expected: true,
    description: 'Debe usar profile.company.legal_representative_rut'
  },
  {
    name: 'Guardado de representante legal en userUpdates',
    pattern: /full_name:\s*formData\.legal_representative_name/g,
    expected: true,
    description: 'Debe usar formData.legal_representative_name para full_name del usuario'
  },
  {
    name: 'Guardado de RUT de representante legal en userUpdates',
    pattern: /rut:\s*formData\.legal_representative_rut/g,
    expected: true,
    description: 'Debe usar formData.legal_representative_rut para rut del usuario'
  },
  {
    name: 'Actualización de formulario en modo god_mode',
    pattern: /legal_representative_name:\s*formData\.legal_representative_name/g,
    expected: true,
    description: 'Debe actualizar formData.legal_representative_name'
  },
  {
    name: 'Uso en cambio de email',
    pattern: /formData\.legal_representative_name\s*\|\|\s*user\.user_metadata\?\.full_name/g,
    expected: true,
    description: 'Debe usar legal_representative_name como primera opción'
  }
];

let allPassed = true;
let passedChecks = 0;
let totalChecks = verificationChecks.length;

verificationChecks.forEach((check, index) => {
  const matches = content.match(check.pattern);
  const passed = matches ? matches.length > 0 : false;
  
  if (passed === check.expected) {
    console.log(`✅ ${index + 1}. ${check.name}`);
    console.log(`   ${check.description}`);
    console.log(`   Estado: CORRECTO`);
    passedChecks++;
  } else {
    console.log(`❌ ${index + 1}. ${check.name}`);
    console.log(`   ${check.description}`);
    console.log(`   Estado: INCORRECTO - ${passed ? 'Encontrado' : 'No encontrado'}`);
    allPassed = false;
  }
  console.log('');
});

// Verificación 2: Ausencia de patrones incorrectos
console.log('🚫 Verificando ausencia de patrones incorrectos...\n');

const incorrectPatterns = [
  {
    name: 'Uso incorrecto de full_name para representante legal',
    pattern: /full_name:\s*profile\?\.full_name/g,
    expected: false,
    description: 'No debe usar profile?.full_name para representante legal'
  },
  {
    name: 'Uso incorrecto de representative_rut',
    pattern: /rut:\s*formData\.representative_rut/g,
    expected: false,
    description: 'No debe usar formData.representative_rut'
  },
  {
    name: 'Uso incorrecto de full_name en actualización',
    pattern: /full_name:\s*formData\.full_name/g,
    expected: false,
    description: 'No debe usar formData.full_name para representante legal'
  }
];

incorrectPatterns.forEach((check, index) => {
  const matches = content.match(check.pattern);
  const passed = !matches || matches.length === 0;
  
  if (passed) { // Si no hay patrones incorrectos, es CORRECTO
    console.log(`✅ ${index + 1}. ${check.name}`);
    console.log(`   ${check.description}`);
    console.log(`   Estado: CORRECTO - No se encontraron patrones incorrectos`);
    passedChecks++;
  } else {
    console.log(`❌ ${index + 1}. ${check.name}`);
    console.log(`   ${check.description}`);
    console.log(`   Estado: INCORRECTO - Se encontraron ${matches ? matches.length : 0} instancias incorrectas`);
    allPassed = false;
  }
  console.log('');
});

// Verificación 3: Estructura de datos bancarios
console.log('🏦 Verificando estructura de datos bancarios...\n');

const bankAccountChecks = [
  {
    name: 'Estructura JSON para bank_account_info',
    pattern: /bank_account_info\s*=\s*\{/g,
    expected: true,
    description: 'Debe mantener estructura JSON anidada para datos bancarios'
  },
  {
    name: 'Campos bancarios en formData',
    pattern: /bankName|accountType|accountNumber|accountHolderName|accountHolderRut/g,
    expected: true,
    description: 'Debe mantener campos bancarios individuales en formData'
  }
];

bankAccountChecks.forEach((check, index) => {
  const matches = content.match(check.pattern);
  const passed = matches ? matches.length > 0 : false;
  
  if (passed === check.expected) {
    console.log(`✅ ${index + 1}. ${check.name}`);
    console.log(`   ${check.description}`);
    console.log(`   Estado: CORRECTO`);
    passedChecks++;
  } else {
    console.log(`❌ ${index + 1}. ${check.name}`);
    console.log(`   ${check.description}`);
    console.log(`   Estado: INCORRECTO`);
    allPassed = false;
  }
  console.log('');
});

// Resumen final
console.log('📊 RESUMEN DE VERIFICACIÓN:');
console.log('');
console.log(`✅ Verificaciones pasadas: ${passedChecks}/${totalChecks + incorrectPatterns.length + bankAccountChecks.length}`);
console.log(`📈 Porcentaje de éxito: ${Math.round((passedChecks / (totalChecks + incorrectPatterns.length + bankAccountChecks.length)) * 100)}%`);
console.log('');

if (allPassed) {
  console.log('🎉 ¡TODAS LAS CORRECCIONES HAN SIDO VERIFICADAS EXITOSAMENTE!');
  console.log('');
  console.log('✅ Inconsistencias críticas corregidas:');
  console.log('   - Representante legal usa campos correctos');
  console.log('   - RUT de representante usa campo correcto');
  console.log('   - Estructura de datos bancarios mantenida');
  console.log('   - No hay patrones incorrectos残留');
  console.log('');
  console.log('🚀 El sistema ahora tiene mapeo UI-BD consistente y correcto.');
} else {
  console.log('⚠️  AÚN HAY PROBLEMAS POR CORREGIR:');
  console.log('');
  console.log('❌ Acciones requeridas:');
  console.log('   - Revisar las verificaciones fallidas');
  console.log('   - Corregir los patrones incorrectos');
  console.log('   - Verificar estructura de datos bancarios');
  console.log('');
  console.log('🔧 Ejecutar nuevamente las correcciones necesarias.');
}

// Guardar resultado de verificación
const verificationResult = {
  fecha_verificacion: new Date().toISOString(),
  archivo_verificado: 'src/pages/company/ProfilePage.jsx',
  verificaciones_pasadas: passedChecks,
  total_verificaciones: totalChecks + incorrectPatterns.length + bankAccountChecks.length,
  porcentaje_exito: Math.round((passedChecks / (totalChecks + incorrectPatterns.length + bankAccountChecks.length)) * 100),
  todas_correctas: allPassed,
  detalles: {
    correcciones_criticas: verificationChecks.map(check => ({
      nombre: check.name,
      descripcion: check.description,
      patron: check.pattern.toString(),
      correcto: content.match(check.pattern) ? content.match(check.pattern).length > 0 : false
    })),
    patrones_incorrectos: incorrectPatterns.map(check => ({
      nombre: check.name,
      descripcion: check.description,
      patron: check.pattern.toString(),
      ausente: !content.match(check.pattern) || content.match(check.pattern).length === 0
    })),
    estructura_bancaria: bankAccountChecks.map(check => ({
      nombre: check.name,
      descripcion: check.description,
      patron: check.pattern.toString(),
      correcto: content.match(check.pattern) ? content.match(check.pattern).length > 0 : false
    }))
  }
};

fs.writeFileSync(
  path.join(__dirname, 'verificacion-correcciones-mapeo.json'),
  JSON.stringify(verificationResult, null, 2)
);

console.log('');
console.log('📄 Resultado guardado en: verificacion-correcciones-mapeo.json');
console.log('🎯 Verificación completada');