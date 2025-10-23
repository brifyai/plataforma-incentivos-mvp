/**
 * Script simple para verificar y limpiar datos mock
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 Verificando estado actual de la base de datos...\n');
  
  try {
    // Verificar todas las tablas
    const tables = ['users', 'companies', 'corporate_clients', 'clients', 'debts'];
    
    for (const table of tables) {
      console.log(`📋 Tabla ${table}:`);
      
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`   ❌ Error: ${error.message}`);
        } else {
          console.log(`   ✅ Existe, ${count} registros`);
          
          if (count > 0 && count < 10) {
            // Mostrar primeros registros para entender la estructura
            const { data: sampleData } = await supabase
              .from(table)
              .select('*')
              .limit(3);
            
            if (sampleData && sampleData.length > 0) {
              console.log(`   📝 Columnas: ${Object.keys(sampleData[0]).join(', ')}`);
              
              // Buscar datos de prueba
              const mockPatterns = ['prueba', 'test', 'demo', 'testing', 'mock'];
              const mockData = sampleData.filter(row => {
                const rowStr = JSON.stringify(row).toLowerCase();
                return mockPatterns.some(pattern => rowStr.includes(pattern));
              });
              
              if (mockData.length > 0) {
                console.log(`   🚨 Datos de prueba encontrados: ${mockData.length}`);
                mockData.forEach(row => {
                  console.log(`      - ${JSON.stringify(row)}`);
                });
                
                // Preguntar si desea eliminar
                console.log(`   ⚠️ Se encontraron datos de prueba en ${table}`);
                
                // Eliminar datos de prueba
                for (const mockRow of mockData) {
                  const { error: deleteError } = await supabase
                    .from(table)
                    .delete()
                    .eq('id', mockRow.id);
                  
                  if (deleteError) {
                    console.log(`      ❌ Error eliminando ${mockRow.id}: ${deleteError.message}`);
                  } else {
                    console.log(`      ✅ Eliminado ${mockRow.id}`);
                  }
                }
              } else {
                console.log(`   ✅ No hay datos de prueba`);
              }
            }
          }
        }
      } catch (tableError) {
        console.log(`   ❌ Error accediendo a ${table}: ${tableError.message}`);
      }
      
      console.log('');
    }
    
    // Verificación final
    console.log('🔍 Verificación final después de la limpieza:');
    
    for (const table of tables) {
      try {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        console.log(`   ${table}: ${count} registros`);
      } catch (error) {
        console.log(`   ${table}: Error - ${error.message}`);
      }
    }
    
    console.log('\n✅ Verificación y limpieza completada');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

main();