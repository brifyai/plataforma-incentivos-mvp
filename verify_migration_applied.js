/**
 * Script para verificar que la migración del sistema de verificación se aplicó correctamente
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verificando aplicación de migración del sistema de verificación...\n');

// Verificar que las tablas existen
console.log('📋 Consultas de verificación para ejecutar en Supabase SQL Editor:\n');

console.log('1️⃣ Verificar tablas creadas:');
console.log(`SELECT
    '✅ SISTEMA DE VERIFICACIÓN DE EMPRESAS INSTALADO' as status,
    NOW() as installed_at,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'company_verifications') as verification_table,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'verification_history') as history_table;`);

console.log('\n2️⃣ Verificar tipos enumerados:');
console.log(`SELECT
    'verification_status' as type_name,
    enumtypid IS NOT NULL as exists
FROM pg_type
WHERE typname = 'verification_status'
UNION ALL
SELECT
    'document_type' as type_name,
    enumtypid IS NOT NULL as exists
FROM pg_type
WHERE typname = 'document_type';`);

console.log('\n3️⃣ Verificar políticas RLS corregidas:');
console.log(`SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('company_verifications', 'verification_history')
ORDER BY tablename, policyname;`);

console.log('\n4️⃣ Verificar funciones creadas:');
console.log(`SELECT
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_name IN ('update_verification_status', 'assign_verification_automatically', 'trigger_auto_assign_verification')
AND routine_schema = 'public';`);

console.log('\n🎯 Resultado esperado:');
console.log('- ✅ verification_table = 1 (company_verifications existe)');
console.log('- ✅ history_table = 1 (verification_history existe)');
console.log('- ✅ Políticas RLS sin usar auth.jwt() ->> \'role\'');
console.log('- ✅ Funciones de utilidad creadas');
console.log('- ✅ Triggers configurados');

console.log('\n📍 Ejecuta estas consultas en:');
console.log('https://supabase.com/dashboard/project/wvluqdldygmgncqqjkow → SQL Editor');

console.log('\n✅ Si todo está correcto, los errores 406 estarán resueltos.');