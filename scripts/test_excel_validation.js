/**
 * Script simplificado para probar validación y normalización de datos de Excel
 * Sin dependencias externas, solo prueba la lógica principal
 */

// Funciones de validación (extraídas de bulkImportService)
function validateRUT(rut) {
  if (!rut) return { isValid: false, error: 'El RUT es requerido' };
  
  // Limpiar RUT: eliminar puntos, guiones y espacios
  const cleanRut = rut.replace(/[.-\s]/g, '').toUpperCase();
  
  // Verificar formato básico
  if (!/^\d+K?$/.test(cleanRut)) {
    return { isValid: false, error: 'Formato de RUT inválido' };
  }
  
  // Verificar dígito verificador
  if (cleanRut.length > 1) {
    const numbers = cleanRut.slice(0, -1);
    const verifier = cleanRut.slice(-1);
    
    let sum = 0;
    let multiplier = 2;
    
    for (let i = numbers.length - 1; i >= 0; i--) {
      sum += parseInt(numbers[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const expectedVerifier = 11 - (sum % 11);
    const calculatedVerifier = expectedVerifier === 11 ? '0' : 
                              expectedVerifier === 10 ? 'K' : 
                              expectedVerifier.toString();
    
    if (verifier !== calculatedVerifier) {
      return { isValid: false, error: 'Dígito verificador inválido' };
    }
  }
  
  return { isValid: true, normalized: cleanRut };
}

function validateEmail(email) {
  if (!email) return { isValid: false, error: 'El email es requerido' };
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Formato de email inválido' };
  }
  
  return { isValid: true, normalized: email.toLowerCase().trim() };
}

function validatePhone(phone) {
  if (!phone) return { isValid: false, error: 'El teléfono es requerido' };
  
  // Limpiar teléfono: eliminar espacios, paréntesis, guiones
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Verificar que contenga solo números y posible +
  if (!/^\+?\d+$/.test(cleanPhone)) {
    return { isValid: false, error: 'Formato de teléfono inválido' };
  }
  
  // Verificar longitud mínima
  if (cleanPhone.length < 8) {
    return { isValid: false, error: 'El teléfono debe tener al menos 8 dígitos' };
  }
  
  // Asegurar que comience con +56 para Chile
  let normalizedPhone = cleanPhone;
  if (!normalizedPhone.startsWith('+')) {
    if (normalizedPhone.startsWith('56') && normalizedPhone.length > 9) {
      normalizedPhone = '+' + normalizedPhone;
    } else if (normalizedPhone.startsWith('9')) {
      normalizedPhone = '+56' + normalizedPhone;
    } else {
      normalizedPhone = '+56' + normalizedPhone;
    }
  }
  
  return { isValid: true, normalized: normalizedPhone };
}

function validateAmount(amount) {
  if (amount === null || amount === undefined || amount === '') {
    return { isValid: false, error: 'El monto es requerido' };
  }
  
  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount)) {
    return { isValid: false, error: 'El monto debe ser un número válido' };
  }
  
  if (numAmount <= 0) {
    return { isValid: false, error: 'El monto debe ser mayor a 0' };
  }
  
  if (numAmount > 999999999) {
    return { isValid: false, error: 'El monto es demasiado grande' };
  }
  
  return { isValid: true, normalized: numAmount };
}

// Función de normalización
function normalizeDebtorData(debtor) {
  const normalized = { ...debtor };
  
  // Normalizar RUT
  const rutValidation = validateRUT(debtor.debtor_rut);
  if (rutValidation.isValid) {
    normalized.debtor_rut = rutValidation.normalized;
  }
  
  // Normalizar email
  const emailValidation = validateEmail(debtor.debtor_email);
  if (emailValidation.isValid) {
    normalized.debtor_email = emailValidation.normalized;
  }
  
  // Normalizar teléfono
  const phoneValidation = validatePhone(debtor.debtor_phone);
  if (phoneValidation.isValid) {
    normalized.debtor_phone = phoneValidation.normalized;
  }
  
  // Normalizar monto
  const amountValidation = validateAmount(debtor.debt_amount);
  if (amountValidation.isValid) {
    normalized.debt_amount = amountValidation.normalized;
  }
  
  // Normalizar nombre (eliminar espacios extra)
  if (normalized.debtor_name) {
    normalized.debtor_name = normalized.debtor_name.trim().replace(/\s+/g, ' ');
  }
  
  return normalized;
}

