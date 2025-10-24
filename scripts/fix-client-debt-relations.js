/**
 * Script para aplicar la migración de relaciones cliente-deuda
 * y verificar que todo funcione correctamente
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA0MTk1MTksImV4cCI6MjA0NTk5NTUxOX0.8yK5A2nS2hQ8Xz3L3RJH6NqYJ5K5J5J5J5J5J5J5J5J';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🔧 Aplicando migración 041_fix_client_debt_relations.sql...');
  
  try {
    // Leer el archivo de migración
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, '../supabase-migrations/041_fix_client_debt_relations.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Archivo de migración leído correctamente');
    
    // Para Supabase, necesitamos ejecutar esto a través de RPC o SQL directo
    // Como no tenemos acceso directo a SQL, vamos a verificar el estado actual
    
    console.log('🔍 Verificando estado actual de las tablas...');
    
    // Verificar si existe la columna client_id en debts
    const { data: columnCheck, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, table_name')
      .eq('table_name', 'debts')
      .eq('column_name', 'client_id')
      .eq('table_schema', 'public');
    
    if (columnError) {
      console.error('❌ Error verificando columna client_id:', columnError);
      return false;
    }
    
    console.log('📊 Verificación de columna client_id:', columnCheck?.length || 0, 'filas encontradas');
    
    // Verificar si existe la columna corporate_client_id en clients
    const { data: corporateColumnCheck, error: corporateColumnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, table_name')
      .eq('table_name', 'clients')
      .eq('column_name', 'corporate_client_id')
      .eq('table_schema', 'public');
    
    if (corporateColumnError) {
      console.error('❌ Error verificando columna corporate_client_id:', corporateColumnError);
      return false;
    }
    
    console.log('📊 Verificación de columna corporate_client_id:', corporateColumnCheck?.length || 0, 'filas encontradas');
    
    // Verificar estructura de tablas
    console.log('🏗️ Verificando estructura de tablas...');
    
    // Verificar tabla debts
    const { data: debtsStructure, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .limit(1);
    
    if (debtsError) {
      console.error('❌ Error accediendo a tabla debts:', debtsError);
    } else {
      console.log('✅ Tabla debts accesible, columnas:', Object.keys(debtsStructure[0] || {}));
    }
    
    // Verificar tabla clients
    const { data: clientsStructure, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);
    
    if (clientsError) {
      console.error('❌ Error accediendo a tabla clients:', clientsError);
    } else {
      console.log('✅ Tabla clients accesible, columnas:', Object.keys(clientsStructure[0] || {}));
    }
    
    // Verificar tabla corporate_clients
    const { data: corporateStructure, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*')
      .limit(1);
    
    if (corporateError) {
      console.error('❌ Error accediendo a tabla corporate_clients:', corporateError);
    } else {
      console.log('✅ Tabla corporate_clients accesible, columnas:', Object.keys(corporateStructure[0] || {}));
    }
    
    // Si las columnas no existen, mostrar instrucciones manuales
    if ((columnCheck?.length || 0) === 0 || (corporateColumnCheck?.length || 0) === 0) {
      console.log('\n⚠️ Las columnas necesarias no existen en la base de datos.');
      console.log('📝 Se necesita aplicar la migración manualmente en el panel de Supabase:');
      console.log('\n1. Ir al panel de Supabase: https://app.supabase.com');
      console.log('2. Navegar al proyecto: wvluqdldygmgncqqjkow');
      console.log('3. Ir a SQL Editor');
      console.log('4. Ejecutar el contenido del archivo: supabase-migrations/041_fix_client_debt_relations.sql');
      console.log('\n📄 Contenido de la migración:');
      console.log('='.repeat(50));
      console.log(migrationSQL);
      console.log('='.repeat(50));
      
      return false;
    }
    
    console.log('✅ Verificación completada. Las columnas necesarias existen.');
    return true;
    
  } catch (error) {
    console.error('❌ Error aplicando migración:', error);
    return false;
  }
}

async function testClientCreation() {
  console.log('\n🧪 Probando creación de clientes corporativos...');
  
  try {
    // Obtener una empresa de prueba
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .select('id, company_name')
      .limit(1);
    
    if (companyError || !companies || companies.length === 0) {
      console.error('❌ No se encontraron empresas para probar:', companyError);
      return false;
    }
    
    const testCompany = companies[0];
    console.log('🏢 Usando empresa de prueba:', testCompany.company_name, '(ID:', testCompany.id, ')');
    
    // Primero verificar si ya existe un cliente corporativo para esta empresa
    const { data: existingCorporate, error: corporateError } = await supabase
      .from('corporate_clients')
      .select('*')
      .eq('company_id', testCompany.id)
      .maybeSingle();
    
    let corporateClientId;
    
    if (corporateError && corporateError.code !== 'PGRST116') {
      console.error('❌ Error buscando cliente corporativo:', corporateError);
      return false;
    }
    
    if (!existingCorporate) {
      // Crear un cliente corporativo de prueba
      console.log('🏗️ Creando cliente corporativo de prueba...');
      const { data: newCorporate, error: createCorporateError } = await supabase
        .from('corporate_clients')
        .insert({
          company_id: testCompany.id,
          contact_email: 'test@corporate.com',
          contact_phone: '+56912345678',
          rut: '99.999.999-9',
          industry: 'Corporativo',
          is_active: true
        })
        .select()
        .single();
      
      if (createCorporateError) {
        console.error('❌ Error creando cliente corporativo:', createCorporateError);
        return false;
      }
      
      corporateClientId = newCorporate.id;
      console.log('✅ Cliente corporativo creado:', corporateClientId);
    } else {
      corporateClientId = existingCorporate.id;
      console.log('✅ Usando cliente corporativo existente:', corporateClientId);
    }
    
    // Ahora probar crear un cliente individual
    console.log('👤 Creando cliente individual de prueba...');
    const { data: newClient, error: createClientError } = await supabase
      .from('clients')
      .insert({
        company_id: testCompany.id,
        business_name: 'Cliente Individual Test',
        contact_email: 'test@individual.com',
        contact_phone: '+56987654321',
        rut: '11.111.111-1',
        corporate_client_id: corporateClientId
      })
      .select()
      .single();
    
    if (createClientError) {
      console.error('❌ Error creando cliente individual:', createClientError);
      return false;
    }
    
    console.log('✅ Cliente individual creado:', newClient.id);
    
    // Ahora probar crear una deuda asociada al cliente
    console.log('💰 Creando deuda de prueba asociada al cliente...');
    const { data: newDebt, error: createDebtError } = await supabase
      .from('debts')
      .insert({
        company_id: testCompany.id,
        user_id: null, // Deuda sin usuario específico para prueba
        client_id: newClient.id,
        original_amount: 100000,
        current_amount: 100000,
        description: 'Deuda de prueba para cliente corporativo',
        status: 'pending',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();
    
    if (createDebtError) {
      console.error('❌ Error creando deuda:', createDebtError);
      return false;
    }
    
    console.log('✅ Deuda creada:', newDebt.id);
    
    // Ahora probar la consulta que estaba fallando
    console.log('🔍 Probando consulta getCompanyDebts con client_id...');
    const { data: companyDebts, error: debtsError } = await supabase
      .from('debts')
      .select(`
        *,
        user:users(id, full_name, email, rut),
        client:clients(id, business_name, contact_email, rut, contact_phone)
      `)
      .eq('company_id', testCompany.id)
      .eq('client_id', newClient.id);
    
    if (debtsError) {
      console.error('❌ Error en consulta getCompanyDebts:', debtsError);
      return false;
    }
    
    console.log('✅ Consulta getCompanyDebts exitosa:', companyDebts.length, 'deudas encontradas');
    
    // Limpiar datos de prueba
    console.log('🧹 Limpiando datos de prueba...');
    
    // Eliminar deuda
    await supabase.from('debts').delete().eq('id', newDebt.id);
    
    // Eliminar cliente individual
    await supabase.from('clients').delete().eq('id', newClient.id);
    
    // No eliminamos el cliente corporativo para reutilizarlo en futuras pruebas
    
    console.log('✅ Prueba completada exitosamente');
    return true;
    
  } catch (error) {
    console.error('❌ Error en prueba de creación:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando script de corrección de relaciones cliente-deuda');
  console.log('='.repeat(60));
  
  // Paso 1: Aplicar migración
  const migrationApplied = await applyMigration();
  
  if (!migrationApplied) {
    console.log('\n⚠️ La migración necesita ser aplicada manualmente.');
    console.log('Por favor, siga las instrucciones mostradas arriba.');
    process.exit(1);
  }
  
  // Paso 2: Probar funcionalidad
  console.log('\n📋 La migración está aplicada. Probando funcionalidad...');
  const testPassed = await testClientCreation();
  
  if (!testPassed) {
    console.log('\n❌ La prueba de funcionalidad falló.');
    console.log('Revise los errores mostrados arriba y corrija el problema.');
    process.exit(1);
  }
  
  console.log('\n🎉 ¡Éxito! Las relaciones cliente-deuda están funcionando correctamente.');
  console.log('✅ Los clientes corporativos ahora deberían guardarse sin problemas.');
}

// Ejecutar el script
main().catch(error => {
  console.error('💥 Error fatal en el script:', error);
  process.exit(1);
});