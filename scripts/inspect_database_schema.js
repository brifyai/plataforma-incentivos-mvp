/**
 * Script para inspeccionar el esquema actual de la base de datos
 */

import { supabase } from '../src/config/supabase.js';

async function inspectSchema() {
  try {
    console.log('🔍 Inspeccionando esquema de la base de datos...');
    
    // Verificar si las tablas de mensajería existen
    const tables = ['conversations', 'messages', 'message_attachments'];
    
    for (const tableName of tables) {
      console.log(`\n📋 Tabla: ${tableName}`);
      
      // Verificar si la tabla existe
      const { data: tableExists, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', tableName)
        .eq('table_schema', 'public');
      
      if (tableError) {
        console.log(`❌ Error verificando tabla ${tableName}:`, tableError);
        continue;
      }
      
      if (tableExists && tableExists.length > 0) {
        console.log(`✅ Tabla ${tableName} existe`);
        
        // Obtener columnas de la tabla
        const { data: columns, error: columnError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default')
          .eq('table_name', tableName)
          .eq('table_schema', 'public')
          .order('ordinal_position');
        
        if (columnError) {
          console.log(`❌ Error obteniendo columnas de ${tableName}:`, columnError);
        } else {
          console.log('📝 Columnas:');
          columns.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable}) ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
          });
        }
        
        // Intentar obtener algunos datos para probar
        try {
          const { data: sampleData, error: dataError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (dataError) {
            console.log(`⚠️ Error obteniendo datos de ${tableName}:`, dataError.message);
          } else {
            console.log(`📊 Muestra de datos (${sampleData.length} registros):`);
            if (sampleData.length > 0) {
              console.log(JSON.stringify(sampleData[0], null, 2));
            } else {
              console.log('  (Sin datos)');
            }
          }
        } catch (testError) {
          console.log(`⚠️ Error consultando ${tableName}:`, testError.message);
        }
        
      } else {
        console.log(`❌ Tabla ${tableName} no existe`);
      }
    }
    
    // Verificar tablas relacionadas con usuarios y deudas
    console.log('\n🔍 Verificando tablas relacionadas...');
    const relatedTables = ['users', 'companies', 'debts', 'debtors'];
    
    for (const tableName of relatedTables) {
      const { data: tableExists, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', tableName)
        .eq('table_schema', 'public');
      
      if (tableError) {
        console.log(`❌ Error verificando tabla ${tableName}:`, tableError);
      } else if (tableExists && tableExists.length > 0) {
        console.log(`✅ Tabla ${tableName} existe`);
        
        // Obtener columnas clave
        const { data: columns, error: columnError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type')
          .eq('table_name', tableName)
          .eq('table_schema', 'public')
          .in('column_name', ['id', 'user_id', 'debtor_id', 'company_id', 'name', 'full_name']);
        
        if (!columnError && columns) {
          console.log(`  Columnas relevantes: ${columns.map(c => `${c.column_name}:${c.data_type}`).join(', ')}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error inspeccionando esquema:', error);
    process.exit(1);
  }
}

inspectSchema();