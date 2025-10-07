/**
 * Script para recrear el usuario God Mode
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createGodUser() {
  try {
    console.log('🔧 Creando usuario God Mode...');

    // ID del usuario de Supabase Auth (obtenido de los logs anteriores)
    const godUserId = '19eabe9d-66ab-46ad-af24-a48f356b81a8';

    // Crear registro en tabla users
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: godUserId,
        email: 'camiloalegriabarra@gmail.com',
        full_name: 'Camilo Alegria (God Mode)',
        rut: 'GOD123456',
        role: 'god_mode',
        validation_status: 'validated',
        created_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('❌ Error creando usuario god:', error);
      return;
    }

    console.log('✅ Usuario God Mode creado exitosamente:', data);
    console.log('🎯 Ahora puedes loguearte con camiloalegriabarra@gmail.com');

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

createGodUser();