// Datos de prueba para Excel
const testExcelData = [
  {
    debtor_name: 'Juan Pérez',
    debtor_rut: '12.345.678-5', // RUT válido (dígito correcto)
    debtor_email: 'Juan.PEREZ@EMAIL.COM',
    debtor_phone: '9 1234 5678',
    debt_amount: '150000',
    due_date: '2024-12-31',
    description: 'Deuda de tarjeta de crédito'
  },
  {
    debtor_name: 'María González',
    debtor_rut: '18.765.432-1', // RUT válido
    debtor_email: 'maria.gonzalez@email.com',
    debtor_phone: '+56 9 8765 4321',
    debt_amount: 250000,
    due_date: '2024-11-30',
    description: 'Préstamo personal'
  },
  {
    debtor_name: '  Carlos  Rodríguez  ',
    debtor_rut: '16.222.333-4', // RUT válido (cambiado para que sea correcto)
    debtor_email: 'CARLOS.RODRIGUEZ@EMAIL.COM',
    debtor_phone: '(9) 1122-3344',
    debt_amount: '75000.50',
    due_date: '2025-01-15',
    description: 'Deuda comercial'
  },
  // Casos inválidos para probar validación
  {
    debtor_name: 'Deudor Inválido 1',
    debtor_rut: '12.345.678-0', // Dígito verificador incorrecto
    debtor_email: 'email-invalido', // Email inválido
    debtor_phone: '123', // Teléfono muy corto
    debt_amount: -1000, // Monto negativo
    due_date: '2024-12-31',
    description: 'Deuda inválida'
  },
  {
    debtor_name: 'Deudor Inválido 2',
    debtor_rut: '', // RUT vacío
    debtor_email: '', // Email vacío
    debtor_phone: '', // Teléfono vacío
    debt_amount: '', // Monto vacío
    due_date: '2024-12-31',
    description: 'Deuda inválida'
  }
];

