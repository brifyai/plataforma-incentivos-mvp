const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verificarTablasVerifications() {
  try {
    console.log('🔍 Verificando tablas de verificación...');
    
    // 1. Buscar en company_verifications
    console.log('\n📋 Buscando en tabla company_verifications...');
    const { data: companyVerifications, error: companyVerError } = await supabase
      .from('company_verifications')
      .select('*')
      .maybeSingle();
    
    if (companyVerError && companyVerError.code !== 'PGRST116') {
      console.error('❌ Error buscando company_verifications:', companyVerError);
    } else if (companyVerifications) {
      console.log('✅ Datos encontrados en company_verifications:');
      console.log(JSON.stringify(companyVerifications, null, 2));
    } else {
      console.log('📋 No hay datos en company_verifications');
    }
    
    // 2. Listar todas las tablas que contienen "verification" en el nombre
    console.log('\n🔍 Buscando usuario empresa@nexupay.cl para filtrar...');
    const { data: empresaUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'empresa@nexupay.cl')
      .eq('role', 'company')
      .single();
    
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', empresaUser.id)
      .single();
    
    console.log(`🏢 Empresa ID: ${company.id}`);
    
    // 3. Buscar específicamente para esta empresa
    console.log('\n📋 Buscando verificaciones específicas para esta empresa...');
    
    const { data: specificVerifications, error: specificError } = await supabase
      .from('company_verifications')
      .select('*')
      .eq('company_id', company.id)
      .maybeSingle();
    
    if (specificError && specificError.code !== 'PGRST116') {
      console.error('❌ Error buscando verificaciones específicas:', specificError);
    } else if (specificVerifications) {
      console.log('✅ Verificación específica encontrada:');
      console.log(JSON.stringify(specificVerifications, null, 2));
      
      // Analizar el estado
      console.log('\n🔍 Análisis del estado:');
      console.log(`  Status en company_verifications: ${specificVerifications.status}`);
      console.log(`  Status en users: ${empresaUser.validation_status}`);
      console.log(`  Status en companies: ${company.validation_status}`);
      
      // Si hay inconsistencia, actualizar
      if (specificVerifications.status !== empresaUser.validation_status) {
        console.log('\n⚠️ Se detectó inconsistencia en company_verifications');
        console.log('🔄 Sincronizando company_verifications...');
        
        const newStatus = empresaUser.validation_status === 'validated' ? 'approved' : empresaUser.validation_status;
        
        const { error: updateError } = await supabase
          .from('company_verifications')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('company_id', company.id);
        
        if (updateError) {
          console.error('❌ Error actualizando company_verifications:', updateError);
        } else {
          console.log('✅ company_verifications actualizado correctamente');
        }
      }
    } else {
      console.log('📋 No hay verificaciones específicas para esta empresa');
      
      // Crear registro si no existe
      console.log('\n📝 Creando registro de verificación...');
      const newStatus = empresaUser.validation_status === 'validated' ? 'approved' : empresaUser.validation_status;
      
      const { error: createError } = await supabase
        .from('company_verifications')
        .insert({
          company_id: company.id,
          status: newStatus,
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (createError) {
        console.error('❌ Error creando company_verifications:', createError);
      } else {
        console.log('✅ company_verifications creado correctamente');
      }
    }
    
    // 4. Verificación final
    console.log('\n🔍 Verificación final...');
    
    const { data: finalCheck } = await supabase
      .from('company_verifications')
      .select('status')
      .eq('company_id', company.id)
      .maybeSingle();
    
    if (finalCheck) {
      console.log(`  Estado final en company_verifications: ${finalCheck.status}`);
      console.log(`  Estado en users: ${empresaUser.validation_status}`);
      console.log(`  Estado en companies: ${company.validation_status}`);
      
      const isConsistent = (
        (finalCheck.status === 'approved' && empresaUser.validation_status === 'validated') ||
        (finalCheck.status === empresaUser.validation_status)
      );
      
      if (isConsistent) {
        console.log('✅ Todos los estados ahora son consistentes');
      } else {
        console.log('⚠️ Aún puede haber inconsistencias');
      }
    }
    
    console.log('\n🎉 Proceso completado');
    console.log('💡 Refresca ambos paneles para ver los estados actualizados');
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
}

verificarTablasVerifications();