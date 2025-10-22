const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuarios con email: empresa@nexupay.cl');
    
    // Verificar en tabla users
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'empresa@nexupay.cl');
    
    if (error) {
      console.error('❌ Error consultando users:', error);
      return;
    }
    
    console.log('📋 Usuarios encontrados:');
    if (users && users.length > 0) {
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user.id}`);
        console.log(`     Email: ${user.email}`);
        console.log(`     Nombre: ${user.full_name}`);
        console.log(`     Rol: ${user.role}`);
        console.log(`     Estado: ${user.validation_status}`);
        console.log(`     Creado: ${user.created_at}`);
        console.log('     ---');
      });
    } else {
      console.log('  ❌ No se encontraron usuarios con ese email');
    }
    
    // Verificar en tabla companies
    const { data: companies, error: compError } = await supabase
      .from('companies')
      .select('*')
      .eq('contact_email', 'empresa@nexupay.cl');
    
    if (compError) {
      console.error('❌ Error consultando companies:', compError);
      return;
    }
    
    console.log('\n🏢 Empresas encontradas:');
    if (companies && companies.length > 0) {
      companies.forEach((company, index) => {
        console.log(`  ${index + 1}. ID: ${company.id}`);
        console.log(`     User ID: ${company.user_id}`);
        console.log(`     Email: ${company.contact_email}`);
        console.log(`     Nombre: ${company.business_name || company.company_name}`);
        console.log(`     RUT: ${company.rut}`);
        console.log(`     Estado: ${company.validation_status}`);
        console.log(`     Creada: ${company.created_at}`);
        console.log('     ---');
        
        // Verificar el usuario asociado
        if (company.user_id) {
          console.log(`     🔍 Verificando usuario asociado: ${company.user_id}`);
          checkUserById(company.user_id);
        }
      });
    } else {
      console.log('  ❌ No se encontraron empresas con ese email');
    }
    
    // Verificar si hay sesiones activas en localStorage (simulado)
    console.log('\n🔐 Recomendación:');
    if (users && users.length > 0) {
      console.log('  ✅ Existen usuarios en la base de datos');
      console.log('  💡 Si no puedes iniciar sesión, probablemente hay una sesión corrupta en localStorage');
      console.log('  💡 Intenta limpiar el localStorage del navegador o usa una ventana de incógnito');
    } else {
      console.log('  ❌ No existen usuarios con ese email en la base de datos');
      console.log('  💡 Necesitas crear un nuevo usuario o recuperar el eliminado');
    }
    
  } catch (err) {
    console.error('💥 Error general:', err);
  }
}

async function checkUserById(userId) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.error(`     ❌ Error consultando usuario ${userId}:`, error);
      return;
    }
    
    if (user) {
      console.log(`     ✅ Usuario encontrado:`);
      console.log(`        ID: ${user.id}`);
      console.log(`        Email: ${user.email}`);
      console.log(`        Nombre: ${user.full_name}`);
      console.log(`        Rol: ${user.role}`);
      console.log(`        Estado: ${user.validation_status}`);
    } else {
      console.log(`     ❌ Usuario ${userId} NO EXISTE en la tabla users`);
      console.log(`     💡 Esta es una empresa huérfana sin usuario asociado`);
    }
  } catch (err) {
    console.error(`     💥 Error verificando usuario ${userId}:`, err);
  }
}

checkUsers();