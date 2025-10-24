const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyTriggerDirectly() {
  try {
    console.log('🔧 Aplicando trigger directamente usando SQL...\n');

    // 1. Eliminar trigger y función existentes si existen
    console.log('🗑️ Eliminando trigger y función existentes...');
    
    const dropStatements = [
      'DROP TRIGGER IF EXISTS on_company_create_corporate_client ON companies;',
      'DROP FUNCTION IF EXISTS create_corporate_client_for_new_company();'
    ];

    for (const statement of dropStatements) {
      try {
        // Usar RPC para ejecutar SQL directamente
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        if (error && !error.message.includes('does not exist')) {
          console.warn('⚠️ Error eliminando:', error.message);
        }
      } catch (err) {
        console.warn('⚠️ Error ejecutando drop:', err.message);
      }
    }

    // 2. Crear la función para el trigger
    console.log('📝 Creando función del trigger...');
    
    const functionSQL = `
      CREATE OR REPLACE FUNCTION create_corporate_client_for_new_company()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO corporate_clients (
          company_id,
          contact_email,
          contact_phone,
          rut,
          industry,
          created_at,
          updated_at
        ) VALUES (
          NEW.id,
          NEW.contact_email,
          NEW.contact_phone,
          NEW.rut,
          'Corporativo',
          NOW(),
          NOW()
        );
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: functionSQL });
      if (error) {
        console.error('❌ Error creando función:', error);
        console.log('💡 La función debe ser aplicada manualmente en Supabase Dashboard');
        console.log('📋 SQL para aplicar manualmente:');
        console.log(functionSQL);
      } else {
        console.log('✅ Función creada exitosamente');
      }
    } catch (err) {
      console.error('❌ Error creando función:', err);
    }

    // 3. Crear el trigger
    console.log('⚡ Creando trigger...');
    
    const triggerSQL = `
      CREATE TRIGGER on_company_create_corporate_client
        AFTER INSERT ON companies
        FOR EACH ROW
        EXECUTE FUNCTION create_corporate_client_for_new_company();
    `;

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: triggerSQL });
      if (error) {
        console.error('❌ Error creando trigger:', error);
        console.log('💡 El trigger debe ser aplicado manualmente en Supabase Dashboard');
        console.log('📋 SQL para aplicar manualmente:');
        console.log(triggerSQL);
      } else {
        console.log('✅ Trigger creado exitosamente');
      }
    } catch (err) {
      console.error('❌ Error creando trigger:', err);
    }

    // 4. Verificar si el trigger está activo
    console.log('\n🔍 Verificando estado del trigger...');
    
    const verifySQL = `
      SELECT 
        tgname as trigger_name,
        tgrelid::regclass as table_name,
        tgfoid::regproc as function_name,
        tgtype as trigger_type
      FROM pg_trigger 
      WHERE tgname = 'on_company_create_corporate_client';
    `;

    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: verifySQL });
      if (error) {
        console.warn('⚠️ No se pudo verificar el trigger:', error.message);
      } else {
        console.log('✅ Trigger verificado:', data);
      }
    } catch (err) {
      console.warn('⚠️ Error verificando trigger:', err.message);
    }

    console.log('\n🎉 Proceso de aplicación de trigger completado');
    console.log('📋 Resumen:');
    console.log('   - Función del trigger: ✅ Creada o requiere aplicación manual');
    console.log('   - Trigger: ✅ Creado o requiere aplicación manual');
    console.log('   - Sistema automático: 🔄 Listo para probar');

    // 5. Instrucciones manuales si fue necesario
    console.log('\n📖 Si el trigger no se aplicó automáticamente:');
    console.log('1. Ve al Supabase Dashboard');
    console.log('2. Ve a SQL Editor');
    console.log('3. Ejecuta los siguientes comandos:');
    console.log('');
    console.log('-- Función del trigger');
    console.log(functionSQL);
    console.log('');
    console.log('-- Trigger');
    console.log(triggerSQL);

  } catch (error) {
    console.error('💥 Error aplicando trigger:', error);
  }
}

// Ejecutar aplicación
applyTriggerDirectly();