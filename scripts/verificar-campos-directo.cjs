/**
 * Verificación Directa de Campos UI-BD
 * 
 * Script que verifica los campos consultando directamente las tablas
 * sin usar information_schema (que no está disponible en Supabase)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 VERIFICACIÓN DIRECTA DE CAMPOS UI-BD');
console.log('='.repeat(60));

// Lista de campos críticos a verificar
const camposCriticos = [
  // Campos de companies
  { tabla: 'companies', campo: 'company_type', descripcion: 'Tipo de empresa' },
  { tabla: 'companies', campo: 'business_type', descripcion: 'Tipo de negocio' },
  { tabla: 'companies', campo: 'economic_activity', descripcion: 'Actividad económica' },
  { tabla: 'companies', campo: 'constitution_date', descripcion: 'Fecha de constitución' },
  { tabla: 'companies', campo: 'social_capital', descripcion: 'Capital social' },
  { tabla: 'companies', campo: 'company_website', descripcion: 'Sitio web' },
  { tabla: 'companies', campo: 'company_description', descripcion: 'Descripción' },
  { tabla: 'companies', campo: 'company_size', descripcion: 'Tamaño de empresa' },
  { tabla: 'companies', campo: 'industry_sector', descripcion: 'Sector industrial' },
  { tabla: 'companies', campo: 'api_key', descripcion: 'API Key' },
  { tabla: 'companies', campo: 'webhook_url', descripcion: 'Webhook URL' },
  { tabla: 'companies', campo: 'integration_settings', descripcion: 'Configuración integraciones' },
  { tabla: 'companies', campo: 'notification_preferences', descripcion: 'Preferencias notificación' },
  
  // Campos de users
  { tabla: 'users', campo: 'oauth_signup', descripcion: 'Registro OAuth' },
  { tabla: 'users', campo: 'needs_profile_completion', descripcion: 'Necesita completar perfil' },
  { tabla: 'users', campo: 'email_verified', descripcion: 'Email verificado' },
  { tabla: 'users', campo: 'invitation_token', descripcion: 'Token invitación' },
  { tabla: 'users', campo: 'invitation_status', descripcion: 'Estado invitación' },
  { tabla: 'users', campo: 'invitation_expires_at', descripcion: 'Expiración invitación' },
  { tabla: 'users', campo: 'validation_status', descripcion: 'Estado validación' },
];

async function verificarCampoDirecto(tabla, campo, descripcion) {
  try {
    console.log(`\n🔍 Verificando: ${tabla}.${campo} (${descripcion})`);
    
    // Intentar consultar el campo específico
    const { data, error } = await supabase
      .from(tabla)
      .select(campo)
      .limit(1);
    
    if (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log(`  ❌ Campo '${campo}' NO EXISTE en tabla '${tabla}'`);
        console.log(`     📋 Error: ${error.message}`);
        return false;
      } else if (error.code === 'PGRST116') {
        console.log(`  ❌ Tabla '${tabla}' NO EXISTE`);
        return false;
      } else {
        console.log(`  ⚠️  Error verificando campo: ${error.message}`);
        return null;
      }
    } else {
      console.log(`  ✅ Campo '${campo}' EXISTE en tabla '${tabla}'`);
      if (data && data.length > 0) {
        const valor = data[0][campo];
        console.log(`     📋 Valor de ejemplo: ${valor !== null ? (typeof valor === 'object' ? JSON.stringify(valor) : valor) : 'NULL'}`);
      } else {
        console.log(`     📋 Tabla vacía, pero el campo existe`);
      }
      return true;
    }
  } catch (error) {
    console.log(`  ❌ Error inesperado: ${error.message}`);
    return false;
  }
}

async function verificarTablaDirecto(tabla) {
  try {
    console.log(`\n🔍 Verificando existencia de tabla: ${tabla}`);
    
    const { data, error } = await supabase
      .from(tabla)
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`  ❌ Tabla '${tabla}' NO EXISTE`);
        return false;
      } else {
        console.log(`  ❌ Error verificando tabla: ${error.message}`);
        return false;
      }
    } else {
      console.log(`  ✅ Tabla '${tabla}' EXISTE`);
      if (data && data.length > 0) {
        console.log(`     📋 Tiene ${data.length} registros (muestra)`);
        console.log(`     📋 Columnas encontradas: ${Object.keys(data[0]).join(', ')}`);
      } else {
        console.log(`     📋 Tabla existe pero está vacía`);
      }
      return true;
    }
  } catch (error) {
    console.log(`  ❌ Error inesperado verificando tabla: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('\n📊 INICIANDO VERIFICACIÓN DIRECTA DE CAMPOS CRÍTICOS\n');
  
  const resultados = {
    camposVerificados: 0,
    camposExistentes: 0,
    camposAusentes: 0,
    camposInciertos: 0,
    detalles: []
  };
  
  // Primero verificar tablas mencionadas
  console.log('\n🏗️  VERIFICACIÓN DE TABLAS REFERENCIADAS');
  console.log('-'.repeat(50));
  
  const tablasReferenciadas = ['companies', 'users'];
  for (const tabla of tablasReferenciadas) {
    await verificarTablaDirecto(tabla);
  }
  
  // Luego verificar cada campo crítico
  console.log('\n🔎 VERIFICACIÓN DETALLADA DE CAMPOS');
  console.log('-'.repeat(50));
  
  for (const { tabla, campo, descripcion } of camposCriticos) {
    resultados.camposVerificados++;
    const existe = await verificarCampoDirecto(tabla, campo, descripcion);
    
    resultados.detalles.push({
      tabla,
      campo,
      descripcion,
      existe
    });
    
    if (existe === true) {
      resultados.camposExistentes++;
    } else if (existe === false) {
      resultados.camposAusentes++;
    } else {
      resultados.camposInciertos++;
    }
  }
  
  // Resumen final
  console.log('\n📋 RESUMEN DE VERIFICACIÓN');
  console.log('='.repeat(60));
  console.log(`📊 Campos verificados: ${resultados.camposVerificados}`);
  console.log(`✅ Campos existentes: ${resultados.camposExistentes}`);
  console.log(`❌ Campos ausentes: ${resultados.camposAusentes}`);
  console.log(`⚠️  Campos inciertos: ${resultados.camposInciertos}`);
  
  const porcentajeExistencia = resultados.camposVerificados > 0 
    ? Math.round((resultados.camposExistentes / resultados.camposVerificados) * 100)
    : 0;
  
  console.log(`📈 Porcentaje de existencia: ${porcentajeExistencia}%`);
  
  // Campos ausentes críticos
  const camposAusentesCriticos = resultados.detalles.filter(d => d.existe === false);
  if (camposAusentesCriticos.length > 0) {
    console.log('\n🚨 CAMPOS AUSENTES CRÍTICOS:');
    camposAusentesCriticos.forEach(({ tabla, campo, descripcion }) => {
      console.log(`  ❌ ${tabla}.${campo} - ${descripcion}`);
    });
  }
  
  // Campos existentes
  const camposExistentesConfirmados = resultados.detalles.filter(d => d.existe === true);
  if (camposExistentesConfirmados.length > 0) {
    console.log('\n✅ CAMPOS EXISTENTES CONFIRMADOS:');
    camposExistentesConfirmados.forEach(({ tabla, campo, descripcion }) => {
      console.log(`  ✅ ${tabla}.${campo} - ${descripcion}`);
    });
  }
  
  // Recomendaciones
  console.log('\n💡 RECOMENDACIONES:');
  if (resultados.camposAusentes > 0) {
    console.log('  📝 Se requieren migraciones para agregar los campos ausentes');
    console.log('  🔧 Priorizar campos críticos para funcionalidad principal');
  }
  if (resultados.camposInciertos > 0) {
    console.log('  🔍 Investigar campos con estado incierto');
  }
  if (porcentajeExistencia >= 90) {
    console.log('  ✅ Excelente cobertura de campos en la base de datos');
  } else if (porcentajeExistencia >= 70) {
    console.log('  ⚠️  Buena cobertura, pero requiere mejoras');
  } else {
    console.log('  🚨 Cobertura baja, se requieren mejoras significativas');
  }
  
  console.log('\n🎉 VERIFICACIÓN COMPLETADA');
}

main().catch(console.error);