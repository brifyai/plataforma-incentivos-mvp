// Sincronización automática diaria
// Ejecutar diariamente con: node scripts/sincronizacion-diaria.cjs
// O configurar en cron: 0 2 * * * cd /ruta/al/proyecto && node scripts/sincronizacion-diaria.cjs

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function sincronizacionDiaria() {
  const startTime = new Date();
  console.log(`🕐 Sincronización automática: ${startTime.toISOString()}`);
  console.log('=====================================');
  
  try {
    let totalCorrecciones = 0;
    let totalErrores = 0;
    
    // 1. Verificar consistencia del sistema
    console.log('\n🔍 Paso 1: Verificando consistencia del sistema...');
    
    const { data: consistencyCheck, error: consistencyError } = await supabase
      .rpc('check_system_consistency');
    
    if (consistencyError) {
      console.error('❌ Error verificando consistencia:', consistencyError);
      totalErrores++;
    } else {
      console.log('📊 Resultados de consistencia:');
      consistencyCheck.forEach(check => {
        console.log(`  ${check.check_type}: ${check.total_issues} problemas`);
        if (check.total_issues > 0) {
          console.log(`  Detalles: ${JSON.stringify(check.details, null, 2)}`);
        }
      });
      
      totalCorrecciones += consistencyCheck.reduce((sum, check) => sum + check.total_issues, 0);
    }
    
    // 2. Sincronizar deudores existentes
    console.log('\n🔄 Paso 2: Sincronizando deudores existentes...');
    
    const { data: syncResults, error: syncError } = await supabase
      .rpc('sync_all_debtors_to_clients');
    
    if (syncError) {
      console.error('❌ Error en sincronización:', syncError);
      totalErrores++;
    } else {
      console.log('📊 Resultados de sincronización:');
      syncResults.forEach(result => {
        if (result.debtors_synced > 0) {
          console.log(`  ${result.company_name}: ${result.debtors_synced} deudores sincronizados`);
          totalCorrecciones += result.debtors_synced;
        }
        if (result.errors) {
          console.log(`  ${result.company_name}: Error - ${result.errors}`);
          totalErrores++;
        }
      });
    }
    
    // 3. Verificar estado final
    console.log('\n✅ Paso 3: Verificación final...');
    
    const endTime = new Date();
    const duration = endTime - startTime;
    
    console.log('=====================================');
    console.log('📊 RESUMEN DE SINCRONIZACIÓN:');
    console.log(`  ⏱️  Duración: ${duration}ms`);
    console.log(`  ✅ Correcciones realizadas: ${totalCorrecciones}`);
    console.log(`  ❌ Errores: ${totalErrores}`);
    console.log(`  🕐 Hora de finalización: ${endTime.toISOString()}`);
    
    if (totalErrores === 0) {
      console.log('🎉 Sincronización completada exitosamente');
    } else {
      console.log('⚠️ Sincronización completada con errores');
    }
    
    // 4. Enviar notificación si hay problemas críticos
    if (totalErrores > 0 || totalCorrecciones > 10) {
      console.log('\n🚨 ALERTA: Se detectaron problemas que requieren atención');
      console.log('   Revisar los logs detallados arriba');
      // Aquí se podría agregar envío de email o notificación
    }
    
  } catch (error) {
    console.error('❌ Error crítico en sincronización diaria:', error);
    process.exit(1);
  }
}

// Ejecutar la sincronización
sincronizacionDiaria();