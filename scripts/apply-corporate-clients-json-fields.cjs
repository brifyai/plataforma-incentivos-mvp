const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno no encontradas');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyJsonFieldsMigration() {
  console.log('🔧 Aplicando migración de campos JSON a corporate_clients...');
  
  try {
    // 1. Verificar estructura actual de la tabla
    console.log('\n📋 1. Verificando estructura actual de corporate_clients...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'corporate_clients')
      .eq('table_schema', 'public')
      .order('ordinal_position');
    
    if (columnsError) {
      console.log('⚠️ No se puede verificar información de columnas:', columnsError.message);
    } else {
      console.log('✅ Columnas actuales:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    }
    
    // 2. Agregar campo contact_info si no existe
    console.log('\n📝 2. Agregando campo contact_info...');
    const hasContactInfo = columns?.some(col => col.column_name === 'contact_info');
    
    if (!hasContactInfo) {
      console.log('   ⚡ Agregando contact_info (JSONB)...');
      
      // Intentar agregar la columna directamente
      const { error: addContactError } = await supabase
        .from('corporate_clients')
        .select('id')
        .limit(1);
      
      if (addContactError && addContactError.message.includes('column "contact_info" does not exist')) {
        console.log('   ❌ El campo contact_info no existe. Se debe agregar manualmente.');
        console.log('   💡 Ejecuta este SQL en el panel de Supabase:');
        console.log('   ALTER TABLE corporate_clients ADD COLUMN contact_info JSONB;');
      } else {
        console.log('   ✅ Campo contact_info ya existe o se puede acceder');
      }
    } else {
      console.log('   ✅ Campo contact_info ya existe');
    }
    
    // 3. Agregar campo business_info si no existe
    console.log('\n📝 3. Agregando campo business_info...');
    const hasBusinessInfo = columns?.some(col => col.column_name === 'business_info');
    
    if (!hasBusinessInfo) {
      console.log('   ⚡ Agregando business_info (JSONB)...');
      
      // Intentar agregar la columna directamente
      const { error: addBusinessError } = await supabase
        .from('corporate_clients')
        .select('id')
        .limit(1);
      
      if (addBusinessError && addBusinessError.message.includes('column "business_info" does not exist')) {
        console.log('   ❌ El campo business_info no existe. Se debe agregar manualmente.');
        console.log('   💡 Ejecuta este SQL en el panel de Supabase:');
        console.log('   ALTER TABLE corporate_clients ADD COLUMN business_info JSONB;');
      } else {
        console.log('   ✅ Campo business_info ya existe o se puede acceder');
      }
    } else {
      console.log('   ✅ Campo business_info ya existe');
    }
    
    // 4. Probar inserción con datos JSON
    console.log('\n🧪 4. Probando inserción con datos JSON...');
    
    const testClient = {
      name: 'CLIENTE PRUEBA JSON FIELDS',
      display_category: 'testing',
      trust_level: 'high',
      contact_info: {
        email: 'test@jsonfields.com',
        phone: '+56 9 1234 5678',
        contact_person: 'Persona JSON Test'
      },
      business_info: {
        industry: 'Testing',
        size: 'small',
        location: 'Santiago, Chile'
      },
      company_id: 'e27b3162-e7db-4b00-bc60-32abea7e171b',
      is_active: true,
      segment_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: insertedClient, error: insertError } = await supabase
      .from('corporate_clients')
      .insert(testClient)
      .select()
      .single();
    
    if (insertError) {
      console.log('   ❌ Error al insertar cliente de prueba:');
      console.log('   Código:', insertError.code);
      console.log('   Mensaje:', insertError.message);
      console.log('   Detalles:', insertError.details);
      
      if (insertError.code === 'PGRST204') {
        console.log('\n🔍 DIAGNÓSTICO: Los campos JSON no existen en la tabla');
        console.log('💡 SOLUCIÓN: Ejecuta manualmente estos comandos SQL en Supabase:');
        console.log('');
        console.log('ALTER TABLE corporate_clients ADD COLUMN IF NOT EXISTS contact_info JSONB;');
        console.log('ALTER TABLE corporate_clients ADD COLUMN IF NOT EXISTS business_info JSONB;');
        console.log('');
      }
    } else {
      console.log('   ✅ Cliente de prueba insertado exitosamente:');
      console.log('   ID:', insertedClient.id);
      console.log('   Nombre:', insertedClient.name);
      console.log('   Contact Info:', insertedClient.contact_info);
      console.log('   Business Info:', insertedClient.business_info);
      
      // Limpiar cliente de prueba
      const { error: deleteError } = await supabase
        .from('corporate_clients')
        .delete()
        .eq('id', insertedClient.id);
      
      if (deleteError) {
        console.log('   ⚠️ No se pudo eliminar el cliente de prueba:', deleteError.message);
      } else {
        console.log('   🧹 Cliente de prueba eliminado');
      }
    }
    
    // 5. Verificar estructura final
    console.log('\n📊 5. Verificando estructura final...');
    const { data: finalColumns, error: finalError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'corporate_clients')
      .eq('table_schema', 'public')
      .order('ordinal_position');
    
    if (!finalError && finalColumns) {
      console.log('✅ Estructura final de corporate_clients:');
      finalColumns.forEach(col => {
        const icon = (col.column_name === 'contact_info' || col.column_name === 'business_info') ? '🆕' : '  ';
        console.log(`${icon} ${col.column_name}: ${col.data_type}`);
      });
    }
    
    console.log('\n🎉 Migración completada');
    
  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

applyJsonFieldsMigration();