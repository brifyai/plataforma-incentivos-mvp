const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCompanyProfile() {
  try {
    console.log('🔍 Iniciando diagnóstico de perfil de empresa...');

    // 1. Obtener el usuario empresa@nexupay.cl
    console.log('\n📋 Paso 1: Buscando usuario empresa@nexupay.cl...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'empresa@nexupay.cl')
      .single();

    if (userError) {
      console.error('❌ Error obteniendo usuario:', userError);
      return;
    }

    console.log('✅ Usuario encontrado:', {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    });

    // 2. Verificar empresas asociadas al usuario
    console.log('\n📋 Paso 2: Buscando empresas asociadas al usuario...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id);

    if (companiesError) {
      console.error('❌ Error obteniendo empresas:', companiesError);
      return;
    }

    console.log(`✅ Encontradas ${companies.length} empresas:`);
    companies.forEach((company, index) => {
      console.log(`  ${index + 1}. ${company.business_name} (ID: ${company.id})`);
      console.log(`     - Contact Email: ${company.contact_email}`);
      console.log(`     - Validation Status: ${company.validation_status}`);
      console.log(`     - User ID: ${company.user_id}`);
      console.log(`     - Created: ${company.created_at}`);
    });

    // 3. Probar la función getCompanyProfile exactamente como está en el código
    console.log('\n📋 Paso 3: Probando getCompanyProfile...');
    const { data: companyProfile, error: profileError } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(); // Exactamente como está en databaseService.js

    if (profileError) {
      console.error('❌ Error en getCompanyProfile:', profileError);
    } else {
      console.log('✅ getCompanyProfile result:', companyProfile ? 'ENCONTRADO' : 'NULL');
      if (companyProfile) {
        console.log('📋 Empresa encontrada:', {
          id: companyProfile.id,
          business_name: companyProfile.business_name,
          contact_email: companyProfile.contact_email,
          validation_status: companyProfile.validation_status
        });
      } else {
        console.log('❌ getCompanyProfile devolvió NULL');
      }
    }

    // 4. Verificar si hay problemas con la tabla debts
    console.log('\n📋 Paso 4: Verificando estructura de tabla debts...');
    
    // Intentar obtener una deuda para ver si la tabla existe
    const { data: sampleDebt, error: debtError } = await supabase
      .from('debts')
      .select('*')
      .limit(1);

    if (debtError) {
      console.error('❌ Error accediendo a tabla debts:', debtError);
    } else {
      console.log('✅ Tabla debts accesible');
      if (sampleDebt && sampleDebt.length > 0) {
        console.log('📋 Estructura de deuda de ejemplo:', Object.keys(sampleDebt[0]));
        console.log('📋 Tiene client_id:', 'client_id' in sampleDebt[0] ? 'SÍ' : 'NO');
      }
    }

    // 5. Verificar si hay problemas con RLS policies
    console.log('\n📋 Paso 5: Verificando permisos RLS...');
    
    // Intentar contar empresas sin filtros
    const { count: totalCompanies, error: countError } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error contando empresas:', countError);
    } else {
      console.log(`✅ Total de empresas en sistema: ${totalCompanies}`);
    }

    // 6. Recomendaciones
    console.log('\n📋 Paso 6: Análisis y recomendaciones...');
    
    if (!companyProfile && companies.length > 0) {
      console.log('❌ PROBLEMA IDENTIFICADO:');
      console.log('   - getCompanyProfile devuelve NULL pero existen empresas');
      console.log('   - Esto puede deberse a:');
      console.log('     1. Políticas RLS que bloquean la consulta');
      console.log('     2. Problemas con .maybeSingle()');
      console.log('     3. Inconsistencia en los datos');
      
      console.log('\n🔧 SOLUCIÓN PROPUESTA:');
      console.log('   - Modificar getCompanyProfile para usar .single() con manejo de errores');
      console.log('   - O verificar las políticas RLS de la tabla companies');
    } else if (companyProfile) {
      console.log('✅ getCompanyProfile funciona correctamente');
    } else {
      console.log('❌ No hay empresas asociadas al usuario');
    }

  } catch (error) {
    console.error('💥 Error en diagnóstico:', error);
  }
}

// Ejecutar diagnóstico
debugCompanyProfile();