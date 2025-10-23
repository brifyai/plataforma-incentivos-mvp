/**
 * Verificación de Campos Críticos UI-BD
 * 
 * Script específico para verificar los campos marcados como "por verificar"
 * en el análisis manual de UI vs Base de Datos
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

console.log('🔍 VERIFICACIÓN DE CAMPOS CRÍTICOS UI-BD');
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
  
  // Campos de verification (si existe como tabla separada)
  { tabla: 'company_verification', campo: 'id', descripcion: 'ID de verificación' },
  { tabla: 'company_verification', campo: 'company_id', descripcion: 'ID empresa en verificación' },
  { tabla: 'company_verification', campo: 'status', descripcion: 'Estado verificación' },
  { tabla: 'company_verification', campo: 'certificado_vigencia_url', descripcion: 'URL certificado vigencia' },
  { tabla: 'company_verification', campo: 'informe_equifax_url', descripcion: 'URL informe Equifax' },
];

async function verificarCampo(tabla, campo, descripcion) {
  try {
    console.log(`\n🔍 Verificando: ${tabla}.${campo} (${descripcion})`);
    
    // Intentar obtener la información de la columna
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', tabla)
      .eq('column_name', campo)
      .eq('table_schema', 'public')
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // La tabla no existe en information_schema (probablemente no es una tabla real)
        console.log(`  ⚠️  Tabla '${tabla}' no encontrada en information_schema`);
        
        // Intentar verificar si la tabla existe haciendo una consulta simple
        try {
          const { data: testData, error: testError } = await supabase
            .from(tabla)
            .select(campo)
            .limit(1);
          
          if (testError) {
            if (testError.code === 'PGRST204') {
              console.log(`  ❌ La tabla '${tabla}' existe pero está vacía`);
            } else if (testError.code === 'PGRST116') {
              console.log(`  ❌ La tabla '${tabla}' no existe`);
            } else {
              console.log(`  ❌ Error verificando tabla: ${testError.message}`);
            }
          } else {
            // La tabla existe, verificar si el campo existe en los datos
            if (testData && testData.length > 0) {
              const firstRow = testData[0];
              if (campo in firstRow) {
                console.log(`  ✅ Campo '${campo}' EXISTE en tabla '${tabla}'`);
                return true;
              } else {
                console.log(`  ❌ Campo '${campo}' NO EXISTE en tabla '${tabla}'`);
                return false;
              }
            } else {
              console.log(`  ⚠️  Tabla '${tabla}' existe pero está vacía, no se puede verificar el campo`);
              return null;
            }
          }
        } catch (testErr) {
          console.log(`  ❌ Error verificando tabla: ${testErr.message}`);
          return false;
        }
      } else {
        console.log(`  ❌ Error verificando campo: ${error.message}`);
        return false;
      }
    } else {
      console.log(`  ✅ Campo '${campo}' EXISTE en information_schema`);
      console.log(`     📋 Tipo: ${data.data_type}`);
      console.log(`     📋 Nullable: ${data.is_nullable}`);
      if (data.column_default) {
        console.log(`     📋 Default: ${data.column_default}`);
      }
      return true;
    }
  } catch (error) {
    console.log(`  ❌ Error inesperado: ${error.message}`);
    return false;
  }
}

async function verificarTabla(tabla) {
  try {
    console.log(`\n🔍 Verificando existencia de tabla: ${tabla}`);
    
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', tabla)
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE')
      .single();
    
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
      return true;
    }
  } catch (error) {
    console.log(`  ❌ Error inesperado verificando tabla: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('\n📊 INICIANDO VERIFICACIÓN DE CAMPOS CRÍTICOS\n');
  
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
  
  const tablasReferenciadas = ['companies', 'users', 'company_verification'];
  for (const tabla of tablasReferenciadas) {
    await verificarTabla(tabla);
  }
  
  // Luego verificar cada campo crítico
  console.log('\n🔎 VERIFICACIÓN DETALLADA DE CAMPOS');
  console.log('-'.repeat(50));
  
  for (const { tabla, campo, descripcion } of camposCriticos) {
    resultados.camposVerificados++;
    const existe = await verificarCampo(tabla, campo, descripcion);
    
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