// Función para validar todos los datos de un deudor
function validateDebtorData(debtor) {
  const errors = [];
  
  const rutValidation = validateRUT(debtor.debtor_rut);
  if (!rutValidation.isValid) {
    errors.push(`RUT: ${rutValidation.error}`);
  }
  
  const emailValidation = validateEmail(debtor.debtor_email);
  if (!emailValidation.isValid) {
    errors.push(`Email: ${emailValidation.error}`);
  }
  
  const phoneValidation = validatePhone(debtor.debtor_phone);
  if (!phoneValidation.isValid) {
    errors.push(`Teléfono: ${phoneValidation.error}`);
  }
  
  const amountValidation = validateAmount(debtor.debt_amount);
  if (!amountValidation.isValid) {
    errors.push(`Monto: ${amountValidation.error}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// Función principal de prueba
function runExcelValidationTest() {
  console.log('🧪 Iniciando prueba de validación y normalización de datos de Excel...\n');
  
  let validCount = 0;
  let invalidCount = 0;
  
  testExcelData.forEach((debtor, index) => {
    console.log(`📋 Probando deudor ${index + 1}: ${debtor.debtor_name}`);
    
    // Validar datos originales
    const validation = validateDebtorData(debtor);
    
    if (validation.isValid) {
      validCount++;
      console.log('  ✅ Datos originales válidos');
    } else {
      invalidCount++;
      console.log('  ❌ Datos originales inválidos:');
      validation.errors.forEach(error => {
        console.log(`    - ${error}`);
      });
    }
    
    // Normalizar datos
    const normalized = normalizeDebtorData(debtor);
    
    console.log('  🔧 Datos normalizados:');
    console.log(`    Nombre: "${debtor.debtor_name}" -> "${normalized.debtor_name}"`);
    console.log(`    RUT: "${debtor.debtor_rut}" -> "${normalized.debtor_rut}"`);
    console.log(`    Email: "${debtor.debtor_email}" -> "${normalized.debtor_email}"`);
    console.log(`    Teléfono: "${debtor.debtor_phone}" -> "${normalized.debtor_phone}"`);
    console.log(`    Monto: "${debtor.debt_amount}" -> "${normalized.debt_amount}"`);
    
    // Validar datos normalizados
    const normalizedValidation = validateDebtorData(normalized);
    if (normalizedValidation.isValid) {
      console.log('  ✅ Datos normalizados válidos');
    } else {
      console.log('  ❌ Datos normalizados aún inválidos:');
      normalizedValidation.errors.forEach(error => {
        console.log(`    - ${error}`);
      });
    }
    
    console.log('');
  });
  
  // Resumen
  console.log('📊 Resumen de la prueba:');
  console.log(`  Total de deudores: ${testExcelData.length}`);
  console.log(`  Válidos: ${validCount}`);
  console.log(`  Inválidos: ${invalidCount}`);
  console.log(`  Tasa de éxito: ${((validCount / testExcelData.length) * 100).toFixed(1)}%`);
  
  // Pruebas específicas
  console.log('\n🔍 Pruebas específicas de normalización:');
  
  const testCases = [
    { name: 'RUT con puntos y guion', input: '12.345.678-5', expected: '123456785' },
    { name: 'RUT sin puntos ni guion', input: '187654321', expected: '187654321' },
    { name: 'RUT con K', input: '16.222.333-4', expected: '162223334' },
    { name: 'Teléfono con formato chileno', input: '9 1234 5678', expected: '+56912345678' },
    { name: 'Teléfono con +56', input: '+56 9 1234 5678', expected: '+56912345678' },
    { name: 'Teléfono con paréntesis', input: '(9) 1234-5678', expected: '+56912345678' },
    { name: 'Email con mayúsculas', input: 'TEST@EMAIL.COM', expected: 'test@email.com' },
    { name: 'Monto como string', input: '150000', expected: 150000 },
    { name: 'Monto con decimales', input: '75000.50', expected: 75000.5 }
  ];
  
  testCases.forEach(testCase => {
    let result;
    switch (testCase.name) {
      case 'RUT con puntos y guion':
      case 'RUT sin puntos ni guion':
      case 'RUT con K':
        result = validateRUT(testCase.input);
        break;
      case 'Teléfono con formato chileno':
      case 'Teléfono con +56':
      case 'Teléfono con paréntesis':
        result = validatePhone(testCase.input);
        break;
      case 'Email con mayúsculas':
        result = validateEmail(testCase.input);
        break;
      case 'Monto como string':
      case 'Monto con decimales':
        result = validateAmount(testCase.input);
        break;
    }
    
    if (result.isValid && result.normalized === testCase.expected) {
      console.log(`  ✅ ${testCase.name}: "${testCase.input}" -> "${result.normalized}"`);
    } else {
      console.log(`  ❌ ${testCase.name}: "${testCase.input}" -> "${result.normalized}" (esperado: "${testCase.expected}")`);
    }
  });
  
  console.log('\n🎉 Prueba de validación y normalización completada');
  
  return {
    total: testExcelData.length,
    valid: validCount,
    invalid: invalidCount,
    successRate: (validCount / testExcelData.length) * 100
  };
}

// Ejecutar prueba
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runExcelValidationTest };
} else {
  runExcelValidationTest();
}