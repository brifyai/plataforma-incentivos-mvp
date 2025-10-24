const fs = require('fs');
const path = require('path');

/**
 * ANÁLISIS COMPLETO DE INCONSISTENCIAS DE MAPEO UI-BD
 * 
 * Este script identifica todas las inconsistencias entre los campos
 * utilizados en la interfaz de usuario y los campos reales de la base de datos.
 */

console.log('🔍 ANÁLISIS COMPLETO DE INCONSISTENCIAS DE MAPEO UI-BD');
console.log('=' .repeat(80));

// Inconsistencias encontradas basadas en el análisis de código
const inconsistencias = [
  {
    tipo: 'CRÍTICO',
    categoria: 'Representante Legal',
    problema: 'Uso incorrecto de campos en ProfilePage.jsx',
    detalles: [
      'Línea 158: Usa profile?.full_name en lugar de profile.company.legal_representative_name',
      'Línea 355: Guarda en representative_rut en lugar de legal_representative_rut',
      'Línea 431: Actualiza formData.full_name en lugar de formData.legal_representative_name'
    ],
    impacto: 'Los datos del representante legal no se guardan correctamente',
    archivos_afectados: ['src/pages/company/ProfilePage.jsx'],
    solucion: 'Usar siempre legal_representative_name y legal_representative_rut desde la tabla companies'
  },
  {
    tipo: 'MEDIO',
    categoria: 'Datos Bancarios',
    problema: 'Uso de campos genéricos en lugar de estructura JSON',
    detalles: [
      'Uso de bankName, accountType, accountNumber como campos separados',
      'La BD usa bank_account_info como JSON con estructura anidada'
    ],
    impacto: 'Los datos bancarios pueden no mapearse correctamente',
    archivos_afectados: ['src/pages/company/ProfilePage.jsx', 'src/components/company/CompanyInformationSection.jsx'],
    solucion: 'Mantener estructura JSON en bank_account_info'
  },
  {
    tipo: 'BAJO',
    categoria: 'Nomenclatura inconsistente',
    problema: 'Mezcla de convenciones de nomenclatura',
    detalles: [
      'full_name vs legal_representative_name',
      'representative_rut vs legal_representative_rut',
      'user_metadata.full_name vs users.full_name'
    ],
    impacto: 'Confusión en el mantenimiento del código',
    archivos_afectados: 'Múltiples archivos',
    solucion: 'Estandarizar convenciones de nomenclatura'
  }
];

// Análisis específico de campos problemáticos
const analisis_campos = {
  'full_name': {
    usos_correctos: [
      'Tabla users - campo principal para nombre de usuarios',
      'user_metadata.full_name - para metadatos de autenticación'
    ],
    usos_incorrectos: [
      'ProfilePage.jsx - línea 158: Usado para representante legal (debería ser legal_representative_name)',
      'ProfilePage.jsx - línea 355: Guardado como representative_rut (debería ser legal_representative_rut)'
    ],
    recomendacion: 'Usar full_name solo para usuarios, legal_representative_name para representantes legales de empresas'
  },
  'representative_rut': {
    usos_correctos: [],
    usos_incorrectos: [
      'ProfilePage.jsx - línea 356: Usado en lugar de legal_representative_rut'
    ],
    recomendacion: 'Reemplazar todos los usos por legal_representative_rut'
  },
  'legal_representative_name': {
    usos_correctos: [
      'Tabla companies - campo correcto para representante legal',
      'CompanyInformationSection.jsx - línea 122: Uso correcto en formulario'
    ],
    usos_incorrectos: [
      'ProfilePage.jsx - No se usa consistentemente en carga/guardado'
    ],
    recomendacion: 'Usar consistentemente en todas las operaciones de empresas'
  },
  'legal_representative_rut': {
    usos_correctos: [
      'Tabla companies - campo correcto para RUT de representante legal',
      'CompanyInformationSection.jsx - línea 141: Uso correcto en formulario'
    ],
    usos_incorrectos: [
      'ProfilePage.jsx - No se usa consistentemente en carga/guardado'
    ],
    recomendacion: 'Usar consistentemente en todas las operaciones de empresas'
  },
  'bank_account_info': {
    usos_correctos: [
      'Tabla companies - campo JSON para datos bancarios',
      'ProfilePage.jsx - línea 392-399: Uso correcto para guardar'
    ],
    usos_incorrectos: [
      'Uso de campos separados (bankName, accountType) en lugar de estructura JSON'
    ],
    recomendacion: 'Mantener siempre estructura JSON anidada'
  }
};

