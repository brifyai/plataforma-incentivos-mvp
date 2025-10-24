/**
 * Script para agregar contraseñas hasheadas a los usuarios existentes
 * Necesario para que el login funcione correctamente
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Leer configuración de Supabase
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');

let supabaseUrl = '';
let supabaseKey = '';

envLines.forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1];
  }
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
    supabaseKey = line.split('=')[1];
  }
});

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addPasswordsToUsers() {
  console.log('🔐 Agregando contraseñas hasheadas a usuarios existentes...');
  console.log('=' .repeat(60));

  try {
    // Contraseña por defecto: 123456
    const defaultPassword = '123456';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    console.log('🔒 Contraseña hasheada generada');

    // Lista de emails a actualizar
    const usersToUpdate = [
      'admin@nexupay.cl',
      'empresa@nexupay.cl',
      'hola@aintelligence.cl'
    ];

    for (const email of usersToUpdate) {
      console.log(`🔄 Actualizando contraseña para: ${email}`);

      const { data, error } = await supabase
        .from('users')
        .update({
          password: hashedPassword,
          updated_at: new Date().toISOString()
        })
        .eq('email', email)
        .select();

      if (error) {
        console.error(`❌ Error actualizando ${email}:`, error);
      } else if (data && data.length > 0) {
        console.log(`✅ Contraseña actualizada para ${email}`);
      } else {
        console.log(`⚠️  Usuario ${email} no encontrado`);
      }
    }

    console.log('');
    console.log('🎉 ¡Contraseñas agregadas exitosamente!');
    console.log('');
    console.log('🔐 CREDENCIALES DE ACCESO:');
    console.log('-'.repeat(40));
    console.log('Usuario: cualquiera de los emails arriba');
    console.log('Contraseña: 123456');
    console.log('');
    console.log('✅ Ahora puedes iniciar sesión en todos los portales');

  } catch (error) {
    console.error('💥 Error agregando contraseñas:', error);
    process.exit(1);
  }
}

// Ejecutar el script
addPasswordsToUsers();