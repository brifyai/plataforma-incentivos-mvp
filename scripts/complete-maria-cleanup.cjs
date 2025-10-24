const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function completeMariaCleanup() {
  console.log('🧹 Completando limpieza de datos de María Concha...\n');

  try {
    // Buscar y eliminar el usuario María Concha
    console.log('📋 Buscando usuario María Concha...');
    const { data: users, error: searchError } = await supabase
      .from('users')
      .select('*')
      .ilike('full_name', '%maría concha%');

    if (searchError) {
      console.error('❌ Error buscando usuario:', searchError);
      return;
    }

    if (users.length === 0) {
      console.log('✅ No se encontró usuario María Concha');
      return;
    }

    console.log(`📍 Se encontró ${users.length} usuario(s) de María Concha`);
    
    for (const user of users) {
      console.log(`🗑️ Eliminando usuario: ${user.full_name} (${user.email}) - ID: ${user.id}`);
      
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (deleteError) {
        console.error(`❌ Error eliminando usuario ${user.id}:`, deleteError);
      } else {
        console.log(`✅ Usuario ${user.full_name} eliminado correctamente`);
      }
    }

    // Verificación final
    console.log('\n🔍 Verificación final...');
    const { data: remainingUsers, error: verifyError } = await supabase
      .from('users')
      .select('*')
      .ilike('full_name', '%maría concha%');

    if (verifyError) {
      console.error('❌ Error en verificación:', verifyError);
    } else if (remainingUsers.length > 0) {
      console.log('❌ Aún quedan usuarios:', remainingUsers);
    } else {
      console.log('✅ ¡Todos los datos de María Concha han sido eliminados!');
    }

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  }
}

completeMariaCleanup();