// Estándares recomendados
const estandares_recomendados = {
  usuarios: {
    tabla: 'users',
    campos: {
      nombre: 'full_name',
      email: 'email',
      rut: 'rut',
      telefono: 'phone'
    }
  },
  empresas: {
    tabla: 'companies',
    campos: {
      nombre_empresa: 'company_name',
      email_contacto: 'contact_email',
      telefono_contacto: 'contact_phone',
      rut_empresa: 'rut',
      representante_legal_nombre: 'legal_representative_name',
      representante_legal_rut: 'legal_representative_rut',
      tipo_empresa: 'company_type',
      datos_bancarios: 'bank_account_info (JSON)'
    }
  },
  deudores: {
    tabla: 'users (role: debtor)',
    campos: {
      nombre: 'full_name',
      email: 'email',
      rut: 'rut',
      telefono: 'phone'
    }
  }
};

console.log('📊 INCONSISTENCIAS ENCONTRADAS:');
console.log('');

inconsistencias.forEach((inc, index) => {
  console.log(`${index + 1}. [${inc.tipo}] ${inc.categoria}`);
  console.log(`   Problema: ${inc.problema}`);
  console.log(`   Impacto: ${inc.impacto}`);
  console.log(`   Archivos afectados: ${Array.isArray(inc.archivos_afectados) ? inc.archivos_afectados.join(', ') : inc.archivos_afectados}`);
  console.log(`   Solución: ${inc.solucion}`);
  console.log('   Detalles:');
  inc.detalles.forEach(detalle => {
    console.log(`     - ${detalle}`);
  });
  console.log('');
});

console.log('🔍 ANÁLISIS DETALLADO DE CAMPOS:');
console.log('');

Object.entries(analisis_campos).forEach(([campo, analisis]) => {
  console.log(`📋 ${campo}:`);
  console.log(`   ✅ Usos correctos:`);
  analisis.usos_correctos.forEach(uso => {
    console.log(`     - ${uso}`);
  });
  if (analisis.usos_incorrectos.length > 0) {
    console.log(`   ❌ Usos incorrectos:`);
    analisis.usos_incorrectos.forEach(uso => {
      console.log(`     - ${uso}`);
    });
  }
  console.log(`   💡 Recomendación: ${analisis.recomendacion}`);
  console.log('');
});

console.log('📋 ESTÁNDARES RECOMENDADOS:');
console.log('');

Object.entries(estandares_recomendados).forEach(([entidad, estandar]) => {
  console.log(`🏢 ${entidad.toUpperCase()}:`);
  console.log(`   Tabla: ${estandar.tabla}`);
  console.log(`   Campos:`);
  Object.entries(estandar.campos).forEach(([nombre_campo, campo_bd]) => {
    console.log(`     - ${nombre_campo}: ${campo_bd}`);
  });
  console.log('');
});

console.log('🛠️ PLAN DE CORRECCIÓN RECOMENDADO:');
console.log('');
console.log('1. CORREGIR ProfilePage.jsx:');
console.log('   - Reemplazar full_name por legal_representative_name en representante legal');
console.log('   - Reemplazar representative_rut por legal_representative_rut');
console.log('   - Mantener estructura JSON para bank_account_info');
console.log('');
console.log('2. ACTUALIZAR SERVICIOS:');
console.log('   - Revisar databaseService.js para usar campos correctos');
console.log('   - Actualizar servicios de autenticación para consistencia');
console.log('');
console.log('3. DOCUMENTAR ESTÁNDARES:');
console.log('   - Crear guía de convenciones de nomenclatura');
console.log('   - Documentar estructura de datos para desarrolladores');
console.log('');
console.log('4. PRUEBAS PREVENTIVAS:');
console.log('   - Crear tests unitarios para validar mapeo');
console.log('   - Implementar validaciones en tiempo de desarrollo');
console.log('');

// Guardar análisis en archivo
const reporte = {
  fecha_analisis: new Date().toISOString(),
  inconsistencias_encontradas: inconsistencias,
  analisis_campos: analisis_campos,
  estandares_recomendados: estandares_recomendados,
  resumen: {
    total_inconsistencias: inconsistencias.length,
    criticas: inconsistencias.filter(inc => inc.tipo === 'CRÍTICO').length,
    medianas: inconsistencias.filter(inc => inc.tipo === 'MEDIO').length,
    bajas: inconsistencias.filter(inc.tipo === 'BAJO').length
  }
};

fs.writeFileSync(
  path.join(__dirname, 'reporte-inconsistencias-mapeo.json'),
  JSON.stringify(reporte, null, 2)
);

console.log('📄 Análisis guardado en: reporte-inconsistencias-mapeo.json');
console.log('🎯 Análisis completado exitosamente');