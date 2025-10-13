import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyKnowledgeTables() {
  try {
    console.log('🔧 Aplicando tablas de knowledge base...');
    
    // Leer el archivo SQL
    const sqlContent = readFileSync('create_missing_knowledge_tables.sql', 'utf8');
    
    // Dividir el SQL en declaraciones individuales (simple split por ;)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Ejecutando ${statements.length} declaraciones SQL...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.length < 10) continue; // Ignorar declaraciones muy cortas
      
      try {
        console.log(`⚡ Ejecutando (${i + 1}/${statements.length}): ${statement.substring(0, 50)}...`);
        
        // Usar RPC para ejecutar SQL raw
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          // Si RPC no existe, intentar con método alternativo
          console.log(`⚠️ RPC falló, intentando método alternativo...`);
          
          // Para algunas operaciones básicas, podemos intentar directamente
          if (statement.toLowerCase().includes('select') && statement.toLowerCase().includes('count')) {
            const { data, error: selectError } = await supabase
              .from('information_schema.tables')
              .select('table_name');
            
            if (!selectError) {
              console.log(`✅ Consulta ejecutada: ${data.length} tablas encontradas`);
              successCount++;
              continue;
            }
          }
          
          console.error(`❌ Error en declaración ${i + 1}:`, error.message);
          errorCount++;
        } else {
          console.log(`✅ Declaración ${i + 1} ejecutada correctamente`);
          successCount++;
        }
        
        // Pequeña pausa para no sobrecargar la API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        console.error(`❌ Error catch en declaración ${i + 1}:`, err.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Resumen de ejecución:');
    console.log(`✅ Exitosas: ${successCount}`);
    console.log(`❌ Con error: ${errorCount}`);
    console.log(`📝 Total: ${statements.length}`);
    
    // Verificar si las tablas se crearon
    console.log('\n🔍 Verificando tablas creadas...');
    
    const tables = [
      'negotiation_ai_config',
      'corporate_client_policies', 
      'corporate_client_responses',
      'company_knowledge_base'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Tabla ${table}: ${error.message}`);
        } else {
          console.log(`✅ Tabla ${table}: OK (${data.length} registros)`);
        }
      } catch (err) {
        console.log(`❌ Tabla ${table}: Error de conexión`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

applyKnowledgeTables();