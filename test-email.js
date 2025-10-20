/**
 * Script de prueba para envío de emails
 * Ejecutar con: node test-email.js
 */

import { sendConfirmationEmail, sendPasswordResetEmail } from './src/services/emailService.js';

async function testEmails() {
  console.log('🧪 Probando envío de emails...\n');

  try {
    // Probar email de confirmación para deudor
    console.log('📧 Enviando email de confirmación para deudor...');
    const confirmationResult = await sendConfirmationEmail(
      'test@example.com',
      'Juan Pérez',
      'test-confirmation-token',
      'debtor'
    );

    if (confirmationResult.success) {
      console.log('✅ Email de confirmación enviado exitosamente');
      console.log('   ID del mensaje:', confirmationResult.messageId);
    } else {
      console.log('❌ Error enviando email de confirmación:', confirmationResult.error);
    }

    console.log('');

    // Probar email de confirmación para empresa
    console.log('📧 Enviando email de confirmación para empresa...');
    const companyConfirmationResult = await sendConfirmationEmail(
      'empresa@example.com',
      'María González',
      'test-company-confirmation-token',
      'company'
    );

    if (companyConfirmationResult.success) {
      console.log('✅ Email de confirmación para empresa enviado exitosamente');
      console.log('   ID del mensaje:', companyConfirmationResult.messageId);
    } else {
      console.log('❌ Error enviando email de confirmación para empresa:', companyConfirmationResult.error);
    }

    console.log('');

    // Probar email de confirmación para administrador
    console.log('📧 Enviando email de confirmación para administrador...');
    const adminConfirmationResult = await sendConfirmationEmail(
      'admin@example.com',
      'Administrador del Sistema',
      'test-admin-confirmation-token',
      'god_mode'
    );

    if (adminConfirmationResult.success) {
      console.log('✅ Email de confirmación para administrador enviado exitosamente');
      console.log('   ID del mensaje:', adminConfirmationResult.messageId);
    } else {
      console.log('❌ Error enviando email de confirmación para administrador:', adminConfirmationResult.error);
    }

    console.log('');

    // Probar email de recuperación de contraseña
    console.log('📧 Enviando email de recuperación de contraseña...');
    const resetResult = await sendPasswordResetEmail(
      'test@example.com',
      'Juan Pérez',
      'test-reset-token'
    );

    if (resetResult.success) {
      console.log('✅ Email de recuperación de contraseña enviado exitosamente');
      console.log('   ID del mensaje:', resetResult.messageId);
    } else {
      console.log('❌ Error enviando email de recuperación de contraseña:', resetResult.error);
    }

    console.log('\n🎉 Pruebas completadas!');

  } catch (error) {
    console.error('💥 Error durante las pruebas:', error);
  }
}

// Ejecutar pruebas
testEmails();