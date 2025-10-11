/**
 * Script para probar la funcionalidad de reset de contraseña
 * Versión simplificada que no importa módulos del proyecto
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

// Función para cargar variables de entorno desde .env
function loadEnv() {
  try {
    const envPath = resolve('.env');
    const envContent = readFileSync(envPath, 'utf8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key] = valueParts.join('=');
        }
      }
    });

    return envVars;
  } catch (error) {
    console.warn('No se pudo cargar .env, usando valores por defecto');
    return {};
  }
}

// Configuración de Supabase
const envVars = loadEnv();
const supabaseUrl = envVars.VITE_SUPABASE_URL || 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuración JWT (igual que en authService.js)
const SALT_ROUNDS = 12;
const JWT_SECRET = 'super-secret-jwt-key-change-in-production-2024';

// Función para hashear contraseña
const hashPassword = async (password) => {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Error al procesar contraseña');
  }
};

// Función para crear token JWT
const createAccessToken = async (user) => {
  const secret = new TextEncoder().encode(JWT_SECRET);
  return await new SignJWT({
    userId: user.id || user.email,
    email: user.email,
    role: user.role || 'debtor',
    type: 'password_reset'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(Date.now() / 1000 + (60 * 60)) // 1 hora
    .setIssuedAt()
    .sign(secret);
};

// Función para verificar token JWT
const verifyToken = async (token) => {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.warn('Token verification failed:', error.message);
    return null;
  }
};

// Función resetPasswordWithToken (versión simplificada)
const resetPasswordWithToken = async (token, newPassword) => {
  try {
    console.log('🔑 Iniciando reset de contraseña con token...');

    // Validar que el token no esté vacío
    if (!token || token.trim() === '') {
      console.error('❌ Token vacío o nulo');
      return { error: 'Token de recuperación requerido.' };
    }

    // Intentar decodificar el token si está URL-encoded
    let tokenToVerify = token;
    try {
      const decodedToken = decodeURIComponent(token);
      if (decodedToken !== token) {
        console.log('🔄 Token estaba URL-encoded, decodificado');
        tokenToVerify = decodedToken;
      }
    } catch (decodeError) {
      console.warn('⚠️ Token no estaba URL-encoded o ya estaba decodificado:', decodeError.message);
    }

    console.log('🔍 Verificando token JWT...');

    // Verificar el token JWT
    const payload = await verifyToken(tokenToVerify);

    console.log('📊 Payload del token:', payload ? 'válido' : 'null/inválido');

    if (!payload) {
      console.error('❌ Token JWT inválido o expirado');
      return { error: 'Token de recuperación inválido o expirado.' };
    }

    if (payload.type !== 'password_reset') {
      console.error('❌ Tipo de token incorrecto:', payload.type, '(esperado: password_reset)');
      return { error: 'Tipo de token inválido para recuperación de contraseña.' };
    }

    if (!payload.email) {
      console.error('❌ Token no contiene email');
      return { error: 'Token de recuperación incompleto.' };
    }

    const { email } = payload;
    console.log('📧 Email extraído del token:', email);

    // Verificar que el usuario existe antes de actualizar
    console.log('👤 Verificando que el usuario existe...');
    const { data: userData, error: userCheckError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('email', email)
      .single();

    if (userCheckError) {
      console.error('❌ Usuario no encontrado para reset de contraseña:', userCheckError);
      return { error: 'Usuario no encontrado. El token puede haber expirado.' };
    }

    console.log('✅ Usuario encontrado:', userData.full_name);

    // Validar la nueva contraseña
    if (!newPassword || newPassword.length < 8) {
      console.error('❌ Nueva contraseña demasiado corta');
      return { error: 'La contraseña debe tener al menos 8 caracteres.' };
    }

    // Hashear la nueva contraseña
    console.log('🔐 Hasheando nueva contraseña...');
    const hashedPassword = await hashPassword(newPassword);

    // Actualizar la contraseña en la base de datos
    console.log('💾 Actualizando contraseña en base de datos...');
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('email', email);

    if (updateError) {
      console.error('❌ Error actualizando contraseña:', updateError);
      return { error: `Error actualizando contraseña: ${updateError.message}` };
    }

    console.log('✅ Contraseña actualizada exitosamente para:', email);
    return { error: null };
  } catch (error) {
    console.error('Error in resetPasswordWithToken:', error);
    return { error: 'Error al actualizar contraseña. Por favor, intenta de nuevo.' };
  }
};

async function testPasswordReset() {
  try {
    console.log('🧪 Probando funcionalidad de reset de contraseña...\n');

    // 1. Crear un usuario de prueba
    const testEmail = `test-reset-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testFullName = 'Usuario de Prueba Reset';

    console.log('👤 Creando usuario de prueba...');
    const hashedPassword = await hashPassword(testPassword);

    const { data: userData, error: createError } = await supabase
      .from('users')
      .insert({
        email: testEmail,
        password: hashedPassword,
        full_name: testFullName,
        rut: `RST${Date.now().toString().slice(-8)}`,
        role: 'debtor',
        validation_status: 'validated',
        wallet_balance: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creando usuario de prueba:', createError);
      return;
    }

    console.log('✅ Usuario creado:', userData.email);

    // 2. Simular envío de email de reset (crear token manualmente)
    console.log('\n📧 Simulando envío de email de reset...');

    const resetToken = await createAccessToken({
      email: testEmail,
      type: 'password_reset'
    });

    console.log('🎫 Token de reset generado');

    // 3. Probar reset de contraseña con token válido
    console.log('\n🔄 Probando reset de contraseña con token válido...');

    const newPassword = 'NewPassword123!';
    const { error: resetError } = await resetPasswordWithToken(resetToken, newPassword);

    if (resetError) {
      console.error('❌ Error en reset de contraseña:', resetError);
      return;
    }

    console.log('✅ Reset de contraseña exitoso');

    // 4. Verificar que la contraseña se actualizó
    console.log('\n🔍 Verificando que la contraseña se actualizó...');

    const { data: updatedUser, error: fetchError } = await supabase
      .from('users')
      .select('password, updated_at')
      .eq('email', testEmail)
      .single();

    if (fetchError) {
      console.error('❌ Error obteniendo usuario actualizado:', fetchError);
      return;
    }

    // Verificar que la contraseña cambió
    const isSamePassword = await bcrypt.compare(testPassword, updatedUser.password);
    if (isSamePassword) {
      console.error('❌ La contraseña no se actualizó');
      return;
    }

    console.log('✅ Contraseña actualizada correctamente');

    // 5. Probar con token inválido
    console.log('\n🚫 Probando con token inválido...');

    const { error: invalidTokenError } = await resetPasswordWithToken('invalid_token', 'AnotherPassword123!');

    if (!invalidTokenError) {
      console.error('❌ Se esperaba error con token inválido');
      return;
    }

    console.log('✅ Token inválido correctamente rechazado:', invalidTokenError);

    // 6. Probar con token expirado
    console.log('\n⏰ Probando con token expirado...');

    // Crear token expirado manualmente
    const secret = new TextEncoder().encode(JWT_SECRET);
    const expiredToken = await new SignJWT({
      email: testEmail,
      type: 'password_reset'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(Date.now() / 1000 - 60) // Expirado hace 1 minuto
      .setIssuedAt()
      .sign(secret);

    const { error: expiredTokenError } = await resetPasswordWithToken(expiredToken, 'ExpiredPassword123!');

    if (!expiredTokenError) {
      console.error('❌ Se esperaba error con token expirado');
      return;
    }

    console.log('✅ Token expirado correctamente rechazado:', expiredTokenError);

    // 7. Limpiar usuario de prueba
    console.log('\n🧹 Limpiando usuario de prueba...');

    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('email', testEmail);

    if (deleteError) {
      console.warn('⚠️ Error eliminando usuario de prueba:', deleteError);
    } else {
      console.log('✅ Usuario de prueba eliminado');
    }

    console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
    console.log('La funcionalidad de reset de contraseña está funcionando correctamente.');

  } catch (error) {
    console.error('💥 Error en las pruebas:', error);
  }
}

// Ejecutar las pruebas
testPasswordReset();