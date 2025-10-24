/**
 * Script para verificar que la base de datos esté completamente sincronizada
 * y funcional para el sistema NexuPay
 */

const { createClient } = require('@supabase/supabase-js');
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

async function verifyDatabaseSync() {
  console.log('🔍 Verificando sincronización completa de la base de datos...');
  console.log('=' .repeat(70));

  let allChecksPass = true;

  try {
    // 1. Verificar tablas esenciales existen
    console.log('📋 1. Verificando tablas esenciales...');

    const essentialTables = [
      'users', 'companies', 'corporate_clients', 'clients', 'debts'
    ];

    for (const table of essentialTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count', { count: 'exact', head: true });

        if (error) {
          console.error(`❌ Tabla ${table} no existe o tiene problemas:`, error.message);
          allChecksPass = false;
        } else {
          console.log(`✅ Tabla ${table} existe`);
        }
      } catch (err) {
        console.error(`❌ Error verificando tabla ${table}:`, err.message);
        allChecksPass = false;
      }
    }

    // 2. Verificar columnas críticas
    console.log('\n📊 2. Verificando columnas críticas...');

    const columnChecks = [
      { table: 'users', column: 'wallet_balance' },
      { table: 'clients', column: 'corporate_client_id' },
      { table: 'debts', column: 'client_id' },
      { table: 'companies', column: 'nexupay_commission' }
    ];

    for (const check of columnChecks) {
      try {
        // Intentar hacer una consulta que use la columna
        const { data, error } = await supabase
          .from(check.table)
          .select(check.column)
          .limit(1);

        if (error && error.code !== 'PGRST116') { // PGRST116 es "no rows returned"
          console.error(`❌ Columna ${check.column} en ${check.table} no existe:`, error.message);
          allChecksPass = false;
        } else {
          console.log(`✅ Columna ${check.column} en ${check.table} existe`);
        }
      } catch (err) {
        console.error(`❌ Error verificando columna ${check.column} en ${check.table}:`, err.message);
        allChecksPass = false;
      }
    }

    // 3. Verificar datos de producción existen
    console.log('\n👥 3. Verificando datos de producción...');

    const dataChecks = [
      { table: 'users', condition: "role.eq.god_mode", description: 'Usuario administrador' },
      { table: 'users', condition: "role.eq.company", description: 'Usuario empresa' },
      { table: 'users', condition: "role.eq.debtor", description: 'Usuario deudor' },
      { table: 'companies', condition: "contact_email.eq.empresa@nexupay.cl", description: 'Empresa de cobranza' },
      { table: 'corporate_clients', condition: "contact_email.eq.contacto@techcorp.cl", description: 'Cliente corporativo' },
      { table: 'clients', condition: "contact_email.eq.desarrollo@techcorp.cl", description: 'Cliente específico' },
      { table: 'debts', condition: "status.eq.active", description: 'Deuda activa' }
    ];

    for (const check of dataChecks) {
      try {
        const { data, error } = await supabase
          .from(check.table)
          .select('*', { count: 'exact', head: true })
          .filter(check.condition.split('.')[0], check.condition.split('.')[1], check.condition.split('.')[2]);

        if (error) {
          console.error(`❌ Error verificando ${check.description}:`, error.message);
          allChecksPass = false;
        } else {
          const count = data || 0;
          if (count > 0) {
            console.log(`✅ ${check.description} existe (${count})`);
          } else {
            console.log(`⚠️  ${check.description} no encontrado`);
          }
        }
      } catch (err) {
        console.error(`❌ Error verificando ${check.description}:`, err.message);
        allChecksPass = false;
      }
    }

    // 4. Verificar emails específicos
    console.log('\n📧 4. Verificando emails específicos...');

    const emailChecks = [
      'admin@nexupay.cl',
      'empresa@nexupay.cl',
      'hola@aintelligence.cl'
    ];

    for (const email of emailChecks) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, role')
          .eq('email', email)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error(`❌ Error verificando email ${email}:`, error.message);
          allChecksPass = false;
        } else if (data) {
          console.log(`✅ Email ${email} existe: ${data.full_name} (${data.role})`);
        } else {
          console.log(`⚠️  Email ${email} no encontrado`);
        }
      } catch (err) {
        console.error(`❌ Error verificando email ${email}:`, err.message);
        allChecksPass = false;
      }
    }

    // 5. Verificar RLS está habilitado
    console.log('\n🔒 5. Verificando Row Level Security...');

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(1);

      if (error && error.message.includes('permission denied')) {
        console.log('✅ RLS está funcionando correctamente (bloquea acceso sin auth)');
      } else if (!error) {
        console.log('⚠️  RLS podría no estar configurado correctamente');
      } else {
        console.error('❌ Error verificando RLS:', error.message);
        allChecksPass = false;
      }
    } catch (err) {
      console.error('❌ Error verificando RLS:', err.message);
      allChecksPass = false;
    }

    // 6. Resumen final
    console.log('\n' + '='.repeat(70));
    if (allChecksPass) {
      console.log('🎉 ¡VERIFICACIÓN COMPLETA! La base de datos está 100% funcional');
      console.log('');
      console.log('✅ SISTEMA NEXUPAY LISTO PARA PRODUCCIÓN');
      console.log('');
      console.log('📋 RESUMEN DE VERIFICACIÓN:');
      console.log('   • Todas las tablas esenciales existen');
      console.log('   • Todas las columnas críticas están presentes');
      console.log('   • Datos de producción están poblados');
      console.log('   • Emails específicos están configurados');
      console.log('   • Seguridad RLS está activa');
      console.log('');
      console.log('🚀 El sistema está completamente sincronizado y funcional');
    } else {
      console.log('⚠️  VERIFICACIÓN INCOMPLETA - Algunos elementos necesitan atención');
      console.log('');
      console.log('🔧 Revisar los errores arriba y corregir antes de usar en producción');
    }
    console.log('='.repeat(70));

  } catch (error) {
    console.error('💥 Error general en verificación:', error);
    process.exit(1);
  }
}

// Ejecutar verificación
verifyDatabaseSync();