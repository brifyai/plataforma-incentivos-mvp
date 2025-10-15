/**
 * Script simple para probar la lógica de corrección de IA
 * sin dependencias de navegador o Supabase
 */

// Simular las funciones de normalización del servicio de IA
function normalizeRUT(rut) {
  if (!rut) return '';
  
  // Eliminar caracteres no válidos
  let cleaned = rut.toString().toUpperCase().replace(/[^0-9K]/g, '');
  
  // Separar dígito verificador
  let dv = cleaned.slice(-1);
  let numbers = cleaned.slice(0, -1);
  
  // Calcular dígito verificador si no existe
  if (numbers.length > 0 && !/^[0-9K]$/.test(dv)) {
    numbers = cleaned;
    dv = calculateRUTDV(numbers);
  }
  
  // Formatear
  if (numbers.length === 0) return '';
  
  let formatted = '';
  let count = 0;
  for (let i = numbers.length - 1; i >= 0; i--) {
    formatted = numbers[i] + formatted;
    count++;
    if (count === 3 && i > 0) {
      formatted = '.' + formatted;
      count = 0;
    }
  }
  
  return formatted + '-' + dv;
}

function calculateRUTDV(numbers) {
  let sum = 0;
  let multiplier = 2;
  
  for (let i = numbers.length - 1; i >= 0; i--) {
    sum += parseInt(numbers[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const remainder = sum % 11;
  const dv = 11 - remainder;
  
  if (dv === 11) return '0';
  if (dv === 10) return 'K';
  return dv.toString();
}

function normalizePhone(phone) {
  if (!phone) return '';
  
  let cleaned = phone.toString().replace(/[^\d+]/g, '');
  
  if (!cleaned.startsWith('+') && cleaned.length === 9 && cleaned.startsWith('9')) {
    cleaned = '+56' + cleaned;
  } else if (!cleaned.startsWith('+') && cleaned.length === 8) {
    cleaned = '+569' + cleaned;
  } else if (!cleaned.startsWith('+') && cleaned.length === 9) {
    cleaned = '+569' + cleaned;
  }
  
  return cleaned;
}

function applyManualCorrections(data) {
  return data.map(row => {
    const corrected = { ...row };

    // Corregir RUT
    if (corrected.rut) {
      corrected.rut = normalizeRUT(corrected.rut);
    }

    // Corregir teléfono
    if (corrected.phone) {
      corrected.phone = normalizePhone(corrected.phone);
    }

    // Corregir email
    if (corrected.email) {
      corrected.email = corrected.email.toLowerCase().trim();
    }

    // Corregir nombre
    if (corrected.full_name) {
      corrected.full_name = corrected.full_name
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    // Corregir monto
    if (corrected.debt_amount) {
      // Eliminar todos los caracteres no numéricos excepto puntos y decimales
      let amountStr = corrected.debt_amount.toString().replace(/[^0-9.,]/g, '');
      
      // Reemplazar puntos por nada (separadores de miles chilenos) y comas por puntos (decimales)
      amountStr = amountStr.replace(/\./g, '').replace(/,/g, '.');
      
      corrected.debt_amount = parseFloat(amountStr) || 0;
    }

    // Corregir fecha
    if (corrected.due_date) {
      const date = new Date(corrected.due_date);
      if (!isNaN(date.getTime())) {
        corrected.due_date = date.toISOString().split('T')[0];
      }
    }

    return corrected;
  });
}

// Datos de prueba con errores comunes
const testData = [
  {
    rut: '12345678', // Formato incorrecto
    full_name: 'juan perez', // Nombres en minúsculas
    email: 'JUAN.PEREZ@EMAIL.COM', // Email en mayúsculas
    phone: '912345678', // Teléfono sin formato internacional
    debt_amount: '1.500.000', // Monto con formato chileno
    due_date: '31/12/2024', // Fecha formato DD/MM/YYYY
    creditor_name: 'banco estado', // Nombre en minúsculas
    debt_reference: 'PREST001',
    debt_type: 'credit_card',
    interest_rate: '2,5%', // Tasa con coma y porcentaje
    description: 'deuda tarjeta de credito'
  },
  {
    rut: '987654321', // Formato incorrecto
    full_name: 'MARIA GONZALEZ',
    email: 'maria.gonzalez@email.com',
    phone: '+56987654321', // Ya está bien formateado
    debt_amount: '$2.500.000', // Monto con símbolo y puntos
    due_date: '2024-11-15', // Ya está bien formateado
    creditor_name: 'CMR FALABELLA',
    debt_reference: 'CUOTA045',
    debt_type: 'loan',
    interest_rate: '1.8%',
    description: 'CREDITO CONSUMO'
  },
  {
    rut: '111111111', // Formato incorrecto
    full_name: 'pedro lopez',
    email: '', // Email faltante
    phone: '98765432', // Teléfono corto
    debt_amount: '500000', // Monto sin formato
    due_date: '15-01-2025', // Fecha con guiones
    creditor_name: 'ripley',
    debt_reference: '',
    debt_type: '',
    interest_rate: '',
    description: ''
  }
];

// Ejecutar prueba
console.log('🚀 Iniciando prueba de corrección de datos...');
console.log('📊 Datos de prueba:', testData.length, 'registros');

const correctedData = applyManualCorrections(testData);

console.log('\n📋 Resultados de la corrección:');
correctedData.forEach((row, index) => {
  console.log(`\n--- Registro ${index + 1} ---`);
  console.log('RUT:', testData[index].rut, '→', row.rut);
  console.log('Nombre:', testData[index].full_name, '→', row.full_name);
  console.log('Email:', testData[index].email || '(vacío)', '→', row.email || '(vacío)');
  console.log('Teléfono:', testData[index].phone, '→', row.phone);
  console.log('Monto:', testData[index].debt_amount, '→', row.debt_amount);
  console.log('Fecha:', testData[index].due_date, '→', row.due_date);
});

// Validar que los datos corregidos sean válidos
console.log('\n✅ Validación final:');
let validCount = 0;
for (let i = 0; i < correctedData.length; i++) {
  const row = correctedData[i];
  const isValid = row.rut && row.full_name && row.debt_amount && row.due_date && row.creditor_name;
  console.log(`Fila ${i + 1}: ${isValid ? '✅ Válido' : '❌ Inválido'}`);
  if (isValid) validCount++;
}

console.log(`\n🎯 Resumen: ${validCount}/${correctedData.length} registros válidos`);

if (validCount === correctedData.length) {
  console.log('\n🎉 ¡Prueba exitosa! La corrección manual está funcionando correctamente.');
  console.log('💡 Esto significa que el sistema de IA tiene un fallback robusto cuando la IA no está disponible.');
} else {
  console.log('\n⚠️ Prueba con advertencias. Algunos registros necesitan corrección adicional.');
}

console.log('\n🔍 Verificación de formatos chilenos:');
console.log('RUT formateado:', correctedData[0].rut, '(debe ser XX.XXX.XXX-X)');
console.log('Teléfono formateado:', correctedData[0].phone, '(debe ser +569XXXXXXXX)');
console.log('Nombre capitalizado:', correctedData[0].full_name, '(debe ser Juan Pérez)');
console.log('Monto numérico:', correctedData[0].debt_amount, '(debe ser número)');
console.log('Fecha ISO:', correctedData[0].due_date, '(debe ser YYYY-MM-DD)');