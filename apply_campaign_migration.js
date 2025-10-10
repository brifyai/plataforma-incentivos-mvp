#!/usr/bin/env node

/**
 * Script para aplicar las migraciones de campañas y seguridad
 * Ejecutar con: node apply_campaign_migration.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyCampaignMigration() {
  try {
    // Leer variables de entorno
    const envPath = path.join(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = envContent.split('\n').reduce((acc, line) => {
      const [key, value] = line.split('=');
      if (key && value) acc[key.trim()] = value.trim();
      return acc;
    }, {});

    const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

    console.log('🚀 Aplicando migraciones de campañas y seguridad...\n');

    // Leer archivos de migración
    const campaignMigration1 = fs.readFileSync(path.join(__dirname, 'supabase-migrations', '009_unified_campaign_system.sql'), 'utf8');
    const campaignMigration2 = fs.readFileSync(path.join(__dirname, 'supabase-migrations', '010_unified_campaign_system.sql'), 'utf8');
    const securityMigration = fs.readFileSync(path.join(__dirname, 'supabase-migrations', '011_security_and_privacy.sql'), 'utf8');

    // Combinar todas las migraciones
    const fullMigrationSQL = `
-- =============================================
-- MIGRACIÓN COMPLETA: CAMPAÑAS Y SEGURIDAD
-- =============================================

${campaignMigration1}

${campaignMigration2}

${securityMigration}

-- =============================================
-- VERIFICACIÓN FINAL
-- =============================================

SELECT
    '✅ MIGRACIÓN DE CAMPAÑAS COMPLETA' as status,
    NOW() as completed_at,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%campaign%') as campaign_tables,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%secure%') as security_tables,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%ai%') as ai_tables;
`;

    // Ejecutar la migración completa
    console.log('📄 Ejecutando migración completa...');

    // Dividir en statements individuales y ejecutar uno por uno
    const statements = fullMigrationSQL.split(';').filter(stmt => stmt.trim().length > 0);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement) continue;

      try {
        // Usar una consulta directa en lugar de RPC
        const { error } = await supabase.from('_supabase_migration_temp').select('*').limit(1);

        // Para ejecutar SQL directamente, necesitamos usar el SQL Editor de Supabase
        // Por ahora, vamos a intentar una aproximación diferente
        console.log(`⚠️ Statement ${i + 1}: No se puede ejecutar automáticamente via API`);

      } catch (err) {
        // Ignorar errores de tabla temporal
      }
    }

    console.log('\n📋 INSTRUCCIONES PARA COMPLETAR LA MIGRACIÓN:');
    console.log('================================================');
    console.log('1. Ve al SQL Editor de Supabase: https://app.supabase.com/project/[tu-project]/sql');
    console.log('2. Copia y pega el contenido del archivo: supabase-migrations/009_unified_campaign_system.sql');
    console.log('3. Ejecuta la consulta');
    console.log('4. Repite con: supabase-migrations/010_unified_campaign_system.sql');
    console.log('5. Y finalmente: supabase-migrations/011_security_and_privacy.sql');
    console.log('');
    console.log('O usa el archivo completo: complete_campaign_migration.sql');

    // Crear archivo de migración completa
    const completeMigrationPath = path.join(__dirname, 'complete_campaign_migration.sql');
    fs.writeFileSync(completeMigrationPath, fullMigrationSQL);
    console.log(`\n📄 Archivo completo creado: ${completeMigrationPath}`);
    console.log('🚀 Sube este archivo al SQL Editor de Supabase y ejecuta la consulta.');

    // Verificar tablas existentes
    console.log('\n🔍 Verificando tablas existentes...');
    const tablesToCheck = [
      'unified_campaigns',
      'corporate_clients',
      'corporate_segments',
      'secure_messages',
      'ai_usage_logs',
      'audit_logs',
      'security_events'
    ];

    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase.from(tableName).select('*').limit(1);
        if (error && error.code === '42P01') {
          console.log(`❌ ${tableName}: NO EXISTE`);
        } else if (error) {
          console.log(`⚠️ ${tableName}: Error - ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: EXISTE`);
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ERROR - ${err.message}`);
      }
    }

    console.log('\n🎯 PRÓXIMOS PASOS:');
    console.log('1. Ejecuta las migraciones en Supabase SQL Editor');
    console.log('2. Verifica que todas las tablas se crearon correctamente');
    console.log('3. Reinicia la aplicación si es necesario');
    console.log('4. Prueba la funcionalidad de campañas');

  } catch (err) {
    console.error('❌ Error general:', err);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  applyCampaignMigration();
}

export { applyCampaignMigration };